<template lang="pug">
dt#taskbar_lyric {{ $t('setting__taskbar_lyric') }}
dd
  .p {{ $t('setting__taskbar_lyric_experimental') }}
  .gap-top
    base-checkbox(
      id="setting_taskbar_lyric_enable"
      :model-value="appSetting['taskbarLyric.enable']"
      :label="$t('setting__taskbar_lyric_enable')"
      :disabled="!isWin"
      @update:model-value="updateSetting({ 'taskbarLyric.enable': $event })"
    )

dd
  h3#taskbar_lyric_position {{ $t('setting__taskbar_lyric_position') }}
  div
    base-checkbox.gap-left(
      id="setting_taskbar_lyric_position_right"
      name="setting_taskbar_lyric_position"
      need
      :model-value="appSetting['taskbarLyric.position']"
      value="right"
      :label="$t('setting__basic_control_btn_position_right')"
      :disabled="!isWin"
      @update:model-value="updateSetting({ 'taskbarLyric.position': $event })"
    )
    base-checkbox.gap-left(
      id="setting_taskbar_lyric_position_center"
      name="setting_taskbar_lyric_position"
      need
      :model-value="appSetting['taskbarLyric.position']"
      value="center"
      :label="$t('setting__desktop_lyric_align_center')"
      :disabled="!isWin"
      @update:model-value="updateSetting({ 'taskbarLyric.position': $event })"
    )

dd
  h3#taskbar_lyric_background {{ $t('setting__taskbar_lyric_background') }}
  div(:class="$style.sectionFields")
    div(:class="$style.fieldRow")
      span(:class="$style.fieldLabel") {{ $t('setting__taskbar_lyric_color') }}
      div(:class="$style.fieldControl")
        div(:class="$style.optionLine")
          base-checkbox(
            id="setting_taskbar_lyric_background_theme"
            name="setting_taskbar_lyric_background_mode"
            need
            :model-value="appSetting['taskbarLyric.style.backgroundColorMode']"
            value="theme"
            :label="$t('setting__taskbar_lyric_theme_color')"
            :disabled="!isWin"
            @update:model-value="updateSetting({ 'taskbarLyric.style.backgroundColorMode': $event })"
          )
          base-checkbox(
            id="setting_taskbar_lyric_background_custom"
            name="setting_taskbar_lyric_background_mode"
            need
            :model-value="appSetting['taskbarLyric.style.backgroundColorMode']"
            value="custom"
            :label="$t('setting__taskbar_lyric_custom_color')"
            :disabled="!isWin"
            @update:model-value="updateSetting({ 'taskbarLyric.style.backgroundColorMode': $event })"
          )
        div(:class="$style.colorLine")
          div(
            ref="backgroundColorRef"
            :class="[$style.colorSwatch, isBackgroundColorDisabled ? $style.colorSwatchDisabled : '']"
          )
    div(:class="$style.fieldRow")
      span(:class="$style.fieldLabel") {{ $t('setting__taskbar_lyric_opacity') }}
      div(:class="[$style.fieldControl, $style.sliderLine]")
        base-slider-bar(
          :class-name="$style.slider"
          :value="appSetting['taskbarLyric.style.backgroundOpacity']"
          :min="0"
          :max="100"
          :step="1"
          :disabled="!isWin"
          @change="updateSetting({ 'taskbarLyric.style.backgroundOpacity': $event })"
        )
        span(:class="$style.sliderValue") {{ appSetting['taskbarLyric.style.backgroundOpacity'] }}%

dd
  h3#taskbar_lyric_font_color {{ $t('setting__taskbar_lyric_font_color') }}
  div(:class="$style.sectionFields")
    div(:class="$style.fieldRow")
      span(:class="$style.fieldLabel") {{ $t('setting__taskbar_lyric_color') }}
      div(:class="$style.fieldControl")
        div(:class="$style.optionLine")
          base-checkbox(
            id="setting_taskbar_lyric_font_theme"
            name="setting_taskbar_lyric_font_mode"
            need
            :model-value="appSetting['taskbarLyric.style.fontColorMode']"
            value="theme"
            :label="$t('setting__taskbar_lyric_theme_color')"
            :disabled="!isWin"
            @update:model-value="updateSetting({ 'taskbarLyric.style.fontColorMode': $event })"
          )
          base-checkbox(
            id="setting_taskbar_lyric_font_custom"
            name="setting_taskbar_lyric_font_mode"
            need
            :model-value="appSetting['taskbarLyric.style.fontColorMode']"
            value="custom"
            :label="$t('setting__taskbar_lyric_custom_color')"
            :disabled="!isWin"
            @update:model-value="updateSetting({ 'taskbarLyric.style.fontColorMode': $event })"
          )
        div(:class="$style.colorLine")
          div(
            ref="fontColorRef"
            :class="[$style.colorSwatch, isFontColorDisabled ? $style.colorSwatchDisabled : '']"
          )

dd
  h3#taskbar_lyric_width {{ $t('setting__taskbar_lyric_width', { width: appSetting['taskbarLyric.width'] }) }}
  div(:class="$style.sliderLine")
    base-slider-bar(
      :class-name="$style.slider"
      :value="appSetting['taskbarLyric.width']"
      :min="180"
      :max="420"
      :step="10"
      :disabled="!isWin"
      @change="updateSetting({ 'taskbarLyric.width': $event })"
    )
    span(:class="$style.sliderValue") {{ appSetting['taskbarLyric.width'] }}px

