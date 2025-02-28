import { registerRendererEvents as common } from '@main/modules/commonRenderers/common'
import { mainOn, mainHandle } from '@common/mainIpc'
import { WIN_LYRIC_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { buildLyricConfig, getLyricWindowBounds } from './utils'
import { sendNewDesktopLyricClient } from '@main/modules/winMain'
import { getBounds, getMainFrame, sendEvent, setBounds, setResizeable } from './main'
import { MessageChannelMain } from 'electron'


export default () => {
  // mainOn(WIN_LYRIC_RENDERER_EVENT_NAME.get_lyric_info, ({ params: action }) => {
  //   sendMainEvent(WIN_MAIN_RENDERER_EVENT_NAME.get_lyric_info, {
  //     name: WIN_LYRIC_RENDERER_EVENT_NAME.set_lyric_info,
  //     modal: 'lyricWindow',
  //     action,
  //   })
  // })
  common(sendEvent)

  mainHandle<Partial<LX.AppSetting>>(WIN_LYRIC_RENDERER_EVENT_NAME.set_config, async({ params: config }) => {
    global.lx.event_app.update_config(config)
  })

  mainHandle<LX.DesktopLyric.Config>(WIN_LYRIC_RENDERER_EVENT_NAME.get_config, async() => {
    return buildLyricConfig(global.lx.appSetting) as LX.DesktopLyric.Config
  })

  mainOn<LX.DesktopLyric.NewBounds>(WIN_LYRIC_RENDERER_EVENT_NAME.set_win_bounds, ({ params: options }) => {
    setBounds(getLyricWindowBounds(getBounds(), options))
  })

  mainOn<boolean>(WIN_LYRIC_RENDERER_EVENT_NAME.set_win_resizeable, ({ params: resizable }) => {
    setResizeable(resizable)
  })

  mainOn(WIN_LYRIC_RENDERER_EVENT_NAME.request_main_window_channel, ({ event }) => {
    if (event.senderFrame !== getMainFrame()) return
    // Create a new channel ...
    const { port1, port2 } = new MessageChannelMain()
    // ... send one end to the worker ...
    sendNewDesktopLyricClient(port1)
    // ... and the other end to the main window.
    event.senderFrame?.postMessage(WIN_LYRIC_RENDERER_EVENT_NAME.provide_main_window_channel, null, [port2])
    // Now the main window and the worker can communicate with each other
    // without going through the main process!
    console.log('request_main_window_channel')
  })
}

export const sendConfigChange = (setting: Partial<LX.DesktopLyric.Config>) => {
  sendEvent(WIN_LYRIC_RENDERER_EVENT_NAME.on_config_change, setting)
}

export const sendMainWindowInitedEvent = () => {
  sendEvent(WIN_LYRIC_RENDERER_EVENT_NAME.main_window_inited)
}

