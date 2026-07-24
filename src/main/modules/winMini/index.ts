import initRendererEvent from './rendererEvent'
import { closeWindow, createWindow, isExistWindow, toggleWindow } from './main'

let isMainWindowFullscreen = false

export default () => {
  initRendererEvent()

  global.lx.event_app.on('main_window_close', () => {
    closeWindow()
  })

  global.lx.event_app.on('main_window_fullscreen', (isFullscreen) => {
    isMainWindowFullscreen = isFullscreen
  })
}

export * from './main'
export * from './rendererEvent'