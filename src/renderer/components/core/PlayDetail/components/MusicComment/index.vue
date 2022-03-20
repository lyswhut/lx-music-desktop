<template lang="pug">
div.comment(:class="$style.comment" ref="dom_container")
  div(:class="$style.commentHeader")
    h3 {{$t('comment__title', { name: title })}}
    div(:class="$style.commentHeaderBtns")
      div(:class="$style.commentHeaderBtn" @click="handleShowComment" :aria-label="$t('comment__refresh')")
        svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' style='transform: rotate(45deg);' viewBox='0 0 24 24' space='preserve')
          use(xlink:href='#icon-refresh')
      div(:class="$style.commentHeaderBtn" @click="$emit('close')")
        svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' viewBox='0 0 24 24' space='preserve')
          use(xlink:href='#icon-close')

  div(:class="$style.commentMain")
    header(:class="$style.tab_header")
      button(type="button" @click="handleToggleTab('hot')" :class="[$style.commentType, { [$style.active]: tabActiveId == 'hot' }]") {{$t('comment__hot_title')}} ({{hotComment.total}})
      button(type="button" @click="handleToggleTab('new')" :class="[$style.commentType, { [$style.active]: tabActiveId == 'new' }]") {{$t('comment__new_title')}} ({{newComment.total}})
    main(:class="$style.tab_main" ref="dom_tabMain")
      div(:class="$style.tab_content")
        div.scroll(:class="$style.tab_content_scroll" ref="dom_commentHot")
          p(:class="$style.commentLabel" style="cursor: pointer;" v-if="hotComment.isLoadError" @click="handleGetHotComment(currentMusicInfo, hotComment.nextPage, hotComment.limit)") {{$t('comment__hot_load_error')}}
          p(:class="$style.commentLabel" v-else-if="hotComment.isLoading && !hotComment.list.length") {{$t('comment__hot_loading')}}
          comment-floor(v-if="!hotComment.isLoadError && hotComment.list.length" :class="[$style.commentFloor, hotComment.isLoading ? $style.loading : null]" :comments="hotComment.list")
          p(:class="$style.commentLabel" v-else-if="!hotComment.isLoadError && !hotComment.isLoading") {{$t('comment__no_content')}}
          div(:class="$style.pagination")
            material-pagination(:count="hotComment.total" :btnLength="5" :limit="hotComment.limit" :page="hotComment.page" @btn-click="handleToggleHotCommentPage")
      div(:class="$style.tab_content")
        div.scroll(:class="$style.tab_content_scroll" ref="dom_commentNew")
          p(:class="$style.commentLabel" style="cursor: pointer;" v-if="newComment.isLoadError" @click="handleGetNewComment(currentMusicInfo, newComment.nextPage, newComment.limit)") {{$t('comment__new_load_error')}}
          p(:class="$style.commentLabel" v-else-if="newComment.isLoading && !newComment.list.length") {{$t('comment__new_loading')}}
          comment-floor(v-if="!newComment.isLoadError && newComment.list.length" :class="[$style.commentFloor, newComment.isLoading ? $style.loading : null]" :comments="newComment.list")
          p(:class="$style.commentLabel" v-else-if="!newComment.isLoadError && !newComment.isLoading") {{$t('comment__no_content')}}
          div(:class="$style.pagination")
            material-pagination(:count="newComment.total" :btnLength="5" :limit="newComment.limit" :page="newComment.page" @btn-click="handleToggleCommentPage")
</template>

<script>
import { mapGetters } from 'vuex'
import { scrollTo } from '@renderer/utils'
import music from '@renderer/utils/music'
import CommentFloor from './CommentFloor'

