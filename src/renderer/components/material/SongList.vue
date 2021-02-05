<template lang="pug">
div(:class="$style.songList")
  transition(enter-active-class="animated-fast fadeIn" leave-active-class="animated-fast fadeOut")
    div(:class="$style.list")
      div(:class="$style.thead")
        table
          thead
            tr
              th.nobreak.center(:style="{ width: rowWidth.r1 }") #
              th.nobreak(:style="{ width: rowWidth.r2 }") {{$t('material.song_list.name')}}
              th.nobreak(:style="{ width: rowWidth.r3 }") {{$t('material.song_list.singer')}}
              th.nobreak(:style="{ width: rowWidth.r4 }") {{$t('material.song_list.album')}}
              th.nobreak(:style="{ width: rowWidth.r5 }") {{$t('material.song_list.time')}}
              th.nobreak(:style="{ width: rowWidth.r6 }") {{$t('material.song_list.action')}}
      div(:class="$style.content")
        div.scroll(v-show="list.length" :class="$style.tbody" ref="dom_scrollContent")
          table
            tbody(@contextmenu.capture="handleContextMenu" ref="dom_tbody")
              tr(v-for='(item, index) in list' :key='item.songmid' @contextmenu="handleListItemRigthClick($event, index)" @click="handleDoubleClick($event, index)")
                td.nobreak.center(:style="{ width: rowWidth.r1 }" style="padding-left: 3px; padding-right: 3px;" :class="$style.noSelect" @click.stop) {{index + 1}}
                td.break(:style="{ width: rowWidth.r2 }")
                  span.select {{item.name}}
                  span.badge.badge-theme-success(:class="[$style.labelQuality, $style.noSelect]" v-if="item._types.ape || item._types.flac || item._types.wav") {{$t('material.song_list.lossless')}}
                  span.badge.badge-theme-info(:class="[$style.labelQuality, $style.noSelect]" v-else-if="item._types['320k']") {{$t('material.song_list.high_quality')}}
                td.break(:style="{ width: rowWidth.r3 }")
                  span.select {{item.singer}}
                td.break(:style="{ width: rowWidth.r4 }")
                  span.select {{item.albumName}}
                td(:style="{ width: rowWidth.r5 }")
                  span(:class="[$style.time, $style.noSelect]") {{item.interval || '--/--'}}
                td(:style="{ width: rowWidth.r6 }" style="padding-left: 0; padding-right: 0;")
                  material-list-buttons(:index="index" :class="$style.btns"
                    :remove-btn="false" @btn-click="handleListBtnClick"
                    :download-btn="assertApiSupport(item.source)")
                  //- button.btn-info(type='button' v-if="item._types['128k'] || item._types['192k'] || item._types['320k'] || item._types.flac" @click.stop='openDownloadModal(index)') 下载
                  //- button.btn-secondary(type='button' v-if="item._types['128k'] || item._types['192k'] || item._types['320k']" @click.stop='testPlay(index)') 试听
                  //- button.btn-success(type='button' v-if="(item._types['128k'] || item._types['192k'] || item._types['320k']) && userInfo" @click.stop='showListModal(index)') ＋
          div(:class="$style.pagination")
            material-pagination(:count="total" :limit="limit" :page="page" @btn-click="handleTogglePage")
        transition(enter-active-class="animated-fast fadeIn" leave-active-class="animated-fast fadeOut")
          div(v-show="!list.length" :class="$style.noitem")
            p(v-html="noItem")
  //- material-flow-btn(:show="isShowEditBtn && assertApiSupport(source)" :remove-btn="false" @btn-click="handleFlowBtnClick")
  material-menu(:menus="listItemMenu" :location="listMenu.menuLocation" item-name="name" :isShow="listMenu.isShowItemMenu" @menu-click="handleListItemMenuClick")
</template>

