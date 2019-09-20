<template lang="pug">
  div(:class="$style.search")
    //- transition
    div(v-if="listInfo.list.length" :class="$style.list")
      div(:class="$style.header")
        material-tab(:class="$style.tab" :list="sources" align="left" item-key="id" item-name="name" v-model="searchSourceId")
      div(:class="$style.thead")
        table
          thead
            tr
              th.nobreak.center(style="width: 37px;")
                material-checkbox(id="search_select_all" v-model="isSelectAll" @change="handleSelectAllData"
                  :indeterminate="isIndeterminate" :title="isSelectAll && !isIndeterminate ? '全不选' : '全选'")
              th.nobreak(style="width: 25%;") 歌曲名
              th.nobreak(style="width: 20%;") 歌手
              th.nobreak(style="width: 25%;") 专辑
              th.nobreak(style="width: 15%;") 操作
              th.nobreak(style="width: 10%;") 时长
      div.scroll(:class="$style.tbody" ref="dom_scrollContent")
        table
          tbody
            tr(v-for='(item, index) in listInfo.list' :key='item.songmid' @click="handleDoubleClick(index)")
              td.nobreak.center(style="width: 37px;" @click.stop)
                material-checkbox(:id="index.toString()" v-model="selectdData" :value="item")
              td.break(style="width: 25%;")
                | {{item.name}}
                span.badge.badge-info(v-if="item._types['320k']") 高品质
                span.badge.badge-success(v-if="item._types.ape || item._types.flac") 无损
              td.break(style="width: 20%;") {{item.singer}}
              td.break(style="width: 25%;") {{item.albumName}}
              td(style="width: 15%;")
                material-list-buttons(:index="index" :remove-btn="false" @btn-click="handleListBtnClick")
              td(style="width: 10%;") {{item.interval}}
        div(:class="$style.pagination")
          material-pagination(:count="info.total" :limit="limit" :page="page" @btn-click="handleTogglePage")
    div(v-else :class="$style.noitem")
      p 搜我所想~~😉
    material-download-modal(:show="isShowDownload" :musicInfo="musicInfo" @select="handleAddDownload" @close="isShowDownload = false")
    material-download-multiple-modal(:show="isShowDownloadMultiple" :list="selectdData" @select="handleAddDownloadMultiple" @close="isShowDownloadMultiple = false")
    material-flow-btn(:show="isShowEditBtn" :remove-btn="false" @btn-click="handleFlowBtnClick")
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
import { scrollTo } from '../utils'
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
    }
  },
  beforeRouteUpdate(to, from, next) {
    if (to.query.text === undefined) return
    if (to.query.text === '') {
      this.clearList()
    } else {
      this.text = to.query.text
      this.page = 1
      this.handleSearch(this.text, this.page)
    }
    next()
  },
  mounted() {
    // console.log('mounted')
    this.searchSourceId = this.setting.search.searchSource
    if (this.$route.query.text === undefined) {
      this.text = this.$store.getters['search/text']
      this.page = this.listInfo.page
    } else if (this.$route.query.text === '') {
      this.clearList()
    } else {
      this.text = this.$route.query.text
      this.page = 1
      this.handleSearch(this.text, this.page)
    }
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
      this.setSearchSource({
        searchSource: n,
      })
    },
  },
  computed: {
    ...mapGetters(['userInfo', 'setting']),
    ...mapGetters('search', ['sourceList', 'allList', 'sources']),
    ...mapGetters('list', ['defaultList']),
    listInfo() {
      return this.setting.search.searchSource == 'all' ? this.allList : this.sourceList[this.setting.search.searchSource]
    },
  },
  methods: {
    ...mapMutations(['setSearchSource']),
    ...mapActions('search', ['search']),
    ...mapActions('download', ['createDownload', 'createDownloadMultiple']),
    ...mapMutations('search', ['clearList', 'setPage']),
    ...mapMutations('list', ['defaultListAdd', 'defaultListAddMultiple']),
    ...mapMutations('player', ['setList']),
    handleSearch(text, page) {
      this.search({ text, page, limit: this.limit }).then(data => {
        this.page = page
        this.$nextTick(() => {
          scrollTo(this.$refs.dom_scrollContent, 0)
        })
      })
    },
    handleDoubleClick(index) {
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
        case 'add':
          break
      }
    },
    testPlay(index) {
      let targetSong
      if (index == null) {
        targetSong = this.selectdData[0]
        this.defaultListAddMultiple(this.selectdData)
      } else {
        targetSong = this.listInfo.list[index]
        this.defaultListAdd(targetSong)
      }
      let targetIndex = this.defaultList.list.findIndex(
        s => s.songmid === targetSong.songmid
      )
      if (targetIndex > -1) {
        this.setList({
          list: this.defaultList.list,
          listId: 'test',
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
      this.createDownloadMultiple({ list: [...this.selectdData], type })
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
          this.defaultListAddMultiple(this.selectdData)
          this.resetSelect()
          break
      }
    },
  },
}
</script>

<style lang="less" module>
@import '../assets/styles/layout.less';

.search {
  overflow: hidden;
  height: 100%;
}
.list {
  position: relative;
  height: 100%;
  font-size: 14px;
  display: flex;
  flex-flow: column nowrap;
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
      margin-right: 3px;
      &:first-child {
        margin-left: 3px;
      }
      &:last-child {
        margin-right: 0;
      }
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
  position: relative;
  height: 100%;
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
    .noitem {
      p {
        color: ~'@{color-@{value}-theme_2-font-label}';
      }
    }
  }
})
</style>
