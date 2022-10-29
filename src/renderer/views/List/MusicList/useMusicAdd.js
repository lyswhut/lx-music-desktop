import { ref, nextTick } from '@common/utils/vueTools'

export default ({ selectedList, list }) => {
  const isShowListAdd = ref(false)
  const isMove = ref(false)
  const isMoveMultiple = ref(false)
  const isShowListAddMultiple = ref(false)
  const selectedAddMusicInfo = ref(null)

  const handleShowMusicAddModal = (index, single) => {
    if (selectedList.value.length && !single) {
      isMoveMultiple.value = false
      isShowListAddMultiple.value = true
    } else {
      isMove.value = false
      selectedAddMusicInfo.value = list.value[index]
      nextTick(() => {
        isShowListAdd.value = true
      })
    }
  }

  const handleShowMusicMoveModal = (index, single) => {
    if (selectedList.value.length && !single) {
      isMoveMultiple.value = true
      isShowListAddMultiple.value = true
    } else {
      isMove.value = true
      selectedAddMusicInfo.value = list.value[index]
      nextTick(() => {
        isShowListAdd.value = true
      })
    }
  }

  return {
    isShowListAdd,
    isMove,
    isMoveMultiple,
    isShowListAddMultiple,
    selectedAddMusicInfo,
    handleShowMusicAddModal,
    handleShowMusicMoveModal,
  }
}
