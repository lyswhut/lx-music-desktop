import { markRaw } from '@common/utils/vueTools'
import { useRouter } from '@common/utils/vueRouter'
import { decodeName } from '@common/utils/common'
// import { allList, defaultList, loveList, userLists } from '@renderer/store/list'
import { playMusicInfo, isShowPlayerDetail } from '@renderer/store/player/state'
import { setShowPlayerDetail, addTempPlayList } from '@renderer/store/player/action'

import { dataVerify, qualityFilter, sources } from './utils'
import { focusWindow } from '@renderer/utils/ipc'
import { playNext } from '@renderer/core/player/action'
import { toNewMusicInfo } from '@common/utils/tools'
import { LIST_IDS } from '@common/constants'

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
          { key: 'albumName', types: ['string'], max: 64 },
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
          { key: 'albumName', types: ['string'], max: 64 },
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
          { key: 'albumName', types: ['string'], max: 64 },
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
          { key: 'albumName', types: ['string'], max: 64 },
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
          { key: 'albumName', types: ['string'], max: 64 },
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

export default () => {
  const handleSearchMusic = useSearchMusic()
  const handlePlayMusic = usePlayMusic()

  return (action, info) => {
    switch (action) {
      case 'search':
        handleSearchMusic(info)
        break
      case 'play':
        handlePlayMusic(info)
        break
      default: throw new Error('Unknown action: ' + action)
    }
  }
}
