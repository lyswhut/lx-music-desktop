import { DOMESTIC_ONLINE_SOURCES } from '@common/constants'
import {
  queryMusicUrl,
  insertMusicUrl,
  deleteMusicUrl,
  clearMusicUrl,
  countMusicUrl,
} from './dbHelper'


/**
 * 获取歌曲url
 * @param id 歌曲id
 * @returns 歌曲url
 */
export const getMusicUrl = (id: string): LX.Music.MusicUrlInfo | null => {
  const url = queryMusicUrl(id)
  if (!url) return null
  // 在现有文本列中将换源 URL 与身份一同保存；直接 URL 缓存仍可读取。
  if (!url.startsWith('{')) return { id, url }
  try {
    const cached = JSON.parse(url)
    if (typeof cached?.url !== 'string' || !cached.url) return null
    const info = cached.musicInfo
    const validInfo = info && typeof info.id === 'string' && typeof info.name === 'string' &&
      typeof info.singer === 'string' &&
      (info.source === 'ytm' || (DOMESTIC_ONLINE_SOURCES as readonly string[]).includes(info.source)) &&
      info.meta && typeof info.meta === 'object'
    return { id, url: cached.url, ...(validInfo ? { musicInfo: info } : {}) }
  } catch {
    return null
  }
}

/**
 * 保存歌曲url
 * @param urlInfos url信息
 */
export const musicUrlSave = (urlInfos: LX.Music.MusicUrlInfo[]) => {
  insertMusicUrl(urlInfos.map(info => ({ id: info.id, url: info.musicInfo ? JSON.stringify(info) : info.url })))
}

/**
 * 删除歌曲url
 * @param ids 歌曲id
 */
export const musicUrlRemove = (ids: string[]) => {
  deleteMusicUrl(ids)
}

/**
 * 清空歌曲url
 */
export const musicUrlClear = () => {
  clearMusicUrl()
}

/**
 * 统计歌曲url数量
 */
export const musicUrlCount = () => {
  return countMusicUrl()
}
