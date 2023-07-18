<template>
  <teleport to="#view">
    <div v-show="isShow" ref="dom_container" :class="$style.container">
      <transition enter-active-class="animated-fast zoomIn" leave-active-class="animated zoomOut" @after-leave="handleAnimated">
        <div v-show="visible" :class="$style.search">
          <div :class="$style.form">
            <input
              ref="dom_input" v-model.trim="text" class="ignore-esc" :placeholder="placeholder" @input="handleDelaySearch"
              @keydown.arrow-down.arrow-up.prevent @keyup.arrow-down.prevent.exact="handleKeyDown" @keyup.arrow-up.prevent.exact="handleKeyUp"
              @keyup.enter="handleTemplistClick(selectIndex)"
              @keyup.escape.prevent.exact="handleKeyEsc" @keydown.control.prevent="handle_key_mod_down" @keydown.meta.prevent="handle_key_mod_down"
              @keyup.control.prevent="handle_key_mod_up" @keyup.meta.prevent="handle_key_mod_up" @contextmenu="handleContextMenu"
            >
            <button type="button" @click="handleHide">
              <slot>
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="70%" viewBox="0 0 212.982 212.982" space="preserve">
                  <use xlink:href="#icon-delete" />
                </svg>
              </slot>
            </button>
          </div>
          <div v-if="resultList" ref="dom_scrollContainer" class="scroll" :class="$style.list" :style="listStyle">
            <ul ref="dom_list">
              <li v-for="(item, index) in resultList" :key="item.songmid" :class="selectIndex === index ? $style.select : null" @mouseenter="selectIndex = index" @click="handleTemplistClick(index)">
                <div :class="$style.img" />
                <div :class="$style.text">
                  <h3 :class="$style.text">{{ item.name }} - {{ item.singer }}</h3>
                  <h3 v-if="item.meta.albumName" :class="[$style.text, $style.albumName]">{{ item.meta.albumName }}</h3>
                </div>
                <div :class="$style.source">{{ item.source }}</div>
              </li>
            </ul>
          </div>
        </div>
      </transition>
    </div>
  </teleport>
</template>

<script>
import { debounce } from '@common/utils'
import { clipboardReadText } from '@common/utils/electron'
import { toRaw } from '@common/utils/vueTools'

