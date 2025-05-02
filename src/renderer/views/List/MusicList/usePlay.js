import { addTempPlayList } from '@renderer/store/player/action'
import { playList } from '@renderer/core/player'
// import { tempPlayList } from '@renderer/store/player/state'

import useMusicAdd from '@renderer/views/List/MusicList/useMusicAdd'
import { LIST_IDS } from '@common/constants'
import { getList } from '@renderer/store/player/action'

// setup 函数或组件初始化中


export default ({ props, selectedList, list, removeAllSelect }) => {
  let clickTime = 0
  let clickIndex = -1

  // 处理添加音乐到歌单的逻辑
  const {
    // handleShowMusicAddModal,
    // handleShowMusicMoveModal,
  } = useMusicAdd({ selectedList, list })

  const handlePlayMusic = (index) => {
    // todo 修改播放歌曲逻辑
    // playList(props.listId, index)
    // handlePlayMusicLater(index, true)
    // todo 若为空，则添加整个歌单
    // todo 歌单本身就有乱序排序功能
     addTempPlayList([{ listId: props.listId, musicInfo: list.value[index] }])
    // playList(LIST_IDS.TEMP, index)
    // const testlist =getList(props.listId)
     const testlist =getList(LIST_IDS.TEMP)
    for (let i=0; i<testlist.length; i++){ 
      console.log(testlist[i])
    }
  }

  const handlePlayMusicLater = (index, single) => {
    // todo 修改播放歌曲逻辑
    if (selectedList.value.length && !single) {
      addTempPlayList(selectedList.value.map(s => ({ listId: props.listId, musicInfo: s })))
      removeAllSelect()
    } else {
      addTempPlayList([{ listId: props.listId, musicInfo: list.value[index] }])
    }
  }

  const doubleClickPlay = index => {
    if (
      window.performance.now() - clickTime > 400 ||
      clickIndex !== index
    ) {
      clickTime = window.performance.now()
      clickIndex = index
      return
    }
    handlePlayMusic(index, true)
    clickTime = 0
    clickIndex = -1
  }

  return {
    handlePlayMusic,
    handlePlayMusicLater,
    doubleClickPlay,
  }
}
