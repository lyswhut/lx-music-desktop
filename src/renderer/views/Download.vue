<template lang="pug">
div(:class="$style.download")
  //- transition
  div(:class="$style.content" v-if="list.length")
    div(:class="$style.thead")
      table
        thead
          tr
            th.nobreak.center(style="width: 37px;")
              material-checkbox(id="search_select_all" v-model="isSelectAll" @change="handleSelectAllData"
                :indeterminate="isIndeterminate" :title="isSelectAll && !isIndeterminate ? '全不选' : '全选'")
            th.nobreak(style="width: 28%;") 歌曲名
            th.nobreak(style="width: 22%;") 进度
            th.nobreak(style="width: 15%;") 状态
            th.nobreak(style="width: 10%;") 品质
            th.nobreak(style="width: 20%;") 操作
    div.scroll(v-if="list.length" :class="$style.tbody")
      table
        tbody
          tr(v-for='(item, index) in list' :key='item.key' @click="handleDoubleClick(index)" :class="isPlayList && playIndex === index ? $style.active : ''")
            td.nobreak.center(style="width: 37px;" @click.stop)
              material-checkbox(:id="index.toString()" v-model="selectdData" :value="item")
            td.break(style="width: 28%;") {{item.musicInfo.name}} - {{item.musicInfo.singer}}
            td.break(style="width: 22%;") {{item.progress.progress}}%
            td.break(style="width: 15%;") {{item.statusText}}
            td.break(style="width: 10%;") {{item.type && item.type.toUpperCase()}}
            td(style="width: 20%; padding-left: 0; padding-right: 0;")
              material-list-buttons(:index="index" :download-btn="false" :file-btn="true" :start-btn="!item.isComplate && item.status != downloadStatus.WAITING && (item.status != downloadStatus.RUN)"
                :pause-btn="!item.isComplate && (item.status == downloadStatus.RUN || item.status == downloadStatus.WAITING)"
                :play-btn="item.status == downloadStatus.COMPLETED" @btn-click="handleListBtnClick")
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
    }
  },
  computed: {
    ...mapGetters('download', ['list', 'dls', 'downloadStatus']),
    ...mapGetters('player', ['listId', 'playIndex']),
    isPlayList() {
      return this.listId == 'download'
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
  },
  methods: {
    ...mapActions('download', ['removeTask', 'removeTaskMultiple', 'startTask']),
    ...mapMutations('player', ['setList']),
    ...mapMutations('download', ['pauseTask']),
    handlePauseTask(index) {
      let info = this.list[index]
      let dl = this.dls[info.key]
      dl ? dl.pause() : this.pauseTask(info)
      console.log('pause')
    },
    handleStartTask(index) {
      console.log('start')
      let info = this.list[index]
      let dl = this.dls[info.key]
      dl ? dl.resume() : this.startTask(info)
    },
    handleDoubleClick(index) {
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
      this.setList({ list: this.list, listId: 'download', index })
    },
    handleListBtnClick(info) {
      switch (info.action) {
        case 'play':
          this.handlePlay(info.index)
          break
        case 'start':
          this.handleStartTask(info.index)
          break
        case 'pause':
          this.handlePauseTask(info.index)
          break
        case 'remove':
          this.removeTask(info.index)
        case 'file':
          this.handleOpenFolder(info.index)
          break
      }
    },
    handleSelectAllData(isSelect) {
      this.selectdData = isSelect ? [...this.list] : []
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
        case 'pause':
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
        case 'remove':
          this.removeTaskMultiple(this.selectdData)
          break
      }
      this.resetSelect()
    },
    handleOpenFolder(index) {
      openDirInExplorer(this.list[index].filePath)
    },
  },
}
</script>

<style lang="less" module>
@import '../assets/styles/layout.less';

.download {
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
