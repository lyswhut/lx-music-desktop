import { ipcRenderer } from 'electron'

export function rendererSend(name: string): void
export function rendererSend<T>(name: string, params: T): void
export function rendererSend<T>(name: string, params?: T): void {
  ipcRenderer.send(name, params)
}

export function rendererSendSync(name: string): void
export function rendererSendSync<T>(name: string, params: T): void
export function rendererSendSync<T>(name: string, params?: T): void {
  ipcRenderer.sendSync(name, params)
}

export async function rendererInvoke(name: string): Promise<void>
export async function rendererInvoke<V>(name: string): Promise<V>
export async function rendererInvoke<T>(name: string, params: T): Promise<void>
export async function rendererInvoke<T, V>(name: string, params: T): Promise<V>
export async function rendererInvoke <T, V>(name: string, params?: T): Promise<V> {
  return ipcRenderer.invoke(name, params)
}

export function rendererOn(name: string, listener: LX.IpcRendererEventListener): void
export function rendererOn<T>(name: string, listener: LX.IpcRendererEventListenerParams<T>): void
export function rendererOn<T>(name: string, listener: LX.IpcRendererEventListenerParams<T>): void {
  ipcRenderer.on(name, (event, params) => {
    listener({ event, params })
  })
}

export function rendererOnce(name: string, listener: LX.IpcRendererEventListener): void
export function rendererOnce<T>(name: string, listener: LX.IpcRendererEventListenerParams<T>): void
export function rendererOnce<T>(name: string, listener: LX.IpcRendererEventListenerParams<T>): void {
  ipcRenderer.once(name, (event, params) => {
    listener({ event, params })
  })
}

export const rendererOff = (name: string, listener: (...args: any[]) => any) => {
  ipcRenderer.removeListener(name, listener)
}

export const rendererOffAll = (name: string) => {
  ipcRenderer.removeAllListeners(name)
}

/**
 * 注册 renderer 端 handler，供 main 进程通过 webContents.ipc.invoke 调用
 */
export function rendererHandle(name: string, listener: (params?: any) => Promise<any> | any): void {
  if (typeof (ipcRenderer as any).handle !== 'function') {
    console.warn('ipcRenderer.handle not available, skipping:', name)
    return
  }
  (ipcRenderer as any).handle(name, async (_event: any, params: any) => {
    return listener(params)
  })
}

export const rendererHandleRemove = (name: string) => {
  (ipcRenderer as any).removeHandler(name)
}
