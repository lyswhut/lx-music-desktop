<template>
  <div :class="$style.container">
    <div :class="[$style.search, {[$style.active]: focus}, {[$style.big]: big}, {[$style.small]: small}]">
      <div :class="$style.form">
        <input
          ref="dom_input"
          v-model.trim="text"
          :placeholder="placeholder"
          @focus="handleFocus"
          @blur="handleBlur"
          @input="$emit('update:modelValue', text)"
          @change="sendEvent('change')"
          @keyup.enter="handleSearch"
          @keydown.arrow-down.arrow-up.prevent
          @keyup.arrow-down.prevent="handleKeyDown"
          @keyup.arrow-up.prevent="handleKeyUp"
          @contextmenu="handleContextMenu"
        >
        <transition enter-active-class="animated zoomIn" leave-active-class="animated zoomOut">
          <button v-show="text" type="button" @click="handleClearList">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 24 24" space="preserve">
              <use xlink:href="#icon-window-close" />
            </svg>
          </button>
        </transition>
        <button type="button" @click="handleSearch">
          <slot>
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 30.239 30.239" space="preserve">
              <use xlink:href="#icon-search" />
            </svg>
          </slot>
        </button>
      </div>
      <div v-if="list" :class="$style.list" :style="listStyle">
        <ul ref="dom_list" @mouseleave="selectIndex = -1">
          <li
            v-for="(item, index) in list"
            :key="item"
            :class="{[$style.select]: selectIndex === index }"
            @mouseenter="selectIndex = index"
            @click="handleTemplistClick(index)"
          >
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { clipboardReadText } from '@common/utils/electron'
import { HOTKEY_COMMON } from '@common/hotKey'
import { appSetting } from '@renderer/store/setting'

export default {
  props: {
    placeholder: {
      type: String,
      default: 'Search for something...',
    },
    list: {
      type: Array,
      default() {
        return []
      },
    },
    visibleList: {
      type: Boolean,
      default: false,
    },
    modelValue: {
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
  emits: ['update:modelValue', 'event'],
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
    modelValue(n) {
      this.text = n
    },
    visibleList(n) {
      n ? this.showList() : this.hideList()
    },
  },
  mounted() {
    if (appSetting['search.isFocusSearchBox']) this.handleFocusInput()
    this.handleRegisterEvent('on')
  },
  beforeUnmount() {
    this.handleRegisterEvent('off')
  },
  methods: {
    handleRegisterEvent(action) {
      let eventHub = window.key_event
      let name = action == 'on' ? 'on' : 'off'
      // eslint-disable-next-line @typescript-eslint/unbound-method
      eventHub[name](HOTKEY_COMMON.focusSearchInput.action, this.handleFocusInput)
    },
    handleFocusInput() {
      this.$refs.dom_input.focus()
    },
    handleTemplistClick(index) {
      console.log(index)
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
      if (this.selectIndex < 0) {
        this.sendEvent('submit')
        return
      }
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
      if (this.list.length) {
        this.selectIndex = this.selectIndex + 1 < this.list.length ? this.selectIndex + 1 : 0
      } else if (this.selectIndex > -1) {
        this.selectIndex = -1
      }
    },
    handleKeyUp() {
      if (this.list.length) {
        this.selectIndex = this.selectIndex - 1 < -1 ? this.list.length - 1 : this.selectIndex - 1
      } else if (this.selectIndex > -1) {
        this.selectIndex = -1
      }
    },
    handleContextMenu() {
      let str = clipboardReadText()
      str = str.trim()
      str = str.replace(/\t|\r\n|\n|\r/g, ' ')
      str = str.replace(/\s+/g, ' ')
      let dom_input = this.$refs.dom_input
      this.text = this.text.substring(0, dom_input.selectionStart) + str + this.text.substring(dom_input.selectionEnd, this.text.length)
      this.$emit('update:modelValue', this.text)
    },
    handleClearList() {
      this.text = ''
      this.$emit('update:modelValue', this.text)
      this.sendEvent('submit')
    },
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.container {
  position: relative;
  width: min(360px, 44%);
  min-width: 210px;
  height: 34px;
  -webkit-app-region: no-drag;
}

.search {
  position: absolute;
  width: 100%;
  border-radius: 17px;
  border: 1px solid var(--ui-border-subtle);
  transition: box-shadow @transition-fast, background-color @transition-fast, border-color @transition-fast, border-radius @transition-fast;
  display: flex;
  flex-flow: column nowrap;
  background-color: var(--ui-surface-hover);
  overflow: hidden;

  &.active {
    border-radius: 14px;
    background-color: var(--color-content-background);
    border-color: var(--ui-primary-border-soft);
    box-shadow: var(--ui-shadow-md);
  }
  .form {
    display: flex;
    align-items: center;
    height: 34px;
    padding: 0 6px 0 14px;
    box-sizing: border-box;
    position: relative;
    input {
      flex: auto;
      background-color: transparent;
      border: none;
      min-width: 0;
      outline: none;
      padding: 0 4px 0 0;
      overflow: hidden;
      font-size: 13px;
      line-height: 34px;
      color: var(--color-font);
      &::placeholder {
        color: var(--color-font-label);
        font-size: 12.5px;
      }
    }
    button {
      flex: none;
      border: none;
      background-color: transparent;
      outline: none;
      cursor: pointer;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      padding: 6px;
      box-sizing: border-box;
      color: var(--color-font-label);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background-color @transition-fast, color @transition-fast;

      &:hover {
        color: var(--color-primary);
        background-color: var(--ui-surface-hover);
      }
      &:active {
        background-color: var(--ui-surface-active);
      }
    }
  }
  .list {
    font-size: 13px;
    transition: height 0.22s ease;
    height: 0;
    overflow: hidden;
    border-top: 1px solid transparent;
    .active & {
      border-top-color: var(--ui-border-subtle);
    }
    li {
      cursor: pointer;
      padding: 8px 14px;
      transition: background-color @transition-fast;
      line-height: 1.35;
      span {
        .mixin-ellipsis-2();
      }

      &.select {
        background-color: var(--ui-surface-active);
        color: var(--color-primary);
      }
    }
  }
}

.big {
  width: 100%;
  .form {
    height: 36px;
    button {
      width: 30px;
      height: 30px;
    }
  }
}

</style>
