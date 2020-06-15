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
            th.nobreak.center(style="width: 10px;") #
            th.nobreak(style="width: 28%;") {{$t('view.download.name')}}
            th.nobreak(style="width: 22%;") {{$t('view.download.progress')}}
            th.nobreak(style="width: 15%;") {{$t('view.download.status')}}
            th.nobreak(style="width: 10%;") {{$t('view.download.quality')}}
            th.nobreak(style="width: 20%;") {{$t('view.download.action')}}
    div.scroll(v-if="list.length" :class="$style.tbody")
      table
        tbody(ref="dom_tbody")
          tr(v-for='(item, index) in showList' :key='item.key' @click="handleDoubleClick($event, index)" :class="playListIndex === index ? $style.active : ''")
            td.nobreak.center(style="width: 37px;" @click.stop) {{index + 1}}
            td.break(style="width: 28%;")
              span.select {{item.musicInfo.name}} - {{item.musicInfo.singer}}
            td.break(style="width: 22%;") {{item.progress.progress}}%
            td.break(style="width: 15%;") {{item.statusText}}
            td.break(style="width: 10%;") {{item.type && item.type.toUpperCase()}}
            td(style="width: 20%; padding-left: 0; padding-right: 0;")
              material-list-buttons(:index="index" :download-btn="false" :file-btn="item.status != downloadStatus.ERROR"
                :start-btn="!item.isComplate && item.status != downloadStatus.WAITING && (item.status != downloadStatus.RUN)"
                :pause-btn="!item.isComplate && (item.status == downloadStatus.RUN || item.status == downloadStatus.WAITING)" :list-add-btn="false"
                :play-btn="item.status == downloadStatus.COMPLETED" :search-btn="item.status == downloadStatus.ERROR" @btn-click="handleListBtnClick")
    material-flow-btn(:show="isShowEditBtn" :play-btn="false" :download-btn="false" :add-btn="false" :start-btn="true" :pause-btn="true" @btn-click="handleFlowBtnClick")
  div(:class="$style.noItem" v-else)
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
import { checkPath, openDirInExplorer } from '../utils'
import path from 'path'

export default {
  name: 'Download',
  data() {
    return {
      clickTime: window.performance.now(),
      clickIndex: -1,
      selectdData: [],
      isShowEditBtn: false,
      isShowDownloadMultiple: false,
      tabs: [
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
      ],
      tabId: 'all',
      keyEvent: {
        isShiftDown: false,
        isModDown: false,
        isADown: false,
        aDownTimeout: null,
      },
    }
  },
  computed: {
    ...mapGetters(['setting']),
    ...mapGetters('download', ['list', 'downloadStatus']),
    ...mapGetters('player', ['listId', 'playIndex']),
    isPlayList() {
      return this.listId == 'download'
    },
    playListIndex() {
      if (this.listId != 'download' || !this.list.length) return
      let info = this.list[this.playIndex]
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
        if (this.selectdData.length) {
          let lastSelectIndex = this.showList.indexOf(this.selectdData[this.selectdData.length - 1])
          this.removeAllSelect()
          if (lastSelectIndex != clickIndex) {
            let isNeedReverse = false
            if (clickIndex < lastSelectIndex) {
              let temp = lastSelectIndex
              lastSelectIndex = clickIndex
              clickIndex = temp
              isNeedReverse = true
            }
            this.selectdData = this.showList.slice(lastSelectIndex, clickIndex + 1)
            if (isNeedReverse) this.selectdData.reverse()
            let nodes = this.$refs.dom_tbody.childNodes
            do {
              nodes[lastSelectIndex].classList.add('active')
              lastSelectIndex++
            } while (lastSelectIndex <= clickIndex)
          }
        } else {
          event.currentTarget.classList.add('active')
          this.selectdData.push(this.showList[clickIndex])
        }
      } else if (this.keyEvent.isModDown) {
        let item = this.showList[clickIndex]
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
    handleClick(index) {
      const key = this.showList[index].key
      index = this.list.findIndex(i => i.key === key)
      let info = this.list[index]
      if (info.isComplate) {
        this.handlePlay(index)
      } else if (info.status === this.downloadStatus.RUN) {
        this.handlePauseTask(index)
      } else {
        this.handleStartTask(index)
      }
    },
    async handlePlay(index) {
      const targetSong = this.list[index]
      if (!await checkPath(path.join(this.setting.download.savePath, targetSong.fileName))) return
      this.setList({ list: this.list, listId: 'download', index: this.list.findIndex(i => i.key === targetSong.key) })
    },
    handleListBtnClick(info) {
      let item = this.showList[info.index]
      const key = item.key
      let index = this.list.findIndex(i => i.key === key)
      switch (info.action) {
        case 'play':
          this.handlePlay(index)
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
        case 'file':
          this.handleOpenFolder(index)
          break
        case 'search':
          this.handleSearch(index)
          break
      }
    },
    handleSelectAllData() {
      this.removeAllSelect()
      this.selectdData = [...this.showList]

      let nodes = this.$refs.dom_tbody.childNodes
      for (const node of nodes) {
        node.classList.add('active')
      }
    },
    async handleFlowBtnClick(action) {
      let selectdData = [...this.selectdData]
      this.removeAllSelect()
      await this.$nextTick()

      switch (action) {
        case 'start':
          this.startTasks(selectdData)
          break
        case 'pause':
          this.pauseTasks(selectdData)
          break
        case 'remove':
          this.removeTasks(selectdData)
          break
      }
    },
    async handleOpenFolder(index) {
      let path = this.list[index].filePath
      if (!await checkPath(path)) return
      openDirInExplorer(path)
    },
    handleSearch(index) {
      const info = this.list[index].musicInfo
      this.$router.push({
        path: 'search',
        query: {
          text: `${info.name} ${info.singer}`,
        },
      })
    },
    handleTabChange() {
      this.selectdData = []
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
      color: @color-theme;
    }
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
  }
})
</style>
