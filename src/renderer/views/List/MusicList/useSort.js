import { updateListMusicsPosition } from '@renderer/store/list/action'
import { ref, nextTick } from '@common/utils/vueTools'

export default ({ props, list, selectedList, removeAllSelect }) => {
  const isShowMusicSortModal = ref(false)
  const selectedNum = ref(0)
  const musicInfo = ref(null)

  const handleShowSortModal = (index, single) => {
    if (selectedList.value.length && !single) {
      selectedNum.value = selectedList.value.length
    } else {
      selectedNum.value = 0
      musicInfo.value = list.value[index]
    }
    nextTick(() => {
      isShowMusicSortModal.value = true
    })
  }

  const sortMusic = num => {
    num = Math.min(num, list.value.length)
    updateListMusicsPosition({
      listId: props.listId,
      position: num - 1,
      ids: (selectedNum.value ? [...selectedList.value] : [musicInfo.value]).map(m => m.id),
    })
    removeAllSelect()
    isShowMusicSortModal.value = false
  }

  return {
    isShowMusicSortModal,
    selectedNum,
    selectedSortMusicInfo: musicInfo,
    handleShowSortModal,
    sortMusic,
  }
}
