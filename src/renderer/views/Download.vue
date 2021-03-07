<template lang="pug">
div(:class="$style.download")
  //- transition
  div(:class="$style.header")
    material-tab(:class="$style.tab" :list="tabs" align="left" item-key="id" item-name="name" @change="handleTabChange" v-model="tabId")
  div(:class="$style.content" v-if="list.length")
    div(:class="$style.thead")
      table
        thead
          tr
            th.nobreak.center(style="width: 5%;") #
            th.nobreak {{$t('view.download.name')}}
            th.nobreak(style="width: 20%;") {{$t('view.download.progress')}}
            th.nobreak(style="width: 22%;") {{$t('view.download.status')}}
            th.nobreak(style="width: 10%;") {{$t('view.download.quality')}}
            th.nobreak(style="width: 13%;") {{$t('view.download.action')}}
    div.scroll(v-if="list.length" :class="$style.tbody" ref="dom_scrollContent")
      table
        tbody(ref="dom_tbody")
          tr(v-for='(item, index) in showList' :key='item.key' @contextmenu="handleListItemRigthClick($event, index)" @click="handleDoubleClick($event, index)" :class="playListIndex === index ? $style.active : ''")
            td.nobreak.center(style="width: 5%; padding-left: 3px; padding-right: 3px;" @click.stop) {{index + 1}}
            td.break
              span.select {{item.musicInfo.name}} - {{item.musicInfo.singer}}
            td.break(style="width: 20%;") {{item.progress.progress}}%
            td.break(style="width: 22%;") {{item.statusText}}
            td.break(style="width: 10%;") {{item.type && item.type.toUpperCase()}}
            td(style="width: 13%; padding-left: 0; padding-right: 0;")
              material-list-buttons(:index="index" :download-btn="false" :file-btn="item.status != downloadStatus.ERROR" remove-btn
                :start-btn="!item.isComplate && item.status != downloadStatus.WAITING && (item.status != downloadStatus.RUN)"
                :pause-btn="!item.isComplate && (item.status == downloadStatus.RUN || item.status == downloadStatus.WAITING)" :list-add-btn="false"
                :play-btn="item.status == downloadStatus.COMPLETED" :search-btn="item.status == downloadStatus.ERROR" @btn-click="handleListBtnClick")
    material-menu(:menus="listItemMenu" :location="listMenu.menuLocation" item-name="name" :isShow="listMenu.isShowItemMenu" @menu-click="handleListItemMenuClick")
  div(:class="$style.noItem" v-else)
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
import { checkPath, openDirInExplorer, openUrl } from '../utils'
import musicSdk from '../utils/music'
import path from 'path'

