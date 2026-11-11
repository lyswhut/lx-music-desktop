<template>
  <transition enter-active-class="animated-fast fadeIn" leave-active-class="animated-fast fadeOut">
    <button v-show="visible" ref="dom_btn" type="button" :class="$style.btn" aria-label="back to top" @click="handleBackTop">
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 451.847 451.847" space="preserve">
        <use xlink:href="#icon-down" />
      </svg>
    </button>
  </transition>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from '@common/utils/vueTools'

const visible = ref(false)
const dom_btn = ref(null)

let dom_root = null
let dom_scroll = null

// 监听页面内所有滚动容器（scroll 不冒泡，需捕获阶段），记录最近滚动的容器
const handleScroll = e => {
  const el = e.target
  if (!(el instanceof HTMLElement) || !el.classList.contains('scroll')) return
  dom_scroll = el
  visible.value = el.scrollTop > 120
}

const handleBackTop = () => {
  const el = dom_scroll ?? [...(dom_root?.querySelectorAll('.scroll') ?? [])].find(s => s.scrollHeight > s.clientHeight)
  if (el) el.scrollTo({ top: 0, behavior: 'smooth' })
}

// 初次挂载时若列表已处于滚动状态（如恢复页面），同步按钮显示
const initVisible = () => {
  const el = [...(dom_root?.querySelectorAll('.scroll') ?? [])].find(s => s.scrollTop > 120)
  if (el) {
    dom_scroll = el
    visible.value = true
  }
}

onMounted(() => {
  dom_root = dom_btn.value?.closest('.view-container') ?? dom_btn.value?.parentElement
  dom_root?.addEventListener('scroll', handleScroll, { capture: true })
  initVisible()
})

onBeforeUnmount(() => {
  dom_root?.removeEventListener('scroll', handleScroll, { capture: true })
  dom_root = null
  dom_scroll = null
})

</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.btn {
  position: absolute;
  right: 20px;
  bottom: 20px;
  z-index: 6;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 17px;
  cursor: pointer;
  background-color: var(--color-primary-light-300-alpha-700);
  color: var(--color-primary);
  box-shadow: 0 1px 4px rgba(0, 0, 0, .15);
  transition: background-color @transition-fast, color @transition-fast;
  outline: none;

  svg {
    width: 14px;
    height: 14px;
    transform: rotate(180deg);
  }

  &:hover {
    background-color: var(--color-primary);
    color: #fff;
  }
}
</style>
