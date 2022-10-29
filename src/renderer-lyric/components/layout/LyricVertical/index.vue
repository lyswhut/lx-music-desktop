<template>
  <div
    ref="dom_lyric"
    :class="[$style.lyric, { [$style.draging]: isMsDown }, { [$style.lrcActiveZoom]: isZoomActiveLrc }, { [$style.ellipsis]: ellipsis } ]"
    :style="lrcStyles" @wheel="handleWheel" @mousedown="handleLyricMouseDown" @touchstart="handleLyricTouchStart"
  >
    <div :class="$style.lyricSpace" />
    <div ref="dom_lyric_text" :class="[$style.lyricText]" />
    <div :class="$style.lyricSpace" />
  </div>
</template>

<script>
import { setting } from '@lyric/store/state'
import { computed } from '@common/utils/vueTools'
import useLyric from './useLyric'

export default {
  setup() {
    const isZoomActiveLrc = computed(() => setting['desktopLyric.style.isZoomActiveLrc'])
    const ellipsis = computed(() => setting['desktopLyric.style.ellipsis'])
    // const fontWeight = computed(() => setting['desktopLyric.style.fontWeight'])
    const lrcStyles = computed(() => ({
      fontFamily: setting['desktopLyric.style.font'],
      fontSize: Math.trunc(setting['desktopLyric.style.fontSize']) + 'px',
      opacity: setting['desktopLyric.style.opacity'] / 100,
      textAlign: setting['desktopLyric.style.align'],
      '--line-gap': Math.ceil(setting['desktopLyric.style.lineGap'] * 1.06) + 'px',
      '--line-extended-gap': Math.ceil(setting['desktopLyric.style.lineGap'] * 1.06 / 8).toFixed(2) + 'px',
    }))
    const {
      dom_lyric,
      dom_lyric_text,
      isMsDown,
      handleLyricMouseDown,
      handleLyricTouchStart,
      handleWheel,
    } = useLyric()

    return {
      isZoomActiveLrc,
      lrcStyles,
      ellipsis,
      // fontWeight,

      dom_lyric,
      dom_lyric_text,
      isMsDown,
      handleLyricMouseDown,
      handleLyricTouchStart,
      handleWheel,
    }
  },
}
</script>

<style lang="less" module>
@import '@lyric/assets/styles/layout.less';

.lyric {
  position: relative;
  text-align: center;
  height: 100%;
  overflow-x: scroll;
  font-size: 16px;
  contain: strict;
  cursor: move;
  writing-mode: vertical-rl;
  width: 100%;
  &::-webkit-scrollbar {
    height: 0;
  }

  :global {
    .font-lrc {
      color: var(--color-lyric-unplay);
    }
    .shadow {
      color: transparent;
    }
    .line-content {
      line-height: 1.2;
      margin: 0 var(--line-gap);
      overflow-wrap: break-word;
      letter-spacing: 5px;

      .font-lrc {
        cursor: grab;
      }

      .extended {
        font-size: 0.8em;
        margin-right: var(--line-extended-gap);
      }
      &.line-mode {
        .font-lrc {
          transition: @transition-slow;
          transition-property: font-size, color;
        }
      }
      &.line-mode.active .font-lrc, &.font-mode.played .font-lrc {
        color: var(--color-lyric-played);
      }
      &.font-mode .extended .font-lrc {
        transition: @transition-slow;
        transition-property: font-size, color;
      }
      &.font-mode > .line {
        font-weight: bold;
      }

      &.font-mode > .line > .font-lrc {
        > span {
          transition: @transition-slow;
          transition-property: font-size;
          font-size: 1em;
          background-repeat: no-repeat;
          background-color: var(--color-lyric-unplay);
          background-image: -webkit-linear-gradient(top, var(--color-lyric-played), var(--color-lyric-played));
          -webkit-text-fill-color: transparent;
          -webkit-background-clip: text;
          background-size: 0 100%;
        }
      }
    }
    // .shadow {
    //   .stroke2(rgba(0, 0, 0, 0.05));
    //   transition: font-size @transition-normal;
    // }
    // .font-mode .line .shadow {
    //   .stroke(1px, rgba(0, 0, 0, 0.05));
    //   // text-shadow: 1px 0 2px rgba(0, 0, 0, 0.30), 1px 0 1px rgba(0, 0, 0, 0.20);
    // }
    .line-mode .font-lrc, .extended .font-lrc {
      // text-shadow: 0 0 2px rgba(0, 0, 0, 0.7), 0 0 2px rgba(0, 0, 0, 0.3), 0 0 1px rgba(0, 0, 0, 0.3);
      // .stroke2(rgba(0, 0, 0, 0.14));
      .stroke2(var(--color-lyric-shadow));
      // .stroke(1px, rgba(0, 0, 0, 0.08));
      // .stroke(2px, rgba(0, 0, 0, 0.025));
      transition: font-size @transition-slow;
    }
    .font-mode .line .shadow {
      .stroke(1px, var(--color-lyric-shadow-font-mode));
      // .stroke(1px, rgba(0, 0, 0, 0.07));
      transition: font-size @transition-slow;
      // text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3),  1px 1px 1px rgba(0, 0, 0, 0.3);
    }


  }
  // p {
  //   padding: 8px 0;
  //   line-height: 1.2;
  //   overflow-wrap: break-word;
  //   transition: @transition-normal !important;
  //   transition-property: color, font-size;
  // }
}
// .lrc-line {
//   display: inline-block;
//   padding: 8px 0;
//   line-height: 1.2;
//   overflow-wrap: break-word;
//   transition: @transition-normal;
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
  width: 80%;
  height: 100%;
}
// .lrc-active {

//   .lrc-line {
//     color: @color-theme-lyric_2;
//     // background: linear-gradient(@color-theme-lyric, @color-theme-lyric_2);
//     // background-clip: text;
//     // -webkit-background-clip: text;
//     // -webkit-text-fill-color: @color-theme-lyric_2;
//     // -webkit-text-stroke: thin #124628;
//   }
// }
.draging {
  :global {
    .line-content {
      .font-lrc {
        cursor: grabbing;
      }
    }
  }
}
.lrc-active-zoom {
  :global {
    .line-content {
      &.active {
        .extended {
          font-size: .94em;
        }
        .line {
          font-size: 1.2em;
        }
      }
    }
  }
}
.ellipsis {
  :global {
    .font-lrc, .shadow {
      display: -webkit-box !important;
      .mixin-ellipsis(1);
    }
  }
}
// .font-weight {
//   :global {
//     .font-mode > .line {
//       font-weight: bold;
//     }
//   }
// }
// .footer {
//   flex: 0 0 100px;
//   overflow: hidden;
//   display: flex;
//   align-items: center;
// }

</style>
