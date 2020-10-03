<template lang="pug">
div(:class="$style.container")
  div(:class="[$style.search, focus ? $style.active : '', big ? $style.big : '', small ? $style.small : '']")
    div(:class="$style.form")
      input(:placeholder="placeholder" v-model.trim="text" ref="dom_input"
            @focus="handleFocus" @blur="handleBlur" @input="$emit('input', text)"
            @change="sendEvent('change')"
            @keyup.enter="handleSearch"
            @keyup.40.prevent="handleKeyDown"
            @keyup.38.prevent="handleKeyUp"
            @contextmenu="handleContextMenu")
      button(type="button" @click="handleSearch")
        slot
          svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 30.239 30.239' space='preserve')
            use(xlink:href='#icon-search')
    //- transition(name="custom-classes-transition"
    //-             enter-active-class="animated flipInX"
    //-             leave-active-class="animated flipOutX")
    div(v-if="list" :class="$style.list" :style="listStyle")
      ul(ref="dom_list")
        li(v-for="(item, index) in list" :key="item" :class="selectIndex === index ? $style.select : null" @mouseenter="selectIndex = index" @click="handleTemplistClick(index)")
          span {{item}}
</template>

<script>
import { clipboardReadText } from '../../utils'
import { common as eventCommonNames } from '../../../common/hotKey'
export default {
  props: {
    placeholder: {
      type: String,
      default: 'Search for something...',
    },
    list: {
      type: Array,
    },
    visibleList: {
      type: Boolean,
      default: false,
    },
    value: {
      type: String,
      default: '',
    },
    big: {
      type: Boolean,
      default: false,
    },
    small: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isShow: false,
      text: '',
      selectIndex: -1,
      focus: false,
      listStyle: {
        height: 0,
      },
    }
  },
  watch: {
    list(n) {
      if (!this.visibleList) return
      if (this.selectIndex > -1) this.selectIndex = -1
      this.$nextTick(() => {
        this.listStyle.height = this.$refs.dom_list.scrollHeight + 'px'
      })
    },
    value(n) {
      this.text = n
    },
    visibleList(n) {
      n ? this.showList() : this.hideList()
    },
  },
  mounted() {
    if (this.$store.getters.setting.search.isFocusSearchBox) this.handleFocusInput()
    this.handleRegisterEvent('on')
  },
  beforeDestroy() {
    this.handleRegisterEvent('off')
  },
  methods: {
    handleRegisterEvent(action) {
      let eventHub = window.eventHub
      let name = action == 'on' ? '$on' : '$off'
      eventHub[name](eventCommonNames.focusSearchInput.action, this.handleFocusInput)
    },
    handleFocusInput() {
      this.$refs.dom_input.focus()
    },
    handleTemplistClick(index) {
      this.sendEvent('listClick', index)
    },
    handleFocus() {
      this.focus = true
      this.sendEvent('focus')
    },
    handleBlur() {
      setTimeout(() => {
        this.focus = false
        this.sendEvent('blur')
      }, 80)
    },
    handleSearch() {
      this.hideList()
      if (this.selectIndex < 0) return this.sendEvent('submit')
      this.sendEvent('listClick', this.selectIndex)
    },
    showList() {
      this.isShow = true
      this.listStyle.height = this.$refs.dom_list.scrollHeight + 'px'
    },
    hideList() {
      this.isShow = false
      this.listStyle.height = 0
      this.$nextTick(() => {
        this.selectIndex = -1
      })
    },
    sendEvent(action, data) {
      this.$emit('event', {
        action,
        data,
      })
    },
    handleKeyDown() {
      this.selectIndex = this.selectIndex + 1 < this.list.length ? this.selectIndex + 1 : 0
    },
    handleKeyUp() {
      this.selectIndex = this.selectIndex - 1 < -1 ? this.list.length - 1 : this.selectIndex - 1
    },
    handleContextMenu() {
      let str = clipboardReadText()
      str = str.trim()
      str = str.replace(/\t|\r\n|\n|\r/g, ' ')
      str = str.replace(/\s+/g, ' ')
      let dom_input = this.$refs.dom_input
      this.text = `${this.text.substring(0, dom_input.selectionStart)}${str}${this.text.substring(dom_input.selectionEnd, this.text.length)}`
      this.$emit('input', this.text)
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';

.container {
  position: relative;
  width: 35%;
  height: @height-toolbar * 0.52;
  -webkit-app-region: no-drag;
}

.search {
  position: absolute;
  width: 100%;
  border-radius: @form-radius;
  transition: box-shadow .4s ease, background-color @transition-theme;
  display: flex;
  flex-flow: column nowrap;
  background-color: @color-search-form-background;

  &.active {
    box-shadow: 0 1px 5px 0 rgba(0,0,0,.2);
    .form {
      input {
        border-bottom-left-radius: 0;

      }
      button {
        border-bottom-right-radius: 0;
      }
    }
  }
  .form {
    display: flex;
    height: @height-toolbar * 0.52;
    position: relative;
    input {
      flex: auto;
      // border: 1px solid;
      border-top-left-radius: 3px;
      border-bottom-left-radius: 3px;
      background-color: transparent;
      // border-bottom: 2px solid @color-theme;
      // border-color: @color-theme;
      border: none;

      outline: none;
      // height: @height-toolbar * .7;
      padding: 0 5px;
      overflow: hidden;
      font-size: 13.5px;
      line-height: @height-toolbar * 0.52 + 5px;
      &::placeholder {
        color: @color-btn;
      }
    }
    button {
      flex: none;
      border: none;
      // background-color: @color-search-form-background;
      background-color: transparent;
      outline: none;
      border-top-right-radius: 3px;
      border-bottom-right-radius: 3px;
      cursor: pointer;
      height: 100%;
      padding: 6px 7px;
      color: @color-btn;
      transition: background-color .2s ease;

      &:hover {
        background-color: @color-theme-hover;
      }
      &:active {
        background-color: @color-theme-active;
      }
    }
  }
  .list {
    // background-color: @color-search-form-background;
    font-size: 13px;
    transition: .3s ease;
    height: 0;
    transition-property: height;
    overflow: hidden;
    li {
      cursor: pointer;
      padding: 8px 5px;
      transition: background-color .2s ease;
      line-height: 1.3;
      span {
        .mixin-ellipsis-2;
      }

      &.select {
        background-color: @color-search-list-hover;
      }
      &:last-child {
        border-bottom-left-radius: 3px;
        border-bottom-right-radius: 3px;
      }
    }
  }
}

.big {
  width: 100%;
  // input {
  //   line-height: 30px;
  // }
  .form {
    height: 30px;
    button {
      padding: 6px 10px;
    }
  }
}

each(@themes, {
  :global(#container.@{value}) {

    .search {
      background-color: ~'@{color-@{value}-search-form-background}';
      &.active {
        box-shadow: 0 1px 5px 0 rgba(0,0,0,.2);
      }

      .form {
        input {
          &::placeholder {
            color: ~'@{color-@{value}-btn}';
          }
        }
        button {
          color: ~'@{color-@{value}-btn}';

          &:hover {
            background-color: ~'@{color-@{value}-theme-hover}';
          }
          &:active {
            background-color: ~'@{color-@{value}-theme-active}';
          }
        }
      }
      .list {
        li {
          &.select {
            background-color: ~'@{color-@{value}-search-list-hover}';
          }
        }
      }
    }
  }
})

</style>
