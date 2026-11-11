import path from 'node:path'
import { BrowserWindow } from 'electron'
import { debounce, getPlatform } from '@common/utils'
import { mainSend } from '@common/mainIpc'
import { encodePath } from '@common/utils/electron'
import { WIN_MINI_PLAYER_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { sendEvent as sendMainWindowEvent, showWindow as showMainWindow, hideWindow as hideMainWindow, isWindowVisible as isMainWindowVisible } from '@main/modules/winMain'

let browserWindow: Electron.BrowserWindow | null = null

// 主窗口是否由迷你窗打开而被隐藏（用于关闭迷你窗时决定是否恢复显示）
let isMainWindowHiddenByMiniPlayer = false

// 窗口固定尺寸
const WIN_WIDTH = 380
const WIN_HEIGHT = 115

const saveBoundsConfig = debounce((config: Partial<LX.AppSetting>) => {
  global.lx.event_app.update_config(config)
}, 500)

// 通知主窗口迷你窗显示状态变化（用于同步入口按钮状态）
const sendVisibleChanged = (visible: boolean) => {
  sendMainWindowEvent(WIN_MINI_PLAYER_RENDERER_EVENT_NAME.on_visible_changed, visible)
}

const winEvent = () => {
  if (!browserWindow) return

  browserWindow.on('closed', () => {
    browserWindow = null
    sendVisibleChanged(false)
    // 迷你窗关闭：若主窗口是打开迷你窗时被隐藏的，则恢复显示
    if (isMainWindowHiddenByMiniPlayer) {
      isMainWindowHiddenByMiniPlayer = false
      showMainWindow()
    }
  })

  browserWindow.on('move', () => {
    if (!browserWindow) return
    const bounds = browserWindow.getBounds()
    saveBoundsConfig({
      'miniPlayer.x': bounds.x,
      'miniPlayer.y': bounds.y,
    })
  })

  browserWindow.once('ready-to-show', () => {
    showWindow()
    sendVisibleChanged(true)
    // 迷你窗打开：隐藏主窗口（仅当主窗口当前可见时）
    isMainWindowHiddenByMiniPlayer = isMainWindowVisible()
    if (isMainWindowHiddenByMiniPlayer) hideMainWindow()
  })
}

export const createWindow = () => {
  closeWindow()
  let x = global.lx.appSetting['miniPlayer.x']
  let y = global.lx.appSetting['miniPlayer.y']
  if (x == null || y == null) {
    // 默认显示在屏幕水平居中、垂直靠上的位置
    if (global.envParams.workAreaSize) {
      const { width, height } = global.envParams.workAreaSize
      x = Math.max(0, Math.round((width - WIN_WIDTH) / 2))
      y = Math.max(0, Math.round(height * 0.12))
    } else {
      x = y = 0
    }
  }

  const { shouldUseDarkColors, theme } = global.lx.theme

  /**
   * Initial window options
   */
  browserWindow = new BrowserWindow({
    height: WIN_HEIGHT,
    width: WIN_WIDTH,
    x,
    y,
    useContentSize: true,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    roundedCorners: false,
    show: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      contextIsolation: false,
      webSecurity: false,
      sandbox: false,
      nodeIntegration: true,
      enableWebSQL: false,
      webgl: false,
      spellcheck: false, // 禁用拼写检查器
      backgroundThrottling: false,
    },
  })

  const winURL = process.env.NODE_ENV !== 'production' ? 'http://localhost:9081/miniplayer.html' : `file://${path.join(encodePath(__dirname), 'miniplayer.html')}`
  void browserWindow.loadURL(winURL + `?os=${getPlatform()}&dark=${shouldUseDarkColors}&theme=${encodeURIComponent(JSON.stringify(theme))}`)

  winEvent()
  // browserWindow.webContents.openDevTools()
}

export const isExistWindow = (): boolean => !!browserWindow

export const closeWindow = () => {
  if (!browserWindow) return
  browserWindow.close()
}

export const showWindow = () => {
  if (!browserWindow) return
  browserWindow.show()
}

export const sendEvent = <T = any>(name: string, params?: T) => {
  if (!browserWindow) return
  mainSend(browserWindow, name, params)
}

export const toggleWindow = (): boolean => {
  if (isExistWindow()) closeWindow()
  else createWindow()
  return isExistWindow()
}

// 主窗口关闭时调用：重置标志，避免迷你窗关闭后误把正在退出的主窗口重新 show
export const handleMainWindowClose = () => {
  isMainWindowHiddenByMiniPlayer = false
  closeWindow()
}
