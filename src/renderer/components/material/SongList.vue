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
        div(v-if="list.length" :class="$style.content" ref="dom_listContent")
          material-virtualized-list(:list="list" key-name="songmid" ref="list" :item-height="listItemHeight"
            containerClass="scroll" contentClass="list" @contextmenu.native.capture="handleContextMenu")
            template(#default="{ item, index }")
              div.list-item(@click="handleDoubleClick($event, index)" @contextmenu="handleListItemRigthClick($event, index)"
                :class="[{ selected: selectedIndex == index }, { active: selectdList.includes(item) }]")
                div.list-item-cell.nobreak.center(:style="{ width: rowWidth.r1 }" style="padding-left: 3px; padding-right: 3px;" :class="$style.noSelect" @click.stop) {{index + 1}}
                div.list-item-cell.auto(:style="{ width: rowWidth.r2 }" :tips="item.name + ((item._types.ape || item._types.flac || item._types.wav) ? ` - ${$t('material.song_list.lossless')}` : item._types['320k'] ? ` - ${$t('material.song_list.high_quality')}` : '')")
                  span.select {{item.name}}
                  span.badge.badge-theme-success(:class="[$style.labelQuality, $style.noSelect]" v-if="item._types.ape || item._types.flac || item._types.wav") {{$t('material.song_list.lossless')}}
                  span.badge.badge-theme-info(:class="[$style.labelQuality, $style.noSelect]" v-else-if="item._types['320k']") {{$t('material.song_list.high_quality')}}
                div.list-item-cell(:style="{ width: rowWidth.r3 }" :tips="item.singer")
                  span.select {{item.singer}}
                div.list-item-cell(:style="{ width: rowWidth.r4 }" :tips="item.albumName")
                  span.select {{item.albumName}}
                div.list-item-cell(:style="{ width: rowWidth.r5 }")
                  span(:class="[$style.time, $style.noSelect]") {{item.interval || '--/--'}}
                div.list-item-cell(:style="{ width: rowWidth.r6 }" style="padding-left: 0; padding-right: 0;")
                  material-list-buttons(:index="index" :class="$style.btns"
                      :remove-btn="false" @btn-click="handleListBtnClick"
                      :download-btn="assertApiSupport(item.source)")
            template(#footer)
              div(:class="$style.pagination")
                material-pagination(:count="total" :limit="limit" :page="page" @btn-click="handleTogglePage")
        //- div.scroll(v-show="list.length" :class="$style.tbody" ref="dom_scrollContent")
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
import { clipboardWriteText, assertApiSupport } from '../../utils'
import musicSdk from '../../utils/music'
import { windowSizeList } from '@common/config'
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
    hideListsMenu: {
      type: Function,
      default: () => {},
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
    listItemHeight() {
      return parseInt(windowSizeList.find(item => item.id == this.setting.windowSizeId).fontSize) / 16 * 37
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
      this.$nextTick(() => this.$refs.list.scrollTo(0))
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
      selectedIndex: -1,
      listMenu: {
        rightClickItemIndex: -1,
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
      if (this.listMenu.rightClickItemIndex > -1) return

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
          }
        } else {
          this.selectdList.push(this.list[clickIndex])
          this.lastSelectIndex = clickIndex
        }
      } else if (this.keyEvent.isModDown) {
        this.lastSelectIndex = clickIndex
        let item = this.list[clickIndex]
        let index = this.selectdList.indexOf(item)
        if (index < 0) {
          this.selectdList.push(item)
        } else {
          this.selectdList.splice(index, 1)
        }
      } else if (this.selectdList.length) {
        this.removeAllSelect()
      } else return
      this.$emit('input', [...this.selectdList])
    },
    removeAllSelect() {
      this.selectdList = []
    },
    handleListBtnClick(info) {
      this.emitEvent('listBtnClick', info)
    },
    handleSelectAllData() {
      this.removeAllSelect()
      this.selectdList = [...this.list]
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
      let classList = this.$refs.dom_listContent.classList
      classList.add(this.$style.copying)
      window.requestAnimationFrame(() => {
        let str = window.getSelection().toString()
        classList.remove(this.$style.copying)
        str = str.split(/\n\n/).map(s => s.replace(/\n/g, '  ')).join('\n').trim()
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
      this.listMenu.itemMenuControl.download = this.assertApiSupport(this.list[index].source)
      let dom_container = event.target.closest('.' + this.$style.songList)
      const getOffsetValue = (target, x = 0, y = 0) => {
        if (target === dom_container) return { x, y }
        if (!target) return { x: 0, y: 0 }
        x += target.offsetLeft
        y += target.offsetTop
        return getOffsetValue(target.offsetParent, x, y)
      }
      this.listMenu.rightClickItemIndex = index
      this.selectedIndex = index
      let { x, y } = getOffsetValue(event.target)
      this.listMenu.menuLocation.x = x + event.offsetX
      this.listMenu.menuLocation.y = y + event.offsetY - this.$refs.list.getScrollTop()
      this.hideListsMenu()
      this.$nextTick(() => {
        this.listMenu.isShowItemMenu = true
      })
    },
    hideListMenu() {
      this.selectedIndex = -1
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
  height: 100%;

  &.copying {
    .no-select {
      display: none;
    }
  }
}
:global(.list) {
  height: 100%;
  overflow-y: auto;
  :global(.list-item-cell) {
    font-size: 12px !important;
    :global(.badge) {
      margin-left: 3px;
    }
    &:first-child {
      // padding-left: 10px;
      font-size: 11px !important;
      color: @color-theme_2-font-label !important;
    }
  }
  :global(.badge) {
    opacity: .85;
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
    :global(.list) {
      :global(.list-item-cell) {
        &:first-child {
          color: ~'@{color-@{value}-theme_2-font-label}' !important;
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
