import { isDomesticOnlineSource } from '@common/constants'
import { qualityList, userApi } from '@renderer/store'
import { appSetting } from '@renderer/store/setting'
import { normalizeApiSourceBackups } from '@common/userApi'
import { BUILTIN_YTM_QUALITIES } from '@renderer/utils/musicSdk/ytm/streamUtils'
import { isProviderServable, type SourceRotationEnv } from './sourceRotation'

export { BUILTIN_YTM_QUALITIES }

/** UI 与取流链使用同一份启用、就绪及取流能力快照（内置 YouTube Music 原生直链引擎始终就绪）。 */
export const sourceRotationEnv = (): SourceRotationEnv => {
  const primaryApiId = appSetting['common.apiSource']
  const readyApiIds = Object.keys(userApi.apis)
  const servedProviders: Record<string, string[]> = {}
  for (const apiId of readyApiIds) {
    servedProviders[apiId] = Object.keys(userApi.qualityLists[apiId] ?? {})
      .filter(provider => typeof userApi.apis[apiId]?.[provider as LX.Source]?.getMusicUrl === 'function')
  }
  const primaryProviders = Object.keys(qualityList.value)
  if (!primaryProviders.includes('ytm')) primaryProviders.push('ytm')
  return {
    primaryApiId,
    primaryServedProviders: primaryProviders,
    backupApiIds: normalizeApiSourceBackups(primaryApiId, appSetting['common.apiSourceBackups']),
    readyApiIds,
    servedProviders,
  }
}

/** 播放能力判定：ytm 内置原生直连引擎与本地音频一样始终可播，国内源按主源/备源就绪态判定。 */
export const assertPlaybackSupport = (source: LX.Source): boolean => {
  if (source === 'local' || source === 'ytm') return true
  return isProviderServable(sourceRotationEnv(), source)
}

/** 获取某在线来源的可用下载/播放音质列表（ytm 在未由自定义源覆写时使用内置 ['128k', '320k']）。 */
export const getEffectiveSourceQualities = (source: LX.OnlineSource): LX.Quality[] => {
  const configured = qualityList.value[source]
  if (Array.isArray(configured) && configured.length) return configured
  if (source === 'ytm') return BUILTIN_YTM_QUALITIES
  return []
}

/** 直接下载单一守门：覆盖全部在线音源（含与 QQ/网易平权的 ytm），校验来源支持音质与曲目可用音质存在非空交集。 */
export const canDirectDownload = (musicInfo: LX.Music.MusicInfo | null | undefined): musicInfo is LX.Music.MusicInfoOnline => {
  if (!musicInfo || musicInfo.source === 'local') return false
  if (musicInfo.source !== 'ytm' && !isDomesticOnlineSource(musicInfo.source)) return false
  const supportedQualities = getEffectiveSourceQualities(musicInfo.source)
  if (!supportedQualities.length) return false
  const metaQualities = musicInfo.meta?._qualitys
  if (!metaQualities || typeof metaQualities !== 'object') return false
  const availableKeys = Object.keys(metaQualities).filter(q => {
    const entry = metaQualities[q as LX.Quality]
    return entry !== null && typeof entry === 'object'
  })
  if (!availableKeys.length) return false
  return availableKeys.some(q => supportedQualities.includes(q as LX.Quality))
}
