import Sortable, { AutoScroll } from 'sortablejs/modular/sortable.core.esm'
import { onMounted } from '@common/utils/vueTools'
import { clearDownKeys } from '@renderer/event'

Sortable.mount(new AutoScroll())

const noop = () => {}

export default ({ dom_list, dragingItemClassName, filter, onUpdate, onStart = noop, onEnd = noop }) => {
  let sortable

  onMounted(() => {
    sortable = Sortable.create(dom_list.value, {
      animation: 150,
      disabled: true,
      forceFallback: false,
      filter: filter ? '.' + filter : null,
      ghostClass: dragingItemClassName,
      onUpdate(event) {
        onUpdate(event.newIndex, event.oldIndex)
      },
      onMove(event) {
        return filter ? !event.related.classList.contains(filter) : true
      },
      onChoose() {
        onStart()
      },
      onUnchoose() {
        onEnd()
        // 处于拖动状态期间，键盘事件无法监听，拖动结束手动清理按下的键
        // window.app_event.emit(eventBaseName.setClearDownKeys)
        clearDownKeys()
      },
      onStart(event) {
        window.app_event.dragStart()
      },
      onEnd(event) {
        window.app_event.dragEnd()
      },
    })
  })

  return {
    setDisabled(enable) {
      if (!sortable) return
      sortable.option('disabled', enable)
    },
  }
}
