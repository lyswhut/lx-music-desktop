import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import querystring from 'node:querystring'
import type { Socket } from 'node:net'
import { getAddress } from '@common/utils/nodejs'
import { sendTaskbarButtonClick } from '@main/modules/winMain'

const sendResponse = (res: http.ServerResponse, code = 200, msg: string | Record<any, unknown> = 'OK', contentType = 'text/plain; charset=utf-8') => {
  res.writeHead(code, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
  })
  if (typeof msg === 'object') {
    res.end(JSON.stringify(msg))
  } else {
    res.end(msg)
  }
}

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

const getWebRoot = (): string => {
  const candidates = [
    path.resolve(process.cwd(), 'src/main/modules/openApi/web'),
    path.resolve(__dirname, 'web'),
    path.resolve(__dirname, '../web'),
    path.resolve(__dirname, '../../web'),
  ]
  return candidates.find(candidate => fs.existsSync(candidate)) ?? candidates[0]
}

const getContentType = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase()
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8'
    case '.css':
      return 'text/css; charset=utf-8'
    case '.js':
      return 'application/javascript; charset=utf-8'
    case '.json':
      return 'application/json; charset=utf-8'
    case '.svg':
      return 'image/svg+xml; charset=utf-8'
    case '.woff':
      return 'font/woff'
    case '.woff2':
      return 'font/woff2'
    case '.ttf':
      return 'font/ttf'
    case '.otf':
      return 'font/otf'
    default:
      return 'application/octet-stream'
  }
}

const serveWebFile = (res: http.ServerResponse, filePath: string) => {
  const webRoot = getWebRoot()
  const safePath = path.normalize(filePath).replace(/^\.+[\\/]+/, '')
  const fullPath = path.resolve(webRoot, safePath)
  if (!fullPath.startsWith(webRoot)) {
    sendResponse(res, 403, 'Forbidden')
    return
  }

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      sendResponse(res, 404, 'Not Found')
      return
    }

    res.writeHead(200, {
      'Content-Type': getContentType(fullPath),
      'Access-Control-Allow-Origin': '*',
    })
    res.end(data)
  })
}

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
  sendResponse(res, 200, resp, 'application/json; charset=utf-8')
}
const handleSendAllLyric = (res: http.ServerResponse<http.IncomingMessage>) => {
  const resp: Partial<Record<SubscribeKeys, any>> = {
    lyric: global.lx.player_status.lyric,
    tlyric: global.lx.player_status.tlyric,
    rlyric: global.lx.player_status.rlyric,
    lxlyric: global.lx.player_status.lxlyric,
  }
  sendResponse(res, 200, resp, 'application/json; charset=utf-8')
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
  httpServer = http.createServer((req, res): void => {
    const requestUrl = new URL(req.url ?? '/', 'http://127.0.0.1')
    const pathname = decodeURIComponent(requestUrl.pathname)
    const [endUrl, query] = `/${req.url?.split('/').at(-1) ?? ''}`.split('?')
    let code = 200
    let msg = 'OK'
    if (pathname === '/lx-player') {
      const filePath = 'index.html'
      serveWebFile(res, filePath)
      return
    }
    switch (endUrl) {
      case '/status':
        handleSendStatus(res, query)
        return
      case '/lyric':
        msg = global.lx.player_status.lyric
        break
      case '/lyric-all':
        handleSendAllLyric(res)
        return
      case '/play':
        sendTaskbarButtonClick('play')
        break
      case '/pause':
        sendTaskbarButtonClick('pause')
        break
      case '/skip-next':
        sendTaskbarButtonClick('next')
        break
      case '/skip-prev':
        sendTaskbarButtonClick('prev')
        break
      case '/seek': {
        const offset = parseFloat(querystring.parse(query ?? '').offset as string)
        if (Number.isNaN(offset) || offset < 0 || offset > global.lx.player_status.duration) {
          code = 400
          msg = 'Invalid offset'
        } else {
          sendTaskbarButtonClick('seek', parseFloat(offset.toFixed(3)))
        }
        break
      }
      case '/collect':
        sendTaskbarButtonClick('collect')
        break
      case '/uncollect':
        sendTaskbarButtonClick('unCollect')
        break
      case '/volume': {
        const volume = parseInt(querystring.parse(query ?? '').volume as string)
        if (Number.isNaN(volume) || volume < 0 || volume > 100) {
          code = 400
          msg = 'Invalid volume'
        } else {
          sendTaskbarButtonClick('volume', volume / 100)
        }
        break
      }
      case '/mute': {
        const mute = querystring.parse(query ?? '').mute
        if (mute == 'true') {
          sendTaskbarButtonClick('mute', true)
        } else if (mute == 'false') {
          sendTaskbarButtonClick('mute', false)
        } else {
          code = 400
          msg = 'Invalid mute value'
        }
        break
      }
      case '/subscribe-player-status':
        try {
          handleSubscribePlayerStatus(req, res, query)
          return
        } catch (err) {
          console.log(err)
          code = 500
          msg = 'Error'
        }
        break
      default:
        code = 401
        msg = 'Forbidden'
        break
    }
    sendResponse(res, code, msg)
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
