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
  if (!global.modules.mainWindow) return
  mainSend(global.modules.mainWindow, ipcMainWindowNames.get_lyric_info, {
    name: ipcWinLyricNames.set_lyric_info,
    modal: 'lyricWindow',
    action,
  })
})

mainOn(ipcWinLyricNames.set_lyric_config, (event, config) => {
  global.lx_event.common.setAppConfig({ desktopLyric: config }, WIN_LYRIC_EVENT_NAME.name)
})

mainHandle(ipcWinLyricNames.get_lyric_config, async() => {
  return { config: global.appSetting.desktopLyric, languageId: global.appSetting.langId }
})

let bounds
let winX
let winY
let wasW
let wasY
let offset = 8
mainOn(ipcWinLyricNames.set_win_bounds, (event, { x = 0, y = 0, w = 0, h = 0 }) => {
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

  // console.log(bounds, x, y, w, h)
  global.modules.lyricWindow.setBounds(bounds)
})
