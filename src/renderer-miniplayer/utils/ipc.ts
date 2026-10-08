import { rendererSend, rendererInvoke, rendererOn, rendererOff } from '@common/rendererIpc'
import { CMMON_EVENT_NAME, WIN_MINI_PLAYER_RENDERER_EVENT_NAME } from '@common/ipcNames'

type RemoveListener = () => void

/**
 * 获取当前完整播放状态
 */
export const getPlayerStatus = async() => {
  return rendererInvoke<LX.Player.Status>(WIN_MINI_PLAYER_RENDERER_EVENT_NAME.get_player_status)
}

/**
 * 播放状态增量更新事件
 */
export const onPlayerStatus = (listener: LX.IpcRendererEventListenerParams<Partial<LX.Player.Status>>): RemoveListener => {
  rendererOn<Partial<LX.Player.Status>>(WIN_MINI_PLAYER_RENDERER_EVENT_NAME.on_player_status, listener)
  return () => {
    rendererOff(WIN_MINI_PLAYER_RENDERER_EVENT_NAME.on_player_status, listener)
  }
}

/**
 * 发送播放控制指令（上一曲/下一曲/播放/暂停）
 */
export const sendPlayerAction = (action: LX.Player.StatusButtonActions) => {
  rendererSend(WIN_MINI_PLAYER_RENDERER_EVENT_NAME.player_action, { action })
}

/**
 * 请求关闭迷你窗
 */
export const sendClose = () => {
  rendererSend(WIN_MINI_PLAYER_RENDERER_EVENT_NAME.close)
}

/**
 * 获取应用设置
 */
export const getAppSetting = async() => {
  return rendererInvoke<LX.AppSetting>(CMMON_EVENT_NAME.get_app_setting)
}

/**
 * 更新应用设置（用于切换桌面歌词等）
 */
export const updateAppSetting = (config: Partial<LX.AppSetting>) => {
  return rendererInvoke(CMMON_EVENT_NAME.set_app_setting, config)
}

/**
 * 监听主进程推送的应用设置增量更新（仅包含迷你窗关心的字段，如歌词颜色 / 逐字开关 / 桌面歌词开关等）
 */
export const onAppSetting = (listener: LX.IpcRendererEventListenerParams<Partial<LX.AppSetting>>): RemoveListener => {
  rendererOn<Partial<LX.AppSetting>>(WIN_MINI_PLAYER_RENDERER_EVENT_NAME.on_app_setting, listener)
  return () => {
    rendererOff(WIN_MINI_PLAYER_RENDERER_EVENT_NAME.on_app_setting, listener)
  }
}

/**
 * On Theme Change
 * @param listener LX.IpcRendererEventListenerParams<shouldUseDarkColors: boolean>
 * @returns RemoveListener Fn
 */
export const onThemeChange = (listener: LX.IpcRendererEventListenerParams<LX.ThemeSetting>): RemoveListener => {
  rendererOn(CMMON_EVENT_NAME.theme_change, listener)
  return () => {
    rendererOff(CMMON_EVENT_NAME.theme_change, listener)
  }
}
