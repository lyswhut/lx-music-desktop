import { computed, useRefGetter, watch, ref, onBeforeUnmount } from '@renderer/utils/vueTools'
import { windowSizeList } from '@common/config'

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


export default ({ props }) => {
  const selectedList = ref([])
  const setting = useRefGetter('setting')
  let lastSelectIndex = -1
  const listItemHeight = computed(() => {
    return parseInt(windowSizeList.find(item => item.id == setting.value.windowSizeId).fontSize) / 16 * 37
  })

  const removeAllSelect = () => {
    selectedList.value = []
  }
  const handleSelectAllData = () => {
    removeAllSelect()
    selectedList.value = [...props.list]
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
          selectedList.value = props.list.slice(lastSelectIndex, clickIndex + 1)
          if (isNeedReverse) selectedList.value.reverse()
        }
      } else {
        selectedList.value.push(props.list[clickIndex])
        lastSelectIndex = clickIndex
      }
    } else if (keyEvent.isModDown) {
      lastSelectIndex = clickIndex
      let item = props.list[clickIndex]
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

  watch(() => props.list, removeAllSelect)

  return {
    selectedList,
    listItemHeight,
    removeAllSelect,
    handleSelectData,
  }
}
