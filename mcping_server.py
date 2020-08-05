from aiohttp import web
import asyncio
import concurrent.futures
import socket
from functools import partial
from mcstatus import MinecraftServer as mcstatus
from pyraklib.protocol.UNCONNECTED_PING import UNCONNECTED_PING
from pyraklib.protocol.UNCONNECTED_PONG import UNCONNECTED_PONG
from time import sleep
import arrow

global ses
global loop
global default

# default / offline server
default = {
    'online': False, # boolean
    'map': None, # string
    'players_online': 0, # int
    '': 0, # int
    'players': [], # List['player', 'player']
    'latency': 0, # float milliseconds
    'version': {'brand': None, 'software': None, 'protocol': None}, # dict
    'motd': None, # string
    'favicon': None, # string / dataurl
    'plugins': [], # List['plugin', 'plugin']
    'gamemode': None # string
}

async def cleanup_args(server_str, _port=None):
    if ':' in server_str and _port is None:
        split = server_str.split(':')
        ip = split[0]
        try:
            port = int(split[1])
        except ValueError:
            return default
    else:
        ip = server_str
        port = _port

    if port is None:
        str_port = ''
    else:
        str_port = f':{port}'

    return ip, port, str_port

def ping_status(combined_server):
    try:
        status = mcstatus.lookup(combined_server).status()
    except Exception:
        return default

    s_dict = default.copy()

    s_dict['online'] = True
    s_dict['players_online'] = status.players.online
    s_dict['players_max'] = status.players.max
    s_dict['players_names'] = status.players.sample
    s_dict['latency'] = status.latency
    s_dict['version'] = {
                            'brand': 'Java Edition', # string
                            'software': status.version.name, # string
                            'protocol': f'ping {status.version.protocol}' # string
                        }
    s_dict['motd'] = status.description
    s_dict['favicon'] = status.favicon

    return s_dict

def query_status(combined_server):
    time_now = arrow.utcnow()

    try:
        query = mcstatus.lookup(combined_server).query()
    except Exception:
        return default

    time_after = arrow.utcnow()
    latency = (time_after - time_before).seconds * 1000

    s_dict = default.copy()

    s_dict['online'] = True
    s_dict['players_online'] = query.players.online
    s_dict[''] = query.players.max
    s_dict['players_names'] = query.players.names
    s_dict['latency'] = latency
    s_dict['version'] = {
                            'brand': None, # string
                            'software': query.software.version, # string
                            'protocol': 'query' # string
                        }
    s_dict['motd'] = query.motd
    s_dict['map'] = query.map

    return s_dict

def raknet_status(ip, port):
    ping = UNCONNECTED_PING()
    ping.pingID = 4201
    ping.encode()

    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    #s.setblocking(0) # non blocking
    s.settimeout(2) # 2 seconds

    time_now = arrow.utcnow()
    try:
        s.sendto(ping.buffer, (socket.gethostbyname(ip), port))
        recv_data = s.recvfrom(2048)
    except BlockingIOError:
        return default
    except socket.gaierror:
        return default
    except socket.timeout:
        return default

    pong = UNCONNECTED_PONG()
    pong.buffer = recv_data[0]
    pong.decode()

    time_after = arrow.utcnow()
    latency = (time_before - time_after).seconds * 1000

    data = pong.serverName.decode('UTF-8').split(';')
    # str(pong.serverName) => https://wiki.vg/Raknet_Protocol#Unconnected_Ping
    # b'MCPE;Nether updateeeeeee!;407;1.16.1;1;20;12172066879061040769;Xenon BE 6.0;Survival;1;19132;19133;'

    s_dict = default.copy()

    s_dict['online'] = True
    s_dict['players_online'] = int(data[4])
    s_dict['players_max'] = int(data[5])
    s_dict['latency'] = latency
    s_dict['version'] = {
                            'brand': data[0], # string
                            'software': 'Vanilla Bedrock', # string, assumes server is vanilla bc pocketmine + nukkit use query
                            'protocol': f'raknet {data[2]}' # string
                        }
    s_dict['motd'] = data[1]
    s_dict['map'] = data[7]
    s_dict['gamemode'] = data[8]

    return s_dict

async def unified_mc_ping(server_str, _port=None, _ver=None):
    ip, port, str_port = await cleanup_args(server_str, _port) # cleanup input

    if _ver == 'status':

    else:
        tasks = [
            loop.create_task(unified_mc_ping(ip, port, 'je')),
            loop.create_task(unified_mc_ping(ip, port, 'api')),
            loop.create_task(unified_mc_ping(ip, port, 'be'))
        ]

        done = 0

        while done < 3:
            for task in tasks:
                if task.done():
                    result = task.result()

                    if result.get('online') is True:
                        if tasks.index(task) == 1:
                            while not tasks[0].done():
                                await asyncio.sleep(.05)
                            je_task_rez = tasks[0].result()
                            if je_task_rez.get('online') is True:
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
    host = r.headers.get('host')
    try:
        port = int(r.headers.get('port'))
    except ValueError:
        port = None

    if host is None:
        return web.Response(status=400)

    if port == 0:
        port = None

    jj = await uniform(await unified_mc_ping(host, port))
    return web.json_response(jj)

web_app = web.Application()
web_app.router.add_view('/mcping', handler)

# This code is none blocking
# web_runner = web.AppRunner(web_app)
# await web_runner.setup()
# site = web.TCPSite(web_runner, 'localhost', 6942)
# await site.start()

loop = asyncio.get_event_loop()
ses = aiohttp.ClientSession()
web.run_app(web_app, host='localhost', port=6942) # this is blocking
