import initRendererEvent, { sendPlayerStatus } from './rendererEvent'
import { isExistWindow, handleMainWindowClose } from './main'

export default () => {
  initRendererEvent()

  // 主窗口播放状态变化时同步给迷你窗
  global.lx.event_app.on('player_status', (status) => {
    if (!isExistWindow()) return
    sendPlayerStatus(status)
  })
  global.lx.event_app.on('main_window_close', handleMainWindowClose)
}
export * from './main'
export * from './rendererEvent'
