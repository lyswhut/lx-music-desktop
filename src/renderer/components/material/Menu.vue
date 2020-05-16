<template lang="pug">
ul(:class="$style.list" :style="listStyles" ref="dom_list")
  li(v-for="item in menus" @click="handleClick(item)" :disabled="item.disabled") {{item[itemName]}}
</template>

<script>

export default {
  props: {
    menus: {
      type: Array,
      default() {
        return []
      },
    },
    itemName: {
      type: String,
      default: 'name',
    },
    isShow: {
      type: Boolean,
      default: false,
    },
    location: {
      type: Object,
      default() {
        return { x: 0, y: 0 }
      },
    },
  },
  watch: {
    isShow: {
      handler(n) {
        n ? this.handleShow() : this.handleHide()
      },
      immediate: true,
    },
    location: {
      handler(n) {
        this.listStyles.left = n.x + 'px'
        this.listStyles.top = n.y + 'px'
        if (this.show) {
          if (this.listStyles.transitionProperty != this.transition2) this.listStyles.transitionProperty = this.transition2
          this.listStyles.transform = `scaleY(1) translateY(${this.handleGetOffset(n.y)}px)`
        }
      },
      deep: true,
    },
  },
  data() {
    return {
      show: false,
      listStyles: {
        left: 0,
        top: 0,
        opacity: 0,
        transitionProperty: 'transform, opacity',
        transform: 'scale(0) translateY(0)',
      },
      transition1: 'transform, opacity',
      transition2: 'transform, opacity, top, left',
      transitionProperty: 'transform, opacity',
    }
  },
  mounted() {
    document.addEventListener('click', this.handleDocumentClick)
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleDocumentClick)
  },
  methods: {
    handleShow() {
      this.show = true
      this.listStyles.opacity = 1
      this.listStyles.transform = `scaleY(1) translateY(${this.handleGetOffset(this.location.y)}px)`
    },
    handleHide(e) {
      this.listStyles.opacity = 0
      this.listStyles.transform = 'scale(0) translateY(0)'
      this.show = false
    },
    handleGetOffset(top) {
      const listHeight = this.$refs.dom_list.clientHeight
      const dom_container = this.$refs.dom_list.offsetParent
      const containerHeight = dom_container.clientHeight
      if (containerHeight < listHeight) return 0
      const offsetHeight = containerHeight - top - listHeight
      if (offsetHeight > 0) return 0
      return offsetHeight - 5
    },
    handleDocumentClick(event) {
      if (!this.show) return

      if (event.target == this.$refs.dom_list || this.$refs.dom_list.contains(event.target)) return

      if (this.show && this.listStyles.transitionProperty != this.transition1) this.listStyles.transitionProperty = this.transition1
      this.handleClick(null)
    },
    handleClick(item) {
      if (item && item.disabled) return

      this.$emit('menu-click', item)
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';

.list {
  font-size: 12px;
  position: absolute;
  opacity: 0;
  transform: scale(0);
  transform-origin: 0 0 0;
  transition: .25s ease;
  transition-property: transform, opacity;
  border-radius: @radius-border;
  background-color: @color-theme_2-background_2;
  box-shadow: 0 1px 8px 0 rgba(0,0,0,.2);
  z-index: 10;

  li {
    cursor: pointer;
    min-width: 80px;
    line-height: 34px;
    // color: @color-btn;
    padding: 0 5px;
    text-align: center;
    outline: none;
    transition: background-color @transition-theme;
    box-sizing: border-box;
    .mixin-ellipsis-1;

    &:hover {
      background-color: @color-theme_2-hover;
    }
    &:active {
      background-color: @color-theme_2-active;
    }

    &[disabled] {
      cursor: default;
      opacity: .4;
      &:hover {
        background: none !important;
      }
    }
  }
}


each(@themes, {
  :global(#container.@{value}) {
    .list {
      background-color: ~'@{color-@{value}-theme_2-background_2}';
      li {
        // color: ~'@{color-@{value}-btn}';
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
