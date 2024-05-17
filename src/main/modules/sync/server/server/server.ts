import http, { type IncomingMessage } from 'node:http'
import { WebSocketServer } from 'ws'
import { registerLocalSyncEvent, callObj, sync, unregisterLocalSyncEvent } from './sync'
import { authCode, authConnect } from './auth'
import { SYNC_CLOSE_CODE, SYNC_CODE } from '@common/constants_sync'
import { getUserSpace, releaseUserSpace, getServerId, initServerInfo } from '../user'
import { createMsg2call } from 'message2call'
import log from '../../log'
import { sendServerStatus } from '@main/modules/winMain'
import { decryptMsg, encryptMsg, generateCode as handleGenerateCode } from '../utils/tools'
import migrateData from '../../migrate'
import type { Socket } from 'node:net'
import { getAddress } from '@common/utils/nodejs'


let status: LX.Sync.ServerStatus = {
  status: false,
  message: '',
  address: [],
  code: '',
  devices: [],
}

let stopingServer = false

let host = 'http://localhost'

const codeTools: {
  timeout: NodeJS.Timeout | null
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
    log.info('duplicate client', client.userInfo.name, client.keyInfo.deviceName)
    client.isReady = false
    for (const name of Object.keys(client.moduleReadys) as Array<keyof LX.Sync.Server.Socket['moduleReadys']>) {
      client.moduleReadys[name] = false
    }
    client.close(SYNC_CLOSE_CODE.normal)
  }
}

const handleConnection = async(socket: LX.Sync.Server.Socket, request: IncomingMessage) => {
  const queryData = new URL(request.url!, host).searchParams
  const clientId = queryData.get('i')

  //   // if (typeof socket.handshake.query.i != 'string') return socket.disconnect(true)
  const userSpace = getUserSpace()
  const keyInfo = userSpace.dataManage.getClientKeyInfo(clientId)
  if (!keyInfo) {
    socket.close(SYNC_CLOSE_CODE.failed)
    return
  }
  keyInfo.lastConnectDate = Date.now()
  userSpace.dataManage.saveClientKeyInfo(keyInfo)
  //   // socket.lx_keyInfo = keyInfo
  socket.keyInfo = keyInfo
  socket.userInfo = { name: 'default' }

  checkDuplicateClient(socket)

  try {
    await sync(socket)
  } catch (err) {
    // console.log(err)
    log.warn(err)
    return
  }
  status.devices.push(keyInfo)
  // handleConnection(io, socket)
  sendServerStatus(status)
  socket.onClose(() => {
    status.devices.splice(status.devices.findIndex(k => k.clientId == keyInfo.clientId), 1)
    sendServerStatus(status)
  })

  // console.log('connection', keyInfo.deviceName)
  log.info('connection', keyInfo.deviceName)
  // console.log(socket.handshake.query)

  socket.isReady = true
}

