const { BrowserView } = require('electron')
const { mainHandle, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../../common/ipc')
const { getWindowSizeInfo } = require('../../utils')

let view
let isActioned = false
let rejectFn

const closeView = async() => {
  if (!view) return
  // await view.webContents.session.clearCache()
  if (global.modules.mainWindow) global.modules.mainWindow.removeBrowserView(view)
  await view.webContents.session.clearStorageData()
  view.destroy()
  view = null
}

mainHandle(ipcMainWindowNames.handle_xm_verify_open, (event, url) => new Promise((resolve, reject) => {
  if (!global.modules.mainWindow) return reject(new Error('mainWindow is undefined'))
  if (view) {
    global.modules.mainWindow.removeBrowserView(view)
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
  // view.webContents.on('did-finish-load', () => {
  //   if (/punish\?/.test(view.webContents.getURL())) return
  //   let ses = view.webContents.session
  //   ses.cookies.get({ name: 'x5sec' })
  //     .then(async([x5sec]) => {
  //       isActioned = true
  //       await closeView()
  //       if (!x5sec) return reject(new Error('get x5sec failed'))
  //       resolve(x5sec.value)
  //     }).catch(async err => {
  //       isActioned = true
  //       await closeView()
  //       reject(err)
  //     })
  // })
  view.webContents.session.webRequest.onCompleted({ urls: ['*://www.xiami.com/*'] }, details => {
    if (/\/_____tmd_____\/slide\?/.test(details.url)) {
      for (const item of details.responseHeaders['set-cookie']) {
        if (!/^x5sec=/.test(item)) continue
        const x5sec = /x5sec=(\w+);.+$/.exec(item)
        isActioned = true
        closeView().finally(() => {
          if (!x5sec) return reject(new Error('get x5sec failed'))
          resolve(x5sec[1])
        })
      }
    }
  })
  // console.log(url)
  global.modules.mainWindow.setBrowserView(view)
  const windowSizeInfo = getWindowSizeInfo(global.appSetting)
  view.setBounds({ x: (windowSizeInfo.width - 380) / 2, y: ((windowSizeInfo.height - 320 + 52) / 2), width: 380, height: 320 })
  view.webContents.loadURL(url, {
    httpReferrer: 'https://www.xiami.com/',
  })
  // view.webContents.openDevTools()
}))

mainHandle(ipcMainWindowNames.handle_xm_verify_close, async() => {
  await closeView()
  if (!rejectFn) return
  if (!isActioned) rejectFn(new Error('canceled verify'))
  rejectFn = null
})

