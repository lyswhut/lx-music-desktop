const { app, BrowserWindow, Menu } = require('electron')
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

const isDev = process.env.NODE_ENV !== 'production'

// https://github.com/electron/electron/issues/18397
app.allowRendererProcessReuse = !isDev

const { getWindowSizeInfo, parseEnv } = require('./utils')

global.envParams = parseEnv()

require('../common/error')
require('./events')
const winEvent = require('./events/winEvent')
const autoUpdate = require('./utils/autoUpdate')
const { isLinux, isMac } = require('../common/utils')


let mainWindow
let winURL
let isFirstCheckedUpdate = true

if (isDev) {
  global.__static = path.join(__dirname, '../static')
  winURL = 'http://localhost:9080'
} else {
  global.__static = path.join(__dirname, '/static')
  winURL = `file://${__dirname}/index.html`
}

function createWindow() {
  let windowSizeInfo = getWindowSizeInfo()
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

  if (!isDev) {
    autoUpdate(isFirstCheckedUpdate)
    isFirstCheckedUpdate = false
  }
}

if (isMac) {
  const template = [
    {
      label: app.getName(),
      submenu: [
        { label: '关于洛雪音乐', role: 'about' },
        { type: 'separator' },
        { label: '隐藏', role: 'hide' },
        { label: '显示其他', role: 'hideothers' },
        { label: '显示全部', role: 'unhide' },
        { type: 'separator' },
        { label: '退出', accelerator: 'Command+Q', click: () => app.quit() },
      ],
    },
    {
      label: '窗口',
      role: 'window',
      submenu: [
        { label: '最小化', role: 'minimize' },
        { label: '关闭', role: 'close' },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '恢复', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '选择全部', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
      ],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
} else {
  Menu.setApplicationMenu(null)
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (!isMac) app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
