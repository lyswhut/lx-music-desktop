<template>
  <input
    ref="dom_input"
    :class="$style.input"
    :type="type"
    :placeholder="placeholder"
    :value="modelValue"
    :disabled="disabled"
    tabindex="0"
    @input="handleInput"
    @change="$emit('change', $event.target.value.trim())"
    @keyup.enter="$emit('submit', $event.target.value.trim())"
  >
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
    modelValue: {
      type: [String, Number],
      default: '',
    },
    type: {
      type: String,
      default: 'text',
    },
  },
  emits: ['update:modelValue', 'submit', 'change'],
  methods: {
    handleInput(event) {
      let value = event.target.value.trim()
      event.target.value = value
      this.$emit('update:modelValue', value)
    },
    focus() {
      this.$refs.dom_input.focus()
    },
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.input {
  display: inline-block;
  border: none;
  border-radius: @form-radius;
  padding: 7px 8px;
  color: var(--color-button-font);
  outline: none;
  transition: background-color 0.2s ease;
  background-color: var(--color-primary-background);
  font-size: 13.3px;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &[disabled] {
    opacity: .4;
  }

  &:hover, &:focus {
    background-color: var(--color-primary-background-hover);
  }
  &:active {
    background-color: var(--color-primary-background-active);
  }
}

.min {
  padding: 3px 8px;
  font-size: 12px;
}

</style>
