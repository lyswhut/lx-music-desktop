<template lang="pug">
  input(:class="$style.input" :type="type" :placeholder="placeholder" v-model.trim="text" :disabled="disabled"
    @focus="$emit('focus', $event)" @blur="$emit('blur', $event)" @input="$emit('input', text)" @change="$emit('change', text)"
    @keyup.enter="submit")
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
  data() {
    return {
      text: '',
    }
  },
  watch: {
    value(n) {
      this.text = n
    },
  },
  methods: {
    handleInput() {

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
