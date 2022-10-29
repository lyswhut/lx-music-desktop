<template>
  <div v-show="!isFullscreen" :class="$style.controlBtn">
    <button type="button" :class="[$style.btn, $style.close]" :aria-label="$t('close')" @click="closeWindow">
      <svg :class="$style.controlBtniIcon" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="100%" viewBox="0 0 24 24" space="preserve">
        <use xlink:href="#icon-window-close" />
      </svg>
    </button>
    <button type="button" :class="[$style.btn, $style.min]" :aria-label="$t('min')" @click="minWindow">
      <svg :class="$style.controlBtniIcon" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="100%" viewBox="0 0 24 24" space="preserve">
        <use xlink:href="#icon-window-minimize" />
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

@control-btn-width: @height-toolbar * .26;
@control-btn-height: 6%;
.controlBtn {
  box-sizing: border-box;
  padding: 0 7px;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  width: 100%;
  height: @control-btn-height;
  -webkit-app-region: no-drag;
  opacity: .5;
  transition: opacity @transition-normal;
  &:hover {
    opacity: .8;
    .controlBtniIcon {
      opacity: 1;
    }
  }

}
.btn {
  position: relative;
  width: @control-btn-width;
  height: @control-btn-width;
  background: none;
  border: none;
  display: flex;
  // justify-content: center;
  // align-items: center;
  outline: none;
  padding: 1px;
  cursor: pointer;
  border-radius: 50%;
  color: var(--color-font);

  &.min {
    background-color: var(--color-btn-min);
  }
  // &.max {
  //   background-color: var(--color-btn-max);
  // }
  &.close {
    background-color: var(--color-btn-close);
  }
}

.controlBtniIcon {
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}


</style>
