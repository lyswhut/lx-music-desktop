<template lang="pug">
  input(type="range" :class="[$style.range, min ? $style.min : '']" :disabled="disabled" v-model="val" input="handleInput" @change="handleChange")
</template>

<script>
export default {
  props: {
    min: {
      type: Boolean,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    value: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      val: 0,
    }
  },
  mounted() {
    this.val = this.value
  },
  methods: {
    handleChange(e) {
      this.$emit('input', this.val)
      this.$emit('change', e)
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';

.range {
  display: inline-block;
  border-radius: .25em;
  cursor: pointer;
  color: @color-btn;
  outline: none;
  background: transparent;
  // background-color: @color-btn-background;
  &[disabled] {
    opacity: .4;
  }

  &:hover {
    background-color: @color-theme_2-hover;
  }
  &:active {
    background-color: @color-theme_2-active;
  }
}

.min {

}

// each(@themes, {
//   :global(#container.@{value}) {
//     .btn {
//       color: ~'@{color-@{value}-btn}';
//       background-color: ~'@{color-@{value}-btn-background}';
//       &:hover {
//         background-color: ~'@{color-@{value}-theme_2-hover}';
//       }
//       &:active {
//         background-color: ~'@{color-@{value}-theme_2-active}';
//       }
//     }
//   }
// })

</style>
