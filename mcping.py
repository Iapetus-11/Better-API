from aiohttp import web
import aiohttp
import asyncio

global ses
global loop

def vanilla_pe_ping(ip, port):
    ping = UNCONNECTED_PING()
    ping.pingID = 4201
    ping.encode()
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.setblocking(0)
    try:
        s.sendto(ping.buffer, (socket.gethostbyname(ip), port))
        sleep(1.5)
        recv_data = s.recvfrom(2048)
    except BlockingIOError:
        return False, 0
    except socket.gaierror:
        return False, 0
    pong = UNCONNECTED_PONG()
    pong.buffer = recv_data[0]
    pong.decode()
    s_info = str(pong.serverName)[2:-2].split(";")
    p_count = s_info[4]
    return True, p_count

def standard_je_ping(combined_server):
    try:
        status = MinecraftServer.lookup(combined_server).status()
    except Exception:
        return False, 0, None

    return True, status.players.online, status.latency

async def unified_mc_ping(server_str, _port=None, _ver=None):
    if ":" in server_str and _port is None:
        split = server_str.split(":")
        ip = split[0]
        try:
            port = int(split[1])
        except ValueError:
            return {"online": False, "player_count": 0, "players": None, "ping": None, "version": None}
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
            s_je_online, s_je_player_count, s_je_latency = await loop.run_in_executor(pool, standard_je_ping_partial)
        if s_je_online:
            ps_online = (await unified_mc_ping(ip, port, "api")).get("players")
            return {"online": True, "player_count": s_je_player_count, "players": ps_online, "ping": s_je_latency, "version": "Java Edition"}

        return {"online": False, "player_count": 0, "players": None, "ping": None, "version": None}
    elif _ver == "api":
        # JE & PocketMine
        resp = await ses.get(f"https://api.mcsrvstat.us/2/{ip}{str_port}")
        jj = await resp.json()
        if jj.get("online"):
            return {"online": True, "player_count": jj.get("players", {}).get("online", 0), "players": jj.get("players", {}).get("list"), "ping": None,
                    "version": jj.get("software")}
        return {"online": False, "player_count": 0, "players": None, "ping": None, "version": None}
    elif _ver == "be":
        # Vanilla MCPE / Bedrock Edition (USES RAKNET)
        vanilla_pe_ping_partial = partial(vanilla_pe_ping, ip, (19132 if port is None else port))
        with concurrent.futures.ThreadPoolExecutor() as pool:
            pe_online, pe_p_count = await loop.run_in_executor(pool, vanilla_pe_ping_partial)
        if pe_online:
            return {"online": True, "player_count": pe_p_count, "players": None, "ping": None, "version": "Vanilla Bedrock Edition"}
        return {"online": False, "player_count": 0, "players": None, "ping": None, "version": None}
    else:
        tasks = [
            loop.create_task(unified_mc_ping(ip, port, "je")),
            loop.create_task(unified_mc_ping(ip, port, "api")),
            loop.create_task(unified_mc_ping(ip, port, "be"))
        ]

        done = 0

        while done < 3:
            for task in tasks:
                if task.done():
                    result = task.result()

                    if result.get("online") is True:
                        return result

                    done += 1

            await asyncio.sleep(.05)

        return {"online": False, "player_count": 0, "players": None, "ping": None, "version": None}

async def handler(r):
    host = r.headers.get("host")
    port = r.headers.get("port")

    if host is None:
        return web.Response(status=406)

    if port == -1:
        port = None

    return web.json_response(await unified_mc_ping(host, port))

web_app = web.Application()
web_app.router.add_view("/mcping", handler)

# This code is none blocking
# web_runner = web.AppRunner(web_app)
# await web_runner.setup()
# site = web.TCPSite(web_runner, "localhost", 6942)
# await site.start()
loop = asyncio.get_event_loop()
ses = aiohttp.ClientSession()
web.run_app(web_app, host="0.0.0.0", port=6942) # this is blocking
