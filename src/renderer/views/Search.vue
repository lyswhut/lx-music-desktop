<template lang="pug">
  div(:class="$style.search")
    //- transition
    div(v-if="list.length" :class="$style.list")
      div(:class="$style.thead")
        table
          thead
            tr
              th.nobreak.center(style="width: 37px;")
                material-checkbox(id="search_select_all" v-model="isSelectAll" @change="handleSelectAllData"
                  :indeterminate="isIndeterminate" :title="isSelectAll && !isIndeterminate ? '全不选' : '全选'")
              th.nobreak(style="width: 25%;") 歌曲名
              th.nobreak(style="width: 20%;") 歌手
              th.nobreak(style="width: 25%;") 专辑
              th.nobreak(style="width: 15%;") 操作
              th.nobreak(style="width: 10%;") 时长
      div.scroll(:class="$style.tbody" ref="dom_scrollContent")
        table
          tbody
            tr(v-for='(item, index) in list' :key='item.songmid' @click="handleDoubleClick(index)")
              td.nobreak.center(style="width: 37px;" @click.stop)
                material-checkbox(:id="index.toString()" v-model="selectdData" :value="item")
              td.break(style="width: 25%;")
                | {{item.name}}
                span.badge.badge-info(v-if="item._types['320k']") 高品质
                span.badge.badge-success(v-if="item._types.ape || item._types.flac") 无损
              td.break(style="width: 20%;") {{item.singer}}
              td.break(style="width: 25%;") {{item.albumName}}
              td(style="width: 15%;")
                material-list-buttons(:index="index" :remove-btn="false" @btn-click="handleBtnClick")
              td(style="width: 10%;") {{item.interval}}
        div(:class="$style.pagination")
          material-pagination(:count="listInfo.total" :limit="limit" :page="page" @btn-click="handleTogglePage")
    div(v-else :class="$style.noitem")
      p 搜我所想~~😉
    material-download-modal(:show="showDownload" :musicInfo="musicInfo" @select="handleAddDownload" @close="showDownload = false")
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
import { scrollTo } from '../utils'
// import music from '../utils/music'
export default {
  name: 'Search',
  data() {
    return {
      page: 0,
      text: '',
      clickTime: 0,
      clickIndex: -1,
      showDownload: false,
      musicInfo: null,
      selectdData: [],
      isSelectAll: false,
      isIndeterminate: false,
      isShowEditBtn: false,
    }
  },
  beforeRouteUpdate(to, from, next) {
    if (to.query.text === undefined) return
    if (to.query.text === '') {
      this.clearList()
    } else {
      this.text = to.query.text
      this.page = 1
      this.handleSearch(this.text, this.page)
    }
    next()
  },
  mounted() {
    // console.log('mounted')
    if (this.$route.query.text === undefined) {
      let info = this.$store.getters['search/info']
      this.text = info.text
      this.page = info.page
    } else if (this.$route.query.text === '') {
      this.clearList()
    } else {
      this.text = this.$route.query.text
      this.page = 1
      this.handleSearch(this.text, this.page)
    }
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
  computed: {
    ...mapGetters(['userInfo']),
    ...mapGetters('search', ['list', 'limit', 'listInfo']),
    ...mapGetters('list', ['defaultList']),
  },
  methods: {
    ...mapActions('search', ['search']),
    ...mapActions('download', ['createDownload']),
    ...mapMutations('search', ['clearList', 'setPage']),
    ...mapMutations('list', ['defaultListAdd']),
    ...mapMutations('player', ['setList']),
    handleSearch(text, page) {
      this.search({ text, page, limit: this.limit }).then(data => {
        this.page = page
        this.$nextTick(() => {
          scrollTo(this.$refs.dom_scrollContent, 0)
        })
      })
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
      this.testPlay(index)
      this.clickTime = 0
      this.clickIndex = -1
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
      }
    },
    testPlay(index) {
      let targetSong = this.list[index]
      this.defaultListAdd(targetSong)
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
    handleTogglePage(page) {
      this.handleSearch(this.text, page)
    },
    handleAddDownload(type) {
      this.createDownload({ musicInfo: this.musicInfo, type })
      this.showDownload = false
    },
    handleSelectAllData(isSelect) {
      this.selectdData = isSelect ? [...this.list] : []
    },
    resetSelect() {
      this.isSelectAll = false
      this.selectdData = []
    },
  },
}
</script>

<style lang="less" module>
@import '../assets/styles/layout.less';

.search {
  overflow: hidden;
  height: 100%;
}
.list {
  position: relative;
  height: 100%;
  font-size: 14px;
  display: flex;
  flex-flow: column nowrap;
}
.thead {
  flex: none;
}
.tbody {
  flex: auto;
  overflow-y: auto;
  td {
    font-size: 12px;
    :global(.badge) {
      margin-right: 3px;
      &:first-child {
        margin-left: 3px;
      }
      &:last-child {
        margin-right: 0;
      }
    }
  }
}
.pagination {
  text-align: center;
  padding: 15px 0;
  // left: 50%;
  // transform: translateX(-50%);
}
.noitem {
  position: relative;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;

  p {
    font-size: 24px;
    color: #ccc;
  }
}
</style>
