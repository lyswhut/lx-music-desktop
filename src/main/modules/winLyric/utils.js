// 设置窗口位置、大小
let winX
let winY
let wasW
let wasH
let offset = 8
let minWidth = 380
let minHeight = 80
exports.getLyricWindowBounds = (bounds, { x = 0, y = 0, w = 0, h = 0 }) => {
  if (w < minWidth) w = minWidth
  if (h < minHeight) h = minHeight

  if (global.appSetting.desktopLyric.isLockScreen) {
    wasW = global.envParams.workAreaSize.width + offset
    wasH = global.envParams.workAreaSize.height + offset
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
