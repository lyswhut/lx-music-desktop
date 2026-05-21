import path from 'node:path'
import { existsSync } from 'node:fs'
import { BrowserWindow, screen } from 'electron'
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { encodePath } from '@common/utils/electron'
import type { TaskbarLyricState } from './types'
import { calcTaskbarLyricBounds, calcTaskbarLyricClampedOffsetX } from './utils'

const TASKBAR_LYRIC_HEIGHT = 56
const TASKBAR_LYRIC_ALWAYS_ON_TOP_LEVEL = 'pop-up-menu'
const TASKBAR_LYRIC_ZORDER_INTERVAL = 1500

let browserWindow: Electron.BrowserWindow | null = null
let currentState: TaskbarLyricState | null = null
let dragOffsetX: number | null = null
let zOrderTimer: NodeJS.Timeout | null = null

const clearZOrderTimer = () => {
  if (!zOrderTimer) return
  clearInterval(zOrderTimer)
  zOrderTimer = null
}

const refreshWindowZOrder = () => {
  if (!browserWindow || browserWindow.isDestroyed()) return
  browserWindow.setAlwaysOnTop(true, TASKBAR_LYRIC_ALWAYS_ON_TOP_LEVEL)
  browserWindow.moveTop()
}

const ensureWindowZOrder = () => {
  clearZOrderTimer()
  refreshWindowZOrder()
  zOrderTimer = setInterval(() => {
    refreshWindowZOrder()
  }, TASKBAR_LYRIC_ZORDER_INTERVAL)
}

const getDefaultState = (): TaskbarLyricState => {
  return {
    enabled: global.lx.appSetting['taskbarLyric.enable'],
    isPlaying: false,
    songId: null,
    title: 'LX Music',
    artist: '',
    lyricLine: '',
    albumCoverUrl: null,
    offsetX: global.lx.appSetting['taskbarLyric.offsetX'],
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

const getWindowBounds = (): Electron.Rectangle | null => {
  const display = screen.getPrimaryDisplay()
  const offsetX = dragOffsetX ?? global.lx.appSetting['taskbarLyric.offsetX']
  const bounds = calcTaskbarLyricBounds({
    display: {
      ...display.bounds,
      workArea: display.workArea,
    },
    width: global.lx.appSetting['taskbarLyric.width'],
    height: TASKBAR_LYRIC_HEIGHT,
    position: global.lx.appSetting['taskbarLyric.position'],
    offsetX,
  })
  return bounds
}

const getClampedOffsetX = (offsetX: number) => {
  const display = screen.getPrimaryDisplay()
  return calcTaskbarLyricClampedOffsetX({
    display: {
      ...display.bounds,
      workArea: display.workArea,
    },
    width: global.lx.appSetting['taskbarLyric.width'],
    position: global.lx.appSetting['taskbarLyric.position'],
    offsetX,
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
    const bounds = getWindowBounds()
    if (!bounds) {
      closeWindow()
      return null
    }

    browserWindow.setBounds(bounds)
    return browserWindow
  }

  const windowUrl = getWindowUrl()
  const bounds = getWindowBounds()
  if (!windowUrl || !bounds) return null

  browserWindow = new BrowserWindow({
    ...bounds,
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
    clearZOrderTimer()
    browserWindow = null
  })

  browserWindow.once('ready-to-show', () => {
    ensureWindowZOrder()
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
  clearZOrderTimer()
  browserWindow.close()
}

export const refreshBounds = () => {
  if (!browserWindow) return
  const bounds = getWindowBounds()
  if (!bounds) {
    closeWindow()
    return
  }
  browserWindow.setBounds(bounds)
}

export const updateWindowState = (state?: TaskbarLyricState) => {
  currentState = state ?? currentState ?? getDefaultState()
  currentState.offsetX = dragOffsetX ?? global.lx.appSetting['taskbarLyric.offsetX']
  sendStateToWindow()
}

export const sendCurrentStateToWindow = (webContents?: Electron.WebContents) => {
  sendStateToWindow(webContents)
}

export const isExistWindow = () => {
  return !!browserWindow
}

export const updateDragOffsetX = (offsetX: number) => {
  dragOffsetX = getClampedOffsetX(offsetX)
  if (currentState) currentState.offsetX = dragOffsetX
  refreshBounds()
  sendStateToWindow()
}

export const commitDragOffsetX = () => {
  if (dragOffsetX == null) return
  const nextOffsetX = getClampedOffsetX(dragOffsetX)
  dragOffsetX = null
  if (currentState) currentState.offsetX = nextOffsetX
  global.lx.event_app.update_config({
    'taskbarLyric.offsetX': nextOffsetX,
  })
}
