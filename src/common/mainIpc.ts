import { ipcMain } from 'electron'

export function mainOn(name: string, listener: LX.IpcMainEventListener): void
export function mainOn<T>(name: string, listener: LX.IpcMainEventListenerParams<T>): void
export function mainOn<T>(name: string, listener: LX.IpcMainEventListenerParams<T>): void {
  ipcMain.on(name, (event, params) => {
    listener({ event, params })
  })
}

export function mainOnce(name: string, listener: LX.IpcMainEventListener): void
export function mainOnce<T>(name: string, listener: LX.IpcMainEventListenerParams<T>): void
export function mainOnce<T>(name: string, listener: LX.IpcMainEventListenerParams<T>): void {
  ipcMain.once(name, (event, params) => {
    listener({ event, params })
  })
}

export const mainOff = (name: string, listener: (...args: any[]) => void) => {
  ipcMain.removeListener(name, listener)
}

export const mainOffAll = (name: string) => {
  ipcMain.removeAllListeners(name)
}

export function mainHandle(name: string, listener: LX.IpcMainInvokeEventListener): void
export function mainHandle<T>(name: string, listener: LX.IpcMainInvokeEventListenerParams<T>): void
export function mainHandle<V>(name: string, listener: LX.IpcMainInvokeEventListenerValue<V>): void
export function mainHandle<T, V>(name: string, listener: LX.IpcMainInvokeEventListenerParamsValue<T, V>): void
export function mainHandle<T, V>(name: string, listener: LX.IpcMainInvokeEventListenerParamsValue<T, V>): void {
  ipcMain.handle(name, async(event, params) => {
    return listener({ event, params })
  })
}

export function mainHandleOnce(name: string, listener: LX.IpcMainInvokeEventListener): void
export function mainHandleOnce<T>(name: string, listener: LX.IpcMainInvokeEventListenerParams<T>): void
export function mainHandleOnce<V>(name: string, listener: LX.IpcMainInvokeEventListenerValue<V>): void
export function mainHandleOnce<T, V>(name: string, listener: LX.IpcMainInvokeEventListenerParamsValue<T, V>): void
export function mainHandleOnce<T, V>(name: string, listener: LX.IpcMainInvokeEventListenerParamsValue<T, V>): void {
  ipcMain.handleOnce(name, async(event, params) => {
    return listener({ event, params })
  })
}
export const mainHandleRemove = (name: string) => {
  ipcMain.removeHandler(name)
}

export function mainSend(window: Electron.BrowserWindow, name: string): void
export function mainSend<T>(window: Electron.BrowserWindow, name: string, params: T): void
export function mainSend<T>(window: Electron.BrowserWindow, name: string, params?: T): void {
  window.webContents.send(name, params)
}
