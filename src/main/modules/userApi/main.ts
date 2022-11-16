import { mainSend } from '@common/mainIpc'
import { BrowserWindow } from 'electron'
import fs from 'fs'
import { join } from 'path'
import { openDevTools as handleOpenDevTools } from '@main/utils'
import { encodePath } from '@common/utils/electron'

let browserWindow: Electron.BrowserWindow | null = null

let html: string | null = null
let dir: string | null = null

const denyEvents = [
  'will-navigate',
  'will-redirect',
  'will-attach-webview',
  'will-prevent-unload',
  'media-started-playing',
] as const

const winEvent = () => {
  if (!browserWindow) return
  browserWindow.on('closed', () => {
    browserWindow = null
  })
}

export const createWindow = async(userApi: LX.UserApi.UserApiInfo) => {
  await closeWindow()
  if (!dir) dir = global.isDev ? webpackUserApiPath : join(encodePath(__dirname), 'userApi')

  if (!html) {
    html = await fs.promises.readFile(join(dir, 'renderer/user-api.html'), 'utf8')
  }
  const preloadUrl = global.isDev
    ? `${join(encodePath(__dirname), '../dist/user-api-preload.js')}`
    : `${join(encodePath(__dirname), 'user-api-preload.js')}`
  // console.log(preloadUrl)

  /**
   * Initial window options
   */
  browserWindow = new BrowserWindow({
    // enableRemoteModule: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    webPreferences: {
      contextIsolation: true,
      // worldSafeExecuteJavaScript: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,

      spellcheck: false,
      autoplayPolicy: 'document-user-activation-required',
      enableWebSQL: false,
      disableDialogs: true,
      // nativeWindowOpen: false,
      webgl: false,
      images: false,

      preload: preloadUrl,
    },
  })

  for (const eventName of denyEvents) {
    // @ts-expect-error
    browserWindow.webContents.on(eventName, (event: Electron.Event) => {
      event.preventDefault()
    })
  }
  browserWindow.webContents.session.setPermissionRequestHandler((webContents, permission, resolve) => {
    if (webContents === browserWindow?.webContents) return resolve(false)
    resolve(true)
  })
  browserWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' }
  })

  winEvent()

  // console.log(html.replace('</body>', `<script>${userApi.script}</script></body>`))
  const randomNum = Math.random().toString().substring(2, 10)
  await browserWindow.loadURL(
    'data:text/html;charset=UTF-8,' + encodeURIComponent(html
      .replace('<meta http-equiv="Content-Security-Policy" content="default-src \'none\'">',
        `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${randomNum}';">`)
      .replace('</body>', `<script nonce="${randomNum}">${userApi.script}</script></body>`)))

  // global.modules.userApiWindow.loadFile(join(dir, 'renderer/user-api.html'))
  // global.modules.userApiWindow.webContents.openDevTools()
}

export const closeWindow = async() => {
  if (!browserWindow) return
  await Promise.all([
    browserWindow.webContents.session.clearAuthCache(),
    browserWindow.webContents.session.clearStorageData(),
    browserWindow.webContents.session.clearCache(),
  ])
  browserWindow.destroy()
  browserWindow = null
}

export const sendEvent = <T = any>(name: string, params?: T) => {
  if (!browserWindow) return
  mainSend(browserWindow, name, params)
}

export const openDevTools = () => {
  if (!browserWindow) return
  handleOpenDevTools(browserWindow.webContents)
}
