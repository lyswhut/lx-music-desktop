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
        div(:class="$style.colorOptionGrid")
          button(
            type="button"
            :class="[$style.colorOptionCard, appSetting['taskbarLyric.style.backgroundColorMode'] === 'theme' ? $style.colorOptionCardActive : '']"
            :disabled="!isWin"
            @click="updateSetting({ 'taskbarLyric.style.backgroundColorMode': 'theme' })"
          )
            span(:class="[$style.colorOptionPreview, $style.colorOptionPreviewTheme]")
            span(:class="$style.colorOptionLabel") {{ $t('setting__taskbar_lyric_theme_color') }}
          button(
            type="button"
            :class="[$style.colorOptionCard, appSetting['taskbarLyric.style.backgroundColorMode'] === 'custom' ? $style.colorOptionCardActive : '']"
            :disabled="!isWin"
            @click="handleCustomColorCardClick('background')"
          )
            div(
              ref="backgroundColorRef"
              :class="$style.colorOptionPreview"
            )
            span(:class="$style.colorOptionLabel") {{ $t('setting__taskbar_lyric_custom_color') }}
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
      span(:class="$style.fieldLabel") {{ $t('setting__taskbar_lyric_song_info_color') }}
      div(:class="$style.fieldControl")
        div(:class="$style.colorOptionGrid")
          button(
            type="button"
            :class="[$style.colorOptionCard, appSetting['taskbarLyric.style.songInfoFontColorMode'] === 'theme' ? $style.colorOptionCardActive : '']"
            :disabled="!isWin"
            @click="updateSetting({ 'taskbarLyric.style.songInfoFontColorMode': 'theme' })"
          )
            span(:class="[$style.colorOptionPreview, $style.colorOptionPreviewTheme]")
            span(:class="$style.colorOptionLabel") {{ $t('setting__taskbar_lyric_theme_color') }}
          button(
            type="button"
            :class="[$style.colorOptionCard, appSetting['taskbarLyric.style.songInfoFontColorMode'] === 'custom' ? $style.colorOptionCardActive : '']"
            :disabled="!isWin"
            @click="handleCustomColorCardClick('songInfo')"
          )
            div(
              ref="songInfoFontColorRef"
              :class="$style.colorOptionPreview"
            )
            span(:class="$style.colorOptionLabel") {{ $t('setting__taskbar_lyric_custom_color') }}
    div(:class="$style.fieldRow")
      span(:class="$style.fieldLabel") {{ $t('setting__taskbar_lyric_line_color') }}
      div(:class="$style.fieldControl")
        div(:class="$style.colorOptionGrid")
          button(
            type="button"
            :class="[$style.colorOptionCard, appSetting['taskbarLyric.style.lyricFontColorMode'] === 'theme' ? $style.colorOptionCardActive : '']"
            :disabled="!isWin"
            @click="updateSetting({ 'taskbarLyric.style.lyricFontColorMode': 'theme' })"
          )
            span(:class="[$style.colorOptionPreview, $style.colorOptionPreviewTheme]")
            span(:class="$style.colorOptionLabel") {{ $t('setting__taskbar_lyric_theme_color') }}
          button(
            type="button"
            :class="[$style.colorOptionCard, appSetting['taskbarLyric.style.lyricFontColorMode'] === 'custom' ? $style.colorOptionCardActive : '']"
            :disabled="!isWin"
            @click="handleCustomColorCardClick('lyric')"
          )
            div(
              ref="lyricFontColorRef"
              :class="$style.colorOptionPreview"
            )
            span(:class="$style.colorOptionLabel") {{ $t('setting__taskbar_lyric_custom_color') }}
    div(:class="$style.fieldRow")
      span(:class="$style.fieldLabel") {{ $t('setting__taskbar_lyric_song_info_size') }}
      div(:class="[$style.fieldControl, $style.sliderLine]")
        base-slider-bar(
          :class-name="$style.slider"
          :value="appSetting['taskbarLyric.style.songInfoFontSize']"
          :min="9"
          :max="18"
          :step="1"
          :disabled="!isWin"
          @change="updateSetting({ 'taskbarLyric.style.songInfoFontSize': $event })"
        )
        span(:class="$style.sliderValue") {{ appSetting['taskbarLyric.style.songInfoFontSize'] }}px
    div(:class="$style.fieldRow")
      span(:class="$style.fieldLabel") {{ $t('setting__taskbar_lyric_line_size') }}
      div(:class="[$style.fieldControl, $style.sliderLine]")
        base-slider-bar(
          :class-name="$style.slider"
          :value="appSetting['taskbarLyric.style.lyricFontSize']"
          :min="10"
          :max="22"
          :step="1"
          :disabled="!isWin"
          @change="updateSetting({ 'taskbarLyric.style.lyricFontSize': $event })"
        )
        span(:class="$style.sliderValue") {{ appSetting['taskbarLyric.style.lyricFontSize'] }}px

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
    .gap-top
      base-checkbox(
        id="setting_taskbar_lyric_swap_title_and_artist"
        :model-value="appSetting['taskbarLyric.swapTitleAndArtist']"
        :label="$t('setting__taskbar_lyric_swap_title_and_artist')"
        :disabled="!isWin"
        @update:model-value="updateSetting({ 'taskbarLyric.swapTitleAndArtist': $event })"
      )
