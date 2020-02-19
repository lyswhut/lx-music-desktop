<template lang="pug">
  div(:class="$style.list")
    //- transition
    div(v-if="delayShow && list.length" :class="$style.content")
      div(:class="$style.thead")
        table
          thead
            tr
              th.nobreak.center(style="width: 37px;")
                material-checkbox(id="search_select_all" v-model="isSelectAll" @change="handleSelectAllData"
                  :indeterminate="isIndeterminate" :title="isSelectAll && !isIndeterminate ? $t('view.list.unselect_all') : $t('view.list.select_all')")
              th.nobreak(style="width: 25%;") {{$t('view.list.name')}}
              th.nobreak(style="width: 20%;") {{$t('view.list.singer')}}
              th.nobreak(style="width: 20%;") {{$t('view.list.album')}}
              th.nobreak(style="width: 20%;") {{$t('view.list.action')}}
              th.nobreak(style="width: 10%;") {{$t('view.list.time')}}
      div.scroll(:class="$style.tbody" @scroll="handleScroll" ref="dom_scrollContent")
        table
          tbody(@contextmenu="handleContextMenu")
            tr(v-for='(item, index) in list' :key='item.songmid' :id="'mid_' + item.songmid"
              @click="handleDoubleClick($event, index)" :class="[isPlayList && playIndex === index ? $style.active : '', (isAPITemp && item.source != 'kw') ? $style.disabled : '']")
              td.nobreak.center(style="width: 37px;" @click.stop)
                  material-checkbox(:id="index.toString()" v-model="selectdData" :value="item")
              td.break(style="width: 25%;")
                span.select {{item.name}}
                span(:class="$style.labelSource" v-if="isShowSource") {{item.source}}
                //- span.badge.badge-light(v-if="item._types['128k']") 128K
                //- span.badge.badge-light(v-if="item._types['192k']") 192K
                //- span.badge.badge-secondary(v-if="item._types['320k']") 320K
                //- span.badge.badge-theme-info(v-if="item._types.ape") APE
                //- span.badge.badge-theme-success(v-if="item._types.flac") FLAC
              td.break(style="width: 20%;")
                span.select {{item.singer}}
              td.break(style="width: 20%;")
                span.select {{item.albumName}}
              td(style="width: 20%; padding-left: 0; padding-right: 0;")
                material-list-buttons(:index="index" @btn-click="handleListBtnClick")
                //- button.btn-info(type='button' v-if="item._types['128k'] || item._types['192k'] || item._types['320k'] || item._types.flac" @click.stop='openDownloadModal(index)') 下载
                //- button.btn-secondary(type='button' v-if="item._types['128k'] || item._types['192k'] || item._types['320k']" @click.stop='testPlay(index)') 试听
                //- button.btn-secondary(type='button' @click.stop='handleRemove(index)') 删除
                //- button.btn-success(type='button' v-if="(item._types['128k'] || item._types['192k'] || item._types['320k']) && userInfo" @click.stop='showListModal(index)') ＋
              td(style="width: 10%;")
                span(:class="$style.time") {{item.interval || '--/--'}}
    div(:class="$style.noItem" v-else)
      p(v-text="list.length ? $t('view.list.loding_list') : $t('view.list.no_item')")
    material-download-modal(:show="isShowDownload" :musicInfo="musicInfo" @select="handleAddDownload" @close="isShowDownload = false")
    material-download-multiple-modal(:show="isShowDownloadMultiple" :list="selectdData" @select="handleAddDownloadMultiple" @close="isShowDownloadMultiple = false")
    material-flow-btn(:show="isShowEditBtn" :play-btn="false" @btn-click="handleFlowBtnClick")
    material-list-add-modal(:show="isShowListAdd" :musicInfo="musicInfo" :exclude-list-id="excludeListId" @close="isShowListAdd = false")
    material-list-add-multiple-modal(:show="isShowListAddMultiple" :musicList="selectdData" :exclude-list-id="excludeListId" @close="handleListAddModalClose")
