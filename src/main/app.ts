import path from 'node:path'
import { existsSync, mkdirSync, renameSync } from 'fs'
import { app, shell, screen, nativeTheme, dialog } from 'electron'
import { URL_SCHEME_RXP } from '@common/constants'
import { getTheme, initHotKey, initSetting, parseEnvParams } from './utils'
import { navigationUrlWhiteList } from '@common/config'
import defaultSetting from '@common/defaultSetting'
import { isExistWindow as isExistMainWindow, showWindow as showMainWindow } from './modules/winMain'
import { createAppEvent, createDislikeEvent, createListEvent } from '@main/event'
import { isMac, log } from '@common/utils'
import createWorkers from './worker'
import { migrateDBData } from './utils/migrate'
import { openDirInExplorer } from '@common/utils/electron'

export const initGlobalData = () => {
  const envParams = parseEnvParams()
  envParams.cmdParams.dt = !!envParams.cmdParams.dt

  global.envParams = {
    cmdParams: envParams.cmdParams,
    deeplink: envParams.deeplink,
  }
  global.lx = {
    inited: false,
    isSkipTrayQuit: false,
    // mainWindowClosed: true,
    event_app: createAppEvent(),
    event_list: createListEvent(),
    event_dislike: createDislikeEvent(),
    appSetting: defaultSetting,
    worker: createWorkers(),
    hotKey: {
      enable: true,
      config: {
        local: {
          enable: false,
          keys: {},
        },
        global: {
          enable: false,
          keys: {},
        },
      },
      state: new Map(),
    },
    theme: {
      shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
      theme: {
        id: '',
        name: '',
        isDark: false,
        colors: {},
      },
    },
    player_status: {
      status: 'stoped',
      name: '',
      singer: '',
      albumName: '',
      picUrl: '',
      progress: 0,
      duration: 0,
      playbackRate: 1,
      lyricLineText: '',
      lyricLineAllText: '',
      lyric: '',
      collect: false,
    },
  }

  global.staticPath =
    process.env.NODE_ENV !== 'production'
      ? webpackStaticPath
      : path.join(__dirname, 'static')
}

export const initSingleInstanceHandle = () => {
  // 单例应用程序
  if (!app.requestSingleInstanceLock()) {
    app.quit()
    process.exit(0)
  }

  app.on('second-instance', (event, argv, cwd) => {
    for (const param of argv) {
      if (URL_SCHEME_RXP.test(param)) {
        global.envParams.deeplink = param
        break
      }
    }

    if (isExistMainWindow()) {
      if (global.envParams.deeplink) global.lx.event_app.deeplink(global.envParams.deeplink)
      else showMainWindow()
    } else {
      app.quit()
    }
  })
}

export const applyElectronEnvParams = () => {
  // Is disable hardware acceleration
  if (global.envParams.cmdParams.dha) app.disableHardwareAcceleration()
  if (global.envParams.cmdParams.dhmkh) app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling')

  // fix linux transparent fail. https://github.com/electron/electron/issues/25153#issuecomment-843688494
  if (process.platform == 'linux') app.commandLine.appendSwitch('use-gl', 'desktop')

  // https://github.com/electron/electron/issues/22691
  app.commandLine.appendSwitch('wm-window-animations-disabled')

  app.commandLine.appendSwitch('--disable-gpu-sandbox')

  // proxy
  if (global.envParams.cmdParams['proxy-server']) {
    app.commandLine.appendSwitch('proxy-server', global.envParams.cmdParams['proxy-server'])
    app.commandLine.appendSwitch('proxy-bypass-list', global.envParams.cmdParams['proxy-bypass-list'] ?? '<local>')
  }
}

export const setUserDataPath = () => {
  // windows平台下如果应用目录下存在 portable 文件夹则将数据存在此文件下
  if (process.platform == 'win32') {
    const portablePath = path.join(path.dirname(app.getPath('exe')), '/portable')
    if (existsSync(portablePath)) {
      app.setPath('appData', portablePath)
      const appDataPath = path.join(portablePath, '/userData')
      if (!existsSync(appDataPath)) mkdirSync(appDataPath)
      app.setPath('userData', appDataPath)
    }
  }

  const userDataPath = app.getPath('userData')
  global.lxOldDataPath = userDataPath
  global.lxDataPath = path.join(userDataPath, 'LxDatas')
  if (!existsSync(global.lxDataPath)) mkdirSync(global.lxDataPath)
}

export const registerDeeplink = (startApp: () => void) => {
  if (process.env.NODE_ENV !== 'production' && process.platform === 'win32') {
    // Set the path of electron.exe and your app.
    // These two additional parameters are only available on windows.
    // console.log(process.execPath, process.argv)
    app.setAsDefaultProtocolClient('lxmusic', process.execPath, process.argv.slice(1))
  } else {
    app.setAsDefaultProtocolClient('lxmusic')
  }

  // deep link
  app.on('open-url', (event, url) => {
    if (!URL_SCHEME_RXP.test(url)) return
    event.preventDefault()
    global.envParams.deeplink = url
    if (isExistMainWindow()) {
      if (global.envParams.deeplink) global.lx.event_app.deeplink(global.envParams.deeplink)
      else showMainWindow()
    } else {
      startApp()
    }
  })
}

