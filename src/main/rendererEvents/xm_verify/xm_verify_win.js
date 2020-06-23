const { BrowserWindow } = require('electron')
const { mainHandle, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../../common/ipc')
const { getWindowSizeInfo } = require('../../utils')

let win

const closeWin = async() => {
  if (!win) return
  // await win.webContents.session.clearCache()
  // if (global.modules.mainWindow) global.modules.mainWindow.removeBrowserView(win)
  if (win.isDestroyed()) {
    win = null
    return
  }
  await win.webContents.session.clearStorageData()
  win.destroy()
  win = null
}

mainHandle(ipcMainWindowNames.handle_xm_verify_open, (event, url) => new Promise((resolve, reject) => {
  if (!global.modules.mainWindow) return reject(new Error('mainWindow is undefined'))
  if (win) win.destroy()

  let isActioned = false

  const mainWindowSizeInfo = global.modules.mainWindow.getBounds()
  const windowSizeInfo = getWindowSizeInfo(global.appSetting)
  win = new BrowserWindow({
    parent: global.modules.mainWindow,
    width: 460,
    height: 370,
    resizable: false,
    // transparent: true,
    x: mainWindowSizeInfo.x + (windowSizeInfo.width - 460) / 2,
    y: mainWindowSizeInfo.y + (windowSizeInfo.height - 320 + 52) / 2,
    minimizable: false,
    maximizable: false,
    // movable: false,
    // frame: false,
    // modal: true,
    webPreferences: {
      enableRemoteModule: false,
      disableHtmlFullscreenWindowResize: true,
    },
  })
  win.webContents.on('did-finish-load', () => {
    if (/punish\?/.test(win.webContents.getURL())) return
    let ses = win.webContents.session
    ses.cookies.get({ name: 'x5sec' })
      .then(async([x5sec]) => {
        isActioned = true
        await closeWin()
        if (!x5sec) return reject(new Error('get x5sec failed'))
        resolve(x5sec.value)
      }).catch(async err => {
        isActioned = true
        await closeWin()
        reject(err)
      })
  })

  win.webContents.loadURL(url, {
    httpReferrer: 'https://www.xiami.com/',
  })

  win.on('closed', async() => {
    await closeWin()
    if (isActioned) return
    reject(new Error('canceled verify'))
  })

  // win.webContents.openDevTools()
}))

mainHandle(ipcMainWindowNames.handle_xm_verify_close, async() => {
  await closeWin()
})