</template>

<script>
import { mapMutations, mapGetters, mapActions } from 'vuex'
import { throttle, asyncSetArray, scrollTo, clipboardWriteText } from '../utils'
export default {
  name: 'List',
  data() {
    return {
      listId: null,
      clickTime: window.performance.now(),
      clickIndex: -1,
      isShowDownload: false,
      musicInfo: null,
      selectdData: [],
      isSelectAll: false,
      isIndeterminate: false,
      isShowEditBtn: false,
      isShowDownloadMultiple: false,
      delayShow: false,
      routeLeaveLocation: null,
      isShowListAdd: false,
      isShowListAddMultiple: false,
      delayTimeout: null,
      isToggleList: true,
    }
  },
  computed: {
    ...mapGetters(['userInfo', 'setting']),
    ...mapGetters('list', ['defaultList', 'loveList', 'userList']),
    ...mapGetters('player', {
      playerListId: 'listId',
      playIndex: 'playIndex',
    }),
    isPlayList() {
      return this.playerListId == this.listId
    },
    list() {
      return this.listData.list
    },
    isAPITemp() {
      return this.setting.apiSource == 'temp'
    },
    listData() {
      if (!this.listId) return this.defaultList
      let targetList
      switch (this.listId) {
        case 'default':
          targetList = this.defaultList
          break
        case 'love':
          targetList = this.loveList
          break
        default:
          targetList = this.userList.find(l => l.id === this.listId)
          break
      }
      return targetList
    },
    excludeListId() {
      return [this.listId]
    },
    isShowSource() {
      return this.setting.list.isShowSource
    },
  },
  watch: {
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
    '$route.query.scrollIndex'(n) {
      if (n == null || this.isToggleList) return
      this.restoreScroll(true)
      this.isToggleList = true
    },
  },
  beforeRouteUpdate(to, from, next) {
    if (to.query.id == null) return
    else if (to.query.id == this.listId) {
      if (to.query.scrollIndex != null) this.isToggleList = false
      return next()
    }
    this.delayShow = false
    this.$nextTick(() => {
      this.listId = to.query.id
      this.$nextTick(() => {
        this.handleDelayShow()
      })
    })
    next()
  },
  // mounted() {
  // console.log('mounted')
  // if (this.$route.query.text === undefined) {
  //   let info = this.$store.getters['search/info']
  //   this.text = info.text
  //   this.page = info.page
  // } else if (this.$route.query.text === '') {
  //   this.clearList()
  // } else {
  //   this.text = this.$route.query.text
  //   this.page = 1
  //   this.handleSearch(this.text, this.page)
  // }
  // },
  beforeRouteLeave(to, from, next) {
    this.clearDelayTimeout()
    this.routeLeaveLocation = (this.list.length && this.$refs.dom_scrollContent.scrollTop) || 0
    next()
  },
  created() {
    this.listId = this.$route.query.id
    this.handleScroll = throttle(e => {
      if (this.routeLeaveLocation) {
        this.setListScroll({ id: this.listId, location: this.routeLeaveLocation })
      } else {
        this.setListScroll({ id: this.listId, location: e.target.scrollTop })
      }
    }, 1000)
  },
  mounted() {
    this.handleDelayShow()
  },
  methods: {
    ...mapMutations(['setListScroll']),
    ...mapMutations('list', ['listRemove', 'listRemoveMultiple']),
    ...mapActions('download', ['createDownload', 'createDownloadMultiple']),
    ...mapMutations('player', {
      setPlayList: 'setList',
    }),
    handleDelayShow() {
      this.clearDelayTimeout()
      if (this.list.length > 150) {
        this.delayTimeout = setTimeout(() => {
          this.delayTimeout = null
          this.delayShow = true
          this.restoreScroll()
        }, 200)
      } else {
        this.delayShow = true
        this.restoreScroll()
      }
    },
    clearDelayTimeout() {
      if (this.delayTimeout) {
        clearTimeout(this.delayTimeout)
        this.delayTimeout = null
      }
    },
    restoreScroll(isAnimation) {
      if (!this.list.length) return
      if (this.$route.query.scrollIndex == null) {
        let location = this.setting.list.scroll.locations[this.listId]
        if (this.setting.list.scroll.enable && location) {
          this.$nextTick(() => {
            this.$refs.dom_scrollContent.scrollTo(0, location)
          })
        }
        return
      }

      this.$nextTick(() => {
        let location = this.getMusicLocation(this.$route.query.scrollIndex) - 150
        if (location < 0) location = 0
        isAnimation ? scrollTo(this.$refs.dom_scrollContent, location) : this.$refs.dom_scrollContent.scrollTo(0, location)
        this.$router.replace({
          path: 'list',
          query: {
            id: this.listId,
          },
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
    testPlay(index) {
      if (this.isAPITemp && this.list[index].source != 'kw') return
      this.setPlayList({ list: this.list, listId: this.listId, index })
    },
    handleRemove(index) {
      this.listRemove({ id: this.listId, index })
    },
    handleListBtnClick(info) {
      switch (info.action) {
        case 'download': {
          const minfo = this.list[info.index]
          if (this.isAPITemp && minfo.source != 'kw') return
          this.musicInfo = minfo
          this.$nextTick(() => {
            this.isShowDownload = true
          })
          break
        }
        case 'play':
          this.testPlay(info.index)
          break
        case 'remove':
          this.handleRemove(info.index)
          break
        case 'listAdd':
          this.musicInfo = this.list[info.index]
          this.$nextTick(() => {
            this.isShowListAdd = true
          })
          break
      }
    },
    handleAddDownload(type) {
      this.createDownload({ musicInfo: this.musicInfo, type })
      this.isShowDownload = false
    },
    handleSelectAllData(isSelect) {
      asyncSetArray(this.selectdData, isSelect ? [...this.list] : [])
    },
    resetSelect() {
      this.isSelectAll = false
      this.selectdData = []
    },
    handleAddDownloadMultiple(type) {
      const list = this.setting.apiSource == 'temp' ? this.selectdData.filter(s => s.source == 'kw') : [...this.selectdData]
      this.createDownloadMultiple({ list, type })
      this.resetSelect()
      this.isShowDownloadMultiple = false
    },
    handleFlowBtnClick(action) {
      switch (action) {
        case 'download':
          this.isShowDownloadMultiple = true
          break
        case 'remove':
          this.listRemoveMultiple({ id: this.listId, list: this.selectdData })
          this.resetSelect()
          break
        case 'add':
          this.isShowListAddMultiple = true
          break
      }
    },
    handleListAddModalClose(isSelect) {
      if (isSelect) this.resetSelect()
      this.isShowListAddMultiple = false
    },
    getMusicLocation(index) {
      let dom = document.getElementById('mid_' + this.list[index].songmid)
      return dom ? dom.offsetTop : 0
    },
    // handleScroll(e) {
    //   console.log(e.target.scrollTop)
    // },
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
  },
}
</script>

<style lang="less" module>
@import '../assets/styles/layout.less';

.list {
  overflow: hidden;
  height: 100%;
  // .noItem {

  // }
}
.content {
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
  }
  tr {
    &.active {
      color: @color-theme;
    }
  }

  &.copying {
    .labelSource, .time {
      display: none;
    }
  }
}

.labelSource {
  color: @color-theme;
  padding: 5px;
  font-size: .8em;
  line-height: 1;
  opacity: .75;
}

.disabled {
  opacity: .5;
}

.no-item {
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
    .tbody {
      tr {
        &.active {
          color: ~'@{color-@{value}-theme}';
        }
      }
    }
    .labelSource {
      color: ~'@{color-@{value}-theme}';
    }
    .no-item {
      p {
        color: ~'@{color-@{value}-theme_2-font-label}';
      }
    }
  }
})

</style>
