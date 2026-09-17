<template>
  <div :class="[$style.container, {[$style.big]: big, [$style.small]: small}]">
    <div :class="[$style.search, 'chrome-search']">
      <div :class="$style.form">
        <button type="button" :class="$style.leadIcon" :aria-label="placeholder" @click="handleSearch">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <use xlink:href="#icon-line-search" />
          </svg>
        </button>
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
        <button v-show="text" type="button" :class="$style.iconBtn" :aria-label="$t('btn_close')" @click="handleClearList">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <use xlink:href="#icon-line-close" />
          </svg>
        </button>
        <kbd v-if="small" :class="$style.kbd">{{ searchKeyHint }}</kbd>
      </div>
    </div>
    <div v-if="list" :class="[$style.list, {[$style.listOpen]: isShow}]" :style="listStyle">
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
  computed: {
    searchKeyHint() {
      const isMac = window.os == 'mac' || document.documentElement.classList.contains('mac')
      return isMac ? '⌘ K' : 'Ctrl K'
    },
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
  box-sizing: border-box;
  -webkit-app-region: no-drag;
}

.search {
  width: 100%;
}

.form {
  display: contents;
  input {
    flex: auto;
    min-width: 0;
    height: 100%;
    padding: 0;
    border: 0;
    outline: none;
    overflow: hidden;
    background: transparent;
    font-size: 11px;
    line-height: 1;
    color: var(--color-font);
    &::placeholder {
      color: var(--color-secondary);
      font-size: .98em;
    }
  }
}

.leadIcon,
.iconBtn {
  flex: none;
  width: 15px;
  height: 15px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-secondary);
  display: grid;
  place-items: center;
  cursor: pointer;
  svg {
    width: 15px;
    height: 15px;
    fill: none;
    stroke: currentColor;
  }
}

.list {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  left: 0;
  z-index: 20;
  box-sizing: border-box;
  height: 0;
  margin: 0;
  overflow: hidden;
  font-size: 13px;
  border: 0;
  background: transparent;
  transition: height .18s ease;
  ul {
    padding: 4px 0;
  }
  li {
    cursor: pointer;
    margin: 0 4px;
    padding: 8px 10px;
    border-radius: 8px;
    transition: background-color .12s ease;
    line-height: 1.4;
    span {
      .mixin-ellipsis-2();
    }

    &.select {
      background-color: var(--color-accent-soft);
    }
  }
}

.listOpen {
  background: var(--color-panel);
  border: 1px solid var(--color-line);
  border-radius: 12px;
  box-shadow: 0 8px 24px color-mix(in srgb, var(--color-font) 8%, transparent);
}

.big {
  width: 100%;
}

.small {
  width: 245px;
  max-width: 46%;
  height: 31px;
  margin-left: auto;
}

.kbd {
  flex: none;
  white-space: nowrap;
  background: var(--color-well);
  border: 1px solid var(--color-line);
  border-radius: 4px;
  padding: 2px 5px;
  font: 10px -apple-system, BlinkMacSystemFont, sans-serif;
  line-height: 1;
  color: var(--color-secondary);
}

@media (max-width: 920px) {
  .kbd {
    display: none;
  }
}

</style>
