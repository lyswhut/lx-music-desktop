/* eslint-disable no-var */
// import { Event as WinMainEvent } from '@main/modules/winMain/event'
// import { Event as WinLyricEvent } from '@main/modules/winLyric/event'
import { type DislikeType, type AppType, type ListType } from '@main/event'
import { type DBSeriveTypes } from '@main/worker/utils'

interface Lx {
  inited: boolean
  appSetting: LX.AppSetting
  hotKey: {
    enable: boolean
    config: LX.HotKeyConfigAll
    state: LX.HotKeyState
  }
  /**
   * 是否跳过托盘退出
   */
  isSkipTrayQuit: boolean
  /**
   * main window 是否关闭
   */
  // mainWindowClosed: boolean
  event_app: AppType
  event_list: ListType
  event_dislike: DislikeType
  worker: {
    dbService: DBSeriveTypes
  }
  theme: LX.ThemeSetting
  player_status: LX.Player.Status
}

declare global {
  // declare module NodeJS {
  //   export interface Global {
  //     lx: {
  //       app_event: {
  //         winMain: WinMainEvent
  //         winLyric: WinLyricEvent
  //       }
  //     }
  //   }
  // }

  // var isDev: boolean
  var envParams: LX.EnvParams
  var staticPath: string
  var lxDataPath: string
  var lxOldDataPath: string
  var lx: Lx
  var appWorder: AppWorder
}


