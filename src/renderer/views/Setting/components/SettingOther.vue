<template lang="pug">
dt#other {{ $t('setting__other') }}
dd
  div(:class="$style.cardRow")
    div(:class="$style.sectionCard")
      h3#other_options(:class="$style.sectionCardTitle") {{ $t('setting__other_options') }}
      div(:class="$style.sectionCardBody")
        .gap-top
          base-checkbox(id="setting_transparent_window" :model-value="appSetting['common.transparentWindow']" :label="$t('setting__other_transparent_window')" @update:model-value="updateSetting({'common.transparentWindow': $event})")
          svg-icon(class="help-icon" name="help-circle-outline" :aria-label="$t('setting__other_transparent_window_tip')")
    div(:class="$style.sectionCard")
      h3#other_tray_theme(:class="$style.sectionCardTitle") {{ $t('setting__other_tray_theme') }}
      div(:class="$style.sectionCardBody")
        .gap-top(v-for="item in trayThemeList" :key="item.id")
          base-checkbox(
            :id="'setting_tray_theme_' + item.id" name="setting_tray_theme"
            :model-value="appSetting['tray.themeId']" need :label="item.label" :value="item.id" @update:model-value="updateSetting({'tray.themeId': $event})")
    div(:class="$style.sectionCard")
      h3#other_resource_cache(:class="$style.sectionCardTitle")
        | {{ $t('setting__other_resource_cache') }}
        svg-icon(class="help-icon" name="help-circle-outline" :aria-label="$t('setting__other_resource_cache_tip')")
      div(:class="$style.sectionCardBody")
        .p
          | {{ $t('setting__other_resource_cache_label') }}
          span.auto-hidden {{ cacheSize }}
        .p
          base-btn.btn(min :disabled="isDisabledResourceCacheClear" @click="clearResourceCache") {{ $t('setting__other_resource_cache_clear_btn') }}

dd
  div(:class="[$style.cardRow, $style.rowCache]")
    div(:class="$style.sectionCard")
      h3#other_other_source(:class="$style.sectionCardTitle") {{ $t('setting__other_other_cache') }}
      div(:class="$style.sectionCardBody")
        .p
          | {{ $t('setting__other_other_source_label') }}
          span.auto-hidden {{ otherSourceCount }}
        .p
          | {{ $t('setting__other_music_url_label') }}
          span.auto-hidden {{ musicUrlCount }}
        .p
          | {{ $t('setting__other_lyric_raw_label') }}
          span.auto-hidden {{ lyricRawCount }}
        .p(:class="$style.btnRow")
          base-btn.btn(min :disabled="isDisabledOtherSourceCacheClear" @click="handleClearOtherSourceCache") {{ $t('setting__other_other_source_clear_btn') }}
          base-btn.btn(min :disabled="isDisabledMusicUrlCacheClear" @click="handleClearMusicUrlCache") {{ $t('setting__other_music_url_clear_btn') }}
          base-btn.btn(min :disabled="isDisabledLyricRawCacheClear" @click="handleClearLyricRawCache") {{ $t('setting__other_lyric_raw_clear_btn') }}
    div(:class="$style.sectionCard")
      h3#other_dislike_list(:class="$style.sectionCardTitle") {{ $t('setting__other_dislike_list') }}
      div(:class="$style.sectionCardBody")
        .p
          | {{ $t('setting__other_dislike_list_label') }}
          span.auto-hidden {{ dislikeRuleCount }}
        .p
          base-btn.btn(min @click="isShowDislikeList = true") {{ $t('setting__other_dislike_list_show_btn') }}
    div(:class="$style.sectionCard")
      h3#other_lyric_edited(:class="$style.sectionCardTitle") {{ $t('setting__other_lyric_edited_cache') }}
      div(:class="$style.sectionCardBody")
        .p
          | {{ $t('setting__other_lyric_edited_label') }}
          span.auto-hidden {{ lyricEditedCount }}
        .p
          base-btn.btn(min :disabled="isDisabledLyricEditedCacheClear" @click="handleClearLyricEditedCache") {{ $t('setting__other_lyric_edited_clear_btn') }}
    div(:class="$style.sectionCard")
      h3#other_listdata(:class="$style.sectionCardTitle") {{ $t('setting__other_listdata') }}
      div(:class="$style.sectionCardBody")
        .p
          base-btn.btn(min @click="handleClearListData") {{ $t('setting__other_listdata_clear_btn') }}
  DislikeListModal(v-model="isShowDislikeList")

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

<style lang="less" module>
// 设置分区卡片：头部色带 + 浅色主题底，与 SettingBasic 保持一致
.sectionCard {
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--color-primary-light-300-alpha-700);
}

// 一行多列的卡片布局
.cardRow {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 12px;
  margin-top: 16px;
  align-items: stretch;
}

.sectionCardTitle {
  margin: 0;
  padding: 8px 12px;
  font-size: 13px;
  background-color: var(--color-primary-light-200-alpha-600);
}

.sectionCardBody {
  padding: 12px;
}

// 卡片行中的加宽卡片（跨两列）
.wideCard {
  grid-column: span 2;
}

// 缓存管理按钮强制一行不换行
.btnRow {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 6px;

  :deep(button) {
    flex: none;
    white-space: nowrap;
    padding-left: 8px;
    padding-right: 8px;
  }
}

// 缓存管理行自定义列宽：第一卡收窄、第三卡（已调整歌词）加宽让按钮文字一行显示
.rowCache {
  grid-auto-flow: unset;
  grid-auto-columns: unset;
  grid-template-columns: 1.6fr 1fr 1.3fr 1fr;
  gap: 10px;
}
</style>
