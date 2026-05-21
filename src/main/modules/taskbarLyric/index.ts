import { screen, powerMonitor } from 'electron'
import { isWin } from '@common/utils'
import { closeWindow, createWindow, refreshBounds } from './main'

let isRegistered = false

const refreshBoundsIfEnabled = () => {
  if (!global.lx.appSetting['taskbarLyric.enable']) return
  refreshBounds()
}

const handleConfigChange = (keys: Array<keyof LX.AppSetting>) => {
  if (!keys.some(key => key.startsWith('taskbarLyric.'))) return

  if (keys.includes('taskbarLyric.enable')) {
    if (global.lx.appSetting['taskbarLyric.enable']) createWindow()
    else closeWindow()
    return
  }

  if (global.lx.appSetting['taskbarLyric.enable'] && (
    keys.includes('taskbarLyric.position') ||
    keys.includes('taskbarLyric.width')
  )) refreshBounds()
}

export default () => {
  if (isRegistered || !isWin) return
  isRegistered = true

  global.lx.event_app.on('app_inited', () => {
    if (global.lx.appSetting['taskbarLyric.enable']) createWindow()
  })

  global.lx.event_app.on('updated_config', (keys) => {
    handleConfigChange(keys)
  })

  screen.on('display-added', refreshBoundsIfEnabled)
  screen.on('display-removed', refreshBoundsIfEnabled)
  screen.on('display-metrics-changed', refreshBoundsIfEnabled)
  powerMonitor.on('resume', refreshBoundsIfEnabled)
  powerMonitor.on('unlock-screen', refreshBoundsIfEnabled)
}

export * from './main'
