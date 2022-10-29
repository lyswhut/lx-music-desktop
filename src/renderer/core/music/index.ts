// if (targetSong.key) { // 如果是已下载的歌曲
//   const filePath = path.join(appSetting['download.savePath'], targetSong.metadata.fileName)
//   // console.log(filePath)

import {
  getMusicUrl as getOnlineMusicUrl,
  getPicUrl as getOnlinePicUrl,
  getLyricInfo as getOnlineLyricInfo,
} from './online'
import {
  getMusicUrl as getDownloadMusicUrl,
  getPicUrl as getDownloadPicUrl,
  getLyricInfo as getDownloadLyricInfo,
} from './download'
import {
  getMusicUrl as getLocalMusicUrl,
  getPicUrl as getLocalPicUrl,
  getLyricInfo as getLocalLyricInfo,
} from './local'


export const getMusicUrl = async({
  musicInfo,
  quality,
  isRefresh = false,
  onToggleSource,
}: {
  musicInfo: LX.Music.MusicInfo | LX.Download.ListItem
  isRefresh?: boolean
  quality?: LX.Quality
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
}): Promise<string> => {
  if ('progress' in musicInfo) {
    return await getDownloadMusicUrl({ musicInfo, isRefresh, onToggleSource })
  } else if (musicInfo.source == 'local') {
    return await getLocalMusicUrl({ musicInfo, isRefresh, onToggleSource })
  } else {
    return await getOnlineMusicUrl({ musicInfo, isRefresh, quality, onToggleSource })
  }
}

export const getPicPath = async({
  musicInfo,
  isRefresh = false,
  listId,
  onToggleSource,
}: {
  musicInfo: LX.Music.MusicInfo | LX.Download.ListItem
  listId?: string | null
  isRefresh?: boolean
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
}): Promise<string> => {
  if ('progress' in musicInfo) {
    return await getDownloadPicUrl({ musicInfo, isRefresh, listId, onToggleSource })
  } else if (musicInfo.source == 'local') {
    return await getLocalPicUrl({ musicInfo, isRefresh, listId, onToggleSource })
  } else {
    return await getOnlinePicUrl({ musicInfo, isRefresh, listId, onToggleSource })
  }
}

export const getLyricInfo = async({
  musicInfo,
  isRefresh = false,
  onToggleSource,
}: {
  musicInfo: LX.Music.MusicInfo | LX.Download.ListItem
  isRefresh?: boolean
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
}): Promise<LX.Player.LyricInfo> => {
  if ('progress' in musicInfo) {
    return await getDownloadLyricInfo({ musicInfo, isRefresh, onToggleSource })
  } else if (musicInfo.source == 'local') {
    return await getLocalLyricInfo({ musicInfo, isRefresh, onToggleSource })
  } else {
    return await getOnlineLyricInfo({ musicInfo, isRefresh, onToggleSource })
  }
}
