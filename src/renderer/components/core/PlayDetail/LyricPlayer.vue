<template>
<div :class="['right', $style.right]" :style="lrcFontSize">
  <transition enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
    <div v-show="!isShowLrcSelectContent"
      :class="['lyric', $style.lyric, { [$style.draging]: isMsDown }, { [$style.lrcActiveZoom]: isZoomActiveLrc }]"
      :style="lrcStyles" @wheel="handleWheel"
      @mousedown="handleLyricMouseDown" ref="dom_lyric"
      @contextmenu.stop="handleShowLyricMenu"
    >
      <div :class="['pre', $style.lyricSpace]"></div>
      <div ref="dom_lyric_text"></div>
      <div :class="$style.lyricSpace"></div>
    </div>
  </transition>
  <transition enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
    <div :class="$style.skip" v-if="isShowLyricProgressSetting" v-show="isStopScroll && !isShowLrcSelectContent">
      <div :class="$style.line" ref="dom_skip_line"></div>
      <span :class="$style.label">{{timeStr}}</span>
      <base-btn :class="$style.skipBtn" @mouseenter="handleSkipMouseEnter" @mouseleave="handleSkipMouseLeave" @click="handleSkipPlay">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="50%" viewBox="0 0 170 170" space="preserve">
          <use xlink:href="#icon-play"></use>
        </svg>
      </base-btn>
    </div>
  </transition>
  <transition enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
    <div :class="[$style.lyricSelectContent, 'select', 'scroll', 'lyricSelectContent']" v-if="isShowLrcSelectContent" @contextmenu="handleCopySelectText">
      <div v-for="(info, index) in lyric.lines" :key="index" :class="[$style.lyricSelectline, { [$style.lrcActive]: lyric.line == index }]">
        <span>{{info.text}}</span>
        <br v-if="info.translation"/>
        <span :class="$style.lyricSelectlineTransition">{{info.translation}}</span>
      </div>
    </div>
  </transition>
  <LyricMenu v-model="lyricMenuVisible" :xy="lyricMenuXY" :lyricInfo="lyricInfo" @updateLyric="handleUpdateLyric" />
</div>
</template>

<script>
import { clipboardWriteText } from '@renderer/utils'
import { lyric } from '@renderer/core/share/lyric'
import { isFullscreen } from '@renderer/core/share'
import { isPlay, isShowLrcSelectContent, isShowPlayComment, musicInfo as playerMusicInfo, musicInfoItem, setMusicInfo } from '@renderer/core/share/player'
import { onMounted, onBeforeUnmount, useRefGetter, computed, reactive, ref } from '@renderer/utils/vueTools'
import useLyric from '@renderer/utils/compositions/useLyric'
import LyricMenu from './components/LyricMenu'
import { player as eventPlayerNames } from '@renderer/event/names'