export default {
  name: 'Download',
  data() {
    return {
      clickTime: window.performance.now(),
      clickIndex: -1,
      selectedData: [],
      isShowDownloadMultiple: false,
      tabId: 'all',
      keyEvent: {
        isShiftDown: false,
        isModDown: false,
      },
      lastSelectIndex: 0,
      listMenu: {
        isShowItemMenu: false,
        itemMenuControl: {
          play: true,
          start: true,
          pause: true,
          playLater: true,
          file: true,
          search: true,
          remove: true,
          sourceDetail: true,
        },
        menuLocation: {
          x: 0,
          y: 0,
        },
      },
    }
  },
  computed: {
    ...mapGetters(['setting']),
    ...mapGetters('download', ['list', 'downloadStatus']),
    ...mapGetters('player', ['playInfo']),
    isPlayList() {
      return this.playInfo.listId == 'download'
    },
    playListIndex() {
      if (this.playInfo.listId != 'download' || !this.list.length) return
      let info = this.list[this.playInfo.playIndex]
      if (!info) return -1
      let key = info.key
      return this.showList.findIndex(i => i.key == key)
    },
    showList() {
      switch (this.tabId) {
        case 'runing':
          return this.list.filter(i => i.status == this.downloadStatus.RUN || i.status == this.downloadStatus.WAITING)
        case 'paused':
          return this.list.filter(i => i.status == this.downloadStatus.PAUSE)
        case 'error':
          return this.list.filter(i => i.status == this.downloadStatus.ERROR)
        case 'finished':
          return this.list.filter(i => i.status == this.downloadStatus.COMPLETED)
        default:
          return this.list
      }
    },
    tabs() {
      return [
        {
          name: this.$t('view.download.all'),
          id: 'all',
        },
        {
          name: this.$t('view.download.runing'),
          id: 'runing',
        },
        {
          name: this.$t('view.download.paused'),
          id: 'paused',
        },
        {
          name: this.$t('view.download.error'),
          id: 'error',
        },
        {
          name: this.$t('view.download.finished'),
          id: 'finished',
        },
      ]
    },
    listItemMenu() {
      return [
        {
          name: this.$t('view.download.menu_play'),
          action: 'play',
          hide: !this.listMenu.itemMenuControl.play,
        },
        {
          name: this.$t('view.download.menu_start'),
          action: 'start',
          hide: !this.listMenu.itemMenuControl.start,
        },
        {
          name: this.$t('view.download.menu_pause'),
          action: 'pause',
          hide: !this.listMenu.itemMenuControl.pause,
        },
        {
          name: this.$t('view.download.menu_play_later'),
          action: 'playLater',
          hide: !this.listMenu.itemMenuControl.playLater,
        },
        {
          name: this.$t('view.download.menu_file'),
          action: 'file',
          hide: !this.listMenu.itemMenuControl.file,
        },
        {
          name: this.$t('view.download.menu_source_detail'),
          action: 'sourceDetail',
          disabled: !this.listMenu.itemMenuControl.sourceDetail,
        },
        {
          name: this.$t('view.download.menu_search'),
          action: 'search',
          hide: !this.listMenu.itemMenuControl.search,
        },
        {
          name: this.$t('view.download.menu_remove'),
          action: 'remove',
          hide: !this.listMenu.itemMenuControl.remove,
        },
      ]
    },
  },
  watch: {
    list() {
      this.removeAllSelect()
    },
  },
  created() {
    this.listenEvent()
  },
  beforeDestroy() {
    this.unlistenEvent()
  },
  methods: {
    ...mapActions('download', ['removeTask', 'removeTasks', 'startTask', 'startTasks', 'pauseTask', 'pauseTasks']),
    ...mapMutations('player', ['setList']),
    listenEvent() {
      window.eventHub.$on('key_shift_down', this.handle_key_shift_down)
      window.eventHub.$on('key_shift_up', this.handle_key_shift_up)
      window.eventHub.$on('key_mod_down', this.handle_key_mod_down)
      window.eventHub.$on('key_mod_up', this.handle_key_mod_up)
      window.eventHub.$on('key_mod+a_down', this.handle_key_mod_a_down)
    },
    unlistenEvent() {
      window.eventHub.$off('key_shift_down', this.handle_key_shift_down)
      window.eventHub.$off('key_shift_up', this.handle_key_shift_up)
      window.eventHub.$off('key_mod_down', this.handle_key_mod_down)
      window.eventHub.$off('key_mod_up', this.handle_key_mod_up)
      window.eventHub.$off('key_mod+a_down', this.handle_key_mod_a_down)
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
    handle_key_mod_a_down({ event }) {
      if (event.target.tagName == 'INPUT') return
      event.preventDefault()
      if (event.repeat) return
      this.keyEvent.isModDown = false
      this.handleSelectAllData()
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
      this.handleClick(index)
      this.clickTime = 0
      this.clickIndex = -1
    },
    handleSelectData(event, clickIndex) {
      if (this.keyEvent.isShiftDown) {
        if (this.selectedData.length) {
          let lastSelectIndex = this.lastSelectIndex
          this.removeAllSelect()
          if (lastSelectIndex != clickIndex) {
            let isNeedReverse = false
            if (clickIndex < lastSelectIndex) {
              let temp = lastSelectIndex
              lastSelectIndex = clickIndex
              clickIndex = temp
              isNeedReverse = true
            }
            this.selectedData = this.showList.slice(lastSelectIndex, clickIndex + 1)
            if (isNeedReverse) this.selectedData.reverse()
            let nodes = this.$refs.dom_tbody.childNodes
            do {
              nodes[lastSelectIndex].classList.add('active')
              lastSelectIndex++
            } while (lastSelectIndex <= clickIndex)
          }
        } else {
          event.currentTarget.classList.add('active')
          this.selectedData.push(this.showList[clickIndex])
          this.lastSelectIndex = clickIndex
        }
      } else if (this.keyEvent.isModDown) {
        this.lastSelectIndex = clickIndex
        let item = this.showList[clickIndex]
        let index = this.selectedData.indexOf(item)
        if (index < 0) {
          this.selectedData.push(item)
          event.currentTarget.classList.add('active')
        } else {
          this.selectedData.splice(index, 1)
          event.currentTarget.classList.remove('active')
        }
      } else if (this.selectedData.length) this.removeAllSelect()
    },
    removeAllSelect() {
      this.selectedData = []
      let dom_tbody = this.$refs.dom_tbody
      if (!dom_tbody) return
      let nodes = dom_tbody.querySelectorAll('.active')
      for (const node of nodes) {
        if (node.parentNode == dom_tbody) node.classList.remove('active')
      }
    },
    handleClick(index) {
      const key = this.showList[index].key
      index = this.list.findIndex(i => i.key === key)
      let info = this.list[index]
      if (info.isComplate) {
        this.handlePlay(info)
      } else if (info.status === this.downloadStatus.RUN) {
        this.handlePauseTask(index)
      } else {
        this.handleStartTask(index)
      }
    },
    async handlePlay(targetSong) {
      if (!await checkPath(path.join(this.setting.download.savePath, targetSong.fileName))) return
      this.setList({ list: { list: this.list, id: 'download' }, index: this.list.findIndex(i => i.key === targetSong.key) })
    },
    handleListBtnClick(info) {
      let item = this.showList[info.index]
      switch (info.action) {
        case 'play':
          this.handlePlay(item)
          break
        case 'start':
          this.startTask(item)
          break
        case 'pause':
          this.pauseTask(item)
          break
        case 'remove':
          this.removeTask(item)
          break
        case 'playLater':
          if (this.selectedData.length) {
            this.setTempPlayList(this.selectedData.map(s => ({ listId: 'download', musicInfo: s })))
            this.removeAllSelect()
          } else {
            this.setTempPlayList([{ listId: 'download', musicInfo: item }])
          }
          break
        case 'file':
          this.handleOpenFolder(item.filePath)
          break
        case 'search':
          this.handleSearch(item.musicInfo)
          break
      }
    },
    handleSelectAllData() {
      this.removeAllSelect()
      this.selectedData = [...this.showList]

      let nodes = this.$refs.dom_tbody.childNodes
      for (const node of nodes) {
        node.classList.add('active')
      }
    },
    // async handleFlowBtnClick(action) {
    //   let selectedData = [...this.selectedData]
    //   this.removeAllSelect()
    //   await this.$nextTick()

    //   switch (action) {
    //     case 'start':
    //       this.startTasks(selectedData)
    //       break
    //     case 'pause':
    //       this.pauseTasks(selectedData)
    //       break
    //     case 'remove':
    //       this.removeTasks(selectedData)
    //       break
    //   }
    // },
    async handleOpenFolder(filePath) {
      if (!await checkPath(filePath)) return
      openDirInExplorer(filePath)
    },
    handleSearch(musicInfo) {
      this.$router.push({
        path: 'search',
        query: {
          text: `${musicInfo.name} ${musicInfo.singer}`,
        },
      })
    },
    handleTabChange() {
      this.selectedData = []
    },
    handleListItemRigthClick(event, index) {
      this.listMenu.itemMenuControl.sourceDetail = !!musicSdk[this.showList[index].musicInfo.source].getMusicDetailPageUrl
      let dom_selected = this.$refs.dom_tbody.querySelector('tr.selected')
      if (dom_selected) dom_selected.classList.remove('selected')
      this.$refs.dom_tbody.querySelectorAll('tr')[index].classList.add('selected')
      let dom_td = event.target.closest('td')
      this.listMenu.rightClickItemIndex = index
      this.listMenu.menuLocation.x = dom_td.offsetLeft + event.offsetX
      this.listMenu.menuLocation.y = dom_td.offsetTop + event.offsetY - this.$refs.dom_scrollContent.scrollTop

      let item = this.showList[index]
      if (item.isComplate) {
        this.listMenu.itemMenuControl.play =
        this.listMenu.itemMenuControl.playLater =
        this.listMenu.itemMenuControl.file = true
        this.listMenu.itemMenuControl.start =
        this.listMenu.itemMenuControl.pause = false
      } else if (item.status === this.downloadStatus.ERROR || item.status === this.downloadStatus.PAUSE) {
        this.listMenu.itemMenuControl.play =
        this.listMenu.itemMenuControl.playLater =
        this.listMenu.itemMenuControl.pause =
        this.listMenu.itemMenuControl.file = false
        this.listMenu.itemMenuControl.start = true
      } else {
        this.listMenu.itemMenuControl.play =
        this.listMenu.itemMenuControl.playLater =
        this.listMenu.itemMenuControl.start =
        this.listMenu.itemMenuControl.file = false
        this.listMenu.itemMenuControl.pause = true
      }

      this.$nextTick(() => {
        this.listMenu.isShowItemMenu = true
      })
    },
    hideListMenu() {
      let dom_selected = this.$refs.dom_tbody && this.$refs.dom_tbody.querySelector('tr.selected')
      if (dom_selected) dom_selected.classList.remove('selected')
      this.listMenu.isShowItemMenu = false
      this.listMenu.rightClickItemIndex = -1
    },
    handleListItemMenuClick(action) {
      // console.log(action)
      let index = this.listMenu.rightClickItemIndex
      this.hideListMenu()
      // let key
      let item
      let url

      switch (action && action.action) {
        case 'play':
          item = this.showList[index]
          if (item) this.handlePlay(item)
          break
        case 'start':
          if (this.selectedData.length) {
            let selectedData = [...this.selectedData]
            this.removeAllSelect()
            this.startTasks(selectedData)
          } else {
            item = this.showList[index]
            if (item) this.startTask(item)
            this.$nextTick(() => {
              this.isShowDownload = true
            })
          }
          break
        case 'pause':
          if (this.selectedData.length) {
            let selectedData = [...this.selectedData]
            this.removeAllSelect()
            this.pauseTasks(selectedData)
          } else {
            item = this.showList[index]
            if (item) this.pauseTask(item)
            this.$nextTick(() => {
              this.isShowDownload = true
            })
          }
          break
        case 'file':
          item = this.showList[index]
          // key = item.key
          // index = this.list.findIndex(i => i.key === key)
          if (item) this.handleOpenFolder(item.filePath)
          break
        case 'search':
          item = this.showList[index]
          if (item) this.handleSearch(item.musicInfo)
          break
        case 'remove':
          if (this.selectedData.length) {
            let selectedData = [...this.selectedData]
            this.removeAllSelect()
            this.removeTasks(selectedData)
          } else {
            item = this.showList[index]
            if (item) this.removeTask(item)
            this.$nextTick(() => {
              this.isShowDownload = true
            })
          }
          break
        case 'sourceDetail':
          item = this.showList[index].musicInfo
          url = musicSdk[item.source].getMusicDetailPageUrl(item)
          if (!url) return
          openUrl(url)
      }
    },
  },
}
</script>

<style lang="less" module>
@import '../assets/styles/layout.less';

.download {
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  // .noItem {

    // }
}
.header {
  flex: none;
}

.content {
  height: 100%;
  font-size: 14px;
  display: flex;
  flex-flow: column nowrap;
  flex: auto;
  overflow: hidden;
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
  td {
    font-size: 12px;
    &:first-child {
      // padding-left: 10px;
      font-size: 11px;
      color: @color-theme_2-font-label;
    }
  }
  tr {
    &.active {
      color: @color-btn;
    }
  }
}

each(@themes, {
  :global(#container.@{value}) {
    .tbody {
      tr {
        &.active {
          color: ~'@{color-@{value}-btn}';
        }
      }
      td {
        &:first-child {
          color: ~'@{color-@{value}-theme_2-font-label}';
        }
      }
    }
  }
})
</style>