const handleUnconnection = () => {
  // console.log('unconnection')
  releaseUserSpace()
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
let sockets = new Set<Socket>()

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
    socket.moduleReadys = {
      list: false,
      dislike: false,
    }
    socket.feature = {
      list: false,
      dislike: false,
    }
    socket.on('pong', () => {
      socket.isAlive = true
    })

    // const events = new Map<keyof ActionsType, Array<(err: Error | null, data: LX.Sync.ActionSyncType[keyof LX.Sync.ActionSyncType]) => void>>()
    // const events = new Map<keyof LX.Sync.ActionSyncType, Array<(err: Error | null, data: LX.Sync.ActionSyncType[keyof LX.Sync.ActionSyncType]) => void>>()
    // let events: Partial<{ [K in keyof LX.Sync.ActionSyncType]: Array<(data: LX.Sync.ActionSyncType[K]) => void> }> = {}
    let closeEvents: Array<(err: Error) => (void | Promise<void>)> = []
    let disconnected = false
    const msg2call = createMsg2call<LX.Sync.ClientSyncActions>({
      funcsObj: callObj,
      timeout: 120 * 1000,
      sendMessage(data) {
        if (disconnected) throw new Error('disconnected')
        void encryptMsg(socket.keyInfo, JSON.stringify(data)).then((data) => {
          // console.log('sendData', eventName)
          socket.send(data)
        }).catch(err => {
          log.error('encrypt message error:', err)
          log.error(err.message)
          socket.close(SYNC_CLOSE_CODE.failed)
        })
      },
      onCallBeforeParams(rawArgs) {
        return [socket, ...rawArgs]
      },
      onError(error, path, groupName) {
        const name = groupName ?? ''
        const deviceName = socket.keyInfo?.deviceName ?? ''
        log.error(`sync call ${deviceName} ${name} ${path.join('.')} error:`, error)
        // if (groupName == null) return
        // socket.close(SYNC_CLOSE_CODE.failed)
      },
    })
    socket.remote = msg2call.remote
    socket.remoteQueueList = msg2call.createQueueRemote('list')
    socket.remoteQueueDislike = msg2call.createQueueRemote('dislike')
    socket.addEventListener('message', ({ data }) => {
      if (typeof data != 'string') return
      void decryptMsg(socket.keyInfo, data).then((data) => {
        let syncData: any
        try {
          syncData = JSON.parse(data)
        } catch (err) {
          log.error('parse message error:', err)
          socket.close(SYNC_CLOSE_CODE.failed)
          return
        }
        msg2call.message(syncData)
      }).catch(err => {
        log.error('decrypt message error:', err)
        log.error(err.message)
        socket.close(SYNC_CLOSE_CODE.failed)
      })
    })
    socket.addEventListener('close', () => {
      const err = new Error('closed')
      try {
        for (const handler of closeEvents) void handler(err)
      } catch (err: any) {
        log.error(err?.message)
      }
      closeEvents = []
      disconnected = true
      msg2call.destroy()
      if (socket.isReady) {
        log.info('deconnection', socket.userInfo.name, socket.keyInfo.deviceName)
        // events = {}
        if (!status.devices.length) handleUnconnection()
      } else {
        const queryData = new URL(request.url!, host).searchParams
        log.info('deconnection', queryData.get('i'))
      }
    })
    socket.onClose = function(handler: typeof closeEvents[number]) {
      closeEvents.push(handler)
      return () => {
        closeEvents.splice(closeEvents.indexOf(handler), 1)
      }
    }
    socket.broadcast = function(handler) {
      if (!wss) return
      for (const client of wss.clients) handler(client)
    }

    void handleConnection(socket, request)
  })

  httpServer.on('upgrade', function upgrade(request, socket, head) {
    socket.addListener('error', onSocketError)
    // This function is not defined on purpose. Implement it with your own logic.
    authConnection(request, err => {
      if (err) {
        console.log(err)
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
        log.info('alive check false:', socket.userInfo.name, socket.keyInfo.deviceName)
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
  httpServer.on('connection', (socket) => {
    sockets.add(socket)
    socket.once('close', () => {
      sockets.delete(socket)
    })
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
    void registerLocalSyncEvent(wss!)
  })

  host = `http://${ip}:${port}`
  httpServer.listen(port, ip)
})

const handleStopServer = async() => new Promise<void>((resolve, reject) => {
  if (!wss) return
  for (const client of wss.clients) client.close(SYNC_CLOSE_CODE.normal)
  unregisterLocalSyncEvent()
  wss.close()
  wss = null
  httpServer.close((err) => {
    if (err) {
      reject(err)
      return
    }
    resolve()
  })
  for (const socket of sockets) socket.destroy()
  sockets.clear()
})

export const stopServer = async() => {
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
    sendServerStatus(status)
    stopingServer = false
  })
}

export const startServer = async(port: number) => {
  // if (status.status) await handleStopServer()
  console.log('status.status', status.status, stopingServer)
  if (stopingServer) return
  if (status.status) await handleStopServer()

  await migrateData(global.lxDataPath)
  await initServerInfo()

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

export const getDevices = async() => {
  const userSpace = getUserSpace()
  return userSpace.getDecices()
}

export const removeDevice = async(clientId: string) => {
  if (wss) {
    for (const client of wss.clients) {
      if (client.keyInfo.clientId == clientId) client.close(SYNC_CLOSE_CODE.normal)
    }
  }
  const userSpace = getUserSpace()
  await userSpace.removeDevice(clientId)
}
