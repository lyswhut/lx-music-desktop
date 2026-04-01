import { BrowserWindow } from 'electron'
import path from 'path'
import { isProd, isLinux } from '@common/utils'

const isWayland = process.env.XDG_SESSION_TYPE === 'wayland'

let win: BrowserWindow | null = null

const createDesktopLyricWindow = () => {
  if (win != null) return

  win = new BrowserWindow({
    width: 800,
    height: 100,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.on('ready-to-show', () => {
    if (!isWayland) win.setSkipTaskbar(true)
  })

  const url = isProd
    ? `file://${path.join(__dirname, '../renderer-lyric/index.html')}`
    : 'http://localhost:9081'
  win.loadURL(url)

  win.on('closed', () => {
    win = null
  })
}

export default () => {
  createDesktopLyricWindow()
}
