import music from '../utils/music'

export default {
  theme(state) {
    return (state.themes[state.setting.themeId] && state.themes[state.setting.themeId].class) || ''
  },
  themes(state) {
    return {
      active: state.setting.themeId,
      list: state.themes,
    }
  },
  source(state) {
    return music.sources.find(s => s.id === state.setting.sourceId) || music.sources[0]
  },
  sources(state) {
    return {
      active: state.setting.sourceId,
      list: music.sources,
    }
  },
  userInfo(state) {
    return state.userInfo
  },
  setting(state) {
    return state.setting
  },
  settingVersion(state) {
    return state.settingVersion
  },
  version(state) {
    return state.version
  },
  route(state) {
    return state.route
  },
  windowSizeList(state) {
    return state.windowSizeList
  },
}
