import { reactive, ref, shallowRef } from '@renderer/utils/vueTools'
import { getList } from '@renderer/core/share/utils'

export const musicInfo = window.musicInfo = reactive({
  songmid: null,
  img: null,
  lrc: null,
  tlrc: null,
  lxlrc: null,
  url: null,
  name: '',
  singer: '',
  album: '',
})
const musicInfoKeys = Object.keys(musicInfo)
export const setMusicInfo = _musicInfo => {
  for (const key of musicInfoKeys) {
    if (_musicInfo[key] !== undefined) {
      musicInfo[key] = _musicInfo[key]
    }
  }
}

export const musicInfoItem = shallowRef({})
export const setMusicInfoItem = musicInfo => {
  musicInfoItem.value = musicInfo.key ? musicInfo.metadata.musicInfo : musicInfo
}


export const isPlay = ref(false)
export const setPlay = val => {
  isPlay.value = val
}

export const status = ref('')
export const setStatus = val => {
  status.value = val
}


export const statusText = ref('')
export const setStatusText = val => {
  statusText.value = val
}

export const setAllStatus = val => {
  status.value = val
  statusText.value = val
}


export const isShowPlayerDetail = ref(false)
export const setShowPlayerDetail = val => {
  isShowPlayerDetail.value = val
}

export const isShowPlayComment = ref(false)
export const setShowPlayComment = val => {
  isShowPlayComment.value = val
}

export const isShowLrcSelectContent = ref(false)
export const setShowPlayLrcSelectContentLrc = val => {
  isShowLrcSelectContent.value = val
}


export const playMusicInfo = reactive({
  listId: null, // 当前播放歌曲的列表 id
  musicInfo: null, // 当前播放歌曲的歌曲信息
  isTempPlay: false, // 是否属于 “稍后播放”
})
export const playInfo = reactive({
  playIndex: -1, // 当前正在播放歌曲 index
  playListId: null, // 播放器的播放列表 id
  listPlayIndex: -1, // 播放器播放歌曲 index
})

// 设置播放器的播放列表
export const setPlayList = listId => {
  playInfo.playListId = listId
}

// 更新播放位置
export const updatePlayIndex = () => {
  const indexInfo = getPlayIndex(playMusicInfo.listId, playMusicInfo.musicInfo, playMusicInfo.isTempPlay)
  // console.log(indexInfo)
  playInfo.playIndex = indexInfo.playIndex
  playInfo.listPlayIndex = indexInfo.listPlayIndex

  return indexInfo
}

export const getPlayIndex = (listId, musicInfo, isTempPlay) => {
  const playerList = getList(playInfo.playListId)

  // if (listIndex < 0) throw new Error('music info not found')
  // playInfo.playIndex = listIndex

  let playIndex = -1
  let listPlayIndex = -1
  if (playerList?.length) {
    listPlayIndex = Math.min(playInfo.listPlayIndex, playerList.length - 1)
  }

  const list = getList(listId)
  if (list?.length) {
    if (musicInfo.key) { // 已下载的歌曲
      const currentKey = musicInfo.key
      playIndex = list.findIndex(m => m.key == currentKey)
    } else {
      const currentSongmid = musicInfo.songmid
      playIndex = list.findIndex(m => m.songmid == currentSongmid)
    }
    if (!isTempPlay) {
      if (playIndex < 0) {
        listPlayIndex = listPlayIndex < 1 ? (list.length - 1) : (listPlayIndex - 1)
      } else {
        listPlayIndex = playIndex
      }
    }
  }

  return {
    playIndex,
    listPlayIndex,
  }
}

// 设置当前播放歌曲的信息
export const setPlayMusicInfo = (listId, musicInfo, isTempPlay = false) => {
  playMusicInfo.listId = listId
  playMusicInfo.musicInfo = musicInfo
  playMusicInfo.isTempPlay = isTempPlay
  if (musicInfo == null) {
    playInfo.playIndex = -1
    playInfo.playListId = null
    playInfo.listPlayIndex = -1
    return
  }

  const { playIndex, listPlayIndex } = getPlayIndex(listId, musicInfo, isTempPlay)

  playInfo.playIndex = playIndex
  playInfo.listPlayIndex = listPlayIndex

  setMusicInfoItem(musicInfo)
  // console.log(playInfo)
}

export const playedList = window.playedList = reactive([])
export const addPlayedList = (item) => {
  if (playedList.some(m => m.musicInfo === item.musicInfo)) return
  playedList.push(item)
}
export const removePlayedList = (index) => {
  playedList.splice(index, 1)
}
export const clearPlayedList = () => {
  playedList.splice(0, playedList.length)
}

export const tempPlayList = reactive([])
export const addTempPlayList = (list) => {
  tempPlayList.push(...list.map(({ musicInfo, listId }) => ({ musicInfo, listId, isTempPlay: true })))
}
export const removeTempPlayList = (index) => {
  tempPlayList.splice(index, 1)
}
export const clearTempPlayeList = () => {
  tempPlayList.splice(0, tempPlayList.length)
}

window.playInfo = playInfo
window.playMusicInfo = playMusicInfo
