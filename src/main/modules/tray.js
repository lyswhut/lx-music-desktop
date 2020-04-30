const { app, Tray, Menu } = require('electron')
const { isWin } = require('../../common/utils')
const { tray: TRAY_EVENT_NAME } = require('../events/_name')
const path = require('path')
global.lx_event.tray.on(TRAY_EVENT_NAME.create, () => {
  createTray()
})
global.lx_event.tray.on(TRAY_EVENT_NAME.destroy, () => {
  destroyTray()
})

let tray
function createTray() {
  if ((tray && !tray.isDestroyed()) || !global.appSetting.tray || !global.appSetting.tray.isShow) return

  const iconPath = path.join(global.__static, 'images/tray', isWin ? 'trayTemplate.ico' : 'trayTemplate.png')

  // 托盘
  tray = new Tray(iconPath)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '退出',
      click() {
        global.isQuitting = true
        app.quit()
      },
    },
  ])
  tray.setToolTip('洛雪音乐助手')
  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    const mainWindow = global.mainWindow
    if (!mainWindow) return
    mainWindow.isVisible()
      ? mainWindow.focus()
      : mainWindow.show()
  })
  tray.on('double-click', () => {
    const mainWindow = global.mainWindow
    if (!mainWindow) return
    mainWindow.isVisible()
      ? mainWindow.focus()
      : mainWindow.show()
  })
}

function destroyTray() {
  if (!tray) return
  tray.destroy()
  tray = null
}
