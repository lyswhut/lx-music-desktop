<template lang="pug">
div(:class="$style.download")
  //- transition
  div(:class="$style.content" v-if="list.length")
    div(:class="$style.thead")
      table
        thead
          tr
            th.nobreak(style="width: 30%;") 歌曲名
            th.nobreak(style="width: 25%;") 进度
            th.nobreak(style="width: 15%;") 状态
            th.nobreak(style="width: 10%;") 品质
            th.nobreak(style="width: 20%;") 操作
    div.scroll(v-if="list.length" :class="$style.tbody")
      table
        tbody
          tr(v-for='(item, index) in list' :key='item.key' @click="handleDoubleClick(index)" :class="isPlayList && playIndex === index ? $style.active : ''")
            td.break(style="width: 30%;") {{item.musicInfo.name}} - {{item.musicInfo.singer}}
            td.break(style="width: 25%;") {{item.progress.progress}}%
            td.break(style="width: 15%;") {{item.statusText}}
            td.break(style="width: 10%;") {{item.type.toUpperCase()}}
            td(style="width: 20%; padding-left: 0; padding-right: 0;")
              material-list-buttons(:index="index" :downloadBtn="false" @btn-click="handleBtnClick")
  div(:class="$style.noItem" v-else)
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
import { checkPath } from '../utils'

export default {
  name: 'Download',
  data() {
    return {
      clickTime: window.performance.now(),
      clickIndex: -1,
    }
  },
  computed: {
    ...mapGetters('download', ['list', 'dls']),
    ...mapGetters('player', ['listId', 'playIndex']),
    isPlayList() {
      return this.listId == 'download'
    },
  },
  methods: {
    ...mapActions('download', ['removeTask', 'resumeTask']),
    ...mapMutations('player', ['setList']),
    pauseTask(index) {
      let info = this.list[index]
      this.dls[info.key].pause()
    },
    startTask(index) {
      let info = this.list[index]
      let dl = this.dls[info.key]
      dl ? dl.resume() : this.resumeTask(info)
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
      } else if (info.isDownloading) {
        this.pauseTask(index)
      } else {
        this.startTask(index)
      }
    },
    handlePlay(index) {
      if (!checkPath(this.list[index].filePath)) return
      this.setList({ list: this.list, listId: 'download', index })
    },
    handleBtnClick(info) {
      switch (info.action) {
        case 'play':
          this.handlePlay(info.index)
          break
        case 'remove':
          this.removeTask(info.index)
          break
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
