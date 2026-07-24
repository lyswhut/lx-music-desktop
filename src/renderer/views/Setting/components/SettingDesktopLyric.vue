<template lang="pug">
dt#desktop_lyric {{ $t('setting__desktop_lyric') }}
dd.cards-row.desktop-cards-row
  div.setting-card
    .setting-card-header {{ $t('setting__desktop_lyric') }}
    .setting-card-body
      .gap-top
        base-checkbox(id="setting_desktop_lyric_enable" :model-value="appSetting['desktopLyric.enable']" :label="$t('setting__desktop_lyric_enable')" @update:model-value="updateSetting({ 'desktopLyric.enable': $event })")
      .gap-top
        base-checkbox(id="setting_desktop_lyric_lock" :model-value="appSetting['desktopLyric.isLock']" :label="$t('setting__desktop_lyric_lock')" @update:model-value="updateSetting({ 'desktopLyric.isLock': $event })")
      .gap-top
        base-checkbox(id="setting_desktop_lyric_fullscreen_hide" :model-value="appSetting['desktopLyric.fullscreenHide']" :label="$t('setting__desktop_lyric_fullscreen_hide')" @update:model-value="updateSetting({ 'desktopLyric.fullscreenHide': $event })")
      .gap-top
        base-checkbox(id="setting_desktop_lyric_pause_hide" :model-value="appSetting['desktopLyric.pauseHide']" :label="$t('setting__desktop_lyric_pause_hide')" @update:model-value="updateSetting({ 'desktopLyric.pauseHide': $event })")
      .gap-top
        base-checkbox(id="setting_desktop_lyric_audio_visualization" :model-value="appSetting['desktopLyric.audioVisualization']" :label="$t('setting__desktop_lyric_audio_visualization')" @update:model-value="updateSetting({ 'desktopLyric.audioVisualization': $event })")
      .gap-top
        base-checkbox(id="setting_desktop_lyric_delayScroll" :model-value="appSetting['desktopLyric.isDelayScroll']" :label="$t('setting__desktop_lyric_delay_scroll')" @update:model-value="updateSetting({ 'desktopLyric.isDelayScroll': $event })")
      .gap-top
        base-checkbox(id="setting_desktop_lyric_alwaysOnTop" :model-value="appSetting['desktopLyric.isAlwaysOnTop']" :label="$t('setting__desktop_lyric_always_on_top')" @update:model-value="updateSetting({ 'desktopLyric.isAlwaysOnTop': $event })")
      .gap-top
        base-checkbox(id="setting_desktop_lyric_showTaskbar" :model-value="appSetting['desktopLyric.isShowTaskbar']" :label="$t('setting__desktop_lyric_show_taskbar')" @update:model-value="updateSetting({ 'desktopLyric.isShowTaskbar': $event })")
        svg-icon(class="help-icon" name="help-circle-outline" :aria-label="$t('setting__desktop_lyric_show_taskbar_tip')")
      .gap-top
        base-checkbox(id="setting_desktop_lyric_alwaysOnTopLoop" :model-value="appSetting['desktopLyric.isAlwaysOnTopLoop']" :label="$t('setting__desktop_lyric_always_on_top_loop')" @update:model-value="updateSetting({ 'desktopLyric.isAlwaysOnTopLoop': $event })")
        svg-icon(class="help-icon" name="help-circle-outline" :aria-label="$t('setting__desktop_lyric_always_on_top_loop_tip')")
      .gap-top
        base-checkbox(id="setting_desktop_lyric_lockScreen" :model-value="appSetting['desktopLyric.isLockScreen']" :label="$t('setting__desktop_lyric_lock_screen')" @update:model-value="updateSetting({ 'desktopLyric.isLockScreen': $event })")
      .gap-top(v-if="!isLinux")
        base-checkbox(id="setting_desktop_lyric_hoverHide" :model-value="appSetting['desktopLyric.isHoverHide']" :label="$t('setting__desktop_lyric_hover_hide')" @update:model-value="updateSetting({ 'desktopLyric.isHoverHide': $event })")
        svg-icon(class="help-icon" name="help-circle-outline" :aria-label="$t('setting__desktop_lyric_hover_hide_tip')")
      .gap-top
        base-checkbox(id="setting_desktop_lyric_ellipsis" :model-value="appSetting['desktopLyric.style.ellipsis']" :label="$t('setting__desktop_lyric_ellipsis')" @update:model-value="updateSetting({ 'desktopLyric.style.ellipsis': $event })")
      .gap-top
        base-checkbox(id="setting_desktop_lyric_zoom" :model-value="appSetting['desktopLyric.style.isZoomActiveLrc']" :label="$t('desktop_lyric__lrc_active_zoom_on')" @update:model-value="updateSetting({ 'desktopLyric.style.isZoomActiveLrc': $event })")
  //- .gap-top
    base-checkbox(id="setting_desktop_lyric_fontWeight" :model-value="appSetting['desktopLyric.style.fontWeight']" @update:model-value="updateSetting({ 'desktopLyric.style.fontWeight': $event })" :label="$t('setting__desktop_lyric_font_weight')")
  div.setting-card
    .setting-card-header {{ $t('setting__desktop_lyric_color') }}
    .setting-card-body
      .p.gap-top
        div(:class="$style.groupContent")
          div(:class="$style.item")
            div(ref="lyric_unplay_color_ref" :class="$style.color")
            div(:class="$style.label") {{ $t('setting__desktop_lyric_unplay_color') }}
          div(:class="$style.item")
            div(ref="lyric_played_color_ref" :class="$style.color")
            div(:class="$style.label") {{ $t('setting__desktop_lyric_played_color') }}
          div(:class="$style.item")
            div(ref="lyric_shadow_color_ref" :class="$style.color")
            div(:class="$style.label") {{ $t('setting__desktop_lyric_shadow_color') }}
      .p.gap-top
        base-btn.btn(min @click="resetColor") {{ $t('setting__desktop_lyric_color_reset') }}
  div.setting-card
    .setting-card-header {{ $t('setting__desktop_lyric_font_weight') }}
    .setting-card-body
      base-checkbox.gap-left(id="setting_setting__desktop_lyric_font_weight_font" :model-value="appSetting['desktopLyric.style.isFontWeightFont']" :label="$t('setting__desktop_lyric_font_weight_font')" @update:model-value="updateSetting({ 'desktopLyric.style.isFontWeightFont': $event })")
      base-checkbox.gap-left(id="setting_setting__desktop_lyric_font_weight_line" :model-value="appSetting['desktopLyric.style.isFontWeightLine']" :label="$t('setting__desktop_lyric_font_weight_line')" @update:model-value="updateSetting({ 'desktopLyric.style.isFontWeightLine': $event })")
      base-checkbox.gap-left(id="setting_setting__desktop_lyric_font_weight_extended" :model-value="appSetting['desktopLyric.style.isFontWeightExtended']" :label="$t('setting__desktop_lyric_font_weight_extended')" @update:model-value="updateSetting({ 'desktopLyric.style.isFontWeightExtended': $event })")
  div.setting-card
    .setting-card-header {{ $t('setting__desktop_lyric_direction') }}
    .setting-card-body
      base-checkbox.gap-left(id="setting_desktop_lyric_direction_horizontal" :model-value="appSetting['desktopLyric.direction']" need value="horizontal" :label="$t('setting__desktop_lyric_direction_horizontal')" @update:model-value="updateSetting({ 'desktopLyric.direction': $event })")
      base-checkbox.gap-left(id="setting_desktop_lyric_direction_vertical" :model-value="appSetting['desktopLyric.direction']" need value="vertical" :label="$t('setting__desktop_lyric_direction_vertical')" @update:model-value="updateSetting({ 'desktopLyric.direction': $event })")

