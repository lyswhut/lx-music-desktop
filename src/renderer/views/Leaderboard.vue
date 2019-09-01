<template lang="pug">
  div(:class="$style.leaderboard")
    div(:class="$style.header")
      material-tab(:class="$style.tab" :list="types" item-key="id" item-name="name" v-model="tabId")
      material-select(:class="$style.select" :list="sourceInfo.sources" item-key="id" item-name="name" v-model="source")
    material-song-list(v-model="selectdData" @action="handleSongListAction" :source="source" :page="page" :limit="info.limit" :total="info.total" :list="list")
    material-download-modal(:show="isShowDownload" :musicInfo="musicInfo" @select="handleAddDownload" @close="isShowDownload = false")
    material-download-multiple-modal(:show="isShowDownloadMultiple" :list="selectdData" @select="handleAddDownloadMultiple" @close="isShowDownloadMultiple = false")
    material-flow-btn(:show="isShowEditBtn && (source == 'kw' || !isAPITemp)" :remove-btn="false" @btn-click="handleFlowBtnClick")
</template>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex'
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
      })
    },
    source(n, o) {
      this.setLeaderboard({ source: n })
      if (o) this.tabId = this.types[0] && this.types[0].id
    },
    // selectdData(n) {
    //   const len = n.length
    //   if (len) {
    //     this.isSelectAll = true
    //     this.isIndeterminate = len !== this.list.length
    //     this.isShowEditBtn = true
    //   } else {
    //     this.isSelectAll = false
    //     this.isShowEditBtn = false
    //   }
    // },
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
    handleSongListAction({ action, data }) {
      console.log(action, data)
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

</style>
