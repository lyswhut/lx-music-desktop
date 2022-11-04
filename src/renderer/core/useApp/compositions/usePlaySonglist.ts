import { playList } from '@renderer/core/player'
import { setTempList } from '@renderer/store/list/action'
import { tempList, tempListMeta } from '@renderer/store/list/state'
import { getListDetail, getListDetailAll } from '@renderer/store/songList/action'

const getListPlayIndex = (list: LX.Music.MusicInfoOnline[], index?: number) => {
  if (index == null) {
    index = 1
  } else {
    if (index < 1) index = 1
    else if (index > list.length) index = list.length
  }
  return index - 1
}

export default () => {
  const playSongListDetail = async(source: LX.OnlineSource, link: string, playIndex?: number) => {
    // console.log(source, link, playIndex)
    if (link == null) return
    let isPlayingList = false
    const id = decodeURIComponent(link)
    const playListId = `${source}__${decodeURIComponent(link)}`
    let list = (await getListDetail(id, source, 1)).list
    if (playIndex == null || list.length > playIndex) {
      isPlayingList = true
      await setTempList(playListId, list)
      playList(tempList.id, getListPlayIndex(list, playIndex))
    }
    list = await getListDetailAll(id, source)
    if (isPlayingList) {
      if (tempListMeta.id == id) await setTempList(playListId, list)
    } else {
      await setTempList(playListId, list)
      playList(tempList.id, getListPlayIndex(list, playIndex))
    }
  }

  return async(source: LX.OnlineSource, link: string, playIndex?: number) => {
    try {
      await playSongListDetail(source, link, playIndex)
    } catch (err) {
      console.error(err)
      throw new Error('Get play list failed.')
    }
  }
}
