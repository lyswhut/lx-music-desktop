/* eslint-disable no-var */
// import { Event as WinMainEvent } from '@main/modules/winMain/event'
// import { Event as WinLyricEvent } from '@main/modules/winLyric/event'
import { AppType, ListType } from '@main/event'
import { DBSeriveTypes } from '@main/worker/utils'

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
  interface Lx {
    appSetting: LX.AppSetting
    hotKey: {
      enable: boolean
      config: LX.HotKeyConfigAll
      state: LX.HotKeyState
    }
    isTrafficLightClose: boolean
    isQuitting: boolean
    event_app: AppType
    event_list: ListType
    worker: {
      dbService: DBSeriveTypes
    }
    theme: LX.ThemeSetting
  }

  var isDev: boolean
  var envParams: LX.EnvParams
  var staticPath: string
  var lxDataPath: string
  var lxOldDataPath: string
  var lx: Lx
  var appWorder: AppWorder
}


