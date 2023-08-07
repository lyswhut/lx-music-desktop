import { Tray, Menu, nativeImage } from 'electron'
import { isWin } from '@common/utils'
import path from 'node:path'
import {
  hideWindow as hideMainWindow,
  isExistWindow as isExistMainWindow,
  isShowWindow as isShowMainWindow,
  showWindow as showMainWindow,
} from './winMain'
import { quitApp } from '@main/app'

let tray: Electron.Tray | null
let isEnableTray: boolean = false
let themeId: number

const watchConfigKeys = [
  'desktopLyric.enable',
  'desktopLyric.isLock',
  'desktopLyric.isAlwaysOnTop',
  'tray.themeId',
  'tray.enable',
] as const

const themeList = [
  {
    id: 0,
    fileName: 'trayTemplate',
    isNative: true,
  },
  {
    id: 1,
    fileName: 'tray_origin',
    isNative: false,
  },
  {
    id: 2,
    fileName: 'tray_black',
    isNative: false,
  },
]

export const createTray = () => {
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  if ((tray && !tray.isDestroyed()) || !global.lx.appSetting['tray.enable']) return

  themeId = global.lx.appSetting['tray.themeId']
  let theme = themeList.find(item => item.id === themeId) ?? themeList[0]
  const iconPath = path.join(global.staticPath, 'images/tray', theme.fileName + '.png')

  // 托盘
  tray = new Tray(nativeImage.createFromPath(iconPath))

  tray.setToolTip('洛雪音乐助手')
  createMenu()
  tray.setIgnoreDoubleClickEvents(true)
  tray.on('click', () => {
    showMainWindow()
  })
}

export const destroyTray = () => {
  if (!tray) return
  tray.destroy()
  isEnableTray = false
  tray = null
}

const handleUpdateConfig = (config: any) => {
  global.lx.event_app.update_config(config)
}

export const createMenu = () => {
  if (!tray) return
  let menu = []
  if (isExistMainWindow()) {
    const isShow = isShowMainWindow()
    menu.push(isShow
      ? {
          label: '隐藏主界面',
          click() {
            hideMainWindow()
          },
        }
      : {
          label: '显示主界面',
          click() {
            showMainWindow()
          },
        })
  }
  menu.push(global.lx.appSetting['desktopLyric.enable']
    ? {
        label: '关闭桌面歌词',
        click() {
          handleUpdateConfig({ 'desktopLyric.enable': false })
        },
      }
    : {
        label: '开启桌面歌词',
        click() {
          handleUpdateConfig({ 'desktopLyric.enable': true })
        },
      })
  menu.push(global.lx.appSetting['desktopLyric.isLock']
    ? {
        label: '解锁桌面歌词',
        click() {
          handleUpdateConfig({ 'desktopLyric.isLock': false })
        },
      }
    : {
        label: '锁定桌面歌词',
        click() {
          handleUpdateConfig({ 'desktopLyric.isLock': true })
        },
      })
  menu.push(global.lx.appSetting['desktopLyric.isAlwaysOnTop']
    ? {
        label: '取消置顶',
        click() {
          handleUpdateConfig({ 'desktopLyric.isAlwaysOnTop': false })
        },
      }
    : {
        label: '置顶歌词',
        click() {
          handleUpdateConfig({ 'desktopLyric.isAlwaysOnTop': true })
        },
      })
  menu.push({
    label: '退出',
    click() {
      quitApp()
    },
  })
  const contextMenu = Menu.buildFromTemplate(menu)
  tray.setContextMenu(contextMenu)
}

export const setTrayImage = (themeId: number) => {
  if (!tray) return
  let theme = themeList.find(item => item.id === themeId) ?? themeList[0]
  const iconPath = path.join(global.staticPath, 'images/tray', theme.fileName + '.png')
  tray.setImage(nativeImage.createFromPath(iconPath))
}

const init = () => {
  if (themeId != global.lx.appSetting['tray.themeId']) {
    themeId = global.lx.appSetting['tray.themeId']
    setTrayImage(themeId)
  }
  if (isEnableTray !== global.lx.appSetting['tray.enable']) {
    isEnableTray = global.lx.appSetting['tray.enable']
    global.lx.appSetting['tray.enable'] ? createTray() : destroyTray()
  }
  createMenu()
}

export default () => {
  global.lx.event_app.on('updated_config', (keys) => {
    if (!watchConfigKeys.some(key => keys.includes(key))) return
    init()
  })

  global.lx.event_app.on('main_window_ready_to_show', () => {
    createMenu()
  })
  global.lx.event_app.on('main_window_show', () => {
    createMenu()
  })
  if (!isWin) {
    global.lx.event_app.on('main_window_focus', () => {
      createMenu()
    })
    global.lx.event_app.on('main_window_blur', () => {
      createMenu()
    })
  }
  global.lx.event_app.on('main_window_hide', () => {
    createMenu()
  })
  global.lx.event_app.on('main_window_close', () => {
    destroyTray()
  })

  global.lx.event_app.on('app_inited', () => {
    init()
  })
}
