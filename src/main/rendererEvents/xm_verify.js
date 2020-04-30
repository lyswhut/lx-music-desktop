const { BrowserView } = require('electron')
const { mainHandle } = require('../../common/ipc')
const { getWindowSizeInfo } = require('../utils')

let view

const closeView = async() => {
  if (!view) return
  // await view.webContents.session.clearCache()
  if (global.mainWindow) global.mainWindow.removeBrowserView(view)
  await view.webContents.session.clearStorageData()
  view.destroy()
  view = null
}

mainHandle('xm_verify_open', (event, url) => new Promise((resolve, reject) => {
  if (!global.mainWindow) return reject(new Error('mainwindow is undefined'))
  if (view) {
    global.mainWindow.removeBrowserView(view)
    view.destroy()
  }

  view = new BrowserView({
    webPreferences: {
      enableRemoteModule: false,
      disableHtmlFullscreenWindowResize: true,
    },
    movable: false,
  })
  view.webContents.on('did-finish-load', () => {
    if (/punish\?/.test(view.webContents.getURL())) return
    let ses = view.webContents.session
    ses.cookies.get({ name: 'x5sec' })
      .then(async([x5sec]) => {
        await closeView()
        if (!x5sec) return reject(new Error('get x5sec failed'))
        resolve(x5sec.value)
      }).catch(async err => {
        await closeView()
        reject(err)
      })
  })
  global.mainWindow.setBrowserView(view)
  const windowSizeInfo = getWindowSizeInfo(global.appSetting)
  view.setBounds({ x: (windowSizeInfo.width - 360) / 2, y: ((windowSizeInfo.height - 320 + 52) / 2), width: 360, height: 320 })
  view.webContents.loadURL(url, {
    httpReferrer: 'https://www.xiami.com/',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.165 Electron/8.2.4 Safari/537.36',
  })
  view.webContents.openDevTools()
}))

mainHandle('xm_verify_close', async() => {
  await closeView()
})

