<template lang="pug">
  div(:class="$style.leaderboard")
    div(:class="$style.header")
      material-tab(:class="$style.tab" :list="types" item-key="id" item-name="name" v-model="tabId")
      material-select(:class="$style.select" :list="sourceInfo.sources" item-key="id" item-name="name" v-model="source")
    div(:class="$style.content")
      div(v-if="list.length" :class="$style.list")
        div(:class="$style.thead")
          table
            thead
              tr
                th.nobreak.center(style="width: 37px;")
                  material-checkbox(id="search_select_all" v-model="isSelectAll" @change="handleSelectAllData"
                    :indeterminate="isIndeterminate" :title="isSelectAll && !isIndeterminate ? '全不选' : '全选'")
                th.nobreak(style="width: 25%;") 歌曲名
                th.nobreak(style="width: 20%;") 歌手
                th.nobreak(style="width: 22%;") 专辑
                th.nobreak(style="width: 18%;") 操作
                th.nobreak(style="width: 10%;") 时长
        div.scroll(:class="$style.tbody" ref="dom_scrollContent")
          table
            tbody
              tr(v-for='(item, index) in list' :key='item.songmid' @click="handleDoubleClick(index)")
                td.nobreak.center(style="width: 37px;" @click.stop)
                  material-checkbox(:id="index.toString()" v-model="selectdData" :value="item")
                td.break(style="width: 25%;")
                  | {{item.name}}
                  //- span.badge.badge-info(v-if="item._types['320k']") 高品质
                  //- span.badge.badge-success(v-if="item._types.ape || item._types.flac") 无损
                td.break(style="width: 20%;") {{item.singer}}
                td.break(style="width: 22%;") {{item.albumName}}
                td(style="width: 18%;")
                  material-list-buttons(:index="index" :search-btn="true" :play-btn="item.source == 'kw' || !isAPITemp" :download-btn="item.source == 'kw' || !isAPITemp" :remove-btn="false" @btn-click="handleListBtnClick")
                  //- button.btn-info(type='button' v-if="item._types['128k'] || item._types['192k'] || item._types['320k'] || item._types.flac" @click.stop='openDownloadModal(index)') 下载
                  //- button.btn-secondary(type='button' v-if="item._types['128k'] || item._types['192k'] || item._types['320k']" @click.stop='testPlay(index)') 试听
                  //- button.btn-success(type='button' v-if="(item._types['128k'] || item._types['192k'] || item._types['320k']) && userInfo" @click.stop='showListModal(index)') ＋
                td(style="width: 10%;") {{item.interval || '--/--'}}
          div(:class="$style.pagination")
            material-pagination(:count="info.total" :limit="info.limit" :page="info.page" @btn-click="handleTogglePage")
    material-download-modal(:show="isShowDownload" :musicInfo="musicInfo" @select="handleAddDownload" @close="isShowDownload = false")
    material-download-multiple-modal(:show="isShowDownloadMultiple" :list="selectdData" @select="handleAddDownloadMultiple" @close="isShowDownloadMultiple = false")
    material-flow-btn(:show="isShowEditBtn && (source == 'kw' || !isAPITemp)" :remove-btn="false" @btn-click="handleFlowBtnClick")
