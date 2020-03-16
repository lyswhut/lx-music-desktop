<template lang="pug">
div(:class="$style.songList")
  transition(enter-active-class="animated-fast fadeIn" leave-active-class="animated-fast fadeOut")
    div(v-show="list.length" :class="$style.list")
      div(:class="$style.thead")
        table
          thead
            tr
              th.nobreak.center(style="width: 37px;")
                material-checkbox(id="search_select_all" v-model="isSelectAll" @change="handleSelectAllData"
                  :indeterminate="isIndeterminate" :title="isSelectAll && !isIndeterminate ? $t('material.song_list.unselect_all') : $t('material.song_list.select_all')")
              th.nobreak(style="width: 25%;") {{$t('material.song_list.name')}}
              th.nobreak(style="width: 20%;") {{$t('material.song_list.singer')}}
              th.nobreak(style="width: 20%;") {{$t('material.song_list.album')}}
              th.nobreak(style="width: 20%;") {{$t('material.song_list.action')}}
              th.nobreak(style="width: 10%;") {{$t('material.song_list.time')}}
      div.scroll(:class="$style.tbody" ref="dom_scrollContent")
        table
          tbody(@contextmenu="handleContextMenu")
            tr(v-for='(item, index) in list' :key='item.songmid' @click="handleDoubleClick($event, index)")
              td.nobreak.center(style="width: 37px;" @click.stop)
                material-checkbox(:id="index.toString()" v-model="selectdList" @change="handleChangeSelect" :value="item")
              td.break(style="width: 25%;")
                span.select {{item.name}}
                span.badge.badge-theme-success(:class="$style.labelQuality" v-if="item._types.ape || item._types.flac") {{$t('material.song_list.lossless')}}
                span.badge.badge-theme-info(:class="$style.labelQuality" v-else-if="item._types['320k']") {{$t('material.song_list.high_quality')}}
              td.break(style="width: 20%;")
                span.select {{item.singer}}
              td.break(style="width: 20%;")
                span.select {{item.albumName}}
              td(style="width: 20%; padding-left: 0; padding-right: 0;")
                material-list-buttons(:index="index" :search-btn="true"
                  :remove-btn="false" @btn-click="handleListBtnClick"
                  :listAdd-btn="item.source == 'kw' || !isAPITemp"
                  :play-btn="item.source == 'kw' || !isAPITemp"
                  :download-btn="item.source == 'kw' || !isAPITemp")
                //- button.btn-info(type='button' v-if="item._types['128k'] || item._types['192k'] || item._types['320k'] || item._types.flac" @click.stop='openDownloadModal(index)') 下载
                //- button.btn-secondary(type='button' v-if="item._types['128k'] || item._types['192k'] || item._types['320k']" @click.stop='testPlay(index)') 试听
                //- button.btn-success(type='button' v-if="(item._types['128k'] || item._types['192k'] || item._types['320k']) && userInfo" @click.stop='showListModal(index)') ＋
              td(style="width: 10%;")
                span(:class="$style.time") {{item.interval || '--/--'}}
        div(:class="$style.pagination")
          material-pagination(:count="total" :limit="limit" :page="page" @btn-click="handleTogglePage")
  transition(enter-active-class="animated-fast fadeIn" leave-active-class="animated-fast fadeOut")
    div(v-show="!list.length" :class="$style.noitem")
      p(v-html="noItem")
  material-flow-btn(:show="isShowEditBtn && (source == 'kw' || !isAPITemp)" :remove-btn="false" @btn-click="handleFlowBtnClick")
</template>

<script>
import { mapGetters } from 'vuex'
import { scrollTo, clipboardWriteText } from '../../utils'
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
      this.emitEvent((this.source == 'kw' || !this.isAPITemp) ? 'testPlay' : 'search', index)
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
@import '../../assets/styles/layout.less';
.song-list {
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  position: relative;
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
      margin-left: 3px;
    }
  }
  :global(.badge) {
    opacity: .85;
  }

  &.copying {
    .labelQuality, .time {
      display: none;
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
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
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
