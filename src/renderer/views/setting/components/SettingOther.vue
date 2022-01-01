<template lang="pug">
dt#other {{$t('setting__other')}}
dd
  h3#other_tray_theme {{$t('setting__other_tray_theme')}}
  div
    base-checkbox.gap-left(:id="'setting_tray_theme_' + item.id" v-model="currentStting.tray.themeId" name="setting_tray_theme" need
      :label="item.label" :key="item.id" :value="item.id" v-for="item in trayThemeList")
dd
  h3#other_resource_cache
    | {{$t('setting__other_resource_cache')}}
    svg-icon(class="help-icon" name="help-circle-outline" :tips="$t('setting__other_resource_cache_tip')")
  div
    p
      | {{$t('setting__other_resource_cache_label')}}
      span.auto-hidden {{cacheSize}}
    p
      base-btn.btn(min :disabled="isDisabledResourceCacheClear" @click="clearResourceCache") {{$t('setting__other_resource_cache_clear_btn')}}
dd
  h3#other_play_list_cache
    | {{$t('setting__other_play_list_cache')}}
    svg-icon(class="help-icon" name="help-circle-outline" :tips="$t('setting__other_play_list_cache_tip')")

  div
    base-btn.btn(min :disabled="isDisabledListCacheClear" @click="clearListCache") {{$t('setting__other_play_list_cache_clear_btn')}}
</template>

<script>
import { ref, computed, useI18n, useCommit } from '@renderer/utils/vueTools'
import { sizeFormate, clearCache, getCacheSize } from '@renderer/utils'
import { dialog } from '@renderer/plugins/Dialog'

import { currentStting } from '../setting'

export default {
  name: 'SettingOther',
  setup() {
    const { t } = useI18n()

    const trayThemeList = computed(() => {
      return [
        { id: 0, name: 'native', label: t('setting__other_tray_theme_native') },
        { id: 2, name: 'black', label: t('setting__other_tray_theme_black') },
        { id: 1, name: 'origin', label: t('setting__other_tray_theme_origin') },
      ]
    })

    const cacheSize = ref('0 B')
    const isDisabledResourceCacheClear = ref(false)
    const isDisabledListCacheClear = ref(false)
    const refreshCacheSize = () => {
      getCacheSize().then(size => {
        cacheSize.value = sizeFormate(size)
      })
    }
    const clearResourceCache = async() => {
      if (!await dialog.confirm({
        message: t('setting__other_resource_cache_tip_confirm'),
        cancelButtonText: t('cancel_button_text'),
        confirmButtonText: t('setting__other_resource_cache_confirm'),
      })) return
      isDisabledResourceCacheClear.value = true
      clearCache().then(() => {
        refreshCacheSize()
        isDisabledResourceCacheClear.value = false
      })
    }
    refreshCacheSize()

    const clearMyListCache = useCommit('list', 'clearCache')
    const clearListCache = async() => {
      if (!await dialog.confirm({
        message: t('setting__other_play_list_cache_tip_confirm'),
        cancelButtonText: t('cancel_button_text'),
        confirmButtonText: t('setting__other_resource_cache_confirm'),
      })) return

      isDisabledListCacheClear.value = true
      clearMyListCache()
      isDisabledListCacheClear.value = false
    }

    return {
      currentStting,
      trayThemeList,
      cacheSize,
      isDisabledResourceCacheClear,
      isDisabledListCacheClear,
      clearResourceCache,
      clearListCache,
    }
  },
}
</script>
