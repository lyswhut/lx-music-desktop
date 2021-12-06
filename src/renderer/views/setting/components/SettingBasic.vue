<template lang="pug">
dt#basic {{$t('setting__basic')}}
dd
  h3#basic_theme {{$t('setting__basic_theme')}}
  div
    ul(:class="$style.theme")
      li(v-for="theme in themes.list" :key="theme.id" :tips="$t('theme_' + theme.className)" @click="currentStting.themeId = theme.id" :class="[theme.className, {[$style.active]: themes.active == theme.id}]")
        span
        label {{$t('theme_' + theme.className)}}

dd
  .gap-top.top
    base-checkbox(id="setting_show_animate" v-model="currentStting.isShowAnimation" :label="$t('setting__basic_show_animation')")
  .gap-top
    base-checkbox(id="setting_animate" v-model="currentStting.randomAnimate" :label="$t('setting__basic_animation')")
  .gap-top
    base-checkbox(id="setting_to_tray" v-model="currentStting.tray.isShow" :label="$t('setting__basic_to_tray')")

dd(:tips="$t('setting__basic_source_title')")
  h3#basic_source {{$t('setting__basic_source')}}
  div
    .gap-top(v-for="item in apiSources" :key="item.id")
      base-checkbox(:id="`setting_api_source_${item.id}`" name="setting_api_source"
        need v-model="currentStting.apiSource" :disabled="item.disabled" :value="item.id" :label="item.label")
    p.gap-top
      base-btn.btn(min @click="isShowUserApiModal = true") {{$t('setting__basic_source_user_api_btn')}}

dd(:tips="$t('setting__basic_window_size_title')")
  h3#basic_window_size {{$t('setting__basic_window_size')}}
  div
    base-checkbox.gap-left(v-for="(item, index) in windowSizeList" :id="`setting_window_size_${item.id}`" name="setting_window_size"
      need v-model="currentStting.windowSizeId" :value="item.id" :label="$t('setting__basic_window_size_' + item.name)" :key="item.id")

dd(:tips="$t('setting__basic_lang_title')")
  h3#basic_lang {{$t('setting__basic_lang')}}
  div
    base-checkbox.gap-left(v-for="item in langList" :key="item.locale" :id="`setting_lang_${item.locale}`" name="setting_lang"
      need v-model="currentStting.langId" :value="item.locale" :label="item.name")

dd(:tips="$t('setting__basic_sourcename_title')")
  h3#basic_sourcename {{$t('setting__basic_sourcename')}}
  div
    base-checkbox.gap-left(v-for="item in sourceNameTypes" :key="item.id" :id="`setting_abasic_sourcename_${item.id}`"
      name="setting_basic_sourcename" need v-model="currentStting.sourceNameType" :value="item.id" :label="item.label")

dd
  h3#basic_control_btn_position {{$t('setting__basic_control_btn_position')}}
  div
    base-checkbox.gap-left(v-for="item in controlBtnPositionList" :key="item.id" :id="`setting_basic_control_btn_position_${item.id}`"
      name="setting_basic_control_btn_position" need v-model="currentStting.controlBtnPosition" :value="item.id" :label="item.name")
user-api-modal(v-model="isShowUserApiModal")
</template>

<script>
import { computed, ref, useI18n, watch } from '@renderer/utils/vueTools'
import { themes as themeList, windowSizeList, apiSource, userApi } from '@renderer/core/share'
import { langList } from '@/lang'
import { currentStting } from '../setting'
import { setWindowSize } from '@renderer/utils'
import apiSourceInfo from '@renderer/utils/music/api-source-info'

import UserApiModal from './UserApiModal'

export default {
  name: 'SettingBasic',
  components: {
    UserApiModal,
  },
  setup() {
    const { t, locale } = useI18n()


    const themes = computed(() => {
      return {
        active: currentStting.value.themeId,
        list: themeList,
      }
    })

    watch(() => currentStting.value.apiSource, visible => {
      apiSource.value = visible
    })

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
          label: `${api.name}${api.description ? `（${api.description}）` : ''}${api.id == currentStting.value.apiSource ? `[${getApiStatus()}]` : ''}`,
          status: api.status,
          message: api.message,
          disabled: false,
        })),
      ]
    })


    watch(() => currentStting.value.windowSizeId, (index) => {
      let info = index == null ? windowSizeList[2] : windowSizeList[index]
      setWindowSize(info.width, info.height)
    })


    watch(() => currentStting.value.langId, (id) => {
      locale.value = id
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


    return {
      currentStting,
      themes,
      apiSources,
      isShowUserApiModal,
      windowSizeList,
      langList,
      sourceNameTypes,
      controlBtnPositionList,
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

  li {
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    cursor: pointer;
    // color: @color-theme;
    margin-right: 30px;
    transition: color .3s ease;
    margin-bottom: 18px;
    width: 56px;

    &:last-child {
      margin-right: 0;
    }

    span {
      display: block;
      width: 36px;
      height: 36px;
      margin-bottom: 5px;
      border: 2px solid transparent;
      padding: 2px;
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
      }
    }

    label {
      width: 100%;
      text-align: center;
      height: 1.2em;
      .mixin-ellipsis-1;
    }

    each(@themes, {
      &:global(.@{value}) {
        span {
          &:after {
            background-color: ~'@{color-@{value}-theme}';
            background-image: ~'@{color-@{value}-theme-bgimg}';
          }
        }
      }
    })
  }
}

each(@themes, {
  :global(#root.@{value}) {
    .theme {
      li {
        &.active {
          &:global(.@{value}) {
            color: ~'@{color-@{value}-theme}';
            span {
              border-color: ~'@{color-@{value}-theme}';
            }
          }
        }
      }
    }
  }
})

</style>
