import music from '../utils/music'
import { themes, windowSizeList, themeShouldUseDarkColors } from '@renderer/core/share'

export default {
  theme(state) {
    const themeId = state.setting.theme.id == 'auto'
      ? themeShouldUseDarkColors.value
        ? state.setting.theme.darkId
        : state.setting.theme.lightId
      : state.setting.theme.id
    let theme = themes.find(theme => theme.id == themeId) ?? themes[0]
    return theme.className
  },
  font(state) {
    return state.setting.font
  },
  themes(state) {
    return {
      active: state.setting.theme.id,
      lightId: state.setting.theme.lightId,
      darkId: state.setting.theme.darkId,
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
  isShowAnimation(state) {
    return state.setting.isShowAnimation
  },
}
