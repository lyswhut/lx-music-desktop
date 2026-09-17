<template>
  <button
    :class="[$style.btn, {[$style.min]: min}, {[$style.outline]: outline}, {[$style.primary]: primary}]"
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
    primary: {
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
  color: var(--color-button-font);
  outline: none;
  transition: background-color 0.2s ease;
  background-color: var(--color-button-background);
  font-size: 14px;
  &:not(.min) {
    height: 32px;
    min-height: 32px;
    padding: 0 12px;
    border-radius: 8px;
    font-size: 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  &[disabled] {
    opacity: .4;
    cursor: default;
  }

  &.outline {
    background-color: var(--color-panel);
    border: 1px solid var(--color-line);
    color: var(--color-font);
    &:hover {
      background-color: var(--color-well);
    }
  }

  &.primary {
    color: var(--color-000);
    background-color: var(--color-primary);
    &[disabled] {
      opacity: .78;
    }
    &:hover {
      background-color: var(--color-primary-dark-100);
    }
    &:active {
      background-color: var(--color-primary-dark-200);
    }
    &:not(.min) {
      border-radius: 8px;
    }
  }

  &:hover:not(.primary) {
    background-color: var(--color-button-background-hover);
  }
  &:active:not(.primary) {
    background-color: var(--color-button-background-active);
  }
}

.min {
  padding: 3px 8px;
  font-size: 12px;
}

</style>
