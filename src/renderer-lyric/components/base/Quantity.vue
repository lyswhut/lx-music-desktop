<template lang="pug">
div(:class="$style.quantity")
  button(:class="[$style.btn, $style.minus]" @click="handleMinusClick") -
  input(:class="$style.input" ref="dom_input" :value="text" :disabled="disabled" @focus="$emit('focus', $event)" @blur="$emit('blur', $event)" @input="handleInput"
    @change="$emit('change', text)" @keyup.enter="submit" type="number" :min="min" :max="max")
  button(:class="[$style.btn, $style.add]" @click="handleAddClick") +
</template>

<script>
export default {
  props: {
    min: {
      type: Number,
    },
    max: {
      type: Number,
    },
    step: {
      type: Number,
      default: 20,
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
      text: 0,
    }
  },
  watch: {
    value(n) {
      this.text = n
    },
  },
  mounted() {
    this.text = this.value
  },
  methods: {
    handleInput() {
      let num = parseInt(this.$refs.dom_input.value)
      console.log(this.$refs.dom_input.value)
      if (Number.isNaN(num)) num = this.text
      if (this.min != null && this.min > num) {
        num = this.min
      } else if (this.max != null && this.max < num) {
        num = this.max
      }
      this.text = this.$refs.dom_input.value = num
      this.$emit('input', this.text)
    },
    handleMinusClick() {
      let num = this.text - this.step
      this.$refs.dom_input.value = this.min == null ? num : Math.max(num, this.min)
      this.handleInput()
    },
    handleAddClick() {
      let num = this.text + this.step
      this.$refs.dom_input.value = this.max == null ? num : Math.min(num, this.max)
      this.handleInput()
    },
  },
}
</script>

<style lang="less" module>
@import '../../assets/styles/layout.less';
.quantity {
  display: flex;
  width: 160px;
  opacity: .9;
}

.input::-webkit-inner-spin-button,
.input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}

.input,
.btn {
  height: 30px;
  text-align: center;
  background: transparent;
  border: 1px solid #fff;
  color: #fff;
  outline: none;
  box-sizing: border-box;
}

.input {
  border-left: none;
  border-right: none;
  width: 60px;
  position: relative;
  // font-weight: 900;
}

.btn {
  width: 30px;
  cursor: pointer;
}

.minus {
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
}
.add {
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}

</style>
