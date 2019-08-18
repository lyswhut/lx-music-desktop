<template lang="pug">
  div(:class="$style.list")
    //- transition
    div(v-if="list.length" :class="$style.content")
      div(:class="$style.thead")
        table
          thead
            tr
              th.nobreak(style="width: 25%;") 歌曲名
              th.nobreak(style="width: 20%;") 歌手
              th.nobreak(style="width: 25%;" v-if="setting.list.isShowAlbumName") 专辑
              th.nobreak(style="width: 20%;") 操作
              th.nobreak(style="width: 10%;") 时长
      div.scroll(:class="$style.tbody")
        table
          tbody
            tr(v-for='(item, index) in list' :key='item.songmid'
              @click="handleDoubleClick(index)" :class="[isPlayList && playIndex === index ? $style.active : '', isAPITemp && item.source != 'kw' ? $style.disabled : '']")
              td.break(style="width: 25%;") {{item.name}}
                //- span.badge.badge-light(v-if="item._types['128k']") 128K
                //- span.badge.badge-light(v-if="item._types['192k']") 192K
                //- span.badge.badge-secondary(v-if="item._types['320k']") 320K
                //- span.badge.badge-info(v-if="item._types.ape") APE
                //- span.badge.badge-success(v-if="item._types.flac") FLAC
              td.break(style="width: 20%;") {{item.singer}}
              td.break(style="width: 25%;" v-if="setting.list.isShowAlbumName") {{item.albumName}}
              td(style="width: 20%; padding-left: 0; padding-right: 0;")
                material-list-buttons(:index="index" @btn-click="handleBtnClick")
                //- button.btn-info(type='button' v-if="item._types['128k'] || item._types['192k'] || item._types['320k'] || item._types.flac" @click.stop='openDownloadModal(index)') 下载
                //- button.btn-secondary(type='button' v-if="item._types['128k'] || item._types['192k'] || item._types['320k']" @click.stop='testPlay(index)') 试听
                //- button.btn-secondary(type='button' @click.stop='handleRemove(index)') 删除
                //- button.btn-success(type='button' v-if="(item._types['128k'] || item._types['192k'] || item._types['320k']) && userInfo" @click.stop='showListModal(index)') ＋
              td(style="width: 10%;") {{item.interval}}
    div(:class="$style.noItem" v-else)
    material-download-modal(:show="showDownload" :musicInfo="musicInfo" @select="handleAddDownload" @close="showDownload = false")
</template>

<script>
import { mapMutations, mapGetters, mapActions } from 'vuex'
export default {
  name: 'List',
  data() {
    return {
      clickTime: window.performance.now(),
      clickIndex: -1,
      showDownload: false,
      musicInfo: null,
    }
  },
  computed: {
    ...mapGetters(['userInfo', 'setting']),
    ...mapGetters('list', ['defaultList', 'userList']),
    ...mapGetters('player', ['listId', 'playIndex']),
    isPlayList() {
      return this.listId != 'download' && (
        ((!this.$route.query.id || this.$route.query.id == 'test') && this.listId == 'test') ||
        this.$route.query.id == this.listId
      )
    },
    list() {
      return !this.$route.query.id || this.$route.query.id == 'test'
        ? this.defaultList.list
        : this.userList.find(l => l._id == this.$route.query.id) || []
    },
    isAPITemp() {
      return this.setting.apiSource == 'temp'
    },
  },
  // beforeRouteUpdate(to, from, next) {
  //   // if (to.query.id === undefined) return
  //   // if (to.query.text === '') {
  //   //   this.clearList()
  //   // } else {
  //   //   this.text = to.query.text
  //   //   this.page = 1
  //   //   this.handleSearch(this.text, this.page)
  //   // }
  //   next()
  // },
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
  methods: {
    ...mapMutations('list', ['defaultListRemove']),
    ...mapMutations('player', ['setList']),
    ...mapActions('download', ['createDownload']),
    handleDoubleClick(index) {
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
      this.setList({ list: this.list, listId: 'test', index })
    },
    handleRemove(index) {
      this.defaultListRemove(index)
    },
    handleBtnClick(info) {
      switch (info.action) {
        case 'download':
          this.musicInfo = this.list[info.index]
          this.$nextTick(() => {
            this.showDownload = true
          })
          break
        case 'play':
          this.testPlay(info.index)
          break
        case 'add':
          break
        case 'remove':
          this.handleRemove(info.index)
          break
      }
    },
    handleAddDownload(type) {
      this.createDownload({ musicInfo: this.musicInfo, type })
      this.showDownload = false
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
}

.disabled {
  opacity: .5;
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
