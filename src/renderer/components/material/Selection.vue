<template lang="pug">
  div(:class="[$style.select, show ? $style.active : '']")
    div(:class="$style.label" ref="dom_btn" @click="handleShow") {{label}}
    ul(:class="$style.list")
      li(v-for="item in list" :class="(itemKey ? item[itemKey] : item) == value ? $style.active : null" @click="handleClick(item)" :title="itemName ? item[itemName] : item") {{itemName ? item[itemName] : item}}
</template>

<script>
// import { isChildren } from '../../utils'
export default {
  props: {
    list: {
      type: Array,
      default() {
        return []
      },
    },
    value: {
      type: [String, Number],
    },
    itemName: {
      type: String,
    },
    itemKey: {
      type: String,
    },
  },
  data() {
    return {
      show: false,
    }
  },
  mounted() {
    document.addEventListener('click', this.handleHide)
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleHide)
  },
  computed: {
    label() {
      if (!this.value) return ''
      if (!this.itemName) return this.value
      const item = this.list.find(l => l[this.itemKey] == this.value)
      if (!item) return ''
      return item[this.itemName]
    },
  },
  methods: {
    handleHide(e) {
      // if (e && e.target.parentNode != this.$refs.dom_list && this.show) return this.show = false
      if (e && e.target == this.$refs.dom_btn) return
      setTimeout(() => {
        this.show = false
      }, 50)
    },
    handleClick(item) {
      console.log(this.value)
      if (item === this.value) return
      this.$emit('input', this.itemKey ? item[this.itemKey] : item)
      this.$emit('change', item)
    },
    handleShow() {
      this.show = !this.show
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';

@selection-height: 28px;

.select {
  font-size: 12px;
  position: relative;
  width: 300px;

  &.active {
    .label {
      background-color: @color-btn-background;
    }
    .list {
      transform: scaleY(1);
      opacity: 1;
    }
  }
}

.label {
  background-color: @color-btn-background;
  padding: 0 10px;
  transition: background-color @transition-theme;
  height: @selection-height;
  line-height: 27px;
  box-sizing: border-box;
  color: @color-btn;
  border-radius: @form-radius;
  cursor: pointer;
  .mixin-ellipsis-1;

  &:hover {
    background-color: @color-theme_2-hover;
  }
  &:active {
    background-color: @color-theme_2-active;
  }
}

.list {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background-color: @color-theme_2-background_2;
  opacity: 0;
  transform: scaleY(0);
  transform-origin: 0 @selection-height / 2 0;
  transition: .25s ease;
  transition-property: transform, opacity;
  z-index: 10;
  border-radius: @form-radius;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, .12);

  li {
    cursor: pointer;
    padding: 0 10px;
    line-height: @selection-height;
    // color: @color-btn;
    outline: none;
    transition: background-color @transition-theme;
    background-color: @color-btn-background;
    box-sizing: border-box;
    .mixin-ellipsis-1;

    &:hover {
      background-color: @color-theme_2-hover;
    }
    &:active {
      background-color: @color-theme_2-active;
    }
    &.active {
      color: @color-btn;
    }
  }
}


each(@themes, {
  :global(#container.@{value}) {
    .label {
      color: ~'@{color-@{value}-btn}';
      background-color: ~'@{color-@{value}-btn-background}';
      &:hover {
        background-color: ~'@{color-@{value}-theme_2-hover}';
      }
      &:active {
        background-color: ~'@{color-@{value}-theme_2-active}';
      }
    }

    .list {
      background-color: ~'@{color-@{value}-theme_2-background_2}';
      li {
        // color: ~'@{color-@{value}-btn}';
        background-color: ~'@{color-@{value}-btn-background}';
        &:hover {
          background-color: ~'@{color-@{value}-theme_2-hover}';
        }
        &:active {
          background-color: ~'@{color-@{value}-theme_2-active}';
        }
        &.active {
          color: ~'@{color-@{value}-btn}';
        }
      }
    }
  }
})

</style>
