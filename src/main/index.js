const { app, BrowserWindow } = require('electron')
const path = require('path')

require('./events')
const progressBar = require('./events/progressBar')
const trafficLight = require('./events/trafficLight')
const autoUpdate = require('./utils/autoUpdate')

const isDev = process.env.NODE_ENV !== 'production'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */

let mainWindow
let winURL

if (isDev) {
  global.__static = path.join(__dirname, '../static')
  winURL = `http://localhost:9080`
} else {
  global.__static = path.join(__dirname, '/static')
  winURL = `file://${__dirname}/index.html`
}

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 590,
    useContentSize: true,
    width: 920,
    frame: false,
    transparent: true,
    icon: path.join(global.__static, 'icons/lunch.ico'),
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

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // mainWindow.webContents.openDevTools()

  trafficLight(mainWindow)
  progressBar(mainWindow)
  if (!isDev) autoUpdate(mainWindow)
}

app.once('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

