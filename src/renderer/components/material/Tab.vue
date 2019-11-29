<template lang="pug">
div.scroll(:class="$style.tab")
  //- div(:class="$style.content")
  ul
    li(v-for="item in list" :key="itemKey ? item[itemKey] : item" :class="value === (itemKey ? item[itemKey] : item) ? $style.active : ''")
      button(type="button"
        @click="handleClick(itemKey ? item[itemKey] : item)") {{ itemName ? item[itemName] : item }}
  //- div(:class="$style.control")
    div(:class="$style.left")
      svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 451.846 451.847' space='preserve')
        use(xlink:href='#icon-left')
    div(:class="$style.right")
      svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 451.846 451.847' space='preserve')
        use(xlink:href='#icon-right')
</template>

<script>
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
  methods: {
    handleClick(item) {
      if (item === this.value) return
      this.$emit('input', item)
      this.$emit('change', item)
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';

.tab {
  // overflow: hidden;
  // display: flex;
  // flex-flow: row nowrap;
  overflow-x: auto;
  ul {
    display: flex;
    flex: none;
    border-bottom: 2px solid @color-tab-border-bottom;
    transition: border-bottom-color @transition-theme;
    li {
      position: relative;
      flex: none;
      margin-bottom: -2px;
      border-top: 2px solid @color-tab-border-top;
      border-left: 2px solid @color-tab-btn-background;
      border-right: 2px solid @color-tab-btn-background;
      // box-sizing: border-box;
      transition: border-color @transition-theme;
      margin-left: -2px;

      &::after {
        content: ' ';
        display: block;
        width: 50%;
        height: 2px;
        position: absolute;
        bottom: 0;
        left: 0;
        background-color: @color-tab-border-bottom;
        transition: width @transition-theme;
      }
      &::before {
        content: ' ';
        display: block;
        width: 50%;
        height: 2px;
        position: absolute;
        bottom: 0;
        right: 0;
        background-color: @color-tab-border-bottom;
        transition: width @transition-theme;
      }
      &:first-child {
        border-left: none;
        margin-left: 0;
        button {
          border-top-left-radius: 3px;
          // border-bottom-left-radius: 4px;
        }
      }
      &:last-child {
        border-right: 2px solid @color-tab-border-top;
        border-top-right-radius: 4px;
        button {
          border-top-right-radius: 3px;
          // border-bottom-right-radius: 4px;
        }
      }
      button {
        display: inline-block;
        border: none;
        cursor: pointer;
        padding: 0 10px;
        font-size: 12px;
        // color: @color-btn;
        outline: none;
        transition: background-color @transition-theme;
        background-color: @color-tab-btn-background;
        line-height: 28px;
      }
      &:hover {
        // border-left-color: @color-theme_2-hover;
        // border-right-color: @color-theme_2-hover;
        button {
          background-color: @color-tab-btn-background-hover;
        }
      }
      &:active {
        // border-left-color: @color-theme_2-active;
        // border-right-color: @color-theme_2-active;
        button {
          background-color: @color-theme_2-active;
        }
      }
      &.active {
        border-bottom-color: @color-theme_2-background_1;
        border-top-color: @color-tab-border-bottom;
        border-left-color: @color-tab-border-bottom;
        border-right-color: @color-tab-border-bottom;
        &::after {
          width: 0;
        }
        &::before {
          width: 0;
        }
        button {
          background-color: @color-theme_2-background_1;
        }
      }
    }
  }
}
// .control {
//   flex: none;
//   border-bottom: 2px solid @color-tab-border-bottom;
//   width: 1em;
//   svg {
//     width: .85em;
//   }
// }
// .left, .right {
//   line-height: 0;
// }
// .content {
//   flex: auto;
//   overflow: hidden;
// }

each(@themes, {
  :global(#container.@{value}) {
    .tab {
      ul {
        border-bottom-color: ~'@{color-@{value}-tab-border-bottom}';
        li {
          border-top-color: ~'@{color-@{value}-tab-border-top}';
          border-left-color: ~'@{color-@{value}-tab-btn-background}';
          border-right-color: ~'@{color-@{value}-tab-btn-background}';

          &::after {
            background-color: ~'@{color-@{value}-tab-border-bottom}';
          }
          &::before {
            background-color: ~'@{color-@{value}-tab-border-bottom}';
          }
          &:last-child {
            border-right-color: ~'@{color-@{value}-tab-border-top}';
          }
          button {
            // color: ~'@{color-@{value}-btn}';
            background-color: ~'@{color-@{value}-tab-btn-background}';
          }
          &:hover {
            // border-left-color: ~'@{color-@{value}-theme_2-hover}';
            // border-right-color: ~'@{color-@{value}-theme_2-hover}';
            button {
              background-color: ~'@{color-@{value}-tab-btn-background-hover}';
            }
          }
          &:active {
            // border-left-color: ~'@{color-@{value}-theme_2-active}';
            // border-right-color: ~'@{color-@{value}-theme_2-active}';
            button {
              background-color: ~'@{color-@{value}-theme_2-active}';
            }
          }
          &.active {
            border-bottom-color: ~'@{color-@{value}-theme_2}';
            border-top-color: ~'@{color-@{value}-tab-border-bottom}';
            border-left-color: ~'@{color-@{value}-tab-border-bottom}';
            border-right-color: ~'@{color-@{value}-tab-border-bottom}';
            button {
              background-color: ~'@{color-@{value}-theme_2-background_1}';
            }
          }
        }
      }
    }
  }
})

</style>
