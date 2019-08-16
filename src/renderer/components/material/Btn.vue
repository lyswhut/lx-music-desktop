<template lang="pug">
  button(:class="[$style.btn, min ? $style.min : '']" @click="$emit('click', $event)")
    slot
</template>

<script>
export default {
  props: {
    min: {
      type: Boolean,
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';

.btn {
  display: inline-block;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  padding: 8px 15px;
  color: @color-btn;
  outline: none;
  transition: background-color 0.2s ease;
  background-color: @color-btn-background;

  &:hover {
    background-color: @color-theme_2-hover;
  }
  &:active {
    background-color: @color-theme_2-active;
  }
}

.min {
  padding: 3px 8px;
  font-size: 12px;
}

each(@themes, {
  :global(#container.@{value}) {
    .btn {
      color: ~'@{color-@{value}-btn}';
      background-color: ~'@{color-@{value}-btn-background}';
      &:hover {
        background-color: ~'@{color-@{value}-theme_2-hover}';
      }
      &:active {
        background-color: ~'@{color-@{value}-theme_2-active}';
      }
    }
  }
})

</style>
