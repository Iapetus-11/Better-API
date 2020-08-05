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

global loop
global default

# default / offline server
default = {
    'online': False, # boolean
    'map': None, # string
    'players_online': 0, # int
    'players_max': 0, # int
    'players_names': [], # List['player', 'player']
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
        'brand': 'Java Edition',
        'software': status.version.name, # string
        'protocol': f'ping {status.version.protocol}', #string
        'method': 'ping'
    }
    s_dict['motd'] = status.description
    s_dict['favicon'] = status.favicon

    return s_dict

def query_status(combined_server):
    time_before = arrow.utcnow().timestamp

    try:
        query = mcstatus.lookup(combined_server).query()
    except Exception:
        return default

    time_after = arrow.utcnow().timestamp
    latency = time_after - time_before

    s_dict = default.copy()

    s_dict['online'] = True
    s_dict['players_online'] = query.players.online
    s_dict['players_max'] = query.players.max
    s_dict['players_names'] = query.players.names
    s_dict['latency'] = latency
    s_dict['version'] = {
        'brand': None,
        'software': query.software.version, # string
        'protocol': 'query',
        'method': 'query'
    }
    s_dict['motd'] = query.motd
    s_dict['map'] = query.map
    s_dict['plugins'] = query.software.plugins

    return s_dict

def raknet_status(ip, port):
    if port is None:
        port = 19132

    ping = UNCONNECTED_PING()
    ping.pingID = 4201
    ping.encode()

    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    #s.setblocking(0) # non blocking
    s.settimeout(2) # 2 seconds

    time_before = arrow.utcnow().timestamp
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

    time_after = arrow.utcnow().timestamp
    latency = time_after - time_before

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
        'protocol': f'raknet {data[2]}',
        'method': 'raknet'
    }
    s_dict['motd'] = data[1]
    s_dict['map'] = data[7]
    s_dict['gamemode'] = data[8]

    return s_dict

async def merge_pings_query_status(result_one, result_two):
    if result_one['version']['method'] == 'query':
        queried_status = result_one
        pinged_status = result_two
    else:
        queried_status = result_two
        pinged_status = result_one

    pinged_status['map'] = queried_status['map']
    pinged_status['players_names'] = queried_status['players_names']
    pinged_status['plugins'] = queried_status['plugins']
    pinged_status['version']['protocol'] = f'{pinged_status["version"]["protocol"]} + {queried_status["version"]["protocol"]}'
    pinged_status['version']['method'] = f'ping + query'

    return pinged_status

async def cleanup_args(server_str, _port=None):
    if ':' in server_str and _port is None:
        split = server_str.split(':')
        ip = split[0]
        try:
            port = int(split[1])
        except ValueError:
            port = None
    else:
        ip = server_str
        port = _port

    if port is None:
        str_port = ''
    else:
        str_port = f':{port}'

    return ip, port, str_port

async def unified_mcping(server_str, _port=None, _ver=None):
    ip, port, str_port = await cleanup_args(server_str, _port) # cleanup input

    if _ver == 'status':
        ping_status_partial = partial(ping_status, f'{ip}{str_port}')
        with concurrent.futures.ThreadPoolExecutor() as pool:
            return await loop.run_in_executor(pool, ping_status_partial)
    elif _ver == 'query':
        query_status_partial = partial(query_status, f'{ip}{str_port}')
        with concurrent.futures.ThreadPoolExecutor() as pool:
            return await loop.run_in_executor(pool, query_status_partial)
    elif _ver == 'raknet':
        raknet_status_partial = partial(raknet_status, ip, port)
        with concurrent.futures.ThreadPoolExecutor() as pool:
            return await loop.run_in_executor(pool, raknet_status_partial)
    else:
        tasks = [
            loop.create_task(unified_mcping(ip, port, 'status')),
            loop.create_task(unified_mcping(ip, port, 'query')),
            loop.create_task(unified_mcping(ip, port, 'raknet'))
        ]

        while True:
            await asyncio.sleep(.05)

            for task in tasks:
                if task.done():
                    current_index = tasks.index(task)
                    if current_index == 2:
                        return task.result()
                    else:
                        wait_for_index = 0 if current_index == 1 else 1

                        waited = 0
                        while not tasks[wait_for_index].done():
                            if waited > 7:
                                return task.result() # if other one times out return just this one

                            waited += 1
                            await asyncio.sleep(.05)

                        waited_for_result = tasks[wait_for_index].result() # merge the best of the two together

                        return await merge_pings_query_status(waited_for_result)

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

    return web.json_response(await unified_mcping(host, port))

web_app = web.Application()
web_app.router.add_view('/mcping', handler)

# This code is none blocking
# web_runner = web.AppRunner(web_app)
# await web_runner.setup()
# site = web.TCPSite(web_runner, 'localhost', 6942)
# await site.start()

loop = asyncio.get_event_loop()
web.run_app(web_app, host='localhost', port=6942) # this is blocking
