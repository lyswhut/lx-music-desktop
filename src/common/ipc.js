const { ipcMain, ipcRenderer } = require('electron')


export const mainOn = (event, callback) => {
  ipcMain.on(event, callback)
}
export const mainOnce = (event, callback) => {
  ipcMain.once(event, callback)
}

export const mainHandle = (name, callback) => {
  ipcMain.handle(name, callback)
}
export const mainHandleOnce = (name, callback) => {
  ipcMain.handleOnce(name, callback)
}


export const rendererSend = (name, params) => {
  ipcRenderer.send(name, params)
}
export const rendererSendSync = (name, params) => ipcRenderer.sendSync(name, params)

export const rendererInvoke = (name, params) => ipcRenderer.invoke(name, params)

export const rendererOn = (name, callback) => {
  ipcRenderer.on(name, callback)
}
export const rendererOnce = (name, callback) => {
  ipcRenderer.once(name, callback)
}
