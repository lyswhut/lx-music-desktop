import { join, dirname } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { app, shell, screen, nativeTheme } from 'electron'
import { URL_SCHEME_RXP } from '@common/constants'
import { getTheme, initHotKey, initSetting, parseEnvParams } from './utils'
import { navigationUrlWhiteList } from '@common/config'
import defaultSetting from '@common/defaultSetting'
import { closeWindow, isExistWindow as isExistMainWindow, showWindow as showMainWindow } from './modules/winMain'
import { createAppEvent, createListEvent } from '@main/event'
import { isMac, log } from '@common/utils'
import createWorkers from './worker'
import { migrateDBData } from './utils/migrate'

export const initGlobalData = () => {
  global.isDev = process.env.NODE_ENV !== 'production'
  const envParams = parseEnvParams()
  global.envParams = {
    cmdParams: envParams.cmdParams,
    deeplink: envParams.deeplink,
  }

  if (global.isDev) {
    // eslint-disable-next-line no-undef
    global.staticPath = webpackStaticPath
  } else {
    global.staticPath = join(__dirname, '/static')
  }
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
    const portablePath = join(dirname(app.getPath('exe')), '/portable')
    if (existsSync(portablePath)) {
      app.setPath('appData', portablePath)
      const appDataPath = join(portablePath, '/userData')
      if (!existsSync(appDataPath)) mkdirSync(appDataPath)
      app.setPath('userData', appDataPath)
    }
  }

  const userDataPath = app.getPath('userData')
  global.lxOldDataPath = userDataPath
  global.lxDataPath = join(userDataPath, 'LxDatas')
  if (!existsSync(global.lxDataPath)) mkdirSync(global.lxDataPath)
}

export const registerDeeplink = (startApp: () => void) => {
  if (global.isDev && process.platform === 'win32') {
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
      if (global.isDev) return console.log('navigation to url:', navigationUrl)
      if (!navigationUrlWhiteList.some(url => url.test(navigationUrl))) return event.preventDefault()
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

  nativeTheme.addListener('updated', (event: any) => {
    const themeInfo: Electron.NativeTheme = event.sender
    global.lx?.event_app.system_theme_change(themeInfo.shouldUseDarkColors)
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
  if (!global.lx) {
    const config = await initHotKey()
    global.lx = {
      isTrafficLightClose: false,
      isSkipTrayQuit: false,
      // mainWindowClosed: true,
      event_app: createAppEvent(),
      event_list: createListEvent(),
      appSetting: defaultSetting,
      worker: createWorkers(),
      hotKey: {
        enable: true,
        config: {
          local: config.local,
          global: config.global,
        },
        state: new Map(),
      },
      theme: {
        shouldUseDarkColors: false,
        theme: {
          id: '',
          name: '',
          isDark: false,
          colors: {},
        },
      },
    }
  }

  if (!isInitialized) {
    const dbFileExists = await global.lx.worker.dbService.init(global.lxDataPath)
    global.lx.appSetting = (await initSetting()).setting
    if (!dbFileExists) await migrateDBData().catch(err => log.error(err))
    initTheme()
  }
  // global.lx.theme = getTheme()

  isInitialized = true
}

export const quitApp = () => {
  global.lx.isSkipTrayQuit = true
  closeWindow()
}
