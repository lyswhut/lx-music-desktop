<template>
<teleport to="#root">
  <div :class="$style.container" :style="menuStyles" ref="dom_menu" :aria-hidden="!modelValue">
    <!-- <div :class="$style.group">
      <div :class="$style.title">{{$t('lyric_menu__align')}}</div>
      <div :class="$style.subGroup">
        <div :class="[$style.btn, { [$style.active]: playDetailSetting.style.align == 'left' }]" role="button" @click="setFontAlign('left')" ignore-tip :aria-label="$t('lyric_menu__align_left')">{{$t('lyric_menu__align_left')}}</div>
        <div :class="[$style.btn, { [$style.active]: playDetailSetting.style.align == 'center' }]" role="button" @click="setFontAlign('center')" ignore-tip :aria-label="$t('lyric_menu__align_center')">{{$t('lyric_menu__align_center')}}</div>
      </div>
    </div> -->
    <div :class="$style.group">
      <div :class="$style.subGroup">
        <div :class="$style.title">{{$t('lyric_menu__lrc_size', { size: playDetailSetting.style.fontSize })}}</div>
        <button :class="[$style.btn, $style.titleBtn]" :disabled="playDetailSetting.style.fontSize == 100" @click="fontSizeReset" ignore-tip :aria-label="$t('lyric_menu__size_reset')">{{$t('lyric_menu__size_reset')}}</button>
      </div>
      <div :class="$style.subGroup">
        <button :class="$style.btn" @click="fontSizeUp(5)" @contextmenu="fontSizeUp(1)" :aria-label="$t('lyric_menu__size_add')">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="18px" viewBox="0 0 24 24" space="preserve">
            <use xlink:href="#icon-font-increase"></use>
          </svg>
        </button>
        <button :class="$style.btn" @click="fontSizeDown(5)" @contextmenu="fontSizeDown(1)" :aria-label="$t('lyric_menu__size_dec')">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="18px" viewBox="0 0 24 24" space="preserve">
            <use xlink:href="#icon-font-decrease"></use>
          </svg>
        </button>
      </div>
    </div>
    <div :class="$style.group">
      <div :class="$style.subGroup">
        <div :class="$style.title">{{$t('lyric_menu__offset', { offset })}}</div>
        <button :class="[$style.btn, $style.titleBtn]" :disabled="offsetDisabled || offset == originOffset" @click="offsetReset">{{$t('lyric_menu__offset_reset')}}</button>
      </div>
      <div :class="$style.subGroup">
        <button :class="$style.btn" :disabled="offsetDisabled" @click="setOffset(10)" ignore-tip :aria-label="$t('lyric_menu__offset_add_10')">+ 10ms</button>
        <button :class="$style.btn" :disabled="offsetDisabled" @click="setOffset(-10)" ignore-tip :aria-label="$t('lyric_menu__offset_dec_10')">- 10ms</button>
      </div>
      <div :class="$style.subGroup">
        <button :class="$style.btn" :disabled="offsetDisabled" @click="setOffset(100)" ignore-tip :aria-label="$t('lyric_menu__offset_add_100')">+ 100ms</button>
        <button :class="$style.btn" :disabled="offsetDisabled" @click="setOffset(-100)" ignore-tip :aria-label="$t('lyric_menu__offset_dec_100')">- 100ms</button>
      </div>
    </div>
  </div>
</teleport>
</template>

<script>
import { computed, useRefGetter, ref, useCommit, watch } from '@renderer/utils/vueTools'
import useMenuLocation from '@renderer/utils/compositions/useMenuLocation'
import { setLyricEdited, removeLyricEdited, debounce } from '@renderer/utils'

const offsetTagRxp = /(?:^|\n)\s*\[offset:\s*(\S+(?:\d+)*)\s*\]/
const offsetTagAllRxp = /(?:^|\n)\s*\[offset:\s*(\S+(?:\d+)*)\s*\]/g

const saveLyric = debounce((musicInfo, lyricInfo) => {
  setLyricEdited(musicInfo, lyricInfo)
})
const removeLyric = debounce(musicInfo => {
  removeLyricEdited(musicInfo)
})

const getOffset = lrc => {
  let offset = offsetTagRxp.exec(lrc)
  if (offset) {
    offset = parseInt(offset[1])
    if (Number.isNaN(offset)) offset = 0
  } else offset = 0
  return offset
}

