import { addTempPlayList, clearTempPlayeList, getList } from '@renderer/store/player/action'
import { tempPlayList, currentPlayIndex } from '@renderer/store/player/state'
import { playNext } from '@renderer/core/player'
// setup 函数或组件初始化中


export default ({ props, selectedList, list, removeAllSelect }) => {
  let clickTime = 0
  let clickIndex = -1

  const handlePlayMusic = (index) => {
    currentPlayIndex.value = index
    // todo 播放选中的歌曲
    // todo 修改播放歌曲逻辑
    // playList(props.listId, index)
    // handlePlayMusicLater(index, true)
    // todo 歌单本身就有乱序排序功能
    if (tempPlayList.length > 0 ) {// 双击操作会切换到当前歌单
      clearTempPlayeList()
    }
    const currentchooselist = getList(props.listId)
    for(let music of currentchooselist) {
      addTempPlayList([{ listId: props.listId, musicInfo: music }])
    }
    playNext()
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
