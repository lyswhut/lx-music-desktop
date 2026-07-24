import { registerRendererEvents as common } from '@main/modules/commonRenderers/common'
import { mainOn, mainHandle } from '@common/mainIpc'
import { WIN_MINI_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { sendEvent, closeWindow, createWindow, isExistWindow, toggleWindow, showWindow } from './main'
import { sendNewDesktopLyricClient } from '@main/modules/winMain'
import { MessageChannelMain } from 'electron'

export default () => {
  common(sendEvent)

  mainHandle(WIN_MINI_RENDERER_EVENT_NAME.toggle_mini_window, async() => {
    toggleWindow()
  })

  mainHandle(WIN_MINI_RENDERER_EVENT_NAME.close_mini_window, async() => {
    closeWindow()
  })

  mainHandle(WIN_MINI_RENDERER_EVENT_NAME.show_mini_window, async() => {
    if (!isExistWindow()) {
      createWindow()
    } else {
      showWindow()
    }
  })

  mainOn(WIN_MINI_RENDERER_EVENT_NAME.request_main_window_channel, ({ event }) => {
    const { port1, port2 } = new MessageChannelMain()
    sendNewDesktopLyricClient(port1)
    event.senderFrame?.postMessage(WIN_MINI_RENDERER_EVENT_NAME.provide_main_window_channel, null, [port2])
  })
}