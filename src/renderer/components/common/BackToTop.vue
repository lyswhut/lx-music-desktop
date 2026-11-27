<template>
  <button
    type="button"
    :class="[$style.btn, { [$style.show]: isShow }]"
    :aria-label="$t('back_to_top')"
    ignore-tip
    :tabindex="isShow ? 0 : -1"
    @click="handleClick"
  >
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 451.847 451.847" height="100%" space="preserve">
      <use xlink:href="#icon-down" />
    </svg>
  </button>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, watch } from '@common/utils/vueTools'
import { useRoute } from '@common/utils/vueRouter'

// 页面里的滚动容器都是各视图自己的，滚过这个距离才认为「页面向下滚动」了
const SHOW_OFFSET = 100

export default {
  name: 'CommonBackToTop',
  setup() {
    const route = useRoute()
    const isShow = ref(false)
    let scroller = null
    let viewRoot = null

    const handleScroll = (event) => {
      const target = event.target
      if (!(target instanceof HTMLElement) || !viewRoot?.contains(target)) return
      if (target.scrollTop > 0) {
        scroller = target
        isShow.value = target.scrollTop > SHOW_OFFSET
      } else if (target === scroller) {
        isShow.value = false
      }
    }

    const handleClick = () => {
      if (!scroller?.isConnected) {
        isShow.value = false
        scroller = null
        return
      }
      scroller.scrollTo({ top: 0, behavior: 'smooth' })
    }

    watch(() => route.fullPath, () => {
      // 换页时滚动容器若被重建或已回到顶部才收起；只是 query 变化（切标签/翻页）不误收
      if (!scroller?.isConnected) {
        scroller = null
        isShow.value = false
      } else if (scroller.scrollTop <= SHOW_OFFSET) {
        isShow.value = false
      }
    })

    onMounted(() => {
      viewRoot = document.getElementById('view')
      document.addEventListener('scroll', handleScroll, true)
    })
    onBeforeUnmount(() => {
      document.removeEventListener('scroll', handleScroll, true)
    })

    return {
      isShow,
      handleClick,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.btn {
  position: absolute;
  right: 14px;
  bottom: 14px;
  z-index: 10;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-primary);
  color: #fff;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .2);
  opacity: 0;
  transform: translateY(8px) scale(.9);
  pointer-events: none;
  transition: opacity @transition-fast, transform @transition-fast, background-color @transition-fast;

  svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
    // 复用下拉箭头，转 180 度就是向上
    transform: rotate(180deg);
  }
  &:hover {
    background-color: var(--color-primary-dark-100);
  }
  &:active {
    background-color: var(--color-primary-dark-200);
  }
}
.show {
  opacity: 1;
  transform: none;
  pointer-events: auto;
}
</style>
