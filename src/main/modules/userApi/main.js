const { BrowserWindow } = require('electron')
const fs = require('fs')
const path = require('path')

// eslint-disable-next-line no-undef
const dir = global.isDev ? __userApi : path.join(__dirname, 'userApi')

const wait = time => new Promise(resolve => setTimeout(() => resolve(), time))

let html = ''

fs.readFile(path.join(dir, 'renderer/user-api.html'), 'utf8', (err, data) => {
  if (err) throw new Error('api html read failed, info: ' + err.message)
  html = data
})

const denyEvents = [
  'will-navigate',
  'will-redirect',
  'will-attach-webview',
  'will-prevent-unload',
  'media-started-playing',
]

const winEvent = win => {
  win.on('closed', () => {
    win = global.modules.userApiWindow = null
  })
}

exports.createWindow = async userApi => {
  if (global.modules.userApiWindow) return
  while (true) {
    if (html) break
    await wait(100)
  }
  /**
   * Initial window options
   */
  global.modules.userApiWindow = new BrowserWindow({
    enableRemoteModule: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    webPreferences: {
      contextIsolation: true,
      // worldSafeExecuteJavaScript: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,

      spellcheck: false,
      autoplayPolicy: 'document-user-activation-required',
      enableWebSQL: false,
      disableDialogs: true,
      nativeWindowOpen: false,
      webgl: false,
      images: false,

      preload: path.join(dir, 'renderer/preload.js'),
    },
  })

  for (const eventName of denyEvents) {
    global.modules.userApiWindow.webContents.on(eventName, event => {
      event.preventDefault()
    })
  }
  global.modules.userApiWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    // eslint-disable-next-line node/no-callback-literal
    callback(false)
  })
  global.modules.userApiWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' }
  })

  winEvent(global.modules.userApiWindow)

  // console.log(html.replace('</body>', `<script>${userApi.script}</script></body>`))
  const randomNum = Math.random().toString().substring(2, 10)
  global.modules.userApiWindow.loadURL(
    'data:text/html;charset=UTF-8,' + encodeURIComponent(html
      .replace('<meta http-equiv="Content-Security-Policy" content="default-src \'none\'">',
        `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${randomNum}';">`)
      .replace('</body>', `<script nonce="${randomNum}">${userApi.script}</script></body>`)))

  // global.modules.userApiWindow.loadFile(path.join(dir, 'renderer/user-api.html'))
  // global.modules.userApiWindow.webContents.openDevTools()
}

exports.closeWindow = async() => {
  if (!global.modules.userApiWindow) return
  await Promise.all([
    global.modules.userApiWindow.webContents.session.clearAuthCache(),
    global.modules.userApiWindow.webContents.session.clearStorageData(),
    global.modules.userApiWindow.webContents.session.clearCache(),
  ])
  global.modules.userApiWindow.destroy()
  global.modules.userApiWindow = null
}
