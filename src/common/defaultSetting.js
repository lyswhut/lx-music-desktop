const path = require('path')
const os = require('os')

const defaultSetting = {
  version: '1.0.38',
  player: {
    togglePlayMethod: 'listLoop',
    highQuality: false,
    isShowTaskProgess: true,
    volume: 1,
    isMute: false,
    mediaDeviceId: 'default',
    isMediaDeviceRemovedStopPlay: false,
    isShowLyricTransition: true,
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
    isLockScreen: true,
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
    enable: true,
    savePath: path.join(os.homedir(), 'Desktop'),
    fileName: '歌名 - 歌手',
    maxDownloadNum: 3,
    isDownloadLrc: false,
    isEmbedPic: true,
    isEmbedLyric: false,
  },
  leaderboard: {
    source: 'kw',
    tabId: 'kw__16',
  },
  songList: {
    source: 'kw',
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
    searchSource: 'all',
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
    themeId: 0,
  },
  windowSizeId: 2,
  themeId: 6,
  langId: null,
  sourceId: 'kw',
  apiSource: 'wy',
  sourceNameType: 'alias',
  isShowAnimation: true,
  randomAnimate: true,
  ignoreVersion: null,
  isAgreePact: false,
  controlBtnPosition: process.platform === 'darwin' ? 'left' : 'right',
}

const overwriteSetting = {

}

// 使用新年皮肤
// if (new Date().getMonth() < 2) defaultSetting.themeId = 9


exports.defaultSetting = defaultSetting
exports.overwriteSetting = overwriteSetting
