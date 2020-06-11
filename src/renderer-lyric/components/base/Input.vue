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
      type: [String, Number],
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
  background: none;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, .7);
  outline: none;
  color: #fff;
  // height: 28px;
  box-sizing: border-box;
  transition: border-color @transition-theme;
  &:focus {
    border-color: rgba(255, 255, 255, 1);
  }
}

</style>
