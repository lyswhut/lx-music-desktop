<template lang="pug">
div(:class="$style.checkbox")
  input(:type="need ? 'radio' : 'checkbox'" :id="id" :value="target" :name="name" @change="change" v-model="val")
  label(:for="id" :class="$style.content")
    div
      svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' width="100%" viewBox='0 32 448 448' space='preserve')
        use(xlink:href='#icon-check')
    span
      slot
</template>

<script>
export default {
  props: {
    target: {},
    value: {},
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
    },
    need: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      val: false,
    }
  },
  watch: {
    value(n) {
      if (this.target && n !== this.target) {
        this.val = this.need
          ? n === this.target
            ? this.target
            : false
          : n === this.target
      } else if (n !== this.val) {
        this.val = n
      }
    },
  },
  mounted() {
    if (this.target) {
      this.val = this.need
        ? this.value === this.target
          ? this.target
          : false
        : this.value === this.target
    } else {
      this.val = this.value
    }
  },
  methods: {
    change() {
      let val = this.target == null ? this.val : this.val ? this.target : null
      this.$emit('input', val)
      this.$emit('change', val)
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';

.checkbox {
  display: inline-block;
  // font-size: 56px;

  > input {
    display: none;
    &:checked {
      + .content {
        > div {
          &:after {
            border-color: @color-theme;
          }
          svg {
            transform: scale(1);
            opacity: 1;
          }
        }
      }
    }
  }
}
.content {
  display: flex;
  justify-content: center;

  > div {
    flex: none;
    position: relative;
    display: inline-block;
    width: 1em;
    height: 1em;
    cursor: pointer;
    display: flex;
    color: @color-theme;
    // border: 1px solid #ccc;
    &:after {
      position: absolute;
      content: ' ';
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      border: 1px solid #ccc;
      transition: border-color 0.2s ease;
      border-radius: 15%;
    }
    svg {
      transition: 0.2s ease;
      transition-property: transform, opacity;
      transform: scale(0.5);
      opacity: 0;
    }
  }

  > span {
    flex: auto;
    line-height: 1;
    margin-left: 5px;
    cursor: pointer;
  }
}

each(@themes, {
  :global(#container.@{value}) {
    .checkbox {
      > input {
        &:checked {
          + .content {
            > div {
              &:after {
                border-color: ~'@{color-@{value}-theme}';
              }
            }
          }
        }
      }
    }
    .content {
      > div {
        color: ~'@{color-@{value}-theme}';
        // border: 1px solid #ccc;
        &:after {
          border-color: #ccc;
        }
      }
    }
  }
})
</style>
