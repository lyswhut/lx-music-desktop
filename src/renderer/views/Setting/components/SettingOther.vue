<template lang="pug">
dt#other {{ $t('setting__other') }}
dd
  h3#other_tray_theme {{ $t('setting__other_tray_theme') }}
  div
    base-checkbox.gap-left(
      v-for="item in trayThemeList" :id="'setting_tray_theme_' + item.id" :key="item.id" :model-value="appSetting['tray.themeId']" name="setting_tray_theme"
      need :label="item.label" :value="item.id" @update:model-value="updateSetting({'tray.themeId': $event})")
dd
  h3#other_resource_cache
    | {{ $t('setting__other_resource_cache') }}
    svg-icon(class="help-icon" name="help-circle-outline" :aria-label="$t('setting__other_resource_cache_tip')")
  div
    .p
      | {{ $t('setting__other_resource_cache_label') }}
      span.auto-hidden {{ cacheSize }}
    .p
      base-btn.btn(min :disabled="isDisabledResourceCacheClear" @click="clearResourceCache") {{ $t('setting__other_resource_cache_clear_btn') }}

dd
  h3#other_other_source {{ $t('setting__other_other_cache') }}
  div
    .p
      | {{ $t('setting__other_other_source_label') }}
      span.auto-hidden {{ otherSourceCount }}
    .p
      | {{ $t('setting__other_music_url_label') }}
      span.auto-hidden {{ musicUrlCount }}
    .p
      | {{ $t('setting__other_lyric_raw_label') }}
      span.auto-hidden {{ lyricRawCount }}
    .p
      base-btn.btn(min :disabled="isDisabledOtherSourceCacheClear" @click="handleClearOtherSourceCache") {{ $t('setting__other_other_source_clear_btn') }}
      base-btn.btn(min :disabled="isDisabledMusicUrlCacheClear" @click="handleClearMusicUrlCache") {{ $t('setting__other_music_url_clear_btn') }}
      base-btn.btn(min :disabled="isDisabledLyricRawCacheClear" @click="handleClearLyricRawCache") {{ $t('setting__other_lyric_raw_clear_btn') }}

dd
  h3#other_lyric_edited {{ $t('setting__other_dislike_list') }}
  div
    .p
      | {{ $t('setting__other_dislike_list_label') }}
      span.auto-hidden {{ dislikeRuleCount }}
    .p
      base-btn.btn(min @click="isShowDislikeList = true") {{ $t('setting__other_dislike_list_show_btn') }}
  DislikeListModal(v-model="isShowDislikeList")

dd
  h3#other_lyric_edited {{ $t('setting__other_lyric_edited_cache') }}
  div
    .p
      | {{ $t('setting__other_lyric_edited_label') }}
      span.auto-hidden {{ lyricEditedCount }}
    .p
      base-btn.btn(min :disabled="isDisabledLyricEditedCacheClear" @click="handleClearLyricEditedCache") {{ $t('setting__other_lyric_edited_clear_btn') }}

dd
  h3#other_lyric_edited {{ $t('setting__other_listdata') }}
  div
    .p
      base-btn.btn(min @click="handleClearListData") {{ $t('setting__other_listdata_clear_btn') }}

</template>

<script>
import { ref, computed } from '@common/utils/vueTools'
import {
  clearCache, getCacheSize,
  getOtherSourceCount, clearOtherSource,
  getMusicUrlCount, clearMusicUrl,
  getLyricRawCount, clearLyricRaw,
  getLyricEditedCount, clearLyricEdited,
} from '@renderer/utils/ipc'
import { sizeFormate } from '@common/utils/common'
import { dialog } from '@renderer/plugins/Dialog'
import { useI18n } from '@renderer/plugins/i18n'
import { appSetting, updateSetting } from '@renderer/store/setting'
import { overwriteListFull } from '@renderer/store/list/listManage'
import { dislikeRuleCount } from '@renderer/store/dislikeList'
import DislikeListModal from './DislikeListModal.vue'
import { TRAY_AUTO_ID } from '@common/constants'