</template>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex'
import { scrollTo } from '../utils'
// import music from '../utils/music'
export default {
  name: 'Leaderboard',
  data() {
    return {
      tabId: null,
      source: null,
      page: 1,
      clickTime: 0,
      clickIndex: -1,
      isShowDownload: false,
      musicInfo: null,
      selectdData: [],
      isSelectAll: false,
      isIndeterminate: false,
      isShowEditBtn: false,
      isShowDownloadMultiple: false,
    }
  },
  computed: {
    ...mapGetters(['setting']),
    ...mapGetters('leaderboard', ['sourceInfo', 'list', 'info']),
    ...mapGetters('list', ['defaultList']),
    types() {
      return this.source ? this.sourceInfo.sourceList[this.source] : []
    },
    isAPITemp() {
      return this.setting.apiSource == 'temp'
    },
  },
  watch: {
    tabId(n, o) {
      this.setLeaderboard({ tabId: n })
      if (!o && this.page !== 1) return
      this.getList(1).then(() => {
        this.page = this.info.page
        scrollTo(this.$refs.dom_scrollContent, 0)
      })
    },
    source(n, o) {
      this.setLeaderboard({ source: n })
      if (o) this.tabId = this.types[0] && this.types[0].id
    },
    selectdData(n) {
      const len = n.length
      if (len) {
        this.isSelectAll = true
        this.isIndeterminate = len !== this.list.length
        this.isShowEditBtn = true
      } else {
        this.isSelectAll = false
        this.isShowEditBtn = false
      }
    },
    list() {
      this.resetSelect()
    },
  },
  mounted() {
    this.source = this.setting.leaderboard.source
    this.tabId = this.setting.leaderboard.tabId
    this.page = this.info.page
  },
  methods: {
    ...mapMutations(['setLeaderboard']),
    ...mapActions('leaderboard', ['getList']),
    ...mapActions('download', ['createDownload', 'createDownloadMultiple']),
    ...mapMutations('list', ['defaultListAdd', 'defaultListAddMultiple']),
    ...mapMutations('player', ['setList']),
    handleDoubleClick(index) {
      if (
        window.performance.now() - this.clickTime > 400 ||
        this.clickIndex !== index
      ) {
        this.clickTime = window.performance.now()
        this.clickIndex = index
        return
      }
      (this.source == 'kw' || !this.isAPITemp) ? this.testPlay(index) : this.handleSearch(index)
      this.clickTime = 0
      this.clickIndex = -1
    },
    handleListBtnClick(info) {
      switch (info.action) {
        case 'download':
          this.musicInfo = this.list[info.index]
          this.$nextTick(() => {
            this.isShowDownload = true
          })
          break
        case 'play':
          this.testPlay(info.index)
          break
        case 'search':
          this.handleSearch(info.index)
          break
        // case 'add':
        //   break
      }
    },
    testPlay(index) {
      let targetSong
      if (index == null) {
        targetSong = this.selectdData[0]
        this.defaultListAddMultiple(this.selectdData)
      } else {
        targetSong = this.list[index]
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
    handleSearch(index) {
      const info = this.list[index]
      this.$router.push({
        path: 'search',
        query: {
          text: `${info.name} ${info.singer}`,
        },
      })
    },
    handleTogglePage(page) {
      this.getList(page).then(() => {
        this.page = this.info.page
        this.$nextTick(() => {
          scrollTo(this.$refs.dom_scrollContent, 0)
        })
      })
    },
    handleSelectAllData(isSelect) {
      this.selectdData = isSelect ? [...this.list] : []
    },
    resetSelect() {
      this.isSelectAll = false
      this.selectdData = []
    },
    handleAddDownload(type) {
      this.createDownload({ musicInfo: this.musicInfo, type })
      this.isShowDownload = false
    },
    handleAddDownloadMultiple(type) {
      switch (this.source) {
        // case 'kg':
        case 'wy':
          type = '128k'
      }
      this.createDownloadMultiple({ list: [...this.selectdData], type })
      this.resetSelect()
      this.isShowDownloadMultiple = false
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

.leaderboard {
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
}
.header {
  flex: none;
  width: 100%;
  display: flex;
  flex-flow: row nowrap;

}
.tab {
  flex: auto;
}
.select {
  flex: none;
  width: 80px;
}
.content {
  flex: auto;
  display: flex;
  overflow: hidden;
  flex-flow: column nowrap;
}
.list {
  position: relative;
  height: 100%;
  font-size: 14px;
  display: flex;
  flex-flow: column nowrap;
  // table {
  //   position: relative;
  //   thead {
  //     position: fixed;
  //     width: 100%;
  //     th {
  //       width: 100%;
  //     }
  //   }
  // }
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
</style>
