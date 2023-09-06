// import { reactive, ref, shallowRef } from '@common/utils/vueTools'
import {
  type PlayerMusicInfo,
  musicInfo,
  isPlay,
  status,
  statusText,
  isShowPlayerDetail,
  isShowPlayComment,
  isShowLrcSelectContent,
  playInfo,
  playMusicInfo,
  playedList,
  tempPlayList,
} from './state'
import { getListMusicsFromCache } from '@renderer/store/list/action'
import { downloadList } from '@renderer/store/download/state'
import { setProgress } from './playProgress'
import { playNext } from '@renderer/core/player'
import { LIST_IDS } from '@common/constants'
import { toRaw } from '@common/utils/vueTools'
import { arrPush, arrUnshift } from '@common/utils/common'


type PlayerMusicInfoKeys = keyof typeof musicInfo

const musicInfoKeys: PlayerMusicInfoKeys[] = Object.keys(musicInfo) as PlayerMusicInfoKeys[]

export const setMusicInfo = (_musicInfo: Partial<PlayerMusicInfo>) => {
  for (const key of musicInfoKeys) {
    const val = _musicInfo[key]
    if (val !== undefined) {
      // @ts-expect-error
      musicInfo[key] = val
    }
  }
}

export const setPlay = (val: boolean) => {
  isPlay.value = val
}

export const setStatus = (val: string) => {
  console.log('setStatus', val)
  status.value = val
}


export const setStatusText = (val: string) => {
  statusText.value = val
}

export const setAllStatus = (val: string) => {
  console.log('setAllStatus', val)
  status.value = val
  statusText.value = val
}


export const setShowPlayerDetail = (val: boolean) => {
  isShowPlayerDetail.value = val
}

export const setShowPlayComment = (val: boolean) => {
  isShowPlayComment.value = val
}

export const setShowPlayLrcSelectContentLrc = (val: boolean) => {
  isShowLrcSelectContent.value = val
}

export const setPlayListId = (listId: string | null) => {
  playInfo.playerListId = listId
}

export const getList = (listId: string | null): Array<LX.Music.MusicInfo | LX.Download.ListItem> => {
  return listId == LIST_IDS.DOWNLOAD ? downloadList : getListMusicsFromCache(listId)
}

/**
 * 更新播放位置
 * @returns 播放位置
 */
export const updatePlayIndex = () => {
  const indexInfo = getPlayIndex(playMusicInfo.listId, playMusicInfo.musicInfo, playMusicInfo.isTempPlay)
  // console.log(indexInfo)
  playInfo.playIndex = indexInfo.playIndex
  playInfo.playerPlayIndex = indexInfo.playerPlayIndex

  return indexInfo
}

export const getPlayIndex = (listId: string | null, musicInfo: LX.Download.ListItem | LX.Music.MusicInfo | null, isTempPlay: boolean): {
  playIndex: number
  playerPlayIndex: number
} => {
  const playerList = getList(playInfo.playerListId)

  // if (listIndex < 0) throw new Error('music info not found')
  // playInfo.playIndex = listIndex

  let playIndex = -1
  let playerPlayIndex = -1
  if (playerList.length) {
    playerPlayIndex = Math.min(playInfo.playerPlayIndex, playerList.length - 1)
  }

  const list = getList(listId)
  if (list.length && musicInfo) {
    const currentId = musicInfo.id
    playIndex = list.findIndex(m => m.id == currentId)
    if (!isTempPlay) {
      if (playIndex < 0) {
        playerPlayIndex = playerPlayIndex < 1 ? (list.length - 1) : (playerPlayIndex - 1)
      } else {
        playerPlayIndex = playIndex
      }
    }
  }

  return {
    playIndex,
    playerPlayIndex,
  }
}

export const resetPlayerMusicInfo = () => {
  setMusicInfo({
    id: null,
    pic: null,
    lrc: null,
    tlrc: null,
    rlrc: null,
    lxlrc: null,
    rawlrc: null,
    name: '',
    singer: '',
    album: '',
  })
}

