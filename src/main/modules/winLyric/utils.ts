// 设置窗口位置、大小
let winX
let winY
let wasW
let wasH
let offset = 8
let minWidth = 80
let minHeight = 50

export const getLyricWindowBounds = (bounds: Electron.Rectangle, { x = 0, y = 0, w = 0, h = 0 }: LX.DesktopLyric.NewBounds): Electron.Rectangle => {
  if (w < minWidth) w = minWidth
  if (h < minHeight) h = minHeight

  if (global.lx.appSetting['desktopLyric.isLockScreen']) {
    if (!global.envParams.workAreaSize) return bounds
    wasW = (global.envParams.workAreaSize.width ?? 0) + offset
    wasH = (global.envParams.workAreaSize.height ?? 0) + offset

    if (w > wasW + offset) w = wasW + offset
    if (h > wasH + offset) h = wasH + offset
    if (x == null) {
      if (bounds.x > wasW - w) {
        x = wasW - w - bounds.x
      } else if (bounds.x < -offset) {
        x = bounds.x + offset
      } else {
        x = 0
      }
      if (bounds.y > wasH - h) {
        y = wasH - h - bounds.y
      } else if (bounds.y < -offset) {
        y = bounds.y + offset
      } else {
        y = 0
      }
    }
    winX = bounds.x + x
    winY = bounds.y + y

    if (x != 0) {
      if (winX < -offset) {
        winX = -offset
      } else if (winX + w > wasW) {
        winX = wasW - w
      }
    }
    if (y != 0) {
      if (winY < -offset) {
        winY = -offset
      } else if (winY + h > wasH) {
        winY = wasH - h
      }
    }

    x = winX
    y = winY

    if (x + w > wasW) w = wasW - x
    if (y + h > wasH) h = wasH - y
  } else {
    if (x == null) {
      x = 0
      y = 0
    }
    y += bounds.y
    x += bounds.x
  }

  bounds.width = w
  bounds.height = h
  bounds.x = x
  bounds.y = y
  // console.log('util bounds', bounds)
  return bounds
}


export const watchConfigKeys = [
  'desktopLyric.enable',
  'desktopLyric.isLock',
  'desktopLyric.isAlwaysOnTop',
  'desktopLyric.isAlwaysOnTopLoop',
  'desktopLyric.isShowTaskbar',
  'desktopLyric.audioVisualization',
  'desktopLyric.width',
  'desktopLyric.height',
  'desktopLyric.x',
  'desktopLyric.y',
  'desktopLyric.isLockScreen',
  'desktopLyric.isDelayScroll',
  'desktopLyric.scrollAlign',
  'desktopLyric.isHoverHide',
  'desktopLyric.direction',
  'desktopLyric.style.align',
  'desktopLyric.style.lyricUnplayColor',
  'desktopLyric.style.lyricPlayedColor',
  'desktopLyric.style.lyricShadowColor',
  'desktopLyric.style.font',
  'desktopLyric.style.fontSize',
  'desktopLyric.style.lineGap',
  // 'desktopLyric.style.fontWeight',
  'desktopLyric.style.opacity',
  'desktopLyric.style.ellipsis',
  'desktopLyric.style.isZoomActiveLrc',
  'common.langId',
  'player.isShowLyricTranslation',
  'player.isShowLyricRoma',
  'player.isPlayLxlrc',
] as const

export const buildLyricConfig = (appSetting: Partial<LX.AppSetting>): Partial<LX.DesktopLyric.Config> => {
  const setting: Partial<LX.DesktopLyric.Config> = {}
  for (const key of watchConfigKeys) {
    // @ts-expect-error
    if (key in appSetting) setting[key] = appSetting[key]
  }
  return setting
}