export default {
  name: 'LyricMenu',
  props: {
    modelValue: Boolean,
    xy: Object,
    lyricInfo: Object,
  },
  emits: ['updateLyric', 'update:modelValue'],
  setup(props, { emit }) {
    const setting = useRefGetter('setting')
    const playDetailSetting = useRefGetter('playDetailSetting')
    const setPlayDetailLyricAlign = useCommit('setPlayDetailLyricAlign')
    const setPlayDetailLyricFont = useCommit('setPlayDetailLyricFont')

    const offset = ref(0)
    const offsetDisabled = ref(true)
    const originOffset = ref(0)

    const visible = computed(() => props.modelValue)
    const musicInfo = computed(() => props.lyricInfo.musicInfo)
    const location = computed(() => props.xy)

    const onHide = () => {
      emit('update:modelValue', false)
    }

    const setFontAlign = val => {
      if (playDetailSetting.value.style.align == val) return
      setPlayDetailLyricAlign(val)
    }

    const fontSizeUp = step => {
      if (setting.value.playDetail.style.fontSize >= 200) return
      setPlayDetailLyricFont(Math.min(setting.value.playDetail.style.fontSize + step, 200))
    }
    const fontSizeDown = step => {
      if (setting.value.playDetail.style.fontSize <= 70) return
      setPlayDetailLyricFont(Math.max(setting.value.playDetail.style.fontSize - step, 70))
    }
    const fontSizeReset = () => {
      setPlayDetailLyricFont(100)
    }

    const updateLyric = offset => {
      let lyric = props.lyricInfo.lyric
      let tlyric = props.lyricInfo.tlyric
      let rlyric = props.lyricInfo.rlyric
      let lxlyric = props.lyricInfo.lxlyric
      if (offsetTagRxp.test(lyric)) {
        lyric = lyric.replace(offsetTagAllRxp, `[offset:${offset}]`)
        if (tlyric) tlyric = tlyric.replace(offsetTagAllRxp, `[offset:${offset}]`)
        if (lxlyric) lxlyric = lxlyric.replace(offsetTagAllRxp, `[offset:${offset}]`)
        if (rlyric) rlyric = rlyric.replace(offsetTagAllRxp, `[offset:${offset}]`)
      } else {
        lyric = `[offset:${offset}]\n` + lyric
        if (tlyric) tlyric = `[offset:${offset}]\n` + tlyric
        if (lxlyric) lxlyric = `[offset:${offset}]\n` + lxlyric
        if (rlyric) rlyric = `[offset:${offset}]\n` + rlyric
      }

      if (offset == originOffset.value) {
        removeLyric(props.lyricInfo.musicInfo)
      } else {
        saveLyric(props.lyricInfo.musicInfo, {
          lyric,
          tlyric,
          rlyric,
          lxlyric,
        })
      }

      emit('updateLyric', {
        lyric,
        tlyric,
        rlyric,
        lxlyric,
        offset,
      })
    }
    const setOffset = step => {
      offset.value += step
      updateLyric(offset.value)
    }
    const offsetReset = () => {
      if (offset.value == originOffset.value) return
      offset.value = originOffset.value
      updateLyric(originOffset.value)
    }

    const parseLrcOffset = () => {
      offset.value = getOffset(props.lyricInfo.lyric)
      originOffset.value = getOffset(props.lyricInfo.rawlyric)
      offsetDisabled.value = !props.lyricInfo.lyric
    }


    const { dom_menu, menuStyles } = useMenuLocation({
      visible,
      location,
      onHide,
    })

    watch(musicInfo, () => {
      if (!props.modelValue) return
      parseLrcOffset()
    })
    watch(visible, val => {
      if (!val) return
      parseLrcOffset()
    })

    return {
      dom_menu,
      menuStyles,
      playDetailSetting,
      offset,
      originOffset,
      fontSizeUp,
      fontSizeDown,
      fontSizeReset,
      setOffset,
      offsetReset,
      setFontAlign,
      offsetDisabled,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.container {
  font-size: 12px;
  position: absolute;
  opacity: 0;
  transform: scale(0);
  transform-origin: 0 0 0;
  transition: .25s ease;
  transition-property: transform, opacity;
  border-radius: @radius-border;
  background-color: @color-theme_2-background_2;
  box-shadow: 0 1px 8px 0 rgba(0,0,0,.2);
  z-index: 10;
  overflow: hidden;
}

.group {
  display: flex;
  flex-direction: column;
}
.title {
  flex: auto;
  padding: 10px 0 10px 10px;
  color: @color-theme_2-font-label;
  white-space: nowrap;
  min-width: 120px;
}

.subGroup {
  display: flex;
  flex-flow: row nowrap;
}

.btn {
  flex: auto;
  white-space: nowrap;
  cursor: pointer;
  min-width: 60px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  // color: @color-btn;
  padding: 0 10px;
  outline: none;
  transition: @transition-theme;
  transition-property: background-color, opacity;
  box-sizing: border-box;
  .mixin-ellipsis-1;
  background-color: @color-theme_2-background_2;
  border: none;

  &:hover {
    opacity: .7;
    background-color: @color-theme_2-hover;
  }
  &:active {
    background-color: @color-theme_2-active;
  }
  &.active {
    background-color: @color-theme_2-background_2;
    color: @color-btn-active;
    cursor: default;
    opacity: 1;
  }

  &[disabled] {
    cursor: default;
    opacity: .4;
    &:hover {
      background: none !important;
    }
  }
}
.titleBtn {
  flex: none;
  padding: 0 10;
  min-width: 40px;
  opacity: .7;

  &[disabled] {
    opacity: .3;
  }
}

each(@themes, {
  :global(#root.@{value}) {
    .container {
      background-color: ~'@{color-@{value}-theme_2-background_2}';
    }
    .btn {
      background-color: ~'@{color-@{value}-theme_2-background_2}';
      &:hover {
        background-color: ~'@{color-@{value}-theme_2-hover}';
      }
      &:active {
        background-color: ~'@{color-@{value}-theme_2-active}';
      }
      &.active {
        background-color: ~'@{color-@{value}-theme_2-background_2}';
        color: ~'@{color-@{value}-btn}';
      }
    }
  }
})

</style>

