import { DOWNLOAD_STATUS, QUALITYS } from '@common/constants'
import { filterFileName } from '@common/utils/common'
import { buildLyrics } from './lrcTool'
import fs from 'fs'
import { clipFileNameLength, clipNameLength, formatMusicName } from '@common/utils/tools'

/**
 * 保存歌词文件
 */
export const saveLrc = async(
  lrcData: LX.Music.LyricInfo,
  info: {
    filePath: string
    format: LX.LyricFormat
    downloadLxlrc: boolean
    downloadTlrc: boolean
    downloadRlrc: boolean
  },
) => {
  const iconv = (await import('iconv-lite')).default
  const lrc = buildLyrics(lrcData, info.downloadLxlrc, info.downloadTlrc, info.downloadRlrc)
  switch (info.format) {
    case 'gbk':
      fs.writeFile(info.filePath, iconv.encode(lrc, 'gbk', { addBOM: true }), (err) => {
        if (err) console.log(err)
      })
      break
    case 'utf8':
    default:
      fs.writeFile(info.filePath, iconv.encode(lrc, 'utf8', { addBOM: true }), (err) => {
        if (err) console.log(err)
      })
      break
  }
}

export const getExt = (type: string): LX.Download.FileExt => {
  switch (type) {
    case 'flac':
    case 'master':
    case 'atmos_plus':
    case 'atmos':
    case 'hires':
    case 'flac24bit':
    case 'vinyl':
    case 'dolby':
      return 'flac'
    case '128k':
    case '192k':
    case '320k':
    default:
      return 'mp3'
  }
}

/**
 * 获取音乐音质
 * @param musicInfo
 * @param type
 * @param qualityList
 */
export const getMusicType = (
  musicInfo: LX.Music.MusicInfoOnline,
  type: LX.Quality,
  qualityList: LX.QualityList,
): LX.Quality => {
  let list = qualityList[musicInfo.source]
  if (!list) return '128k'
  if (!list.includes(type)) type = list[list.length - 1]
  const rangeType = QUALITYS.slice(QUALITYS.indexOf(type))
  for (const type of rangeType) {
    if (musicInfo.meta._qualitys[type]) return type
  }
  return '128k'
}

export const createDownloadInfo = (
  musicInfo: LX.Music.MusicInfoOnline,
  type: LX.Quality,
  fileName: string,
  qualityList: LX.QualityList,
  listId?: string,
) => {
  type = getMusicType(musicInfo, type, qualityList)
  let ext = getExt(type)
  const key = `${musicInfo.id}_${type}_${ext}`
  const downloadInfo: LX.Download.ListItem = {
    id: key,
    isComplate: false,
    status: DOWNLOAD_STATUS.WAITING,
    statusText: '待下载',
    downloaded: 0,
    total: 0,
    progress: 0,
    speed: '',
    writeQueue: 0,
    metadata: {
      musicInfo,
      url: null,
      quality: type,
      ext,
      filePath: '',
      listId,
      fileName: filterFileName(
        `${clipFileNameLength(
          formatMusicName(fileName, musicInfo.name, clipNameLength(musicInfo.singer)),
        )}.${ext}`,
      ),
    },
  }

  return downloadInfo
}
