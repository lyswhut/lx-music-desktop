import http, { type IncomingMessage } from 'node:http'
import url from 'node:url'
import { WebSocketServer } from 'ws'
import * as modules from './modules'
import { authCode, authConnect } from './auth'
import syncList from './syncList'
import log from '../log'
import { SYNC_CLOSE_CODE, SYNC_CODE } from '@common/constants'
import { decryptMsg, encryptMsg, generateCode as handleGenerateCode } from './utils'
import { getAddress } from '../utils'
import { sendServerStatus } from '@main/modules/winMain/index'
import { getClientKeyInfo, getServerId, saveClientKeyInfo } from '../data'


let status: LX.Sync.ServerStatus = {
  status: false,
  message: '',
  address: [],
  code: '',
  devices: [],
}
let stopingServer = false

const codeTools: {
  timeout: NodeJS.Timer | null
  start: () => void
  stop: () => void
} = {
  timeout: null,
  start() {
    this.stop()
    this.timeout = setInterval(() => {
      void handleGenerateCode()
    }, 60 * 3 * 1000)
  },
  stop() {
    if (!this.timeout) return
    clearInterval(this.timeout)
    this.timeout = null
  },
}

const checkDuplicateClient = (newSocket: LX.Sync.Server.Socket) => {
  for (const client of [...wss!.clients]) {
    if (client === newSocket || client.keyInfo.clientId != newSocket.keyInfo.clientId) continue
    console.log('duplicate client', client.keyInfo.deviceName)
    client.isReady = false
    client.close(SYNC_CLOSE_CODE.normal)
  }
}

const handleConnection = async(socket: LX.Sync.Server.Socket, request: IncomingMessage) => {
  const queryData = url.parse(request.url as string, true).query as Record<string, string>

  //   // if (typeof socket.handshake.query.i != 'string') return socket.disconnect(true)
  const keyInfo = getClientKeyInfo(queryData.i)
  if (!keyInfo) {
    socket.close(SYNC_CLOSE_CODE.failed)
    return
  }
  keyInfo.lastSyncDate = Date.now()
  saveClientKeyInfo(keyInfo)
  //   // socket.lx_keyInfo = keyInfo
  socket.keyInfo = keyInfo
  checkDuplicateClient(socket)

  try {
    await syncList(wss as LX.Sync.Server.SocketServer, socket)
  } catch (err) {
    // console.log(err)
    log.warn(err)
    return
  }
  status.devices.push(keyInfo)
  socket.onClose(() => {
    // console.log('disconnect', reason)
    status.devices.splice(status.devices.findIndex(k => k.clientId == keyInfo?.clientId), 1)
    sendServerStatus(status)
  })
  // handleConnection(io, socket)
  sendServerStatus(status)

  // console.log('connection', keyInfo.deviceName)
  log.info('connection', keyInfo.deviceName)
  // console.log(socket.handshake.query)
  for (const module of Object.values(modules)) {
    module.registerListHandler(wss as LX.Sync.Server.SocketServer, socket)
  }

  socket.isReady = true
}

const handleUnconnection = () => {
  console.log('unconnection')
  // console.log(socket.handshake.query)
  for (const module of Object.values(modules)) {
    module.unregisterListHandler()
  }
}

const authConnection = (req: http.IncomingMessage, callback: (err: string | null | undefined, success: boolean) => void) => {
  // console.log(req.headers)
  // // console.log(req.auth)
  // console.log(req._query.authCode)
  authConnect(req).then(() => {
    callback(null, true)
  }).catch(err => {
    callback(err, false)
  })
}

let wss: LX.Sync.Server.SocketServer | null
let httpServer: http.Server

function noop() {}
function onSocketError(err: Error) {
  console.error(err)
}

