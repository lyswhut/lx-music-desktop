<template lang="pug">
div(:class="$style.songList")
  transition(enter-active-class="animated fadeIn" leave-active-class="animated fadeOut")
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
              th.nobreak(style="width: 20%;") 专辑
              th.nobreak(style="width: 20%;") 操作
              th.nobreak(style="width: 10%;") 时长
      div.scroll(:class="$style.tbody" ref="dom_scrollContent")
        table
          tbody
            tr(v-for='(item, index) in list' :key='item.songmid' @click="handleDoubleClick(index)")
              td.nobreak.center(style="width: 37px;" @click.stop)
                material-checkbox(:id="index.toString()" v-model="selectdList" @change="handleChangeSelect" :value="item")
              td.break(style="width: 25%;")
                | {{item.name}}
                span.badge.badge-info(v-if="item._types['320k']") 高品质
                span.badge.badge-success(v-if="item._types.ape || item._types.flac") 无损
              td.break(style="width: 20%;") {{item.singer}}
              td.break(style="width: 20%;") {{item.albumName}}
              td(style="width: 20%; padding-left: 0; padding-right: 0;")
                material-list-buttons(:index="index" :search-btn="true"
                  :remove-btn="false" @btn-click="handleListBtnClick"
                  :listAdd-btn="item.source == 'kw' || (!isAPITemp && item.source != 'wy')"
                  :play-btn="item.source == 'kw' || (!isAPITemp && item.source != 'wy')"
                  :download-btn="item.source == 'kw' || (!isAPITemp && item.source != 'wy')")
                //- button.btn-info(type='button' v-if="item._types['128k'] || item._types['192k'] || item._types['320k'] || item._types.flac" @click.stop='openDownloadModal(index)') 下载
                //- button.btn-secondary(type='button' v-if="item._types['128k'] || item._types['192k'] || item._types['320k']" @click.stop='testPlay(index)') 试听
                //- button.btn-success(type='button' v-if="(item._types['128k'] || item._types['192k'] || item._types['320k']) && userInfo" @click.stop='showListModal(index)') ＋
              td(style="width: 10%;") {{item.interval || '--/--'}}
        div(:class="$style.pagination")
          material-pagination(:count="total" :limit="limit" :page="page" @btn-click="handleTogglePage")
    div(v-else :class="$style.noitem")
      p(v-html="noItem")
  material-flow-btn(:show="isShowEditBtn && (source == 'kw' || !isAPITemp)" :remove-btn="false" @btn-click="handleFlowBtnClick")
</template>

<script>
import { mapGetters } from 'vuex'
import { scrollTo } from '../../utils'
export default {
  name: 'MaterialSongList',
  model: {
    prop: 'selectdData',
    event: 'input',
  },
  props: {
    list: {
      type: Array,
      default() {
        return []
      },
    },
    page: {
      type: Number,
      required: true,
    },
    limit: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    selectdData: {
      type: Array,
      required: true,
    },
    source: {
      type: String,
    },
    noItem: {
      type: String,
      default: '列表加载中...',
    },
  },
  computed: {
    ...mapGetters(['setting']),
    isAPITemp() {
      return this.setting.apiSource == 'temp'
    },
  },
  watch: {
    selectdList(n) {
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
    selectdData(n) {
      const len = n.length
      if (len) {
        this.isSelectAll = true
        this.isIndeterminate = len !== this.list.length
        this.isShowEditBtn = true
        this.selectdList = [...n]
      } else {
        this.isSelectAll = false
        this.isShowEditBtn = false
        this.resetSelect()
      }
    },
    list(n) {
      this.resetSelect()
      if (!this.list.length) return
      this.$nextTick(() => scrollTo(this.$refs.dom_scrollContent, 0))
    },
  },
  data() {
    return {
      clickTime: 0,
      clickIndex: -1,
      isSelectAll: false,
      isIndeterminate: false,
      isShowEditBtn: false,
      selectdList: [],
    }
  },
  methods: {
    handleDoubleClick(index) {
      if (
        window.performance.now() - this.clickTime > 400 ||
        this.clickIndex !== index
      ) {
        this.clickTime = window.performance.now()
        this.clickIndex = index
        return
      }
      this.emitEvent((this.source == 'kw' || (!this.isAPITemp && this.list[index].source != 'wy')) ? 'testPlay' : 'search', index)
      this.clickTime = 0
      this.clickIndex = -1
    },
    handleListBtnClick(info) {
      this.emitEvent('listBtnClick', info)
    },
    handleSelectAllData(isSelect) {
      this.selectdList = isSelect ? [...this.list] : []
      this.$emit('input', [...this.selectdList])
    },
    resetSelect() {
      this.selectdList = false
      this.selectdList = []
    },
    handleTogglePage(page) {
      this.emitEvent('togglePage', page)
    },
    handleFlowBtnClick(action) {
      this.emitEvent('flowBtnClick', action)
    },
    emitEvent(action, data) {
      this.$emit('action', { action, data })
    },
    handleChangeSelect() {
      this.$emit('input', [...this.selectdList])
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';
.song-list {
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
}

.list {
  position: relative;
  font-size: 14px;
  overflow: hidden;
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
    color: @color-theme_2-font-label;
  }
}

each(@themes, {
  :global(#container.@{value}) {
    .noitem {
      p {
        color: ~'@{color-@{value}-theme_2-font-label}';
      }
    }
  }
})
</style>
