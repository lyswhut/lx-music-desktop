<template>
<div :class="$style.control">
  <button type="button" :class="[$style.btn, $style.min]" :tips="$t('min')" @click="min">
    <svg :class="$style.controlBtniIcon" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="100%" viewBox="0 0 24 24" space="preserve">
      <use xlink:href="#icon-window-minimize"></use>
    </svg>
  </button>
  <button type="button" :class="[$style.btn, $style.close]" :tips="$t('close')" @click="close">
    <svg :class="$style.controlBtniIcon" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="100%" viewBox="0 0 24 24" space="preserve">
      <use xlink:href="#icon-window-close"></use>
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

@control-btn-width: @height-toolbar * .26;

.control {
  display: flex;
  align-items: center;
  height: 100%;
  left: 15px;
  -webkit-app-region: no-drag;
  padding: 0 @control-btn-width * 1.5;
  &:hover {
    .controlBtniIcon {
      opacity: 1;
    }
  }

  .btn {
    display: flex;
    position: relative;
    width: @control-btn-width;
    height: @control-btn-width;
    background: none;
    border: none;
    outline: none;
    padding: 1px;
    cursor: pointer;
    border-radius: 50%;
    color: @color-theme_2;

    + .btn {
      margin-left: @control-btn-width * 1.2;
    }

    &.min {
      background-color: @color-minBtn;
    }
    &.max {
      background-color: @color-maxBtn;
    }
    &.close {
      background-color: @color-closeBtn;
    }
  }
}

.controlBtniIcon {
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

each(@themes, {
  :global(#root.@{value}) {
    .btn {
      color: ~'@{color-@{value}-theme_2}';

      &.min {
        background-color: ~'@{color-@{value}-minBtn}';
      }
      &.max {
        background-color: ~'@{color-@{value}-maxBtn}';
      }
      &.close {
        background-color: ~'@{color-@{value}-closeBtn}';
      }
    }
  }
})
</style>
