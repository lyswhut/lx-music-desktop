<template>
<div :class="['right', $style.right]">
  <div :class="['lyric', $style.lyric, { [$style.draging]: isMsDown }]" @wheel="handleWheel" @mousedown="handleLyricMouseDown" ref="dom_lyric">
    <div :class="$style.lyricSpace"></div>
    <div :class="[$style.lyricText]" ref="dom_lyric_text"></div>
    <div :class="$style.lyricSpace"></div>
  </div>
  <transition enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
    <div :class="[$style.lyricSelectContent, 'select', 'scroll']" v-if="isShowLrcSelectContent" @contextmenu="handleCopySelectText">
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
import { isPlay, isShowLrcSelectContent } from '@renderer/core/share/player'
// import { ref } from '@renderer/utils/vueTools'
import useLyric from '@renderer/utils/compositions/useLyric'

export default {
  setup() {
    const {
      dom_lyric,
      dom_lyric_text,
      isMsDown,
      handleLyricMouseDown,
      handleWheel,
    } = useLyric({ isPlay, lyric })
    return {
      dom_lyric,
      dom_lyric_text,
      isMsDown,
      handleLyricMouseDown,
      handleWheel,
      lyric,
      isShowLrcSelectContent,
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
  font-size: 16px;
  cursor: grab;
  &.draging {
    cursor: grabbing;
  }
  :global {
    .lrc-content {
      line-height: 1.2;
      margin: 16px 0;
      overflow-wrap: break-word;
      color: @color-player-detail-lyric;

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
          font-size: .94em;
          color: @color-theme;
        }
        span {
          // color: @color-theme;
          font-size: 1.1em;
        }
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
