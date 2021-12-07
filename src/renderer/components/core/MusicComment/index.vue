<template lang="pug">
div.comment(:class="$style.comment")
  div(:class="$style.commentHeader")
    h3 {{$t('comment__title', { name: title })}}
    div(:class="$style.commentHeaderBtns")
      div(:class="$style.commentHeaderBtn" @click="handleShowComment" :tips="$t('comment__refresh')")
        svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' style='transform: rotate(45deg);' viewBox='0 0 24 24' space='preserve')
          use(xlink:href='#icon-refresh')
      div(:class="$style.commentHeaderBtn" @click="$emit('close')")
        svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' viewBox='0 0 24 24' space='preserve')
          use(xlink:href='#icon-close')

  div.scroll(:class="$style.commentMain" ref="dom_comment")
    div(v-if="page == 1")
      h2(:class="$style.commentType") {{$t('comment__hot_title')}}
      p(:class="$style.commentLabel" style="cursor: pointer;" v-if="isHotLoadError" @click="handleGetHotComment(currentMusicInfo)") {{$t('comment__hot_load_error')}}
      p(:class="$style.commentLabel" v-else-if="isHotLoading && !hotComments.length") {{$t('comment__hot_loading')}}
      comment-floor(v-if="!isHotLoadError && hotComments.length" :class="[$style.commentFloor, isHotLoading ? $style.loading : null]" :comments="hotComments")
      p(:class="$style.commentLabel" v-else-if="!isHotLoadError && !isHotLoading") {{$t('comment__no_content')}}
    div
      h2(:class="$style.commentType") {{$t('comment__new_title')}} ({{total}})
      p(:class="$style.commentLabel" style="cursor: pointer;" v-if="isNewLoadError" @click="handleGetNewComment(currentMusicInfo, nextPage, limit)") {{$t('comment__new_load_error')}}
      p(:class="$style.commentLabel" v-else-if="isNewLoading && !newComments.length") {{$t('comment__new_loading')}}
      comment-floor(v-if="!isNewLoadError && newComments.length" :class="[$style.commentFloor, isNewLoading ? $style.loading : null]" :comments="newComments")
      p(:class="$style.commentLabel" v-else-if="!isNewLoadError && !isNewLoading") {{$t('comment__no_content')}}
    div(:class="$style.pagination")
      material-pagination(:count="total" :btnLength="5" :limit="limit" :page="page" @btn-click="handleToggleCommentPage")
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
      page: 1,
      total: 0,
      maxPage: 1,
      limit: 20,
      isHotLoading: true,
      isNewLoading: false,
      isHotLoadError: true,
      isNewLoadError: false,
      nextPage: 1,
      newComments: [
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
      hotComments: [
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
  watch: {
    show(n) {
      if (n) this.handleShowComment()
    },
  },
  methods: {
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
    async getHotComment(musicInfo, retryNum = 0) {
      let resp
      try {
        resp = await music[musicInfo.source].comment.getHotComment(musicInfo)
      } catch (error) {
        if (error.message == '取消请求' || ++retryNum > 2) throw error
        resp = await this.getHotComment(musicInfo, retryNum)
      }
      return resp
    },
    handleGetNewComment(musicInfo, page, limit) {
      this.isNewLoadError = false
      this.isNewLoading = true
      this.getComment(musicInfo, page, limit).then(comment => {
        this.isNewLoading = false
        this.total = comment.total
        this.maxPage = comment.maxPage
        this.page = page
        this.newComments = comment.comments
        this.$nextTick(() => {
          scrollTo(this.$refs.dom_comment, 0, 300)
        })
      }).catch(err => {
        console.log(err)
        if (err.message == '取消请求') return
        this.isNewLoadError = true
        this.isNewLoading = false
      })
    },
    handleGetHotComment(musicInfo) {
      this.isHotLoadError = false
      this.isHotLoading = true
      this.getHotComment(musicInfo).then(hotComment => {
        this.isHotLoading = false
        this.hotComments = hotComment.comments
      }).catch(err => {
        console.log(err)
        if (err.message == '取消请求') return
        this.isHotLoadError = true
        this.isHotLoading = false
      })
    },
    handleShowComment() {
      if (!this.musicInfo.songmid || !music[this.musicInfo.source].comment) return
      // if (this.musicInfo.songmid != this.currentMusicInfo.songmid) {
      this.page = 1
      this.total = 0
      this.maxPage = 1
      this.nextPage = 1
      // }
      this.isShowComment = true
      this.currentMusicInfo = this.musicInfo

      if (this.page == 1) this.handleGetHotComment(this.currentMusicInfo)
      this.handleGetNewComment(this.currentMusicInfo, this.page, this.limit)
    },
    handleToggleCommentPage(page) {
      this.nextPage = page
      this.handleGetNewComment(this.currentMusicInfo, page, this.limit)
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
  padding-left: 15px;
  padding-right: 10px;
  background-color: @color-reply-floor;
  border-radius: 4px;
}
.commentLabel {
  padding: 15px;
  color: @color-theme_2-font-label;
  font-size: 14px;
}
.commentType {
  padding: 10px 0;
  font-size: 13px;
  color: @color-theme;
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
      color: ~'@{color-@{value}-theme}';
    }
  }
})
</style>
