<template>
<div :class="[$style.toolbar, { [$style.fullscreen]: isFullscreen }, setting.controlBtnPosition == 'left' ? $style.controlBtnLeft : $style.controlBtnRight]">
  <SearchInput />
  <div :class="$style.logo" v-if="setting.controlBtnPosition == 'left'">L X</div>
  <ControlBtns v-else />
</div>
</template>

<script>
import { mapGetters } from 'vuex'

import ControlBtns from './ControlBtns'
import SearchInput from './SearchInput'
import { isFullscreen } from '@renderer/core/share'

export default {
  name: 'CoreToolBar',
  components: { SearchInput, ControlBtns },
  setup() {
    return {
      isFullscreen,
    }
  },
  computed: {
    ...mapGetters(['setting']),
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.toolbar {
  display: flex;
  height: @height-toolbar;
  align-items: center;
  justify-content: space-between;
  padding-left: 15px;
  -webkit-app-region: drag;
  z-index: 2;

  &.fullscreen {
    -webkit-app-region: no-drag;
    .logo {
      display: none;
    }
  }

  &.controlBtnLeft {
    .control {
      display: none;
    }
  }
  &.controlBtnRight {
    justify-content: space-between;
  }
}

.logo {
  box-sizing: border-box;
  padding: 0 @height-toolbar * .4;
  height: @height-toolbar;
  color: @color-theme;
  flex: none;
  text-align: center;
  line-height: @height-toolbar;
  font-weight: bold;
  // -webkit-app-region: no-drag;
}

each(@themes, {
  :global(#root.@{value}) {
    .logo {
      color: ~'@{color-@{value}-theme}';
    }
  }
})
</style>
