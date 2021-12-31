<template>
<div :class="$style.control">
  <button type="button" :class="[$style.btn, $style.min]" :tips="$t('min')" @click="min">
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="60%" viewBox="0 0 24 24" space="preserve">
      <use xlink:href="#icon-window-minimize-2"></use>
    </svg>
  </button>
  <button type="button" :class="[$style.btn, $style.close]" :tips="$t('close')" @click="close">
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="60%" viewBox="0 0 24 24" space="preserve">
      <use xlink:href="#icon-window-close-2"></use>
    </svg>
  </button>
</div>
</template>

<script>
import { base as eventBaseName } from '@renderer/event/names'
// import { getRandom } from '../../utils'

export default {
  setup() {
    return {
      min() {
        window.eventHub.emit(eventBaseName.min)
      },
      max() {
        window.eventHub.emit(eventBaseName.max)
      },
      close() {
        window.eventHub.emit(eventBaseName.close)
      },
    }
  },
}
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
    color: @color-theme;
    transition: background-color 0.2s ease-in-out;
    &:hover {
      &.min, &.max {
        background-color: @color-btn-hover;
      }
      &.close {
        background-color: @color-closeBtn;
      }
    }
  }
}

each(@themes, {
  :global(#root.@{value}) {
    .btn {
      color: ~'@{color-@{value}-theme_2-font-label}';
      &:hover {
        &.min, &.max {
          background-color: ~'@{color-@{value}-btn-hover}';
        }
        &.close {
          background-color: ~'@{color-@{value}-closeBtn}';
        }
      }
    }
  }
})
</style>
