<template>
  <div>
    <layout-toolbar :class="$style.toolbar" />
    <div :class="$style.nav">
      <Arrows :class="$style.arrows" />
      <NavBar :class="$style.navbar" />
      <SearchInput :class="$style.search" />
    </div>
  </div>
</template>
<script setup lang="ts">
import NavBar from './NavBar.vue'
import SearchInput from './SearchInput.vue'
import Arrows from './Arrows.vue'
</script>
<style lang="less" module>
@import '@renderer/assets/styles/layout.less';
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  margin-top: 20px;
  z-index: 888;
}

.toolbar{
  height: 30px
}

.arrows{
  flex: 1;
  display: flex;
  align-items: center;
  z-index: 99;
}

.navbar{
  flex: 2;
  display: flex;
  justify-content: center;
  text-transform: uppercase;
  user-select: none;
}

.search{
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
</style>
