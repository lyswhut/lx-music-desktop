<template lang="pug">
teleport(to="#view")
  div(:class="$style.container" ref="dom_container" v-show="isShow")
    transition(enter-active-class="animated-fast zoomIn" leave-active-class="animated zoomOut" @after-leave="handleAnimated")
      div(:class="$style.search" v-show="visible")
        div(:class="$style.form")
          input.ignore-esc(:placeholder="placeholder" v-model.trim="text" ref="dom_input"
                @input="handleDelaySearch"
                @keyup.enter="handleTemplistClick(selectIndex)"
                @keyup.arrow-down.prevent="handleKeyDown"
                @keyup.arrow-up.prevent="handleKeyUp"
                @keyup.escape.prevent="handleKeyEsc"
                @contextmenu="handleContextMenu")
          button(type="button" @click="handleHide")
            slot
              svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 212.982 212.982' space='preserve')
                use(xlink:href='#icon-delete')
        div.scroll(v-if="resultList" :class="$style.list" :style="listStyle" ref="dom_scrollContainer")
          ul(ref="dom_list")
            li(v-for="(item, index) in resultList" :key="item.songmid" :class="selectIndex === index ? $style.select : null" @mouseenter="selectIndex = index" @click="handleTemplistClick(index)")
              div(:class="$style.img")
              div(:class="$style.text")
                h3(:class="$style.text") {{item.name}} - {{item.singer}}
                h3(v-if="item.albumName" :class="[$style.text, $style.albumName]") {{item.albumName}}
              div(:class="$style.source") {{item.source}}
</template>

<script>
import { clipboardReadText, debounce } from '@renderer/utils'


// https://blog.csdn.net/xcxy2015/article/details/77164126#comments
const similar = (a, b) => {
  if (!a || !b) return 0
  if (a.length > b.length) { // 保证 a <= b
    let t = b
    b = a
    a = t
  }
  let al = a.length
  let bl = b.length
  let mp = [] // 一个表
  let i, j, ai, lt, tmp // ai：字符串a的第i个字符。 lt：左上角的值。 tmp：暂存新的值。
  for (i = 0; i <= bl; i++) mp[i] = i
  for (i = 1; i <= al; i++) {
    ai = a.charAt(i - 1)
    lt = mp[0]
    mp[0] = mp[0] + 1
    for (j = 1; j <= bl; j++) {
      tmp = Math.min(mp[j] + 1, mp[j - 1] + 1, lt + (ai == b.charAt(j - 1) ? 0 : 1))
      lt = mp[j]
      mp[j] = tmp
    }
  }
  return 1 - (mp[bl] / bl)
}

const sortInsert = (arr, data) => {
  let key = data.num
  let left = 0
  let right = arr.length - 1

  while (left <= right) {
    let middle = parseInt((left + right) / 2)
    if (key == arr[middle]) {
      left = middle
      break
    } else if (key < arr[middle].num) {
      right = middle - 1
    } else {
      left = middle + 1
    }
  }
  while (left > 0) {
    if (arr[left - 1].num != key) break
    left--
  }

  arr.splice(left, 0, data)
}

const handleSortList = (list, keyword) => {
  let arr = []
  for (const item of list) {
    sortInsert(arr, {
      num: similar(keyword, `${item.name} ${item.singer} ${item.albumName || ''}`),
      data: item,
    })
  }
  return arr.map(item => item.data).reverse()
}

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
        this.listStyle.height = Math.min(this.$refs.dom_list.scrollHeight, this.maxHeight) + 'px'
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
    window.eventHub.on('key_mod_down', this.handle_key_mod_down)
    window.eventHub.on('key_mod_up', this.handle_key_mod_up)
    window.eventHub.on('key_mod+f_down', this.handle_key_mod_f_down)
  },
  beforeUnmount() {
    window.eventHub.off('key_mod_down', this.handle_key_mod_down)
    window.eventHub.off('key_mod_up', this.handle_key_mod_up)
    window.eventHub.off('key_mod+f_down', this.handle_key_mod_f_down)
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
      if (!this.isModDown) this.isModDown = true
    },
    handle_key_mod_up() {
      if (this.isModDown) this.isModDown = false
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
      this.sendEvent('listClick', {
        index: this.list.indexOf(this.resultList[index]),
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
      if (!this.resultList.length) return
      this.selectIndex = this.selectIndex + 1 < this.resultList.length ? this.selectIndex + 1 : 0
      this.handleScrollList()
    },
    handleKeyUp() {
      if (!this.resultList.length) return
      this.selectIndex = this.selectIndex - 1 < -1 ? this.resultList.length - 1 : this.selectIndex - 1
      this.handleScrollList()
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
      str = str.replace(/\t|\r\n|\n|\r/g, ' ')
      str = str.replace(/\s+/g, ' ')
      let dom_input = this.$refs.dom_input
      this.text = `${this.text.substring(0, dom_input.selectionStart)}${str}${this.text.substring(dom_input.selectionEnd, this.text.length)}`
    },
    handleSearch() {
      if (!this.text.length) return this.resultList = []
      let list = []
      let rxp = new RegExp(this.text.split('').map(s => s.replace(/[.*+?^${}()|[\]\\]/, '\\$&')).join('.*') + '.*', 'i')
      for (const item of this.list) {
        if (rxp.test(`${item.name}${item.singer}${item.albumName ? item.albumName : ''}`)) list.push(item)
      }
      this.resultList = handleSortList(list, this.text)
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
  transition: box-shadow .4s ease, background-color @transition-theme;
  display: flex;
  flex-flow: column nowrap;
  background-color: @color-search-form-background;
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
      border-top-right-radius: 4px;
      border-bottom-right-radius: 4px;
      cursor: pointer;
      height: 100%;
      padding: 6px 7px;
      color: @color-btn;
      transition: background-color .2s ease;
      opacity: 0.8;

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
        background-color: @color-search-list-hover;
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


each(@themes, {
  :global(#root.@{value}) {

    .search {
      background-color: ~'@{color-@{value}-search-form-background}';

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
