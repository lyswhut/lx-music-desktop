import http from 'http'
import { Server, Socket } from 'socket.io'
import { createHttpTerminator, HttpTerminator } from 'http-terminator'
import * as modules from '../modules'
import { authCode, authConnect } from './auth'
import { getAddress, getServerId, generateCode as handleGenerateCode, getClientKeyInfo, setClientKeyInfo } from './utils'
import { syncList, removeSnapshot } from './syncList'
import { log } from '@common/utils'
import { sendStatus } from '@main/modules/winMain'
import { SYNC_CODE } from './config'


let status: LX.Sync.Status = {
  status: false,
  message: '',
  address: [],
  code: '',
  devices: [],
}

const codeTools: {
  timeout: NodeJS.Timer | null
  start: () => void
  stop: () => void
} = {
  timeout: null,
  start() {
    this.stop()
    this.timeout = setInterval(() => {
      void generateCode()
    }, 60 * 3 * 1000)
  },
  stop() {
    if (!this.timeout) return
    clearInterval(this.timeout)
    this.timeout = null
  },
}

const handleConnection = (io: Server, socket: LX.Sync.Socket) => {
  console.log('connection')
  // console.log(socket.handshake.query)
  for (const module of Object.values(modules)) {
    module.registerListHandler(io, socket)
  }
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

let httpTerminator: HttpTerminator | null = null
let io: Server | null = null

const handleStartServer = async(port = 9527) => await new Promise((resolve, reject) => {
  const httpServer = http.createServer((req, res) => {
    // console.log(req.url)
    let code
    let msg
    switch (req.url) {
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
  httpTerminator = createHttpTerminator({
    server: httpServer,
  })
  io = new Server(httpServer, {
    path: '/sync',
    serveClient: false,
    connectTimeout: 10000,
    pingTimeout: 30000,
    maxHttpBufferSize: 1e9, // 1G
    allowRequest: authConnection,
    transports: ['websocket'],
  })

  io.on('connection', async(_socket: Socket) => {
    const socket = _socket as LX.Sync.Socket
    socket.on('disconnect', reason => {
      console.log('disconnect', reason)
      status.devices.splice(status.devices.findIndex(k => k.clientId == keyInfo?.clientId), 1)
      sendStatus(status)
      if (!status.devices.length) handleUnconnection()
    })
    if (typeof socket.handshake.query.i != 'string') return socket.disconnect(true)
    const keyInfo = getClientKeyInfo(socket.handshake.query.i)
    if (!keyInfo || !io) return socket.disconnect(true)
    keyInfo.connectionTime = Date.now()
    setClientKeyInfo(keyInfo)
    // socket.lx_keyInfo = keyInfo
    socket.data.keyInfo = keyInfo
    socket.data.isReady = false
    try {
      await syncList(io, socket)
    } catch (err) {
      // console.log(err)
      log.warn(err)
      return
    }
    status.devices.push(keyInfo)
    handleConnection(io, socket)
    socket.data.isReady = true
    sendStatus(status)
  })

  httpServer.on('error', error => {
    console.log(error)
    reject(error)
  })

  httpServer.on('listening', () => {
    const addr = httpServer.address()
    if (!addr) return reject(new Error('address is null'))
    const bind = typeof addr == 'string' ? `pipe ${addr}` : `port ${addr.port}`
    console.info(`Listening on ${bind}`)
    resolve(null)
  })

  httpServer.listen(port)
})

const handleStopServer = async() => {
  if (!httpTerminator) return
  if (!io) return
  io.close()
  await httpTerminator.terminate().catch(() => {})
  io = null
  httpTerminator = null
}

export const stopServer = async() => {
  codeTools.stop()
  if (!status.status) {
    status.status = false
    status.message = ''
    status.address = []
    status.code = ''
    sendStatus(status)
    return
  }
  console.log('stoping sync server...')
  return await handleStopServer().then(() => {
    console.log('sync server stoped')
    status.status = false
    status.message = ''
    status.address = []
    status.code = ''
  }).catch(err => {
    console.log(err)
    status.message = err.message
  }).finally(() => {
    sendStatus(status)
  })
}

export const startServer = async(port: number) => {
  if (status.status) await handleStopServer()

  console.log('starting sync server...')
  return await handleStartServer(port).then(() => {
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
    sendStatus(status)
  })
}

export const getStatus = (): LX.Sync.Status => status

export const generateCode = async() => {
  status.code = handleGenerateCode()
  sendStatus(status)
  return status.code
}

export {
  removeSnapshot,
}
