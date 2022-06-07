const { app, BrowserWindow, shell, nativeTheme } = require('electron')
const path = require('path')

const urlSchemeRxp = /^lxmusic:\/\//

// 单例应用程序
if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}
if (!global.modules) global.modules = {}
app.on('second-instance', (event, argv, cwd) => {
  for (const param of argv) {
    if (urlSchemeRxp.test(param)) {
      global.envParams.deeplink = param
      break
    }
  }

  if (global.modules.mainWindow) {
    if (global.modules.mainWindow.isMinimized()) {
      global.modules.mainWindow.restore()
    }
    if (global.modules.mainWindow.isVisible()) {
      global.modules.mainWindow.focus()
    } else {
      global.modules.mainWindow.show()
    }
  } else {
    app.quit()
  }
})

// windows平台下如果应用目录下存在 portable 文件夹则将数据存在此文件下
if (process.platform === 'win32') {
  const fs = require('fs')
  const portablePath = path.join(path.dirname(app.getPath('exe')), '/portable')
  if (fs.existsSync(portablePath)) {
    app.setPath('appData', portablePath)
    const appDataPath = path.join(portablePath, '/userData')
    if (!fs.existsSync(appDataPath)) fs.mkdirSync(appDataPath)
    app.setPath('userData', appDataPath)
  }
}

const isDev = global.isDev = process.env.NODE_ENV !== 'production'
require('./env')
// console.log(global.envParams.cmdParams)

// Is disable hardware acceleration
if (global.envParams.cmdParams.dha) app.disableHardwareAcceleration()

if (global.envParams.cmdParams.dt == null && global.envParams.cmdParams.nt != null) global.envParams.cmdParams.dt = global.envParams.cmdParams.nt
if (global.envParams.cmdParams.dhmkh) app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling')
// fix linux transparent fail. https://github.com/electron/electron/issues/25153#issuecomment-843688494
if (process.platform == 'linux') app.commandLine.appendSwitch('use-gl', 'desktop')

// https://github.com/electron/electron/issues/22691
app.commandLine.appendSwitch('wm-window-animations-disabled')

// proxy
if (global.envParams.cmdParams['proxy-server']) {
  app.commandLine.appendSwitch('proxy-server', global.envParams.cmdParams['proxy-server'])
  app.commandLine.appendSwitch('proxy-bypass-list', global.envParams.cmdParams['proxy-bypass-list'] ?? '<local>')
}
// if (global.envParams.cmdParams['proxy-pac-url']) app.commandLine.appendSwitch('proxy-pac-url', global.envParams.cmdParams['proxy-pac-url'])

// deep link
app.on('open-url', (event, url) => {
  if (!urlSchemeRxp.test(url)) return
  event.preventDefault()
  global.envParams.deeplink = url
  if (global.modules.mainWindow) {
    if (global.modules.mainWindow.isMinimized()) {
      global.modules.mainWindow.restore()
    }
    if (global.modules.mainWindow.isVisible()) {
      global.modules.mainWindow.focus()
    } else {
      global.modules.mainWindow.show()
    }
  } else if (global.modules.mainWindow === null) {
    init()
  }
})
if (isDev && process.platform === 'win32') {
  // Set the path of electron.exe and your app.
  // These two additional parameters are only available on windows.
  // console.log(process.execPath, process.argv)
  app.setAsDefaultProtocolClient('lxmusic', process.execPath, process.argv.slice(1))
} else {
  app.setAsDefaultProtocolClient('lxmusic')
}

const { navigationUrlWhiteList, themes } = require('../common/config')
const { getWindowSizeInfo, initSetting, updateSetting } = require('./utils')
const { isMac, isLinux, initHotKey } = require('../common/utils')


// https://github.com/electron/electron/issues/18397
// 开发模式下为true时 多次引入native模块会导致渲染进程卡死
// https://github.com/electron/electron/issues/22791
// app.allowRendererProcessReuse = !isDev


