import http, { type ServerResponse} from 'node:http'
import querystring from 'node:querystring'
import type { Socket } from 'node:net'
import { getAddress } from '@common/utils/nodejs'
import { mainSend } from '@common/mainIpc'
import { BrowserWindow } from 'electron'
import { PLAYER_EVENT_NAME } from '@common/ipcNames'

let status: LX.OpenAPI.Status = {
  status: false,
  message: '',
  address: '',
}

type SubscribeKeys = keyof LX.Player.Status

let httpServer: http.Server
let sockets = new Set<Socket>()
let responses = new Map<http.ServerResponse<http.IncomingMessage>, SubscribeKeys[]>()
let playerStatusKeys: SubscribeKeys[]

const defaultFilter = [
  'status',
  'name',
  'singer',
  'albumName',
  'lyricLineText',
  'duration',
  'progress',
  'playbackRate',
] satisfies SubscribeKeys[]

const parseFilter = (filter: any) => {
  if (typeof filter != 'string') return defaultFilter
  filter = filter.split(',')
  const subKeys = playerStatusKeys.filter(k => filter.includes(k))
  return subKeys.length ? subKeys : defaultFilter
}
const handleSendStatus = (res: http.ServerResponse<http.IncomingMessage>, query?: string) => {
  const keys = parseFilter(querystring.parse(query ?? '').filter)
  const resp: Partial<Record<SubscribeKeys, any>> = {}
  for (const k of keys) resp[k] = global.lx.player_status[k]
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.writeHead(200)
  res.end(JSON.stringify(resp))
}
const handleSubscribePlayerStatus = (req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage>, query?: string) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*',
  })
  req.socket.setTimeout(0)
  req.on('close', () => {
    res.end('OK')
    responses.delete(res)
  })
  const keys = parseFilter(querystring.parse(query ?? '').filter)
  responses.set(res, keys)
  for (const [k, v] of Object.entries(global.lx.player_status)) {
    if (!keys.includes(k as SubscribeKeys)) continue
    res.write(`event: ${k}\n`)
    res.write(`data: ${JSON.stringify(v)}\n\n`)
  }
}

const handleStartServer = async(port: number, ip: string) => new Promise<void>((resolve, reject) => {
  playerStatusKeys = Object.keys(global.lx.player_status) as SubscribeKeys[]
  const browserWindow = BrowserWindow.getFocusedWindow() as BrowserWindow;
  httpServer = http.createServer((req, res): void => {
    const [endUrl, query] = `/${req.url?.split('/').at(-1) ?? ''}`.split('?')
    const setResponse = (res: ServerResponse, code: number, contentType: string, msg: string | object) => {
      res.setHeader('Content-Type', contentType || 'text/plain; charset=utf-8')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.statusCode = code || 200
      if (typeof msg === 'object') {
        res.end(JSON.stringify(msg));
      } else {
        res.end(msg);
      }
    }
    switch (endUrl) {
      case '/status':
        handleSendStatus(res, query)
        return

      case '/play':
        mainSend(browserWindow, PLAYER_EVENT_NAME.player_play)
        setResponse(res, 200, 'text/plain; charset=utf-8', 'OK')
        break

      case '/pause':
        mainSend(browserWindow, PLAYER_EVENT_NAME.player_pause)
        setResponse(res, 200, 'text/plain; charset=utf-8', 'OK')
        break

      case '/play-prev':
        mainSend(browserWindow, PLAYER_EVENT_NAME.invoke_play_prev)
        setResponse(res, 200, 'text/plain; charset=utf-8', 'OK')
        break

      case '/play-next':
        mainSend(browserWindow, PLAYER_EVENT_NAME.invoke_play_next)
        setResponse(res, 200, 'text/plain; charset=utf-8', 'OK')
        break

      case '/lyric':
        setResponse(res, 200, 'text/plain; charset=utf-8', global.lx.player_status.lyric)
        break

      case '/subscribe-player-status':
        try {
          handleSubscribePlayerStatus(req, res, query)
        } catch (err) {
          console.error(err)
          setResponse(res, 500, 'text/plain; charset=utf-8', 'Error')
        }
        break

      default:
        setResponse(res, 401, 'text/plain; charset=utf-8', 'Forbidden')
        break
    }
  })
  httpServer.on('error', error => {
    console.log(error)
    reject(error)
  })
  httpServer.on('connection', (socket) => {
    sockets.add(socket)
    socket.once('close', () => {
      sockets.delete(socket)
    })
    socket.setTimeout(4000)
  })

  httpServer.on('listening', () => {
    const addr = httpServer.address()
    // console.log(addr)
    if (!addr) {
      reject(new Error('address is null'))
      return
    }
    resolve()
  })
  httpServer.listen(port, ip)
})

const handleStopServer = async() => new Promise<void>((resolve, reject) => {
  if (!httpServer) return
  httpServer.close((err) => {
    if (err) {
      reject(err)
      return
    }
    resolve()
  })
  for (const socket of sockets) socket.destroy()
  sockets.clear()
  responses.clear()
})


const sendStatus = (status: Partial<LX.Player.Status>) => {
  if (!responses.size) return
  for (const [resp, keys] of responses) {
    for (const [k, v] of Object.entries(status)) {
      if (!keys.includes(k as SubscribeKeys)) continue
      resp.write(`event: ${k}\n`)
      resp.write(`data: ${JSON.stringify(v)}\n\n`)
    }
  }
}
export const stopServer = async() => {
  global.lx.event_app.off('player_status', sendStatus)
  if (!status.status) {
    status.status = false
    status.message = ''
    status.address = ''
    return status
  }
  await handleStopServer().then(() => {
    status.status = false
    status.message = ''
    status.address = ''
  }).catch(err => {
    console.log(err)
    status.message = err.message
  })
  return status
}
export const startServer = async(port: number, bindLan: boolean) => {
  if (status.status) await stopServer()
  await handleStartServer(port, bindLan ? '0.0.0.0' : '127.0.0.1').then(() => {
    status.status = true
    status.message = ''
    let address = ['127.0.0.1']
    if (bindLan) address = [...address, ...getAddress()]
    status.address = address.join(', ')
  }).catch(err => {
    console.log(err)
    status.status = false
    status.message = err.message
    status.address = ''
  })
  global.lx.event_app.on('player_status', sendStatus)
  return status
}

export const getStatus = (): LX.OpenAPI.Status => status