dd.cards-row.desktop-cards-row
  div.setting-card
    .setting-card-header {{ $t('setting__desktop_lyric_scroll_align') }}
    .setting-card-body
      base-checkbox.gap-left(id="setting_desktop_lyric_scroll_align_top" :model-value="appSetting['desktopLyric.scrollAlign']" need value="top" :label="$t('setting__desktop_lyric_scroll_align_top')" @update:model-value="updateSetting({ 'desktopLyric.scrollAlign': $event })")
      base-checkbox.gap-left(id="setting_desktop_lyric_scroll_align_center" :model-value="appSetting['desktopLyric.scrollAlign']" need value="center" :label="$t('setting__desktop_lyric_scroll_align_center')" @update:model-value="updateSetting({ 'desktopLyric.scrollAlign': $event })")
  div.setting-card
    .setting-card-header {{ $t('setting__desktop_lyric_align') }}
    .setting-card-body
      base-checkbox.gap-left(id="setting_desktop_lyric_align_left" :model-value="appSetting['desktopLyric.style.align']" need value="left" :label="$t('setting__desktop_lyric_align_left')" @update:model-value="updateSetting({ 'desktopLyric.style.align': $event })")
      base-checkbox.gap-left(id="setting_desktop_lyric_align_center" :model-value="appSetting['desktopLyric.style.align']" need value="center" :label="$t('setting__desktop_lyric_align_center')" @update:model-value="updateSetting({ 'desktopLyric.style.align': $event })")
      base-checkbox.gap-left(id="setting_desktop_lyric_align_right" :model-value="appSetting['desktopLyric.style.align']" need value="right" :label="$t('setting__desktop_lyric_align_right')" @update:model-value="updateSetting({ 'desktopLyric.style.align': $event })")
  div.setting-card
    .setting-card-header {{ $t('setting__desktop_lyric_line_gap', { num: appSetting['desktopLyric.style.lineGap'] }) }}
    .setting-card-body
      .p(style="display: flex; flex-flow: column nowrap; gap: 8px; align-items: flex-start;")
        base-btn.btn(min @click="changeLineGap(-1)") {{ $t('setting__desktop_lyric_line_gap_dec') }}
        base-btn.btn(min @click="changeLineGap(1)") {{ $t('setting__desktop_lyric_line_gap_add') }}
  div.setting-card(style="min-width: 100px !important; width: 140px !important; max-width: 140px !important;")
    .setting-card-header {{ $t('setting__desktop_lyric_font') }}
    .setting-card-body
      base-selection.gap-teft(style="width: 100px !important; max-width: 100px !important;" :list="fontList" :model-value="appSetting['desktopLyric.style.font']" item-key="id" item-name="label" @update:model-value="updateSetting({ 'desktopLyric.style.font': $event })")
  div.setting-card
    .setting-card-header {{ $t('setting__desktop_lyric_reset') }}
    .setting-card-body
      .p.gap-top
        base-btn.btn(min @click="resetWindowSetting") {{ $t('setting__desktop_lyric_reset_window') }}

