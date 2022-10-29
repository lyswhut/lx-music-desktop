// 业务工具方法

export const toNewMusicInfo = (oldMusicInfo: any): LX.Music.MusicInfoOnline => {
  const meta: Record<string, any> = {
    songId: oldMusicInfo.songmid, // 歌曲ID，mg源为copyrightId，local为文件路径
    albumName: oldMusicInfo.albumName, // 歌曲专辑名称
    albumId: oldMusicInfo.albumId,
    picUrl: oldMusicInfo.img, // 歌曲图片链接
    qualitys: oldMusicInfo.types,
    _qualitys: oldMusicInfo._types,
  }
  if (meta._qualitys.flac32bit && !meta._qualitys.flac24bit) {
    meta._qualitys.flac24bit = meta._qualitys.flac32bit
    delete meta._qualitys.flac32bit

    meta.qualitys = (meta.qualitys as any[]).map(quality => {
      if (quality.type == 'flac32bit') quality.type = 'flac24bit'
      return quality
    })
  }

  switch (oldMusicInfo.source) {
    case 'kg':
      meta.hash = oldMusicInfo.hash
      break
    case 'tx':
      meta.strMediaMid = oldMusicInfo.strMediaMid
      meta.albumMid = oldMusicInfo.albumMid
      break
    case 'mg':
      meta.copyrightId = oldMusicInfo.copyrightId
      meta.lrcUrl = oldMusicInfo.lrcUrl
      meta.mrcUrl = oldMusicInfo.mrcUrl
      meta.trcUrl = oldMusicInfo.trcUrl
      break
  }
  return {
    id: `${oldMusicInfo.source as string}_${oldMusicInfo.songmid as string}`,
    name: oldMusicInfo.name,
    singer: oldMusicInfo.singer,
    source: oldMusicInfo.source,
    interval: oldMusicInfo.interval,
    meta: meta as LX.Music.MusicInfoOnline['meta'],
  }
}

export const toOldMusicInfo = (minfo: LX.Music.MusicInfoOnline) => {
  const oInfo: Record<string, any> = {
    name: minfo.name,
    singer: minfo.singer,
    source: minfo.source,
    songmid: minfo.meta.songId,
    albumId: minfo.meta.albumId,
    interval: minfo.interval,
    albumName: minfo.meta.albumName,
    img: minfo.meta.picUrl,
    types: minfo.meta.qualitys,
    _types: minfo.meta._qualitys,
    typeUrl: {},
  }
  switch (minfo.source) {
    case 'kg':
      oInfo.hash = minfo.meta.hash
      break
    case 'tx':
      oInfo.strMediaMid = minfo.meta.strMediaMid
      oInfo.albumMid = minfo.meta.albumMid
      break
    case 'mg':
      oInfo.copyrightId = minfo.meta.copyrightId
      oInfo.lrcUrl = minfo.meta.lrcUrl
      oInfo.mrcUrl = minfo.meta.mrcUrl
      oInfo.trcUrl = minfo.meta.trcUrl
      break
  }

  return oInfo
}

/**
 * 修复2.0.0-dev.8之前的新列表数据音质
 * @param musicInfo
 */
export const fixNewMusicInfoQuality = (musicInfo: LX.Music.MusicInfo) => {
  if (musicInfo.source == 'local') return musicInfo

  // @ts-expect-error
  if (musicInfo.meta._qualitys.flac32bit && !musicInfo.meta._qualitys.flac24bit) {
    // @ts-expect-error
    musicInfo.meta._qualitys.flac24bit = musicInfo.meta._qualitys.flac32bit
    // @ts-expect-error
    delete musicInfo.meta._qualitys.flac32bit

    musicInfo.meta.qualitys = musicInfo.meta.qualitys.map(quality => {
      // @ts-expect-error
      if (quality.type == 'flac32bit') quality.type = 'flac24bit'
      return quality
    })
  }

  return musicInfo
}
