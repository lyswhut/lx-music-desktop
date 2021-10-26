<template>
  <component :is="containerEl" :class="containerClass" ref="dom_scrollContainer" style="height: 100%; overflow: auto; position: relative; display: block;">
    <component :is="contentEl" :class="contentClass" :style="contentStyle">
      <div v-for="item in views" :key="item.key" :style="item.style">
        <slot name="default" v-bind="{ item: item.item, index: item.index }" />
      </div>
    </component>
    <slot name="footer" />
  </component>
</template>

<script>

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
      default: 10,
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
  data() {
    return {
      views: [],
      isWaitingUpdate: false,
      startIndex: -1,
      endIndex: -1,
      scrollTop: 0,
      cachedList: [],
      cancelScroll: null,
      isScrolling: false,
      scrollToValue: 0,
    }
  },
  computed: {
    contentStyle() {
      return {
        display: 'block',
        height: this.list.length * this.itemHeight + 'px',
      }
    },
  },
  watch: {
    itemHeight() {
      this.updateView()
    },
    list() {
      this.cachedList = Array(this.list.length)
      this.startIndex = -1
      this.endIndex = -1
      this.updateView()
    },
  },
  mounted() {
    this.$refs.dom_scrollContainer.addEventListener('scroll', this.onScroll, false)
    this.cachedList = Array(this.list.length)
    this.startIndex = -1
    this.endIndex = -1
    this.updateView()
  },
  beforeDestroy() {
    if (this.cancelScroll) this.cancelScroll()
  },
  methods: {
    onScroll(event) {
      if (this.isWaitingUpdate) return
      this.isWaitingUpdate = true
      window.requestAnimationFrame(() => {
        this.updateView()
        this.isWaitingUpdate = false
      })
      this.$emit('scroll', event)
    },

    createList(startIndex, endIndex) {
      const cache = this.cachedList.slice(startIndex, endIndex)
      const list = this.list.slice(startIndex, endIndex).map((item, i) => {
        if (cache[i]) return cache[i]
        const top = (startIndex + i) * this.itemHeight
        const index = startIndex + i
        return this.cachedList[index] = {
          item,
          top,
          style: { position: 'absolute', left: 0, right: 0, top: top + 'px', height: this.itemHeight + 'px' },
          index,
          key: item[this.keyName],
        }
      })
      return list
    },

    updateView() {
      const currentScrollTop = this.$refs.dom_scrollContainer.scrollTop
      const currentStartIndex = Math.floor(currentScrollTop / this.itemHeight)
      const currentEndIndex = currentStartIndex + Math.ceil(this.$refs.dom_scrollContainer.clientHeight / this.itemHeight)
      const continuous = currentStartIndex <= this.endIndex && currentEndIndex >= this.startIndex
      const currentStartRenderIndex = Math.max(Math.floor(currentScrollTop / this.itemHeight) - this.outsideNum, 0)
      const currentEndRenderIndex = currentStartIndex + Math.ceil(this.$refs.dom_scrollContainer.clientHeight / this.itemHeight) + this.outsideNum
      // console.log(continuous)
      // debugger
      if (continuous) {
        if (Math.abs(currentScrollTop - this.scrollTop) < this.itemHeight * 5) return
        // console.log('update')
        if (currentScrollTop > this.scrollTop) { // scroll down
          // console.log('scroll down')
          const list = this.createList(currentStartRenderIndex, currentEndRenderIndex)
          this.views.push(...list.slice(list.indexOf(this.views[this.views.length - 1]) + 1))
          // if (this.views.length > 100) {
          this.$nextTick(() => {
            this.views.splice(0, this.views.indexOf(list[0]))
          })
          // }
        } else if (currentScrollTop < this.scrollTop) { // scroll up
          // console.log('scroll up')
          this.views = this.createList(currentStartRenderIndex, currentEndRenderIndex)
        } else return
      } else {
        this.views = this.createList(currentStartRenderIndex, currentEndRenderIndex)
      }
      this.startIndex = currentStartIndex
      this.endIndex = currentEndIndex
      this.scrollTop = currentScrollTop
    },

    scrollTo(scrollTop, animate = false) {
      return new Promise(resolve => {
        if (this.cancelScroll) {
          this.cancelScroll(resolve)
        } else {
          resolve()
        }
      }).then(() => {
        return new Promise((resolve, reject) => {
          if (animate) {
            this.isScrolling = true
            this.scrollToValue = scrollTop
            this.cancelScroll = handleScroll(this.$refs.dom_scrollContainer, scrollTop, 300, () => {
              this.cancelScroll = null
              this.isScrolling = false
              resolve()
            }, () => {
              this.cancelScroll = null
              this.isScrolling = false
              reject('canceled')
            })
          } else {
            this.$refs.dom_scrollContainer.scrollTop = scrollTop
          }
        })
      })
    },

    scrollToIndex(index, offset = 0, animate = false, callback = () => {}) {
      return this.scrollTo(Math.max(index * this.itemHeight + offset, 0), animate, callback)
    },

    getScrollTop() {
      return this.isScrolling ? this.scrollToValue : this.$refs.dom_scrollContainer.scrollTop
    },
  },
}
</script>
