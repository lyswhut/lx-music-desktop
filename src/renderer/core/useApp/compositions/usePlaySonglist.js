import { useAction, useCommit } from '@renderer/utils/vueTools'
import { tempList } from '@renderer/core/share/list'

const getListPlayIndex = (list, index) => {
  if (index == null) {
    index = 1
  } else {
    index = parseInt(index)
    if (Number.isNaN(index)) {
      index = 1
    } else {
      if (index < 1) index = 1
      else if (index > list.length) index = list.length
    }
  }
  return index - 1
}

export default () => {
  const getListDetail = useAction('songList', 'getListDetail')
  const getListDetailAll = useAction('songList', 'getListDetailAll')
  const setTempList = useCommit('player', 'setTempList')
  const updateTempList = useCommit('player', 'updateTempList')

  const playSongListDetail = async(source, link, playIndex) => {
    console.log(source, link, playIndex)
    if (link == null) return
    let isPlayingList = false
    const id = decodeURIComponent(link)
    const playListId = `${source}__${decodeURIComponent(link)}`
    let list
    try {
      list = await getListDetail({ source, id, page: 1 })
    } catch (err) {
      console.log(err)
    }
    if (list.length > playIndex) {
      isPlayingList = true
      setTempList({
        list,
        index: getListPlayIndex(list, playIndex),
        id: playListId,
      })
    }
    getListDetailAll({ source, id }).then(list => {
      if (isPlayingList) {
        if (tempList.meta.id == id) {
          updateTempList({
            list,
            id: playListId,
          })
        }
      } else {
        setTempList({
          list,
          index: getListPlayIndex(list, playIndex),
          id: playListId,
        })
      }
    })
  }

  return (source, link, playIndex) => {
    playSongListDetail(source, link, playIndex)
  }
}
