// import { useCommit } from '@common/utils/vueTools'
import { defaultList } from '@renderer/store/list/state'
import { getListMusics, addListMusics } from '@renderer/store/list/action'
import { addTempPlayList } from '@renderer/store/player/action'
import { appSetting } from '@renderer/store/setting'
import { type Ref } from '@common/utils/vueTools'
import { playList, playMusicSelection } from '@renderer/core/player'
import { LIST_IDS } from '@common/constants'

export default ({ selectedList, props, removeAllSelect, emit }: {
  selectedList: Ref<LX.Music.MusicInfoOnline[]>
  props: {
    list: LX.Music.MusicInfoOnline[]
    playListMode?: boolean
  }
  removeAllSelect: () => void
  emit: (event: 'show-menu' | 'play-list' | 'togglePage', ...args: any[]) => void
}) => {
  let clickTime = 0
  let clickId: string | null = null

  const handlePlayMusic = async(index: number, single: boolean) => {
    if (props.playListMode && (single || selectedList.value.length <= 1)) {
      const playIndex = !single && selectedList.value.length === 1
        ? props.list.findIndex(item => item.id === selectedList.value[0]?.id)
        : index
      if (selectedList.value.length) removeAllSelect()
      emit('play-list', playIndex >= 0 ? playIndex : index)
      return
    }
    if (selectedList.value.length && !single) {
      const ids = new Set(selectedList.value.map(item => item.id))
      const selection = props.list.filter(item => ids.has(item.id))
      await addListMusics(defaultList.id, selection)
      playMusicSelection(selection, defaultList.id)
      removeAllSelect()
      return
    }
    const targetSong = props.list[index]
    if (!targetSong) return
    await addListMusics(defaultList.id, [targetSong])
    const defaultListMusics = await getListMusics(defaultList.id)
    const targetIndex = defaultListMusics.findIndex(s => s.id === targetSong.id)
    if (targetIndex > -1) playList(defaultList.id, targetIndex)
  }

  const handlePlayMusicLater = (index: number, single: boolean) => {
    if (selectedList.value.length && !single) {
      addTempPlayList(props.list.filter(item => selectedList.value.some(selected => selected.id === item.id)).map(s => ({ listId: LIST_IDS.PLAY_LATER, musicInfo: s })))
      removeAllSelect()
    } else {
      addTempPlayList([{ listId: LIST_IDS.PLAY_LATER, musicInfo: props.list[index] }])
    }
  }

  const doubleClickPlay = (index: number) => {
    const targetId = props.list[index]?.id ?? null
    if (
      !targetId ||
      window.performance.now() - clickTime > 400 ||
      clickId !== targetId
    ) {
      clickTime = window.performance.now()
      clickId = targetId
      return
    }
    if (props.playListMode === true || appSetting['list.isClickPlayList']) {
      emit('play-list', index)
    } else {
      void handlePlayMusic(index, true)
    }
    clickTime = 0
    clickId = null
  }

  return {
    handlePlayMusic,
    handlePlayMusicLater,
    doubleClickPlay,
  }
}