export default {
  components: {
    LyricMenu,
  },
  setup() {
    const setting = useRefGetter('setting')
    const isZoomActiveLrc = computed(() => setting.value.playDetail.isZoomActiveLrc)
    const isShowLyricProgressSetting = computed(() => setting.value.playDetail.isShowLyricProgressSetting)

    const {
      dom_lyric,
      dom_lyric_text,
      dom_skip_line,
      isMsDown,
      isStopScroll,
      timeStr,
      handleLyricMouseDown,
      handleWheel,
      handleSkipPlay,
      handleSkipMouseEnter,
      handleSkipMouseLeave,
    } = useLyric({ isPlay, lyric, isShowLyricProgressSetting })

    const lyricMenuVisible = ref(false)
    const lyricMenuXY = reactive({
      x: 0,
      y: 0,
    })
    const lyricInfo = reactive({
      lyric: '',
      tlyric: '',
      lxlyric: '',
      musicInfo: null,
    })
    const updateMusicInfo = () => {
      lyricInfo.lyric = playerMusicInfo.lrc
      lyricInfo.tlyric = playerMusicInfo.tlrc
      lyricInfo.lxlyric = playerMusicInfo.lxlrc
      lyricInfo.musicInfo = musicInfoItem.value
    }
    const handleShowLyricMenu = event => {
      updateMusicInfo()
      lyricMenuXY.x = event.pageX
      lyricMenuXY.y = event.pageY
      lyricMenuVisible.value = true
    }
    const handleUpdateLyric = ({ lyric, tlyric, lxlyric, offset }) => {
      setMusicInfo({
        lrc: lyric,
        tlrc: tlyric,
        lxlrc: lxlyric,
      })
      console.log(offset)
      window.eventHub.emit(eventPlayerNames.updateLyricOffset, offset)
    }

    const lrcStyles = computed(() => {
      return {
        textAlign: setting.value.playDetail.style.align,
      }
    })
    const lrcFontSize = computed(() => {
      let size = setting.value.playDetail.style.fontSize / 100
      if (isFullscreen.value) size = size *= 1.4
      return {
        '--playDetail-lrc-font-size': (isShowPlayComment.value ? size * 0.82 : size) + 'rem',
      }
    })

    onMounted(() => {
      window.eventHub.on(eventPlayerNames.updateLyric, updateMusicInfo)
    })
    onBeforeUnmount(() => {
      window.eventHub.off(eventPlayerNames.updateLyric, updateMusicInfo)
    })

    return {
      dom_lyric,
      dom_lyric_text,
      dom_skip_line,
      isMsDown,
      timeStr,
      handleLyricMouseDown,
      handleWheel,
      handleSkipPlay,
      handleSkipMouseEnter,
      handleSkipMouseLeave,
      lyric,
      lrcStyles,
      lrcFontSize,
      isShowLrcSelectContent,
      isShowLyricProgressSetting,
      isZoomActiveLrc,
      isStopScroll,
      lyricMenuVisible,
      lyricMenuXY,
      handleShowLyricMenu,
      handleUpdateLyric,
      lyricInfo,
    }
  },
  methods: {
    handleCopySelectText() {
      let str = window.getSelection().toString()
      str = str.trim()
      if (!str.length) return
      clipboardWriteText(str)
    },
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.right {
  flex: 0 0 60%;
  // padding: 0 30px;
  position: relative;
  transition: flex-basis @transition-theme;
}
.lyric {
  text-align: center;
  height: 100%;
  overflow: hidden;
  font-size: var(--playDetail-lrc-font-size, 16px);
  -webkit-mask-image: linear-gradient(transparent 0%, #fff 20%,  #fff 80%, transparent 100%);
  cursor: grab;
  &.draging {
    cursor: grabbing;
  }
  :global {
    .lrc-content {
      line-height: 1.2;
      padding: calc(var(--playDetail-lrc-font-size, 16px) / 2) 0;
      overflow-wrap: break-word;
      color: @color-player-detail-lyric;
      transition: @transition-theme;
      transition-property: padding;

      .translation {
        transition: @transition-theme !important;
        transition-property: font-size, color;
        font-size: .9em;
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
        //   // color: @color-theme;
        //   font-size: 1.1em;
        // }
      }

      span {
        transition: @transition-theme !important;
        transition-property: font-size !important;
        font-size: 1em;
        background-repeat: no-repeat;
        background-color: rgba(77, 77, 77, 0.9);
        background-image: -webkit-linear-gradient(top, @color-theme, @color-theme);
        -webkit-text-fill-color: transparent;
        -webkit-background-clip: text;
        background-size: 0 100%;
      }
    }
  }
  // p {
  //   padding: 8px 0;
  //   line-height: 1.2;
  //   overflow-wrap: break-word;
  //   transition: @transition-theme !important;
  //   transition-property: color, font-size;
  // }
  // .lrc-active {
  //   color: @color-theme;
  //   font-size: 1.2em;
  // }
}
.lrcActiveZoom {
  :global {
    .lrc-content {
      &.active {
        .translation {
          font-size: .94em;
        }
        span {
          font-size: 1.1em;
        }
      }
    }
  }
}

.skip {
  position: absolute;
  top: calc(38% + var(--playDetail-lrc-font-size, 16px) + 4px);
  left: 0;
  // height: 6px;
  width: 100%;
  pointer-events: none;
  // opacity: .5;
  .line {
    border-top: 2px dotted @color-player-detail-lyric-active;
    opacity: .15;
    margin-right: 30px;
    -webkit-mask-image: linear-gradient(90deg, transparent 0%, transparent 15%, #fff 100%);
  }
  .label {
    position: absolute;
    right: 30px;
    top: -14px;
    line-height: 1;
    font-size: 12px;
    color: @color-player-detail-lyric-active;
    opacity: .7;
  }
  .skipBtn {
    position: absolute;
    right: 0;
    top: 0;
    transform: translateY(-50%);
    width: 30px;
    height: 30px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none !important;
    pointer-events: initial;
    transition: @transition-theme;
    transition-property: opacity;
    opacity: .8;
    &:hover {
      opacity: .6;
    }
  }
}
.lyricSelectContent {
  position: absolute;
  left: 0;
  top: 0;
  // text-align: center;
  height: 100%;
  width: 100%;
  font-size: 16px;
  z-index: 10;
  color: @color-player-detail-lyric;

  .lyricSelectline {
    padding: 8px 0;
    overflow-wrap: break-word;
    transition: @transition-theme !important;
    transition-property: color, font-size;
    line-height: 1.3;
  }
  .lyricSelectlineTransition {
    font-size: 14px;
  }
  .lrc-active {
    color: @color-theme;
  }
}

.lyric-space {
  height: 70%;
}

each(@themes, {
  :global(#root.@{value}) {
    .lyric {
      :global {
        .lrc-content {
          color: ~'@{color-@{value}-player-detail-lyric}';

          &.active {
            .translation {
              color: ~'@{color-@{value}-player-detail-lyric-active}';
            }
            .line {
              color: ~'@{color-@{value}-player-detail-lyric-active}';
            }
          }
          span {
            background-color: ~'@{color-@{value}-player-detail-lyric}';
            background-image: -webkit-linear-gradient(top, ~'@{color-@{value}-player-detail-lyric-active}', ~'@{color-@{value}-player-detail-lyric-active}');
          }
        }
      }
    }
    // .lrc-active {
    //   color: ~'@{color-@{value}-theme}';
    // }
    .skip {
      .line {
        border-top-color: ~'@{color-@{value}-player-detail-lyric-active}';
      }
      .label {
        color:~'@{color-@{value}-player-detail-lyric-active}';
      }
    }
    .lyricSelectContent {
      color: ~'@{color-@{value}-player-detail-lyric}';
      .lrc-active {
        color: ~'@{color-@{value}-theme}';
      }
    }
  }
})

</style>
