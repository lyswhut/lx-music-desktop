import { type Ref, onBeforeUnmount, onMounted, ref } from '@common/utils/vueTools'

const onDomSizeChanged = (dom: HTMLElement, onChanged: (width: number, height: number) => void) => {
  // 使用 ResizeObserver 监听大小变化
  const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
      const { width, height } = entry.contentRect
      // console.log(dom.offsetLeft, dom.offsetTop, left, top, width, height)
      onChanged(Math.trunc(width), Math.trunc(height))
    }
  })

  resizeObserver.observe(dom)

  onChanged(dom.clientWidth, dom.clientHeight)

  return () => {
    resizeObserver.disconnect()
  }
}

export const useIconSize = (parentDom: Ref<HTMLElement | undefined>, size: number) => {
  const iconSize = ref('32px')
  let unsub: (() => void) | null = null

  onMounted(() => {
    if (!parentDom.value) return
    unsub = onDomSizeChanged(parentDom.value, (width, height) => {
      iconSize.value = Math.trunc(width * size) + 'px'
    })
  })
  onBeforeUnmount(() => {
    unsub?.()
  })

  return iconSize
}
