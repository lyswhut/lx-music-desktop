import { computed, watch, ref, onBeforeUnmount } from '@common/utils/vueTools'
import { isFullscreen } from '@renderer/store'
import { getFontSizeWithScreen } from '@renderer/utils'
import { appSetting } from '@renderer/store/setting'

const useKeyEvent = ({ handleSelectAllData }) => {
  const keyEvent = {
    isShiftDown: false,
    isModDown: false,
  }

  const handle_key_shift_down = () => {
    keyEvent.isShiftDown ||= true
  }
  const handle_key_shift_up = () => {
    keyEvent.isShiftDown &&= false
  }
  const handle_key_mod_down = () => {
    keyEvent.isModDown ||= true
  }
  const handle_key_mod_up = () => {
    keyEvent.isModDown &&= false
  }
  const handle_key_mod_a_down = ({ event }) => {
    if (event.target.tagName == 'INPUT') return
    event.preventDefault()
    if (event.repeat) return
    keyEvent.isModDown = false
    handleSelectAllData()
  }

  onBeforeUnmount(() => {
    window.key_event.off('key_shift_down', handle_key_shift_down)
    window.key_event.off('key_shift_up', handle_key_shift_up)
    window.key_event.off('key_mod_down', handle_key_mod_down)
    window.key_event.off('key_mod_up', handle_key_mod_up)
    window.key_event.off('key_mod+a_down', handle_key_mod_a_down)
  })
  window.key_event.on('key_shift_down', handle_key_shift_down)
  window.key_event.on('key_shift_up', handle_key_shift_up)
  window.key_event.on('key_mod_down', handle_key_mod_down)
  window.key_event.on('key_mod_up', handle_key_mod_up)
  window.key_event.on('key_mod+a_down', handle_key_mod_a_down)

  return keyEvent
}

export default ({ list, listAll }) => {
  const selectedList = ref([])

  let lastSelectIndex = -1
  const listItemHeight = computed(() => {
    return Math.ceil((isFullscreen.value ? getFontSizeWithScreen() : appSetting['common.fontSize']) * 2.3)
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
          let _lastSelectIndex = lastSelectIndex
          if (clickIndex < _lastSelectIndex) {
            let temp = _lastSelectIndex
            _lastSelectIndex = clickIndex
            clickIndex = temp
            isNeedReverse = true
          }
          selectedList.value = list.value.slice(_lastSelectIndex, clickIndex + 1)
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

  watch(listAll, removeAllSelect)

  return {
    selectedList,
    listItemHeight,
    removeAllSelect,
    handleSelectData,
  }
}
