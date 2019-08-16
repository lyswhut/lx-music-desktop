const { ipcMain, ipcRenderer } = require('electron')


export const mainSend = (name, params) => {
  ipcMain.send(name, params)
}

export const mainOn = (name, callback) => {
  ipcMain.on(name, callback)
}


export const rendererSend = (name, params) => {
  ipcRenderer.send(name, params)
}

export const rendererOn = (name, callback) => {
  ipcRenderer.on(name, callback)
}
