export default {
  setTheme(state, val) {
    state.setting.themeId = val
  },
  setSearchSource(state, { searchSource, tempSearchSource }) {
    if (searchSource != null) state.setting.search.searchSource = searchSource
    if (tempSearchSource != null) state.setting.search.tempSearchSource = tempSearchSource
  },
  setSetting(state, val) {
    state.setting = val
  },
  setSettingVersion(state, val) {
    state.settingVersion = val
  },
  setAgreePact(state) {
    state.setting.isAgreePact = true
  },
  setLeaderboard(state, { tabId, source }) {
    if (tabId != null) state.setting.leaderboard.tabId = tabId
    if (source != null) state.setting.leaderboard.source = source
  },
  setSongList(state, { sortId, tagInfo, source }) {
    if (tagInfo != null) state.setting.songList.tagInfo = tagInfo
    if (sortId != null) state.setting.songList.sortId = sortId
    if (source != null) state.setting.songList.source = source
  },
  setNewVersion(state, val) {
    state.version.newVersion = val
  },
  setDownloadProgress(state, info) {
    state.version.downloadProgress = info
  },
  setVersionModalVisible(state, { isShow, isError, isDownloaded, isTimeOut, isDownloading, isUnknow, isLatestVer }) {
    if (isError !== undefined) state.version.isError = isError
    if (isTimeOut !== undefined) state.version.isTimeOut = isTimeOut
    if (isDownloading !== undefined) state.version.isDownloading = isDownloading
    if (isDownloaded !== undefined) state.version.isDownloaded = isDownloaded
    if (isUnknow !== undefined) state.version.isUnknow = isUnknow
    if (isLatestVer !== undefined) state.version.isLatestVer = isLatestVer
    if (isShow !== undefined) state.version.showModal = isShow
  },
  setIgnoreVersion(state, version) {
    state.setting.ignoreVersion = version
  },
  setVolume(state, val) {
    if (typeof val == 'boolean') {
      state.setting.player.isMute = val
    } else {
      state.setting.player.volume = val
    }
  },
  setPlayNextMode(state, val) {
    state.setting.player.togglePlayMethod = val
  },
  setVisibleDesktopLyric(state, val) {
    state.setting.desktopLyric.enable = val
  },
  setLockDesktopLyric(state, val) {
    state.setting.desktopLyric.isLock = val
  },
  setMediaDeviceId(state, val) {
    state.setting.player.mediaDeviceId = val
  },
  setPrevSelectListId(state, val) {
    state.setting.list.prevSelectListId = val
  },
  setDesktopLyricConfig(state, config) {
    state.setting.desktopLyric = Object.assign(state.setting.desktopLyric, config)
  },
}
