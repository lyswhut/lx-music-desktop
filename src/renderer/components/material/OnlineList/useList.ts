import { computed, watch, ref, onBeforeUnmount } from '@common/utils/vueTools'
import { isFullscreen } from '@renderer/store'
import { appSetting } from '@renderer/store/setting'
import { getFontSizeWithScreen } from '@renderer/utils'

const useKeyEvent = ({ handleSelectAllData }: {
  handleSelectAllData: () => void
}) => {
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
  const handle_key_mod_a_down = ({ event }: LX.KeyDownEevent) => {
    if (!event || (event.target as HTMLElement).tagName == 'INPUT') return
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


export default ({ props }: {
  props: {
    list: LX.Music.MusicInfoOnline[]
  }
}) => {
  const selectedList = ref<LX.Music.MusicInfoOnline[]>([])
  let lastSelectIndex = -1
  const listItemHeight = computed(() => {
    return Math.ceil((isFullscreen.value ? getFontSizeWithScreen() : appSetting['common.fontSize']) * 2.3)
  })

  const removeAllSelect = () => {
    selectedList.value = []
  }
  const handleSelectAllData = () => {
    removeAllSelect()
    selectedList.value = [...props.list]
  }
  const keyEvent = useKeyEvent({ handleSelectAllData })

  const handleSelectData = (clickIndex: number) => {
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
          selectedList.value = props.list.slice(_lastSelectIndex, clickIndex + 1)
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
