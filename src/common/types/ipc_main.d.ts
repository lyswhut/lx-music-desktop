declare namespace LX {
  interface IpcMainEvent {
    event: Electron.IpcMainEvent
  }
  interface IpcMainEventParams<T> {
    event: Electron.IpcMainEvent
    params: T
  }
  type IpcMainEventListener = (params: LX.IpcMainEvent) => void
  type IpcMainEventListenerParams<T> = (params: LX.IpcMainEventParams<T>) => void

  interface IpcMainInvokeEvent {
    event: Electron.IpcMainInvokeEvent
  }
  interface IpcMainInvokeEventParams<T> {
    event: Electron.IpcMainInvokeEvent
    params: T
  }

  type IpcMainInvokeEventListener = (params: LX.IpcMainInvokeEvent) => Promise<void>
  type IpcMainInvokeEventListenerParams<T> = (params: LX.IpcMainInvokeEventParams<T>) => Promise<void>
  type IpcMainInvokeEventListenerValue<V> = (params: LX.IpcMainInvokeEvent) => Promise<V>
  type IpcMainInvokeEventListenerParamsValue<T, V> = (params: LX.IpcMainInvokeEventParams<T>) => Promise<V>
}
