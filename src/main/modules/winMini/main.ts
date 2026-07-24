import path from 'node:path'
import { BrowserWindow } from 'electron'
import { debounce, getPlatform } from '@common/utils'
import { mainSend } from '@common/mainIpc'
import { encodePath } from '@common/utils/electron'

let browserWindow: Electron.BrowserWindow | null = null

const saveBoundsConfig = debounce((config: Partial<LX.AppSetting>) => {
  global.lx.event_app.update_config(config)
}, 500)

const winEvent = () => {
  if (!browserWindow) return

  browserWindow.on('closed', () => {
    browserWindow = null
  })

  browserWindow.on('move', () => {
    if (!browserWindow) return
    const bounds = browserWindow.getBounds()
    saveBoundsConfig({
      'miniPlayer.x': bounds.x,
      'miniPlayer.y': bounds.y,
    })
  })

  browserWindow.on('resize', () => {
    if (!browserWindow) return
    const bounds = browserWindow.getBounds()
    saveBoundsConfig({
      'miniPlayer.width': bounds.width,
      'miniPlayer.height': bounds.height,
    })
  })

  browserWindow.once('ready-to-show', () => {
    if (browserWindow) {
      browserWindow.show()
      browserWindow.focus()
    }
  })
}

export const createWindow = () => {
  if (!global.envParams.workAreaSize) return

  const workAreaSize = global.envParams.workAreaSize
  let x: number = global.lx.appSetting['miniPlayer.x']
  let y: number = global.lx.appSetting['miniPlayer.y']
  let width: number = global.lx.appSetting['miniPlayer.width'] ?? 400
  let height: number = global.lx.appSetting['miniPlayer.height'] ?? 120

  if (x == null || y == null) {
    x = Math.max(0, Math.floor((workAreaSize.width - width) / 2))
    y = Math.max(0, Math.floor(workAreaSize.height / 4))
    global.lx.event_app.update_config({
      'miniPlayer.x': x,
      'miniPlayer.y': y,
      'miniPlayer.width': width,
      'miniPlayer.height': height,
    })
  }

  browserWindow = new BrowserWindow({
    height,
    width,
    x,
    y,
    minWidth: 300,
    minHeight: 100,
    useContentSize: true,
    frame: false,
    transparent: true,
    hasShadow: true,
    resizable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    roundedCorners: true,
    show: false,
    alwaysOnTop: true,
    skipTaskbar: false,
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

  const winURL = process.env.NODE_ENV !== 'production'
    ? 'http://localhost:9081/mini.html'
    : `file://${path.join(encodePath(__dirname), 'mini.html')}`

  browserWindow.loadURL(winURL).catch(err => {
    console.error('[MiniPlayer] Failed to load URL:', err)
  })

  winEvent()

  global.lx.mainWindow?.hide()
}

export const isExistWindow = (): boolean => !!browserWindow

export const closeWindow = () => {
  if (!browserWindow) return
  browserWindow.close()
  if (global.lx.mainWindow) {
    global.lx.mainWindow.show()
    global.lx.mainWindow.focus()
  }
}

export const showWindow = () => {
  if (!browserWindow) return
  browserWindow.show()
}

export const sendEvent = <T = any>(name: string, params?: T) => {
  if (!browserWindow) return
  mainSend(browserWindow, name, params)
}

export const getBounds = (): Electron.Rectangle | null => {
  if (!browserWindow) return null
  return browserWindow.getBounds()
}

export const setBounds = (bounds: Electron.Rectangle) => {
  if (!browserWindow) return
  browserWindow.setBounds(bounds)
}

export const setAlwaysOnTop = (flag: boolean) => {
  if (!browserWindow) return
  browserWindow.setAlwaysOnTop(flag)
}

export const focusWindow = () => {
  if (!browserWindow) return
  browserWindow.focus()
}

export const toggleWindow = () => {
  if (isExistWindow()) {
    closeWindow()
  } else {
    createWindow()
  }
}