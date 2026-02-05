import { addTempPlayList, clearTempPlayeList, getList } from '@renderer/store/player/action'
import { tempPlayList, currentPlayIndex, currentPlaybackOrder } from '@renderer/store/player/state'
import { handlePlayNext } from '@renderer/core/player'
import { appSetting } from '@renderer/store/setting'
// import { arrShuffle } from '@common/utils/common'
// setup 函数或组件初始化中


export default ({ props, selectedList, list, removeAllSelect }) => {
  let clickTime = 0
  let clickIndex = -1

  const handlePlayMusic = (index) => {
    currentPlayIndex.value = 0
    if (tempPlayList.length > 0) { // 双击操作会切换到当前歌单
      clearTempPlayeList()
    }
    const currentchooselist = getList(props.listId)
    for (let music of currentchooselist) {
      addTempPlayList([{ listId: props.listId, musicInfo: music }])
    }
    // todo 重复代码块，可提取
    const N = tempPlayList.length
    if (appSetting['player.togglePlayMethod'] === 'random') {
      const allIndexes = Array.from({ length: N }, (_, i) => i).filter(i => i !== index)
      for (let i = allIndexes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[allIndexes[i], allIndexes[j]] = [allIndexes[j], allIndexes[i]]
      }
      currentPlaybackOrder.value = [index, ...allIndexes]
    } else {
      currentPlaybackOrder.value = Array.from({ length: N }, (_, i) => i)
      currentPlayIndex.value = index
    }
    const playMusicInfo = tempPlayList[currentPlaybackOrder.value[currentPlayIndex.value]]
    handlePlayNext(playMusicInfo)
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