export default {
  props: {
    placeholder: {
      type: String,
      default: 'Find for something...',
    },
    list: {
      type: Array,
      default() {
        return []
      },
    },
    visible: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['action'],
  data() {
    return {
      text: '',
      selectIndex: -1,
      listStyle: {
        height: 0,
        maxHeight: 0,
        overflow: 'hidden',
      },
      maxHeight: 0,
      resultList: [],
      isModDown: false,
      isShow: false,
    }
  },
  watch: {
    resultList(n) {
      if (this.selectIndex > -1) this.selectIndex = -1
      this.$nextTick(() => {
        const height = this.$refs.dom_list.scrollHeight
        if (height > this.maxHeight) {
          this.listStyle.height = this.maxHeight + 'px'
          this.listStyle.overflow = 'auto'
        } else {
          this.listStyle.height = height + 'px'
          this.listStyle.overflow = 'hidden'
        }
      })
    },
    list(n) {
      if (!this.visible) return
      this.handleDelaySearch()
    },
    visible(n) {
      if (!n) return
      this.isShow = true
      this.init()
    },
  },
  created() {
    this.handleDelaySearch = debounce(() => {
      this.handleSearch()
    })
    if (this.visible) this.isShow = true
  },
  mounted() {
    this.init()
    // window.key_event.on('key_mod_down', this.handle_key_mod_down)
    // window.key_event.on('key_mod_up', this.handle_key_mod_up)
    window.key_event.on('key_mod+f_down', this.handle_key_mod_f_down)
  },
  beforeUnmount() {
    // window.key_event.off('key_mod_down', this.handle_key_mod_down)
    // window.key_event.off('key_mod_up', this.handle_key_mod_up)
    window.key_event.off('key_mod+f_down', this.handle_key_mod_f_down)
  },
  methods: {
    init() {
      if (!this.visible) return
      this.handleSearch()
      this.$nextTick(() => {
        if (!this.listStyle.maxHeight) {
          this.maxHeight = this.$refs.dom_container.offsetParent.clientHeight - this.$refs.dom_list.offsetTop - 70
          this.listStyle.maxHeight = this.maxHeight + 'px'
        }
        this.$refs.dom_input.focus()
      })
    },
    handleKeyEsc() {
      if (this.text.length > 0) {
        this.text = ''
        this.resultList = []
      } else {
        this.handleHide()
      }
    },
    handle_key_mod_down() {
      console.log('handle_key_mod_down')
      this.isModDown ||= true
    },
    handle_key_mod_up() {
      this.isModDown &&= false
    },
    handle_key_mod_f_down() {
      if (this.visible) this.$refs.dom_input.focus()
    },
    handleAnimated() {
      if (this.visible) return
      this.isShow = false
    },
    handleTemplistClick(index) {
      if (index < 0) return
      const id = this.resultList[index].id
      this.sendEvent('listClick', {
        index: this.list.findIndex(m => m.id == id),
        isPlay: this.isModDown,
      })
    },
    handleHide() {
      this.sendEvent('hide')
    },
    sendEvent(action, data) {
      this.$emit('action', {
        action,
        data,
      })
    },
    handleKeyDown() {
      if (this.resultList.length) {
        this.selectIndex = this.selectIndex + 1 < this.resultList.length ? this.selectIndex + 1 : 0
        this.handleScrollList()
      } else if (this.selectIndex > -1) {
        this.selectIndex = -1
      }
    },
    handleKeyUp() {
      if (this.resultList.length) {
        this.selectIndex = this.selectIndex - 1 < -1 ? this.resultList.length - 1 : this.selectIndex - 1
        this.handleScrollList()
      } else if (this.selectIndex > -1) {
        this.selectIndex = -1
      }
    },
    handleScrollList() {
      if (this.selectIndex < 0) return
      let dom = this.$refs.dom_list.children[this.selectIndex]
      let offsetTop = dom.offsetTop
      let scrollTop = this.$refs.dom_scrollContainer.scrollTop
      let top
      if (offsetTop < scrollTop) {
        top = offsetTop
      } else if (offsetTop + dom.clientHeight > this.$refs.dom_scrollContainer.clientHeight + scrollTop) {
        top = offsetTop + dom.clientHeight - this.$refs.dom_scrollContainer.clientHeight
      } else return
      this.$refs.dom_scrollContainer.scrollTo(0, top)
    },
    handleContextMenu() {
      let str = clipboardReadText()
      str = str.trim()
      str = str.replace(/\t|\r\n|\n|\r/g, ' ')
      str = str.replace(/\s+/g, ' ')
      let dom_input = this.$refs.dom_input
      const text = dom_input.value
      // if (dom_input.selectionStart == dom_input.selectionEnd) {
      const value = text.substring(0, dom_input.selectionStart) + str + text.substring(dom_input.selectionEnd, text.length)
      // event.target.value = value
      this.text = value
      // } else {
      //   clipboardWriteText(text.substring(dom_input.selectionStart, dom_input.selectionEnd))
      // }
    },
    async handleSearch() {
      if (!this.text.length) return this.resultList = []
      this.resultList = await window.lx.worker.main.searchListMusic(toRaw(this.list), this.text)
    },
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.container {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 20px;
  width: 45%;
  height: @height-toolbar * 0.52;
  z-index: 99;
}

.search {
  position: absolute;
  width: 100%;
  border-radius: 4px;
  transition: box-shadow .4s ease, background-color @transition-normal;
  display: flex;
  flex-flow: column nowrap;
  background-color: var(--color-primary-light-600-alpha-100);
  box-shadow: 0 1px 2px rgba(0,0,0,0.07),
                0 2px 4px rgba(0,0,0,0.07),
                0 4px 8px rgba(0,0,0,0.07),
                0 8px 16px rgba(0,0,0,0.07),
                0 16px 32px rgba(0,0,0,0.07),
                0 32px 64px rgba(0,0,0,0.07);

  &.active {
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
      border-top-left-radius: 4px;
      border-bottom-left-radius: 4px;
      background-color: transparent;
      // border-bottom: 2px solid var(--color-primary);
      // border-color: var(--color-primary);
      border: none;

      outline: none;
      // height: @height-toolbar * .7;
      padding: 0 5px;
      overflow: hidden;
      font-size: 13.5px;
      line-height: @height-toolbar * 0.52 + 5px;
      &::placeholder {
        color: var(--color-button-font);
        font-size: .98em;
      }
    }
    button {
      flex: none;
      border: none;
      // background-color: @color-search-form-background;
      background-color: transparent;
      outline: none;
      border-top-right-radius: 4px;
      border-bottom-right-radius: 4px;
      cursor: pointer;
      height: 100%;
      padding: 6px 9px;
      color: var(--color-button-font);
      transition: background-color .2s ease;
      opacity: 0.8;

      &:hover {
        background-color: var(--color-button-background-hover);
      }
      &:active {
        background-color: var(--color-button-background-active);
      }
    }
  }
  .list {
    // background-color: @color-search-form-background;
    font-size: 13px;
    transition: .3s ease;
    height: 0;
    transition-property: height;
    position: relative;
    scroll-behavior: smooth;

    li {
      position: relative;
      cursor: pointer;
      padding: 8px 5px;
      transition: background-color .2s ease;
      line-height: 1.3;
      // overflow: hidden;
      display: flex;
      flex-flow: row nowrap;

      &.select {
        background-color: var(--color-primary-dark-100-alpha-700);
      }
      border-radius: 4px;
      // &:last-child {
      //   border-bottom-left-radius: 4px;
      //   border-bottom-right-radius: 4px;
      // }
    }
  }
}

.img {
  flex: none;
}
.text {
  flex: auto;
  .mixin-ellipsis-1;
}
.albumName {
  font-size: 12px;
  opacity: 0.6;
  .mixin-ellipsis-1;
}
.source {
  flex: none;
  font-size: 12px;
  opacity: 0.5;
  padding: 0 5px;
  display: flex;
  align-items: center;
  // transform: rotate(45deg);
  // background-color:
}

</style>
