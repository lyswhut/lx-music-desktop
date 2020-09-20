// 设置窗口位置、大小
let bounds
let winX
let winY
let wasW
let wasY
let offset = 8
exports.setLyricWindow = ({ x = 0, y = 0, w = 0, h = 0 }) => {
  if (!global.modules.lyricWindow) return
  bounds = global.modules.lyricWindow.getBounds()
  wasW = global.envParams.workAreaSize.width
  wasY = global.envParams.workAreaSize.height + offset

  bounds.width = w
  bounds.height = h
  if (bounds.width > wasW - offset) {
    bounds.width = wasW - offset
  } else if (bounds.width < 380) {
    bounds.width = 380
  }
  if (bounds.height > wasY) {
    bounds.height = wasY + offset
  } else if (bounds.height < 80) {
    bounds.height = 80
  }

  if (global.appSetting.desktopLyric.isLockScreen) {
    if (x != 0) {
      winX = bounds.x + x
      if (winX > wasW - bounds.width + offset) {
        winX = wasW - bounds.width + offset
      } else if (winX < -offset) {
        winX = -offset
      }
      bounds.x = winX
    }
    if (y != 0) {
      winY = bounds.y + y
      if (winY > wasY - bounds.height) {
        winY = wasY - bounds.height
      } else if (winY < -offset) {
        winY = -offset
      }
      bounds.y = winY
    }
  } else {
    if (x != 0) {
      bounds.x = bounds.x + x
    }
    if (y != 0) {
      bounds.y = bounds.y + y
    }
  }
  // console.log(bounds, x, y, w, h)
  global.modules.lyricWindow.setBounds(bounds)
}
