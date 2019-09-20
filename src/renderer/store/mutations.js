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
    // val.history.forEach(ver => {
    //   ver.desc = ver.desc.replace(/\n/g, '<br>')
    // })
    // val.desc = val.desc.replace(/\n/g, '<br>')
    state.version.newVersion = val
  },
  setVersionModalVisible(state, { isShow, isError }) {
    if (isShow !== undefined) state.version.showModal = isShow
    if (isError !== undefined) state.version.isError = isError
  },
  setVolume(state, val) {
    state.setting.player.volume = val
  },
}
