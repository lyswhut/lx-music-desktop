import path from 'node:path'
import { existsSync } from 'node:fs'
import { BrowserWindow, screen } from 'electron'
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { encodePath } from '@common/utils/electron'
import type { TaskbarLyricState } from './types'
import { calcTaskbarLyricBounds, enableTaskbarLyricIgnoreMouseEvents } from './utils'

const TASKBAR_LYRIC_HEIGHT = 56

let browserWindow: Electron.BrowserWindow | null = null
let currentState: TaskbarLyricState | null = null

const getDefaultState = (): TaskbarLyricState => {
  return {
    enabled: global.lx.appSetting['taskbarLyric.enable'],
    isPlaying: false,
    songId: null,
    title: 'LX Music',
    artist: '',
    lyricLine: '',
    albumCoverUrl: null,
    showCover: global.lx.appSetting['taskbarLyric.showCover'],
    showSongInfo: global.lx.appSetting['taskbarLyric.showSongInfo'],
    showCurrentLine: global.lx.appSetting['taskbarLyric.showCurrentLine'],
  }
}

const sendStateToWindow = (webContents?: Electron.WebContents) => {
  const target = webContents ?? browserWindow?.webContents
  if (!target || target.isDestroyed()) return

  target.send(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_set_state, currentState ?? getDefaultState())
}

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
  if (process.env.NODE_ENV !== 'production') return 'http://localhost:9082/taskbar-lyric.html'

  const filePath = path.join(__dirname, 'taskbar-lyric.html')
  if (!existsSync(filePath)) return null

  return `file://${encodePath(filePath)}`
}

export const createWindow = () => {
  if (browserWindow) {
    refreshBounds()
    return browserWindow
  }

  const windowUrl = getWindowUrl()
  if (!windowUrl) return null

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
    enableTaskbarLyricIgnoreMouseEvents(browserWindow!)
    browserWindow?.showInactive()
  })

  browserWindow.webContents.on('did-finish-load', () => {
    sendStateToWindow()
  })

  void browserWindow.loadURL(windowUrl)

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
  currentState = state ?? currentState ?? getDefaultState()
  sendStateToWindow()
}

export const sendCurrentStateToWindow = (webContents?: Electron.WebContents) => {
  sendStateToWindow(webContents)
}

export const isExistWindow = () => {
  return !!browserWindow
}
