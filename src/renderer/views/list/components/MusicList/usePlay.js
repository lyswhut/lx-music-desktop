import { useCommit } from '@renderer/utils/vueTools'

export default ({ props, selectedList, list, removeAllSelect }) => {
  let clickTime = 0
  let clickIndex = -1

  const setList = useCommit('player', 'setList')
  const setTempPlayList = useCommit('player', 'setTempPlayList')

  const handlePlayMusic = (index) => {
    setList({
      listId: props.listId,
      index,
    })
  }

  const handlePlayMusicLater = (index, single) => {
    if (selectedList.value.length && !single) {
      setTempPlayList(selectedList.value.map(s => ({ listId: props.listId, musicInfo: s })))
      removeAllSelect()
    } else {
      setTempPlayList([{ listId: props.listId, musicInfo: list.value[index] }])
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
