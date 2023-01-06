// import { getListFromState } from './list'
// import { downloadList } from './download'


// export const getList = (listId: string | null): LX.Download.ListItem[] | LX.Music.MusicInfo[] => {
//   return listId == 'download' ? downloadList : getListFromState(listId)
// }
import { encodePath, isUrl } from '@common/utils/common'
import { joinPath } from '@common/utils/nodejs'
import { markRaw, shallowReactive } from '@common/utils/vueTools'
import { getThemes as getTheme } from '@renderer/utils/ipc'
import { qualityList, themeInfo, themeShouldUseDarkColors } from './index'

export const assertApiSupport = (source: LX.Source): boolean => {
  return source == 'local' || qualityList.value[source] != null
}

export const buildBgUrl = (originUrl: string, dataPath: string): string => {
  return isUrl(originUrl)
    ? `url(${originUrl})`
    : `url(file:///${encodePath(joinPath(dataPath, originUrl).replaceAll('\\', '/'))})`
}

export const getThemes = (callback: (themeInfo: LX.ThemeInfo) => void) => {
  if (themeInfo.themes.length) {
    callback(themeInfo)
    return
  }
  void getTheme().then(info => {
    themeInfo.themes = markRaw(info.themes)
    themeInfo.userThemes = shallowReactive(info.userThemes)
    themeInfo.dataPath = info.dataPath
    callback(themeInfo)
  })
}
export const buildThemeColors = (theme: LX.Theme, dataPath: string) => {
  if (theme.isCustom && theme.config.extInfo['--background-image'] != 'none') {
    theme = copyTheme(theme)
    theme.config.extInfo['--background-image'] = buildBgUrl(theme.config.extInfo['--background-image'], dataPath)
  }
  const colors: Record<string, string> = {
    ...theme.config.themeColors,
    ...theme.config.extInfo,
  }

  return colors
}

export const copyTheme = (theme: LX.Theme): LX.Theme => {
  return {
    ...theme,
    config: {
      ...theme.config,
      extInfo: { ...theme.config.extInfo },
      themeColors: { ...theme.config.themeColors },
    },
  }
}

export const findTheme = (themeInfo: LX.ThemeInfo, id: string): LX.Theme | undefined => {
  let theme = themeInfo.themes.find(theme => theme.id == id)
  if (theme) return theme
  theme = themeInfo.userThemes.find(theme => theme.id == id)
  return theme
}

export const applyTheme = (id: string, lightId: string, darkId: string, dataPath: string) => {
  getThemes((themeInfo) => {
    let themeId = id == 'auto'
      ? themeShouldUseDarkColors.value
        ? darkId
        : lightId
      : id

    let theme = findTheme(themeInfo, themeId)
    if (!theme) {
      themeId = id == 'auto' && themeShouldUseDarkColors.value ? 'black' : 'green'
      theme = themeInfo.themes.find(theme => theme.id == themeId) as LX.Theme
    }
    window.setTheme(buildThemeColors(theme, dataPath))
  })
}
