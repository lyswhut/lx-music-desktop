import { useCommit } from '@renderer/utils/vueTools'
import { defaultList } from '@renderer/core/share/list'
import { getList } from '@renderer/core/share/utils'

export default ({ selectedList, props, removeAllSelect }) => {
  let clickTime = 0
  let clickIndex = -1

  const listAddMultiple = useCommit('list', 'listAddMultiple')
  const listAdd = useCommit('list', 'listAdd')
  const setList = useCommit('player', 'setList')
  const setTempPlayList = useCommit('player', 'setTempPlayList')

  const handlePlayMusic = (index, single) => {
    let targetSong = props.list[index]
    const defaultListMusics = getList(defaultList.id)
    if (selectedList.value.length && !single) {
      listAddMultiple({ id: defaultList.id, list: [...selectedList.value] })
      removeAllSelect()
    } else {
      listAdd({ id: defaultList.id, musicInfo: targetSong })
    }
    let targetIndex = defaultListMusics.findIndex(s => s.songmid === targetSong.songmid)
    if (targetIndex > -1) {
      setList({
        listId: defaultList.id,
        index: targetIndex,
      })
    }
  }

  const handlePlayMusicLater = (index, single) => {
    if (selectedList.value.length && !single) {
      setTempPlayList(selectedList.value.map(s => ({ listId: '__temp__', musicInfo: s })))
      removeAllSelect()
    } else {
      setTempPlayList([{ listId: '__temp__', musicInfo: props.list[index] }])
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