app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    if (isDev) return console.log('navigation to url:', navigationUrl)
    if (!navigationUrlWhiteList.some(url => url.test(navigationUrl))) return event.preventDefault()
    console.log('navigation to url:', navigationUrl)
  })
  contents.setWindowOpenHandler(({ url }) => {
    if (!/^devtools/.test(url) && /^https?:\/\//.test(url)) {
      shell.openExternal(url)
    }
    console.log(url)
    return { action: 'deny' }
  })
  contents.on('will-attach-webview', (event, webPreferences, params) => {
    // Strip away preload scripts if unused or verify their location is legitimate
    delete webPreferences.preload
    delete webPreferences.preloadURL

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


require('../common/error')
require('./events')
require('./event')
require('./rendererEvents')
const winEvent = require('./rendererEvents/winEvent')
const autoUpdate = require('./utils/autoUpdate')


let winURL

if (isDev) {
  // eslint-disable-next-line no-undef
  global.__static = __static
  winURL = 'http://localhost:9080'
} else {
  global.__static = path.join(__dirname, '/static')
  winURL = `file://${path.join(__dirname, 'index.html')}`
}

function createWindow() {
  const windowSizeInfo = getWindowSizeInfo(global.appSetting)
  /**
   * Initial window options
   */
  const options = {
    height: windowSizeInfo.height,
    useContentSize: true,
    width: windowSizeInfo.width,
    frame: false,
    transparent: !global.envParams.cmdParams.dt,
    enableRemoteModule: false,
    // icon: path.join(global.__static, isWin ? 'icons/256x256.ico' : 'icons/512x512.png'),
    resizable: false,
    maximizable: false,
    fullscreenable: true,
    show: false,
    webPreferences: {
      contextIsolation: false,
      webSecurity: !isDev,
      nodeIntegration: true,
      spellcheck: false, // 禁用拼写检查器
    },
  }
  if (global.appSetting.startInFullscreen) {
    options.fullscreen = true
    if (isLinux) options.resizable = true
  }
  global.modules.mainWindow = new BrowserWindow(options)

  const shouldUseDarkColors = nativeTheme.shouldUseDarkColors
  const themeId = global.appSetting.theme.id == 'auto'
    ? shouldUseDarkColors
      ? global.appSetting.theme.darkId
      : global.appSetting.theme.lightId
    : global.appSetting.theme.id
  const themeClass = themes.find(t => t.id == themeId)?.className ?? themes[0].className
  global.modules.mainWindow.loadURL(winURL + `?dt=${!!global.envParams.cmdParams.dt}&dark=${shouldUseDarkColors}&theme=${themeClass}`)

  winEvent(global.modules.mainWindow)
  if (global.envParams.cmdParams.odt) require('@main/utils').openDevTools(global.modules.mainWindow.webContents)
  // global.modules.mainWindow.webContents.openDevTools()

  if (!isDev) autoUpdate()
}

global.appHotKey = {
  enable: true,
  config: {},
  state: null,
}

global.lx_core = {
  setAppConfig(setting, name) {
    updateSetting(setting)
    global.lx_event.common.configStatus(name)
  },
}

function init() {
  console.log('init')
  initSetting()
  global.appHotKey.config = initHotKey()
  global.lx_event.common.initSetting()
  global.lx_event.hotKey.init()
  createWindow()
}

// https://github.com/electron/electron/issues/16809
app.on('ready', isLinux ? () => setTimeout(init, 300) : init)

app.on('activate', () => {
  if (global.modules.mainWindow) {
    if (global.modules.mainWindow.isMinimized()) {
      global.modules.mainWindow.restore()
    } else if (global.modules.mainWindow.isVisible()) {
      global.modules.mainWindow.focus()
    } else {
      global.modules.mainWindow.show()
    }
  } else if (global.modules.mainWindow === null) {
    init()
  }
})

app.on('window-all-closed', () => {
  if (isMac) {
    global.lx_event.tray.destroy()
  } else {
    app.quit()
  }
})

require('./modules')
