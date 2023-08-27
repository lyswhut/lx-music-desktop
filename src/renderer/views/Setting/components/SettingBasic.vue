<template lang="pug">
dt#basic {{ $t('setting__basic') }}
dd
  h3#basic_theme {{ $t('setting__basic_theme') }}
  div
    ul(:class="$style.theme")
      li(v-for="theme in defaultThemes" :key="theme.id" :aria-label="$t('theme_' + theme.id)" :style="theme.styles" :class="[$style.themeItem, {[$style.active]: themeId == theme.id}]" @click="toggleTheme(theme)")
        div(:class="$style.bg")
        span(:class="$style.label") {{ $t('theme_' + theme.id) }}
      li(v-for="theme in userThemes" :key="theme.id" :aria-label="theme.name" :style="theme.styles" :class="[$style.themeItem, {[$style.active]: themeId == theme.id}]" @click="toggleTheme(theme)" @contextmenu="handleEditTheme(theme)")
        div(:class="$style.bg")
        span(:class="$style.label") {{ theme.name }}
      li(:aria-label="$t('theme_auto_tip')" :style="autoTheme" :class="[$style.themeItem, $style.auto, {[$style.active]: themeId == 'auto'}]" @click="handleSetThemeAuto" @contextmenu="isShowThemeSelectorModal = true")
        div(:class="$style.bg")
          div(:class="$style.bgContent")
            div(:class="$style.light")
            div(:class="$style.dark")
        span(:class="$style.label") {{ $t('theme_auto') }}
      li(:aria-label="$t('theme_add')" :class="[$style.themeItem, $style.add]" @click="handleEditTheme()")
        div(:class="$style.bg")
          div(:class="$style.bgContent")
            svg-icon(:class="$style.icon" name="plus")
        span(:class="$style.label") {{ $t('theme_add') }}

dd
  div
    .gap-top.top
      base-checkbox(id="setting_show_animate" :model-value="appSetting['common.isShowAnimation']" :label="$t('setting__basic_show_animation')" @update:model-value="updateSetting({'common.isShowAnimation': $event})")
    .gap-top
      base-checkbox(id="setting_animate" :model-value="appSetting['common.randomAnimate']" :label="$t('setting__basic_animation')" @update:model-value="updateSetting({'common.randomAnimate': $event})")
    .gap-top
      base-checkbox(id="setting_start_in_fullscreen" :model-value="appSetting['common.startInFullscreen']" :label="$t('setting__basic_start_in_fullscreen')" @update:model-value="updateSetting({'common.startInFullscreen': $event})")
    .gap-top
      base-checkbox(id="setting_to_tray" :model-value="appSetting['tray.enable']" :label="$t('setting__basic_to_tray')" @update:model-value="updateSetting({'tray.enable': $event})")
    .p.gap-top
      base-btn.btn(min @click="isShowPlayTimeoutModal = true") {{ $t('setting__play_timeout')}} {{ timeLabel ? ` (${timeLabel})` : '' }}

dd
  h3#basic_source {{ $t('setting__basic_source') }}
  div
    .gap-top(v-for="item in apiSources" :key="item.id")
      base-checkbox(
        :id="`setting_api_source_${item.id}`" name="setting_api_source"
        need :model-value="appSetting['common.apiSource']" :disabled="item.disabled" :value="item.id" :label="item.label" @update:model-value="updateSetting({'common.apiSource': $event})")
    .p.gap-top
      base-btn.btn(min @click="isShowUserApiModal = true") {{ $t('setting__basic_source_user_api_btn') }}

dd
  h3#basic_window_size {{ $t('setting__basic_window_size') }}
  div
    base-checkbox.gap-left(
      v-for="item in windowSizeList" :id="`setting_window_size_${item.id}`" :key="item.id"
      name="setting_window_size" need :model-value="appSetting['common.windowSizeId']" :disabled="isFullscreen" :value="item.id" :label="$t('setting__basic_window_size_' + item.name)" @update:model-value="updateSetting({'common.windowSizeId': $event})")

dd
  h3#basic_font_size {{ $t('setting__basic_font_size') }}
  div
    //- base-selection.gap-teft(:list="fontSizeList" :model-value="appSetting['common.fontSize']" @update:model-value="updateSetting({'common.fontSize': $event})")
    base-checkbox.gap-left(
      v-for="item in fontSizeList" :id="`setting_basic_font_size_${item.id}`" :key="item.id"
      name="setting_basic_font_size" need :model-value="appSetting['common.fontSize']" :value="item.id"
      :label="item.label" :disabled="isFullscreen" @update:model-value="updateSetting({'common.fontSize': $event})")

