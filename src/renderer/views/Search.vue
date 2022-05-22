<template lang="pug">
div(:class="$style.search")
  //- transition
  div(:class="$style.header")
    base-tab(:class="$style.tab" :list="sources" align="left" item-key="id" item-name="name" @change="handleSourceChange" v-model="searchSourceId")
  div(:class="$style.main")
    div(:class="$style.list" v-show="isLoading || listInfo.list.length")
      div.thead(:class="$style.thead")
        table
          thead
            tr
              th.nobreak.center(style="width: 5%;") #
              th.nobreak {{$t('music_name')}}
              th.nobreak(style="width: 22%;") {{$t('music_singer')}}
              th.nobreak(style="width: 22%;") {{$t('music_album')}}
              th.nobreak(style="width: 8%;") {{$t('music_time')}}
              th.nobreak(style="width: 13%;") {{$t('action')}}
      div.scroll(:class="$style.tbody" ref="dom_scrollContent")
        table
          tbody(@contextmenu.capture="handleContextMenu" ref="dom_tbody")
            tr(v-for='(item, index) in listInfo.list' :key='item.songmid' @contextmenu="handleListItemRigthClick($event, index)" @click="handleDoubleClick($event, index)")
              td.nobreak.center(style="width: 5%; padding-left: 3px; padding-right: 3px;" :class="$style.noSelect" @click.stop) {{index + 1}}
              td.break
                span.select {{item.name}}
                span.badge.badge-theme-success(:class="[$style.labelQuality, $style.noSelect]" v-if="item._types.flac32bit") {{$t('tag__lossless_24bit')}}
                span.badge.badge-theme-success(:class="[$style.labelQuality, $style.noSelect]" v-else-if="item._types.ape || item._types.flac || item._types.wav") {{$t('tag__lossless')}}
                span.badge.badge-theme-info(:class="[$style.labelQuality, $style.noSelect]" v-else-if="item._types['320k']") {{$t('tag__high_quality')}}
                span(:class="[$style.labelSource, $style.noSelect]" v-if="searchSourceId == 'all'") {{item.source}}
              td.break(style="width: 22%;")
                span.select {{item.singer}}
              td.break(style="width: 22%;")
                span.select {{item.albumName}}
              td(style="width: 8%;")
                span(:class="[$style.time, $style.noSelect]") {{item.interval || '--/--'}}
              td(style="width: 13%; padding-left: 0; padding-right: 0;")
                material-list-buttons(:index="index" :remove-btn="false" :class="$style.listBtn"
                  :play-btn="assertApiSupport(item.source)"
                  :download-btn="assertApiSupport(item.source)"
                  @btn-click="handleListBtnClick")
        div(:class="$style.pagination")
          material-pagination(:max-page="listInfo.allPage" :limit="listInfo.limit" :page="page" @btn-click="handleTogglePage")
    transition(enter-active-class="animated-fast fadeIn" leave-active-class="animated fadeOut")
      div(v-show="isLoading" :class="$style.loading")
        p {{$t('list__loading')}}
    transition(enter-active-class="animated-fast fadeIn" leave-active-class="animated-fast fadeOut")
      div(v-show="!isLoading && !listInfo.list.length" :class="$style.noitem")
        div.scroll(:class="$style.noitemListContainer" v-if="setting.search.isShowHotSearch || (setting.search.isShowHistorySearch && historyList.length)")
          dl(:class="[$style.noitemList, $style.noitemHotSearchList]" v-if="setting.search.isShowHotSearch")
            dt(:class="$style.noitemListTitle") {{$t('search__hot_search')}}
            dd(:class="$style.noitemListItem" @click="handleNoitemSearch(item)" v-for="item in hotSearchList") {{item}}
          dl(:class="$style.noitemList" v-if="setting.search.isShowHistorySearch && historyList.length")
            dt(:class="$style.noitemListTitle")
              span {{$t('history_search')}}
              span(:class="$style.historyClearBtn" @click="clearHistory" :aria-label="$t('history_clear')")
                svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 512 512' space='preserve')
                  use(xlink:href='#icon-eraser')
            dd(:class="$style.noitemListItem" v-for="(item, index) in historyList" @contextmenu="removeHistory(index)" :key="index + item" @click="handleNoitemSearch(item)" :aria-label="$t('history_remove')") {{item}}
        div(v-else :class="$style.noitem_list")
          p {{$t('search__welcome')}}
  //- common-flow-btn(:show="isShowEditBtn && (searchSourceId == 'all' || assertApiSupport(searchSourceId))" :remove-btn="false" @btn-click="handleFlowBtnClick")
  common-download-modal(v-model:show="isShowDownload" :musicInfo="musicInfo" teleport="#view")
  common-download-multiple-modal(v-model:show="isShowDownloadMultiple" :list="selectedData" @confirm="removeAllSelect" teleport="#view")
  common-list-add-modal(v-model:show="isShowListAdd" :musicInfo="musicInfo" teleport="#view")
  common-list-add-multiple-modal(v-model:show="isShowListAddMultiple" :musicList="selectedData" @confirm="removeAllSelect" teleport="#view")
  base-menu(:menus="listItemMenu" :location="listMenu.menuLocation" item-name="name" :isShow="listMenu.isShowItemMenu" @menu-click="handleListItemMenuClick")
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
import { clipboardWriteText, assertApiSupport, openUrl } from '@renderer/utils'
import musicSdk from '@renderer/utils/music'
import { defaultList } from '@renderer/core/share/list'
import { getList } from '@renderer/core/share/utils'

