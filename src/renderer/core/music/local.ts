import { encodePath } from '@common/utils/common'
import { updateListMusics } from '@renderer/store/list/action'
import { saveLyric, saveMusicUrl } from '@renderer/utils/ipc'
import { getLocalFilePath } from '@renderer/utils/music'

import {
  buildLyricInfo,
  getCachedLyricInfo,
  getOnlineOtherSourceLyricInfo,
  getOnlineOtherSourceMusicUrl,
  getOnlineOtherSourcePicUrl,
  getOtherSource,
} from './utils'


export const getMusicUrl = async({ musicInfo, isRefresh, onToggleSource = () => {} }: {
  musicInfo: LX.Music.MusicInfoLocal
  isRefresh: boolean
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
}): Promise<string> => {
  if (!isRefresh) {
    const path = await getLocalFilePath(musicInfo)
    if (path) return encodePath(path)
  }
  onToggleSource()
  const otherSource = await getOtherSource(musicInfo)
  if (!otherSource.length) throw new Error('source not found')
  return getOnlineOtherSourceMusicUrl({ musicInfos: [...otherSource], onToggleSource, isRefresh }).then(({ url, quality: targetQuality, musicInfo: targetMusicInfo, isFromCache }) => {
    // saveLyric(musicInfo, data.lyricInfo)
    if (!isFromCache) void saveMusicUrl(targetMusicInfo, targetQuality, url)

    // TODO: save url ?
    return url
  })
}

export const getPicUrl = async({ musicInfo, listId, isRefresh, onToggleSource = () => {} }: {
  musicInfo: LX.Music.MusicInfoLocal
  listId?: string | null
  isRefresh: boolean
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
}): Promise<string> => {
  if (!isRefresh) {
    const pic = await window.lx.worker.main.getMusicFilePic(musicInfo.meta.filePath)
    if (pic) return pic

    if (musicInfo.meta.picUrl) return musicInfo.meta.picUrl
  }

  onToggleSource()
  const otherSource = await getOtherSource(musicInfo)
  if (!otherSource.length) throw new Error('source not found')
  return getOnlineOtherSourcePicUrl({ musicInfos: [...otherSource], onToggleSource, isRefresh }).then(({ url, musicInfo: targetMusicInfo, isFromCache }) => {
    if (listId) {
      musicInfo.meta.picUrl = url
      void updateListMusics([{ id: listId, musicInfo }])
    }

    return url
  })
}

export const getLyricInfo = async({ musicInfo, isRefresh, onToggleSource = () => {} }: {
  musicInfo: LX.Music.MusicInfoLocal
  isRefresh: boolean
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
}): Promise<LX.Player.LyricInfo> => {
  if (!isRefresh) {
    const lyricInfo = await getCachedLyricInfo(musicInfo)
    if (lyricInfo) {
      // 存在已编辑、原始歌词
      if (lyricInfo.rawlrcInfo.lyric) return buildLyricInfo(lyricInfo)
    }

    // 尝试读取文件内歌词
    const rawlrcInfo = await window.lx.worker.main.getMusicFileLyric(musicInfo.meta.filePath)
    if (rawlrcInfo) return buildLyricInfo(lyricInfo ? { ...lyricInfo, rawlrcInfo } : rawlrcInfo)
  }

  onToggleSource()
  const otherSource = await getOtherSource(musicInfo)
  if (!otherSource.length) throw new Error('source not found')
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  return getOnlineOtherSourceLyricInfo({ musicInfos: [...otherSource], onToggleSource, isRefresh }).then(({ lyricInfo, musicInfo: targetMusicInfo, isFromCache }) => {
    void saveLyric(musicInfo, lyricInfo)

    if (isFromCache) return buildLyricInfo(lyricInfo)
    void saveLyric(targetMusicInfo, lyricInfo)

    return buildLyricInfo(lyricInfo)
  })
}
