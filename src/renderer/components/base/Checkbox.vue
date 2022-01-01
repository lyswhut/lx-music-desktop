<template lang="pug">
div(:class="$style.checkbox")
  input(:type="need ? 'radio' : 'checkbox'" :class="$style.input" :id="id" :disabled="disabled" :value="value" :name="name" @change="change" v-model="bool")
  label(:for="id" :class="$style.content")
    div(v-if="indeterminate" :class="$style.container")
      svg(v-show="indeterminate" :class="$style.icon" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' width="100%" viewBox='0 32 448 448' space='preserve')
        use(xlink:href='#icon-check-indeterminate')
      svg(v-show="!indeterminate" :class="$style.icon" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' width="100%" viewBox='0 0 448 512' space='preserve')
        use(xlink:href='#icon-check-true')
    div(v-else :class="$style.container")
      svg(version='1.1' :class="$style.icon" xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' width="100%" viewBox='0 32 448 448' space='preserve')
        use(xlink:href='#icon-check-true')
    span(v-if="label != null" v-html="label" :class="$style.label")
</template>

<script>
export default {
  props: {
    modelValue: {},
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
    label: {
      type: String,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    indeterminate: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      bool: false,
    }
  },
  watch: {
    modelValue(n) {
      this.setValue(n)
    },
  },
  mounted() {
    this.setValue(this.modelValue)
  },
  methods: {
    change() {
      let checked
      if (Array.isArray(this.modelValue)) {
        checked = [...this.modelValue]
        const index = checked.indexOf(this.value)
        if (index < 0) {
          checked.push(this.value)
        } else {
          checked.splice(index, 1)
        }
      } else {
        let bool = this.bool
        switch (typeof this.modelValue) {
          case 'boolean':
            if (this.indeterminate) {
              bool = true
              this.$nextTick(() => {
                this.bool = bool
              })
            }
            checked = bool
            break
          case 'number':
            checked = this.value
            break
          default:
            checked = bool ? this.value : ''
            break
        }
      }
      this.$emit('update:modelValue', checked)
      this.$emit('change', checked)
    },
    setValue(value) {
      let bool
      if (Array.isArray(value)) {
        bool = value.includes(this.value)
      } else {
        switch (typeof value) {
          case 'boolean':
            bool = value
            break
          // case 'string':
          // case 'number':
          default:
            bool = value === this.value
            break
        }
      }

      this.bool = this.need ? bool && this.value : bool
    },
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.checkbox {
  display: inline-block;
  // font-size: 56px;
}
.input {
  display: none;
  &[disabled] {
    + .content {
      opacity: .5;
    }
  }
  &:checked {
    + .content {
      .container {
        &:after {
          border-color: @color-theme;
        }
      }
      .icon {
        transform: scale(1);
        // opacity: 1;
      }
    }
  }
}
.content {
  display: flex;
  justify-content: center;

}
.container {
  flex: none;
  position: relative;
  display: inline-block;
  width: 1em;
  height: 1em;
  cursor: pointer;
  display: flex;
  color: @color-theme;
  margin-top: .25em;
  // border: 1px solid #ccc;
  &:after {
    position: absolute;
    content: ' ';
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border: 1px solid @color-theme_2-font-label;
    transition: border-color 0.2s ease;
    border-radius: 2px;
  }
}
.icon {
  transition: 0.3s ease;
  transition-property: transform;
  transform: scale(0);
  border-radius: 2px;
  // opacity: 0;
}

.label {
  flex: auto;
  line-height: 1;
  margin-left: 5px;
  line-height: 1.5;
  cursor: pointer;
}

each(@themes, {
  :global(#root.@{value}) {
    .checkbox {
      > input {
        &:checked {
          + .content {
            .container {
              &:after {
                border-color: ~'@{color-@{value}-theme}';
              }
            }
          }
        }
      }
    }
    .content {
      .container {
        color: ~'@{color-@{value}-theme}';
        // border: 1px solid #ccc;
        &:after {
          border-color: ~'@{color-@{value}-theme_2-font-label}';
        }
      }
    }
  }
})
</style>
