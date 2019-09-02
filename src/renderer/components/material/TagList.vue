<template lang="pug">
  div(:class="$style.tagList")
    div(:class="$style.label" ref="dom_btn" @click="handleShow") {{value.name}}
    div.scroll(:class="$style.list" @click.stop ref="dom_list" :style="listStyle")
      div(:class="$style.tag" @click="handleClick(null)") 全部
      dl(:class="$style.type" v-for="type in list")
        dt(:class="$style.type") {{type.name}}
        dd(:class="$style.tag" v-for="tag in type.list" @click="handleClick(tag)") {{tag.name}}
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
      type: Object,
    },
  },
  data() {
    return {
      show: false,
      listStyle: {
        height: 0,
        opacity: 0,
      },
    }
  },
  watch: {
    show(n) {
      this.$nextTick(() => {
        if (n) {
          let sh = this.$refs.dom_list.scrollHeight
          this.listStyle.height = (sh > 250 ? 250 : sh) + 'px'
          this.listStyle.opacity = 1
          this.listStyle.overflow = 'auto'
        } else {
          this.listStyle.height = 0
          this.listStyle.opacity = 0
        }
      })
    },
    list() {
      this.$refs.dom_list.scrollTop = 0
    },
  },
  mounted() {
    document.addEventListener('click', this.handleHide)
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleHide)
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
      if (!item) {
        item = {
          name: '全部',
          id: null,
        }
      }
      if (item.id === this.value.id) return this.handleShow()
      this.$emit('input', item)
      this.$emit('change', item)
      this.handleShow()
    },
    handleShow() {
      this.show = !this.show
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';

.tag-list {
  font-size: 12px;
  position: relative;
}

.label {
  padding: 8px 15px;
  // background-color: @color-btn-background;
  transition: background-color @transition-theme;
  border-top: 2px solid @color-tab-border-bottom;
  // border-left: 2px solid @color-tab-border-bottom;
  box-sizing: border-box;
  text-align: center;
  // border-top-left-radius: 3px;
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
  width: 644px;
  left: 0;
  border-bottom: 2px solid @color-tab-border-bottom;
  border-right: 2px solid @color-tab-border-bottom;
  border-bottom-right-radius: 5px;
  background-color: @color-theme_2;
  overflow: hidden;
  opacity: 0;
  transition: .25s ease;
  transition-property: height, opacity;
  z-index: 10;

  li {
    cursor: pointer;
    padding: 8px 15px;
    // color: @color-btn;
    text-align: center;
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

.tag {
  display: inline-block;
  margin: 5px;
  background-color: @color-btn-background;
  padding: 5px;
  cursor: pointer;
  &:hover {
    background-color: @color-theme_2-hover;
  }
  &:active {
    background-color: @color-theme_2-active;
  }
}


each(@themes, {
  :global(#container.@{value}) {
    .label {
      border-top-color: ~'@{color-@{value}-tab-border-bottom}';
      // border-left-color: ~'@{color-@{value}-tab-border-bottom}';
      color: ~'@{color-@{value}-btn}';
      &:hover {
        background-color: ~'@{color-@{value}-theme_2-hover}';
      }
      &:active {
        background-color: ~'@{color-@{value}-theme_2-active}';
      }
    }

    .list {
      border-bottom-color: ~'@{color-@{value}-tab-border-bottom}';
      // border-left-color: ~'@{color-@{value}-tab-border-bottom}';
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
