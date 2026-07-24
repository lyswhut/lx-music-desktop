<template>
  <component
    :is="containerEl"
    ref="dom_scrollContainer"
    :class="containerClass"
    tabindex="0"
    :style="useOuterScroll ? 'outline: none; position: relative; display: block;' : 'outline: none; height: 100%; overflow-y: auto; position: relative; display: block; contain: strict;'"
  >
    <component :is="contentEl" :class="contentClass" :style="contentStyle">
      <div v-for="item in views" :key="item.key" :style="item.style">
        <slot name="default" v-bind="{ item: item.item, index: item.index }" />
      </div>
    </component>
    <slot name="footer" />
  </component>
</template>

<script>
import {
  computed,
  ref,
  nextTick,
  watch,
  onMounted,
  onBeforeUnmount,
} from 'vue'

/**
 * 生成防抖函数
 * @param {*} fn
 * @param {*} delay
 */
export const debounce = (fn, delay = 100) => {
  let timer = null
  let _args = null
  return function(...args) {
    _args = args
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn.apply(this, _args)
    }, delay)
  }
}

const easeInOutQuad = (t, b, c, d) => {
  t /= d / 2
  if (t < 1) return (c / 2) * t * t + b
  t--
  return (-c / 2) * (t * (t - 2) - 1) + b
}
const handleScroll = (element, to, duration = 300, callback = () => {}, onCancel = () => {}) => {
  if (!element) { callback(); return }
  const start = element.scrollTop || element.scrollY || 0
  let cancel = false
  if (to > start) {
    let maxScrollTop = element.scrollHeight - element.clientHeight
    if (to > maxScrollTop) to = maxScrollTop
  } else if (to < start) {
    if (to < 0) to = 0
  } else { callback(); return }
  const change = to - start
  const increment = 10
  if (!change) { callback(); return }

  let currentTime = 0
  let val
  let cancelCallback

  const animateScroll = () => {
    currentTime += increment
    val = parseInt(easeInOutQuad(currentTime, start, change, duration))
    if (element.scrollTo) {
      element.scrollTo(0, val)
    } else {
      element.scrollTop = val
    }
    if (currentTime < duration) {
      if (cancel) {
        cancelCallback()
        onCancel()
        return
      }
      window.setTimeout(animateScroll, increment)
    } else {
      callback()
    }
  }
  animateScroll()
  return (callback) => {
    cancelCallback = callback
    cancel = true
  }
}

