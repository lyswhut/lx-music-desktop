import { isLinux } from '@common/utils'
import { closeWindow, createWindow, getBounds, isExistWindow, alwaysOnTopTools, setBounds, setIgnoreMouseEvents, setSkipTaskbar } from './main'
import { sendConfigChange } from './rendererEvent'
import { buildLyricConfig, getLyricWindowBounds, initWindowSize, watchConfigKeys } from './utils'

let isLock: boolean
let isEnable: boolean
let isAlwaysOnTop: boolean
let isAlwaysOnTopLoop: boolean
let isShowTaskbar: boolean
let isLockScreen: boolean
let isHoverHide: boolean


export const setLrcConfig = (keys: Array<keyof LX.AppSetting>, setting: Partial<LX.AppSetting>) => {
  if (!watchConfigKeys.some(key => keys.includes(key))) return

  if (isExistWindow()) {
    sendConfigChange(buildLyricConfig(setting))
    if (keys.includes('desktopLyric.isLock') && isLock != global.lx.appSetting['desktopLyric.isLock']) {
      isLock = global.lx.appSetting['desktopLyric.isLock']
      if (global.lx.appSetting['desktopLyric.isLock']) {
        setIgnoreMouseEvents(true, { forward: !isLinux && global.lx.appSetting['desktopLyric.isHoverHide'] })
      } else {
        setIgnoreMouseEvents(false, { forward: !isLinux && global.lx.appSetting['desktopLyric.isHoverHide'] })
      }
    }
    if (keys.includes('desktopLyric.isHoverHide') && isHoverHide != global.lx.appSetting['desktopLyric.isHoverHide']) {
      isHoverHide = global.lx.appSetting['desktopLyric.isHoverHide']
      if (!isLinux) {
        setIgnoreMouseEvents(global.lx.appSetting['desktopLyric.isLock'], { forward: global.lx.appSetting['desktopLyric.isHoverHide'] })
      }
    }
    if (keys.includes('desktopLyric.isAlwaysOnTop') && isAlwaysOnTop != global.lx.appSetting['desktopLyric.isAlwaysOnTop']) {
      isAlwaysOnTop = global.lx.appSetting['desktopLyric.isAlwaysOnTop']
      alwaysOnTopTools.setAlwaysOnTop(global.lx.appSetting['desktopLyric.isAlwaysOnTopLoop'])
      if (isAlwaysOnTop && global.lx.appSetting['desktopLyric.isAlwaysOnTopLoop']) {
        alwaysOnTopTools.startLoop()
      } else alwaysOnTopTools.clearLoop()
    }
    if (keys.includes('desktopLyric.isShowTaskbar') && isShowTaskbar != global.lx.appSetting['desktopLyric.isShowTaskbar']) {
      isShowTaskbar = global.lx.appSetting['desktopLyric.isShowTaskbar']
      setSkipTaskbar(!global.lx.appSetting['desktopLyric.isShowTaskbar'])
    }
    if (keys.includes('desktopLyric.isAlwaysOnTopLoop') && isAlwaysOnTopLoop != global.lx.appSetting['desktopLyric.isAlwaysOnTopLoop']) {
      isAlwaysOnTopLoop = global.lx.appSetting['desktopLyric.isAlwaysOnTopLoop']
      if (!global.lx.appSetting['desktopLyric.isAlwaysOnTop']) return
      if (isAlwaysOnTopLoop) {
        alwaysOnTopTools.startLoop()
      } else {
        alwaysOnTopTools.clearLoop()
      }
    }
    if (keys.includes('desktopLyric.isLockScreen') && isLockScreen != global.lx.appSetting['desktopLyric.isLockScreen']) {
      isLockScreen = global.lx.appSetting['desktopLyric.isLockScreen']
      if (global.lx.appSetting['desktopLyric.isLockScreen']) {
        setBounds(getLyricWindowBounds(getBounds(), {
          x: 0,
          y: 0,
          w: global.lx.appSetting['desktopLyric.width'],
          h: global.lx.appSetting['desktopLyric.height'],
        }))
      }
    }
    if (keys.includes('desktopLyric.x') && setting['desktopLyric.x'] == null) {
      setBounds(initWindowSize(
        global.lx.appSetting['desktopLyric.x'],
        global.lx.appSetting['desktopLyric.y'],
        global.lx.appSetting['desktopLyric.width'],
        global.lx.appSetting['desktopLyric.height'],
      ))
    }
  }
  if (keys.includes('desktopLyric.enable') && isEnable != global.lx.appSetting['desktopLyric.enable']) {
    isEnable = global.lx.appSetting['desktopLyric.enable']
    if (global.lx.appSetting['desktopLyric.enable']) {
      createWindow()
    } else {
      alwaysOnTopTools.clearLoop()
      closeWindow()
    }
  }
}
