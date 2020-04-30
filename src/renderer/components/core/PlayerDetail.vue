<template lang="pug">
  div(:class="$style.container" @contextmenu="handleContextMenu")
    //- div(:class="$style.bg" :style="bgStyle")
    //- div(:class="$style.bg2")
    div(:class="$style.header")
      div(:class="$style.control")
        button(type="button" :class="$style.hide" :title="$t('core.player.hide_detail')" @click="visiblePlayerDetail(false)")
        button(type="button" :class="$style.min" :title="$t('core.toolbar.min')" @click="min")
        //- button(type="button" :class="$style.max" @click="max")
        button(type="button" :class="$style.close" :title="$t('core.toolbar.close')" @click="close")

    div(:class="$style.main")
      div(:class="$style.left")
        div(:class="$style.info")
          div(:class="$style.img")
            img(:src="musicInfo.img" v-if="musicInfo.img")
          div(:class="$style.description")
            p {{$t('core.player.name')}}{{musicInfo.name}}
            p {{$t('core.player.singer')}}{{musicInfo.singer}}
            p(v-if="musicInfo.album") {{$t('core.player.album')}}{{musicInfo.album}}
        //- div(:class="$style.list")
          ul

      div(:class="$style.right")
        div(:class="[$style.lyric, lyricEvent.isMsDown ? $style.draging : null]" @mousedown="handleLyricMouseDown" ref="dom_lyric")
          div(:class="$style.lyricSpace")
          p(v-for="(info, index) in lyric.lines" :key="index" :class="lyric.line == index ? $style.lrcActive : null") {{info.text}}
          div(:class="$style.lyricSpace")
    div(:class="$style.footer")
      div(:class="$style.left")
        div(:class="$style.progressContainer")
          div(:class="$style.progressContent")
            div(:class="$style.progress")
              //- div(:class="[$style.progressBar, $style.progressBar1]" :style="{ transform: `scaleX(${progress || 0})` }")
              div(:class="[$style.progressBar, $style.progressBar2, isActiveTransition ? $style.barTransition : '']" @transitionend="handleTransitionEnd" :style="{ transform: `scaleX(${playInfo.progress || 0})` }")
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
        div(:class="$style.playBtn" @click="$emit('action', { type: 'prev' })" style="transform: rotate(180deg);" :title="$t('core.player.prev')")
          svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 220.847 220.847' space='preserve')
            use(xlink:href='#icon-nextMusic')
        div(:class="$style.playBtn" :title="isPlay ? $t('core.player.pause') : $t('core.player.play')" @click="$emit('action', { type: 'togglePlay' })")
          svg(v-if="isPlay" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 277.338 277.338' space='preserve')
            use(xlink:href='#icon-pause')
          svg(v-else version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 170 170' space='preserve')
            use(xlink:href='#icon-play')
        div(:class="$style.playBtn" @click="$emit('action', { type: 'next' })" :title="$t('core.player.next')")
          svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 220.847 220.847' space='preserve')
            use(xlink:href='#icon-nextMusic')
</template>


<script>
import { mapGetters, mapMutations } from 'vuex'
import { rendererSend } from 'common/ipc'
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
    'musicInfo.img': {
      handler(n) {
        if (n) {
          this.bgStyle.backgroundImage = `url(${n})`
        }
      },
      immediate: true,
    },
    'lyric.lines': {
      handler() {
        this.$nextTick(() => {
          this.dom_lines = this.$refs.dom_lyric.querySelectorAll('p')
          this.handleScrollLrc()
        })
      },
      immediate: true,
    },
    'lyric.line': {
      handler(n) {
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
    ...mapGetters('player', ['isShowPlayerDetail']),
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
    clearLyricScrollTimeout() {
      if (!this.lyricEvent.timeout) return
      clearTimeout(this.lyricEvent.timeout)
      this.lyricEvent.timeout = null
    },
    min() {
      rendererSend('min')
    },
    max() {
      rendererSend('max')
    },
    close() {
      rendererSend('close')
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';

@control-btn-width: @height-toolbar * .5;

.container {
  position: absolute;
  display: flex;
  flex-flow: column nowrap;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-color: #fff;
  z-index: 10;
  // -webkit-app-region: drag;
  overflow: hidden;
  border-radius: 4px;
  color: @color-theme_2-font;
  border-left: 12px solid @color-theme;
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
.control {
  position: absolute;
  right: 0;
  top: 0;
  display: flex;
  align-items: center;
  height: @height-toolbar;
  -webkit-app-region: no-drag;
  padding: 0 @control-btn-width * 0.6;
  &:hover {
    button:before {
      opacity: 1;
    }
  }

  button {
    position: relative;
    width: @control-btn-width;
    height: @control-btn-width;
    background: none;
    border: none;
    display: flex;
    justify-content: center;
    align-items: center;
    outline: none;
    padding: 0;
    cursor: pointer;
    + button {
      margin-left: @control-btn-width * .4;
    }

    &:after {
      content: ' ';
      display: block;
      border-radius: 50%;
      width: 14px;
      height: 14px;
      transition: background-color 0.2s ease-in-out;
    }

    &:before {
      display: block;
      position: absolute;
      opacity: 0;
      transition: opacity @transition-theme;
    }

    &.hide:after {
      background-color: @color-hideBtn;
    }
    &.min:after {
      background-color: @color-minBtn;
    }
    &.max:after {
      background-color: @color-maxBtn;
    }
    &.close:after {
      background-color: @color-closeBtn;
    }

    &.hide:hover:after {
      background-color: @color-hideBtn-hover;
    }
    &.min:hover:after {
      background-color: @color-minBtn-hover;
      opacity: 1;
    }
    &.max:hover:after {
      background-color: @color-maxBtn-hover;
    }
    &.close:hover:after {
      background-color: @color-closeBtn-hover;
    }
  }
}

.hide {
  &:before {
    content: '∨';
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    font-size: 14px;
    line-height: 1;
    color: #fff;
  }
}

.min {
  &:before {
    content: ' ';
    width: 8px;
    height: 2px;
    left: @control-btn-width / 2 - 4;
    top: @control-btn-width / 2 - 1;
    background-color: #fff;
  }
}

.close {
  &:before {
    content: '×';
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    font-size: 14px;
    line-height: 1;
    color: #fff;
  }
}

.main {
  flex: auto;
  min-height: 0;
  overflow: hidden;
  display: flex;
  padding: 0 30px;
}
.left {
  flex: 0 0 40%;
  overflow: hidden;
}
.info {
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
}
.img {
  width: 300px;
  height: 300px;
  display: flex;
  justify-content: flex-start;
  align-items: center;

  img {
    max-width: 100%;
    max-height: 100%;
    border: 5px solid @color-theme-hover;
    // border: 5px solid #fff;
  }
}
.description {
  width: 300px;
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
  &:before {
    position: absolute;
    top: 0;
    left: 0;
    content: ' ';
    height: 100px;
    width: 100%;
    background-image: linear-gradient(0deg,rgba(255,255,255,0) 0%,#fff 95%);
    pointer-events: none;
  }
  &:after {
    position: absolute;
    bottom: 0;
    left: 0;
    content: ' ';
    height: 100px;
    width: 100%;
    background-image: linear-gradient(-180deg,rgba(255,255,255,0) 0%,#fff 95%);
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
    transition: @transition-theme;
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
.footer {
  flex: 0 0 100px;
  overflow: hidden;
  display: flex;
  align-items: center;
}
.left {
  flex: auto;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  padding-top: 13px;
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
  transition: @transition-theme;
  transition-property: color;
  color: @color-player-detail-play-btn;
  transition: opacity 0.1s ease;
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
    }
    .control {
      button {
        // &.hide:after {
        //   background-color: ~'@{color-@{value}-hideBtn}';
        // }
        &.hide:after {
          background-color: ~'@{color-@{value}-hideBtn}';
        }
        &.min:after {
          background-color: ~'@{color-@{value}-minBtn}';
        }
        &.max:after {
          background-color: ~'@{color-@{value}-maxBtn}';
        }
        &.close:after {
          background-color: ~'@{color-@{value}-closeBtn}';
        }

        &.hide:hover:after {
          background-color: ~'@{color-@{value}-hideBtn-hover}';
        }
        &.min:hover:after {
          background-color: ~'@{color-@{value}-minBtn-hover}';
        }
        &.max:hover:after {
          background-color: ~'@{color-@{value}-maxBtn-hover}';
        }
        &.close:hover:after {
          background-color: ~'@{color-@{value}-closeBtn-hover}';
        }
      }
    }
    .img {
      img {
        border-color: ~'@{color-@{value}-theme-hover}';
      }
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
