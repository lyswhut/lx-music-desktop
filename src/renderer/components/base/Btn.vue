<template>
<button
  :class="[$style.btn, {[$style.min]: min}, {[$style.outline]: outline}]"
  :disabled="disabled">
  <slot />
</button>
</template>

<script>
export default {
  props: {
    min: {
      type: Boolean,
    },
    outline: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.btn {
  display: inline-block;
  border: none;
  border-radius: @form-radius;
  cursor: pointer;
  padding: 8px 15px;
  color: @color-btn;
  outline: none;
  transition: background-color 0.2s ease;
  background-color: @color-btn-background;
  font-size: 14px;
  &[disabled] {
    opacity: .4;
  }

  &.outline {
    background-color: transparent;
  }

  &:hover {
    background-color: @color-btn-hover;
  }
  &:active {
    background-color: @color-btn-active;
  }
}

.min {
  padding: 3px 8px;
  font-size: 12px;
}

each(@themes, {
  :global(#root.@{value}) {
    .btn {
      color: ~'@{color-@{value}-btn}';
      background-color: ~'@{color-@{value}-btn-background}';
      &.outline {
        background-color: transparent;
      }
      &:hover {
        background-color: ~'@{color-@{value}-btn-hover}';
      }
      &:active {
        background-color: ~'@{color-@{value}-btn-active}';
      }
    }
  }
})

</style>