export default {
  name: 'Search',
  data() {
    return {
      page: 0,
      text: '',
      clickTime: 0,
      clickIndex: -1,
      isShowDownload: false,
      musicInfo: null,
      selectedData: [],
      // isShowEditBtn: false,
      isShowDownloadMultiple: false,
      searchSourceId: null,
      isShowListAdd: false,
      isShowListAddMultiple: false,
      keyEvent: {
        isShiftDown: false,
        isModDown: false,
      },
      lastSelectIndex: 0,
      listMenu: {
        isShowItemMenu: false,
        itemMenuControl: {
          play: true,
          playLater: true,
          addTo: true,
          download: true,
          sourceDetail: true,
        },
        menuLocation: {
          x: 0,
          y: 0,
        },
      },
      isLoading: false,
      searchId: null,
    }
  },
  beforeRouteUpdate(to, from) {
    if (to.query.source && (this.sourceList[to.query.source] || to.query.source == 'all')) {
      if (this.setting.search.searchSource != to.query.source) {
        this.setSearchSource({
          searchSource: to.query.source,
        })
      }
      if (this.searchSourceId != to.query.source) {
        this.searchSourceId = to.query.source
      }
      this.$nextTick(() => {
        this.handleGetHotSearch()
      })
    }
    if (to.query.text != null && this.text != to.query.text) {
      this.text = to.query.text
    }

    this.$nextTick(() => {
      this.page = 1
      this.handleSearch(this.text, this.page)
    })
  },
  created() {
    this.listenEvent()
  },
  beforeUnmount() {
    this.unlistenEvent()
  },
  mounted() {
    // console.log('mounted')
    if (this.$route.query.source && (this.sourceList[this.$route.query.source] || this.$route.query.source == 'all')) {
      this.setSearchSource({
        searchSource: this.$route.query.source,
      })
    } else if (!this.sourceList[this.setting.search.searchSource] && this.setting.search.searchSource != 'all') { // 处理搜索源不存在时页面报错的问题
      this.setSearchSource({
        searchSource: 'kw',
      })
    }
    this.searchSourceId = this.setting.search.searchSource
    if (this.$route.query.text == null) {
      this.text = this.$store.getters['search/searchText']
      this.page = this.listInfo.page
    } else if (this.$route.query.text == '') {
      this.clearList()
    } else {
      this.text = this.$route.query.text
      this.page = 1
      this.handleSearch(this.text, this.page)
    }
    this.handleGetHotSearch()
  },
  watch: {
    // selectedData(n) {
    //   const len = n.length
    //   if (len) {
    //     this.isShowEditBtn = true
    //   } else {
    //     this.isShowEditBtn = false
    //   }
    // },
    'listInfo.list'() {
      this.removeAllSelect()
    },
  },
  computed: {
    ...mapGetters(['userInfo', 'setting']),
    ...mapGetters('search', ['sourceList', 'allList', 'sources', 'historyList']),
    listItemMenu() {
      return [
        {
          name: this.$t('list__play'),
          action: 'play',
          disabled: !this.listMenu.itemMenuControl.play,
        },
        {
          name: this.$t('list__download'),
          action: 'download',
          disabled: !this.listMenu.itemMenuControl.download,
        },
        {
          name: this.$t('list__play_later'),
          action: 'playLater',
          disabled: !this.listMenu.itemMenuControl.playLater,
        },
        {
          name: this.$t('list__add_to'),
          action: 'addTo',
          disabled: !this.listMenu.itemMenuControl.addTo,
        },
        {
          name: this.$t('list__source_detail'),
          action: 'sourceDetail',
          disabled: !this.listMenu.itemMenuControl.sourceDetail,
        },
      ]
    },
    listInfo() {
      return this.setting.search.searchSource == 'all' ? this.allList : this.sourceList[this.setting.search.searchSource]
    },
    hotSearchList() {
      return this.$store.getters['hotSearch/list'][this.setting.search.searchSource] || []
    },

  },
  methods: {
    ...mapMutations(['setSearchSource']),
    ...mapActions('search', ['search']),
    ...mapActions('download', ['createDownload', 'createDownloadMultiple']),
    ...mapMutations('search', ['clearList', 'setPage', 'removeHistory', 'clearHistory']),
    ...mapMutations('list', ['listAdd', 'listAddMultiple']),
    ...mapMutations('player', ['setList', 'setTempPlayList']),
    ...mapActions('hotSearch', {
      getHotSearch: 'getList',
    }),
    listenEvent() {
      window.eventHub.on('key_shift_down', this.handle_key_shift_down)
      window.eventHub.on('key_shift_up', this.handle_key_shift_up)
      window.eventHub.on('key_mod_down', this.handle_key_mod_down)
      window.eventHub.on('key_mod_up', this.handle_key_mod_up)
      window.eventHub.on('key_mod+a_down', this.handle_key_mod_a_down)
    },
    unlistenEvent() {
      window.eventHub.off('key_shift_down', this.handle_key_shift_down)
      window.eventHub.off('key_shift_up', this.handle_key_shift_up)
      window.eventHub.off('key_mod_down', this.handle_key_mod_down)
      window.eventHub.off('key_mod_up', this.handle_key_mod_up)
      window.eventHub.off('key_mod+a_down', this.handle_key_mod_a_down)
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
    handleSearch(text, page) {
      const searchId = this.searchId = `${this.searchSourceId}__${page}__${text}`
      if (text === '') {
        this.isLoading = false
        return this.clearList()
      }
      this.isLoading = true
      this.search({ text, page, limit: this.listInfo.limit }).then(data => {
        if (this.searchId != searchId) return
        this.page = page
        this.$nextTick(() => {
          this.$refs.dom_scrollContent.scrollTo(0, 0)
        })
      }).finally(() => {
        if (this.searchId != searchId) return
        this.isLoading = false
      })
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
      if (this.assertApiSupport(this.listInfo.list[index].source)) this.testPlay(index)
      this.clickTime = 0
      this.clickIndex = -1
    },
    handleListBtnClick(info) {
      switch (info.action) {
        case 'download':
          this.musicInfo = this.listInfo.list[info.index]
          this.$nextTick(() => {
            this.isShowDownload = true
          })
          break
        case 'play':
          this.testPlay(info.index)
          break
        case 'listAdd':
          this.musicInfo = this.listInfo.list[info.index]
          this.$nextTick(() => {
            this.isShowListAdd = true
          })
          break
      }
    },
    handleSelectData(event, clickIndex) {
      if (this.keyEvent.isShiftDown) {
        if (this.selectedData.length) {
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
            this.selectedData = this.listInfo.list.slice(lastSelectIndex, clickIndex + 1)
            if (isNeedReverse) this.selectedData.reverse()
            let nodes = Array.from(this.$refs.dom_tbody.childNodes).filter(n => n.nodeType === 1)
            do {
              const node = nodes[lastSelectIndex]
              if (node.tagName == 'TR') {
                node.classList.add('active')
              }
              lastSelectIndex++
            } while (lastSelectIndex <= clickIndex)
          }
        } else {
          event.currentTarget.classList.add('active')
          this.selectedData.push(this.listInfo.list[clickIndex])
          this.lastSelectIndex = clickIndex
        }
      } else if (this.keyEvent.isModDown) {
        this.lastSelectIndex = clickIndex
        let item = this.listInfo.list[clickIndex]
        let index = this.selectedData.indexOf(item)
        if (index < 0) {
          this.selectedData.push(item)
          event.currentTarget.classList.add('active')
        } else {
          this.selectedData.splice(index, 1)
          event.currentTarget.classList.remove('active')
        }
      } else if (this.selectedData.length) this.removeAllSelect()
    },
    removeAllSelect() {
      this.selectedData = []
      let dom_tbody = this.$refs.dom_tbody
      if (!dom_tbody) return
      let nodes = dom_tbody.querySelectorAll('.active')
      for (const node of nodes) {
        if (node.parentNode == dom_tbody) node.classList.remove('active')
      }
    },
    testPlay(index) {
      let targetSong = this.listInfo.list[index]
      // if (!targetSong || !this.assertApiSupport(targetSong.source)) return
      this.listAdd({ id: 'default', musicInfo: targetSong })
      let targetIndex = getList(defaultList.id).findIndex(
        s => s.songmid === targetSong.songmid,
      )
      if (targetIndex > -1) {
        this.setList({
          listId: defaultList.id,
          index: targetIndex,
        })
      }
    },
    handleTogglePage(page) {
      this.handleSearch(this.text, page)
    },
    handleSelectAllData() {
      this.removeAllSelect()
      this.selectedData = [...this.listInfo.list]
      let nodes = this.$refs.dom_tbody.childNodes
      // console.log(nodes)
      for (const node of nodes) {
        if (node.tagName != 'TR') continue
        node.classList.add('active')
      }
    },
    // handleFlowBtnClick(action) {
    //   switch (action) {
    //     case 'download':
    //       this.isShowDownloadMultiple = true
    //       break
    //     case 'play':
    //       this.testPlay()
    //       this.removeAllSelect()
    //       break
    //     case 'add':
    //       this.isShowListAddMultiple = true
    //       break
    //   }
    // },
    filterList(list) {
      return this.searchSourceId == 'all'
        ? list.filter(s => this.assertApiSupport(s.source))
        : this.assertApiSupport(this.searchSourceId)
          ? [...list]
          : []
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
    handleGetHotSearch() {
      if (this.hotSearchList.length || !this.setting.search.isShowHotSearch) return
      this.getHotSearch(this.setting.search.searchSource)
    },
    handleNoitemSearch(text) {
      this.$router.replace({
        path: 'search',
        query: {
          text,
        },
      })
    },
    assertApiSupport(source) {
      return assertApiSupport(source)
    },
    handleListItemRigthClick(event, index) {
      this.listMenu.itemMenuControl.sourceDetail = !!musicSdk[this.listInfo.list[index].source].getMusicDetailPageUrl
      this.listMenu.itemMenuControl.play =
        this.listMenu.itemMenuControl.playLater =
        this.listMenu.itemMenuControl.download =
        this.assertApiSupport(this.listInfo.list[index].source)
      let dom_selected = this.$refs.dom_tbody.querySelector('tr.selected')
      if (dom_selected) dom_selected.classList.remove('selected')
      this.$refs.dom_tbody.querySelectorAll('tr')[index].classList.add('selected')
      this.listMenu.rightClickItemIndex = index
      let dom_container = event.target.closest('.' + this.$style.search)
      const getOffsetValue = (target, x = 0, y = 0) => {
        if (target === dom_container) return { x, y }
        if (!target) return { x: 0, y: 0 }
        x += target.offsetLeft
        y += target.offsetTop
        return getOffsetValue(target.offsetParent, x, y)
      }
      let { x, y } = getOffsetValue(event.target)
      this.listMenu.menuLocation.x = x + event.offsetX
      this.listMenu.menuLocation.y = y + event.offsetY - this.$refs.dom_scrollContent.scrollTop
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
      let minfo
      let url
      switch (action && action.action) {
        case 'play':
          if (this.selectedData.length) {
            this.listAddMultiple({ id: 'default', list: this.filterList(this.selectedData) })
            this.removeAllSelect()
          }
          this.testPlay(index)
          break
        case 'playLater':
          if (this.selectedData.length) {
            this.setTempPlayList(this.selectedData.map(s => ({ listId: '__temp__', musicInfo: s })))
            this.resetSelect()
          } else {
            this.setTempPlayList([{ listId: '__temp__', musicInfo: this.listInfo.list[index] }])
          }
          break
        case 'addTo':
          if (this.selectedData.length) {
            this.$nextTick(() => {
              this.isShowListAddMultiple = true
            })
          } else {
            this.musicInfo = this.listInfo.list[index]
            this.$nextTick(() => {
              this.isShowListAdd = true
            })
          }
          break
        case 'download':
          if (this.selectedData.length) {
            this.isShowDownloadMultiple = true
          } else {
            minfo = this.listInfo.list[index]
            if (!this.assertApiSupport(minfo.source)) return
            this.musicInfo = minfo
            this.$nextTick(() => {
              this.isShowDownload = true
            })
          }
          break
        case 'sourceDetail':
          minfo = this.listInfo.list[index]
          url = musicSdk[minfo.source].getMusicDetailPageUrl(minfo)
          if (!url) return
          openUrl(url)
          break
      }
    },
    handleSourceChange(source) {
      this.$router.replace({
        path: 'search',
        query: {
          text: this.text,
          source,
        },
      })
    },
  },
}
</script>

<style lang="less" module>
@import '../assets/styles/layout.less';

.search {
  position: relative;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
}
.header {
  flex: none;
}
.main {
  flex: auto;
  min-height: 0;
  position: relative;
  display: flex;
}
.list {
  // position: relative;
  height: 100%;
  font-size: 14px;
  display: flex;
  flex-flow: column nowrap;
  flex: auto;
  overflow: hidden;
}
.thead {
  flex: none;
  tr > th:first-child {
    color: @color-theme_2-font-label;
    // padding-left: 10px;
  }
}
.tbody {
  flex: auto;
  overflow-y: auto;
  scroll-behavior: smooth;

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
.listBtn {
  min-height: 24px;
}
.labelSource {
  color: @color-theme;
  padding: 5px;
  font-size: .8em;
  line-height: 1;
  opacity: .75;
}
.pagination {
  text-align: center;
  padding: 15px 0;
  // left: 50%;
  // transform: translateX(-50%);
}
.loading {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  background-color: @color-theme_2;

  p {
    font-size: 24px;
    color: @color-theme_2-font-label;
  }
}
.noitem {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;

  p {
    font-size: 24px;
    color: @color-theme_2-font-label;
    text-align: center;
  }
}
.noitem-list-container {
  padding: 0 15px;
  margin-top: -20px;
  min-height: 300px;
  max-height: 94.7%;
}
.noitem-list {
  +.noitem-list {
    margin-top: 15px;
  }
}
.noitem-hot-search-list {
  min-height: 106px;
}
.noitem-list-title {
  color: @color-theme_2-font-label;
  padding: 5px;
  font-size: 14px;
}
.noitem-list-item {
  display: inline-block;
  margin: 3px 5px;
  background-color: @color-btn-background;
  padding: 7px 10px;
  border-radius: @radius-progress-border;
  transition: background-color @transition-theme;
  cursor: pointer;
  font-size: 13px;
  color: @color-btn;
  .mixin-ellipsis-1;
  max-width: 150px;
  &:hover {
    background-color: @color-btn-hover;
  }
  &:active {
    background-color: @color-btn-active;
  }
}
.history-clear-btn {
  padding: 0 5px;
  margin-left: 5px;
  color: @color-theme_2-font-label;
  cursor: pointer;
  transition: color @transition-theme;
  &:hover {
    color: @color-theme-hover;
  }
  &:active {
    color: @color-theme-active;
  }
  svg {
    vertical-align: middle;
    width: 15px;
  }
}

each(@themes, {
  :global(#root.@{value}) {
    .labelSource {
      color: ~'@{color-@{value}-theme}';
    }
    .loading {
      background-color: ~'@{color-@{value}-theme_2}';
    }
    .noitem {
      p {
        color: ~'@{color-@{value}-theme_2-font-label}';
      }
    }
    .noitem-list-title {
      color: ~'@{color-@{value}-theme_2-font-label}';
    }
    .noitem-list-item {
      color: ~'@{color-@{value}-btn}';
      background-color: ~'@{color-@{value}-btn-background}';
      &:hover {
        background-color: ~'@{color-@{value}-btn-hover}';
      }
      &:active {
        background-color: ~'@{color-@{value}-btn-active}';
      }
    }
    .tbody {
      td {
        &:first-child {
          color: ~'@{color-@{value}-theme_2-font-label}';
        }
      }
    }
    .history-clear-btn {
      color: ~'@{color-@{value}-theme_2-font-label}';
      &:hover {
        color: ~'@{color-@{value}-theme-hover}';
      }
      &:active {
        color: ~'@{color-@{value}-theme-active}';
      }
    }
  }
})
</style>
