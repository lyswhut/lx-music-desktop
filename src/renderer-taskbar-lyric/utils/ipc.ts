import { ipcRenderer } from 'electron'
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'

export type TaskbarLyricStatePayload = LX.TaskbarLyric.State

type TaskbarLyricStateListener = (state: TaskbarLyricStatePayload) => void
type RemoveListener = () => void

export const onTaskbarLyricState = (listener: TaskbarLyricStateListener): RemoveListener => {
  const wrappedListener = (_event: Electron.IpcRendererEvent, state: TaskbarLyricStatePayload) => {
    listener(state)
  }

  ipcRenderer.on(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_set_state, wrappedListener)

  return () => {
    ipcRenderer.removeListener(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_set_state, wrappedListener)
  }
}

export const requestTaskbarLyricRefresh = () => {
  ipcRenderer.send(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_request_refresh)
}

export const requestTaskbarLyricMenu = () => {
  ipcRenderer.send(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_show_menu)
}

export const requestTaskbarLyricShowMainInterface = () => {
  ipcRenderer.send(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_show_main_interface)
}

export const sendTaskbarLyricDragMove = (offsetX: number) => {
  ipcRenderer.send(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_drag_move, { offsetX })
}

export const sendTaskbarLyricDragEnd = () => {
  ipcRenderer.send(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_drag_end)
}

export const sendTaskbarLyricControl = (action: 'prev' | 'next' | 'play' | 'pause') => {
  ipcRenderer.send(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_control, action)
}
