import { ref, nextTick, useCommit } from '@renderer/utils/vueTools'

export default ({ props, list, selectedList, removeAllSelect }) => {
  const isShowListSortModal = ref(false)
  const selectedNum = ref(0)
  const musicInfo = ref(null)

  const setMusicPosition = useCommit('list', 'setMusicPosition')

  const handleShowSortModal = (index, single) => {
    if (selectedList.value.length && !single) {
      selectedNum.value = selectedList.value.length
    } else {
      selectedNum.value = 0
      musicInfo.value = list.value[index]
      nextTick(() => {
        isShowListSortModal.value = true
      })
    }
  }

  const sortMusic = num => {
    num = Math.min(num, list.value.length)
    setMusicPosition({
      id: props.listId,
      position: num,
      list: selectedNum.value ? [...selectedList.value] : [musicInfo.value],
    })
    removeAllSelect()
    isShowListSortModal.value = false
  }

  return {
    isShowListSortModal,
    selectedNum,
    selectedSortMusicInfo: musicInfo,
    handleShowSortModal,
    sortMusic,
  }
}
