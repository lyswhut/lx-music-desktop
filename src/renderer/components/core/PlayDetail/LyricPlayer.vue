<template>
<div :class="['right', $style.right]" :style="lrcFontSize">
  <div :class="['lyric', $style.lyric, { [$style.draging]: isMsDown }, { [$style.lrcActiveZoom]: isZoomActiveLrc }]" :style="lrcStyles" @wheel="handleWheel" @mousedown="handleLyricMouseDown" ref="dom_lyric">
    <div :class="['pre', $style.lyricSpace]"></div>
    <div ref="dom_lyric_text"></div>
    <div :class="$style.lyricSpace"></div>
  </div>
  <transition enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
    <div :class="$style.skip" v-if="isShowLyricProgressSetting" v-show="isStopScroll">
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
</div>
</template>

<script>
import { clipboardWriteText } from '@renderer/utils'
import { lyric } from '@renderer/core/share/lyric'
import { isFullscreen } from '@renderer/core/share'
import { isPlay, isShowLrcSelectContent, isShowPlayComment } from '@renderer/core/share/player'
import { onMounted, onBeforeUnmount, useCommit, useRefGetter, computed } from '@renderer/utils/vueTools'
import useLyric from '@renderer/utils/compositions/useLyric'

export default {
  setup() {
    const setting = useRefGetter('setting')
    const setPlayDetailLyricFont = useCommit('setPlayDetailLyricFont')
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
    } = useLyric({ isPlay, lyric })

    const fontSizeUp = () => {
      if (setting.value.playDetail.style.fontSize >= 200) return
      setPlayDetailLyricFont(setting.value.playDetail.style.fontSize + 1)
    }
    const fontSizeDown = () => {
      if (setting.value.playDetail.style.fontSize <= 70) return
      setPlayDetailLyricFont(setting.value.playDetail.style.fontSize - 1)
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
    const isZoomActiveLrc = computed(() => setting.value.playDetail.isZoomActiveLrc)
    const isShowLyricProgressSetting = computed(() => setting.value.playDetail.isShowLyricProgressSetting)

    onMounted(() => {
      window.eventHub.on('key_shift++_down', fontSizeUp)
      window.eventHub.on('key_numadd_down', fontSizeUp)
      window.eventHub.on('key_-_down', fontSizeDown)
      window.eventHub.on('key_numsub_down', fontSizeDown)
    })
    onBeforeUnmount(() => {
      window.eventHub.off('key_shift++_down', fontSizeUp)
      window.eventHub.off('key_numadd_down', fontSizeUp)
      window.eventHub.off('key_-_down', fontSizeDown)
      window.eventHub.off('key_numsub_down', fontSizeDown)
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

  &:before {
    position: absolute;
    z-index: 1;
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
  font-size: var(--playDetail-lrc-font-size, 16px);
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
    border-top: 1px dashed @color-player-detail-lyric-active;
    opacity: .15;
    margin-right: 30px;
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
  background-color: @color-theme_2-background_1;
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
    .right {
      &:before {
        background-image: linear-gradient(0deg,rgba(255,255,255,0) 0%,~'@{color-@{value}-theme_2-background_1}' 95%);
      }
      &:after {
        background-image: linear-gradient(-180deg,rgba(255,255,255,0) 0%,~'@{color-@{value}-theme_2-background_1}' 95%);
      }
    }
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
      background-color: ~'@{color-@{value}-theme_2-background_1}';
      color: ~'@{color-@{value}-player-detail-lyric}';
      .lrc-active {
        color: ~'@{color-@{value}-theme}';
      }
    }
  }
})

</style>
