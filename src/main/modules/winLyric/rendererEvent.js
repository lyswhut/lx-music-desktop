const {
  mainOn,
  mainHandle,
  mainSend,
  NAMES: {
    mainWindow: ipcMainWindowNames,
    winLyric: ipcWinLyricNames,
  },
} = require('../../../common/ipc')
const { winLyric: WIN_LYRIC_EVENT_NAME } = require('../../events/_name')

mainOn(ipcWinLyricNames.get_lyric_info, (event, action) => {
  if (!global.modals.mainWindow) return
  mainSend(global.modals.mainWindow, ipcMainWindowNames.get_lyric_info, {
    name: ipcWinLyricNames.set_lyric_info,
    modal: 'lyricWindow',
    action,
  })
})

mainOn(ipcWinLyricNames.set_lyric_config, (event, config) => {
  global.lx_event.common.setAppConfig({ desktopLyric: config }, WIN_LYRIC_EVENT_NAME.name)
})

mainHandle(ipcWinLyricNames.get_lyric_config, async() => {
  return global.appSetting.desktopLyric
})

let bounds
let winX
let winY
let wasW
let wasY
mainOn(ipcWinLyricNames.set_win_bounds, (event, { x = 0, y = 0, w = 0, h = 0 }) => {
  if (!global.modals.lyricWindow) return
  bounds = global.modals.lyricWindow.getBounds()
  wasW = global.envParams.workAreaSize.width
  wasY = global.envParams.workAreaSize.height + 8

  bounds.width = w + bounds.width
  bounds.height = h + bounds.height
  if (bounds.width > wasW - 8) {
    bounds.width = wasW - 8
  } else if (bounds.width < 300) {
    bounds.width = 300
  }
  if (bounds.height > wasY) {
    bounds.height = wasY + 8
  } else if (bounds.height < 120) {
    bounds.height = 120
  }


  if (x != 0) {
    winX = bounds.x + x
    if (winX > wasW - bounds.width + 8) {
      winX = wasW - bounds.width + 8
    } else if (winX < -8) {
      winX = -8
    }
    bounds.x = winX
  }
  if (y != 0) {
    winY = bounds.y + y
    if (winY > wasY - bounds.height) {
      winY = wasY - bounds.height
    } else if (winY < -8) {
      winY = -8
    }
    bounds.y = winY
  }

  // console.log(bounds)
  global.modals.lyricWindow.setBounds(bounds)
})
