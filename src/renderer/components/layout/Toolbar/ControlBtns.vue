<template>
  <div v-show="!isFullscreen" ref="dom_btns" :class="$style.control">
    <button type="button" :class="[$style.btn, $style.min]" :aria-label="$t('min')" ignore-tip :title="$t('min')" @click="minWindow">
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="60%" viewBox="0 0 24 24" space="preserve">
        <use xlink:href="#icon-window-minimize-2" />
      </svg>
    </button>
    <button type="button" :class="[$style.btn, $style.close]" :aria-label="$t('close')" ignore-tip :title="$t('close')" @click="closeWindow">
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="60%" viewBox="0 0 24 24" space="preserve">
        <use xlink:href="#icon-window-close-2" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { minWindow, closeWindow } from '@renderer/utils/ipc'
import { onMounted, onBeforeUnmount, ref, useCssModule } from '@common/utils/vueTools'
// import { getRandom } from '../../utils'
import { isFullscreen } from '@renderer/store'

const dom_btns = ref()

const cssModule = useCssModule()

const handle_focus = () => {
  if (!dom_btns.value) return
  for (const node of dom_btns.value.childNodes) {
    if (node.tagName != 'BUTTON') continue
    node.classList.remove(cssModule.hover)
  }
}
const getBtnEl = (el) => el.tagName == 'BUTTON' || !el ? el : getBtnEl(el.parentNode)
const handle_mouseover = (event) => {
  const btn = getBtnEl(event.target)
  if (!btn) return
  btn.classList.add(cssModule.hover)
}
const handle_mouseout = (event) => {
  const btn = getBtnEl(event.target)
  if (!btn) return
  btn.classList.remove(cssModule.hover)
}


onMounted(() => {
  window.app_event.on('focus', handle_focus)
  dom_btns.value.addEventListener('mouseover', handle_mouseover)
  dom_btns.value.addEventListener('mouseout', handle_mouseout)
})
onBeforeUnmount(() => {
  window.app_event.off('focus', handle_focus)
  dom_btns.value.removeEventListener('mouseover', handle_mouseover)
  dom_btns.value.removeEventListener('mouseout', handle_mouseout)
})

</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.control {
  display: flex;
  align-self: flex-start;
  -webkit-app-region: no-drag;
  height: 32px;

  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 44px;
    height: 32px;
    background: none;
    border: none;
    outline: none;
    padding: 1px;
    cursor: pointer;
    color: var(--color-font-label);
    transition: background-color 0.16s ease, color 0.16s ease;
    &.hover {
      &.min, &.max {
        background-color: var(--ui-surface-hover);
        color: var(--color-font);
      }
      &.close {
        background-color: var(--color-btn-close);
        color: #222;
        @supports (color: oklch(from red l c h)) {
          color: ~"oklch(from var(--color-btn-close) clamp(0.16, (0.65 - l) * 999, 0.99) 0 0)";
        }
      }
    }
  }
}

</style>
