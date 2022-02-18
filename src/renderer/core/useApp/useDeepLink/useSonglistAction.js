import { useRouter } from '@renderer/utils/vueTools'
import { isShowPlayerDetail, setShowPlayerDetail } from '@renderer/core/share/player'
import usePlaySonglist from '../compositions/usePlaySonglist'

import { dataVerify, sourceVerify } from './utils'

const useOpenSonglist = () => {
  const router = useRouter()

  const handleOpenSonglist = params => {
    if (params.id) {
      router.replace({
        path: '/songList',
        query: {
          source: params.source,
          id: params.id,
        },
      })
    } else if (params.url) {
      router.replace({
        path: '/songList',
        query: {
          source: params.source,
          url: params.url,
        },
      })
    }
  }

  return ({ paths, data }) => {
    let songlistInfo = {
      source: null,
      id: null,
      url: null,
    }
    if (data) {
      songlistInfo = data
    } else {
      songlistInfo.source = paths[0]
      songlistInfo.url = paths[1]
    }

    sourceVerify(songlistInfo.source)

    songlistInfo = dataVerify([
      { key: 'source', types: ['string'] },
      { key: 'id', types: ['string', 'number'], max: 64 },
      { key: 'url', types: ['string'], max: 500 },
    ], songlistInfo)

    if (!songlistInfo.id && !songlistInfo.url) throw new Error('id or url missing')
    if (isShowPlayerDetail.value) setShowPlayerDetail(false)
    handleOpenSonglist(songlistInfo)
  }
}
const usePlaySonglistDetail = () => {
  const playSongListDetail = usePlaySonglist()

  return ({ paths, data }) => {
    let songlistInfo = {
      source: null,
      id: null,
      url: null,
      index: null,
    }
    if (data) {
      songlistInfo = data
    } else {
      songlistInfo.source = paths[0]
      songlistInfo.url = paths[1]
      songlistInfo.index = paths[2]
      if (songlistInfo.index != null) songlistInfo.index = parseInt(songlistInfo.index)
    }

    sourceVerify(songlistInfo.source)

    songlistInfo = dataVerify([
      { key: 'source', types: ['string'] },
      { key: 'id', types: ['string', 'number'], max: 64 },
      { key: 'url', types: ['string'], max: 500 },
      { key: 'index', types: ['number'], max: 1000000 },
    ], songlistInfo)

    if (!songlistInfo.id && !songlistInfo.url) throw new Error('id or url missing')

    playSongListDetail(songlistInfo.source, songlistInfo.id ?? songlistInfo.url, songlistInfo.index ?? 0)
  }
}

export default () => {
  const handleOpenSonglist = useOpenSonglist()
  const handlePlaySonglist = usePlaySonglistDetail()


  return (action, info) => {
    switch (action) {
      case 'open':
        handleOpenSonglist(info)
        break
      case 'play':
        handlePlaySonglist(info)
        break
      default: throw new Error('Unknown action: ' + action)
    }
  }
}
