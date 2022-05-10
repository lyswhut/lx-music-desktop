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
const { getLyricWindowBounds } = require('./utils')

mainOn(ipcWinLyricNames.get_lyric_info, (event, action) => {
  if (!global.modules.mainWindow) return
  mainSend(global.modules.mainWindow, ipcMainWindowNames.get_lyric_info, {
    name: ipcWinLyricNames.set_lyric_info,
    modal: 'lyricWindow',
    action,
  })
})

mainOn(ipcWinLyricNames.set_lyric_config, (event, config) => {
  global.lx_core.setAppConfig({ desktopLyric: config }, WIN_LYRIC_EVENT_NAME.name)
})

mainHandle(ipcWinLyricNames.get_lyric_config, async() => {
  return {
    config: global.appSetting.desktopLyric,
    languageId: global.appSetting.langId,
    isShowLyricTranslation: global.appSetting.player.isShowLyricTranslation,
    isShowLyricRoma: global.appSetting.player.isShowLyricRoma,
    isPlayLxlrc: global.appSetting.player.isPlayLxlrc,
  }
})

mainOn(ipcWinLyricNames.set_win_bounds, (event, options) => {
  global.modules.lyricWindow.setBounds(getLyricWindowBounds(global.modules.lyricWindow.getBounds(), options))
})