export default {
  name: 'SettingOther',
  components: {
    DislikeListModal,
  },
  setup() {
    const t = useI18n()

    const trayThemeList = computed(() => {
      return [
        { id: 0, name: 'native', label: t('setting__other_tray_theme_native') },
        { id: 2, name: 'black', label: t('setting__other_tray_theme_black') },
        { id: 1, name: 'origin', label: t('setting__other_tray_theme_origin') },
        { id: TRAY_AUTO_ID, name: 'auto', label: t('setting__other_tray_theme_auto') },
      ]
    })

    const cacheSize = ref('0 B')
    const isDisabledResourceCacheClear = ref(false)
    // const isDisabledListCacheClear = ref(false)
    const refreshCacheSize = () => {
      void getCacheSize().then(size => {
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
      void clearCache().then(() => {
        refreshCacheSize()
        isDisabledResourceCacheClear.value = false
      })
    }
    refreshCacheSize()


    const otherSourceCount = ref(0)
    const isDisabledOtherSourceCacheClear = ref(false)
    const refreshOtherSourceCount = () => {
      void getOtherSourceCount().then(count => {
        otherSourceCount.value = count
      })
    }
    const handleClearOtherSourceCache = async() => {
      isDisabledOtherSourceCacheClear.value = true
      void clearOtherSource().then(() => {
        refreshOtherSourceCount()
        isDisabledOtherSourceCacheClear.value = false
      })
    }
    refreshOtherSourceCount()


    const musicUrlCount = ref(0)
    const isDisabledMusicUrlCacheClear = ref(false)
    const refreshMusicUrlCount = () => {
      void getMusicUrlCount().then(count => {
        musicUrlCount.value = count
      })
    }
    const handleClearMusicUrlCache = async() => {
      isDisabledMusicUrlCacheClear.value = true
      void clearMusicUrl().then(() => {
        refreshMusicUrlCount()
        isDisabledMusicUrlCacheClear.value = false
      })
    }
    refreshMusicUrlCount()

    const isShowDislikeList = ref(false)

    const lyricRawCount = ref(0)
    const isDisabledLyricRawCacheClear = ref(false)
    const refreshLyricRawCount = () => {
      void getLyricRawCount().then(count => {
        lyricRawCount.value = count
      })
    }
    const handleClearLyricRawCache = async() => {
      isDisabledLyricRawCacheClear.value = true
      void clearLyricRaw().then(() => {
        refreshLyricRawCount()
        isDisabledLyricRawCacheClear.value = false
      })
    }
    refreshLyricRawCount()


    const lyricEditedCount = ref(0)
    const isDisabledLyricEditedCacheClear = ref(false)
    const refreshLyricEditedCount = () => {
      void getLyricEditedCount().then(count => {
        lyricEditedCount.value = count
      })
    }
    const handleClearLyricEditedCache = async() => {
      if (!await dialog.confirm({
        message: t('setting__other_lyric_edited_clear_tip_confirm'),
        cancelButtonText: t('cancel_button_text'),
        confirmButtonText: t('setting__other_resource_cache_confirm'),
      })) return
      isDisabledLyricEditedCacheClear.value = true
      void clearLyricEdited().then(() => {
        refreshLyricEditedCount()
        isDisabledLyricEditedCacheClear.value = false
      })
    }
    refreshLyricEditedCount()

    const handleClearListData = async() => {
      if (!await dialog.confirm({
        message: t('setting__other_listdata_clear_tip_confirm'),
        cancelButtonText: t('cancel_button_text'),
        confirmButtonText: t('setting__other_resource_cache_confirm'),
      })) return
      void overwriteListFull({
        defaultList: [],
        loveList: [],
        userList: [],
        tempList: [],
      })
    }

    return {
      appSetting,
      updateSetting,
      trayThemeList,
      cacheSize,
      isDisabledResourceCacheClear,
      clearResourceCache,

      otherSourceCount,
      isDisabledOtherSourceCacheClear,
      handleClearOtherSourceCache,

      musicUrlCount,
      isDisabledMusicUrlCacheClear,
      handleClearMusicUrlCache,

      dislikeRuleCount,
      isShowDislikeList,

      lyricRawCount,
      isDisabledLyricRawCacheClear,
      handleClearLyricRawCache,

      lyricEditedCount,
      isDisabledLyricEditedCacheClear,
      handleClearLyricEditedCache,

      handleClearListData,
    }
  },
}
</script>
