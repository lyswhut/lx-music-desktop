declare namespace LX {
  interface IpcRendererEvent {
    event: Electron.IpcRendererEvent
  }
  interface IpcRendererEventParams<T> {
    event: Electron.IpcRendererEvent
    params: T
  }
  type IpcRendererEventListener = (params: LX.IpcRendererEvent) => any
  type IpcRendererEventListenerParams<T> = (params: LX.IpcRendererEventParams<T>) => any
}
