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
    return { id: source.id, name: window.i18n.t('store.state.source_' + source.id) }
  },
  sources(state) {
    return {
      active: state.setting.sourceId,
      list: music.sources.map(item => ({ id: item.id, name: window.i18n.t('store.state.source_' + item.id) })),
    }
  },
  sourceNames() {
    const sources = {}
    for (const source of music.sources) {
      sources[source.id] = window.i18n.t('store.state.source_' + source.id)
    }
    sources.all = window.i18n.t('store.state.source_all')
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
}
