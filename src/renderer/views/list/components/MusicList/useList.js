import { computed, watch, ref, onBeforeUnmount } from '@renderer/utils/vueTools'
import { windowSizeList, isFullscreen } from '@renderer/core/share'
import { getFontSizeWithScreen } from '@renderer/utils'

const useKeyEvent = ({ handleSelectAllData }) => {
  const keyEvent = {
    isShiftDown: false,
    isModDown: false,
  }

  const handle_key_shift_down = () => {
    if (!keyEvent.isShiftDown) keyEvent.isShiftDown = true
  }
  const handle_key_shift_up = () => {
    if (keyEvent.isShiftDown) keyEvent.isShiftDown = false
  }
  const handle_key_mod_down = () => {
    if (!keyEvent.isModDown) keyEvent.isModDown = true
  }
  const handle_key_mod_up = () => {
    if (keyEvent.isModDown) keyEvent.isModDown = false
  }
  const handle_key_mod_a_down = ({ event }) => {
    if (event.target.tagName == 'INPUT') return
    event.preventDefault()
    if (event.repeat) return
    keyEvent.isModDown = false
    handleSelectAllData()
  }

  onBeforeUnmount(() => {
    window.eventHub.off('key_shift_down', handle_key_shift_down)
    window.eventHub.off('key_shift_up', handle_key_shift_up)
    window.eventHub.off('key_mod_down', handle_key_mod_down)
    window.eventHub.off('key_mod_up', handle_key_mod_up)
    window.eventHub.off('key_mod+a_down', handle_key_mod_a_down)
  })
  window.eventHub.on('key_shift_down', handle_key_shift_down)
  window.eventHub.on('key_shift_up', handle_key_shift_up)
  window.eventHub.on('key_mod_down', handle_key_mod_down)
  window.eventHub.on('key_mod_up', handle_key_mod_up)
  window.eventHub.on('key_mod+a_down', handle_key_mod_a_down)

  return keyEvent
}

export default ({ list, setting }) => {
  const selectedList = ref([])

  let lastSelectIndex = -1
  const listItemHeight = computed(() => {
    return Math.ceil((isFullscreen.value ? getFontSizeWithScreen() : parseInt(windowSizeList.find(item => item.id == setting.value.windowSizeId).fontSize)) * 2.3)
  })

  const removeAllSelect = () => {
    selectedList.value = []
  }
  const handleSelectAllData = () => {
    removeAllSelect()
    selectedList.value = [...list.value]
  }
  const keyEvent = useKeyEvent({ handleSelectAllData })

  const handleSelectData = clickIndex => {
    if (keyEvent.isShiftDown) {
      if (selectedList.value.length) {
        removeAllSelect()
        if (lastSelectIndex != clickIndex) {
          let isNeedReverse = false
          if (clickIndex < lastSelectIndex) {
            let temp = lastSelectIndex
            lastSelectIndex = clickIndex
            clickIndex = temp
            isNeedReverse = true
          }
          selectedList.value = list.value.slice(lastSelectIndex, clickIndex + 1)
          if (isNeedReverse) selectedList.value.reverse()
        }
      } else {
        selectedList.value.push(list.value[clickIndex])
        lastSelectIndex = clickIndex
      }
    } else if (keyEvent.isModDown) {
      lastSelectIndex = clickIndex
      let item = list.value[clickIndex]
      let index = selectedList.value.indexOf(item)
      if (index < 0) {
        selectedList.value.push(item)
      } else {
        selectedList.value.splice(index, 1)
      }
    } else if (selectedList.value.length) {
      removeAllSelect()
    }
  }

  watch(list, removeAllSelect)

  return {
    selectedList,
    listItemHeight,
    removeAllSelect,
    handleSelectData,
  }
}
