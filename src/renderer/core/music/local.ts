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


const getOtherSourceByLocal = async(musicInfo: LX.Music.MusicInfoLocal) => {
  let result: LX.Music.MusicInfoOnline[] = []
  result = await getOtherSource(musicInfo)
  if (result.length) return result
  if (musicInfo.name.includes('-')) {
    const [name, singer] = musicInfo.name.split('-').map(val => val.trim())
    result = await getOtherSource({
      ...musicInfo,
      name,
      singer,
    })
    if (result.length) return result
    result = await getOtherSource({
      ...musicInfo,
      name: singer,
      singer: name,
    })
    if (result.length) return result
  }
  let fileName = musicInfo.meta.filePath.split('/').at(-1)
  if (fileName) {
    fileName = fileName.substring(0, fileName.lastIndexOf('.'))
    if (fileName != musicInfo.name) {
      if (fileName.includes('-')) {
        const [name, singer] = fileName.split('-').map(val => val.trim())
        result = await getOtherSource({
          ...musicInfo,
          name,
          singer,
        })
        if (result.length) return result
        result = await getOtherSource({
          ...musicInfo,
          name: singer,
          singer: name,
        })
      } else {
        result = await getOtherSource({
          ...musicInfo,
          name: fileName,
          singer: '',
        })
      }
      if (result.length) return result
    }
  }

  return result
}

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
  const otherSource = await getOtherSourceByLocal(musicInfo)
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
  const otherSource = await getOtherSourceByLocal(musicInfo)
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
    const [lyricInfo, fileLyricInfo] = await Promise.all([getCachedLyricInfo(musicInfo), window.lx.worker.main.getMusicFileLyric(musicInfo.meta.filePath)])
    if (lyricInfo?.lyric && lyricInfo.lyric != lyricInfo.rawlrcInfo.lyric) {
      // 存在已编辑歌词
      return buildLyricInfo({ ...lyricInfo, rawlrcInfo: fileLyricInfo ?? lyricInfo.rawlrcInfo })
    }

    if (fileLyricInfo) return buildLyricInfo(fileLyricInfo)
    if (lyricInfo?.lyric) return buildLyricInfo(lyricInfo)
  }

  onToggleSource()
  const otherSource = await getOtherSourceByLocal(musicInfo)
  if (!otherSource.length) throw new Error('source not found')
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  return getOnlineOtherSourceLyricInfo({ musicInfos: [...otherSource], onToggleSource, isRefresh }).then(({ lyricInfo, musicInfo: targetMusicInfo, isFromCache }) => {
    void saveLyric(musicInfo, lyricInfo)

    if (isFromCache) return buildLyricInfo(lyricInfo)
    void saveLyric(targetMusicInfo, lyricInfo)

    return buildLyricInfo(lyricInfo)
  })
}
