<template lang="pug">
dt#desktop_lyric {{$t('setting__desktop_lyric')}}
dd
  .gap-top
    base-checkbox(id="setting_desktop_lyric_enable" :modelValue="appSetting['desktopLyric.enable']" @update:modelValue="updateSetting({ 'desktopLyric.enable': $event })" :label="$t('setting__desktop_lyric_enable')")
  .gap-top
    base-checkbox(id="setting_desktop_lyric_lock" :modelValue="appSetting['desktopLyric.isLock']" @update:modelValue="updateSetting({ 'desktopLyric.isLock': $event })" :label="$t('setting__desktop_lyric_lock')")
  .gap-top
    base-checkbox(id="setting_desktop_lyric_audio_visualization" :modelValue="appSetting['desktopLyric.audioVisualization']" @update:modelValue="updateSetting({ 'desktopLyric.audioVisualization': $event })" :label="$t('setting__desktop_lyric_audio_visualization')")
  .gap-top
    base-checkbox(id="setting_desktop_lyric_delayScroll" :modelValue="appSetting['desktopLyric.isDelayScroll']" @update:modelValue="updateSetting({ 'desktopLyric.isDelayScroll': $event })" :label="$t('setting__desktop_lyric_delay_scroll')")
  .gap-top
    base-checkbox(id="setting_desktop_lyric_alwaysOnTop" :modelValue="appSetting['desktopLyric.isAlwaysOnTop']" @update:modelValue="updateSetting({ 'desktopLyric.isAlwaysOnTop': $event })" :label="$t('setting__desktop_lyric_always_on_top')")
  .gap-top
    base-checkbox(id="setting_desktop_lyric_showTaskbar" :modelValue="appSetting['desktopLyric.isShowTaskbar']" @update:modelValue="updateSetting({ 'desktopLyric.isShowTaskbar': $event })" :label="$t('setting__desktop_lyric_show_taskbar')")
  .gap-top
    base-checkbox(id="setting_desktop_lyric_alwaysOnTopLoop" :modelValue="appSetting['desktopLyric.isAlwaysOnTopLoop']" @update:modelValue="updateSetting({ 'desktopLyric.isAlwaysOnTopLoop': $event })" :label="$t('setting__desktop_lyric_always_on_top_loop')")
  .gap-top
    base-checkbox(id="setting_desktop_lyric_lockScreen" :modelValue="appSetting['desktopLyric.isLockScreen']" @update:modelValue="updateSetting({ 'desktopLyric.isLockScreen': $event })" :label="$t('setting__desktop_lyric_lock_screen')")
  .gap-top(v-if="!isLinux")
    base-checkbox(id="setting_desktop_lyric_hoverHide" :modelValue="appSetting['desktopLyric.isHoverHide']" @update:modelValue="updateSetting({ 'desktopLyric.isHoverHide': $event })" :label="$t('setting__desktop_lyric_hover_hide')")
  .gap-top
    base-checkbox(id="setting_desktop_lyric_ellipsis" :modelValue="appSetting['desktopLyric.style.ellipsis']" @update:modelValue="updateSetting({ 'desktopLyric.style.ellipsis': $event })" :label="$t('setting__desktop_lyric_ellipsis')")
  .gap-top
    base-checkbox(id="setting_desktop_lyric_zoom" :modelValue="appSetting['desktopLyric.style.isZoomActiveLrc']" @update:modelValue="updateSetting({ 'desktopLyric.style.isZoomActiveLrc': $event })" :label="$t('desktop_lyric__lrc_active_zoom_on')")
  //- .gap-top
    base-checkbox(id="setting_desktop_lyric_fontWeight" :modelValue="appSetting['desktopLyric.style.fontWeight']" @update:modelValue="updateSetting({ 'desktopLyric.style.fontWeight': $event })" :label="$t('setting__desktop_lyric_font_weight')")

dd
  h3#desktop_lyric_direction {{$t('setting__desktop_lyric_direction')}}
  div
    base-checkbox.gap-left(id="setting_desktop_lyric_direction_horizontal" :modelValue="appSetting['desktopLyric.direction']" @update:modelValue="updateSetting({ 'desktopLyric.direction': $event })" need value="horizontal" :label="$t('setting__desktop_lyric_direction_horizontal')")
    base-checkbox.gap-left(id="setting_desktop_lyric_direction_vertical" :modelValue="appSetting['desktopLyric.direction']" @update:modelValue="updateSetting({ 'desktopLyric.direction': $event })" need value="vertical" :label="$t('setting__desktop_lyric_direction_vertical')")

