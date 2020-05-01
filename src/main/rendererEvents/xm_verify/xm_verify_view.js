const { BrowserView } = require('electron')
const { mainHandle } = require('../../../common/ipc')
const { getWindowSizeInfo } = require('../../utils')

let view
let isActioned = false
let rejectFn

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

  rejectFn = reject

  isActioned = false

  view = new BrowserView({
    webPreferences: {
      enableRemoteModule: false,
      disableHtmlFullscreenWindowResize: true,
    },
  })
  view.webContents.on('did-finish-load', () => {
    if (/punish\?/.test(view.webContents.getURL())) return
    let ses = view.webContents.session
    ses.cookies.get({ name: 'x5sec' })
      .then(async([x5sec]) => {
        isActioned = true
        await closeView()
        if (!x5sec) return reject(new Error('get x5sec failed'))
        resolve(x5sec.value)
      }).catch(async err => {
        isActioned = true
        await closeView()
        reject(err)
      })
  })

  global.mainWindow.setBrowserView(view)
  const windowSizeInfo = getWindowSizeInfo(global.appSetting)
  view.setBounds({ x: (windowSizeInfo.width - 380) / 2, y: ((windowSizeInfo.height - 320 + 52) / 2), width: 380, height: 320 })
  view.webContents.loadURL(url, {
    httpReferrer: 'https://www.xiami.com/',
  })
  // view.webContents.openDevTools()
}))

mainHandle('xm_verify_close', async() => {
  await closeView()
  if (!rejectFn) return
  if (!isActioned) rejectFn(new Error('canceled verify'))
  rejectFn = null
})

