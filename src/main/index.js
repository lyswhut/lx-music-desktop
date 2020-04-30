const { app, BrowserWindow, shell } = require('electron')
const path = require('path')

// 单例应用程序
if (!app.requestSingleInstanceLock()) {
  app.quit()
  return
}
app.on('second-instance', (event, argv, cwd) => {
  if (global.mainWindow) {
    if (global.mainWindow.isMinimized()) {
      global.mainWindow.restore()
    } else if (global.mainWindow.isVisible()) {
      global.mainWindow.focus()
    } else {
      global.mainWindow.show()
    }
  } else {
    app.quit()
  }
})

const isDev = global.isDev = process.env.NODE_ENV !== 'production'
const { navigationUrlWhiteList } = require('../common/config')

app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    if (isDev) return console.log('navigation to url:', navigationUrl)
    if (!navigationUrlWhiteList.some(url => url.test(navigationUrl))) return event.preventDefault()
    console.log('navigation to url:', navigationUrl)
  })
  contents.on('new-window', async(event, navigationUrl) => {
    event.preventDefault()
    if (/^devtools/.test(navigationUrl)) return
    console.log(navigationUrl)
    await shell.openExternal(navigationUrl)
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
})

// https://github.com/electron/electron/issues/22691
app.commandLine.appendSwitch('wm-window-animations-disabled')

// https://github.com/electron/electron/issues/18397
app.allowRendererProcessReuse = !isDev

const { getAppSetting, parseEnv, getWindowSizeInfo } = require('./utils')

global.envParams = parseEnv()

require('../common/error')
require('./events')
require('./rendererEvents')
const winEvent = require('./rendererEvents/winEvent')
const autoUpdate = require('./utils/autoUpdate')
const { isMac, isLinux } = require('../common/utils')


let winURL

if (isDev) {
  // eslint-disable-next-line no-undef
  global.__static = __static
  winURL = 'http://localhost:9080'
} else {
  global.__static = path.join(__dirname, '/static')
  winURL = `file://${__dirname}/index.html`
}

function createWindow() {
  const windowSizeInfo = getWindowSizeInfo(global.appSetting)
  /**
   * Initial window options
   */
  global.mainWindow = new BrowserWindow({
    height: windowSizeInfo.height,
    useContentSize: true,
    width: windowSizeInfo.width,
    frame: false,
    transparent: !isLinux && !global.envParams.nt,
    enableRemoteModule: false,
    // icon: path.join(global.__static, isWin ? 'icons/256x256.ico' : 'icons/512x512.png'),
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    webPreferences: {
      // contextIsolation: true,
      webSecurity: !isDev,
      nodeIntegration: true,
    },
  })

  global.mainWindow.loadURL(winURL)

  winEvent(global.mainWindow)
  // mainWindow.webContents.openDevTools()

  if (!isDev) autoUpdate()
}

function init() {
  global.appSetting = getAppSetting()
  createWindow()
  global.lx_event.tray.create()
}

app.on('ready', init)

app.on('activate', () => {
  if (global.mainWindow) {
    if (global.mainWindow.isMinimized()) {
      global.mainWindow.restore()
    } else if (global.mainWindow.isVisible()) {
      global.mainWindow.focus()
    } else {
      global.mainWindow.show()
    }
  } else if (global.mainWindow === null) {
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