</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from '@common/utils/vueTools'
import { getSystemFonts } from '@renderer/utils/ipc'
import { isLinux } from '@common/utils'
import { appSetting, updateSetting } from '@renderer/store/setting'
import { useI18n } from '@renderer/plugins/i18n'
import { pickrTools } from '@renderer/utils/pickrTools'

const defaultUnplayColors = [
  'rgba(255, 255, 255, 1)',
  'rgba(255, 236, 144, 1)',
  'rgba(144, 255, 206, 1)',
  'rgba(32, 255, 132, 1)',
  'rgba(255, 226, 32, 1)',
  'rgba(57, 203, 255, 1)',
  'rgba(217, 57, 255, 1)',
  'rgba(255, 57, 71, 1)',
]
const defaultPlayedColors = [
  'rgba(255, 236, 144, 1)',
  'rgba(144, 255, 206, 1)',
  'rgba(32, 255, 132, 1)',
  'rgba(255, 226, 32, 1)',
  'rgba(57, 203, 255, 1)',
  'rgba(7, 197, 86, 1)',
  'rgba(25, 181, 254, 1)',
  'rgba(217, 57, 255, 1)',
  'rgba(255, 57, 71, 1)',
]
const defaultShadowColors = [
  'rgba(0, 0, 0, 0.15)',
]

