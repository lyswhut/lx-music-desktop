<template>
  <div v-show="!isFullscreen" :class="$style.control">
    <button type="button" :class="[$style.btn, $style.min]" :aria-label="$t('min')" @click="minWindow">
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="60%" viewBox="0 0 24 24" space="preserve">
        <use xlink:href="#icon-window-minimize-2" />
      </svg>
    </button>
    <button type="button" :class="[$style.btn, $style.close]" :aria-label="$t('close')" @click="closeWindow">
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="60%" viewBox="0 0 24 24" space="preserve">
        <use xlink:href="#icon-window-close-2" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { minWindow, closeWindow } from '@renderer/utils/ipc'
// import { getRandom } from '../../utils'
import { isFullscreen } from '@renderer/store'
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.control {
  display: flex;
  align-self: flex-start;
  -webkit-app-region: no-drag;
  height: 30px;

  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 46px;
    height: 30px;
    background: none;
    border: none;
    outline: none;
    padding: 1px;
    cursor: pointer;
    color: var(--color-font-label);
    transition: background-color 0.2s ease-in-out;
    &:hover {
      &.min, &.max {
        background-color: var(--color-button-background-hover);
      }
      &.close {
        background-color: var(--color-btn-close);
      }
    }
  }
}

</style>
