import { onBeforeUnmount, ref, type Ref, useCssModule } from '@common/utils/vueTools'
import { updateUserListPosition } from '@renderer/store/list/action'
import { userLists } from '@renderer/store/list/state'
import useDarg from '@renderer/utils/compositions/useDrag'


export default ({ dom_lists_list, handleSaveListName, handleMenuClick }: {
  dom_lists_list: Ref<HTMLElement | null>
  handleSaveListName: () => Promise<void> | void
  handleMenuClick: () => void
}) => {
  const isModDown = ref(false)
  const styles = useCssModule()

  const { setDisabled } = useDarg({
    dom_list: dom_lists_list,
    dragingItemClassName: styles.dragingItem,
    filter: 'default-list',
    onUpdate(newIndex: number, oldIndex: number) {
      void updateUserListPosition({ ids: [userLists[oldIndex - 2].id], position: newIndex - 2 })
    },
  })

  const handle_key_mod_down = ({ event }: LX.KeyDownEevent) => {
    if (!isModDown.value) {
      // console.log(event)
      switch ((event!.target as HTMLElement).tagName) {
        case 'INPUT':
        case 'SELECT':
        case 'TEXTAREA':
          return
        default: if ((event!.target as HTMLElement).isContentEditable) return
      }

      isModDown.value = true
      setDisabled(false)
      void handleSaveListName()
    }
    handleMenuClick()
  }
  const handle_key_mod_up = () => {
    if (isModDown.value) {
      isModDown.value = false
      setDisabled(true)
    }
  }

  window.key_event.on('key_mod_down', handle_key_mod_down)
  window.key_event.on('key_mod_up', handle_key_mod_up)

  onBeforeUnmount(() => {
    window.key_event.off('key_mod_down', handle_key_mod_down)
    window.key_event.off('key_mod_up', handle_key_mod_up)
  })

  return {
    isModDown,
  }
}
