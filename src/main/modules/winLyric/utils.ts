// 设置窗口位置、大小
export let minWidth = 80
export let minHeight = 50


// const updateBounds = (bounds: Bounds) => {
//   bounds.x = bounds.x
//   return bounds
// }

export const setWorkArea = (workArea: Electron.Rectangle) => {
  global.envParams.workArea = workArea
}

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
    const workArea = global.envParams.workArea
    if (!workArea) return bounds

    const maxWinW = workArea.width
    const maxWinH = workArea.height

    // 限制宽高不超过工作区域
    w = Math.min(w, maxWinW)
    h = Math.min(h, maxWinH)

    const maxX = workArea.x + maxWinW - w
    const maxY = workArea.y + maxWinH - h

    x = Math.max(workArea.x, Math.min(x + bounds.x, maxX))
    y = Math.max(workArea.y, Math.min(y + bounds.y, maxY))
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
  'desktopLyric.style.isFontWeightFont',
  'desktopLyric.style.isFontWeightLine',
  'desktopLyric.style.isFontWeightExtended',
  'desktopLyric.style.isZoomActiveLrc',
  'common.langId',
  'player.isShowLyricTranslation',
  'player.isShowLyricRoma',
  'player.isPlayLxlrc',
  'player.playbackRate',
] as const

export const buildLyricConfig = (appSetting: Partial<LX.AppSetting>): Partial<LX.DesktopLyric.Config> => {
  const setting: Partial<LX.DesktopLyric.Config> = {}
  for (const key of watchConfigKeys) {
    // @ts-expect-error
    if (key in appSetting) setting[key] = appSetting[key]
  }
  return setting
}

export const initWindowSize = (x: LX.AppSetting['desktopLyric.x'], y: LX.AppSetting['desktopLyric.y'], width: LX.AppSetting['desktopLyric.width'], height: LX.AppSetting['desktopLyric.height']) => {
  if (x == null || y == null) {
    if (width < minWidth) width = minWidth
    if (height < minHeight) height = minHeight
    if (global.envParams.workArea) {
      x = global.envParams.workArea.width - width
      y = global.envParams.workArea.height - height
    } else {
      x = y = 0
    }
  } else {
    let bounds = getLyricWindowBounds({ x, y, width, height }, { x: 0, y: 0, w: width, h: height })
    x = bounds.x
    y = bounds.y
    width = bounds.width
    height = bounds.height
  }
  return {
    x,
    y,
    width,
    height,
  }
}