<script>
import { mapGetters } from 'vuex'
import { scrollTo, clipboardWriteText, assertApiSupport } from '../../utils'
import musicSdk from '../../utils/music'
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
    rowWidth: {
      type: Object,
      default() {
        return {
          r1: '5%',
          r2: 'auto',
          r3: '22%',
          r4: '22%',
          r5: '8%',
          r6: '13%',
        }
      },
    },
  },
  computed: {
    ...mapGetters(['setting']),
    listItemMenu() {
      return [
        {
          name: this.$t('material.song_list.list_play'),
          action: 'play',
          disabled: !this.listMenu.itemMenuControl.play,
        },
        {
          name: this.$t('material.song_list.list_download'),
          action: 'download',
          disabled: !this.listMenu.itemMenuControl.download,
        },
        {
          name: this.$t('material.song_list.list_play_later'),
          action: 'playLater',
          disabled: !this.listMenu.itemMenuControl.playLater,
        },
        {
          name: this.$t('material.song_list.list_search'),
          action: 'search',
          disabled: !this.listMenu.itemMenuControl.search,
        },
        {
          name: this.$t('material.song_list.list_add_to'),
          action: 'addTo',
          disabled: !this.listMenu.itemMenuControl.addTo,
        },
        {
          name: this.$t('material.song_list.list_source_detail'),
          action: 'sourceDetail',
          disabled: !this.listMenu.itemMenuControl.sourceDetail,
        },
      ]
    },
  },
  watch: {
    // selectdList(n) {
    //   const len = n.length
    //   if (len) {
    //     this.isShowEditBtn = true
    //   } else {
    //     this.isShowEditBtn = false
    //   }
    // },
    selectdData(n) {
      const len = n.length
      if (len) {
        // this.isShowEditBtn = true
        this.selectdList = [...n]
      } else {
        // this.isShowEditBtn = false
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
      },
      lastSelectIndex: 0,
      listMenu: {
        isShowItemMenu: false,
        itemMenuControl: {
          play: true,
          addTo: true,
          playLater: true,
          download: true,
          search: true,
          sourceDetail: true,
        },
        menuLocation: {
          x: 0,
          y: 0,
        },
      },
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
    },
    unlistenEvent() {
      window.eventHub.$off('key_shift_down', this.handle_key_shift_down)
      window.eventHub.$off('key_shift_up', this.handle_key_shift_up)
      window.eventHub.$off('key_mod_down', this.handle_key_mod_down)
      window.eventHub.$off('key_mod_up', this.handle_key_mod_up)
      window.eventHub.$off('key_mod+a_down', this.handle_key_mod_a_down)
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
    handle_key_mod_a_down({ event }) {
      if (event.target.tagName == 'INPUT') return
      event.preventDefault()
      if (event.repeat) return
      this.keyEvent.isModDown = false
      this.handleSelectAllData()
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
      this.emitEvent('testPlay', index)
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
    // handleFlowBtnClick(action) {
    //   this.emitEvent('flowBtnClick', action)
    // },
    emitEvent(action, data) {
      this.$emit('action', { action, data })
    },
    handleChangeSelect() {
      this.$emit('input', [...this.selectdList])
    },
    handleContextMenu(event) {
      if (!event.target.classList.contains('select')) return
      event.stopImmediatePropagation()
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
    handleListItemRigthClick(event, index) {
      this.listMenu.itemMenuControl.sourceDetail = !!musicSdk[this.list[index].source].getMusicDetailPageUrl
      // this.listMenu.itemMenuControl.play =
      //   this.listMenu.itemMenuControl.playLater =
      this.listMenu.itemMenuControl.download =
        this.assertApiSupport(this.list[index].source)
      let dom_selected = this.$refs.dom_tbody.querySelector('tr.selected')
      if (dom_selected) dom_selected.classList.remove('selected')
      this.$refs.dom_tbody.querySelectorAll('tr')[index].classList.add('selected')
      let dom_td = event.target.closest('td')
      this.listMenu.rightClickItemIndex = index
      this.listMenu.menuLocation.x = dom_td.offsetLeft + event.offsetX
      this.listMenu.menuLocation.y = dom_td.offsetParent.offsetTop + dom_td.offsetTop + event.offsetY - this.$refs.dom_scrollContent.scrollTop
      this.$nextTick(() => {
        this.listMenu.isShowItemMenu = true
      })
    },
    hideListMenu() {
      let dom_selected = this.$refs.dom_tbody && this.$refs.dom_tbody.querySelector('tr.selected')
      if (dom_selected) dom_selected.classList.remove('selected')
      this.listMenu.isShowItemMenu = false
      this.listMenu.rightClickItemIndex = -1
    },
    handleListItemMenuClick(action) {
      // console.log(action)
      let index = this.listMenu.rightClickItemIndex
      this.hideListMenu()
      if (!action) return

      this.emitEvent('menuClick', { action: action.action, index })
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';
.song-list {
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  position: relative;
}

.list {
  position: relative;
  font-size: 14px;
  overflow: hidden;
  display: flex;
  flex-flow: column nowrap;
  height: 100%;
}
.thead {
  flex: none;
  tr > th:first-child {
    color: @color-theme_2-font-label;
    // padding-left: 10px;
  }
}
.content {
  flex: auto;
  min-height: 0;
  position: relative;
}
.tbody {
  height: 100%;
  overflow-y: auto;
  td {
    font-size: 12px;
    :global(.badge) {
      margin-left: 3px;
    }
    &:first-child {
      // padding-left: 10px;
      font-size: 11px;
      color: @color-theme_2-font-label;
    }
  }
  :global(.badge) {
    opacity: .85;
  }

  &.copying {
    .no-select {
      display: none;
    }
  }
}
.pagination {
  text-align: center;
  padding: 15px 0;
  // left: 50%;
  // transform: translateX(-50%);
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
