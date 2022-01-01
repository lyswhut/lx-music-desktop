<template lang="pug">
div(:class="[$style.lyric, { [$style.draging]: lyricEvent.isMsDown }, { [$style.lrcActiveZoom]: lrcConfig.style.isZoomActiveLrc } ]"
  :style="lrcStyles" @wheel="handleWheel" @mousedown="handleLyricMouseDown" @touchstart="handleLyricTouchStart" ref="dom_lyric")
  div(:class="$style.lyricSpace")
  div(:class="[$style.lyricText]" ref="dom_lyric_text")
  //- div(v-for="(info, index) in lyricLines" :key="index" :class="[$style.lineContent, lyric.line == index ? (lrcConfig.style.isZoomActiveLrc ? $style.lrcActiveZoom : $style.lrcActive) : null]")
    p(:class="$style.lrcLine") {{info.text}}
  div(:class="$style.lyricSpace")
</template>

<script>
import { rendererOn, rendererSend, NAMES } from '@common/ipc'
import { scrollTo } from '@renderer/utils'
import Lyric from '@renderer/utils/lyric-font-player'

let cancelScrollFn = null
let delayScrollTimeout

export default {
  props: {
    lrcConfig: {
      type: Object,
      default() {
        return {
          style: {
            font: '',
            fontSize: 125,
            opacity: 80,
            isZoomActiveLrc: true,
          },
        }
      },
    },
    isPlayLxlrc: {
      type: Boolean,
      default: true,
    },
    isShowLyricTranslation: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      musicInfo: {
        songmid: null,
        name: '^',
        singer: '^',
        album: null,
      },
      lyric: {
        line: 0,
        lines: [],
      },
      dom_lines: [],
      clickTime: 0,
      lyricEvent: {
        isMsDown: false,
        msDownY: 0,
        msDownScrollY: 0,
        isStopScroll: false,
        timeout: null,
      },
      winEvent: {
        isMsDown: false,
        msDownX: 0,
        msDownY: 0,
      },
      _lyricLines: [],
      lyricLines: [],
      isSetedLines: false,
      isPlay: false,
      lyrics: {
        lyric: '',
        tlyric: '',
        lxlyric: '',
      },
    }
  },
  computed: {
    lrcStyles() {
      return {
        fontFamily: this.lrcConfig.style.font,
        fontSize: this.lrcConfig.style.fontSize / 100 + 'rem',
        opacity: this.lrcConfig.style.opacity / 100,
      }
    },
  },
  watch: {
    'lyric.lines': {
      handler(n, o) {
        this.isSetedLines = true
        if (o) {
          this._lyricLines = n
          if (n.length) {
            this.lyricLines = n
            this.$nextTick(() => {
              this.dom_lines = this.$refs.dom_lyric.querySelectorAll('.lrc-content')
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
                this.dom_lines = this.$refs.dom_lyric.querySelectorAll('.lrc-content')
                this.handleScrollLrc()
              })
            }, 50)
          }
        } else {
          this.lyricLines = n
          this.$nextTick(() => {
            this.dom_lines = this.$refs.dom_lyric.querySelectorAll('.lrc-content')
            this.handleScrollLrc()
          })
        }
      },
      immediate: true,
    },
    'lyric.line': {
      handler(n, o) {
        if (n < 0) return
        if (n == 0 && this.isSetedLines) return this.isSetedLines = false
        if (o == null || n - o != 1) return this.handleScrollLrc()
        delayScrollTimeout = setTimeout(() => {
          delayScrollTimeout = null
          this.handleScrollLrc(600)
        }, 600)
      },
      immediate: true,
    },
    isShowLyricTranslation() {
      this.setLyric()
      rendererSend(NAMES.winLyric.get_lyric_info, 'status')
    },
    isPlayLxlrc() {
      this.setLyric()
      rendererSend(NAMES.winLyric.get_lyric_info, 'status')
    },
  },
  created() {
    rendererOn(NAMES.winLyric.set_lyric_info, (event, data) => this.handleSetInfo(data))
    window.lrc = new Lyric({
      lineClassName: 'lrc-content',
      fontClassName: 'font',
      shadowClassName: 'shadow',
      shadowContent: true,
      activeLineClassName: 'active',
      onPlay: (line, text) => {
        this.lyric.text = text
        this.lyric.line = line
        // console.log(line, text)
      },
      onSetLyric: lines => { // listening lyrics seting event
        // console.log(lines) // lines is array of all lyric text
        this.$refs.dom_lyric_text.textContent = ''
        const dom_lines = document.createDocumentFragment()
        for (const line of lines) {
          dom_lines.appendChild(line.dom_line)
        }
        this.$refs.dom_lyric_text.appendChild(dom_lines)
        this.lyric.lines = lines
        this.lyric.line = 0
      },
      offset: 100,
    })
  },
  mounted() {
    document.addEventListener('mousemove', this.handleMouseMsMove)
    document.addEventListener('mouseup', this.handleMouseMsUp)
    document.addEventListener('touchmove', this.handleTouchMove)
    document.addEventListener('touchend', this.handleMouseMsUp)
    rendererSend(NAMES.winLyric.get_lyric_info, 'info')
  },
  beforeUnmount() {
    this.clearLyricScrollTimeout()
    document.removeEventListener('mousemove', this.handleMouseMsMove)
    document.removeEventListener('mouseup', this.handleMouseMsUp)
    document.removeEventListener('touchmove', this.handleTouchMove)
    document.removeEventListener('touchend', this.handleMouseMsUp)
  },
  methods: {
    handleSetInfo({ type, data }) {
      // console.log(type, data)
      switch (type) {
        case 'lyric':
          this.lyrics.lyric = data.lrc
          this.lyrics.tlyric = data.tlrc
          this.lyrics.lxlyric = data.lxlrc
          this.setLyric()
          break
        case 'play':
          this.isPlay = true
          window.lrc.play(data)
          break
        case 'pause':
          this.isPlay = false
          window.lrc.pause()
          break
        case 'info':
          // console.log('info', data)
          this.lyrics.lyric = data.lrc
          this.lyrics.tlyric = data.tlrc
          this.lyrics.lxlyric = data.lxlrc
          this.setLyric()
          this.$nextTick(() => {
            this.lyric.line = data.line
            rendererSend(NAMES.winLyric.get_lyric_info, 'status')
          })
        case 'music_info':
          this.musicInfo.name = data.name
          this.musicInfo.songmid = data.songmid
          this.musicInfo.singer = data.singer
          this.musicInfo.album = data.album
          break

        case 'status':
          // console.log('status', data)
          this.isPlay = data.isPlay
          this.lyric.line = data.line
          if (data.isPlay) window.lrc.play(data.played_time)
          break

        default:
          break
      }
      // console.log(data)
    },
    handleResize() {
      this.setProgressWidth()
    },
    handleScrollLrc(duration = 300) {
      if (!this.dom_lines.length) return
      if (cancelScrollFn) {
        cancelScrollFn()
        cancelScrollFn = null
      }
      if (this.lyricEvent.isStopScroll) return
      let dom_p = this.dom_lines[this.lyric.line]
      cancelScrollFn = scrollTo(this.$refs.dom_lyric, dom_p ? (dom_p.offsetTop - this.$refs.dom_lyric.clientHeight * 0.5 + dom_p.clientHeight / 2) : 0, duration)
    },
    handleLyricDown(target, x, y) {
      if (target.classList.contains('font') ||
        target.parentNode.classList.contains('font') ||
        target.classList.contains('translation') ||
        target.parentNode.classList.contains('translation')) {
        this.lyricEvent.isMsDown = true
        this.lyricEvent.msDownY = y
        this.lyricEvent.msDownScrollY = this.$refs.dom_lyric.scrollTop
      } else {
        if (delayScrollTimeout) {
          clearTimeout(delayScrollTimeout)
          delayScrollTimeout = null
        }
        this.winEvent.isMsDown = true
        this.winEvent.msDownX = x
        this.winEvent.msDownY = y
      }
    },
    handleLyricMouseDown(e) {
      this.handleLyricDown(e.target, e.clientX, e.clientY)
    },
    handleLyricTouchStart(e) {
      if (e.changedTouches.length) {
        const touch = e.changedTouches[0]
        this.handleLyricDown(e.target, touch.clientX, touch.clientY)
      }
    },
    handleMouseMsUp(e) {
      this.lyricEvent.isMsDown = false
      this.winEvent.isMsDown = false
    },
    handleMove(x, y) {
      if (this.lyricEvent.isMsDown) {
        if (!this.lyricEvent.isStopScroll) this.lyricEvent.isStopScroll = true
        if (cancelScrollFn) {
          cancelScrollFn()
          cancelScrollFn = null
        }
        this.$refs.dom_lyric.scrollTop = this.lyricEvent.msDownScrollY + this.lyricEvent.msDownY - y
        this.startLyricScrollTimeout()
      } else if (this.winEvent.isMsDown) {
        rendererSend(NAMES.winLyric.set_win_bounds, {
          x: x - this.winEvent.msDownX,
          y: y - this.winEvent.msDownY,
          w: window.innerWidth,
          h: window.innerHeight,
        })
      }
    },
    handleTouchMove(e) {
      if (e.changedTouches.length) {
        const touch = e.changedTouches[0]
        this.handleMove(touch.clientX, touch.clientY)
      }
    },
    handleMouseMsMove(e) {
      this.handleMove(e.clientX, e.clientY)
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
      // console.log(event.deltaY)
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
    close() {
      rendererSend(NAMES.winLyric.close)
    },
    setLyric() {
      window.lrc.setLyric(
        this.isPlayLxlrc && this.lyrics.lxlyric ? this.lyrics.lxlyric : this.lyrics.lyric,
        this.isShowLyricTranslation && this.lyrics.tlyric ? this.lyrics.tlyric : '',
        // (this.isShowLyricTranslation && this.lyrics.tlyric ? (this.lyrics.tlyric + '\n') : '') + (this.lyrics.lyric || ''),
      )
    },
  },
}
</script>

