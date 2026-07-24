import { rendererSend, rendererOn, rendererInvoke } from '@common/rendererIpc'
import { WIN_MINI_RENDERER_EVENT_NAME } from '@common/ipcNames'

export const sendConnectMainWindowEvent = () => {
  rendererSend(WIN_MINI_RENDERER_EVENT_NAME.request_main_window_channel)
}

export const onProvideMainWindowChannel = (listener: LX.IpcRendererEventListener): () => void => {
  rendererOn(WIN_MINI_RENDERER_EVENT_NAME.provide_main_window_channel, listener)
  return () => {
    // rendererOff(...)
  }
}

export const toggleMiniWindow = () => {
  return rendererInvoke(WIN_MINI_RENDERER_EVENT_NAME.toggle_mini_window)
}

export const closeMiniWindow = () => {
  return rendererInvoke(WIN_MINI_RENDERER_EVENT_NAME.close_mini_window)
}

export const showMiniWindow = () => {
  return rendererInvoke(WIN_MINI_RENDERER_EVENT_NAME.show_mini_window)
}