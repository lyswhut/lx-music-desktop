<template lang="pug">
  div(:class="[$style.select, show ? $style.active : '']")
    div(:class="$style.label" ref="dom_btn" @click="handleShow") {{label}}
    ul(:class="$style.list")
      li(v-for="item in list" @click="handleClick(item)" :title="itemName ? item[itemName] : item") {{itemName ? item[itemName] : item}}
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

.select {
  font-size: 12px;
  position: relative;

  &.active {
    .list {
      transform: scaleY(1);
      opacity: 1;
    }
  }
}

.label {
  // background-color: @color-btn-background;
  transition: background-color @transition-theme;
  border: 1px solid #ccc;
  height: 28px;
  box-sizing: border-box;
  color: @color-btn;
  cursor: pointer;

  &:hover {
    background-color: @color-theme_2-hover;
  }
  &:active {
    background-color: @color-theme_2-active;
  }
}

.list {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: @color-theme_2-background_2;
  opacity: 0;
  transform: scaleY(0);
  transform-origin: 0 0 0;
  transition: .25s ease;
  transition-property: transform, opacity;
  z-index: 10;

  li {
    cursor: pointer;
    padding: 8px 15px;
    // color: @color-btn;
    outline: none;
    transition: background-color @transition-theme;
    background-color: @color-btn-background;
    box-sizing: border-box;

    &:hover {
      background-color: @color-theme_2-hover;
    }
    &:active {
      background-color: @color-theme_2-active;
    }
  }
}


each(@themes, {
  :global(#container.@{value}) {
    .label {
      color: ~'@{color-@{value}-btn}';
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
      }
    }
  }
})

</style>
