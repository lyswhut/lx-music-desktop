<template>
  <div
    ref="dom_lyric"
    :class="classNames"
    :style="lrcStyles" @wheel="handleWheel" @mousedown="handleLyricMouseDown" @touchstart="handleLyricTouchStart"
  >
    <div :class="$style.lyricSpace" />
    <div ref="dom_lyric_text" />
    <div :class="$style.lyricSpace" />
  </div>
</template>

<script>
import { setting } from '@lyric/store/state'
import { computed, useCssModule } from '@common/utils/vueTools'
import useLyric from './useLyric'

export default {
  setup() {
    const styles = useCssModule()
    // const isZoomActiveLrc = computed(() => setting['desktopLyric.style.isZoomActiveLrc'])
    // const ellipsis = computed(() => setting['desktopLyric.style.ellipsis'])
    // const isFontWeightFont = computed(() => setting['desktopLyric.style.isFontWeightFont'])
    // const isFontWeightLine = computed(() => setting['desktopLyric.style.isFontWeightLine'])
    // const isFontWeightExtended = computed(() => setting['desktopLyric.style.isFontWeightExtended'])
    const classNames = computed(() => {
      const name = [styles.lyric]
      if (isMsDown.value) name.push(styles.draging)
      if (setting['desktopLyric.style.isZoomActiveLrc']) name.push(styles.lrcActiveZoom)
      if (setting['desktopLyric.style.ellipsis']) name.push(styles.ellipsis)
      if (setting['desktopLyric.style.isFontWeightFont']) name.push(styles.fontWeightFont)
      if (setting['desktopLyric.style.isFontWeightLine']) name.push(styles.fontWeightLine)
      if (setting['desktopLyric.style.isFontWeightExtended']) name.push(styles.fontWeightExtended)
      return name
    })
    const lrcStyles = computed(() => ({
      fontFamily: /\s/.test(setting['desktopLyric.style.font']) ? `"${setting['desktopLyric.style.font']}"` : setting['desktopLyric.style.font'],
      fontSize: Math.trunc(setting['desktopLyric.style.fontSize']) + 'px',
      opacity: setting['desktopLyric.style.opacity'] / 100,
      textAlign: setting['desktopLyric.style.align'],
      '--line-gap': setting['desktopLyric.style.lineGap'] + 'px',
      '--line-extended-gap': (setting['desktopLyric.style.lineGap'] / 3).toFixed(2) + 'px',
    }))
    const isComputeHeight = computed(() => {
      return setting['desktopLyric.style.isZoomActiveLrc'] && !setting['desktopLyric.isDelayScroll']
    })
    const {
      dom_lyric,
      dom_lyric_text,
      isMsDown,
      handleLyricMouseDown,
      handleLyricTouchStart,
      handleWheel,
    } = useLyric(isComputeHeight)

    return {
      classNames,
      lrcStyles,

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
  overflow: hidden;
  font-size: 16px;
  contain: strict;
  cursor: move;
  // font-weight: bold;

  :global {
    .font-lrc, .shadow {
      padding: 0.08em 0.14em;
      margin: -0.08em 0;
    }
    .font-lrc {
      color: var(--color-lyric-unplay);
    }
    .shadow {
      color: transparent;
      // margin-left: -0.14em;
    }
    .line-content {
      line-height: 1.2;
      margin: var(--line-gap) 0;
      overflow-wrap: break-word;

      .font-lrc {
        cursor: grab;
      }

      .extended {
        font-size: 0.8em;
        margin-top: var(--line-extended-gap);
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
      // &.font-mode > .line {
      //   font-weight: bold;
      // }

      &.font-mode > .line > .font-lrc {
        > span {
          transition: @transition-slow;
          transition-property: font-size;
          font-size: 1em;
          background-repeat: no-repeat;
          background-color: var(--color-lyric-unplay);
          background-image: -webkit-linear-gradient(left, var(--color-lyric-played), var(--color-lyric-played));
          -webkit-text-fill-color: transparent;
          -webkit-background-clip: text;
          background-size: 0 100%;
          padding-left: 0.12em;
          padding-right: 0.12em;
          padding-bottom: 0.12em;
          margin-left: -0.11em;
          margin-right: -0.11em;
          margin-bottom: -0.12em;
        }
      }
     .line .shadow span {
        padding-left: 0.12em;
        padding-right: 0.12em;
        padding-bottom: 0.12em;
        margin-left: -0.11em;
        margin-right: -0.11em;
        margin-bottom: -0.12em;
      }
      // &.line-mode {
      //   .shadow {
      //     text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.40);
      //   }
      // }

      // &.font-mode {
      // }
    }
    .line-mode .font-lrc, .extended .font-lrc {
      // text-shadow: 0 0 2px rgba(0, 0, 0, 0.7), 0 0 2px rgba(0, 0, 0, 0.3), 0 0 1px rgba(0, 0, 0, 0.3);
      .stroke3(var(--color-lyric-shadow));
      // .stroke2(rgba(0, 0, 0, 0.18));
      // .stroke(1px, rgba(0, 0, 0, 0.08));
      // .stroke(2px, rgba(0, 0, 0, 0.025));
      transition: font-size @transition-slow;
    }
    .font-mode .line .shadow span {
      .stroke(1px, var(--color-lyric-shadow-font-mode));
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
.lyricSpace {
  height: 80%;
}
// .lyric-text {

// }
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
.lrcActiveZoom {
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
.fontWeightFont {
  :global {
    .font-mode > .line {
      font-weight: bold;
    }
  }
}
.fontWeightLine {
  :global {
    .line-mode > .line {
      font-weight: bold;
    }
  }
}
.fontWeightExtended {
  :global {
    .extended {
      font-weight: bold;
    }
  }
}
// .footer {
//   flex: 0 0 100px;
//   overflow: hidden;
//   display: flex;
//   align-items: center;
// }

</style>
