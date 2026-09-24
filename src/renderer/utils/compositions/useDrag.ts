// @ts-expect-error
import Sortable, { AutoScroll } from 'sortablejs/modular/sortable.core.esm'
import { onMounted, type Ref } from '@common/utils/vueTools'
import { clearDownKeys } from '@renderer/event'

Sortable.mount(new AutoScroll())

const noop = (): void => {}

interface UseDragOptions {
  dom_list: Ref<HTMLElement | null>
  dragingItemClassName: string
  filter?: string
  onUpdate: (newIndex: number | undefined, oldIndex: number | undefined) => void
  onStart?: () => void
  onEnd?: () => void
}

export default ({
  dom_list,
  dragingItemClassName,
  filter,
  onUpdate,
  onStart = noop,
  onEnd = noop,
}: UseDragOptions) => {
  let sortable: any

  onMounted(() => {
    sortable = Sortable.create(dom_list.value, {
      animation: 150,
      disabled: true,
      forceFallback: false,
      filter: filter ? '.' + filter : null,
      ghostClass: dragingItemClassName,
      onUpdate(event: any) {
        onUpdate(event.newIndex, event.oldIndex)
      },
      onMove(event: any) {
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
      onStart(event: any) {
        window.app_event.dragStart()
      },
      onEnd(event: any) {
        window.app_event.dragEnd()
      },
    })
  })

  return {
    setDisabled: (enable: boolean): void => {
      if (!sortable) return
      sortable.option('disabled', enable)
    },
  }
}
