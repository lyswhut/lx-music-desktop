<template lang="pug">
div(:class="$style.view")
  transition(enter-active-class="animated-fast fadeIn"
      leave-active-class="animated-fast fadeOut")
    router-view
  //- core-title-bar
  //- router-view
</template>


<style lang="less" module>
@import '../../assets/styles/layout.less';

.view {
  position: relative;
  background-color: @color-theme_2;
  > * {
    position: absolute;
    width: 100%;
  }
  // background: #fff;
  // overflow: hidden;
}

each(@themes, {
  :global(#container.@{value}) {
    .view {
      background-color: ~'@{color-@{value}-theme_2}';
    }
  }
})

</style>