</template>

<script>
import { onMounted, onBeforeUnmount, ref, watch } from '@common/utils/vueTools'
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
    const songInfoFontColorRef = ref(null)
    const lyricFontColorRef = ref(null)
    const backgroundColorSnapshot = ref(appSetting['taskbarLyric.style.backgroundColor'])
    const songInfoFontColorSnapshot = ref(appSetting['taskbarLyric.style.songInfoFontColor'])
    const lyricFontColorSnapshot = ref(appSetting['taskbarLyric.style.lyricFontColor'])
    let backgroundColorTools = null
    let songInfoFontColorTools = null
    let lyricFontColorTools = null
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
      if (songInfoFontColorRef.value) {
        songInfoFontColorTools = pickrTools.create(songInfoFontColorRef.value, appSetting['taskbarLyric.style.songInfoFontColor'], fontColorSwatches, color => {
          updateSetting({ 'taskbarLyric.style.songInfoFontColor': color })
        }, () => {
          updateSetting({ 'taskbarLyric.style.songInfoFontColor': songInfoFontColorSnapshot.value })
          songInfoFontColorTools?.setColor(songInfoFontColorSnapshot.value)
        })
        songInfoFontColorTools.pickr?.on('show', () => {
          songInfoFontColorSnapshot.value = appSetting['taskbarLyric.style.songInfoFontColor']
        })
      }
      if (lyricFontColorRef.value) {
        lyricFontColorTools = pickrTools.create(lyricFontColorRef.value, appSetting['taskbarLyric.style.lyricFontColor'], fontColorSwatches, color => {
          updateSetting({ 'taskbarLyric.style.lyricFontColor': color })
        }, () => {
          updateSetting({ 'taskbarLyric.style.lyricFontColor': lyricFontColorSnapshot.value })
          lyricFontColorTools?.setColor(lyricFontColorSnapshot.value)
        })
        lyricFontColorTools.pickr?.on('show', () => {
          lyricFontColorSnapshot.value = appSetting['taskbarLyric.style.lyricFontColor']
        })
      }
    }

    const openPickr = (tools) => {
      tools?.pickr?.show()
    }

    const handleCustomColorCardClick = (type) => {
      if (!isWin) return
      switch (type) {
        case 'background':
          updateSetting({ 'taskbarLyric.style.backgroundColorMode': 'custom' })
          openPickr(backgroundColorTools)
          break
        case 'songInfo':
          updateSetting({ 'taskbarLyric.style.songInfoFontColorMode': 'custom' })
          openPickr(songInfoFontColorTools)
          break
        case 'lyric':
          updateSetting({ 'taskbarLyric.style.lyricFontColorMode': 'custom' })
          openPickr(lyricFontColorTools)
          break
      }
    }

    const destroyColorPickers = () => {
      backgroundColorTools?.destroy()
      backgroundColorTools = null
      songInfoFontColorTools?.destroy()
      songInfoFontColorTools = null
      lyricFontColorTools?.destroy()
      lyricFontColorTools = null
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
    watch(() => appSetting['taskbarLyric.style.songInfoFontColor'], color => {
      songInfoFontColorTools?.setColor(color)
    })
    watch(() => appSetting['taskbarLyric.style.lyricFontColor'], color => {
      lyricFontColorTools?.setColor(color)
    })

    return {
      appSetting,
      updateSetting,
      backgroundColorRef,
      songInfoFontColorRef,
      lyricFontColorRef,
      handleCustomColorCardClick,
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
  flex: 1;
}

.colorOptionGrid {
  display: flex;
  align-items: stretch;
  gap: 12px;
  flex-wrap: wrap;
}

.colorOptionCard {
  appearance: none;
  border: 1px solid var(--color-primary-light-300);
  background: transparent;
  border-radius: 10px;
  min-width: 84px;
  padding: 8px 8px 9px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  cursor: pointer;
  transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease;

  &:disabled {
    opacity: .55;
    cursor: default;
  }

  &:not(:disabled):hover {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-light-100-alpha-300);
  }

  &:not(:disabled):active {
    transform: translateY(1px);
  }
}

.colorOptionCardActive {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light-100-alpha-300);
}

.colorOptionPreview {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background-color: var(--pcr-color);
  box-shadow: 0 0 3px var(--color-primary-light-100-alpha-300);
}

.colorOptionPreviewTheme {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light-200));
}

.colorOptionLabel {
  font-size: 12px;
  line-height: 1.2;
  text-align: center;
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
