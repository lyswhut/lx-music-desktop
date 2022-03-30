const http = require('http')
const sio = require('socket.io')
const { createHttpTerminator } = require('http-terminator')
const modules = require('../modules')
const { authCode, authConnect } = require('./auth')
const { getAddress, getServerId, generateCode, getClientKeyInfo, setClientKeyInfo } = require('./utils')
const { syncList, removeSnapshot } = require('./syncList')
const { log } = require('@common/utils')


let status = {
  status: false,
  message: '',
  address: [],
  code: '',
  devices: [],
}

const handleConnection = (io, socket) => {
  console.log('connection')
  // console.log(socket.handshake.query)
  for (const module of Object.values(modules)) {
    module.registerListHandler(io, socket)
  }
}

const authConnection = (req, callback) => {
  // console.log(req.headers)
  // // console.log(req.auth)
  // console.log(req._query.authCode)
  authConnect(req).then(() => {
    callback(null, true)
  }).catch(err => {
    callback(err, false)
  })
}

let httpTerminator = null
let io = null

const handleStartServer = (port = 9527) => new Promise((resolve, reject) => {
  const httpServer = http.createServer((req, res) => {
    // console.log(req.url)
    let code
    let msg
    switch (req.url) {
      case '/hello':
        code = 200
        msg = 'Hello~::^-^::'
        break
      case '/id':
        code = 200
        msg = 'OjppZDo6' + getServerId()
        break
      case '/ah':
        authCode(req, res, status.code)
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
  io = sio(httpServer, {
    path: '/sync',
    serveClient: false,
    connectTimeout: 10000,
    pingTimeout: 30000,
    maxHttpBufferSize: 1e9, // 1G
    allowRequest: authConnection,
    transports: ['websocket'],
  })

  io.on('connection', async socket => {
    socket.on('disconnect', reason => {
      console.log('disconnect', reason)
      status.devices.splice(status.devices.findIndex(k => k.clientId == keyInfo.clientId), 1)
      global.lx_event.sync.status(status)
    })
    const keyInfo = getClientKeyInfo(socket.handshake.query.i)
    keyInfo.connectionTime = Date.now()
    setClientKeyInfo(keyInfo)
    // socket.lx_keyInfo = keyInfo
    socket.data.keyInfo = keyInfo
    try {
      await syncList(io, socket)
    } catch (err) {
      // console.log(err)
      log.warn(err)
      return
    }
    status.devices.push(keyInfo)
    handleConnection(io, socket, keyInfo)
    global.lx_event.sync.status(status)
  })

  httpServer.on('error', error => {
    console.log(error)
    reject(error)
  })

  httpServer.on('listening', () => {
    const addr = httpServer.address()
    const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port
    console.info(`Listening on ${bind}`)
    resolve()
  })

  httpServer.listen(port)
})

const handleStopServer = async() => {
  if (!httpTerminator) return
  await io.close()
  await httpTerminator.terminate().catch(() => {})
  io = null
  httpTerminator = null
}

exports.stopServer = async() => {
  if (!status.status) {
    status.status = false
    status.message = ''
    status.address = []
    status.code = ''
    global.lx_event.sync.status(status)
    return
  }
  console.log('stoping sync server...')
  return handleStopServer().then(() => {
    console.log('sync server stoped')
    status.status = false
    status.message = ''
    status.address = []
    status.code = ''
  }).catch(err => {
    console.log(err)
    status.message = err.message
  }).finally(() => {
    global.lx_event.sync.status(status)
  })
}
exports.startServer = async port => {
  if (status.status) await handleStopServer()

  console.log('starting sync server...')
  return handleStartServer(port).then(() => {
    console.log('sync server started')
    status.status = true
    status.message = ''
    status.address = getAddress()
    status.code = generateCode()
  }).catch(err => {
    console.log(err)
    status.status = false
    status.message = err.message
    status.address = []
    status.code = ''
  }).finally(() => {
    global.lx_event.sync.status(status)
  })
}

exports.getStatus = () => status

exports.generateCode = async() => {
  status.code = generateCode()
  global.lx_event.sync.status(status)
  return status.code
}

exports.removeSnapshot = removeSnapshot
