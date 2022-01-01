import music from '../utils/music'
import { themes, windowSizeList } from '@renderer/core/share'

export default {
  theme(state) {
    let theme = themes.find(theme => theme.id == state.setting.themeId)
    return (theme && theme.className) || ''
  },
  themes(state) {
    return {
      active: state.setting.themeId,
      list: themes,
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
    let prefix = 'source_'
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
  windowSizeList() {
    return windowSizeList
  },
  windowSizeActive(state) {
    return windowSizeList.find(i => i.id === state.setting.windowSizeId) || windowSizeList[0]
  },
  pactModalVisible(state) {
    return !state.setting.isAgreePact
  },
}
