<template lang="pug">
  div(:class="$style.list")
    //- transition
    div(v-if="delayShow && list.length" :class="$style.content")
      div(:class="$style.thead")
        table
          thead
            tr
              th.nobreak.center(style="width: 10px;") #
              th.nobreak(style="width: 25%;") {{$t('view.list.name')}}
              th.nobreak(style="width: 20%;") {{$t('view.list.singer')}}
              th.nobreak(style="width: 20%;") {{$t('view.list.album')}}
              th.nobreak(style="width: 20%;") {{$t('view.list.action')}}
              th.nobreak(style="width: 10%;") {{$t('view.list.time')}}
      div.scroll(:class="$style.tbody" @scroll="handleScroll" ref="dom_scrollContent")
        table
          tbody(@contextmenu="handleContextMenu" ref="dom_tbody")
            tr(v-for='(item, index) in list' :key='item.songmid' :id="'mid_' + item.songmid"
              @click="handleDoubleClick($event, index)" :class="[isPlayList && playIndex === index ? $style.active : '', assertApiSupport(item.source) ? null : $style.disabled]")
              td.nobreak.center(style="width: 37px;" :class="$style.noSelect" @click.stop) {{index + 1}}
              td.break(style="width: 25%;")
                span.select {{item.name}}
                span(:class="[$style.labelSource, $style.noSelect]" v-if="isShowSource") {{item.source}}
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
                span(:class="[$style.time, $style.noSelect]") {{item.interval || '--/--'}}
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
import { throttle, scrollTo, clipboardWriteText, assertApiSupport } from '../utils'
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
      isShowEditBtn: false,
      isShowDownloadMultiple: false,
      delayShow: false,
      routeLeaveLocation: null,
      isShowListAdd: false,
      isShowListAddMultiple: false,
      delayTimeout: null,
      isToggleList: true,
      keyEvent: {
        isShiftDown: false,
        isModDown: false,
        isADown: false,
        aDownTimeout: null,
      },
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
        this.isShowEditBtn = true
      } else {
        this.isShowEditBtn = false
      }
    },
    list() {
      this.removeAllSelect()
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
    this.listenEvent()
  },
  mounted() {
    this.handleDelayShow()
  },
  beforeDestroy() {
    this.unlistenEvent()
  },
  methods: {
    ...mapMutations(['setListScroll']),
    ...mapMutations('list', ['listRemove', 'listRemoveMultiple']),
    ...mapActions('download', ['createDownload', 'createDownloadMultiple']),
    ...mapMutations('player', {
      setPlayList: 'setList',
    }),
    listenEvent() {
      window.eventHub.$on('key_shift_down', this.handle_key_shift_down)
      window.eventHub.$on('key_shift_up', this.handle_key_shift_up)
      window.eventHub.$on('key_mod_down', this.handle_key_mod_down)
      window.eventHub.$on('key_mod_up', this.handle_key_mod_up)
      window.eventHub.$on('key_mod+a_down', this.handle_key_mod_a_down)
      window.eventHub.$on('key_mod+a_up', this.handle_key_mod_a_up)
    },
    unlistenEvent() {
      window.eventHub.$off('key_shift_down', this.handle_key_shift_down)
      window.eventHub.$off('key_shift_up', this.handle_key_shift_up)
      window.eventHub.$off('key_mod_down', this.handle_key_mod_down)
      window.eventHub.$off('key_mod_up', this.handle_key_mod_up)
      window.eventHub.$off('key_mod+a_down', this.handle_key_mod_a_down)
      window.eventHub.$off('key_mod+a_up', this.handle_key_mod_a_up)
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
    handle_key_mod_a_down() {
      if (!this.keyEvent.isADown) {
        this.keyEvent.isModDown = false
        this.keyEvent.isADown = true
        this.handleSelectAllData()
        if (this.keyEvent.aDownTimeout) clearTimeout(this.keyEvent.aDownTimeout)
        this.keyEvent.aDownTimeout = setTimeout(() => {
          this.keyEvent.aDownTimeout = null
          this.keyEvent.isADown = false
        }, 500)
      }
    },
    handle_key_mod_a_up() {
      if (this.keyEvent.isADown) {
        if (this.keyEvent.aDownTimeout) {
          clearTimeout(this.keyEvent.aDownTimeout)
          this.keyEvent.aDownTimeout = null
        }
        this.keyEvent.isADown = false
      }
    },
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

      this.handleSelectData(event, index)

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
    handleSelectData(event, clickIndex) {
      if (this.keyEvent.isShiftDown) {
        if (this.selectdData.length) {
          let lastSelectIndex = this.list.indexOf(this.selectdData[this.selectdData.length - 1])
          if (lastSelectIndex == clickIndex) return this.removeAllSelect()
          this.removeAllSelect()
          let isNeedReverse = false
          if (clickIndex < lastSelectIndex) {
            let temp = lastSelectIndex
            lastSelectIndex = clickIndex
            clickIndex = temp
            isNeedReverse = true
          }
          this.selectdData = this.list.slice(lastSelectIndex, clickIndex + 1)
          if (isNeedReverse) this.selectdData.reverse()
          let nodes = this.$refs.dom_tbody.childNodes
          do {
            nodes[lastSelectIndex].classList.add('active')
            lastSelectIndex++
          } while (lastSelectIndex <= clickIndex)
        } else {
          event.currentTarget.classList.add('active')
          this.selectdData.push(this.list[clickIndex])
        }
      } else if (this.keyEvent.isModDown) {
        let item = this.list[clickIndex]
        let index = this.selectdData.indexOf(item)
        if (index < 0) {
          this.selectdData.push(item)
          event.currentTarget.classList.add('active')
        } else {
          this.selectdData.splice(index, 1)
          event.currentTarget.classList.remove('active')
        }
      } else if (this.selectdData.length) this.removeAllSelect()
    },
    removeAllSelect() {
      this.selectdData = []
      let dom_tbody = this.$refs.dom_tbody
      if (!dom_tbody) return
      let nodes = dom_tbody.querySelectorAll('.active')
      for (const node of nodes) {
        if (node.parentNode == dom_tbody) node.classList.remove('active')
      }
    },
    testPlay(index) {
      if (!this.assertApiSupport(this.list[index].source)) return
      this.setPlayList({ list: this.list, listId: this.listId, index })
    },
    handleRemove(index) {
      this.listRemove({ id: this.listId, index })
    },
    handleListBtnClick(info) {
      switch (info.action) {
        case 'download': {
          const minfo = this.list[info.index]
          if (!this.assertApiSupport(minfo.source)) return
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
    handleSelectAllData() {
      this.removeAllSelect()
      this.selectdData = [...this.list]
      let nodes = this.$refs.dom_tbody.childNodes
      for (const node of nodes) {
        node.classList.add('active')
      }
      // asyncSetArray(this.selectdData, isSelect ? [...this.list] : [])
    },
    handleAddDownloadMultiple(type) {
      const list = this.selectdData.filter(s => this.assertApiSupport(s.source))
      this.createDownloadMultiple({ list, type })
      this.removeAllSelect()
      this.isShowDownloadMultiple = false
    },
    handleFlowBtnClick(action) {
      switch (action) {
        case 'download':
          this.isShowDownloadMultiple = true
          break
        case 'remove':
          this.listRemoveMultiple({ id: this.listId, list: this.selectdData })
          this.removeAllSelect()
          break
        case 'add':
          this.isShowListAddMultiple = true
          break
      }
    },
    handleListAddModalClose(isClearSelect) {
      if (isClearSelect) this.removeAllSelect()
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
    assertApiSupport(source) {
      return assertApiSupport(source)
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
  tr > th:first-child {
    color: @color-theme_2-font-label;
    // padding-left: 10px;
  }
}
.tbody {
  flex: auto;
  overflow-y: auto;

  tr {
    &.active {
      color: @color-theme;
    }
  }
  td {
    font-size: 12px;

    &:first-child {
      // padding-left: 10px;
      font-size: 11px;
      color: @color-theme_2-font-label;
    }
  }

  &.copying {
    .no-select {
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
      td {
        &:first-child {
          color: ~'@{color-@{value}-theme_2-font-label}';
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
