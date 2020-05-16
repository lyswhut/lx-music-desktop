import path from 'path'
import os from 'os'

const defaultSetting = {
  version: '1.0.24',
  player: {
    togglePlayMethod: 'listLoop',
    highQuality: false,
    isShowTaskProgess: true,
    volume: 1,
    mediaDeviceId: 'default',
    isMediaDeviceRemovedStopPlay: false,
  },
  list: {
    isShowAlbumName: true,
    isShowSource: true,
    scroll: {
      enable: true,
      locations: {},
    },
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
    tabId: 'kwbiaosb',
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
  langId: 'cns',
  sourceId: 'kw',
  apiSource: 'temp',
  sourceNameType: 'alias',
  randomAnimate: true,
  ignoreVersion: null,
  isAgreePact: false,
}

const overwriteSetting = {

}

// 使用新年皮肤
if (new Date().getMonth() < 2) defaultSetting.themeId = 9


export { defaultSetting, overwriteSetting }