export const listenerAppEvent = (startApp: () => void) => {
  app.on('web-contents-created', (event, contents) => {
    contents.on('will-navigate', (event, navigationUrl) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('navigation to url:', navigationUrl.length > 130 ? navigationUrl.substring(0, 130) + '...' : navigationUrl)
        return
      }
      if (!navigationUrlWhiteList.some(url => url.test(navigationUrl))) {
        event.preventDefault()
        return
      }
      console.log('navigation to url:', navigationUrl)
    })
    contents.setWindowOpenHandler(({ url }) => {
      if (!/^devtools/.test(url) && /^https?:\/\//.test(url)) {
        void shell.openExternal(url)
      }
      console.log(url)
      return { action: 'deny' }
    })
    contents.on('will-attach-webview', (event, webPreferences, params) => {
      // Strip away preload scripts if unused or verify their location is legitimate
      delete webPreferences.preload
      // delete webPreferences.preloadURL

      // Disable Node.js integration
      webPreferences.nodeIntegration = false

      // Verify URL being loaded
      if (!navigationUrlWhiteList.some(url => url.test(params.src))) {
        event.preventDefault()
      }
    })

    // disable create dictionary
    // https://github.com/lyswhut/lx-music-desktop/issues/773
    contents.session.setSpellCheckerDictionaryDownloadURL('http://0.0.0.0')
  })

  app.on('activate', () => {
    if (isExistMainWindow()) {
      showMainWindow()
    } else {
      startApp()
    }
  })

  app.on('before-quit', () => {
    global.lx.isSkipTrayQuit = true
  })
  app.on('window-all-closed', () => {
    if (isMac) return

    app.quit()
  })

  const initScreenParams = () => {
    global.envParams.workAreaSize = screen.getPrimaryDisplay().workAreaSize
  }
  app.on('ready', () => {
    screen.on('display-metrics-changed', initScreenParams)
    initScreenParams()
  })

  nativeTheme.addListener('updated', () => {
    const shouldUseDarkColors = nativeTheme.shouldUseDarkColors
    if (shouldUseDarkColors == global.lx.theme.shouldUseDarkColors) return
    global.lx.theme.shouldUseDarkColors = shouldUseDarkColors
    global.lx?.event_app.system_theme_change(shouldUseDarkColors)
  })
}

const initTheme = () => {
  global.lx.theme = getTheme()
  const themeConfigKeys = ['theme.id', 'theme.lightId', 'theme.darkId']
  global.lx.event_app.on('updated_config', (keys) => {
    let requireUpdate = false
    for (const key of keys) {
      if (themeConfigKeys.includes(key)) {
        requireUpdate = true
        break
      }
    }
    if (requireUpdate) {
      global.lx.theme = getTheme()
      global.lx.event_app.theme_change()
    }
  })
  global.lx.event_app.on('system_theme_change', () => {
    if (global.lx.appSetting['theme.id'] == 'auto') {
      global.lx.theme = getTheme()
      global.lx.event_app.theme_change()
    }
  })
}

let isInitialized = false
export const initAppSetting = async() => {
  if (!global.lx.inited) {
    const config = await initHotKey()
    global.lx.hotKey.config.local = config.local
    global.lx.hotKey.config.global = config.global
    global.lx.inited = true
  }

  if (!isInitialized) {
    let dbFileExists = await global.lx.worker.dbService.init(global.lxDataPath)
    if (dbFileExists === null) {
      const backPath = path.join(global.lxDataPath, `lx.data.db.${Date.now()}.bak`)
      dialog.showMessageBoxSync({
        type: 'warning',
        message: 'Database verify failed',
        detail: `数据库表结构校验失败，我们将把有问题的数据库备份到：${backPath}\n若此问题导致你的数据丢失，你可以尝试从备份文件找回它们。\n\nThe database table structure verification failed, we will back up the problematic database to: ${backPath}\nIf this problem causes your data to be lost, you can try to retrieve them from the backup file.`,
      })
      renameSync(path.join(global.lxDataPath, 'lx.data.db'), backPath)
      openDirInExplorer(backPath)
      dbFileExists = await global.lx.worker.dbService.init(global.lxDataPath)
    }
    global.lx.appSetting = (await initSetting()).setting
    if (!dbFileExists) await migrateDBData().catch(err => { log.error(err) })
    initTheme()
  }
  // global.lx.theme = getTheme()

  isInitialized ||= true
}

export const quitApp = () => {
  global.lx.isSkipTrayQuit = true
  app.quit()
}
