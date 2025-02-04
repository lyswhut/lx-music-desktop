import { markRaw } from '@common/utils/vueTools'
import { useRouter } from '@common/utils/vueRouter'
import { decodeName } from '@renderer/utils'
// import { allList, defaultList, loveList, userLists } from '@renderer/store/list'
import { playMusicInfo, isShowPlayerDetail } from '@renderer/store/player/state'
import { setShowPlayerDetail, addTempPlayList } from '@renderer/store/player/action'

import { dataVerify, qualityFilter, sources } from './utils'
import { focusWindow } from '@renderer/utils/ipc'
import { playNext } from '@renderer/core/player/action'
import { toNewMusicInfo } from '@common/utils/tools'
import { LIST_IDS } from '@common/constants'
import { getOtherSource } from '@renderer/core/music/utils'

const useSearchMusic = () => {
  const router = useRouter()

  return ({ paths, data: params }) => {
    let text
    let source
    if (params) {
      text = dataVerify([
        { key: 'keywords', types: ['string', 'number'], max: 128, required: true },
      ], params).keywords
      source = params.source
    } else {
      if (!paths.length) throw new Error('Keyword missing')

      if (paths.length > 1) {
        text = paths[1]
        source = paths[0]
      } else {
        text = paths[0]
      }

      if (text.length > 128) text = text.substring(0, 128)
    }

    if (isShowPlayerDetail.value) setShowPlayerDetail(false)
    const sourceList = [...sources, 'all']
    source = sourceList.includes(source) ? source : null
    setTimeout(() => {
      router.replace({
        path: '/search',
        query: {
          text,
          source,
        },
      })
    }, 500)
    focusWindow()
  }
}

const usePlayMusic = () => {
  const filterInfoByPlayMusic = musicInfo => {
    switch (musicInfo.source) {
      case 'kw':
        musicInfo = dataVerify([
          { key: 'name', types: ['string'], required: true, max: 200 },
          { key: 'singer', types: ['string'], required: true, max: 200 },
          { key: 'source', types: ['string'], required: true },
          { key: 'songmid', types: ['string', 'number'], max: 64, required: true },
          { key: 'img', types: ['string'], max: 1024 },
          { key: 'albumId', types: ['string', 'number'], max: 64 },
          { key: 'interval', types: ['string'], max: 64 },
          { key: 'albumName', types: ['string'], max: 200 },
          { key: 'types', types: ['object'], required: true },
        ], musicInfo)
        break
      case 'kg':
        musicInfo = dataVerify([
          { key: 'name', types: ['string'], required: true, max: 200 },
          { key: 'singer', types: ['string'], required: true, max: 200 },
          { key: 'source', types: ['string'], required: true },
          { key: 'songmid', types: ['string', 'number'], max: 64, required: true },
          { key: 'img', types: ['string'], max: 1024 },
          { key: 'albumId', types: ['string', 'number'], max: 64 },
          { key: 'interval', types: ['string'], max: 64 },
          { key: '_interval', types: ['number'], max: 64 },
          { key: 'albumName', types: ['string'], max: 200 },
          { key: 'types', types: ['object'], required: true },

          { key: 'hash', types: ['string'], required: true, max: 64 },
        ], musicInfo)
        break
      case 'tx':
        musicInfo = dataVerify([
          { key: 'name', types: ['string'], required: true, max: 200 },
          { key: 'singer', types: ['string'], required: true, max: 200 },
          { key: 'source', types: ['string'], required: true },
          { key: 'songmid', types: ['string', 'number'], max: 64, required: true },
          { key: 'img', types: ['string'], max: 1024 },
          { key: 'albumId', types: ['string', 'number'], max: 64 },
          { key: 'interval', types: ['string'], max: 64 },
          { key: 'albumName', types: ['string'], max: 200 },
          { key: 'types', types: ['object'], required: true },

          { key: 'strMediaMid', types: ['string'], required: true, max: 64 },
          { key: 'albumMid', types: ['string'], max: 64 },
        ], musicInfo)
        break
      case 'wy':
        musicInfo = dataVerify([
          { key: 'name', types: ['string'], required: true, max: 200 },
          { key: 'singer', types: ['string'], required: true, max: 200 },
          { key: 'source', types: ['string'], required: true },
          { key: 'songmid', types: ['string', 'number'], max: 64, required: true },
          { key: 'img', types: ['string'], max: 1024 },
          { key: 'albumId', types: ['string', 'number'], max: 64 },
          { key: 'interval', types: ['string'], max: 64 },
          { key: 'albumName', types: ['string'], max: 200 },
          { key: 'types', types: ['object'], required: true },
        ], musicInfo)
        break
      case 'mg':
        musicInfo = dataVerify([
          { key: 'name', types: ['string'], required: true, max: 200 },
          { key: 'singer', types: ['string'], required: true, max: 200 },
          { key: 'source', types: ['string'], required: true },
          { key: 'songmid', types: ['string', 'number'], max: 64, required: true },
          { key: 'img', types: ['string'], max: 1024 },
          { key: 'albumId', types: ['string', 'number'], max: 64 },
          { key: 'interval', types: ['string'], max: 64 },
          { key: 'albumName', types: ['string'], max: 200 },
          { key: 'types', types: ['object'], required: true },

          { key: 'copyrightId', types: ['string', 'number'], required: true, max: 64 },
          { key: 'lrcUrl', types: ['string'], max: 1024 },
          { key: 'trcUrl', types: ['string'], max: 1024 },
          { key: 'mrcUrl', types: ['string'], max: 1024 },
        ], musicInfo)
        break
      default: throw new Error('Unknown source: ' + musicInfo.source)
    }
    musicInfo.types = qualityFilter(musicInfo.source, musicInfo.types)
    return musicInfo
  }

  return ({ data: _musicInfo }) => {
    _musicInfo = filterInfoByPlayMusic(_musicInfo)

    let musicInfo = {
      ..._musicInfo,
      singer: decodeName(_musicInfo.singer),
      name: decodeName(_musicInfo.name),
      albumName: decodeName(_musicInfo.albumName),
      otherSource: null,
      _types: {},
      typeUrl: {},
    }
    for (const type of musicInfo.types) {
      musicInfo._types[type.type] = { size: type.size }
    }
    musicInfo = toNewMusicInfo(musicInfo)
    markRaw(musicInfo)
    const isPlaying = !!playMusicInfo.musicInfo
    addTempPlayList([{ listId: LIST_IDS.PLAY_LATER, musicInfo, isTop: true }])
    if (isPlaying) playNext()
  }
}


