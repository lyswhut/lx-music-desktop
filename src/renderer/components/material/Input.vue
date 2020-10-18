<template lang="pug">
  input(:class="$style.input" :type="type" :placeholder="placeholder" :value="value" :disabled="disabled"
    @focus="$emit('focus', $event)" @blur="$emit('blur', $event)" @input="$emit('input', $event.target.value.trim())" @change="$emit('change', $event.target.value.trim())"
    @keyup.enter="$emit('submit', $event.target.value.trim())")
</template>

<script>
export default {
  props: {
    placeholder: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    value: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'text',
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';

.input {
  display: inline-block;
  border: none;
  border-radius: @form-radius;
  padding: 7px 8px;
  color: @color-btn;
  outline: none;
  transition: background-color 0.2s ease;
  background-color: @color-btn-background;
  font-size: 13.3px;
  &[disabled] {
    opacity: .4;
  }

  &:hover, &:focus {
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
    .input {
      color: ~'@{color-@{value}-btn}';
      background-color: ~'@{color-@{value}-btn-background}';
      &:hover, &:focus {
        background-color: ~'@{color-@{value}-theme_2-hover}';
      }
      &:active {
        background-color: ~'@{color-@{value}-theme_2-active}';
      }
    }
  }
})

</style>
