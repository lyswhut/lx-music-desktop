import { useRoute, useRouter, onMounted, onBeforeUnmount } from '@renderer/utils/vueTools'
import { setListPosition, getListPosition } from '@renderer/utils/data'

export default ({ props, listRef, list, setting }) => {
  const route = useRoute()
  const router = useRouter()

  const saveListPosition = () => {
    setListPosition(props.listId, listRef.value?.getScrollTop() || 0)
  }

  const handleScrollList = (index, isAnimation, callback = () => {}) => {
    listRef.value.scrollToIndex(index, -150, isAnimation).then(callback)
  }

  const restoreScroll = (index, isAnimation) => {
    // console.log(index, isAnimation)
    if (!list.value.length) return
    if (index == null) {
      let location = getListPosition(props.listId) || 0
      if (setting.value.list.isSaveScrollLocation && location != null) {
        listRef.value.scrollTo(location)
      }
      return
    }

    handleScrollList(index, isAnimation)
  }

  onMounted(() => {
    restoreScroll(route.query.scrollIndex, false)
    if (route.query.scrollIndex != null) {
      router.replace({
        path: 'list',
        query: {
          id: props.listId,
          updated: true,
        },
      })
    }
  })
  onBeforeUnmount(() => {
    saveListPosition()
  })

  return {
    saveListPosition,
    restoreScroll,
  }
}