const useLyricUnplayColor = () => {
  const lyric_unplay_color_ref = ref(null)
  let tools

  const initLyricUnplayColor = (color, changed, reset) => {
    if (!lyric_unplay_color_ref.value) return
    tools = pickrTools.create(lyric_unplay_color_ref.value, color, defaultUnplayColors, changed, reset)
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
    tools = pickrTools.create(lyric_played_color_ref.value, color, defaultPlayedColors, changed, reset)
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
    tools = pickrTools.create(lyric_shadow_color_ref.value, color, defaultShadowColors, changed, reset)
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
      'desktopLyric.style.lyricShadowColor': 'rgba(0, 0, 0, 0.18)',
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
    void getSystemFonts().then(fonts => {
      systemFontList.value = fonts.map(f => ({ id: f, label: f.replace(/(^"|"$)/g, '') }))
    })

    const resetWindowSetting = () => {
      updateSetting({
        'desktopLyric.width': 450,
        'desktopLyric.height': 300,
        'desktopLyric.x': null,
        'desktopLyric.y': null,
      })
    }

    return {
      appSetting,
      updateSetting,
      changeLineGap,
      lyric_unplay_color_ref,
      lyric_played_color_ref,
      lyric_shadow_color_ref,
      resetColor,
      resetWindowSetting,

      fontList,
      isLinux,
    }
  },
}
</script>

<style lang="less">
dd.cards-row.desktop-cards-row {
  display: flex !important;
  flex-flow: row nowrap !important;
  flex-wrap: nowrap !important;
  overflow-x: auto !important;
  gap: 15px !important;
  padding: 0;
  margin: 0 0 10px;
  width: 100%;

  > .setting-card {
    margin: 0;
    flex: 0 0 auto !important;
    width: fit-content !important;
    max-width: none !important;
    min-width: 0 !important;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    background-color: rgba(77, 175, 124, 0.12);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
    border-radius: 8px;
    border: 1px solid rgba(77, 175, 124, 0.25);
    overflow: hidden;

    .setting-card-header {
      padding: 8px 16px;
      font-weight: bold;
      font-size: 13px;
      color: var(--color-primary);
      border-bottom: 1px solid rgba(77, 175, 124, 0.25);
      width: 100%;
      box-sizing: border-box;
      white-space: nowrap;
    }

    .setting-card-body {
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: 100%;
      box-sizing: border-box;

      .gap-top {
        margin-left: 0 !important;
        margin-top: 10px;
        width: fit-content !important;
        display: block;
        text-align: left;
        white-space: nowrap;

        &:first-child {
          margin-top: 0;
        }

        label {
          justify-content: flex-start;
          white-space: nowrap;
        }
      }

      .gap-left {
        margin-left: 0 !important;
        margin-top: 10px;
        width: fit-content !important;
        display: block;
        text-align: left;
        white-space: nowrap;

        &:first-child {
          margin-top: 0;
        }

        label {
          justify-content: flex-start;
          white-space: nowrap;
        }
      }
    }
  }
}
</style>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.groupContent {
  display: flex;
  flex-flow: column nowrap;
}
.item {
  padding-bottom: 10px;
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
}
.color {
  width: 36px;
  height: 36px;
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
  .mixin-ellipsis-2();
  padding-left: 10px;
  text-align: left;
  line-height: 1.1;
}

</style>

