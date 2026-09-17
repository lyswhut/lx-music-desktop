<template>
  <div v-show="!isFullscreen" ref="dom_btns" :class="[$style.controlBtn, { [$style.windows]: !isMac }]">
    <button type="button" :class="[$style.btn, $style.close]" :aria-label="$t('close')" ignore-tip :title="$t('close')" @click="closeWindow">
      <span :class="$style.glyph" aria-hidden="true">×</span>
    </button>
    <button type="button" :class="[$style.btn, $style.min]" :aria-label="$t('min')" ignore-tip :title="$t('min')" @click="minWindow">
      <span :class="$style.glyph" aria-hidden="true">−</span>
    </button>
    <button type="button" :class="[$style.btn, $style.max]" :aria-label="$t('max')" ignore-tip :title="$t('max')" @click="maxWindow">
      <span :class="$style.glyph" aria-hidden="true">+</span>
    </button>
  </div>
</template>

<script setup>
import { minWindow, closeWindow, maxWindow } from '@renderer/utils/ipc'
import { onMounted, onBeforeUnmount, ref, useCssModule } from '@common/utils/vueTools'
import { isFullscreen } from '@renderer/store'

const isMac = window.os == 'mac' || document.documentElement.classList.contains('mac')
const dom_btns = ref()

const cssModule = useCssModule()

const handle_focus = () => {
  if (!dom_btns.value) return
  dom_btns.value.classList.remove(cssModule.hover)
}
const handle_mouseenter = () => {
  dom_btns.value.classList.add(cssModule.hover)
}
const handle_mouseleave = () => {
  dom_btns.value.classList.remove(cssModule.hover)
}


onMounted(() => {
  window.app_event.on('focus', handle_focus)
  dom_btns.value.addEventListener('mouseenter', handle_mouseenter)
  dom_btns.value.addEventListener('mouseleave', handle_mouseleave)
})
onBeforeUnmount(() => {
  window.app_event.off('focus', handle_focus)
  dom_btns.value.removeEventListener('mouseenter', handle_mouseenter)
  dom_btns.value.removeEventListener('mouseleave', handle_mouseleave)
})

</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.controlBtn {
  box-sizing: border-box;
  padding-left: 7px;
  display: flex;
  align-items: center;
  gap: 8px;
  width: auto;
  height: 55px;
  -webkit-app-region: no-drag;
}

.btn {
  position: relative;
  width: 12px;
  height: 12px;
  background: none;
  border: 1px solid #00000012;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  padding: 0;
  cursor: pointer;
  border-radius: 50%;
  color: #0008;
  font-size: 9px;
  line-height: 1;

  &.close {
    background-color: #ff6057;
  }
  &.min {
    background-color: #febc2e;
  }
  &.max {
    background-color: #29c941;
  }
}

.glyph {
  opacity: 0;
  font-weight: 700;
  transform: translateY(-0.5px);
}

.controlBtn.hover .glyph {
  opacity: 1;
}

.windows {
  gap: 0;
  height: 30px;
  padding-left: 0;
  .btn {
    width: 46px;
    height: 30px;
    border-radius: 0;
    border: 0;
    background: none !important;
    color: var(--color-font-label);
    font-size: 14px;
    .glyph {
      opacity: 1;
    }
    &.min:hover,
    &.max:hover {
      background-color: var(--color-button-background-hover) !important;
    }
    &.close:hover {
      background-color: var(--color-btn-close) !important;
      color: #fff;
    }
  }
}
</style>
