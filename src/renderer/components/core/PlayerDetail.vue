<template lang="pug">
  div(:class="[$style.container, setting.controlBtnPosition == 'left' ? $style.controlBtnLeft : $style.controlBtnRight]" @contextmenu="handleContextMenu")
    //- div(:class="$style.bg" :style="bgStyle")
    //- div(:class="$style.bg2")
    div(:class="$style.header")
      div(:class="$style.controBtn")
        button(type="button" :class="$style.hide" :tips="$t('core.player.hide_detail')" @click="visiblePlayerDetail(false)")
          svg(:class="$style.controBtnIcon" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='80%' viewBox='0 0 30.727 30.727' space='preserve')
            use(xlink:href='#icon-window-hide')
        button(type="button" :class="$style.min" :tips="$t('core.toolbar.min')" @click="min")
          svg(:class="$style.controBtnIcon" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='100%' viewBox='0 0 24 24' space='preserve')
            use(xlink:href='#icon-window-minimize')

        //- button(type="button" :class="$style.max" @click="max")
        button(type="button" :class="$style.close" :tips="$t('core.toolbar.close')" @click="close")
          svg(:class="$style.controBtnIcon" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='100%' viewBox='0 0 24 24' space='preserve')
            use(xlink:href='#icon-window-close')

    div(:class="[$style.main, isShowComment ? $style.showComment : null]")
      div(:class="$style.left")
        //- div(:class="$style.info")
        div(:class="$style.info")
          img(:class="$style.img" :src="musicInfo.img" v-if="musicInfo.img")
          div(:class="$style.description" @click="isShowComment = true")
            p {{$t('core.player.name')}}{{musicInfo.name}}
            p {{$t('core.player.singer')}}{{musicInfo.singer}}
            p(v-if="musicInfo.album") {{$t('core.player.album')}}{{musicInfo.album}}

      div(:class="$style.right")
        div(:class="[$style.lyric, lyricEvent.isMsDown ? $style.draging : null]" @wheel="handleWheel" @mousedown="handleLyricMouseDown" ref="dom_lyric")
          div(:class="$style.lyricSpace")
          p(v-for="(info, index) in lyricLines" :key="index" :class="lyric.line == index ? $style.lrcActive : null") {{info.text}}
          div(:class="$style.lyricSpace")

      div(:class="$style.comment")
        div(:class="$style.commentHeader" @click="isShowComment = false")
          h3 {{title}}
        div.scroll(:class="$style.commentMain")
          div
            h2(:class="$style.commentType") 热门评论
            material-comment-floor(v-if="comment.hotComments.length" :class="$style.reply_floor" :comments="comment.hotComments")
          div
            h2(:class="$style.commentType") 最新评论
            material-comment-floor(v-if="comment.comments.length" :class="$style.reply_floor" :comments="comment.comments")
          div(:class="$style.pagination")
            material-pagination(:count="comment.total" :limit="comment.limit" :page="comment.page" @btn-click="handleToggleCommentPage")

    div(:class="$style.footer")
      div(:class="$style.left")
        div(:class="$style.progressContainer")
          div(:class="$style.progressContent")
            div(:class="$style.progress")
              //- div(:class="[$style.progressBar, $style.progressBar1]" :style="{ transform: `scaleX(${progress || 0})` }")
              div(:class="[$style.progressBar, $style.progressBar2, isActiveTransition ? $style.barTransition : '']" @transitionend="handleTransitionEnd" :style="{ transform: `scaleX(${playInfo.progress || 0})`, willChange: isPlay || isActiveTransition ? 'transform' : 'auto' }")
            div(:class="$style.progressMask" @click='setProgress' ref="dom_progress")
        div(:class="$style.timeLabel")
          span(style="margin-left: 15px") {{playInfo.status}}
          div
            span {{playInfo.nowPlayTimeStr}}
            span(style="margin: 0 5px;") /
            span {{playInfo.maxPlayTimeStr}}
      div(:class="$style.playControl")
        //- div(:class="$style.playBtn")
        //- div(:class="$style.playBtn")
        div(:class="$style.playBtn" @click="$emit('action', { type: 'prev' })" style="transform: rotate(180deg);" :tips="$t('core.player.prev')")
          svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 220.847 220.847' space='preserve')
            use(xlink:href='#icon-nextMusic')
        div(:class="$style.playBtn" :tips="isPlay ? $t('core.player.pause') : $t('core.player.play')" @click="$emit('action', { type: 'togglePlay' })")
          svg(v-if="isPlay" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 277.338 277.338' space='preserve')
            use(xlink:href='#icon-pause')
          svg(v-else version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 170 170' space='preserve')
            use(xlink:href='#icon-play')
        div(:class="$style.playBtn" @click="$emit('action', { type: 'next' })" :tips="$t('core.player.next')")
          svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 220.847 220.847' space='preserve')
            use(xlink:href='#icon-nextMusic')
</template>


<script>
import { mapGetters, mapMutations } from 'vuex'
import { base as eventBaseName } from '../../event/names'
import { scrollTo } from '../../utils'

let cancelScrollFn = null

export default {
  props: {
    musicInfo: {
      type: Object,
      default() {
        return {
          songmid: null,
          img: null,
          lrc: null,
          url: null,
          name: '^',
          singer: '^',
        }
      },
    },
    lyric: {
      type: Object,
      default() {
        return {
          line: 0,
          text: '',
          lines: [],
        }
      },
    },
    playInfo: {
      type: Object,
      default() {
        return {
          nowPlayTimeStr: '00:00',
          maxPlayTimeStr: '00:00',
          progress: 0,
          nowPlayTime: 0,
          status: 0,
        }
      },
    },
    list: {
      type: Array,
      default() {
        return []
      },
    },
    listId: {
      type: String,
      default() {
        return ''
      },
    },
    isPlay: {
      type: Boolean,
      default: false,
    },
  },
  watch: {
    // 'musicInfo.img': {
    //   handler(n) {
    //     if (n) {
    //       this.bgStyle.backgroundImage = `url(${n})`
    //     }
    //   },
    //   immediate: true,
    // },
    'lyric.lines': {
      handler(n, o) {
        this.isSetedLines = true
        if (o) {
          this._lyricLines = n
          if (n.length) {
            this.lyricLines = n
            this.$nextTick(() => {
              this.dom_lines = this.$refs.dom_lyric.querySelectorAll('p')
              this.handleScrollLrc()
            })
          } else {
            if (cancelScrollFn) {
              cancelScrollFn()
              cancelScrollFn = null
            }
            cancelScrollFn = scrollTo(this.$refs.dom_lyric, 0, 300, () => {
              if (this.lyricLines === this._lyricLines && this._lyricLines.length) return
              this.lyricLines = this._lyricLines
              this.$nextTick(() => {
                this.dom_lines = this.$refs.dom_lyric.querySelectorAll('p')
                this.handleScrollLrc()
              })
            }, 50)
          }
        } else {
          this.lyricLines = n
          this.$nextTick(() => {
            this.dom_lines = this.$refs.dom_lyric.querySelectorAll('p')
            this.handleScrollLrc()
          })
        }
      },
      immediate: true,
    },
    'lyric.line': {
      handler(n) {
        if (n < 0) return
        if (n == 0 && this.isSetedLines) return this.isSetedLines = false
        this.handleScrollLrc()
      },
      immediate: true,
    },
    'playInfo.nowPlayTime'(n, o) {
      if (Math.abs(n - o) > 2) this.isActiveTransition = true
    },
  },
  data() {
    return {
      bgStyle: {
        backgroundImage: null,
      },
      dom_lines: [],
      isActiveTransition: false,
      pregessWidth: 0,
      clickTime: 0,
      volumeEvent: {
        isMsDown: false,
        msDownX: 0,
        msDownValue: 0,
      },
      lyricEvent: {
        isMsDown: false,
        msDownY: 0,
        msDownScrollY: 0,
        isStopScroll: false,
        timeout: null,
      },
      _lyricLines: [],
      lyricLines: [],
      isSetedLines: false,
      isShowComment: false,
      comment: {
        page: 1,
        total: 10,
        maxPage: 1,
        limit: 5,
        comments: [{
          text: ['123123hhh'],
          userName: 'dsads',
          avatar: 'http://img4.kuwo.cn/star/userhead/39/52/1602393411654_512039239s.jpg',
          time: '2020-10-22 22:14:17',
          likedCount: 100,
          reply: [
            {
              text: ['123123hhh'],
              userName: 'dsads',
              avatar: 'http://img4.kuwo.cn/star/userhead/39/52/1602393411654_512039239s.jpg',
              time: '2020-10-22 22:14:17',
              likedCount: 100,
            },
          ],
        }, {
          text: ['123123hhh'],
          userName: 'dsads',
          avatar: 'http://img4.kuwo.cn/star/userhead/39/52/1602393411654_512039239s.jpg',
          time: '2020-10-22 22:14:17',
          likedCount: 100,
          reply: [
            {
              text: ['123123hhh'],
              userName: 'dsads',
              avatar: 'http://img4.kuwo.cn/star/userhead/39/52/1602393411654_512039239s.jpg',
              time: '2020-10-22 22:14:17',
              likedCount: 100,
            },
            {
              text: ['123123hhh'],
              userName: 'dsads',
              avatar: 'http://img4.kuwo.cn/star/userhead/39/52/1602393411654_512039239s.jpg',
              time: '2020-10-22 22:14:17',
              likedCount: 100,
            },
          ],
        }, {
          text: ['123123hhh'],
          userName: 'dsads',
          avatar: 'http://img4.kuwo.cn/star/userhead/39/52/1602393411654_512039239s.jpg',
          time: '2020-10-22 22:14:17',
          likedCount: 100,
          reply: [],
        }, {
          text: ['123123hhh'],
          userName: 'dsads',
          avatar: 'http://img4.kuwo.cn/star/userhead/39/52/1602393411654_512039239s.jpg',
          time: '2020-10-22 22:14:17',
          likedCount: 100,
          reply: [],
        }, {
          text: ['123123hhh'],
          userName: 'dsads',
          avatar: 'http://img4.kuwo.cn/star/userhead/39/52/1602393411654_512039239s.jpg',
          time: '2020-10-22 22:14:17',
          likedCount: 100,
          reply: [],
        }, {
          text: ['123123hhh'],
          userName: 'dsads',
          avatar: 'http://img4.kuwo.cn/star/userhead/39/52/1602393411654_512039239s.jpg',
          time: '2020-10-22 22:14:17',
          likedCount: 100,
          reply: [],
        }, {
          text: ['123123hhh'],
          userName: 'dsads',
          avatar: 'http://img4.kuwo.cn/star/userhead/39/52/1602393411654_512039239s.jpg',
          time: '2020-10-22 22:14:17',
          likedCount: 100,
          reply: [],
        }, {
          text: ['123123hhh'],
          userName: 'dsads',
          avatar: 'http://img4.kuwo.cn/star/userhead/39/52/1602393411654_512039239s.jpg',
          time: '2020-10-22 22:14:17',
          likedCount: 100,
          reply: [],
        }],
        hotComments: [{
          text: ['123123hhh'],
          userName: 'dsads',
          avatar: 'http://img4.kuwo.cn/star/userhead/39/52/1602393411654_512039239s.jpg',
          time: '2020-10-22 22:14:17',
          likedCount: 100,
          reply: [
            {
              text: ['123123hhh'],
              userName: 'dsads',
              avatar: 'http://img4.kuwo.cn/star/userhead/39/52/1602393411654_512039239s.jpg',
              time: '2020-10-22 22:14:17',
              likedCount: 100,
            },
          ],
        }],
      },
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.setProgressWidth()
    })
    document.addEventListener('mousemove', this.handleMouseMsMove)
    document.addEventListener('mouseup', this.handleMouseMsUp)
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    this.clearLyricScrollTimeout()
    document.removeEventListener('mousemove', this.handleMouseMsMove)
    document.removeEventListener('mouseup', this.handleMouseMsUp)
    window.removeEventListener('resize', this.handleResize)
  },
  computed: {
    ...mapGetters(['setting']),
    ...mapGetters('player', ['isShowPlayerDetail']),
    title() {
      return this.musicInfo.name
        ? this.setting.download.fileName.replace('歌名', this.musicInfo.name).replace('歌手', this.musicInfo.singer)
        : '^-^'
    },
  },
  methods: {
    ...mapMutations('player', [
      'visiblePlayerDetail',
    ]),
    handleResize() {
      this.setProgressWidth()
    },
    handleScrollLrc() {
      if (!this.dom_lines.length) return
      if (cancelScrollFn) {
        cancelScrollFn()
        cancelScrollFn = null
      }
      if (this.lyricEvent.isStopScroll) return
      let dom_p = this.dom_lines[this.lyric.line]
      cancelScrollFn = scrollTo(this.$refs.dom_lyric, dom_p ? (dom_p.offsetTop - this.$refs.dom_lyric.clientHeight * 0.38) : 0)
    },
    handleTransitionEnd() {
      this.isActiveTransition = false
    },
    setProgress(event) {
      this.$emit('action', {
        type: 'progress',
        data: event.offsetX / this.pregessWidth,
      })
    },
    setProgressWidth() {
      this.pregessWidth = parseInt(
        window.getComputedStyle(this.$refs.dom_progress, null).width,
      )
    },
    handleContextMenu() {
      if (window.performance.now() - this.clickTime > 400) {
        this.clickTime = window.performance.now()
        return
      }
      this.clickTime = 0
      this.visiblePlayerDetail(false)
    },
    handleLyricMouseDown(e) {
      // console.log(e)
      this.lyricEvent.isMsDown = true
      this.lyricEvent.msDownY = e.clientY
      this.lyricEvent.msDownScrollY = this.$refs.dom_lyric.scrollTop
    },
    handleMouseMsUp(e) {
      this.lyricEvent.isMsDown = this.volumeEvent.isMsDown = false
    },
    handleMouseMsMove(e) {
      if (this.lyricEvent.isMsDown) {
        if (!this.lyricEvent.isStopScroll) this.lyricEvent.isStopScroll = true
        if (cancelScrollFn) {
          cancelScrollFn()
          cancelScrollFn = null
        }
        this.$refs.dom_lyric.scrollTop = this.lyricEvent.msDownScrollY + this.lyricEvent.msDownY - e.clientY
        this.startLyricScrollTimeout()
      }

      // if (this.volumeEvent.isMsDown) {
      //   let val = this.volumeEvent.msDownValue + (e.clientX - this.volumeEvent.msDownX) / 70
      //   this.volume = val < 0 ? 0 : val > 1 ? 1 : val
      //   if (this.audio) this.audio.volume = this.volume
      // }

      // console.log(val)
    },
    startLyricScrollTimeout() {
      this.clearLyricScrollTimeout()
      this.lyricEvent.timeout = setTimeout(() => {
        this.lyricEvent.timeout = null
        this.lyricEvent.isStopScroll = false
        if (!this.isPlay) return
        this.handleScrollLrc()
      }, 3000)
    },
    handleWheel(event) {
      console.log(event.deltaY)
      if (!this.lyricEvent.isStopScroll) this.lyricEvent.isStopScroll = true
      if (cancelScrollFn) {
        cancelScrollFn()
        cancelScrollFn = null
      }
      this.$refs.dom_lyric.scrollTop = this.$refs.dom_lyric.scrollTop + event.deltaY
      this.startLyricScrollTimeout()
    },
    clearLyricScrollTimeout() {
      if (!this.lyricEvent.timeout) return
      clearTimeout(this.lyricEvent.timeout)
      this.lyricEvent.timeout = null
    },
    min() {
      window.eventHub.$emit(eventBaseName.min)
    },
    max() {
      window.eventHub.$emit(eventBaseName.max)
    },
    close() {
      window.eventHub.$emit(eventBaseName.close)
    },
    handleToggleCommentPage(page) {

    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';

@control-btn-width: @height-toolbar * .26;

.container {
  position: absolute;
  display: flex;
  flex-flow: column nowrap;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-color: @color-theme_2-background_1;
  z-index: 10;
  // -webkit-app-region: drag;
  overflow: hidden;
  border-radius: @radius-border;
  color: @color-theme_2-font;
  border-left: 12px solid @color-theme;
  -webkit-app-region: no-drag;

  &.controlBtnLeft {
    .controBtn {
      left: 0;
      flex-direction: row-reverse;
      height: @height-toolbar * .7;
      button + button {
        margin-right: @control-btn-width / 2;
      }
    }
  }
  &.controlBtnRight {
    .controBtn {
      right: @control-btn-width * .5;
      button + button {
        margin-left: @control-btn-width * 1.2;
      }
    }
  }
}
.bg {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-size: 110% 110%;
  filter: blur(60px);
  z-index: -1;
}
.bg2 {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: -1;
  background-color: rgba(255, 255, 255, .8);
}

.header {
  position: relative;
  flex: 0 0 @height-toolbar;
  -webkit-app-region: drag;
}

.controBtn {
  position: absolute;
  top: 0;
  display: flex;
  align-items: center;
  height: @height-toolbar;
  -webkit-app-region: no-drag;
  padding: 0 @control-btn-width;
  &:hover {
    .controBtnIcon {
      opacity: 1;
    }
  }

  button {
    position: relative;
    width: @control-btn-width;
    height: @control-btn-width;
    background: none;
    border: none;
    outline: none;
    padding: 1px;
    cursor: pointer;
    border-radius: 50%;
    color: @color-theme_2;
    display: flex;
    justify-content: center;
    align-items: center;

    &.hide {
      background-color: @color-hideBtn;
    }
    &.min {
      background-color: @color-minBtn;
    }
    &.max {
      background-color: @color-maxBtn;
    }
    &.close {
      background-color: @color-closeBtn;
    }
  }
}

.controBtnIcon {
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.main {
  flex: auto;
  min-height: 0;
  overflow: hidden;
  display: flex;
  padding: 0 30px;

  &.showComment {
    .left {
      flex-basis: 18%;
      .description p {
        font-size: 12px;
      }
    }
    .right {
      flex-basis: 30%;
      .lyric {
        font-size: 13px;
      }
    }
    .comment {
      flex-basis: 50%;
      opacity: 1;
    }
  }
}
.left {
  flex: auto;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  padding: 13px;
  overflow: hidden;
  transition: flex-basis @transition-theme;
}

.info {
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  max-width: 300px;

}
.img {
  max-width: 100%;
  max-height: 100%;
  min-width: 100%;
  box-shadow: 0 0 4px @color-theme-hover;
  border-radius: 6px;
  opacity: .8;
  // border: 5px solid @color-theme-hover;
  // border-radius: @radius-border;
  // border: 5px solid #fff;
}
.description {
  max-width: 300px;
  padding: 15px 0;
  overflow: hidden;
  p {
    line-height: 1.5;
    font-size: 14px;
    overflow-wrap: break-word;
  }
}

.right {
  flex: 0 0 60%;
  // padding: 0 30px;
  position: relative;
  transition: flex-basis @transition-theme;

  &:before {
    position: absolute;
    top: 0;
    left: 0;
    content: ' ';
    height: 100px;
    width: 100%;
    background-image: linear-gradient(0deg,rgba(255,255,255,0) 0%,@color-theme_2-background_1 95%);
    pointer-events: none;
  }
  &:after {
    position: absolute;
    bottom: 0;
    left: 0;
    content: ' ';
    height: 100px;
    width: 100%;
    background-image: linear-gradient(-180deg,rgba(255,255,255,0) 0%,@color-theme_2-background_1 95%);
    pointer-events: none;
  }
}
.lyric {
  text-align: center;
  height: 100%;
  overflow: hidden;
  font-size: 16px;
  cursor: grab;
  &.draging {
    cursor: grabbing;
  }
  p {
    padding: 8px 0;
    line-height: 1.2;
    overflow-wrap: break-word;
    transition: @transition-theme !important;
    transition-property: color, font-size;
  }
}
.lyric-space {
  height: 70%;
}
.lrc-active {
  color: @color-theme;
  font-size: 1.2em;
}

.comment {
  flex: 0 0 0;
  display: flex;
  flex-flow: column nowrap;
  transition: @transition-theme;
  transition-property: flex-basis opacity;
  overflow: hidden;
  opacity: 0;

}
.commentHeader {
  flex: none;
  padding-bottom: 10px;
  // border-bottom: 1px solid #eee;
  h3 {
    font-size: 14px;
  }
}
.commentMain {
  flex: auto;
  padding-left: 15px;
  padding-right: 10px;
  background-color: @color-reply-floor;
  border-radius: 4px;
}
.commentType {
  padding: 10px 0;
  font-size: 13px;
  color: @color-theme_2-font;
}
.pagination {
  padding: 10px 0;
}

.footer {
  flex: 0 0 100px;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.progress-container {
  width: 100%;
  position: relative;
  padding: 3px 0;
}
.progress-content {
  position: relative;
  height: 15px;
  padding: 5px 0;
  width: 100%;
}
.progress {
  height: 100%;
  width: 100%;
  border-radius: 0.2rem;
  // overflow: hidden;
  transition: @transition-theme;
  transition-property: background-color;
  background-color: @color-player-progress;
  // background-color: #f5f5f5;
  position: relative;
  border-radius: @radius-progress-border;
}
.progress-mask {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
.progress-bar {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  transform-origin: 0;
  border-top-right-radius: @radius-progress-border;
  border-bottom-right-radius: @radius-progress-border;
}
.progress-bar1 {
  background-color: @color-player-progress-bar1;
}
.progress-bar2 {
  background-color: @color-player-progress-bar2;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
  border-top-right-radius: 20px;
  border-bottom-right-radius: 20px;
}

.bar-transition {
  transition-property: transform;
  transition-timing-function: ease-out;
  transition-duration: 0.2s;
}
.time-label {
  width: 100%;
  display: flex;
  justify-content: space-between;
  span {
    font-size: 13px;
  }
}

.play-control {
  flex: none;
  height: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 25px;
  color: @color-btn;
}
.play-btn {
  height: 40%;
  padding: 5px;
  cursor: pointer;
  flex: none;
  // transition: @transition-theme;
  // transition-property: color;
  color: @color-player-detail-play-btn;
  transition: opacity 0.2s ease;
  opacity: 1;
  cursor: pointer;

  +.play-btn {
    margin-left: 10px;
  }
  svg {
    fill: currentColor;
    filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.2));
  }
  &:hover {
    opacity: 0.8;
  }
  &:active {
    opacity: 0.6;
  }
}

each(@themes, {
  :global(#container.@{value}) {
    .container {
      border-left-color: ~'@{color-@{value}-theme}';
      background-color: ~'@{color-@{value}-theme_2-background_1}';
    }
    .right {
      &:before {
        background-image: linear-gradient(0deg,rgba(255,255,255,0) 0%,~'@{color-@{value}-theme_2-background_1}' 95%);
      }
      &:after {
        background-image: linear-gradient(-180deg,rgba(255,255,255,0) 0%,~'@{color-@{value}-theme_2-background_1}' 95%);
      }
    }
    .controBtn {
      button {
        color: ~'@{color-@{value}-theme_2}';
        // &.hide:after {
        //   background-color: ~'@{color-@{value}-hideBtn}';
        // }
        &.hide {
          background-color: ~'@{color-@{value}-hideBtn}';
        }
        &.min {
          background-color: ~'@{color-@{value}-minBtn}';
        }
        &.max {
          background-color: ~'@{color-@{value}-maxBtn}';
        }
        &.close {
          background-color: ~'@{color-@{value}-closeBtn}';
        }
      }
    }
    .img {
      box-shadow: 0 0 4px ~'@{color-@{value}-theme-hover}';
      // border-color: ~'@{color-@{value}-theme-hover}';
    }
    .lrc-active {
      color: ~'@{color-@{value}-theme}';
    }
    .progress {
      background-color: ~'@{color-@{value}-player-progress}';
    }
    .progress-bar1 {
      background-color: ~'@{color-@{value}-player-progress-bar1}';
    }
    .progress-bar2 {
      background-color: ~'@{color-@{value}-player-progress-bar2}';
    }
    .play-btn {
      color: ~'@{color-@{value}-player-detail-play-btn}';
    }
  }
})

</style>
