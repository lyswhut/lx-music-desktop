import { onMounted, onBeforeUnmount, watch, reactive, ref, type Ref } from '@common/utils/vueTools'

interface MenuLocation {
  x: number
  y: number
}

interface UseMenuLocationOptions {
  visible: Ref<boolean>
  location: Ref<MenuLocation>
  onHide: () => void
}

export default ({ visible, location, onHide }: UseMenuLocationOptions) => {
  const transition1 = 'transform, opacity'
  const transition2 = 'transform, opacity, top, left'
  let show = false
  const dom_menu = ref<HTMLElement | null>(null)
  const menuStyles = reactive({
    left: 0 as number | string,
    top: 0 as number | string,
    opacity: 0,
    transitionProperty: 'transform, opacity',
    transform: 'scale(.8, .7) translate(0,0)',
    pointerEvents: 'none',
  })

  const handleShow = () => {
    show = true
    menuStyles.opacity = 1
    menuStyles.transform = `scale(1) translate(${handleGetOffsetXY(location.value.x, location.value.y)})`
    menuStyles.pointerEvents = 'auto'
  }
  const handleHide = () => {
    menuStyles.opacity = 0
    menuStyles.transform = 'scale(.8, .7) translate(0, 0)'
    menuStyles.pointerEvents = 'none'
    show = false
  }
  const handleGetOffsetXY = (left: number, top: number): string => {
    const listWidth = dom_menu.value!.clientWidth
    const listHeight = dom_menu.value!.clientHeight
    const dom_container_parant = dom_menu.value!.offsetParent as HTMLElement
    const containerWidth = dom_container_parant.clientWidth
    const containerHeight = dom_container_parant.clientHeight
    const offsetWidth = containerWidth - left - listWidth
    const offsetHeight = containerHeight - top - listHeight
    let x = 0
    let y = 0
    if (containerWidth > listWidth && offsetWidth < 12) {
      x = offsetWidth - 12
    }
    if (containerHeight > listHeight && offsetHeight < 5) {
      y = offsetHeight - 5
    }
    return `${x}px, ${y}px`
  }
  const handleDocumentClick = (event: MouseEvent): void => {
    if (!show) return

    if (event.target == dom_menu.value || dom_menu.value!.contains(event.target as Node)) return

    if (show && menuStyles.transitionProperty != transition1) { menuStyles.transitionProperty = transition1 }

    onHide()
  }

  watch(
    visible,
    (visible: boolean) => {
      visible ? handleShow() : handleHide()
    },
    { immediate: true },
  )

  watch(
    location,
    (location: MenuLocation) => {
      menuStyles.left = location.x - window.lx.rootOffset + 2 + 'px'
      menuStyles.top = location.y - window.lx.rootOffset + 'px'
      // nextTick(() => {
      if (show) {
        if (menuStyles.transitionProperty != transition2) { menuStyles.transitionProperty = transition2 }
        menuStyles.transform = `scale(1) translate(${handleGetOffsetXY(location.x, location.y)})`
      }
      // })
    },
    { deep: true },
  )

  onMounted(() => {
    document.addEventListener('click', handleDocumentClick)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('click', handleDocumentClick)
  })

  return {
    dom_menu,
    menuStyles,
  }
}
