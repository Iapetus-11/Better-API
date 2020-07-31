from aiohttp import web
import aiohttp
import asyncio
import concurrent.futures
import socket
from functools import partial
from mcstatus import MinecraftServer
from pyraklib.protocol.UNCONNECTED_PING import UNCONNECTED_PING
from pyraklib.protocol.UNCONNECTED_PONG import UNCONNECTED_PONG
from time import sleep

global ses
global loop
global offline_server

# includes all the keys which are included
offline_server = {"online": False, "name": None, "player_count": 0, "players": None, "ping": None, "version": None, "motd": None, "favicon": None}

def vanilla_pe_ping(ip, port):
    ping = UNCONNECTED_PING()
    ping.pingID = 4201
    ping.encode()
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.setblocking(0)
    try:
        s.sendto(ping.buffer, (socket.gethostbyname(ip), port))
        sleep(1)
        recv_data = s.recvfrom(2048)
    except BlockingIOError:
        return False, None, 0, None, None
    except socket.gaierror:
        return False, None, 0, None, None
    pong = UNCONNECTED_PONG()
    pong.buffer = recv_data[0]
    pong.decode()
    s_info = str(pong.serverName)[2:-2].split(";")
    return True, s_info[7], s_info[4], s_info[3], s_info[1]

def standard_je_ping(combined_server):
    try:
        status = MinecraftServer.lookup(combined_server).status()
    except Exception:
        return False, 0, None, None, None, None

    return True, status.players.online, status.latency, status.version.name, status.description, status.favicon

async def unified_mc_ping(server_str, _port=None, _ver=None):
    if ":" in server_str and _port is None:
        split = server_str.split(":")
        ip = split[0]
        try:
            port = int(split[1])
        except ValueError:
            return offline_server
    else:
        ip = server_str
        port = _port

    if port is None:
        str_port = ""
    else:
        str_port = f":{port}"

    if _ver == "je":
        # ONLY JE servers
        standard_je_ping_partial = partial(standard_je_ping, f"{ip}{str_port}")
        with concurrent.futures.ThreadPoolExecutor() as pool:
            s_je_online, s_je_player_count, s_je_latency, s_je_ver, s_je_desc, s_je_favi = await loop.run_in_executor(pool, standard_je_ping_partial)
        if s_je_online:
            ps_online = (await unified_mc_ping(ip, port, "api")).get("players")
            return {"online": True, "world": None, "player_count": s_je_player_count, "players": ps_online, "ping": s_je_latency, "version": f"Java Edition / {s_je_ver}", "description": s_je_desc, "favicon": s_je_favi}

        return offline_server
    elif _ver == "api":
        # JE & PocketMine
        resp = await ses.get(f"https://api.mcsrvstat.us/2/{ip}{str_port}")
        jj = await resp.json()
        world = jj.get("map")
        version = jj.get('version')
        if jj.get('software') is not None:
            version = jj.get('software') + " / " + version
        if jj.get("online"):
            return {"online": True, "world": "world" if world is None else world, "player_count": jj.get("players", {}).get("online", 0), "players": jj.get("players", {}).get("list"), "ping": None,
                    "version": f'{jj.get("software")} / {jj.get("version")}', "description": jj.get("motd", {}).get("raw"), "favicon": jj.get("icon")}
        return offline_server
    elif _ver == "be":
        # Vanilla MCPE / Bedrock Edition (USES RAKNET)
        vanilla_pe_ping_partial = partial(vanilla_pe_ping, ip, (19132 if port is None else port))
        with concurrent.futures.ThreadPoolExecutor() as pool:
            pe_online, pe_world, pe_p_count, pe_ver, pe_desc = await loop.run_in_executor(pool, vanilla_pe_ping_partial)
        if pe_online:
            return {"online": True, "world": pe_world,  "player_count": pe_p_count, "players": None, "ping": None, "version": f"Vanilla Bedrock Edition / {pe_ver}", "description": pe_desc, "favicon": None}
        return offline_server
    else:
        tasks = [
            loop.create_task(unified_mc_ping(ip, port, "je"), name="je"),
            loop.create_task(unified_mc_ping(ip, port, "api"), name="api"),
            loop.create_task(unified_mc_ping(ip, port, "be"), name="be")
        ]

        done = 0

        while done < 3:
            for task in tasks:
                if task.done():
                    result = task.result()

                    if result.get("online") is True:
                        if task.get_name() == "api":
                            while not tasks[0].done():
                                await asyncio.sleep(.05)
                            je_task_rez = tasks[0].result()
                            if je_task_rez.get("online") is True:
                                return je_task_rez
                        return result

                    done += 1

            await asyncio.sleep(.05)

        return offline_server

async def uniform(jj):  # makes sure all fields are the type they should be
    if jj.get('player_count') is not None:
        jj['player_count'] = int(jj['player_count'])

    if jj.get('ping') is not None:
        jj['ping'] = int(jj['ping'])

    return jj

async def handler(r):
    host = r.headers.get("host")
    try:
        port = int(r.headers.get("port"))
    except ValueError:
        port = None

    if host is None:
        return web.Response(status=400)

    if port == 0:
        port = None

    jj = await uniform(await unified_mc_ping(host, port))
    return web.json_response(jj)

web_app = web.Application()
web_app.router.add_view("/mcping", handler)

# This code is none blocking
# web_runner = web.AppRunner(web_app)
# await web_runner.setup()
# site = web.TCPSite(web_runner, "localhost", 6942)
# await site.start()

loop = asyncio.get_event_loop()
ses = aiohttp.ClientSession()
web.run_app(web_app, host="localhost", port=6942) # this is blocking
