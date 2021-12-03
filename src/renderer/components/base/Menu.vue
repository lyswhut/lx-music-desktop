<template>
<ul :class="$style.list" :style="listStyles" ref="dom_list">
  <li v-for="item in menus"
    :key="item.action"
    @click="handleClick(item)"
    v-show="!item.hide && (item.action == 'download' ? setting.download.enable : true)"
    :disabled="item.disabled ? true : null">{{item[itemName]}}</li>
</ul>
</template>

<script>
import { mapGetters } from 'vuex'

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
  emits: ['menu-click'],
  computed: {
    ...mapGetters(['setting']),
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
        this.listStyles.left = n.x + 2 + 'px'
        this.listStyles.top = n.y + 'px'
        if (this.show) {
          if (this.listStyles.transitionProperty != this.transition2) this.listStyles.transitionProperty = this.transition2
          this.listStyles.transform = `scaleY(1) translate(${this.handleGetOffsetXY(n.x, n.y)})`
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
        transform: 'scale(0) translate(0,0)',
      },
      transition1: 'transform, opacity',
      transition2: 'transform, opacity, top, left',
      transitionProperty: 'transform, opacity',
    }
  },
  mounted() {
    document.addEventListener('click', this.handleDocumentClick)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleDocumentClick)
  },
  methods: {
    handleShow() {
      this.show = true
      this.listStyles.opacity = 1
      this.listStyles.transform = `scaleY(1) translate(${this.handleGetOffsetXY(this.location.x, this.location.y)})`
    },
    handleHide(e) {
      this.listStyles.opacity = 0
      this.listStyles.transform = 'scale(0) translate(0, 0)'
      this.show = false
    },
    handleGetOffsetXY(left, top) {
      const listWidth = this.$refs.dom_list.clientWidth
      const listHeight = this.$refs.dom_list.clientHeight
      const dom_container = this.$refs.dom_list.offsetParent
      const containerWidth = dom_container.clientWidth
      const containerHeight = dom_container.clientHeight
      const offsetWidth = containerWidth - left - listWidth
      const offsetHeight = containerHeight - top - listHeight
      let x = 0
      let y = 0
      if (containerWidth > listWidth && offsetWidth < 17) {
        x = offsetWidth - 17
      }
      if (containerHeight > listHeight && offsetHeight < 5) {
        y = offsetHeight - 5
      }
      return `${x}px, ${y}px`
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
@import '@renderer/assets/styles/layout.less';

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
  overflow: hidden;
  // will-change: transform;
  li {
    cursor: pointer;
    min-width: 96px;
    line-height: 34px;
    // color: @color-btn;
    padding: 0 10px;
    text-align: center;
    outline: none;
    transition: @transition-theme;
    transition-property: background-color, opacity;
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
  :global(#root.@{value}) {
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
