<template lang="pug">
div(:class="$style.lists")
  h2(:class="$style.listsTitle") {{$t('core.aside.my_list')}}
  ul.scroll(:class="$style.listsContent")
    li(:class="$style.listsItem" v-for="item in lists" :key="item.id") {{item.name}}

  transition(enter-active-class="animated-fast fadeIn" leave-active-class="animated-fast fadeOut")
    div(v-show="!list.length" :class="$style.noitem")
      p(v-html="noItem")
  material-flow-btn(:show="isShowEditBtn && assertApiSupport(source)" :remove-btn="false" @btn-click="handleFlowBtnClick")
</template>

<script>
import { mapGetters } from 'vuex'
import { scrollTo, clipboardWriteText, assertApiSupport } from '../../utils'
export default {
  name: 'MaterialSongList',
  model: {
    prop: 'selectdData',
    event: 'input',
  },
  props: {
    list: {
      type: Array,
      default() {
        return []
      },
    },
    page: {
      type: Number,
      required: true,
    },
    limit: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    selectdData: {
      type: Array,
      required: true,
    },
    source: {
      type: String,
    },
    noItem: {
      type: String,
      default: '列表加载中...',
    },
  },
  computed: {
    ...mapGetters(['setting']),
  },
  watch: {
    selectdList(n) {
      const len = n.length
      if (len) {
        this.isShowEditBtn = true
      } else {
        this.isShowEditBtn = false
      }
    },
    selectdData(n) {
      const len = n.length
      if (len) {
        this.isShowEditBtn = true
        this.selectdList = [...n]
      } else {
        this.isShowEditBtn = false
        this.removeAllSelect()
      }
    },
    list(n) {
      this.removeAllSelect()
      if (!this.list.length) return
      this.$nextTick(() => scrollTo(this.$refs.dom_scrollContent, 0))
    },
  },
  data() {
    return {
      clickTime: 0,
      clickIndex: -1,
      isShowEditBtn: false,
      selectdList: [],
      keyEvent: {
        isShiftDown: false,
        isModDown: false,
        isADown: false,
        aDownTimeout: null,
      },
      lastSelectIndex: 0,
    }
  },
  created() {
    this.listenEvent()
  },
  beforeDestroy() {
    this.unlistenEvent()
  },
  methods: {
    listenEvent() {
      window.eventHub.$on('key_shift_down', this.handle_key_shift_down)
      window.eventHub.$on('key_shift_up', this.handle_key_shift_up)
      window.eventHub.$on('key_mod_down', this.handle_key_mod_down)
      window.eventHub.$on('key_mod_up', this.handle_key_mod_up)
      window.eventHub.$on('key_mod+a_down', this.handle_key_mod_a_down)
      window.eventHub.$on('key_mod+a_up', this.handle_key_mod_a_up)
    },
    unlistenEvent() {
      window.eventHub.$off('key_shift_down', this.handle_key_shift_down)
      window.eventHub.$off('key_shift_up', this.handle_key_shift_up)
      window.eventHub.$off('key_mod_down', this.handle_key_mod_down)
      window.eventHub.$off('key_mod_up', this.handle_key_mod_up)
      window.eventHub.$off('key_mod+a_down', this.handle_key_mod_a_down)
      window.eventHub.$off('key_mod+a_up', this.handle_key_mod_a_up)
    },
    handle_key_shift_down() {
      if (!this.keyEvent.isShiftDown) this.keyEvent.isShiftDown = true
    },
    handle_key_shift_up() {
      if (this.keyEvent.isShiftDown) this.keyEvent.isShiftDown = false
    },
    handle_key_mod_down() {
      if (!this.keyEvent.isModDown) this.keyEvent.isModDown = true
    },
    handle_key_mod_up() {
      if (this.keyEvent.isModDown) this.keyEvent.isModDown = false
    },
    handle_key_mod_a_down() {
      if (!this.keyEvent.isADown) {
        this.keyEvent.isModDown = false
        this.keyEvent.isADown = true
        this.handleSelectAllData()
        if (this.keyEvent.aDownTimeout) clearTimeout(this.keyEvent.aDownTimeout)
        this.keyEvent.aDownTimeout = setTimeout(() => {
          this.keyEvent.aDownTimeout = null
          this.keyEvent.isADown = false
        }, 500)
      }
    },
    handle_key_mod_a_up() {
      if (this.keyEvent.isADown) {
        if (this.keyEvent.aDownTimeout) {
          clearTimeout(this.keyEvent.aDownTimeout)
          this.keyEvent.aDownTimeout = null
        }
        this.keyEvent.isADown = false
      }
    },
    handleDoubleClick(event, index) {
      if (event.target.classList.contains('select')) return

      this.handleSelectData(event, index)

      if (
        window.performance.now() - this.clickTime > 400 ||
        this.clickIndex !== index
      ) {
        this.clickTime = window.performance.now()
        this.clickIndex = index
        return
      }
      this.emitEvent(this.assertApiSupport(this.source) ? 'testPlay' : 'search', index)
      this.clickTime = 0
      this.clickIndex = -1
    },
    handleSelectData(event, clickIndex) {
      if (this.keyEvent.isShiftDown) {
        if (this.selectdList.length) {
          let lastSelectIndex = this.lastSelectIndex
          this.removeAllSelect()
          if (lastSelectIndex != clickIndex) {
            let isNeedReverse = false
            if (clickIndex < lastSelectIndex) {
              let temp = lastSelectIndex
              lastSelectIndex = clickIndex
              clickIndex = temp
              isNeedReverse = true
            }
            this.selectdList = this.list.slice(lastSelectIndex, clickIndex + 1)
            if (isNeedReverse) this.selectdList.reverse()
            let nodes = this.$refs.dom_tbody.childNodes
            do {
              nodes[lastSelectIndex].classList.add('active')
              lastSelectIndex++
            } while (lastSelectIndex <= clickIndex)
          }
        } else {
          event.currentTarget.classList.add('active')
          this.selectdList.push(this.list[clickIndex])
          this.lastSelectIndex = clickIndex
        }
      } else if (this.keyEvent.isModDown) {
        this.lastSelectIndex = clickIndex
        let item = this.list[clickIndex]
        let index = this.selectdList.indexOf(item)
        if (index < 0) {
          this.selectdList.push(item)
          event.currentTarget.classList.add('active')
        } else {
          this.selectdList.splice(index, 1)
          event.currentTarget.classList.remove('active')
        }
      } else if (this.selectdList.length) {
        this.removeAllSelect()
      } else return
      this.$emit('input', [...this.selectdList])
    },
    removeAllSelect() {
      this.selectdList = []
      let dom_tbody = this.$refs.dom_tbody
      if (!dom_tbody) return
      let nodes = dom_tbody.querySelectorAll('.active')
      for (const node of nodes) {
        if (node.parentNode == dom_tbody) node.classList.remove('active')
      }
    },
    handleListBtnClick(info) {
      this.emitEvent('listBtnClick', info)
    },
    handleSelectAllData() {
      this.removeAllSelect()
      this.selectdList = [...this.list]
      let nodes = this.$refs.dom_tbody.childNodes
      for (const node of nodes) {
        node.classList.add('active')
      }
      this.$emit('input', [...this.selectdList])
    },
    handleTogglePage(page) {
      this.emitEvent('togglePage', page)
    },
    handleFlowBtnClick(action) {
      this.emitEvent('flowBtnClick', action)
    },
    emitEvent(action, data) {
      this.$emit('action', { action, data })
    },
    handleChangeSelect() {
      this.$emit('input', [...this.selectdList])
    },
    handleContextMenu(event) {
      if (!event.target.classList.contains('select')) return
      let classList = this.$refs.dom_scrollContent.classList
      classList.add(this.$style.copying)
      window.requestAnimationFrame(() => {
        let str = window.getSelection().toString()
        classList.remove(this.$style.copying)
        str = str.trim()
        if (!str.length) return
        clipboardWriteText(str)
      })
    },
    assertApiSupport(source) {
      return assertApiSupport(source)
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';
.lists {
  flex: none;
  width: 15%;
  display: flex;
  flex-flow: column nowrap;
}
.title {
  font-size: 12px;
  line-height: 28px;
  padding: 5px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  flex: none;
}
.list {
  flex: auto;
  min-width: 0;
}
.item {

}
.noitem {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;

  p {
    font-size: 24px;
    color: @color-theme_2-font-label;
  }
}

each(@themes, {
  :global(#container.@{value}) {
    .tbody {
      td {
        &:first-child {
          color: ~'@{color-@{value}-theme_2-font-label}';
        }
      }
    }
    .noitem {
      p {
        color: ~'@{color-@{value}-theme_2-font-label}';
      }
    }
  }
})
</style>