const handleStartServer = async(port = 9527, ip = '0.0.0.0') => await new Promise((resolve, reject) => {
  httpServer = http.createServer((req, res) => {
    // console.log(req.url)
    const endUrl = `/${req.url?.split('/').at(-1) ?? ''}`
    let code
    let msg
    switch (endUrl) {
      case '/hello':
        code = 200
        msg = SYNC_CODE.helloMsg
        break
      case '/id':
        code = 200
        msg = SYNC_CODE.idPrefix + getServerId()
        break
      case '/ah':
        void authCode(req, res, status.code)
        break
      default:
        code = 401
        msg = 'Forbidden'
        break
    }
    if (!code) return
    res.writeHead(code)
    res.end(msg)
  })

  wss = new WebSocketServer({
    noServer: true,
  })

  wss.on('connection', function(socket, request) {
    socket.isReady = false
    socket.on('pong', () => {
      socket.isAlive = true
    })

    // const events = new Map<keyof ActionsType, Array<(err: Error | null, data: LX.Sync.ActionSyncType[keyof LX.Sync.ActionSyncType]) => void>>()
    // const events = new Map<keyof LX.Sync.ActionSyncType, Array<(err: Error | null, data: LX.Sync.ActionSyncType[keyof LX.Sync.ActionSyncType]) => void>>()
    let events: Partial<{ [K in keyof LX.Sync.ActionSyncType]: Array<(data: LX.Sync.ActionSyncType[K]) => void> }> = {}
    let closeEvents: Array<(err: Error) => (void | Promise<void>)> = []
    socket.addEventListener('message', ({ data }) => {
      if (typeof data === 'string') {
        let syncData: LX.Sync.ActionSync
        try {
          syncData = JSON.parse(decryptMsg(socket.keyInfo, data))
        } catch (err) {
          log.error('parse message error:', err)
          socket.close(SYNC_CLOSE_CODE.failed)
          return
        }
        const handlers = events[syncData.action]
        if (handlers) {
          // @ts-expect-error
          for (const handler of handlers) handler(syncData.data)
        }
      }
    })
    socket.addEventListener('close', () => {
      const err = new Error('closed')
      for (const handler of closeEvents) void handler(err)
      events = {}
      closeEvents = []
      if (!status.devices.length) handleUnconnection()
      log.info('deconnection', socket.keyInfo.deviceName)
    })
    socket.onRemoteEvent = function(eventName, handler) {
      let eventArr = events[eventName]
      if (!eventArr) events[eventName] = eventArr = []
      // let eventArr = events.get(eventName)
      // if (!eventArr) events.set(eventName, eventArr = [])
      eventArr.push(handler)

      return () => {
        eventArr!.splice(eventArr!.indexOf(handler), 1)
      }
    }
    socket.onClose = function(handler: typeof closeEvents[number]) {
      closeEvents.push(handler)
      return () => {
        closeEvents.splice(closeEvents.indexOf(handler), 1)
      }
    }
    socket.sendData = function(eventName, data, callback) {
      socket.send(encryptMsg(socket.keyInfo, JSON.stringify({ action: eventName, data })), callback)
    }
    void handleConnection(socket, request)
  })

  httpServer.on('upgrade', function upgrade(request, socket, head) {
    socket.on('error', onSocketError)
    // This function is not defined on purpose. Implement it with your own logic.
    authConnection(request, err => {
      if (err) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
        socket.destroy()
        return
      }
      socket.removeListener('error', onSocketError)

      wss?.handleUpgrade(request, socket, head, function done(ws) {
        wss?.emit('connection', ws, request)
      })
    })
  })

  const interval = setInterval(() => {
    wss?.clients.forEach(socket => {
      if (socket.isAlive == false) {
        socket.terminate()
        return
      }

      socket.isAlive = false
      socket.ping(noop)
      if (socket.keyInfo.isMobile) socket.send('ping', noop)
    })
  }, 30000)

  wss.on('close', function close() {
    clearInterval(interval)
  })

  httpServer.on('error', error => {
    console.log(error)
    reject(error)
  })

  httpServer.on('listening', () => {
    const addr = httpServer.address()
    // console.log(addr)
    if (!addr) {
      reject(new Error('address is null'))
      return
    }
    const bind = typeof addr == 'string' ? `pipe ${addr}` : `port ${addr.port}`
    log.info(`Listening on ${ip} ${bind}`)
    resolve(null)
  })

  httpServer.listen(port, ip)
})

const handleStopServer = async() => new Promise<void>((resolve, reject) => {
  if (!wss) return
  for (const client of wss.clients) client.close(SYNC_CLOSE_CODE.normal)
  wss.close()
  wss = null
  httpServer.close((err) => {
    if (err) {
      reject(err)
      return
    }
    resolve()
  })
})

export const stopServer = async() => {
  console.log('stop')
  codeTools.stop()
  if (!status.status) {
    status.status = false
    status.message = ''
    status.address = []
    status.code = ''
    sendServerStatus(status)
    return
  }
  console.log('stoping sync server...')
  status.message = 'stoping...'
  sendServerStatus(status)
  stopingServer = true
  await handleStopServer().then(() => {
    console.log('sync server stoped')
    status.status = false
    status.message = ''
    status.address = []
    status.code = ''
  }).catch(err => {
    console.log(err)
    status.message = err.message
  }).finally(() => {
    stopingServer = false
    sendServerStatus(status)
  })
}

export const startServer = async(port: number) => {
  console.log('status.status', status.status)
  if (stopingServer) return
  if (status.status) await handleStopServer()

  log.info('starting sync server')
  await handleStartServer(port).then(() => {
    console.log('sync server started')
    status.status = true
    status.message = ''
    status.address = getAddress()

    void generateCode()
    codeTools.start()
  }).catch(err => {
    console.log(err)
    status.status = false
    status.message = err.message
    status.address = []
    status.code = ''
  }).finally(() => {
    sendServerStatus(status)
  })
}

export const getStatus = (): LX.Sync.ServerStatus => status

export const generateCode = async() => {
  status.code = handleGenerateCode()
  sendServerStatus(status)
  return status.code
}
