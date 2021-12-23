<template lang="pug">
div(:class="$style.container")
  //- 歌曲列表页放在底层，在隐藏列表页时不会出现列表项的间隔线突兀感
  transition(enter-active-class="animated-fast fadeIn" leave-active-class="animated-fast fadeOut")
    div(:class="$style.songListDetailContent" v-if="isVisibleListDetail")
      div(:class="$style.songListHeader")
        div(:class="$style.songListHeaderLeft" :style="{ backgroundImage: 'url('+(selectListInfo.img || listDetail.info.img)+')' }")
          //- img(:src="listDetail.info.img || selectListInfo.img")
          span(:class="$style.playNum" v-if="listDetail.info.play_count || selectListInfo.play_count") {{listDetail.info.play_count || selectListInfo.play_count}}
        div(:class="$style.songListHeaderMiddle")
          h3(:title="listDetail.info.name || selectListInfo.name") {{listDetail.info.name || selectListInfo.name}}
          p(:title="listDetail.info.desc || selectListInfo.desc") {{listDetail.info.desc || selectListInfo.desc}}
        div(:class="$style.songListHeaderRight")
          base-btn(:class="$style.headerRightBtn" :disabled="detailLoading" @click="playSongListDetail") {{$t('list__play')}}
          base-btn(:class="$style.headerRightBtn" :disabled="detailLoading" @click="addSongListDetail") {{$t('list__collect')}}
          base-btn(:class="$style.headerRightBtn" @click="hideListDetail") {{$t('back')}}
      material-online-list(ref="songList" @toggle-page="handleToggleListDetailPage" :page="listDetail.page" :limit="listDetail.limit" :total="listDetail.total"
        :list="listDetail.list" :noItem="isGetDetailFailed ? $t('list__load_failed') : $t('list__loading')")
  transition(enter-active-class="animated-fast fadeIn" leave-active-class="animated-fast fadeOut")
    div(:class="$style.songListContainer" v-show="!isVisibleListDetail")
      div(:class="$style.header")
        tag-list(:class="$style.tagList" :list-width="listWidth" ref="tagList" :list="tagList" v-model="tagInfo")
        base-tab(:class="$style.tab" :list="sorts" item-key="id" ref="tab" item-name="name" v-model="sortId")
        base-select(:class="$style.select" :list="sourceInfo.sources" item-key="id" item-name="name" v-model="source")
      div(:class="$style.songListContent")
        transition(enter-active-class="animated-fast fadeIn" leave-active-class="animated-fast fadeOut")
          div(:class="$style.songListContent")
            transition(enter-active-class="animated-fast fadeIn" leave-active-class="animated-fast fadeOut")
              div.scroll(:class="$style.songList" v-if="sortId !== 'importSongList'" ref="dom_scrollContent")
                ul
                  li(:class="$style.item" v-for="(item, index) in listData.list" @click="handleItemClick(index)")
                    div(:class="$style.left" :style="{ backgroundImage: 'url('+item.img+')' }")
                      //- img(:src="item.img")
                    div(:class="$style.right" :src="item.img")
                      h4 {{item.name}}
                      p(:class="$style.play_count") {{item.play_count}}
                      p(:class="$style.author") {{item.author}}
                  li(:class="$style.item" style="cursor: default;" v-for="i in spaceNum")
                div(:class="$style.pagination")
                  material-pagination(:count="listData.total" :limit="listData.limit" :page="listData.page" @btn-click="handleToggleListPage")
            transition(enter-active-class="animated-fast fadeIn" leave-active-class="animated-fast fadeOut")
              div(:class="$style.importSongListContent" v-show="sortId === 'importSongList'")
                div(:style="{ width: '50%' }")
                  material-search-input(:class="$style.searchInput" v-model="importSongListText" @event="handleImportSongListEvent" big :placeholder="$t('songlist__import_input_tip')")
                    svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 451.846 451.847' space='preserve')
                      use(xlink:href='#icon-right')
                  div(:class="$style.tips")
                    ul
                      li {{$t('songlist__import_input_tip_1')}}
                      li {{$t('songlist__import_input_tip_2')}}
                      li {{$t('songlist__import_input_tip_3')}}
        transition(enter-active-class="animated-fast fadeIn" leave-active-class="animated-fast fadeOut")
          div(v-show="!listData.list.length && sortId !== 'importSongList'" :class="$style.noitem")
            p {{$t('list__loading')}}
