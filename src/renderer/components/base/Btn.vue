<template>
  <button
    :class="[$style.btn, {[$style.min]: min}, {[$style.outline]: outline}]"
    tabindex="0"
    :disabled="disabled"
  >
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
  border-radius: var(--ui-radius-pill);
  cursor: pointer;
  padding: 7px 16px;
  color: var(--color-button-font);
  outline: none;
  font-weight: 500;
  transition: background-color @transition-fast, color @transition-fast, opacity @transition-fast;
  background-color: var(--color-button-background);
  font-size: 13px;
  line-height: 1.2;
  vertical-align: middle;
  &[disabled] {
    opacity: .4;
    cursor: default;
  }

  &.outline {
    background-color: transparent;
    box-shadow: inset 0 0 0 1px var(--ui-border-subtle);
  }

  &:hover:not([disabled]) {
    background-color: var(--color-button-background-hover);
  }
  &:active:not([disabled]) {
    background-color: var(--color-button-background-active);
  }
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

.min {
  padding: 4px 11px;
  font-size: 12px;
}

</style>
