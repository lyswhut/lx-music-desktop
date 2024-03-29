import http from 'node:http'
import type { Socket } from 'node:net'

let status: LX.OpenAPI.Status = {
  status: false,
  message: '',
  address: '',
}

let httpServer: http.Server
let sockets = new Set<Socket>()

const handleStartServer = async(port = 9000, ip = '127.0.0.1') => new Promise<void>((resolve, reject) => {
  httpServer = http.createServer((req, res) => {
    // console.log(req.url)
    const endUrl = `/${req.url?.split('/').at(-1) ?? ''}`
    let code
    let msg
    switch (endUrl) {
      case '/status':
        code = 200
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        msg = JSON.stringify({
          status: global.lx.player_status.status,
          name: global.lx.player_status.name,
          singer: global.lx.player_status.singer,
          albumName: global.lx.player_status.albumName,
          duration: global.lx.player_status.duration,
          progress: global.lx.player_status.progress,
          picUrl: global.lx.player_status.picUrl,
          lyricLineText: global.lx.player_status.lyricLineText,
        })
        break
      case '/lyric':
        code = 200
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        msg = global.lx.player_status.lyric
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
})


export const stopServer = async() => {
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
export const startServer = async(port: number) => {
  if (status.status) await handleStopServer()
  await handleStartServer(port).then(() => {
    status.status = true
    status.message = ''
    status.address = `http://localhost${port == 80 ? '' : ':' + port}`
  }).catch(err => {
    console.log(err)
    status.status = false
    status.message = err.message
    status.address = ''
  })
  return status
}

export const getStatus = (): LX.OpenAPI.Status => status
