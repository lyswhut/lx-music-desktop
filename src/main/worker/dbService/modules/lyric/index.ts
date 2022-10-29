import {
  queryLyric,
  queryRawLyric,
  inertRawLyric,
  deleteRawLyric,
  updateRawLyric,
  clearRawLyric,
  queryEditedLyric,
  inertEditedLyric,
  deleteEditedLyric,
  updateEditedLyric,
  clearEditedLyric,
  countEditedLyric,
  countRawLyric,
} from './dbHelper'

const keys = ['lyric', 'tlyric', 'rlyric', 'lxlyric'] as const

const toDBLyric = (id: string, source: LX.DBService.Lyricnfo['source'], lyricInfo: LX.Music.LyricInfo): LX.DBService.Lyricnfo[] => {
  return (keys.map(k => [k, lyricInfo[k]])
    .filter(([k, t]) => t != null) as Array<[LX.DBService.Lyricnfo['type'], string]>)
    .map(([k, t]) => {
      return {
        id,
        type: k,
        text: Buffer.from(t).toString('base64'),
        source,
      }
    })
}

/**
 * 获取歌词
 * @param id 歌曲id
 * @returns 歌词信息
 */
export const getPlayerLyric = (id: string): LX.Player.LyricInfo => {
  const lyrics = queryLyric(id)

  let lyricInfo: LX.Music.LyricInfo = {
    lyric: '',
  }
  let rawLyricInfo: LX.Music.LyricInfo = {
    lyric: '',
  }
  for (const lyric of lyrics) {
    switch (lyric.source) {
      case 'edited':
        if (lyric.type == 'lyric') lyricInfo.lyric = Buffer.from(lyric.text, 'base64').toString()
        else if (lyric.text != null) lyricInfo[lyric.type] = Buffer.from(lyric.text, 'base64').toString()
        break
      default:
        if (lyric.type == 'lyric') rawLyricInfo.lyric = Buffer.from(lyric.text, 'base64').toString()
        else if (lyric.text != null) rawLyricInfo[lyric.type] = Buffer.from(lyric.text, 'base64').toString()
        break
    }
  }

  return lyricInfo.lyric ? {
    ...lyricInfo,
    rawlrcInfo: rawLyricInfo,
  } : {
    ...rawLyricInfo,
    rawlrcInfo: rawLyricInfo,
  }
}

/**
 * 获取原始歌词
 * @param id 歌曲id
 * @returns 歌词信息
 */
export const getRawLyric = (id: string): LX.Music.LyricInfo => {
  const lyrics = queryRawLyric(id)

  let lyricInfo: LX.Music.LyricInfo = {
    lyric: '',
  }
  for (const lyric of lyrics) {
    if (lyric.type == 'lyric') lyricInfo.lyric = Buffer.from(lyric.text, 'base64').toString()
    else if (lyric.text != null) lyricInfo[lyric.type] = Buffer.from(lyric.text, 'base64').toString()
  }

  return lyricInfo
}

/**
 * 保存原始歌词信息
 * @param id 歌曲id
 * @param lyricInfo 歌词信息
 */
export const rawLyricAdd = (id: string, lyricInfo: LX.Music.LyricInfo) => {
  inertRawLyric(toDBLyric(id, 'raw', lyricInfo))
}

/**
 * 删除原始歌词信息
 * @param ids 歌曲id
 */
export const rawLyricRemove = (ids: string[]) => {
  deleteRawLyric(ids)
}

/**
 * 更新原始歌词信息
 * @param id 歌曲id
 * @param lyricInfo 歌词信息
 */
export const rawLyricUpdate = (id: string, lyricInfo: LX.Music.LyricInfo) => {
  updateRawLyric(toDBLyric(id, 'raw', lyricInfo))
}

/**
 * 清空原始歌词信息
 */
export const rawLyricClear = () => {
  clearRawLyric()
}

/**
 * 统计原始歌词数量
 */
export const rawLyricCount = () => {
  return countRawLyric()
}


/**
 * 获取已编辑歌词
 * @param id 歌曲id
 * @returns 歌词信息
 */
export const getEditedLyric = (id: string): LX.Music.LyricInfo => {
  const lyrics = queryEditedLyric(id)

  let lyricInfo: LX.Music.LyricInfo = {
    lyric: '',
  }
  for (const lyric of lyrics) {
    if (lyric.type == 'lyric') lyricInfo.lyric = Buffer.from(lyric.text, 'base64').toString()
    else if (lyric.text != null) lyricInfo[lyric.type] = Buffer.from(lyric.text, 'base64').toString()
  }

  return lyricInfo
}

/**
 * 保存已编辑歌词信息
 * @param id 歌曲id
 * @param lyricInfo 歌词信息
 */
export const editedLyricAdd = (id: string, lyricInfo: LX.Music.LyricInfo) => {
  inertEditedLyric(toDBLyric(id, 'edited', lyricInfo))
}

/**
 * 删除已编辑歌词信息
 * @param ids 歌曲id
 */
export const editedLyricRemove = (ids: string[]) => {
  deleteEditedLyric(ids)
}

/**
 * 更新已编辑歌词信息
 * @param id 歌曲id
 * @param lyricInfo 歌词信息
 */
export const editedLyricUpdate = (id: string, lyricInfo: LX.Music.LyricInfo) => {
  updateEditedLyric(toDBLyric(id, 'edited', lyricInfo))
}

/**
 * 清空已编辑歌词信息
 */
export const editedLyricClear = () => {
  clearEditedLyric()
}

/**
 * 新增或更新已编辑歌词信息
 * @param id 歌曲id
 * @param lyricInfo 歌词信息
 */
export const editedLyricUpdateAddAndUpdate = (id: string, lyricInfo: LX.Music.LyricInfo) => {
  const lyrics = queryEditedLyric(id)
  if (lyrics.length) updateEditedLyric(toDBLyric(id, 'edited', lyricInfo))
  else inertEditedLyric(toDBLyric(id, 'edited', lyricInfo))
}

/**
 * 统计已编辑歌词数量
 */
export const editedLyricCount = () => {
  return countEditedLyric()
}

