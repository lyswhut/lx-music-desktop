const { encryptMsg, decryptMsg } = require('../server/utils')
let io

const handleListAction = ({ action, data }) => {
  // console.log(action, data)
  global.lx_event.sync.action_list({ action, data })
}

// const addMusic = (orderId, callback) => {
//   // ...
// }

const broadcast = async(action, data, excludeIds = []) => {
  if (!io) return
  const sockets = await io.fetchSockets()
  for (const socket of sockets) {
    if (excludeIds.includes(socket.data.keyInfo.clientId)) continue
    socket.emit(action, encryptMsg(socket.data.keyInfo, data))
  }
}

exports.sendListAction = (action, data) => {
  // io.sockets
  return broadcast('list:action', JSON.stringify({ action, data }))
}

exports.registerListHandler = (_io, socket) => {
  io = _io
  socket.on('list:action', msg => {
    // console.log(msg)
    msg = decryptMsg(socket.data.keyInfo, msg)
    if (!msg) return
    handleListAction(JSON.parse(msg))
    broadcast('list:action', msg, [socket.data.keyInfo.clientId])
    // socket.broadcast.emit('list:action', { action: 'list_remove', data: { id: 'default', index: 0 } })
  })
  // socket.on('list:add', addMusic)
}
exports.unregisterListHandler = () => {
  io = null
}
