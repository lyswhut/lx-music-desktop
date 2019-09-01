<template lang="pug">
  div(:class="$style.leaderboard")
    div(:class="$style.header")
      //- material-tab(:class="$style.tab" :list="types" item-key="id" item-name="name" v-model="sortId")
      //- material-select(:class="$style.select" :list="sourceInfo.sources" item-key="id" item-name="name" v-model="source")
    material-download-modal(:show="isShowDownload" :musicInfo="musicInfo" @select="handleAddDownload" @close="isShowDownload = false")
    material-download-multiple-modal(:show="isShowDownloadMultiple" :list="selectdData" @select="handleAddDownloadMultiple" @close="isShowDownloadMultiple = false")
</template>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex'
import { scrollTo } from '../utils'
// import music from '../utils/music'
export default {
  name: 'Leaderboard',
  data() {
    return {
      tagId: null,
      sortId: null,
      source: null,
      listPage: 1,
      songListPage: 1,
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
    ...mapGetters('songList', ['sourceInfo', 'tags', 'listData', 'listDetail']),
    ...mapGetters('list', ['defaultList']),
    types() {
      return this.source ? this.sourceInfo.sources[this.source] : []
    },
    isAPITemp() {
      return this.setting.apiSource == 'temp'
    },
  },
  watch: {
    sortId(n, o) {
      this.setSongList({ sortId: n })
      if (!o && this.listPage !== 1) return
      this.getList(1).then(() => {
        this.listPage = this.info.listPage
        scrollTo(this.$refs.dom_scrollContent, 0)
      })
    },
    tagId(n, o) {
      this.setSongList({ sortId: n })
      if (!o && this.songListPage !== 1) return
      this.getList(1).then(() => {
        this.songListPage = this.info.songListPage
        scrollTo(this.$refs.dom_scrollContent, 0)
      })
    },
    source(n, o) {
      this.setSongList({ source: n })
      if (o) {
        this.tagId = this.tags[0] && this.tags[0].id
        this.sortType = this.sortList[0] && this.sortList[0].id
      }
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
    this.source = this.setting.songList.source
    // this.sortId = this.setting.songList.sortId
    this.listPage = this.listData.page
    this.songListPage = this.listDetail.page
  },
  methods: {
    ...mapMutations(['setSongList']),
    ...mapActions('songList', ['getTags', 'getList', 'getListDetail']),
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
      (this.source == 'kw' || (!this.isAPITemp && this.list[index].source != 'tx')) ? this.testPlay(index) : this.handleSearch(index)
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