export default {
  name: 'MusicComment',
  props: {
    show: Boolean,
    musicInfo: {
      type: Object,
      required: true,
    },
  },
  components: {
    CommentFloor,
  },
  emits: ['close'],
  data() {
    return {
      currentMusicInfo: {
        name: '',
        singer: '',
      },
      tabActiveId: 'hot',
      newComment: {
        isLoading: false,
        isLoadError: false,
        page: 1,
        total: 0,
        maxPage: 1,
        nextPage: 1,
        limit: 20,
        list: [
        // {
        //   text: ['123123hhh'],
        //   userName: 'dsads',
        //   avatar: 'http://img4.kuwo.cn/star/userhead/39/52/1602393411654_512039239s.jpg',
        //   time: '2020-10-22 22:14:17',
        //   timeStr: '2020-10-22 22:14:17',
        //   likedCount: 100,
        //   reply: [],
        // },
        ],
      },
      hotComment: {
        isLoading: true,
        isLoadError: true,
        page: 1,
        total: 0,
        maxPage: 1,
        nextPage: 1,
        limit: 20,
        list: [
        // {
        //   text: ['123123hhh'],
        //   userName: 'dsads',
        //   avatar: 'http://img4.kuwo.cn/star/userhead/39/52/1602393411654_512039239s.jpg',
        //   time: '2020-10-22 22:14:17',
        //   timeStr: '2020-10-22 22:14:17',
        //   likedCount: 100,
        //   reply: [
        //     {
        //       text: ['123123hhh'],
        //       userName: 'dsads',
        //       avatar: 'http://img4.kuwo.cn/star/userhead/39/52/1602393411654_512039239s.jpg',
        //       time: '2020-10-22 22:14:17',
        //       timeStr: '2020-10-22 22:14:17',
        //       likedCount: 100,
        //     },
        //   ],
        // },
        ],
      },
    }
  },
  computed: {
    ...mapGetters(['setting']),
    title() {
      return this.currentMusicInfo.name
        ? this.setting.download.fileName.replace('歌名', this.currentMusicInfo.name).replace('歌手', this.currentMusicInfo.singer)
        : '^-^'
    },
  },
  mounted() {
    this.setWidth()
    window.addEventListener('resize', this.setWidth)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.setWidth)
  },
  watch: {
    show(n) {
      if (n) this.handleShowComment()
    },
  },
  methods: {
    setWidth() {
      setTimeout(() => {
        this.$refs.dom_container.style.width = Math.floor(this.$refs.dom_container.parentNode.clientWidth * 0.5) + 'px'

        setTimeout(() => {
          this.handleToggleTab(this.tabActiveId, true)
        })
      })
    },
    async getComment(musicInfo, page, limit, retryNum = 0) {
      let resp
      try {
        resp = await music[musicInfo.source].comment.getComment(musicInfo, page, limit)
      } catch (error) {
        if (error.message == '取消请求' || ++retryNum > 2) throw error
        resp = await this.getComment(musicInfo, page, limit, retryNum)
      }
      return resp
    },
    async getHotComment(musicInfo, page, limit, retryNum = 0) {
      let resp
      try {
        resp = await music[musicInfo.source].comment.getHotComment(musicInfo, page, limit)
      } catch (error) {
        if (error.message == '取消请求' || ++retryNum > 2) throw error
        resp = await this.getHotComment(musicInfo, page, limit, retryNum)
      }
      return resp
    },
    handleGetNewComment(musicInfo, page, limit) {
      this.newComment.isLoadError = false
      this.newComment.isLoading = true
      this.getComment(musicInfo, page, limit).then(comment => {
        this.newComment.isLoading = false
        this.newComment.total = comment.total
        this.newComment.maxPage = comment.maxPage
        this.newComment.page = page
        this.newComment.list = comment.comments
        this.$nextTick(() => {
          scrollTo(this.$refs.dom_commentNew, 0, 300)
        })
      }).catch(err => {
        console.log(err)
        if (err.message == '取消请求') return
        this.newComment.isLoadError = true
        this.newComment.isLoading = false
      })
    },
    handleGetHotComment(musicInfo, page, limit) {
      this.hotComment.isLoadError = false
      this.hotComment.isLoading = true
      this.getHotComment(musicInfo, page, limit).then(hotComment => {
        this.hotComment.isLoading = false
        this.hotComment.total = hotComment.total
        this.hotComment.maxPage = hotComment.maxPage
        this.hotComment.page = page
        this.hotComment.list = hotComment.comments
        this.$nextTick(() => {
          scrollTo(this.$refs.dom_commentHot, 0, 300)
        })
      }).catch(err => {
        console.log(err)
        if (err.message == '取消请求') return
        this.hotComment.isLoadError = true
        this.hotComment.isLoading = false
      })
    },
    handleShowComment() {
      if (!this.musicInfo.songmid || !music[this.musicInfo.source].comment) return
      // if (this.musicInfo.songmid != this.currentMusicInfo.songmid) {
      this.hotComment.page = 1
      this.hotComment.total = 0
      this.hotComment.maxPage = 1
      this.hotComment.nextPage = 1

      this.newComment.page = 1
      this.newComment.total = 0
      this.newComment.maxPage = 1
      this.newComment.nextPage = 1
      // }
      this.isShowComment = true
      this.currentMusicInfo = this.musicInfo

      this.handleGetHotComment(this.currentMusicInfo, this.hotComment.page, this.hotComment.limit)
      this.handleGetNewComment(this.currentMusicInfo, this.newComment.page, this.newComment.limit)
    },
    handleToggleHotCommentPage(page) {
      this.hotComment.nextPage = page
      this.handleGetHotComment(this.currentMusicInfo, page, this.hotComment.limit)
    },
    handleToggleCommentPage(page) {
      this.newComment.nextPage = page
      this.handleGetNewComment(this.currentMusicInfo, page, this.newComment.limit)
    },
    handleToggleTab(id, force) {
      if (!force && this.tabActiveId == id) return
      switch (id) {
        case 'hot':
          this.$refs.dom_tabMain.scrollLeft = 0
          break
        case 'new':
          this.$refs.dom_tabMain.scrollLeft = this.$refs.dom_tabMain.clientWidth
          break
      }
      this.tabActiveId = id
    },
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.comment {
  display: flex;
  flex-flow: column nowrap;
  transition: @transition-theme;
  transition-property: transform,opacity;
  transform-origin: 100%;
  overflow: hidden;
}
.commentHeader {
  flex: none;
  padding-bottom: 5px;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  // border-bottom: 1px solid #eee;
  h3 {
    font-size: 14px;
    .mixin-ellipsis-1;
    line-height: 1.2;
  }
}
.commentHeaderBtns {
  flex: 1 0 auto;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  color: @color-theme;
}
.commentHeaderBtn {
  height: 22px;
  width: 22px;
  cursor: pointer;
  transition: opacity @transition-theme;

  +.commentHeaderBtn {
    margin-left: 5px;
  }

  &:hover {
    opacity: .7;
  }
}
.commentMain {
  flex: auto;
  background-color: @color-reply-floor;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
}
.tab_header {
  display: flex;
  flex-flow: row nowrap;
  gap: 15px;
  padding-left: 15px;
  padding-right: 10px;
}
.tab_main {
  flex: auto;
  display: flex;
  flex-flow: row nowrap;
  overflow: hidden;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
}
.tab_content {
  flex-shrink: 0;
  width: 100%;
  position: relative;
}
.tab_content_scroll {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  padding-left: 15px;
  padding-right: 10px;
}
.commentLabel {
  padding: 15px;
  color: @color-theme_2-font-label;
  font-size: 14px;
}
.commentType {
  padding: 5px;
  margin: 5px 0;
  font-size: 13px;
  background: none;
  border: none;
  cursor: pointer;
  transition: @transition-theme;
  transition-property: opacity, color;
  &:hover {
    opacity: .7;
  }
  &.active {
    color: @color-theme;
  }
}
.commentFloor {
  opacity: 1;
  transition: opacity @transition-theme;

  &.loading {
    opacity: .4;
  }
}
.pagination {
  padding: 10px 0;
}

each(@themes, {
  :global(#root.@{value}) {
    .commentHeaderBtns {
      color: ~'@{color-@{value}-theme}';
    }
    .commentMain {
      background-color: ~'@{color-@{value}-reply-floor}';
    }
    .commentLabel {
      color: ~'@{color-@{value}-theme_2-font-label}';
    }
    .commentType {
      &.active {
        color: ~'@{color-@{value}-theme}';
      }
    }
  }
})
</style>
