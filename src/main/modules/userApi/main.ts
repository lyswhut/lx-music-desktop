import { mainSend } from '@common/mainIpc'
import { BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'node:path'
import { openDevTools as handleOpenDevTools } from '@main/utils'
import USER_API_RENDERER_EVENT_NAME from './rendererEvent/name'
import { getScript } from './utils'

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


export const getProxy = () => {
  if (global.lx.appSetting['network.proxy.enable'] && global.lx.appSetting['network.proxy.host']) {
    return {
      host: global.lx.appSetting['network.proxy.host'],
      port: global.lx.appSetting['network.proxy.port'],
    }
  }
  const envProxy = envParams.cmdParams['proxy-server']
  if (envProxy) {
    if (envProxy && typeof envProxy == 'string') {
      const [host, port = ''] = envProxy.split(':')
      return {
        host,
        port,
      }
    }
  }
  return {
    host: '',
    port: '',
  }
}
const handleUpdateProxy = (keys: Array<keyof LX.AppSetting>) => {
  if (keys.includes('network.proxy.enable') || (global.lx.appSetting['network.proxy.enable'] && keys.some(k => k.startsWith('network.proxy.')))) {
    sendEvent(USER_API_RENDERER_EVENT_NAME.proxyUpdate, getProxy())
  }
}

const winEvent = () => {
  if (!browserWindow) return
  browserWindow.on('closed', () => {
    browserWindow = null
  })
}

export const createWindow = async(userApi: LX.UserApi.UserApiInfo) => {
  await closeWindow()
  dir ??= process.env.NODE_ENV !== 'production' ? webpackUserApiPath : path.join(__dirname, 'userApi')

  if (!html) {
    // eslint-disable-next-line require-atomic-updates
    html = await fs.promises.readFile(path.join(dir, 'renderer/user-api.html'), 'utf8')
  }
  const preloadUrl = process.env.NODE_ENV !== 'production'
    ? `${path.join(__dirname, '../dist/user-api-preload.js')}`
    : `${path.join(__dirname, 'user-api-preload.js')}`
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
    roundedCorners: false,
    hasShadow: false,
    show: false,
    webPreferences: {
      contextIsolation: true,
      // worldSafeExecuteJavaScript: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      sandbox: false,

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
    if (webContents === browserWindow?.webContents) {
      resolve(false)
      return
    }
    resolve(true)
  })
  browserWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' }
  })

  winEvent()

  // console.log(html.replace('</body>', `<script>${userApi.script}</script></body>`))
  // const randomNum = Math.random().toString().substring(2, 10)
  await browserWindow.loadURL('data:text/html;charset=UTF-8,' + encodeURIComponent(html))

  browserWindow.on('ready-to-show', async() => {
    global.lx.event_app.on('updated_config', handleUpdateProxy)
    sendEvent(USER_API_RENDERER_EVENT_NAME.initEnv, { ...userApi, script: await getScript(userApi.id), proxy: getProxy() })
  })

  // global.modules.userApiWindow.loadFile(join(dir, 'renderer/user-api.html'))
  // global.modules.userApiWindow.webContents.openDevTools()
}

export const closeWindow = async() => {
  global.lx.event_app.off('updated_config', handleUpdateProxy)
  if (!browserWindow) return
  await Promise.all([
    browserWindow.webContents.session.clearAuthCache(),
    browserWindow.webContents.session.clearStorageData(),
    browserWindow.webContents.session.clearCache(),
  ])
  browserWindow?.destroy()
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
