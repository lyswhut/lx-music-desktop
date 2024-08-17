// import { updateListMusicsPosition } from '@renderer/store/list/action'
import { ref, nextTick } from '@common/utils/vueTools'
import { updateListMusics } from '@renderer/store/list/listManage'
import { playList } from '@renderer/core/player'
import { getListMusicsFromCache } from '@renderer/store/list/action'
import { playMusicInfo } from '@renderer/store/player/state'

export default (props, list) => {
  const isShowMusicToggleModal = ref(false)
  const musicInfo = ref(null)

  const handleShowMusicToggleModal = (index) => {
    musicInfo.value = list.value[index]
    nextTick(() => {
      isShowMusicToggleModal.value = true
    })
  }

  const toggleSource = (toggleMusicInfo) => {
    const id = musicInfo.value.id
    const index = list.value.findIndex(m => m.id == id)
    if (index < 0) {
      isShowMusicToggleModal.value = false
      return
    }
    musicInfo.value.meta.toggleMusicInfo = toggleMusicInfo
    updateListMusics([
      {
        id: props.listId,
        musicInfo: {
          ...musicInfo.value,
          meta: {
            ...musicInfo.value.meta,
            toggleMusicInfo,
          },
        },
      },
    ])
    const rawInfo = getListMusicsFromCache(props.listId)[index]
    rawInfo.meta.toggleMusicInfo = toggleMusicInfo
    if (toggleMusicInfo || (playMusicInfo.listId == props.listId && playMusicInfo.musicInfo?.id == rawInfo.id)) {
      playList(props.listId, index)
    }
  }

  return {
    isShowMusicToggleModal,
    selectedToggleMusicInfo: musicInfo,
    handleShowMusicToggleModal,
    toggleSource,
  }
}