<style lang="less" module>
@import '@lyric/assets/styles/layout.less';

.lyric {
  text-align: center;
  height: 100%;
  overflow: hidden;
  font-size: 16px;
  color: @color-theme-lyric;
  contain: strict;
  cursor: move;

  :global {
    .lrc-content {
      line-height: 1.2;
      margin: 16px 0;
      overflow-wrap: break-word;

      .font {
        display: inline-block;
      }

      .font, .translation {
        cursor: grab;
      }

      .translation {
        transition: @transition-theme !important;
        transition-property: font-size, color;
        font-size: 0.8em;
        margin-top: 5px;
      }

      .line {
        transition-property: font-size, color !important;
        background: none !important;
        -webkit-text-fill-color: unset;
        // -webkit-text-fill-color: none !important;
      }
      &.active {
        .line {
          color: @color-theme;
        }
        .translation {
          color: @color-theme;
        }
        // span {
          // color: @color-theme;
        // }
      }


      span {
        transition: @transition-theme !important;
        transition-property: font-size !important;
        font-size: 1em;
        background-repeat: no-repeat;
        background-color: @color-theme-lyric;
        background-image: -webkit-linear-gradient(top, @color-theme, @color-theme);
        -webkit-text-fill-color: transparent;
        -webkit-background-clip: text;
        background-size: 0 100%;
      }
    }

    .shadow {
      text-shadow: 1px 1px 2px rgb(32, 32, 32);
    }
  }
  // p {
  //   padding: 8px 0;
  //   line-height: 1.2;
  //   overflow-wrap: break-word;
  //   transition: @transition-theme !important;
  //   transition-property: color, font-size;
  // }
}
// .lrc-line {
//   display: inline-block;
//   padding: 8px 0;
//   line-height: 1.2;
//   overflow-wrap: break-word;
//   transition: @transition-theme;
//   transition-property: color, font-size, text-shadow;
//   cursor: grab;
//   // font-weight: bold;
//   // background-clip: text;
//   color: @color-theme-lyric;
//   text-shadow: 1px 1px 2px #000;
//   // background: linear-gradient(@color-theme-lyric, @color-theme-lyric);
//   // background-clip: text;
//   // -webkit-background-clip: text;
//   // -webkit-text-fill-color: #fff;
//   // -webkit-text-stroke: thin #124628;
// }
.lyric-space {
  height: 70%;
}
.lrc-active {

  .lrc-line {
    color: @color-theme-lyric_2;
    // background: linear-gradient(@color-theme-lyric, @color-theme-lyric_2);
    // background-clip: text;
    // -webkit-background-clip: text;
    // -webkit-text-fill-color: @color-theme-lyric_2;
    // -webkit-text-stroke: thin #124628;
  }
}
.draging {
  :global {
    .lrc-content {
      .font, .translation {
        cursor: grabbing;
      }
    }
  }
}
.lrc-active-zoom {
  :global {
    .lrc-content {
      &.active {
        .translation {
          font-size: .94em;
        }
        span {
          font-size: 1.2em;
        }
      }
    }
  }
}
.footer {
  flex: 0 0 100px;
  overflow: hidden;
  display: flex;
  align-items: center;
}


each(@themes, {
  :global(#container.@{value}) {
    // .lrc-line {
    //   color: ~'@{color-@{value}-theme-lyric}';
    // }
    .lrc-active, .lrc-active-zoom {
      .lrc-line {
        color: ~'@{color-@{value}-theme-lyric_2}';
      }
    }
    .lyric {
      color: ~'@{color-@{value}-theme-lyric}';
      :global {
        .lrc-content {
          &.active {
            .translation {
              color: ~'@{color-@{value}-theme}';
            }
            .line {
              color: ~'@{color-@{value}-theme}';
            }
          }
          span {
            // background-color: ~'@{color-@{value}-theme_2-font}';
            background-image: -webkit-linear-gradient(top, ~'@{color-@{value}-theme}', ~'@{color-@{value}-theme}');
          }
        }
      }
    }
  }
})

</style>
