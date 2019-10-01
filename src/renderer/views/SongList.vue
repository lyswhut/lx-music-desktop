<template lang="pug">
  div(:class="$style.container")
    transition(enter-active-class="animated-fast fadeIn" leave-active-class="animated-fast fadeOut")
      div(:class="$style.songListDetailContent" v-show="isVisibleListDetail")
        div(:class="$style.songListHeader")
          div(:class="$style.songListHeaderLeft")
            img(:src="selectListInfo.img")
            span(:class="$style.playNum" v-if="selectListInfo.play_count") {{selectListInfo.play_count}}
          div(:class="$style.songListHeaderMiddle")
            h3(:title="selectListInfo.name") {{selectListInfo.name}}
            p(:title="selectListInfo.desc") {{listDetail.desc || selectListInfo.desc}}
          div(:class="$style.songListHeaderRight")
            material-btn(:class="$style.closeDetailButton" @click="hideListDetail") 返回
        material-song-list(v-model="selectdData" @action="handleSongListAction" :source="source" :page="listDetail.page" :limit="listDetail.limit" :total="listDetail.total" :list="listDetail.list")
    transition(enter-active-class="animated-fast fadeIn" leave-active-class="animated-fast fadeOut")
      div(:class="$style.songListContent" v-show="!isVisibleListDetail")
        div(:class="$style.header")
          material-tag-list(:class="$style.tagList" :list="tagList" v-model="tagInfo")
          material-tab(:class="$style.tab" :list="sorts" item-key="id" item-name="name" v-model="sortId")
          material-select(:class="$style.select" :list="sourceInfo.sources" item-key="id" item-name="name" v-model="source")
        div.scroll(:class="$style.songList" ref="dom_scrollContent")
          ul
            li(:class="$style.item" v-for="(item, index) in listData.list" @click="handleItemClick(index)")
              div(:class="$style.left")
                img(:src="item.img")
              div(:class="$style.right" :src="item.img")
                h4(:title="item.name") {{item.name}}
                p(:title="item.desc") {{item.desc}}
            li(:class="$style.item" style="cursor: default;" v-if="listData.list && listData.list.length && listData.list.length % 3 == 2")
          div(:class="$style.pagination")
            material-pagination(:count="listData.total" :limit="listData.limit" :page="listData.page" @btn-click="handleToggleListPage")
    material-download-modal(:show="isShowDownload" :musicInfo="musicInfo" @select="handleAddDownload" @close="isShowDownload = false")
    material-download-multiple-modal(:show="isShowDownloadMultiple" :list="selectdData" @select="handleAddDownloadMultiple" @close="isShowDownloadMultiple = false")