const setPlayerMusicInfo = (musicInfo: LX.Music.MusicInfo | LX.Download.ListItem | null) => {
  if (musicInfo) {
    setMusicInfo('progress' in musicInfo ? {
      id: musicInfo.id,
      pic: musicInfo.metadata.musicInfo.meta.picUrl,
      name: musicInfo.metadata.musicInfo.name,
      singer: musicInfo.metadata.musicInfo.singer,
      album: musicInfo.metadata.musicInfo.meta.albumName ?? '',
      lrc: null,
      tlrc: null,
      rlrc: null,
      lxlrc: null,
      rawlrc: null,
    } : {
      id: musicInfo.id,
      pic: musicInfo.meta.picUrl,
      name: musicInfo.name,
      singer: musicInfo.singer,
      album: musicInfo.meta.albumName ?? '',
      lrc: null,
      tlrc: null,
      rlrc: null,
      lxlrc: null,
      rawlrc: null,
    })
  } else resetPlayerMusicInfo()
}

/**
 * 设置当前播放歌曲的信息
 * @param listId 歌曲所属的列表id
 * @param musicInfo 歌曲信息
 * @param isTempPlay 是否临时播放
 */
export const setPlayMusicInfo = (listId: string | null, musicInfo: LX.Download.ListItem | LX.Music.MusicInfo | null, isTempPlay: boolean = false) => {
  musicInfo = toRaw(musicInfo)

  playMusicInfo.listId = listId
  playMusicInfo.musicInfo = musicInfo
  playMusicInfo.isTempPlay = isTempPlay

  setPlayerMusicInfo(musicInfo)

  setProgress(0, 0)

  if (musicInfo == null) {
    playInfo.playIndex = -1
    playInfo.playerListId = null
    playInfo.playerPlayIndex = -1
  } else {
    const { playIndex, playerPlayIndex } = getPlayIndex(listId, musicInfo, isTempPlay)

    playInfo.playIndex = playIndex
    playInfo.playerPlayIndex = playerPlayIndex
    window.app_event.musicToggled()
  }
}

/**
 * 将歌曲添加到已播放列表
 * @param playMusicInfo playMusicInfo对象
 */
export const addPlayedList = (playMusicInfo: LX.Player.PlayMusicInfo) => {
  const id = playMusicInfo.musicInfo.id
  if (playedList.some(m => m.musicInfo.id === id)) return
  playedList.push(playMusicInfo)
}
/**
 * 将歌曲从已播放列表移除
 * @param index 歌曲位置
 */
export const removePlayedList = (index: number) => {
  playedList.splice(index, 1)
}
/**
 * 清空已播放列表
 */
export const clearPlayedList = () => {
  playedList.splice(0, playedList.length)
}

/**
 * 添加歌曲到稍后播放列表
 * @param list 歌曲列表
 */
export const addTempPlayList = (list: LX.Player.TempPlayListItem[]) => {
  const topList: Array<Omit<LX.Player.TempPlayListItem, 'top'>> = []
  const bottomList = list.filter(({ isTop, ...musicInfo }) => {
    if (isTop) {
      topList.push(musicInfo)
      return false
    }
    return true
  })
  if (topList.length) arrUnshift(tempPlayList, topList.map(({ musicInfo, listId }) => ({ musicInfo, listId, isTempPlay: true })))
  if (bottomList.length) arrPush(tempPlayList, bottomList.map(({ musicInfo, listId }) => ({ musicInfo, listId, isTempPlay: true })))

  if (!playMusicInfo.musicInfo) void playNext()
}
/**
 * 从稍后播放列表移除歌曲
 * @param index 歌曲位置
 */
export const removeTempPlayList = (index: number) => {
  tempPlayList.splice(index, 1)
}
/**
 * 清空稍后播放列表
 */
export const clearTempPlayeList = () => {
  tempPlayList.splice(0, tempPlayList.length)
}
