<!-- <template>
  <teleport to="#root">
    <div ref="dom_menu" :class="$style.container" :style="menuStyles" :aria-hidden="!modelValue">
      <div :class="$style.group">
        <div :class="$style.subGroup">
          <button :class="$style.btn" :disabled="!itemMenuControl.rename" ignore-tip :aria-label="$t('lists__rename')" @click="menuClick('rename')">{{ $t('lists__rename') }}</button>
          <button :class="$style.btn" :disabled="offsetDisabled" ignore-tip :aria-label="$t('lists__sync')" @click="menuClick('sync')">{{ $t('lists__sync') }}</button>
        </div>
        <div :class="$style.subGroup">
          <button :class="$style.btn" :disabled="offsetDisabled" ignore-tip :aria-label="$t('lists__sort_list')" @click="menuClick('sort')">{{ $t('lists__sort_list') }}</button>
          <button :class="$style.btn" :disabled="offsetDisabled" ignore-tip :aria-label="$t('lyric_menu__offset_dec_100')" @click="menuClick(-100)">- 100ms</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
import { computed, useRefGetter, ref, useCommit, watch } from '@common/utils/vueTools'
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
  background-color: var(--color-main-background);
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
  color: var(--color-font-label);
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
  // color: var(--color-button-font);
  padding: 0 10px;
  outline: none;
  transition: @transition-normal;
  transition-property: background-color, opacity;
  box-sizing: border-box;
  .mixin-ellipsis-1;
  background-color: var(--color-main-background);
  border: none;

  &:hover {
    opacity: .7;
    background-color: @color-theme_2-hover;
  }
  &:active {
    background-color: @color-theme_2-active;
  }
  &.active {
    background-color: var(--color-main-background);
    color: var(--color-button-background-active);
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

</style>
 -->
