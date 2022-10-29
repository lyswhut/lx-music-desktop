import { useRouter, useRoute } from '@common/utils/vueRouter'
import { isShowPlayerDetail } from '@renderer/store/player/state'
import { setShowPlayerDetail } from '@renderer/store/player/action'
import usePlaySonglist from '../compositions/usePlaySonglist'
import { focusWindow } from '@renderer/utils/ipc'

import { dataVerify, sourceVerify } from './utils'

const useOpenSonglist = () => {
  const router = useRouter()
  const route = useRoute()

  const handleOpenSonglist = params => {
    if (params.id) {
      router[route.path == '/songList/detail' ? 'replace' : 'push']({
        path: '/songList/detail',
        query: {
          source: params.source,
          id: params.id,
        },
      })
    } else if (params.url) {
      router[route.path == '/songList/detail' ? 'replace' : 'push']({
        path: '/songList/detail',
        query: {
          source: params.source,
          id: params.url,
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
    focusWindow()
  }
}
const usePlaySonglistDetail = () => {
  const playSongListDetail = usePlaySonglist()

  return async({ paths, data }) => {
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
      if (songlistInfo.index != null) {
        songlistInfo.index = parseInt(songlistInfo.index)
        if (Number.isNaN(songlistInfo.index)) delete songlistInfo.index
      }
    }

    sourceVerify(songlistInfo.source)

    songlistInfo = dataVerify([
      { key: 'source', types: ['string'] },
      { key: 'id', types: ['string', 'number'], max: 64 },
      { key: 'url', types: ['string'], max: 500 },
      { key: 'index', types: ['number'], max: 1000000 },
    ], songlistInfo)

    if (!songlistInfo.id && !songlistInfo.url) throw new Error('id or url missing')

    await playSongListDetail(songlistInfo.source, songlistInfo.id ?? songlistInfo.url, songlistInfo.index)
  }
}

export default () => {
  const handleOpenSonglist = useOpenSonglist()
  const handlePlaySonglist = usePlaySonglistDetail()


  return async(action, info) => {
    switch (action) {
      case 'open':
        handleOpenSonglist(info)
        break
      case 'play':
        await handlePlaySonglist(info)
        break
      default: throw new Error('Unknown action: ' + action)
    }
  }
}
