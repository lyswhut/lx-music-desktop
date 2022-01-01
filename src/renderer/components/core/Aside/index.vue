<template>
<div :class="$style.aside">
  <ControlBtns v-if="setting.controlBtnPosition == 'left'" />
  <div :class="$style.logo" v-else>L X</div>
  <NavBar />
</div>
</template>

<script>
import { mapGetters } from 'vuex'

import ControlBtns from './ControlBtns'
import NavBar from './NavBar'

export default {
  name: 'CoreAside',
  components: { ControlBtns, NavBar },
  computed: {
    ...mapGetters(['setting']),
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.aside {
  // box-shadow: 0 0 5px rgba(0, 0, 0, .3);
  transition: @transition-theme;
  transition-property: background-color;
  background-color: @color-theme-sidebar;
  // background-color: @color-aside-background;
  // border-right: 2px solid @color-theme;
  -webkit-app-region: drag;
  -webkit-user-select: none;
  display: flex;
  flex-flow: column nowrap;
}

.logo {
  box-sizing: border-box;
  padding: 0 13%;
  height: 50px;
  color: @color-theme-font;
  flex: none;
  text-align: center;
  line-height: 50px;
  font-weight: bold;
  // -webkit-app-region: no-drag;
}

each(@themes, {
  :global(#root.@{value}) {
    .aside {
      background-color: ~'@{color-@{value}-theme-sidebar}';
    }
    .logo {
      color: ~'@{color-@{value}-theme-font}';
    }
  }
})

</style>