</template>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex'
import { scrollTo } from '@renderer/utils'
import TagList from './components/TagList'
import { tempList } from '@renderer/core/share/list'
export default {
  name: 'SongList',
  components: {
    TagList,
  },
  data() {
    return {
      tagInfo: {
        name: this.$t('default'),
        id: null,
      },
      sortId: undefined,
      source: null,
      isShowDownload: false,
      musicInfo: null,
      isShowDownloadMultiple: false,
      isToggleSource: false,
      isShowListAdd: false,
      isShowListAddMultiple: false,
      importSongListText: '',
      listWidth: 645,
      isGetDetailFailed: false,
      isInitedTagListWidth: false,
      detailLoading: false,
    }
  },
  computed: {
    ...mapGetters(['setting']),
    ...mapGetters('songList', ['sourceInfo', 'tags', 'listData', 'isVisibleListDetail', 'selectListInfo', 'listDetail']),
    sorts() {
      let list
      list = this.source ? [...this.sourceInfo.sortList[this.source]] : []
      switch (this.source) {
        case 'wy':
        case 'kw':
        // case 'bd':
        case 'tx':
        case 'mg':
        case 'kg':
        case 'xm':
          list.push({
            name: this.$t('songlist__open_list', { name: this.sourceInfo.sources.find(s => s.id == this.source).name }),
            id: 'importSongList',
          })
      }
      return list
    },
    tagList() {
      let tagInfo = this.tags[this.source]
      return tagInfo ? [{ name: '热门标签', list: [...tagInfo.hotTag] }, ...tagInfo.tags] : []
    },
    spaceNum() {
      let num = this.listData.list ? this.listData.list.length % 3 : 0
      return num > 0 ? 3 - num : 0
    },
  },
  watch: {
    sortId(n, o) {
      this.setSongList({ sortId: n })
      if (o === undefined && this.listData.page !== 1) return
      if (n == 'importSongList') return
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
      if (this.sortId == 'importSongList') this.sortId = this.sorts[0] && this.sorts[0].id
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
      this.importSongListText = ''
      if (o) {
        this.isToggleSource = true
        this.tagInfo = {
          name: '默认',
          id: null,
        }
        this.sortId = this.sorts[0] && this.sorts[0].id
      }
    },
    'setting.themeId'() {
      this.setTagListWidth()
    },
  },
  mounted() {
    this.source = this.setting.songList.source
    this.isToggleSource = true
    this.tagInfo = this.setting.songList.tagInfo
    this.sortId = this.setting.songList.sortId
    if (!this.isVisibleListDetail) this.setTagListWidth()
    this.listenEvent()
  },
  beforeUnmount() {
    this.unlistenEvent()
  },
  methods: {
    ...mapMutations(['setSongList']),
    ...mapActions('songList', ['getTags', 'getList', 'getListDetail', 'getListDetailAll']),
    ...mapMutations('songList', ['setVisibleListDetail', 'setSelectListInfo']),
    ...mapActions('download', ['createDownload', 'createDownloadMultiple']),
    ...mapMutations('list', ['listAdd', 'listAddMultiple', 'createUserList']),
    ...mapMutations('player', {
      setTempList: 'setTempList',
      updateTempList: 'updateTempList',
      setTempPlayList: 'setTempPlayList',
    }),
    listenEvent() {
      window.eventHub.on('key_backspace_down', this.handle_key_backspace_down)
    },
    unlistenEvent() {
      window.eventHub.off('key_backspace_down', this.handle_key_backspace_down)
    },
    handle_key_backspace_down({ event }) {
      if (!this.isVisibleListDetail ||
        event.repeat ||
        this.isShowDownload ||
        this.isShowDownloadMultiple ||
        this.isShowListAdd ||
        this.isShowListAddMultiple ||
        event.target.classList.contains('key-bind')) return
      this.hideListDetail()
    },
    handleToggleListPage(page) {
      this.getList(page).then(() => {
        this.$nextTick(() => {
          scrollTo(this.$refs.dom_scrollContent, 0)
        })
      })
    },
    handleToggleListDetailPage(page) {
      this.handleGetListDetail(this.selectListInfo.id, page).then(() => {
        this.$nextTick(() => {
          this.$refs.songList.scrollToTop()
        })
      })
    },
    handleItemClick(index) {
      // this.detailLoading = true
      this.setSelectListInfo(this.listData.list[index])
      this.setVisibleListDetail(true)
      this.$nextTick(() => {
        this.handleGetListDetail(this.selectListInfo.id, 1)
      })
    },
    // handleFlowBtnClick(action) {
    //   switch (action) {
    //     case 'download':
    //       this.isShowDownloadMultiple = true
    //       break
    //     case 'play':
    //       this.testPlay()
    //       break
    //     case 'add':
    //       this.isShowListAddMultiple = true
    //       break
    //   }
    // },
    hideListDetail() {
      setTimeout(async() => {
        this.setVisibleListDetail(false)
        await this.$nextTick()
        this.setTagListWidth()
      }, 50)
    },
    handleImportSongListEvent({ action }) {
      switch (action) {
        case 'submit':
          this.handleGetSongListDetail()
          break
        // case 'blur':
        //   break
      }
    },
    handleGetSongListDetail() {
      if (!this.importSongListText.length) return
      this.setSelectListInfo({
        play_count: null,
        id: this.importSongListText,
        author: '',
        name: '',
        img: null,
        desc: '',
        source: this.source,
      })
      this.setVisibleListDetail(true)
      this.handleGetListDetail(this.importSongListText, 1)
    },
    setTagListWidth() {
      this.isInitedTagListWidth = true
      this.listWidth = this.$refs.tagList.$el.clientWidth + this.$refs.tab.$el.clientWidth + 2
    },
    handleGetListDetail(id, page) {
      this.isGetDetailFailed = false
      return this.getListDetail({ id, page }).catch(err => {
        this.isGetDetailFailed = true
        return Promise.reject(err)
      })
    },
    async fetchList() {
      this.detailLoading = true
      return this.getListDetailAll({ source: this.source, id: this.selectListInfo.id }).finally(() => {
        this.detailLoading = false
      })
    },
    async addSongListDetail() {
      // console.log(this.listDetail.info)
      // if (!this.listDetail.info.name) return
      const list = await this.fetchList()
      this.createUserList({
        name: this.listDetail.info.name || `${this.listDetail.source}-list`,
        id: `${this.listDetail.source}__${this.listDetail.id}`,
        list,
        source: this.listDetail.source,
        sourceListId: this.listDetail.id,
      })
    },
    async playSongListDetail() {
      if (!this.listDetail.info.name) return
      const id = `${this.listDetail.source}__${this.listDetail.id}`
      let isPlayingList = false
      if (this.listDetail.list?.length) {
        this.setTempList({
          list: [...this.listDetail.list],
          index: 0,
          id,
        })
        isPlayingList = true
      }
      const list = await this.fetchList()
      if (!list.length) return
      if (isPlayingList) {
        if (tempList.meta.id == id) {
          this.updateTempList({
            list,
            id,
          })
        }
      } else {
        this.setTempList({
          list,
          index: 0,
          id,
        })
      }
    },
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

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

.songListContainer, .song-list-detail-content, .songListContent, .importSongListContent {
  // flex: auto;
  overflow: hidden;
}

.songListContainer, .songListContent, .importSongListContent {
  position: relative;
  display: flex;
  flex-flow: column nowrap;
  height: 100%;
  // position: relative;
}

.importSongListContent {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  align-items: center;
  padding-top: 20%;
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
  height: 60px;
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  background-position: center;
  background-size: cover;
  opacity: .9;

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

.searchInput {
  width: 100%;
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

  .header-right-btn {
    border-radius: 0;
    &:first-child {
      border-top-left-radius: 4px;
      border-bottom-left-radius: 4px;
    }
    &:last-child {
      border-top-right-radius: 4px;
      border-bottom-right-radius: 4px;
    }
  }
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
  width: 88px;
  height: 88px;
  display: flex;
  background-position: center;
  background-size: cover;
  border-radius: 4px;
  overflow: hidden;
  opacity: .9;
  // box-shadow: 0 0 2px 0 rgba(0,0,0,.2);
}
.right {
  flex: auto;
  padding: 3px 15px 5px 7px;
  overflow: hidden;
  h4 {
    font-size: 14px;
    height: 2.6em;
    text-align: justify;
    line-height: 1.3;
    .mixin-ellipsis-2;
  }
}
.play_count {
  margin-top: 12px;
  font-size: 12px;
  .mixin-ellipsis-1;
  text-align: justify;
  line-height: 1.2;
  // text-indent: 24px;
  color: @color-theme_2-font-label;
}
.author {
  margin-top: 6px;
  font-size: 12px;
  .mixin-ellipsis-1;
  text-align: justify;
  line-height: 1.2;
  // text-indent: 24px;
  color: @color-theme_2-font-label;
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

.tips {
  padding: 15px 0;
  font-size: 12px;
  color: @color-theme_2-font;
  line-height: 1.5;
  ul {
    list-style: decimal;
    padding-left: 15px;
  }
}

each(@themes, {
  :global(#root.@{value}) {
    .song-list-header-middle {
      p {
        color: ~'@{color-@{value}-theme_2-font-label}';
      }
    }
    .right {
      p {
        color: ~'@{color-@{value}-theme_2-font-label}';
      }
    }
    .noitem {
      p {
        color: ~'@{color-@{value}-theme_2-font-label}';
      }
    }
    .tips {
      color: ~'@{color-@{value}-theme_2-font}';
    }
  }
})
</style>
