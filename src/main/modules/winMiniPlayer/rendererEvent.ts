import { registerRendererEvents as common } from '@main/modules/commonRenderers/common'
import { mainHandle, mainOn } from '@common/mainIpc'
import { WIN_MINI_PLAYER_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { sendTaskbarButtonClick } from '@main/modules/winMain'
import { closeWindow, sendEvent, toggleWindow } from './main'


export default () => {
  // 注册主题变更等公共事件推送
  common(sendEvent)

  // 主窗口请求切换迷你窗显示状态
  mainHandle(WIN_MINI_PLAYER_RENDERER_EVENT_NAME.toggle_visible, async() => {
    return toggleWindow()
  })

  // 迷你窗获取当前完整播放状态
  mainHandle(WIN_MINI_PLAYER_RENDERER_EVENT_NAME.get_player_status, async() => {
    return global.lx.player_status
  })

  // 迷你窗播放控制指令，转发给主窗口处理
  mainOn<{ action: LX.Player.StatusButtonActions, data?: unknown }>(WIN_MINI_PLAYER_RENDERER_EVENT_NAME.player_action, ({ params: { action, data } }) => {
    sendTaskbarButtonClick(action, data)
  })

  // 迷你窗请求关闭自身
  mainOn(WIN_MINI_PLAYER_RENDERER_EVENT_NAME.close, () => {
    closeWindow()
  })

  // 监听应用设置变更，把迷你窗关心的字段（歌词颜色 / 逐字开关 / 桌面歌词开关等）转发给迷你窗
  global.lx.event_app.on('updated_config', (keys: Array<keyof LX.AppSetting>, setting: Partial<LX.AppSetting>) => {
    const interestingKeys = new Set<keyof LX.AppSetting>([
      'desktopLyric.style.lyricUnplayColor',
      'desktopLyric.style.lyricPlayedColor',
      'desktopLyric.style.lyricShadowColor',
      'player.isPlayLxlrc',
      'desktopLyric.enable',
    ])
    const partial: Partial<LX.AppSetting> = {}
    let hasUpdate = false
    for (const key of keys) {
      if (!interestingKeys.has(key)) continue
      // @ts-expect-error 按键名索引
      partial[key] = setting[key]
      hasUpdate = true
    }
    if (hasUpdate) sendEvent(WIN_MINI_PLAYER_RENDERER_EVENT_NAME.on_app_setting, partial)
  })
}

// 推送播放状态增量更新给迷你窗
export const sendPlayerStatus = (status: Partial<LX.Player.Status>) => {
  sendEvent(WIN_MINI_PLAYER_RENDERER_EVENT_NAME.on_player_status, status)
}
