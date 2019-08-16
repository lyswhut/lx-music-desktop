export default {
  setTheme(state, val) {
    state.setting.themeId = val
  },
  setSource(state, val) {
    state.setting.sourceId = val
  },
  setSetting(state, val) {
    state.setting = val
  },
  setLeaderboard(state, { tabId, source }) {
    if (tabId != null) state.setting.leaderboard.tabId = tabId
    if (source != null) state.setting.leaderboard.source = source
  },
  setNewVersion(state, val) {
    val.history.forEach(ver => {
      ver.desc = ver.desc.replace(/\n/g, '<br>')
    })
    // val.desc = val.desc.replace(/\n/g, '<br>')
    state.version.newVersion = val
  },
  setVersionVisible(state, val) {
    state.version.showModal = val
  },
}
