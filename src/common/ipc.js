const { ipcMain, ipcRenderer } = require('electron')
const names = require('./ipcNames')


exports.mainOn = (name, callback) => {
  ipcMain.on(name, callback)
}
exports.mainOnce = (name, callback) => {
  ipcMain.once(name, callback)
}
exports.mainOff = (name, callback) => {
  ipcMain.removeListener(name, callback)
}
exports.mainOffAll = name => {
  ipcMain.removeAllListeners(name)
}

exports.mainHandle = (name, callback) => {
  ipcMain.handle(name, callback)
}
exports.mainHandleOnce = (name, callback) => {
  ipcMain.handleOnce(name, callback)
}
exports.mainHandleRemove = name => {
  ipcMain.removeListener(name)
}

exports.mainSend = (window, name, params) => {
  window.webContents.send(name, params)
}

exports.rendererSend = (name, params) => {
  ipcRenderer.send(name, params)
}
exports.rendererSendSync = (name, params) => ipcRenderer.sendSync(name, params)

exports.rendererInvoke = (name, params) => ipcRenderer.invoke(name, params)

exports.rendererOn = (name, callback) => {
  ipcRenderer.on(name, callback)
}
exports.rendererOnce = (name, callback) => {
  ipcRenderer.once(name, callback)
}
exports.rendererOff = (name, callback) => {
  ipcRenderer.removeListener(name, callback)
}
exports.rendererOffAll = name => {
  ipcRenderer.removeAllListeners(name)
}

exports.NAMES = names