dd
  h3#desktop_lyric_scroll_align {{$t('setting__desktop_lyric_scroll_align')}}
  div
    base-checkbox.gap-left(id="setting_desktop_lyric_scroll_align_top" :modelValue="appSetting['desktopLyric.scrollAlign']" @update:modelValue="updateSetting({ 'desktopLyric.scrollAlign': $event })" need value="top" :label="$t('setting__desktop_lyric_scroll_align_top')")
    base-checkbox.gap-left(id="setting_desktop_lyric_scroll_align_center" :modelValue="appSetting['desktopLyric.scrollAlign']" @update:modelValue="updateSetting({ 'desktopLyric.scrollAlign': $event })" need value="center" :label="$t('setting__desktop_lyric_scroll_align_center')")

dd
  h3#desktop_lyric_align {{$t('setting__desktop_lyric_align')}}
  div
    base-checkbox.gap-left(id="setting_desktop_lyric_align_left" :modelValue="appSetting['desktopLyric.style.align']" @update:modelValue="updateSetting({ 'desktopLyric.style.align': $event })" need value="left" :label="$t('setting__desktop_lyric_align_left')")
    base-checkbox.gap-left(id="setting_desktop_lyric_align_center" :modelValue="appSetting['desktopLyric.style.align']" @update:modelValue="updateSetting({ 'desktopLyric.style.align': $event })" need value="center" :label="$t('setting__desktop_lyric_align_center')")
    base-checkbox.gap-left(id="setting_desktop_lyric_align_right" :modelValue="appSetting['desktopLyric.style.align']" @update:modelValue="updateSetting({ 'desktopLyric.style.align': $event })" need value="right" :label="$t('setting__desktop_lyric_align_right')")

dd
  h3#desktop_lyric_line_gap {{$t('setting__desktop_lyric_line_gap', { num: appSetting['desktopLyric.style.lineGap'] })}}
  div
    p
      base-btn.btn(min @click="changeLineGap(-1)") {{$t('setting__desktop_lyric_line_gap_dec')}}
      base-btn.btn(min @click="changeLineGap(1)") {{$t('setting__desktop_lyric_line_gap_add')}}
dd
  h3#desktop_lyric_color {{$t('setting__desktop_lyric_color')}}
  div
    p.gap-top
      div(:class="$style.groupContent")
        div(:class="$style.item")
          div(ref="lyric_unplay_color_ref", :class="$style.color")
          div(:class="$style.label") {{ $t('setting__desktop_lyric_unplay_color') }}
        div(:class="$style.item")
          div(ref="lyric_played_color_ref", :class="$style.color")
          div(:class="$style.label") {{ $t('setting__desktop_lyric_played_color') }}
        div(:class="$style.item")
          div(ref="lyric_shadow_color_ref", :class="$style.color")
          div(:class="$style.label") {{ $t('setting__desktop_lyric_shadow_color') }}
    p.gap-top
      base-btn.btn(min @click="resetColor") {{$t('setting__desktop_lyric_color_reset')}}
dd
  h3#desktop_lyric_font {{$t('setting__desktop_lyric_font')}}
  div
    base-selection.gap-teft(:list="fontList" :modelValue="appSetting['desktopLyric.style.font']" @update:modelValue="updateSetting({ 'desktopLyric.style.font': $event })" item-key="id" item-name="label")
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from '@common/utils/vueTools'
import { getSystemFonts } from '@renderer/utils/ipc'
import { isLinux } from '@common/utils'
import { appSetting, updateSetting } from '@renderer/store/setting'
import { useI18n } from '@renderer/plugins/i18n'
import { pickrTools } from '@renderer/utils/pickrTools'

const useLyricUnplayColor = () => {
  const lyric_unplay_color_ref = ref(null)
  let tools

  const initLyricUnplayColor = (color, changed, reset) => {
    if (!lyric_unplay_color_ref.value) return
    tools = pickrTools.create(lyric_unplay_color_ref.value, color, null, changed, reset)
  }
  const destroyLyricUnplayColor = () => {
    if (!tools) return
    tools.destroy()
    tools = null
  }
  const setLyricUnplayColor = (color) => {
    tools?.setColor(color)
  }

  return {
    lyric_unplay_color_ref,
    initLyricUnplayColor,
    destroyLyricUnplayColor,
    setLyricUnplayColor,
  }
}

const useLyricPlayedColor = () => {
  const lyric_played_color_ref = ref(null)
  let tools

  const initLyricPlayedColor = (color, changed, reset) => {
    if (!lyric_played_color_ref.value) return
    tools = pickrTools.create(lyric_played_color_ref.value, color, [
      'rgba(7, 197, 86, 1)',
      'rgba(255, 250, 18, 1)',
      'rgba(25, 181, 254, 1)',
      'rgba(255, 18, 34, 1)',
    ], changed, reset)
  }
  const destroyLyricPlayedColor = () => {
    if (!tools) return
    tools.destroy()
    tools = null
  }
  const setLyricPlayedColor = (color) => {
    tools?.setColor(color)
  }

  return {
    lyric_played_color_ref,
    initLyricPlayedColor,
    destroyLyricPlayedColor,
    setLyricPlayedColor,
  }
}

