import { ref, computed, watch } from '@common/utils/vueTools'
import { playMusicInfo } from '@renderer/store/player/state'
import { getFirstLetter } from './useLetterIndex'

export default ({ list, listRef }) => {
  const sortState = ref('none')
  const originalOrder = ref([])

  const toggleSort = () => {
    if (sortState.value === 'none') {
      originalOrder.value = list.value.map(item => item.id)
      sortList('asc')
      sortState.value = 'asc'
    } else if (sortState.value === 'asc') {
      sortList('desc')
      sortState.value = 'desc'
    } else {
      restoreOrder()
      sortState.value = 'none'
    }
  }

  const sortList = (direction) => {
    const sorted = [...list.value].sort((a, b) => {
      const letterA = getFirstLetter(a.name)
      const letterB = getFirstLetter(b.name)

      if (letterA === '#' && letterB !== '#') return 1
      if (letterB === '#' && letterA !== '#') return -1

      const nameA = (a.name || '').toLowerCase()
      const nameB = (b.name || '').toLowerCase()
      return direction === 'asc'
        ? nameA.localeCompare(nameB, 'zh-CN')
        : nameB.localeCompare(nameA, 'zh-CN')
    })
    list.value = sorted
  }

  const restoreOrder = () => {
    if (!originalOrder.value.length) return
    const orderMap = new Map(originalOrder.value.map((id, index) => [id, index]))
    list.value = [...list.value].sort((a, b) => {
      return (orderMap.get(a.id) ?? Infinity) - (orderMap.get(b.id) ?? Infinity)
    })
    originalOrder.value = []
  }

  const resetSort = () => {
    sortState.value = 'none'
    originalOrder.value = []
  }

  const sortedPlayIndex = computed(() => {
    if (sortState.value === 'none' || !playMusicInfo.musicInfo) return -1
    return list.value.findIndex(item => item.id === playMusicInfo.musicInfo.id)
  })

  watch(() => list.value.length, () => {
    if (sortState.value !== 'none' && originalOrder.value.length !== list.value.length) {
      resetSort()
    }
  })

  return {
    sortState,
    toggleSort,
    resetSort,
    sortedPlayIndex,
  }
}
