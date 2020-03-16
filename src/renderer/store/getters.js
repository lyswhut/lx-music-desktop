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
    const source = music.sources.find(s => s.id === state.setting.sourceId) || music.sources[0]
    return source
  },
  sources(state) {
    return {
      active: state.setting.sourceId,
      list: music.sources,
    }
  },
  sourceNames(state) {
    let prefix = 'store.state.source_'
    if (state.setting.sourceNameType == 'alias') prefix += 'alias_'
    const sources = {}
    for (const source of music.sources) {
      sources[source.id] = window.i18n.t(prefix + source.id)
    }
    sources.all = window.i18n.t(prefix + 'all')
    return sources
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
  windowSizeActive(state) {
    return state.windowSizeList.find(i => i.id === state.setting.windowSizeId) || state.windowSizeList[0]
  },
}