dd
  h3#basic_font {{ $t('setting__basic_font') }}
  div
    base-selection.gap-teft(:list="fontList" :model-value="appSetting['common.font']" item-key="id" item-name="label" @update:model-value="updateSetting({'common.font': $event})")

dd
  h3#basic_lang {{ $t('setting__basic_lang') }}
  div
    base-checkbox.gap-left(
v-for="item in langList" :id="`setting_lang_${item.locale}`" :key="item.locale" name="setting_lang"
      need :model-value="appSetting['common.langId']" :value="item.locale" :label="item.name" @update:model-value="updateSetting({'common.langId': $event})")

dd
  h3#basic_sourcename {{ $t('setting__basic_sourcename') }}
  div
    base-checkbox.gap-left(
v-for="item in sourceNameTypes" :id="`setting_abasic_sourcename_${item.id}`" :key="item.id"
      name="setting_basic_sourcename" need :model-value="appSetting['common.sourceNameType']" :value="item.id" :label="item.label" @update:model-value="updateSetting({'common.sourceNameType': $event})")
dd
  h3#basic_control_btn_position {{ $t('setting__basic_control_btn_position') }}
  div
    base-checkbox.gap-left(
v-for="item in controlBtnPositionList" :id="`setting_basic_control_btn_position_${item.id}`" :key="item.id"
      name="setting_basic_control_btn_position" need :model-value="appSetting['common.controlBtnPosition']" :value="item.id" :label="item.name" @update:model-value="updateSetting({'common.controlBtnPosition': $event})")
dd
  h3#basic_playbar_progress_style {{ $t('setting__basic_playbar_progress_style') }}
  div
    base-checkbox.gap-left(
id="setting_basic_playbar_progress_style_mini" name="setting_basic_playbar_progress_style"
      need :model-value="appSetting['common.playBarProgressStyle']" value="mini" :label="$t('setting__basic_playbar_progress_style_mini')" @update:model-value="updateSetting({'common.playBarProgressStyle': $event})")
    base-checkbox.gap-left(
id="setting_basic_playbar_progress_style_middle" name="setting_basic_playbar_progress_style"
      need :model-value="appSetting['common.playBarProgressStyle']" value="middle" :label="$t('setting__basic_playbar_progress_style_middle')" @update:model-value="updateSetting({'common.playBarProgressStyle': $event})")
    base-checkbox.gap-left(
id="setting_basic_playbar_progress_style_full" name="setting_basic_playbar_progress_style"
      need :model-value="appSetting['common.playBarProgressStyle']" value="full" :label="$t('setting__basic_playbar_progress_style_full')" @update:model-value="updateSetting({'common.playBarProgressStyle': $event})")

ThemeSelectorModal(v-model="isShowThemeSelectorModal")
ThemeEditModal(v-model="isShowThemeEditModal" :theme-id="editThemeId" @submit="handleRefreshTheme")
play-timeout-modal(v-model="isShowPlayTimeoutModal")
user-api-modal(v-model="isShowUserApiModal")
</template>

<script>
import { computed, ref, watch, reactive, shallowReactive } from '@common/utils/vueTools'
import { windowSizeList, userApi, isFullscreen, themeId } from '@renderer/store'
import { langList, useI18n } from '@root/lang'
import { getSystemFonts } from '@renderer/utils/ipc'
import apiSourceInfo from '@renderer/utils/musicSdk/api-source-info'
import { useTimeout } from '@renderer/core/player/timeoutStop'
import { dialog } from '@renderer/plugins/Dialog'

import ThemeSelectorModal from './ThemeSelectorModal.vue'
import ThemeEditModal from './ThemeEditModal/index.vue'
import PlayTimeoutModal from './PlayTimeoutModal.vue'
import UserApiModal from './UserApiModal.vue'
import { appSetting, updateSetting } from '@renderer/store/setting'
import { getThemes, applyTheme, findTheme, buildBgUrl } from '@renderer/store/utils'

