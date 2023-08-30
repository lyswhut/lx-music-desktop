<template>
  <component :is="containerEl" ref="dom_scrollContainer" :class="containerClass" tabindex="0" style="outline: none; height: 100%; overflow-y: auto; position: relative; display: block; contain: strict;">
    <component :is="contentEl" ref="dom_list" :class="contentClass" :style="contentStyle">
      <!-- <div v-for="item in views" :key="item.key" :style="item.style">
        <slot name="default" v-bind="{ item: item.item, index: item.index }" />
      </div> -->
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
  render,
  // h,
} from 'vue'

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
      setTimeout(animateScroll, increment)
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
  setup(props, { emit, slots }) {
    const views = ref([])
    const dom_scrollContainer = ref(null)
    const dom_list = ref(null)
    let startIndex = -1
    let endIndex = -1
    let scrollTop = -1
    let cachedList = []
    let cancelScroll = null
    let isScrolling = false
    let scrollToValue = 0

    const createList = (startIndex, endIndex) => {
      if (startIndex == endIndex) return []
      console.log(startIndex, endIndex)
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

    const renderListItem = (list, type) => {
      if (!list.length) return
      console.log(list)
      // const dom = document.createDocumentFragment()
      switch (type) {
        case 'up':
          break
        case 'down':
          break
        default:
          render(null, slots.default(list[0])[0])
          break
      }
    }

    const updateView = (force = false, currentScrollTop = dom_scrollContainer.value.scrollTop) => {
      // const currentScrollTop = this.$refs.dom_scrollContainer.scrollTop
      const itemHeight = props.itemHeight
      const currentStartIndex = Math.floor(currentScrollTop / itemHeight)
      const scrollContainerHeight = dom_scrollContainer.value.clientHeight
      const currentEndIndex = currentStartIndex + Math.ceil(scrollContainerHeight / itemHeight)
      const continuous = currentStartIndex <= endIndex && currentEndIndex >= startIndex
      const currentStartRenderIndex = Math.max(currentStartIndex, 0)
      const currentEndRenderIndex = currentEndIndex + 1
      // console.log(continuous, currentStartIndex, endIndex, currentEndIndex, startIndex)
      // debugger
      if (!force && continuous) {
        // if (Math.abs(currentScrollTop - this.scrollTop) < this.itemHeight * 0.6) return
        // console.log('update')
        if (currentScrollTop > scrollTop) { // scroll down
          console.log('scroll down')
          renderListItem(createList(endIndex + 1, currentEndRenderIndex))
        //   // views.value.push(...list.slice(list.indexOf(views.value[views.value.length - 1]) + 1))
        //   // // if (this.views.length > 100) {
        //   // nextTick(() => {
        //   //   views.value.splice(0, views.value.indexOf(list[0]))
        //   // })
        //   // }
        } else if (currentScrollTop < scrollTop) { // scroll up
          console.log('scroll up')
          renderListItem(createList(currentStartRenderIndex, startIndex))
          // views.value = createList(currentStartRenderIndex, currentEndRenderIndex)
        } else return
        // if (currentScrollTop == scrollTop && endIndex >= currentEndIndex) return
        // views.value = createList(currentStartRenderIndex, currentEndRenderIndex)
      } else {
        renderListItem(createList(currentStartRenderIndex, currentEndRenderIndex))
      }
      startIndex = currentStartIndex
      endIndex = currentEndIndex
      scrollTop = currentScrollTop
    }

    const onScroll = event => {
      const currentScrollTop = dom_scrollContainer.value.scrollTop
      if (Math.abs(currentScrollTop - scrollTop) > props.itemHeight * 0.6) {
        updateView(false, currentScrollTop)
      }
      emit('scroll', event)
    }

    const scrollTo = async(scrollTop, animate = false) => {
      return new Promise(resolve => {
        if (cancelScroll) {
          cancelScroll(resolve)
        } else {
          resolve()
        }
      }).then(async() => {
        return new Promise((resolve, reject) => {
          if (animate) {
            isScrolling = true
            scrollToValue = scrollTop
            cancelScroll = handleScroll(dom_scrollContainer.value, scrollTop, 300, () => {
              cancelScroll = null
              isScrolling = false
              resolve()
            }, () => {
              cancelScroll = null
              isScrolling = false
              reject(new Error('canceled'))
            })
          } else {
            dom_scrollContainer.value.scrollTop = scrollTop
          }
        })
      })
    }

    const scrollToIndex = async(index, offset = 0, animate = false) => {
      return scrollTo(Math.max(index * props.itemHeight + offset, 0), animate)
    }

    const getScrollTop = () => {
      return isScrolling ? scrollToValue : dom_scrollContainer.value.scrollTop
    }

    const handleResize = () => {
      setTimeout(updateView)
    }

    const contentStyle = computed(() => ({
      display: 'block',
      height: props.list.length * props.itemHeight + 'px',
    }))

    const handleReset = list => {
      cachedList = Array(list.length)
      startIndex = -1
      endIndex = -1
      void nextTick(() => {
        updateView(true)
      })
    }
    watch(() => props.itemHeight, () => {
      handleReset(props.list)
    })
    watch(() => props.list, (list) => {
      handleReset(list)
    }, {
      deep: true,
    })

    onMounted(() => {
      dom_scrollContainer.value.addEventListener('scroll', onScroll, false)
      cachedList = Array(props.list.length)
      startIndex = -1
      endIndex = -1
      updateView(true)
      window.addEventListener('resize', handleResize)
    })
    onBeforeUnmount(() => {
      dom_scrollContainer.value.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', handleResize)
      if (cancelScroll) cancelScroll()
    })

    return {
      views,
      dom_scrollContainer,
      dom_list,
      contentStyle,
      scrollTo,
      scrollToIndex,
      getScrollTop,
    }
  },
  // render() {
  //   console.log('render')
  //   // const list = this.views.map((item) => {
  //   //   return h('div', { style: item.style, key: item.key }, this.$slots.default(item))
  //   // })
  //   return h(this.containerEl, {
  //     ref: 'dom_scrollContainer',
  //     class: this.containerClass,
  //     style: 'outline: none; height: 100%; overflow-y: auto; position: relative; display: block; contain: strict;',
  //   }, [
  //     h(this.contentEl, { style: this.contentStyle, class: this.contentClass }, this.views.map((item) => {
  //       return h('div', { style: item.style, key: item.key }, 'this.$slots.default(item)')
  //     })),
  //   ])
  // },
}
</script>
