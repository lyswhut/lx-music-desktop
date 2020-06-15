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

const createTray = () => {
  if ((global.tray && !global.tray.isDestroyed()) || !global.appSetting.tray || !global.appSetting.tray.isShow) return

  const iconPath = path.join(global.__static, 'images/tray', isWin ? 'trayTemplate@2x.ico' : 'trayTemplate.png')

  // 托盘
  global.tray = new Tray(iconPath)

  global.tray.setToolTip('洛雪音乐助手')
  if (isWin) createMenu(global.tray)
  global.tray.setIgnoreDoubleClickEvents(true)
  global.tray.on('click', () => {
    const mainWindow = global.mainWindow
    if (!mainWindow) return
    mainWindow.isVisible()
      ? mainWindow.focus()
      : mainWindow.show()
  })
}

const destroyTray = () => {
  if (!global.tray) return
  global.tray.destroy()
  global.tray = null
}

const createMenu = tray => {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '退出',
      click() {
        global.isQuitting = true
        app.quit()
      },
    },
  ])
  tray.setContextMenu(contextMenu)
}

