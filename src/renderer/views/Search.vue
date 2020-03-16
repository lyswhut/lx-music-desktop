<template lang="pug">
  div(:class="$style.search")
    //- transition
    div(:class="$style.header")
      material-tab(:class="$style.tab" :list="sources" align="left" item-key="id" item-name="name" v-model="searchSourceId")
    div(v-if="listInfo.list.length" :class="$style.list")
      div(:class="$style.thead")
        table
          thead
            tr
              th.nobreak.center(style="width: 37px;")
                material-checkbox(id="search_select_all" v-model="isSelectAll" @change="handleSelectAllData"
                  :indeterminate="isIndeterminate" :title="isSelectAll && !isIndeterminate ? $t('view.search.unselect_all') : $t('view.search.select_all')")
              th.nobreak(style="width: 25%;") {{$t('view.search.name')}}
              th.nobreak(style="width: 20%;") {{$t('view.search.singer')}}
              th.nobreak(style="width: 25%;") {{$t('view.search.album')}}
              th.nobreak(style="width: 15%;") {{$t('view.search.action')}}
              th.nobreak(style="width: 10%;") {{$t('view.search.time')}}
      div.scroll(:class="$style.tbody" ref="dom_scrollContent")
        table
          tbody(@contextmenu="handleContextMenu")
            tr(v-for='(item, index) in listInfo.list' :key='item.songmid' @click="handleDoubleClick($event, index)")
              td.nobreak.center(style="width: 37px;" @click.stop)
                material-checkbox(:id="index.toString()" v-model="selectdData" :value="item")
              td.break(style="width: 25%;")
                span.select {{item.name}}
                span.badge.badge-theme-success(:class="$style.labelQuality" v-if="item._types.ape || item._types.flac") {{$t('material.song_list.lossless')}}
                span.badge.badge-theme-info(:class="$style.labelQuality" v-else-if="item._types['320k']") {{$t('material.song_list.high_quality')}}
                span(:class="$style.labelSource" v-if="searchSourceId == 'all'") {{item.source}}
              td.break(style="width: 20%;")
                span.select {{item.singer}}
              td.break(style="width: 25%;")
                span.select {{item.albumName}}
              td(style="width: 15%; padding-left: 0; padding-right: 0;")
                material-list-buttons(:index="index" :remove-btn="false" :class="$style.listBtn"
                  :play-btn="item.source == 'kw' || !isAPITemp"
                  :download-btn="item.source == 'kw' || !isAPITemp"
                  @btn-click="handleListBtnClick")
              td(style="width: 10%;")
                span(:class="$style.time") {{item.interval || '--/--'}}
        div(:class="$style.pagination")
          material-pagination(:count="listInfo.total" :limit="listInfo.limit" :page="page" @btn-click="handleTogglePage")
    div(v-else :class="$style.noitem")
      div.scroll(:class="$style.noitemListContainer" v-if="setting.search.isShowHotSearch || setting.search.isShowHistorySearch")
        dl(:class="[$style.noitemList, $style.noitemHotSearchList]" v-if="setting.search.isShowHotSearch")
          dt(:class="$style.noitemListTitle") {{$t('view.search.hot_search')}}
          dd(:class="$style.noitemListItem" @click="handleNoitemSearch(item)" v-for="item in hotSearchList") {{item}}
        dl(:class="$style.noitemList" v-if="setting.search.isShowHistorySearch && historyList.length")
          dt(:class="$style.noitemListTitle")
            span {{$t('view.search.history_search')}}
            span(:class="$style.historyClearBtn" @click="clearHistory" :title="$t('view.search.history_clear')")
              svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 512 512' space='preserve')
                use(xlink:href='#icon-eraser')
          dd(:class="$style.noitemListItem" v-for="(item, index) in historyList" @contextmenu="removeHistory(index)" :key="index + item" @click="handleNoitemSearch(item)" :title="$t('view.search.history_remove')") {{item}}
      div(v-else :class="$style.noitem_list")
        p {{$t('view.search.no_item')}}
    material-download-modal(:show="isShowDownload" :musicInfo="musicInfo" @select="handleAddDownload" @close="isShowDownload = false")
    material-download-multiple-modal(:show="isShowDownloadMultiple" :list="selectdData" @select="handleAddDownloadMultiple" @close="isShowDownloadMultiple = false")
    material-flow-btn(:show="isShowEditBtn && (searchSourceId == 'kw' || searchSourceId == 'all' || !isAPITemp)" :remove-btn="false" @btn-click="handleFlowBtnClick")
    material-list-add-modal(:show="isShowListAdd" :musicInfo="musicInfo" @close="isShowListAdd = false")
    material-list-add-multiple-modal(:show="isShowListAddMultiple" :musicList="selectdData" @close="handleListAddModalClose")
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
import { scrollTo, clipboardWriteText } from '../utils'
// import music from '../utils/music'
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
      selectdData: [],
      isSelectAll: false,
      isIndeterminate: false,
      isShowEditBtn: false,
      isShowDownloadMultiple: false,
      searchSourceId: null,
      isShowListAdd: false,
      isShowListAddMultiple: false,
    }
  },
  beforeRouteUpdate(to, from, next) {
    if (to.query.text === undefined) return
    this.text = to.query.text
    this.page = 1
    this.handleSearch(this.text, this.page)
    next()
  },
  mounted() {
    // console.log('mounted')

    // 处理搜索源不存在时页面报错的问题
    if (!this.sourceList[this.setting.search.searchSource]) {
      this.setSearchSource({
        searchSource: 'kw',
      })
    }
    this.searchSourceId = this.setting.search.searchSource
    if (this.$route.query.text === undefined) {
      this.text = this.$store.getters['search/searchText']
      this.page = this.listInfo.page
    } else if (this.$route.query.text === '') {
      this.clearList()
    } else {
      this.text = this.$route.query.text
      this.page = 1
      this.handleSearch(this.text, this.page)
    }
    this.handleGetHotSearch()
  },
  watch: {
    selectdData(n) {
      const len = n.length
      if (len) {
        this.isSelectAll = true
        this.isIndeterminate = len !== this.listInfo.list.length
        this.isShowEditBtn = true
      } else {
        this.isSelectAll = false
        this.isShowEditBtn = false
      }
    },
    'listInfo.list'() {
      this.resetSelect()
    },
    searchSourceId(n) {
      if (n === this.setting.search.searchSource) return
      this.$nextTick(() => {
        this.page = 1
        this.handleSearch(this.text, this.page)
        this.handleGetHotSearch()
      })
      this.setSearchSource({
        searchSource: n,
      })
    },
  },
  computed: {
    ...mapGetters(['userInfo', 'setting']),
    ...mapGetters('search', ['sourceList', 'allList', 'sources', 'historyList']),
    ...mapGetters('list', ['defaultList']),
    listInfo() {
      return this.setting.search.searchSource == 'all' ? this.allList : this.sourceList[this.setting.search.searchSource]
    },
    isAPITemp() {
      return this.setting.apiSource == 'temp'
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
    ...mapMutations('player', ['setList']),
    ...mapActions('hotSearch', {
      getHotSearch: 'getList',
    }),
    handleSearch(text, page) {
      if (text === '') return this.clearList()

      this.search({ text, page, limit: this.listInfo.limit }).then(data => {
        this.page = page
        this.$nextTick(() => {
          scrollTo(this.$refs.dom_scrollContent, 0)
        })
      })
    },
    handleDoubleClick(event, index) {
      if (event.target.classList.contains('select')) return
      if (
        window.performance.now() - this.clickTime > 400 ||
        this.clickIndex !== index
      ) {
        this.clickTime = window.performance.now()
        this.clickIndex = index
        return
      }
      this.testPlay(index)
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
    testPlay(index) {
      let targetSong
      if (index == null) {
        targetSong = this.selectdData[0]
        this.listAddMultiple({ id: 'default', list: this.filterList(this.selectdData) })
      } else {
        if (this.isAPITemp && this.listInfo.list[index].source != 'kw') return
        targetSong = this.listInfo.list[index]
        this.listAdd({ id: 'default', musicInfo: targetSong })
      }
      let targetIndex = this.defaultList.list.findIndex(
        s => s.songmid === targetSong.songmid,
      )
      if (targetIndex > -1) {
        this.setList({
          list: this.defaultList.list,
          listId: this.defaultList.id,
          index: targetIndex,
        })
      }
    },
    handleTogglePage(page) {
      this.handleSearch(this.text, page)
    },
    handleAddDownload(type) {
      this.createDownload({ musicInfo: this.musicInfo, type })
      this.isShowDownload = false
    },
    handleAddDownloadMultiple(type) {
      this.createDownloadMultiple({ list: this.filterList(this.selectdData), type })
      this.resetSelect()
      this.isShowDownloadMultiple = false
    },
    handleSelectAllData(isSelect) {
      this.selectdData = isSelect ? [...this.listInfo.list] : []
    },
    resetSelect() {
      this.isSelectAll = false
      this.selectdData = []
    },
    handleFlowBtnClick(action) {
      switch (action) {
        case 'download':
          this.isShowDownloadMultiple = true
          break
        case 'play':
          this.testPlay()
          this.resetSelect()
          break
        case 'add':
          this.isShowListAddMultiple = true
          break
      }
    },
    filterList(list) {
      return this.setting.apiSource == 'temp' ? list.filter(s => s.source == 'kw') : [...list]
    },
    handleListAddModalClose(isSelect) {
      if (isSelect) this.resetSelect()
      this.isShowListAddMultiple = false
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
    handleGetHotSearch() {
      if (this.hotSearchList.length || !this.setting.search.isShowHotSearch) return
      this.getHotSearch(this.setting.search.searchSource)
    },
    handleNoitemSearch(text) {
      this.$router.push({
        path: 'search',
        query: {
          text,
        },
      })
    },
  },
}
</script>

<style lang="less" module>
@import '../assets/styles/layout.less';

.search {
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
}
.header {
  flex: none;
}
.list {
  position: relative;
  height: 100%;
  font-size: 14px;
  display: flex;
  flex-flow: column nowrap;
  flex: auto;
  overflow: hidden;
}
.thead {
  flex: none;
}
.tbody {
  flex: auto;
  overflow-y: auto;
  td {
    font-size: 12px;
    :global(.badge) {
      margin-left: 3px;
    }
  }
  :global(.badge) {
    opacity: .85;
  }

  &.copying {
    .labelQuality, .labelSource, .time {
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
.noitem {
  flex: auto;
  overflow: hidden;
  position: relative;
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
    background-color: @color-theme_2-hover;
  }
  &:active {
    background-color: @color-theme_2-active;
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
  :global(#container.@{value}) {
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
        background-color: ~'@{color-@{value}-theme_2-hover}';
      }
      &:active {
        background-color: ~'@{color-@{value}-theme_2-active}';
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
