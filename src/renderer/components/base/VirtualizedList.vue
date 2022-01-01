<template>
  <component :is="containerEl" :class="containerClass" ref="dom_scrollContainer" style="height: 100%; overflow: auto; position: relative; display: block; contain: strict;">
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

const easeInOutQuad = (t, b, c, d) => {
  t /= d / 2
  if (t < 1) return (c / 2) * t * t + b
  t--
  return (-c / 2) * (t * (t - 2) - 1) + b
}
const handleScroll = (element, to, duration = 300, callback = () => {}, onCancel = () => {}) => {
  if (!element) return callback()
  const start = element.scrollTop || element.scrollY || 0
  let cancel = false
  if (to > start) {
    let maxScrollTop = element.scrollHeight - element.clientHeight
    if (to > maxScrollTop) to = maxScrollTop
  } else if (to < start) {
    if (to < 0) to = 0
  } else return callback()
  const change = to - start
  const increment = 10
  if (!change) return callback()

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
    outsideNum: {
      type: Number,
      default: 1,
    },
    itemHeight: {
      type: Number,
      required: true,
    },
    keyName: {
      type: String,
      require: true,
    },
    list: {
      type: Array,
      require: true,
    },
  },
  emits: ['scroll'],
  setup(props, { emit }) {
    const views = ref([])
    const dom_scrollContainer = ref(null)
    let startIndex = -1
    let endIndex = -1
    let scrollTop = -1
    let cachedList = []
    let cancelScroll = null
    let isScrolling = false
    let scrollToValue = 0

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

    const updateView = (currentScrollTop = dom_scrollContainer.value.scrollTop) => {
      // const currentScrollTop = this.$refs.dom_scrollContainer.scrollTop
      const itemHeight = props.itemHeight
      const currentStartIndex = Math.floor(currentScrollTop / itemHeight)
      const scrollContainerHeight = dom_scrollContainer.value.clientHeight
      const currentEndIndex = currentStartIndex + Math.ceil(scrollContainerHeight / itemHeight)
      const continuous = currentStartIndex <= endIndex && currentEndIndex >= startIndex
      const currentStartRenderIndex = Math.max(Math.floor(currentScrollTop / itemHeight) - props.outsideNum, 0)
      const currentEndRenderIndex = currentStartIndex + Math.ceil(scrollContainerHeight / itemHeight) + props.outsideNum
      // console.log(continuous)
      // debugger
      if (continuous) {
        // if (Math.abs(currentScrollTop - this.scrollTop) < this.itemHeight * this.outsideNum * 0.6) return
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
        if (currentScrollTop == scrollTop) return
        views.value = createList(currentStartRenderIndex, currentEndRenderIndex)
      } else {
        views.value = createList(currentStartRenderIndex, currentEndRenderIndex)
      }
      startIndex = currentStartIndex
      endIndex = currentEndIndex
      scrollTop = currentScrollTop
    }

    const onScroll = event => {
      const currentScrollTop = dom_scrollContainer.value.scrollTop
      if (Math.abs(currentScrollTop - scrollTop) > props.itemHeight * props.outsideNum * 0.6) {
        updateView(currentScrollTop)
      }
      emit('scroll', event)
    }

    const scrollTo = (scrollTop, animate = false) => {
      return new Promise(resolve => {
        if (cancelScroll) {
          cancelScroll(resolve)
        } else {
          resolve()
        }
      }).then(() => {
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
              reject('canceled')
            })
          } else {
            dom_scrollContainer.value.scrollTop = scrollTop
          }
        })
      })
    }

    const scrollToIndex = (index, offset = 0, animate = false) => {
      return scrollTo(Math.max(index * props.itemHeight + offset, 0), animate)
    }

    const getScrollTop = () => {
      return isScrolling ? scrollToValue : dom_scrollContainer.value.scrollTop
    }

    const contentStyle = computed(() => ({
      display: 'block',
      height: props.list.length * props.itemHeight + 'px',
    }))

    watch(() => props.itemHeight, updateView)
    watch(() => props.list, (list) => {
      cachedList = Array(list.length)
      startIndex = -1
      endIndex = -1
      nextTick(() => {
        updateView()
      })
    }, {
      deep: true,
    })

    onMounted(() => {
      dom_scrollContainer.value.addEventListener('scroll', onScroll, false)
      cachedList = Array(props.list.length)
      startIndex = -1
      endIndex = -1
      updateView()
    })
    onBeforeUnmount(() => {
      dom_scrollContainer.value.removeEventListener('scroll', onScroll)
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
