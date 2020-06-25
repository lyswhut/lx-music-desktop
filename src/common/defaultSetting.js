const path = require('path')
const os = require('os')
const { isMac } = require('./utils')

const defaultSetting = {
  version: '1.0.31',
  player: {
    togglePlayMethod: 'listLoop',
    highQuality: false,
    isShowTaskProgess: true,
    volume: 1,
    isMute: false,
    mediaDeviceId: 'default',
    isMediaDeviceRemovedStopPlay: false,
  },
  desktopLyric: {
    enable: false,
    isLock: false,
    isAlwaysOnTop: false,
    width: 380,
    height: 420,
    x: null,
    y: null,
    theme: 0,
    style: {
      fontSize: 120,
      opacity: 95,
      isZoomActiveLrc: true,
    },
  },
  list: {
    isShowAlbumName: true,
    isShowSource: true,
    prevSelectListId: 'default',
    isSaveScrollLocation: true,
  },
  download: {
    savePath: path.join(os.homedir(), 'Desktop'),
    fileName: '歌名 - 歌手',
    maxDownloadNum: 3,
    isDownloadLrc: false,
    isEmbedPic: true,
  },
  leaderboard: {
    source: 'kw',
    tabId: 'kw__16',
  },
  songList: {
    source: 'kg',
    sortId: '5',
    tagInfo: {
      name: '默认',
      id: null,
    },
  },
  odc: {
    isAutoClearSearchInput: false,
    isAutoClearSearchList: false,
  },
  search: {
    searchSource: 'kw',
    tempSearchSource: 'kw',
    isShowHotSearch: false,
    isShowHistorySearch: false,
    isFocusSearchBox: false,
  },
  network: {
    proxy: {
      enable: false,
      host: '',
      port: '',
      username: '',
      password: '',
    },
  },
  tray: {
    isShow: false,
    isToTray: false,
  },
  windowSizeId: 2,
  themeId: 0,
  langId: null,
  sourceId: 'kw',
  apiSource: 'temp',
  sourceNameType: 'alias',
  randomAnimate: true,
  ignoreVersion: null,
  isAgreePact: false,
  controlBtnPosition: isMac ? 'left' : 'right',
}

const overwriteSetting = {

}

// 使用新年皮肤
if (new Date().getMonth() < 2) defaultSetting.themeId = 9


exports.defaultSetting = defaultSetting
exports.overwriteSetting = overwriteSetting