dd
  h3#taskbar_lyric_content {{ $t('setting__taskbar_lyric') }}
  div
    .gap-top
      base-checkbox(
        id="setting_taskbar_lyric_show_cover"
        :model-value="appSetting['taskbarLyric.showCover']"
        :label="$t('setting__taskbar_lyric_show_cover')"
        :disabled="!isWin"
        @update:model-value="updateSetting({ 'taskbarLyric.showCover': $event })"
      )
    .gap-top
      base-checkbox(
        id="setting_taskbar_lyric_show_song_info"
        :model-value="appSetting['taskbarLyric.showSongInfo']"
        :label="$t('setting__taskbar_lyric_show_song_info')"
        :disabled="!isWin"
        @update:model-value="updateSetting({ 'taskbarLyric.showSongInfo': $event })"
      )
    .gap-top
      base-checkbox(
        id="setting_taskbar_lyric_show_current_line"
        :model-value="appSetting['taskbarLyric.showCurrentLine']"
        :label="$t('setting__taskbar_lyric_show_current_line')"
        :disabled="!isWin"
        @update:model-value="updateSetting({ 'taskbarLyric.showCurrentLine': $event })"
      )
</template>

<script>
import { computed, onMounted, onBeforeUnmount, ref, watch } from '@common/utils/vueTools'
import { isWin } from '@common/utils'
import { appSetting, updateSetting } from '@renderer/store/setting'
import { pickrTools } from '@renderer/utils/pickrTools'

const backgroundColorSwatches = [
  'rgba(15, 23, 42, 1)',
  'rgba(30, 41, 59, 1)',
  'rgba(17, 24, 39, 1)',
  'rgba(255, 255, 255, 1)',
  'rgba(59, 130, 246, 1)',
]

const fontColorSwatches = [
  'rgba(248, 250, 252, 1)',
  'rgba(255, 255, 255, 1)',
  'rgba(226, 232, 240, 1)',
  'rgba(15, 23, 42, 1)',
  'rgba(17, 24, 39, 1)',
]

export default {
  name: 'SettingTaskbarLyric',
  setup() {
    const backgroundColorRef = ref(null)
    const fontColorRef = ref(null)
    const backgroundColorSnapshot = ref(appSetting['taskbarLyric.style.backgroundColor'])
    const fontColorSnapshot = ref(appSetting['taskbarLyric.style.fontColor'])
    let backgroundColorTools = null
    let fontColorTools = null
    const isBackgroundColorDisabled = computed(() => !isWin || appSetting['taskbarLyric.style.backgroundColorMode'] !== 'custom')
    const isFontColorDisabled = computed(() => !isWin || appSetting['taskbarLyric.style.fontColorMode'] !== 'custom')

    const initColorPickers = () => {
      if (backgroundColorRef.value) {
        backgroundColorTools = pickrTools.create(backgroundColorRef.value, appSetting['taskbarLyric.style.backgroundColor'], backgroundColorSwatches, color => {
          updateSetting({ 'taskbarLyric.style.backgroundColor': color })
        }, () => {
          updateSetting({ 'taskbarLyric.style.backgroundColor': backgroundColorSnapshot.value })
          backgroundColorTools?.setColor(backgroundColorSnapshot.value)
        })
        backgroundColorTools.pickr?.on('show', () => {
          backgroundColorSnapshot.value = appSetting['taskbarLyric.style.backgroundColor']
        })
      }
      if (fontColorRef.value) {
        fontColorTools = pickrTools.create(fontColorRef.value, appSetting['taskbarLyric.style.fontColor'], fontColorSwatches, color => {
          updateSetting({ 'taskbarLyric.style.fontColor': color })
        }, () => {
          updateSetting({ 'taskbarLyric.style.fontColor': fontColorSnapshot.value })
          fontColorTools?.setColor(fontColorSnapshot.value)
        })
        fontColorTools.pickr?.on('show', () => {
          fontColorSnapshot.value = appSetting['taskbarLyric.style.fontColor']
        })
      }
    }

    const destroyColorPickers = () => {
      backgroundColorTools?.destroy()
      backgroundColorTools = null
      fontColorTools?.destroy()
      fontColorTools = null
    }

    onMounted(() => {
      initColorPickers()
    })
    onBeforeUnmount(() => {
      destroyColorPickers()
    })
    watch(() => appSetting['taskbarLyric.style.backgroundColor'], color => {
      backgroundColorTools?.setColor(color)
    })
    watch(() => appSetting['taskbarLyric.style.fontColor'], color => {
      fontColorTools?.setColor(color)
    })

    return {
      appSetting,
      updateSetting,
      backgroundColorRef,
      fontColorRef,
      isBackgroundColorDisabled,
      isFontColorDisabled,
      isWin,
    }
  },
}
</script>

<style lang="less" module>
.sectionFields {
  margin-top: 8px;
}

.fieldRow {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-top: 10px;
}

.fieldLabel {
  width: 64px;
  flex: none;
  line-height: 28px;
  font-size: 12px;
  opacity: .8;
}

.fieldControl {
  min-width: 0;
}

.optionLine {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.colorLine {
  display: flex;
  align-items: center;
  min-height: 28px;
  margin-top: 8px;
}

.colorSwatch {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background-color: var(--pcr-color);
  cursor: pointer;
  transition: opacity .2s ease;
  box-shadow: 0 0 3px var(--color-primary-light-100-alpha-300);
}

.colorSwatchDisabled {
  opacity: .45;
  pointer-events: none;
  cursor: default;
}

.sliderLine {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 28px;
}

.slider {
  width: 180px;
}

.sliderValue {
  min-width: 52px;
  font-size: 12px;
  opacity: .8;
}
</style>
