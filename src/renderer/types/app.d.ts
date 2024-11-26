/* eslint-disable no-var */
import { type AppEventTypes, type KeyEventTypes } from '@renderer/event'
import { type MainTypes, type DownloadTypes } from '@renderer/worker/utils'
import { type I18n } from '@renderer/plugins/i18n'
// interface LX.EnvParams {
//   deeplink?: string | null
//   cmdParams: LX.CmdParams
//   workAreaSize?: Electron.Size
// }


interface Lx {
  // appSetting: LX.AppSetting
  isEditingHotKey: boolean
  isPlayedStop: boolean
  appHotKeyConfig: LX.HotKeyConfigAll
  restorePlayInfo: LX.Player.SavedPlayInfo | null
  worker: {
    main: MainTypes
    download: DownloadTypes
  }
  isProd: boolean
  songListInfo: {
    fromName: string
    searchKey: string | null
    searchPosition?: number
    songlistKey: string | null
    songlistPosition?: number
  }
  rootOffset: number
  apiInitPromise: [Promise<boolean>, boolean, (success: boolean) => void]
}

declare global {
  interface Window {
    ELECTRON_DISABLE_SECURITY_WARNINGS?: string
    dt: boolean
    shouldUseDarkColors: boolean
    lx: Lx
    app_event: AppEventTypes
    key_event: KeyEventTypes
    i18n: I18n

    lxData: any

    setTheme: (colors: Record<string, string>) => void
    setLang: (lang?: string) => void
  }

  module NodeJS {
    interface ProcessVersions {
      app: string
    }
  }

  // const ENVIRONMENT: NodeJS.ProcessEnv


  namespace LX {
    interface KeyDownEevent {
      /**
       * 原始事件
       */
      event: KeyEvent | null

      /**
       * 按下的按键数组
       */
      keys: string[]

      /**
       * 按下的按键组合
       *
       * 类似：`shift`、`mod+a`
       *
       * 其中 `Ctrl` 的名称为 `mod`， 对应 MacOS 上的 `Command` 键
       */
      key: string
      /**
       * 当前触发此事件的单个按键（不包括之前已按下的键）
       */
      eventKey: string
      /**
       * 按键操作类型
       */
      type: 'down' | 'up'
    }

    type LyricFormat = 'gbk' | 'utf8'

    class KeyEvent extends KeyboardEvent {
      /**
       * 此事件是否标记为 已被处理，如果设置为`true`，则停止触发key event事件
       */
      lx_handled?: boolean
    }
  }

  var COMMIT_ID: string
  var COMMIT_DATE: string
}


// declare const ELECTRON_DISABLE_SECURITY_WARNINGS: string
// declare const userApiPath: string
