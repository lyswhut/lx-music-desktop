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
            th.nobreak.center(style="width: 37px;")
              material-checkbox(id="search_select_all" v-model="isSelectAll" @change="handleSelectAllData"
                :indeterminate="isIndeterminate" :title="isSelectAll && !isIndeterminate ? $t('view.download.unselect_all') : $t('view.download.select_all')")
            th.nobreak(style="width: 28%;") {{$t('view.download.name')}}
            th.nobreak(style="width: 22%;") {{$t('view.download.progress')}}
            th.nobreak(style="width: 15%;") {{$t('view.download.status')}}
            th.nobreak(style="width: 10%;") {{$t('view.download.quality')}}
            th.nobreak(style="width: 20%;") {{$t('view.download.action')}}
    div.scroll(v-if="list.length" :class="$style.tbody")
      table
        tbody
          tr(v-for='(item, index) in showList' :key='item.key' @click="handleDoubleClick($event, index)" :class="playListIndex === index ? $style.active : ''")
            td.nobreak.center(style="width: 37px;" @click.stop)
              material-checkbox(:id="index.toString()" v-model="selectdData" :value="item")
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
export default {
  name: 'Download',
  data() {
    return {
      clickTime: window.performance.now(),
      clickIndex: -1,
      selectdData: [],
      isSelectAll: false,
      isIndeterminate: false,
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
    }
  },
  computed: {
    ...mapGetters('download', ['list', 'dls', 'downloadStatus']),
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
        this.isSelectAll = true
        this.isIndeterminate = len !== this.showList.length
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
  methods: {
    ...mapActions('download', ['removeTask', 'removeTaskMultiple', 'startTask']),
    ...mapMutations('player', ['setList']),
    ...mapMutations('download', ['pauseTask']),
    handlePauseTask(index) {
      let info = this.list[index]
      let dl = this.dls[info.key]
      dl ? dl.stop() : this.pauseTask(info)
      console.log('pause')
    },
    handleStartTask(index) {
      console.log('start')
      let info = this.list[index]
      let dl = this.dls[info.key]
      dl ? dl.start() : this.startTask(info)
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
      this.handleClick(index)
      this.clickTime = 0
      this.clickIndex = -1
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
    handlePlay(index) {
      if (!checkPath(this.list[index].filePath)) return
      let path = this.list[index].filePath
      this.setList({ list: this.list, listId: 'download', index: this.list.findIndex(i => i.filePath === path) })
    },
    handleListBtnClick(info) {
      const key = this.showList[info.index].key
      let index = this.list.findIndex(i => i.key === key)
      switch (info.action) {
        case 'play':
          this.handlePlay(index)
          break
        case 'start':
          this.handleStartTask(index)
          break
        case 'pause':
          this.handlePauseTask(index)
          break
        case 'remove':
          this.removeTask(index)
          break
        case 'file':
          this.handleOpenFolder(index)
          break
        case 'search':
          this.handleSearch(index)
          break
      }
    },
    handleSelectAllData(isSelect) {
      this.selectdData = isSelect ? [...this.showList] : []
    },
    resetSelect() {
      this.isSelectAll = false
      this.selectdData = []
    },
    handleFlowBtnClick(action) {
      switch (action) {
        case 'start':
          this.selectdData.forEach(item => {
            if (item.isComplate || item.status == this.downloadStatus.RUN) return
            let index = this.list.indexOf(item)
            if (index < 0) return
            this.handleStartTask(index)
          })
          break
        case 'pause': {
          let runs = []
          this.selectdData.forEach(item => {
            if (item.isComplate || item.status == this.downloadStatus.PAUSE) return
            if (item.status == this.downloadStatus.RUN) return runs.push(item)
            let index = this.list.indexOf(item)
            if (index < 0) return
            this.handlePauseTask(index)
          })
          runs.forEach(item => {
            if (item.isComplate || item.status == this.downloadStatus.PAUSE) return
            let index = this.list.indexOf(item)
            if (index < 0) return
            this.handlePauseTask(index)
          })
          break
        }
        case 'remove':
          this.removeTaskMultiple(this.selectdData)
          break
      }
      this.resetSelect()
    },
    handleOpenFolder(index) {
      let path = this.list[index].filePath
      if (!checkPath(path)) return
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
  }
})
</style>
