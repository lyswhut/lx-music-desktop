// 设置窗口位置、大小
export const padding = 8
export let minWidth = 80
export let minHeight = 50


// const updateBounds = (bounds: Bounds) => {
//   bounds.x = bounds.x
//   return bounds
// }

/**
 *
 * @param bounds 当前设置
 * @param param 新设置（相对于当前设置）
 * @returns
 */
export const getLyricWindowBounds = (bounds: Electron.Rectangle, { x = 0, y = 0, w = 0, h = 0 }: LX.DesktopLyric.NewBounds): Electron.Rectangle => {
  if (w < minWidth) w = minWidth
  if (h < minHeight) h = minHeight

  if (global.lx.appSetting['desktopLyric.isLockScreen']) {
    if (!global.envParams.workAreaSize) return bounds
    const maxWinW = global.envParams.workAreaSize.width + padding * 2
    const maxWinH = global.envParams.workAreaSize.height + padding * 2

    if (w > maxWinW) w = maxWinW
    if (h > maxWinH) h = maxWinH

    const maxX = global.envParams.workAreaSize.width + padding - w
    const minX = -padding
    const maxY = global.envParams.workAreaSize.height + padding - h
    const minY = -padding

    x += bounds.x
    y += bounds.y

    if (x > maxX) x = maxX
    else if (x < minX) x = minX

    if (y > maxY) y = maxY
    else if (y < minY) y = minY
  } else {
    y += bounds.y
    x += bounds.x
  }

  // console.log('util bounds', bounds)
  return { width: w, height: h, x, y }
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
