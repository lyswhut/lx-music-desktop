<template lang="pug">
  div(:class="$style.leaderboard")
    div(:class="$style.header")
      material-tab(:class="$style.tab" :list="types" align="left" item-key="id" item-name="name" v-model="tabId")
      material-select(:class="$style.select" :list="sourceInfo.sources" item-key="id" item-name="name" v-model="source")
    material-song-list(v-model="selectdData" @action="handleSongListAction" :source="source" :page="page" :limit="info.limit" :total="info.total" :noItem="$t('material.song_list.loding_list')" :list="list")
    material-download-modal(:show="isShowDownload" :musicInfo="musicInfo" @select="handleAddDownload" @close="isShowDownload = false")
    material-download-multiple-modal(:show="isShowDownloadMultiple" :list="selectdData" @select="handleAddDownloadMultiple" @close="isShowDownloadMultiple = false")
    material-list-add-modal(:show="isShowListAdd" :musicInfo="musicInfo" @close="isShowListAdd = false")
    material-list-add-multiple-modal(:show="isShowListAddMultiple" :musicList="selectdData" @close="handleListAddModalClose")
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
      isShowDownload: false,
      musicInfo: null,
      selectdData: [],
      isShowDownloadMultiple: false,
      isShowListAdd: false,
      isShowListAddMultiple: false,
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
    ...mapMutations('list', ['listAdd', 'listAddMultiple']),
    ...mapMutations('player', ['setList']),
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
        case 'listAdd':
          this.musicInfo = this.list[info.index]
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
        this.listAddMultiple({ id: 'default', list: this.selectdData })
        this.resetSelect()
      } else {
        targetSong = this.list[index]
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
    handleAddDownload(type) {
      this.createDownload({ musicInfo: this.musicInfo, type })
      this.isShowDownload = false
    },
    handleAddDownloadMultiple(type) {
      switch (this.source) {
        // case 'kg':
        case 'tx':
        case 'wy':
          type = '128k'
      }
      this.createDownloadMultiple({ list: [...this.selectdData], type })
      this.isShowDownloadMultiple = false
      this.resetSelect()
    },
    handleListAddModalClose(isSelect) {
      if (isSelect) this.resetSelect()
      this.isShowListAddMultiple = false
    },
    handleFlowBtnClick(action) {
      switch (action) {
        case 'download':
          this.isShowDownloadMultiple = true
          break
        case 'play':
          this.testPlay()
          break
        case 'add':
          this.isShowListAddMultiple = true
          break
      }
    },
    handleSongListAction({ action, data }) {
      switch (action) {
        case 'listBtnClick':
          return this.handleListBtnClick(data)
        case 'togglePage':
          return this.handleTogglePage(data)
        case 'flowBtnClick':
          return this.handleFlowBtnClick(data)
        case 'testPlay':
          return this.testPlay(data)
        case 'search':
          return this.handleSearch(data)
      }
    },
    resetSelect() {
      this.selectdData = []
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