</template>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex'
import { scrollTo } from '../utils'
// import music from '../utils/music'
export default {
  name: 'SongList',
  data() {
    return {
      tagInfo: {
        name: '默认',
        id: null,
      },
      sortId: undefined,
      source: null,
      isShowDownload: false,
      musicInfo: null,
      selectdData: [],
      isShowDownloadMultiple: false,
      isToggleSource: false,
    }
  },
  computed: {
    ...mapGetters(['setting']),
    ...mapGetters('songList', ['sourceInfo', 'tags', 'listData', 'isVisibleListDetail', 'selectListInfo', 'listDetail']),
    ...mapGetters('list', ['defaultList']),
    sorts() {
      return this.source ? this.sourceInfo.sortList[this.source] : []
    },
    isAPITemp() {
      return this.setting.apiSource == 'temp'
    },
    tagList() {
      return this.tags[this.source] ? this.tags[this.source].tags : []
    },
  },
  watch: {
    sortId(n, o) {
      this.setSongList({ sortId: n })
      if (o === undefined && this.listData.page !== 1) return
      this.$nextTick(() => {
        this.getList(1).then(() => {
          this.$nextTick(() => {
            scrollTo(this.$refs.dom_scrollContent, 0)
          })
        })
      })
      // if (this.isVisibleListDetail) this.setVisibleListDetail(false)
    },
    tagInfo(n, o) {
      this.setSongList({ tagInfo: n })
      if (!o && this.listData.page !== 1) return
      if (this.isToggleSource) {
        this.isToggleSource = false
        return
      }
      this.$nextTick(() => {
        this.getList(1).then(() => {
          this.$nextTick(() => {
            scrollTo(this.$refs.dom_scrollContent, 0)
          })
        })
      })
      // if (this.isVisibleListDetail) this.setVisibleListDetail(false)
    },
    source(n, o) {
      this.setSongList({ source: n })
      if (!this.tags[n]) this.getTags()
      if (o) {
        this.isToggleSource = true
        this.tagInfo = {
          name: '默认',
          id: null,
        }
        this.sortId = this.sorts[0] && this.sorts[0].id
      }
    },
  },
  mounted() {
    this.source = this.setting.songList.source
    this.isToggleSource = true
    this.tagInfo = this.setting.songList.tagInfo
    this.sortId = this.setting.songList.sortId
  },
  methods: {
    ...mapMutations(['setSongList']),
    ...mapActions('songList', ['getTags', 'getList', 'getListDetail']),
    ...mapMutations('songList', ['setVisibleListDetail', 'setSelectListInfo', 'clearListDetail']),
    ...mapActions('download', ['createDownload', 'createDownloadMultiple']),
    ...mapMutations('list', ['defaultListAdd', 'defaultListAddMultiple']),
    ...mapMutations('player', ['setList']),
    handleListBtnClick(info) {
      switch (info.action) {
        case 'download':
          this.musicInfo = this.listDetail.list[info.index]
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
        this.resetSelect()
      } else {
        targetSong = this.listDetail.list[index]
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
      const info = this.listDetail.list[index]
      this.$router.push({
        path: 'search',
        query: {
          text: `${info.name} ${info.singer}`,
        },
      })
    },
    handleToggleListPage(page) {
      this.getList(page).then(() => {
        this.$nextTick(() => {
          scrollTo(this.$refs.dom_scrollContent, 0)
        })
      })
    },
    handleToggleListDetailPage(page) {
      this.getListDetail({ id: this.selectListInfo.id, page }).then(() => {
        this.$nextTick(() => {
          scrollTo(this.$refs.dom_scrollContent, 0)
        })
      })
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
    handleItemClick(index) {
      this.setSelectListInfo(this.listData.list[index])
      this.setVisibleListDetail(true)
      this.clearListDetail()
      this.$nextTick(() => {
        this.getListDetail({ id: this.selectListInfo.id, page: 1 })
      })
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
          this.defaultListAddMultiple(this.selectdData)
          this.resetSelect()
          break
      }
    },
    handleSongListAction({ action, data }) {
      switch (action) {
        case 'listBtnClick':
          return this.handleListBtnClick(data)
        case 'togglePage':
          return this.handleToggleListDetailPage(data)
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
    hideListDetail() {
      setTimeout(() => this.setVisibleListDetail(false), 50)
    },
  },
}
</script>


<style lang="less" module>
@import '../assets/styles/layout.less';

.container {
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

.songListContent, .song-list-detail-content {
  // flex: auto;
  overflow: hidden;
}

.songListContent {
  display: flex;
  flex-flow: column nowrap;
  // position: relative;
}

.song-list-header {
  display: flex;
  flex-flow: row nowrap;
  height: 60px;
}
.song-list-header-left {
  flex: none;
  margin-left: 5px;
  width: 60px;
  position: relative;
  img {
    max-width: 100%;
    max-height: 100%;
  }
  .play-num {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 2px;
    background-color: rgba(0, 0, 0, 0.4);
    color: #fff;
    font-size: 11px;
    text-align: right;
    .mixin-ellipsis-1;
  }
}

.song-list-header-middle {
  flex: auto;
  padding: 5px 7px;
  h3 {
    .mixin-ellipsis-1;
    line-height: 1.2;
    padding-bottom: 5px;
  }
  p {
    .mixin-ellipsis-2;
    font-size: 12px;
    line-height: 1.2;
    color: #888;
  }
}
.song-list-header-right {
  flex: none;
  display: flex;
  align-items: center;
  padding-right: 15px;
}

.song-list-detail-content {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  display: flex;
  flex-flow: column nowrap;
}

.songList {
  height: 100%;
  overflow-y: auto;
  padding: 0 15px;
  ul {
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
  }
}
.item {
  width: 32%;
  box-sizing: border-box;
  display: flex;
  margin-top: 15px;
  cursor: pointer;
  transition: opacity @transition-theme;
  &:hover {
    opacity: .7;
  }
}
.left {
  flex: none;
  width: 66px;
  height: 66px;
  display: flex;

  img {
    max-width: 100%;
    max-height: 100%;
  }
}
.right {
  flex: auto;
  padding: 5px 15px 5px 7px;
  overflow: hidden;
  h4 {
    font-size: 14px;
    text-align: justify;
    line-height: 1.2;
    .mixin-ellipsis-1;
  }
  p {
    margin-top: 12px;
    font-size: 12px;
    .mixin-ellipsis-2;
    text-align: justify;
    line-height: 1.2;
    // text-indent: 24px;

    color: #888;
  }
}
.pagination {
  text-align: center;
  padding: 15px 0;
  // left: 50%;
  // transform: translateX(-50%);
}
</style>