export default {
  name: 'VirtualizedList',
  props: {
    containerEl: {
      type: String,
      default: 'div',
    },
    containerClass: {
      type: String,
      default: 'virtualized-list',
    },
    useOuterScroll: {
      type: Boolean,
      default: false,
    },
    contentEl: {
      type: String,
      default: 'div',
    },
    contentClass: {
      type: String,
      default: 'virtualized-list-content',
    },
    itemHeight: {
      type: Number,
      required: true,
    },
    keyName: {
      type: String,
      required: true,
    },
    list: {
      type: Array,
      required: true,
    },
  },
  emits: ['scroll'],
  setup(props, { emit }) {
    const views = ref([])
    const dom_scrollContainer = ref(null)
    let dom_outerScrollContainer = null
    let listOffsetTop = 0
    let isListScrolling = false
    const isListScrollingRef = ref(false)
    let startIndex = -1
    let endIndex = -1
    let scrollTop = -1
    let cachedList = []
    let cancelScroll = null
    let isAutoScrolling = false
    let scrollToValue = 0

    const getScrollContainer = () => dom_outerScrollContainer || dom_scrollContainer.value

    const findOuterScrollContainer = el => {
      while (el && el !== document.body) {
        const style = window.getComputedStyle(el)
        const overflowY = style.overflowY
        if (overflowY === 'auto' || overflowY === 'scroll') {
          return el
        }
        el = el.parentElement
      }
      return null
    }

    const calculateOffset = () => {
      if (!dom_outerScrollContainer || !dom_scrollContainer.value) {
        listOffsetTop = 0
        return
      }
      const listRect = dom_scrollContainer.value.getBoundingClientRect()
      const containerRect = dom_outerScrollContainer.getBoundingClientRect()
      listOffsetTop = listRect.top - containerRect.top + dom_outerScrollContainer.scrollTop
    }

    const createList = (startIndex, endIndex) => {
      const cache = cachedList.slice(startIndex, endIndex)
      const list = props.list.slice(startIndex, endIndex).map((item, i) => {
        if (cache[i]) return cache[i]
        const top = (startIndex + i) * props.itemHeight
        const index = startIndex + i
        return cachedList[index] = {
          item,
          top,
          style: { position: 'absolute', left: 0, right: 0, top: top + 'px', height: props.itemHeight + 'px' },
          index,
          key: item[props.keyName],
        }
      })
      return list
    }

    const updateView = (currentScrollTop = null) => {
      const scrollContainer = getScrollContainer()
      if (!scrollContainer) return
      const actualScrollTop = currentScrollTop ?? scrollContainer.scrollTop
      const relativeScrollTop = props.useOuterScroll ? Math.max(0, actualScrollTop - listOffsetTop) : actualScrollTop

      const itemHeight = props.itemHeight
      const currentStartIndex = Math.floor(relativeScrollTop / itemHeight)
      const scrollContainerHeight = props.useOuterScroll ? scrollContainer.clientHeight : scrollContainer.clientHeight
      const currentEndIndex = currentStartIndex + Math.ceil(scrollContainerHeight / itemHeight)
      const continuous = currentStartIndex <= endIndex && currentEndIndex >= startIndex
      const currentStartRenderIndex = Math.max(currentStartIndex, 0)
      const currentEndRenderIndex = currentEndIndex + 1
      // console.log(continuous)
      // debugger
      if (continuous) {
        // if (Math.abs(currentScrollTop - this.scrollTop) < this.itemHeight * 0.6) return
        // console.log('update')
        // if (currentScrollTop > scrollTop) { // scroll down
        //   // console.log('scroll down')
        //   views.value = createList(currentStartRenderIndex, currentEndRenderIndex)
        //   // views.value.push(...list.slice(list.indexOf(views.value[views.value.length - 1]) + 1))
        //   // // if (this.views.length > 100) {
        //   // nextTick(() => {
        //   //   views.value.splice(0, views.value.indexOf(list[0]))
        //   // })
        //   // }
        // } else if (currentScrollTop < scrollTop) { // scroll up
        //   // console.log('scroll up')
        //   views.value = createList(currentStartRenderIndex, currentEndRenderIndex)
        // } else return
        if (actualScrollTop == scrollTop && endIndex >= currentEndIndex) return
        requestAnimationFrame(() => {
          views.value = createList(currentStartRenderIndex, currentEndRenderIndex)
        })
      } else {
        requestAnimationFrame(() => {
          views.value = createList(currentStartRenderIndex, currentEndRenderIndex)
        })
      }
      startIndex = currentStartIndex
      endIndex = currentEndIndex
      scrollTop = actualScrollTop
    }

    const setStopScrollStatus = debounce(() => {
      isListScrolling = false
      isListScrollingRef.value = false
    }, 200)
    const onScroll = event => {
      if (!isListScrolling) isListScrolling = isListScrollingRef.value = true
      setStopScrollStatus()

      const scrollContainer = getScrollContainer()
      if (!scrollContainer) return
      const currentScrollTop = scrollContainer.scrollTop
      if (Math.abs(currentScrollTop - scrollTop) > props.itemHeight * 0.6) {
        updateView(currentScrollTop)
      }
      emit('scroll', event)
    }

    const scrollTo = (targetScrollTop, animate = false, onScrollEnd) => {
      const scrollContainer = getScrollContainer()
      if (!scrollContainer) return
      const actualScrollTop = props.useOuterScroll ? targetScrollTop + listOffsetTop : targetScrollTop
      if (onScrollEnd) {
        void new Promise(resolve => {
          if (cancelScroll) {
            cancelScroll(resolve)
          } else {
            resolve()
          }
        }).then(() => {
          if (animate) {
            isAutoScrolling = true
            scrollToValue = actualScrollTop
            cancelScroll = handleScroll(scrollContainer, actualScrollTop, 300, () => {
              cancelScroll = null
              isAutoScrolling = false
              onScrollEnd(true)
            }, () => {
              cancelScroll = null
              isAutoScrolling = false
              onScrollEnd('canceled')
            })
          } else {
            scrollContainer.scrollTop = actualScrollTop
          }
        })
      } else {
        scrollContainer.scrollTo({
          top: actualScrollTop,
          behavior: animate ? 'smooth' : 'instant',
        })
      }
    }

    const scrollToIndex = (index, offset = 0, animate = false, onScrollEnd) => {
      scrollTo(Math.max(index * props.itemHeight + offset, 0), animate, onScrollEnd)
    }

    const getScrollTop = () => {
      const scrollContainer = getScrollContainer()
      if (!scrollContainer) return 0
      if (isAutoScrolling) return props.useOuterScroll ? scrollToValue - listOffsetTop : scrollToValue
      return props.useOuterScroll ? Math.max(0, scrollContainer.scrollTop - listOffsetTop) : scrollContainer.scrollTop
    }

    const handleResize = () => {
      window.setTimeout(updateView)
    }

    const contentStyle = computed(() => {
      const style = {
        display: 'block',
        height: props.list.length * props.itemHeight + 'px',
      }
      if (isListScrollingRef.value) style['pointer-events'] = 'none'
      return style
    })

    const handleReset = list => {
      cachedList = Array(list.length)
      startIndex = -1
      endIndex = -1
      if (cachedList.length) {
        void nextTick(() => {
          requestAnimationFrame(() => {
            updateView()
          })
        })
      } else {
        views.value = []
      }
    }
    watch(() => props.itemHeight, () => {
      handleReset(props.list)
    })
    watch(() => props.list, (list) => {
      handleReset(list)
    })

    onMounted(() => {
      if (props.useOuterScroll) {
        dom_outerScrollContainer = findOuterScrollContainer(dom_scrollContainer.value)
        if (!dom_outerScrollContainer) dom_outerScrollContainer = dom_scrollContainer.value
        calculateOffset()
        dom_outerScrollContainer.addEventListener('scroll', onScroll, {
          capture: false,
          passive: true,
        })
        window.addEventListener('resize', calculateOffset)
      } else {
        dom_scrollContainer.value.addEventListener('scroll', onScroll, {
          capture: false,
          passive: true,
        })
      }
      cachedList = Array(props.list.length)
      startIndex = -1
      endIndex = -1

      if (props.list.length) {
        void nextTick(() => {
          requestAnimationFrame(() => {
            console.log('updateView')
            updateView()
          })
        })
      }
      window.addEventListener('resize', handleResize)
    })
    onBeforeUnmount(() => {
      if (props.useOuterScroll && dom_outerScrollContainer) {
        dom_outerScrollContainer.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', calculateOffset)
      } else if (dom_scrollContainer.value) {
        dom_scrollContainer.value.removeEventListener('scroll', onScroll)
      }
      window.removeEventListener('resize', handleResize)
      if (cancelScroll) cancelScroll()
    })

    return {
      views,
      dom_scrollContainer,
      contentStyle,
      scrollTo,
      scrollToIndex,
      getScrollTop,
    }
  },
}
</script>
