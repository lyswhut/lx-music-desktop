const { app, BrowserWindow } = require('electron')
const path = require('path')

// 单例应用程序
if (!app.requestSingleInstanceLock()) {
  app.quit()
  return
}
app.on('second-instance', (event, argv, cwd) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  } else {
    app.quit()
  }
})

const isDev = global.isDev = process.env.NODE_ENV !== 'production'

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

let mainWindow
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
  mainWindow = global.mainWindow = new BrowserWindow({
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
    webPreferences: {
      // contextIsolation: true,
      webSecurity: !isDev,
      nodeIntegration: true,
    },
  })

  mainWindow.loadURL(winURL)

  winEvent(mainWindow)
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
  if (mainWindow === null) return init()
})

app.on('window-all-closed', () => {
  if (isMac) {
    global.lx_event.tray.destroy()
  } else {
    app.quit()
  }
})

require('./modules')