export default {
  name: 'SettingBasic',
  components: {
    ThemeSelectorModal,
    ThemeEditModal,
    PlayTimeoutModal,
    UserApiModal,
  },
  setup() {
    const t = useI18n()

    const defaultThemes = shallowReactive([])
    const userThemes = shallowReactive([])
    const autoTheme = reactive({})
    const updateAutoTheme = (info) => {
      let light = findTheme(info, appSetting['theme.lightId'])
      light ??= info.themes.find(theme => theme.id == 'green')
      let dark = findTheme(info, appSetting['theme.darkId'])
      dark ??= info.themes.find(theme => theme.id == 'black')
      autoTheme['--color-primary-theme-light'] = light.config.themeColors['--color-theme']
      autoTheme['--background-image-theme-light'] = light.isCustom
        ? light.config.extInfo['--background-image'] == 'none'
          ? 'none'
          : buildBgUrl(light.config.extInfo['--background-image'], info.dataPath)
        : light.config.extInfo['--background-image']
      autoTheme['--color-primary-theme-dark'] = dark.config.themeColors['--color-theme']
      autoTheme['--background-image-theme-dark'] = dark.isCustom
        ? dark.config.extInfo['--background-image'] == 'none'
          ? 'none'
          : buildBgUrl(dark.config.extInfo['--background-image'], info.dataPath)
        : dark.config.extInfo['--background-image']
    }

    let dataPath = ''
    const init = () => {
      getThemes((info) => {
        // console.log(info)
        dataPath = info.dataPath
        defaultThemes.splice(0, defaultThemes.length, ...info.themes.map(t => {
          return {
            id: t.id,
            styles: {
              '--color-primary-theme': t.config.themeColors['--color-theme'],
              '--background-image-theme': t.config.extInfo['--background-image'],
            },
          }
        }))
        userThemes.splice(0, userThemes.length, ...info.userThemes.map(t => {
          return {
            id: t.id,
            name: t.name,
            styles: {
              '--color-primary-theme': t.config.themeColors['--color-theme'],
              '--background-image-theme': t.config.extInfo['--background-image'] == 'none'
                ? 'none'
                : buildBgUrl(t.config.extInfo['--background-image'], info.dataPath),
            },
          }
        }))
        updateAutoTheme(info)
      })
    }
    const editThemeId = ref('')
    const handleEditTheme = (theme) => {
      // console.log(theme)
      if (!theme && userThemes.length >= 10) {
        void dialog({
          message: t('theme_max_tip'),
          confirmButtonText: t('alert_button_text'),
        })
        return
      }
      editThemeId.value = theme ? theme.id : ''
      isShowThemeEditModal.value = true
    }
    const handleRefreshTheme = () => {
      init()
    }
    init()
    const toggleTheme = (theme) => {
      if (themeId.value == theme.id) return
      themeId.value = theme.id
      applyTheme(theme.id, appSetting['theme.lightId'], appSetting['theme.darkId'], dataPath)
      updateSetting({ 'theme.id': theme.id })
    }

    watch(() => [appSetting['theme.lightId'], appSetting['theme.darkId']], () => {
      getThemes(updateAutoTheme)
    })
    const isShowThemeSelectorModal = ref(false)
    const handleSetThemeAuto = () => {
      if (themeId.value == 'auto') return
      if (window.localStorage.getItem('theme-auto-tip') != 'true') {
        window.localStorage.setItem('theme-auto-tip', 'true')
        void dialog({
          message: t('setting__basic_theme_auto_tip'),
          confirmButtonText: t('ok'),
        })
      }
      toggleTheme({ id: 'auto' })
    }
    const isShowThemeEditModal = ref(false)

    const isShowPlayTimeoutModal = ref(false)
    const { timeLabel } = useTimeout()

    const isShowUserApiModal = ref(false)
    const getApiStatus = () => {
      let status
      if (userApi.status) status = t('setting__basic_source_status_success')
      else if (userApi.message == 'initing') status = t('setting__basic_source_status_initing')
      else status = `${t('setting__basic_source_status_failed')} - ${userApi.message}`

      return status
    }
    const apiSources = computed(() => {
      return [
        ...apiSourceInfo.map(api => ({
          id: api.id,
          label: t('setting__basic_source_' + api.id) || api.name,
          disabled: api.disabled,
        })),
        ...userApi.list.map(api => ({
          id: api.id,
          label: `${api.name}${api.description ? `（${api.description}）` : ''}${api.id == appSetting['common.apiSource'] ? `[${getApiStatus()}]` : ''}`,
          status: api.status,
          message: api.message,
          disabled: false,
        })),
      ]
    })

    const sourceNameTypes = computed(() => {
      return [
        { id: 'real', label: t('setting__basic_sourcename_real') },
        { id: 'alias', label: t('setting__basic_sourcename_alias') },
      ]
    })


    const controlBtnPositionList = computed(() => {
      return [
        { id: 'left', name: t('setting__basic_control_btn_position_left') },
        { id: 'right', name: t('setting__basic_control_btn_position_right') },
      ]
    })

    const systemFontList = ref([])
    const fontList = computed(() => {
      return [{ id: '', label: t('setting__desktop_lyric_font_default') }, ...systemFontList.value]
    })
    void getSystemFonts().then(fonts => {
      systemFontList.value = fonts.map(f => ({ id: f, label: f.replace(/(^"|"$)/g, '') }))
    })

    const fontSizeList = computed(() => {
      return [
        { id: 14, label: t('setting__basic_font_size_14px') },
        { id: 15, label: t('setting__basic_font_size_15px') },
        { id: 16, label: t('setting__basic_font_size_16px') },
        { id: 17, label: t('setting__basic_font_size_17px') },
        { id: 18, label: t('setting__basic_font_size_18px') },
        { id: 19, label: t('setting__basic_font_size_19px') },
      ]
    })


    return {
      appSetting,
      updateSetting,
      defaultThemes,
      userThemes,
      autoTheme,
      // currentStting,
      // themes,
      // themeClassName,
      isShowThemeSelectorModal,
      isShowThemeEditModal,
      handleSetThemeAuto,
      isShowPlayTimeoutModal,
      timeLabel,
      apiSources,
      isShowUserApiModal,
      windowSizeList,
      langList,
      sourceNameTypes,
      controlBtnPositionList,
      fontList,
      isFullscreen,
      toggleTheme,
      themeId,
      handleRefreshTheme,
      editThemeId,
      handleEditTheme,
      fontSizeList,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.theme {
  display: flex;
  flex-flow: row wrap;
  // padding: 0 15px;
  margin-bottom: -20px;

  .themeItem {
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    cursor: pointer;
    // color: var(--color-primary);
    margin-right: 30px;
    transition: .3s ease;
    transition-property: color, opacity;
    margin-bottom: 18px;
    width: 56px;

    &:hover {
      opacity: .7;
    }

    &:last-child {
      margin-right: 0;
    }

    &.active {
      color: var(--color-primary-font-active);
      .bg {
        border-color: var(--color-primary-font-active);
      }

      &:hover {
        opacity: 1;
      }
    }

    .bg {
      display: block;
      width: 36px;
      height: 36px;
      margin-bottom: 5px;
      border: 2Px solid transparent;
      padding: 2Px;
      transition: border-color .3s ease;
      border-radius: 5px;
      &:after {
        display: block;
        content: ' ';
        width: 100%;
        height: 100%;
        border-radius: @radius-border;
        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;
        background-color: var(--color-primary-theme);
        background-image: var(--background-image-theme);
      }
    }

    .label {
      width: 100%;
      text-align: center;
      height: 1.2em;
      .mixin-ellipsis-1;
    }

    &.auto {

      &.active {
        color: var(--color-primary-font-active);
        .bg {
          border-color: var(--color-primary-font-active);
        }
      }

      >.bg {
        &:after {
          content: none;
        }
      }
      .bgContent {
        position: relative;
        height: 100%;
        overflow: hidden;
        border-radius: 5px;
      }
      .light, .dark {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        &:after {
          display: block;
          content: ' ';
          width: 100%;
          height: 100%;
          background-position: center;
          background-size: cover;
          background-repeat: no-repeat;
        }
      }
      .light {
        &:after {
          clip-path: polygon(0 0, 100% 0, 0 100%);
        }
        svg {
          fill: var(--color-primary-theme-light);
        }
        &:after {
          background-color: var(--color-primary-theme-light);
          background-image: var(--background-image-theme-light);
        }
      }
      .dark {
        &:after {
          clip-path: polygon(0 100%, 100% 0, 100% 100%);
        }
        svg {
          fill: var(--color-primary-theme-dark);
        }
        &:after {
          background-color: var(--color-primary-theme-dark);
          background-image: var(--background-image-theme-dark);
        }
      }
    }

    &.add {
      >.bg {
        &:after {
          content: none;
        }
        .bgContent {
          transition: .3s ease;
          transition-property: border, color;
          box-sizing: border-box;
          border: 1Px dashed var(--color-primary-light-100-alpha-300);
          color: var(--color-primary-light-100-alpha-300);
          position: relative;
          height: 100%;
          overflow: hidden;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .icon {
          // position: absolute;
          // font-size: 16px;
          width: 66%;
          height: auto;
        }
      }
      .label {
        color: var(--color-primary-dark-100-alpha-300);
      }
    }
  }
}

</style>
