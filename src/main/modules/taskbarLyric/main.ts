import path from 'node:path'
import { BrowserWindow, screen } from 'electron'
import { encodePath } from '@common/utils/electron'
import type { TaskbarLyricState } from './types'
import { calcTaskbarLyricBounds } from './utils'

const TASKBAR_LYRIC_HEIGHT = 56

let browserWindow: Electron.BrowserWindow | null = null
let currentState: TaskbarLyricState | null = null

const getWindowBounds = () => {
  const display = screen.getPrimaryDisplay()
  return calcTaskbarLyricBounds({
    display: {
      ...display.bounds,
      workArea: display.workArea,
    },
    width: global.lx.appSetting['taskbarLyric.width'],
    height: TASKBAR_LYRIC_HEIGHT,
    position: global.lx.appSetting['taskbarLyric.position'],
  })
}

const getWindowUrl = () => {
  return process.env.NODE_ENV !== 'production'
    ? 'http://localhost:9082/taskbar-lyric.html'
    : `file://${path.join(encodePath(__dirname), 'taskbar-lyric.html')}`
}

export const createWindow = () => {
  if (browserWindow) {
    refreshBounds()
    return browserWindow
  }

  browserWindow = new BrowserWindow({
    ...getWindowBounds(),
    useContentSize: true,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    movable: false,
    roundedCorners: false,
    show: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: false,
    webPreferences: {
      contextIsolation: false,
      webSecurity: false,
      sandbox: false,
      nodeIntegration: true,
      enableWebSQL: false,
      webgl: false,
      spellcheck: false,
      backgroundThrottling: false,
    },
  })

  browserWindow.on('closed', () => {
    browserWindow = null
  })

  browserWindow.once('ready-to-show', () => {
    browserWindow?.showInactive()
  })

  void browserWindow.loadURL(getWindowUrl())

  return browserWindow
}

export const closeWindow = () => {
  if (!browserWindow) return
  browserWindow.close()
}

export const refreshBounds = () => {
  if (!browserWindow) return
  browserWindow.setBounds(getWindowBounds())
}

export const updateWindowState = (state?: TaskbarLyricState) => {
  currentState = state ?? currentState
}

export const isExistWindow = () => {
  return !!browserWindow
}