const useLyricShadowColor = () => {
  const lyric_shadow_color_ref = ref(null)
  let tools

  const initLyricShadowColor = (color, changed, reset) => {
    if (!lyric_shadow_color_ref.value) return
    tools = pickrTools.create(lyric_shadow_color_ref.value, color, null, changed, reset)
  }
  const destroyLyricShadowColor = () => {
    if (!tools) return
    tools.destroy()
    tools = null
  }
  const setLyricShadowColor = (color) => {
    tools?.setColor(color)
  }

  return {
    lyric_shadow_color_ref,
    initLyricShadowColor,
    destroyLyricShadowColor,
    setLyricShadowColor,
  }
}

const useLyricColor = () => {
  const { lyric_unplay_color_ref, initLyricUnplayColor, destroyLyricUnplayColor, setLyricUnplayColor } = useLyricUnplayColor()
  const { lyric_played_color_ref, initLyricPlayedColor, destroyLyricPlayedColor, setLyricPlayedColor } = useLyricPlayedColor()
  const { lyric_shadow_color_ref, initLyricShadowColor, destroyLyricShadowColor, setLyricShadowColor } = useLyricShadowColor()

  const initColors = () => {
    initLyricUnplayColor(appSetting['desktopLyric.style.lyricUnplayColor'], (color) => {
      updateSetting({ 'desktopLyric.style.lyricUnplayColor': color })
    })
    initLyricPlayedColor(appSetting['desktopLyric.style.lyricPlayedColor'], (color) => {
      updateSetting({ 'desktopLyric.style.lyricPlayedColor': color })
    })
    initLyricShadowColor(appSetting['desktopLyric.style.lyricShadowColor'], (color) => {
      updateSetting({ 'desktopLyric.style.lyricShadowColor': color })
    })
  }

  const destroyColors = () => {
    destroyLyricUnplayColor()
    destroyLyricPlayedColor()
    destroyLyricShadowColor()
  }

  const resetColor = () => {
    const defaultSetting = {
      'desktopLyric.style.lyricUnplayColor': 'rgba(255, 255, 255, 1)',
      'desktopLyric.style.lyricPlayedColor': 'rgba(7, 197, 86, 1)',
      'desktopLyric.style.lyricShadowColor': 'rgba(0, 0, 0, 0.15)',
    }
    updateSetting(defaultSetting)
    setLyricUnplayColor(defaultSetting['desktopLyric.style.lyricUnplayColor'])
    setLyricPlayedColor(defaultSetting['desktopLyric.style.lyricPlayedColor'])
    setLyricShadowColor(defaultSetting['desktopLyric.style.lyricShadowColor'])
  }

  onMounted(() => {
    initColors()
  })
  onBeforeUnmount(() => {
    destroyColors()
  })

  return {
    lyric_unplay_color_ref,
    lyric_played_color_ref,
    lyric_shadow_color_ref,
    resetColor,
  }
}

export default {
  name: 'SettingDesktopLyric',
  setup() {
    const t = useI18n()

    const changeLineGap = (step) => {
      let gap = appSetting['desktopLyric.style.lineGap'] + step
      updateSetting({ 'desktopLyric.style.lineGap': Math.min(Math.max(gap, 0), 25) })
    }

    const {
      lyric_unplay_color_ref,
      lyric_played_color_ref,
      lyric_shadow_color_ref,
      resetColor,
    } = useLyricColor()

    const systemFontList = ref([])
    const fontList = computed(() => {
      return [{ id: '', label: t('setting__desktop_lyric_font_default') }, ...systemFontList.value]
    })
    getSystemFonts().then(fonts => {
      systemFontList.value = fonts.map(f => ({ id: f, label: f.replace(/(^"|"$)/g, '') }))
    })

    return {
      appSetting,
      updateSetting,
      changeLineGap,
      lyric_unplay_color_ref,
      lyric_played_color_ref,
      lyric_shadow_color_ref,
      resetColor,

      fontList,
      isLinux,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.groupContent {
  display: flex;
  flex-flow: row wrap;
}
.item {
  padding-right: 40px;
  width: 70px;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
}
.color {
  width: 80%;
  aspect-ratio: 1 / 1;
  background-color: var(--pcr-color);
  border-radius: @radius-border;
  cursor: pointer;
  transition: @transition-fast !important;
  transition-property: background-color, opacity !important;
  box-shadow: 0 0 3px var(--color-primary-light-100-alpha-300);
  &:hover {
    opacity: .7;
  }
}
.label {
  .mixin-ellipsis-2;
  padding-top: 10px;
  text-align: center;
  line-height: 1.1;
}

</style>
