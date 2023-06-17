<template>
  <transition name="tips-fade" @after-leave="afterLeave">
    <div
      v-show="visible" ref="dom_tips" :style="{ left: position.left + 'px' , top: position.top + 'px', transform: transform }"
      :class="$style.tips" role="presentation"
    >
      {{ message }}
    </div>
  </transition>
</template>

<script>
export default {
  props: {
    afterLeave: {
      type: Function,
      default: () => {},
    },
  },
  data() {
    return {
      visible: false,
      message: '',
      position: {
        top: 0,
        left: 0,
      },
      transform: 'translate(0, 0)',
      cancel: null,
      setTips: null,
      aotoCloseTimer: null,
    }
  },
  watch: {
    message() {
      this.$nextTick(() => {
        this.transform = `translate(${this.handleGetOffsetXY(this.position.left, this.position.top)})`
      })
    },
  },
  beforeUnmount() {
    const el = this.$el
    el.parentNode.removeChild(el)
  },
  methods: {
    handleGetOffsetXY(left, top) {
      const tipsWidth = this.$refs.dom_tips.clientWidth
      const tipsHeight = this.$refs.dom_tips.clientHeight
      const dom_container = document.body
      const containerWidth = dom_container.clientWidth
      const containerHeight = dom_container.clientHeight
      const offsetWidth = containerWidth - left - tipsWidth
      const offsetHeight = containerHeight - top - tipsHeight
      let x = 0
      let y = 0
      if (tipsWidth < left && containerWidth > tipsWidth && offsetWidth < 5) {
        x = -tipsWidth - 12
      }
      if (tipsHeight < top && containerHeight > tipsHeight && offsetHeight < 5) {
        y = -tipsHeight - 8
      }
      return `${x}px, ${y}px`
    },
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.tips {
  position: fixed;
  // transform: scale(1);
  line-height: 1.2;
  word-wrap: break-word;
  padding: 4px 5px;
  z-index: 10001;
  font-size: 12px;
  max-width: 80%;
  color: var(--color-font);
  border-radius: 3px;
  background: var(--color-content-background);
  overflow: hidden;
  pointer-events: none;
  // text-align: justify;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.3);
  white-space: pre;
}

:global(.tips-fade-enter-active), :global(.tips-fade-leave-active) {
  transition: opacity .2s;
}
:global(.tips-fade-enter), :global(.tips-fade-leave-to) {
  opacity: 0;
}


</style>
