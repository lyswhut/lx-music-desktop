import { ref } from '@renderer/utils/vueTools'

export const currentStting = ref({
  player: {
    togglePlayMethod: 'random',
    highQuality: false,
    isShowTaskProgess: true,
    volume: 1,
    mediaDeviceId: 'default',
    isMediaDeviceRemovedStopPlay: false,
  },
  desktopLyric: {
    enable: false,
    isLock: false,
    width: 600,
    height: 700,
    x: -1,
    y: -1,
    theme: '',
    style: {
      font: '',
      fontSize: 125,
      opacity: 80,
      isZoomActiveLrc: true,
    },
  },
  list: {
    isShowAlbumName: true,
    isShowSource: true,
    isSaveScrollLocation: true,
  },
  search: {
    searchSource: 'kw',
    tempSearchSource: 'kw',
    isShowHotSearch: false,
    isShowHistorySearch: false,
    isFocusSearchBox: false,
  },
  download: {
    enable: false,
    savePath: '',
    fileName: '歌名 - 歌手',
    isDownloadLrc: false,
    lrcFormat: 'utf8',
    isEmbedPic: true,
    isEmbedLyric: true,
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
  odc: {
    isAutoClearSearchInput: false,
    isAutoClearSearchList: false,
  },
  tray: {
    isShow: false,
    isToTray: false,
    themeId: 0,
  },
  sync: {
    enable: false,
    port: '23332',
  },
  windowSizeId: 1,
  langId: 'cns',
  themeId: 0,
  sourceId: 0,
  isShowAnimation: true,
  randomAnimate: true,
  isAgreePact: false,
  controlBtnPosition: 'left',
  apiSource: 'temp',
})
