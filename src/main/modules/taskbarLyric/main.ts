import path from 'node:path'
import { existsSync } from 'node:fs'
import { BrowserWindow, Menu, screen } from 'electron'
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { encodePath } from '@common/utils/electron'
import { sendTaskbarButtonClick } from '@main/modules/winMain'
import { showWindow as showMainInterface } from '@main/modules/winMain/main'
import type { TaskbarLyricState } from './types'
import { calcTaskbarLyricBounds, calcTaskbarLyricClampedOffsetX } from './utils'

const TASKBAR_LYRIC_HEIGHT = 56
const TASKBAR_LYRIC_ALWAYS_ON_TOP_LEVEL = 'pop-up-menu'
const TASKBAR_LYRIC_ZORDER_INTERVAL = 500
const DEFAULT_THEME_COLOR = 'rgb(77, 175, 124)'

let browserWindow: Electron.BrowserWindow | null = null
let currentState: TaskbarLyricState | null = null
let dragOffsetX: number | null = null
let zOrderTimer: NodeJS.Timeout | null = null
let isMenuPopupVisible = false

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

const getStyleState = () => {
  return {
    backgroundColorMode: global.lx.appSetting['taskbarLyric.style.backgroundColorMode'],
    backgroundColor: global.lx.appSetting['taskbarLyric.style.backgroundColor'],
    backgroundOpacity: global.lx.appSetting['taskbarLyric.style.backgroundOpacity'],
    songInfoFontColorMode: global.lx.appSetting['taskbarLyric.style.songInfoFontColorMode'],
    songInfoFontColor: global.lx.appSetting['taskbarLyric.style.songInfoFontColor'],
    lyricFontColorMode: global.lx.appSetting['taskbarLyric.style.lyricFontColorMode'],
    lyricFontColor: global.lx.appSetting['taskbarLyric.style.lyricFontColor'],
    songInfoFontSize: global.lx.appSetting['taskbarLyric.style.songInfoFontSize'],
    lyricFontSize: global.lx.appSetting['taskbarLyric.style.lyricFontSize'],
  }
}

const getDefaultState = (): TaskbarLyricState => {
  return {
    enabled: global.lx.appSetting['taskbarLyric.enable'],
    isPlaying: false,
    isCollected: false,
    songId: null,
    title: 'LX Music',
    artist: '',
    lyricLine: '',
    albumCoverUrl: null,
    offsetX: global.lx.appSetting['taskbarLyric.offsetX'],
    showCover: global.lx.appSetting['taskbarLyric.showCover'],
    showSongInfo: global.lx.appSetting['taskbarLyric.showSongInfo'],
    showCurrentLine: global.lx.appSetting['taskbarLyric.showCurrentLine'],
    swapTitleAndArtist: global.lx.appSetting['taskbarLyric.swapTitleAndArtist'],
    themeColor: DEFAULT_THEME_COLOR,
    ...getStyleState(),
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

const hasActiveSong = (state?: TaskbarLyricState | null) => {
  return !!state?.songId
}

const closeTaskbarLyricBySetting = () => {
  global.lx.event_app.update_config({
    'taskbarLyric.enable': false,
  })
}

export const showTaskbarLyricMainInterface = () => {
  showMainInterface()
}

const createTaskbarLyricMenuTemplate = (state?: TaskbarLyricState | null): Electron.MenuItemConstructorOptions[] => {
  const enabled = hasActiveSong(state)
  const isPlaying = !!state?.isPlaying
  const isCollected = !!state?.isCollected

  return [
    {
      label: '上一首',
      enabled,
      click: () => {
        sendTaskbarButtonClick('prev')
      },
    },
    {
      label: isPlaying ? '暂停' : '播放',
      enabled,
      click: () => {
        sendTaskbarButtonClick(isPlaying ? 'pause' : 'play')
      },
    },
    {
      label: '下一首',
      enabled,
      click: () => {
        sendTaskbarButtonClick('next')
      },
    },
    {
      label: isCollected ? '取消收藏' : '收藏',
      enabled,
      click: () => {
        sendTaskbarButtonClick(isCollected ? 'unCollect' : 'collect')
      },
    },
    { type: 'separator' },
    {
      label: '显示主界面',
      click: () => {
        showTaskbarLyricMainInterface()
      },
    },
    {
      label: '关闭任务栏歌词',
      click: () => {
        closeTaskbarLyricBySetting()
      },
    },
  ]
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

export const refreshWindowStateFromConfig = () => {
  currentState = {
    ...(currentState ?? getDefaultState()),
    enabled: global.lx.appSetting['taskbarLyric.enable'],
    offsetX: dragOffsetX ?? global.lx.appSetting['taskbarLyric.offsetX'],
    showCover: global.lx.appSetting['taskbarLyric.showCover'],
    showSongInfo: global.lx.appSetting['taskbarLyric.showSongInfo'],
    showCurrentLine: global.lx.appSetting['taskbarLyric.showCurrentLine'],
    swapTitleAndArtist: global.lx.appSetting['taskbarLyric.swapTitleAndArtist'],
    themeColor: currentState?.themeColor ?? DEFAULT_THEME_COLOR,
    ...getStyleState(),
  }
  sendStateToWindow()
}

export const showTaskbarLyricMenu = () => {
  if (!browserWindow || browserWindow.isDestroyed() || isMenuPopupVisible) return
  isMenuPopupVisible = true

  browserWindow.setFocusable(true)
  browserWindow.setSkipTaskbar(true)
  refreshWindowZOrder()

  const menu = Menu.buildFromTemplate(createTaskbarLyricMenuTemplate(currentState))
  menu.popup({
    window: browserWindow,
    callback: () => {
      if (!browserWindow || browserWindow.isDestroyed()) {
        isMenuPopupVisible = false
        return
      }
      browserWindow.setSkipTaskbar(true)
      browserWindow.blur()
      browserWindow.setFocusable(false)
      browserWindow.showInactive()
      refreshWindowZOrder()
      isMenuPopupVisible = false
    },
  })
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

export const updatePlayerStatus = (status: Partial<LX.Player.Status>) => {
  const nextState = currentState ?? getDefaultState()

  if (status.status != null) {
    nextState.isPlaying = status.status === 'playing'
  }
  if (status.collect != null) nextState.isCollected = status.collect
  if (status.name != null) nextState.title = status.name || 'LX Music'
  if (status.singer != null) nextState.artist = status.singer
  if (status.lyricLineText != null) nextState.lyricLine = status.lyricLineText

  currentState = nextState
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
