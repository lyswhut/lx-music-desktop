import { useCommit, useAction, onBeforeUnmount, useRouter, useI18n, markRaw } from '@renderer/utils/vueTools'
import { base as eventBaseName } from '@renderer/event/names'
import { getEnvParams, clearEnvParamsDeeplink } from '@renderer/utils/tools'
import { decodeName } from '@renderer/utils'
// import { allList, defaultList, loveList, userLists } from '@renderer/core/share/list'
import { isShowPlayerDetail, setShowPlayerDetail, playMusicInfo } from '@renderer/core/share/player'
import usePlaySonglist from './compositions/usePlaySonglist'
import { dialog } from '@renderer/plugins/Dialog'

const sources = ['kw', 'kg', 'tx', 'wy', 'mg']
const sourceVerify = source => {
  if (!sources.includes(source)) throw new Error('Source no match')
}

const qualitys = ['128k', '320k', 'flac', 'flac32bit']
const qualityFilter = (source, types) => {
  types = types.filter(({ type }) => qualitys.includes(type)).map(({ type, size, hash }) => {
    if (size != null && typeof size != 'string') throw new Error(type + ' size type no match')
    if (source == 'kg' && typeof hash != 'string') throw new Error(type + ' hash type no match')
    return hash == null ? { type, size } : { type, size, hash }
  })
  if (!types.length) throw new Error('quality no match')
  return types
}

const dataVerify = (rules, data) => {
  const newData = {}
  for (const rule of rules) {
    const val = data[rule.key]
    if (rule.required && val == null) throw new Error(rule.key + ' missing')
    if (val != null) {
      if (rule.types && !rule.types.includes(typeof val)) throw new Error(rule.key + ' type no match')
      if (rule.max && String(val).length > rule.max) throw new Error(rule.key + ' max length no match')
      if (rule.min && String(val).length > rule.min) throw new Error(rule.key + ' min length no match')
    }
    newData[rule.key] = val
  }
  return newData
}

export default () => {
  // const setList = useCommit('list', 'setList')
  // const listAdd = useCommit('list', 'listAdd')
  // const listMove = useCommit('list', 'listMove')
  // const listAddMultiple = useCommit('list', 'listAddMultiple')
  // const listMoveMultiple = useCommit('list', 'listMoveMultiple')
  // const listRemove = useCommit('list', 'listRemove')
  // const listRemoveMultiple = useCommit('list', 'listRemoveMultiple')
  // const listClear = useCommit('list', 'listClear')
  // const updateMusicInfo = useCommit('list', 'updateMusicInfo')
  // const createUserList = useCommit('list', 'createUserList')
  // const removeUserList = useCommit('list', 'removeUserList')
  // const setUserListName = useCommit('list', 'setUserListName')
  // const setMusicPosition = useCommit('list', 'setMusicPosition')
  // // const setSyncListData = useCommit('list', 'setSyncListData')
  // const setUserListPosition = useCommit('list', 'setUserListPosition')
  const router = useRouter()
  const setTempPlayList = useCommit('player', 'setTempPlayList')
  const playNext = useAction('player', 'playNext')
  const playSongListDetail = usePlaySonglist()
  const { t } = useI18n()
  let isInited = false

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

  const handlePlayMusic = _musicInfo => {
    const musicInfo = {
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
    markRaw(musicInfo)
    const isPlaying = !!playMusicInfo.musicInfo
    setTempPlayList([{ listId: '__temp__', musicInfo, isTop: true }])
    if (isPlaying) playNext()
  }

  const handleSonglist = (action, songlistInfo) => {
    sourceVerify(songlistInfo.source)
    switch (action) {
      case 'open':
        songlistInfo = dataVerify([
          { key: 'source', types: ['string'] },
          { key: 'id', types: ['string', 'number'], max: 64 },
          { key: 'url', types: ['string'], max: 500 },
        ], songlistInfo)
        if (isShowPlayerDetail.value) setShowPlayerDetail(false)
        handleOpenSonglist(songlistInfo)
        break
      case 'play':
        songlistInfo = dataVerify([
          { key: 'source', types: ['string'] },
          { key: 'id', types: ['string', 'number'], max: 64 },
          { key: 'url', types: ['string'], max: 500 },
          { key: 'index', types: ['number'], max: 1000000 },
        ], songlistInfo)
        playSongListDetail(songlistInfo.source, songlistInfo.id ?? songlistInfo.url, songlistInfo.index ?? 0)
        break
      default: throw new Error('Unknown action: ' + action)
    }
  }

  const handleMusic = (action, musicInfo) => {
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
        ], musicInfo)
        break
      default: throw new Error('Unknown action: ' + action)
    }
    musicInfo.types = qualityFilter(musicInfo.source, musicInfo.types)
    switch (action) {
      case 'play':
        handlePlayMusic(musicInfo)
        break
      default: throw new Error('Unknown action: ' + action)
    }
  }

  const handleLinkAction = link => {
    // console.log(link)
    const [url, search] = link.split('?')
    const [type, action] = url.replace('lxmusic://', '').split('/')
    const params = {}
    for (const param of search.split('&')) {
      const [key, value] = param.split('=')
      params[key] = value
    }
    if (params.data) params.data = JSON.parse(decodeURIComponent(params.data))
    console.log(params.data)
    switch (type) {
      case 'music':
        handleMusic(action, params.data)
        break
      case 'songlist':
        handleSonglist(action, params.data)
        break
      default: throw new Error('Unknown type: ' + type)
    }
  }

  const handleFocus = () => {
    if (!isInited) return

    getEnvParams().then(envParams => {
      if (!envParams.deeplink) return
      clearEnvParamsDeeplink()
      try {
        handleLinkAction(envParams.deeplink)
      } catch (err) {
        dialog(`${t('deep_link__handle_error_tip', { message: err.message })}`)
      }
    })
  }

  window.eventHub.on(eventBaseName.focus, handleFocus)

  onBeforeUnmount(() => {
    window.eventHub.off(eventBaseName.focus, handleFocus)
  })

  return envParams => {
    if (envParams.deeplink) {
      clearEnvParamsDeeplink()
      try {
        handleLinkAction(envParams.deeplink)
      } catch (err) {
        dialog(`${t('deep_link__handle_error_tip', { message: err.message })}`)
      }
    }
    isInited = true
  }
}