const useSearchPlayMusic = () => {
  const verifyInfo = (info) => {
    return dataVerify([
      { key: 'name', types: ['string'], required: true, max: 200 },
      { key: 'singer', types: ['string'], max: 200 },
      { key: 'albumName', types: ['string'], max: 200 },
      { key: 'interval', types: ['string'], max: 64 },
      { key: 'playLater', types: ['boolean'] },
    ], info)
  }

  const searchMusic = async(name, singer, albumName, interval) => {
    return getOtherSource({
      name,
      singer,
      interval,
      meta: {
        albumName,
      },
      source: 'local',
      id: `sp_${name}_s${singer}_a${albumName}_i${interval ?? ''}`,
    })
  }
  return async({ paths, data }) => {
    // console.log(paths, data)
    let info
    if (paths.length) {
      let name = paths[0].trim()
      let singer = ''
      if (name.includes('-')) [name, singer] = name.split('-').map(val => val.trim())
      info = {
        name,
        singer,
      }
    } else info = data
    info = verifyInfo(info)
    if (!info.name) return
    const musicList = await searchMusic(info.name, info.singer || '', info.albumName || '', info.interval || null)
    if (musicList.length) {
      console.log('find music:', musicList)
      const musicInfo = musicList[0]
      markRaw(musicInfo)
      const isPlaying = !!playMusicInfo.musicInfo
      if (info.playLater) {
        addTempPlayList([{ listId: LIST_IDS.PLAY_LATER, musicInfo }])
      } else {
        addTempPlayList([{ listId: LIST_IDS.PLAY_LATER, musicInfo, isTop: true }])
        if (isPlaying) playNext()
      }
    } else {
      console.log('msuic not found:', info)
    }
  }
}

export default () => {
  const handleSearchMusic = useSearchMusic()
  const handlePlayMusic = usePlayMusic()
  const handleSearchPlayMusic = useSearchPlayMusic()


  return async(action, info) => {
    switch (action) {
      case 'search':
        handleSearchMusic(info)
        break
      case 'play':
        handlePlayMusic(info)
        break
      case 'searchPlay':
        await handleSearchPlayMusic(info)
        break
      default: throw new Error('Unknown action: ' + action)
    }
  }
}
