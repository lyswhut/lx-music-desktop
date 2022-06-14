<template lang="pug">
dt#desktop_lyric {{$t('setting__desktop_lyric')}}
dd
  .gap-top
    base-checkbox(id="setting_desktop_lyric_enable" v-model="currentStting.desktopLyric.enable" :label="$t('setting__desktop_lyric_enable')")
  .gap-top
    base-checkbox(id="setting_desktop_lyric_lock" v-model="currentStting.desktopLyric.isLock" :label="$t('setting__desktop_lyric_lock')")
  .gap-top
    base-checkbox(id="setting_desktop_lyric_delayScroll" v-model="currentStting.desktopLyric.isDelayScroll" :label="$t('setting__desktop_lyric_delay_scroll')")
  .gap-top
    base-checkbox(id="setting_desktop_lyric_alwaysOnTop" v-model="currentStting.desktopLyric.isAlwaysOnTop" :label="$t('setting__desktop_lyric_always_on_top')")
  .gap-top
    base-checkbox(id="setting_desktop_lyric_alwaysOnTopLoop" v-model="currentStting.desktopLyric.isAlwaysOnTopLoop" :label="$t('setting__desktop_lyric_always_on_top_loop')")
  .gap-top
    base-checkbox(id="setting_desktop_lyric_lockScreen" v-model="currentStting.desktopLyric.isLockScreen" :label="$t('setting__desktop_lyric_lock_screen')")
  .gap-top
    base-checkbox(id="setting_desktop_lyric_hoverHide" v-model="currentStting.desktopLyric.isHoverHide" :label="$t('setting__desktop_lyric_hover_hide')")
dd
  h3#desktop_lyric_font {{$t('setting__desktop_lyric_font')}}
  div
    base-selection.gap-teft(:list="fontList" v-model="currentStting.desktopLyric.style.font" item-key="id" item-name="label")
</template>

<script>
import { ref, computed, useI18n } from '@renderer/utils/vueTools'
import { getSystemFonts } from '@renderer/utils/tools'
import { currentStting } from '../setting'

export default {
  name: 'SettingDesktopLyric',
  setup() {
    const { t } = useI18n()
    const systemFontList = ref([])
    const fontList = computed(() => {
      return [{ id: '', label: t('setting__desktop_lyric_font_default') }, ...systemFontList.value]
    })
    getSystemFonts().then(fonts => {
      systemFontList.value = fonts.map(f => ({ id: f, label: f.replace(/(^"|"$)/g, '') }))
    })

    return {
      currentStting,
      fontList,
    }
  },
}
</script>
