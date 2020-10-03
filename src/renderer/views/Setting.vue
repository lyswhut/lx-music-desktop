<template lang="pug">
div.scroll(:class="$style.setting")
  dl
    dt {{$t('view.setting.basic')}}
    dd
      h3 {{$t('view.setting.basic_theme')}}
      div
        ul(:class="$style.theme")
          li(v-for="theme in themes.list" :key="theme.id" :tips="$t('store.state.theme_' + theme.class)" @click="current_setting.themeId = theme.id" :class="[theme.class, themes.active == theme.id ? $style.active : '']")
            span
            label {{$t('store.state.theme_' + theme.class)}}

    dd
      h3 {{$t('view.setting.basic_show_animation')}}
      div
        material-checkbox(id="setting_show_animate" v-model="current_setting.isShowAnimation" :label="$t('view.setting.is_show')")

    dd(:tips="$t('view.setting.basic_animation_title')")
      h3 {{$t('view.setting.basic_animation')}}
      div
        material-checkbox(id="setting_animate" v-model="current_setting.randomAnimate" :label="$t('view.setting.is_enable')")

    dd(:tips="$t('view.setting.basic_source_title')")
      h3 {{$t('view.setting.basic_source')}}
      div
        div(v-for="item in apiSources" :key="item.id" :class="$style.gapTop")
          material-checkbox(:id="`setting_api_source_${item.id}`" name="setting_api_source" @change="handleAPISourceChange(item.id)"
            need v-model="current_setting.apiSource" :disabled="item.disabled" :value="item.id" :label="item.label")

    dd(:tips="$t('view.setting.basic_to_tray_title')")
      h3 {{$t('view.setting.basic_to_tray')}}
      div
        material-checkbox(id="setting_to_tray" v-model="current_setting.tray.isShow" @change="handleTrayShowChange" :label="$t('view.setting.is_enable')")

    dd(:tips="$t('view.setting.basic_window_size_title')")
      h3 {{$t('view.setting.basic_window_size')}}
      div
        material-checkbox(v-for="(item, index) in windowSizeList" :id="`setting_window_size_${item.id}`" name="setting_window_size" @change="handleWindowSizeChange" :class="$style.gapLeft"
          need v-model="current_setting.windowSizeId" :value="item.id" :label="$t('view.setting.basic_window_size_' + item.name)" :key="item.id")

    dd(:tips="$t('view.setting.basic_lang_title')")
      h3 {{$t('view.setting.basic_lang')}}
      div
        material-checkbox(v-for="item in languageList" :key="item.locale" :id="`setting_lang_${item.locale}`" name="setting_lang"
          @change="handleLangChange(item.locale)" :class="$style.gapLeft"
          need v-model="current_setting.langId" :value="item.locale" :label="item.name")

    dd(:tips="$t('view.setting.basic_sourcename_title')")
      h3 {{$t('view.setting.basic_sourcename')}}
      div
        material-checkbox(v-for="item in sourceNameTypes" :key="item.id" :class="$style.gapLeft" :id="`setting_abasic_sourcename_${item.id}`"
          name="setting_basic_sourcename" need v-model="current_setting.sourceNameType" :value="item.id" :label="item.label")

    dd
      h3 {{$t('view.setting.basic_control_btn_position')}}
      div
        material-checkbox(v-for="item in controlBtnPositionList" :key="item.id" :class="$style.gapLeft" :id="`setting_basic_control_btn_position_${item.id}`"
          name="setting_basic_control_btn_position" need v-model="current_setting.controlBtnPosition" :value="item.id" :label="item.name")

    dt {{$t('view.setting.play')}}
    dd(:tips="$t('view.setting.play_toggle_title')")
      h3 {{$t('view.setting.play_toggle')}}
      div
        material-checkbox(:id="`setting_player_togglePlay_${item.value}`" :class="$style.gapLeft" :value="item.value" :key="item.value"
            v-model="current_setting.player.togglePlayMethod" v-for="item in togglePlayMethods" :label="item.name")
    dd
      h3 {{$t('view.setting.play_lyric_transition')}}
      div
        material-checkbox(id="setting_player_lyric_transition" v-model="current_setting.player.isShowLyricTransition" :label="$t('view.setting.is_show')")
    dd(:tips="$t('view.setting.play_quality_title')")
      h3 {{$t('view.setting.play_quality')}}
      div
        material-checkbox(id="setting_player_highQuality" v-model="current_setting.player.highQuality" :label="$t('view.setting.is_enable')")
    dd(:tips="$t('view.setting.play_task_bar_title')")
      h3 {{$t('view.setting.play_task_bar')}}
      div
        material-checkbox(id="setting_player_showTaskProgess" v-model="current_setting.player.isShowTaskProgess" :label="$t('view.setting.is_enable')")
    dd(:tips="$t('view.setting.play_mediaDevice_remove_stop_play_title')")
      h3 {{$t('view.setting.play_mediaDevice_remove_stop_play')}}
      div
        material-checkbox(id="setting_player_isMediaDeviceRemovedStopPlay" v-model="current_setting.player.isMediaDeviceRemovedStopPlay" :label="$t('view.setting.is_enable')")
    dd(:tips="$t('view.setting.play_mediaDevice_title')")
      h3 {{$t('view.setting.play_mediaDevice')}}
      div
        material-selection(:list="mediaDevices" :class="$style.gapLeft" v-model="current_setting.player.mediaDeviceId" item-key="deviceId" item-name="label")
    dt {{$t('view.setting.desktop_lyric')}}
    dd
      div(:class="$style.gapTop")
        material-checkbox(id="setting_desktop_lyric_enable" v-model="current_setting.desktopLyric.enable" :label="$t('view.setting.desktop_lyric_enable')")
      div(:class="$style.gapTop")
        material-checkbox(id="setting_desktop_lyric_lock" v-model="current_setting.desktopLyric.isLock" :label="$t('view.setting.desktop_lyric_lock')")
      div(:class="$style.gapTop")
        material-checkbox(id="setting_desktop_lyric_alwaysOnTop" v-model="current_setting.desktopLyric.isAlwaysOnTop" :label="$t('view.setting.desktop_lyric_always_on_top')")
      div(:class="$style.gapTop")
        material-checkbox(id="setting_desktop_lyric_lockScreen" v-model="current_setting.desktopLyric.isLockScreen" :label="$t('view.setting.desktop_lyric_lock_screen')")
    dt {{$t('view.setting.search')}}
    dd(:tips="$t('view.setting.search_hot_title')")
      h3 {{$t('view.setting.search_hot')}}
      div
        material-checkbox(id="setting_search_showHot_enable" v-model="current_setting.search.isShowHotSearch" :label="$t('view.setting.is_show')")
    dd(:tips="$t('view.setting.search_history_title')")
      h3 {{$t('view.setting.search_history')}}
      div
        material-checkbox(id="setting_search_showHistory_enable" v-model="current_setting.search.isShowHistorySearch" :label="$t('view.setting.is_show')")
    dd(:tips="$t('view.setting.search_focus_search_box_title')")
      h3 {{$t('view.setting.search_focus_search_box')}}
      div
        material-checkbox(id="setting_search_focusSearchBox_enable" v-model="current_setting.search.isFocusSearchBox" :label="$t('view.setting.is_enable')")

    dt {{$t('view.setting.list')}}
    dd(:tips="$t('view.setting.list_source_title')")
      h3 {{$t('view.setting.list_source')}}
      div
        material-checkbox(id="setting_list_showSource_enable" v-model="current_setting.list.isShowSource" :label="$t('view.setting.is_show')")
    dd(:tips="$t('view.setting.list_scroll_title')")
      h3 {{$t('view.setting.list_scroll')}}
      div
        material-checkbox(id="setting_list_scroll_enable" v-model="current_setting.list.isSaveScrollLocation" :label="$t('view.setting.is_enable')")
    //- dd(:tips="播放列表是否显示专辑栏")
      h3 专辑栏
      div
        material-checkbox(id="setting_list_showalbum" v-model="current_setting.list.isShowAlbumName" label="是否显示专辑栏")
    dt {{$t('view.setting.download')}}
    dd
      material-checkbox(id="setting_download_enable" v-model="current_setting.download.enable" :label="$t('view.setting.download_enable')")
    dd(:tips="$t('view.setting.download_path_title')")
      h3 {{$t('view.setting.download_path')}}
      div
        p
          | {{$t('view.setting.download_path_label')}}
          span.auto-hidden.hover(:tips="$t('view.setting.download_path_open_label')" :class="$style.savePath" @click="handleOpenDir(current_setting.download.savePath)") {{current_setting.download.savePath}}
        p
          material-btn(:class="$style.btn" min @click="handleChangeSavePath") {{$t('view.setting.download_path_change_btn')}}
    dd(:tips="$t('view.setting.download_name_title')")
      h3 {{$t('view.setting.download_name')}}
      div
        material-checkbox(:id="`setting_download_musicName_${item.value}`" :class="$style.gapLeft" name="setting_download_musicName" :value="item.value" :key="item.value" need
            v-model="current_setting.download.fileName" v-for="item in musicNames" :label="item.name")
    dd
      h3 {{$t('view.setting.download_data_embed')}}
      div(:class="$style.gapTop")
        material-checkbox(id="setting_download_isEmbedPic" v-model="current_setting.download.isEmbedPic" :label="$t('view.setting.download_embed_pic')")
      div(:class="$style.gapTop")
        material-checkbox(id="setting_download_isEmbedLyric" v-model="current_setting.download.isEmbedLyric" :label="$t('view.setting.download_embed_lyric')")
    dd(:tips="$t('view.setting.download_lyric_title')")
      h3 {{$t('view.setting.download_lyric')}}
      div
        material-checkbox(id="setting_download_isDownloadLrc" v-model="current_setting.download.isDownloadLrc" :label="$t('view.setting.is_enable')")

    dt {{$t('view.setting.hot_key')}}
    dd
      h3 {{$t('view.setting.hot_key_local_title')}}
      div
        material-checkbox(id="setting_download_hotKeyLocal" v-model="current_hot_key.local.enable" :label="$t('view.setting.is_enable')" @change="handleHotKeySaveConfig")
      div(:class="$style.hotKeyContainer" :style="{ opacity: current_hot_key.local.enable ? 1 : .6 }")
        div(:class="$style.hotKeyItem" v-for="item in hotKeys.local")
          h4(:class="$style.hotKeyItemTitle") {{$t('view.setting.hot_key_' + item.name)}}
          material-input.key-bind(:class="$style.hotKeyItemInput" readonly @keyup.prevent :placeholder="$t('view.setting.hot_key_unset_input')"
            :value="hotKeyConfig.local[item.name] && formatHotKeyName(hotKeyConfig.local[item.name].key)"
            @focus="handleHotKeyFocus($event, item, 'local')"
            @blur="handleHotKeyBlur($event, item, 'local')")

      h3 {{$t('view.setting.hot_key_global_title')}}
      div
        material-checkbox(id="setting_download_hotKeyGlobal" v-model="current_hot_key.global.enable" :label="$t('view.setting.is_enable')" @change="handleEnableHotKey")
      div(:class="$style.hotKeyContainer" :style="{ opacity: current_hot_key.global.enable ? 1 : .6 }")
        div(:class="$style.hotKeyItem" v-for="item in hotKeys.global")
          h4(:class="$style.hotKeyItemTitle") {{$t('view.setting.hot_key_' + item.name)}}
          material-input.key-bind(:class="[$style.hotKeyItemInput, hotKeyConfig.global[item.name] && hotKeyStatus[hotKeyConfig.global[item.name].key] && hotKeyStatus[hotKeyConfig.global[item.name].key].status === false ? $style.hotKeyFailed : null]"
            :value="hotKeyConfig.global[item.name] && formatHotKeyName(hotKeyConfig.global[item.name].key)" @input.prevent readonly :placeholder="$t('view.setting.hot_key_unset_input')"
            @focus="handleHotKeyFocus($event, item, 'global')"
            @blur="handleHotKeyBlur($event, item, 'global')")

    dt {{$t('view.setting.network')}}
    dd
      h3 {{$t('view.setting.network_proxy_title')}}
      div
        p
          material-checkbox(id="setting_network_proxy_enable" v-model="current_setting.network.proxy.enable" @change="handleProxyChange('enable')" :label="$t('view.setting.is_enable')")
        p
          material-input(:class="$style.gapLeft" v-model="current_setting.network.proxy.host" @change="handleProxyChange('host')" :placeholder="$t('view.setting.network_proxy_host')")
          material-input(:class="$style.gapLeft" v-model="current_setting.network.proxy.port" @change="handleProxyChange('port')" :placeholder="$t('view.setting.network_proxy_port')")
        p
          material-input(:class="$style.gapLeft" v-model="current_setting.network.proxy.username" @change="handleProxyChange('username')" :placeholder="$t('view.setting.network_proxy_username')")
          material-input(:class="$style.gapLeft" v-model="current_setting.network.proxy.password" @change="handleProxyChange('password')" type="password" :placeholder="$t('view.setting.network_proxy_password')")
    dt {{$t('view.setting.odc')}}
    dd
      h3 {{$t('view.setting.odc_clear_search_input')}}
      div
        material-checkbox(id="setting_odc_isAutoClearSearchInput" v-model="current_setting.odc.isAutoClearSearchInput" :label="$t('view.setting.is_enable')")
    dd
      h3 {{$t('view.setting.odc_clear_search_list')}}
      div
        material-checkbox(id="setting_odc_isAutoClearSearchList" v-model="current_setting.odc.isAutoClearSearchList" :label="$t('view.setting.is_enable')")
    dt {{$t('view.setting.backup')}}
    dd
      h3 {{$t('view.setting.backup_part')}}
      div
        material-btn(:class="[$style.btn, $style.gapLeft]" min @click="handleImportPlayList") {{$t('view.setting.backup_part_import_list')}}
        material-btn(:class="[$style.btn, $style.gapLeft]" min @click="handleExportPlayList") {{$t('view.setting.backup_part_export_list')}}
        material-btn(:class="[$style.btn, $style.gapLeft]" min @click="handleImportSetting") {{$t('view.setting.backup_part_import_setting')}}
        material-btn(:class="[$style.btn, $style.gapLeft]" min @click="handleExportSetting") {{$t('view.setting.backup_part_export_setting')}}
    dd
      h3 {{$t('view.setting.backup_all')}}
      div
        material-btn(:class="[$style.btn, $style.gapLeft]" min @click="handleImportAllData") {{$t('view.setting.backup_all_import')}}
        material-btn(:class="[$style.btn, $style.gapLeft]" min @click="handleExportAllData") {{$t('view.setting.backup_all_export')}}
    dt {{$t('view.setting.other')}}
    dd
      h3 {{$t('view.setting.other_tray_theme')}}
      div
        material-checkbox(:id="'setting_tray_theme_' + item.id" v-model="current_setting.tray.themeId" name="setting_tray_theme" need :class="$style.gapLeft"
          :label="$t('view.setting.other_tray_theme_' + item.name)" :key="item.id" :value="item.id" v-for="item in trayThemeList")
    dd
      h3 {{$t('view.setting.other_cache')}}
      div
        p
          | {{$t('view.setting.other_cache_label')}}
          span.auto-hidden(:tips="$t('view.setting.other_cache_label_title')") {{cacheSize}}
        p
          material-btn(:class="$style.btn" min @click="clearCache") {{$t('view.setting.other_cache_clear_btn')}}
    dt {{$t('view.setting.update')}}
    dd
      p.small
        | {{$t('view.setting.update_latest_label')}}{{version.newVersion ? version.newVersion.version : $t('view.setting.update_unknown')}}
      p.small {{$t('view.setting.update_current_label')}}{{version.version}}
      p.small(v-if="this.version.downloadProgress" style="line-height: 1.5;")
        | {{$t('view.setting.update_downloading')}}
        br
        | {{$t('view.setting.update_progress')}}{{downloadProgress}}
      p(v-if="version.newVersion")
        span(v-if="version.isLatestVer") {{$t('view.setting.update_latest')}}
        material-btn(v-else :class="[$style.btn, $style.gapLeft]" min @click="showUpdateModal") {{$t('view.setting.update_open_version_modal_btn')}}
      p.small(v-else) {{$t('view.setting.update_checking')}}
    dt {{$t('view.setting.about')}}
    dd
      p.small
        | 本软件是基于洛雪音乐助手进行修改的 
        strong 五音版
        |&nbsp;, 此版本主要为五音助手APP用户制作，后续会跟进原版迭代更新，感谢五音助手用户的支持！
      p.small
        | 五音助手最新版本发布地址（包含Android、Windows、MAC、Linux版）：&nbsp;
        span.hover.underline(:tips="$t('view.setting.click_open')" @click="handleOpenUrl('https://www.sixyin.com/42.html')") 点我前往下载
      br
      p.small
        | 软件的常见问题可转至洛雪音乐助手常见问题：&nbsp;
        span.hover.underline(:tips="$t('view.setting.click_open')" @click="handleOpenUrl('https://github.com/lyswhut/lx-music-desktop/blob/master/FAQ.md')") 常见问题
      p.small
        strong 仔细 仔细 仔细&nbsp;
        | 地阅读常见问题后，
      p.small
        | 仍有问题可加五音不全QQ群&nbsp;
        span.hover(:tips="$t('view.setting.click_open')" @click="handleOpenUrl('https://jq.qq.com/?_wv=1027&k=0NGcjsSt')") 604939182
        | &nbsp;反馈

      p.small
        | 你已签署本软件的&nbsp;
        material-btn(min @click="handleShowPact") 许可协议 
        |。
      br

      p
        small Made By：
        | 落雪无痕
      p
        small Modify By：
        | 六音
      
      p.small
        | 原版洛雪音乐助手开源地址：
        span.hover.underline(:tips="$t('view.setting.click_open')" @click="handleOpenUrl('https://github.com/lyswhut/lx-music-desktop#readme')") https://github.com/lyswhut/lx-music-desktop
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import {
  openDirInExplorer,
  selectDir,
  openSaveDir,
  openUrl,
  clipboardWriteText,
  getCacheSize,
  clearCache,
  sizeFormate,
  setWindowSize,
} from '../utils'
import { rendererSend, rendererInvoke, NAMES } from '../../common/ipc'
import { mergeSetting, isMac } from '../../common/utils'
import apiSourceInfo from '../utils/music/api-source-info'
import fs from 'fs'
import languageList from '@/lang/languages.json'
import { base as eventBaseName } from '../event/names'
import * as hotKeys from '../../common/hotKey'
import { mainWindow as eventsNameMainWindow, winLyric as eventsNameWinLyric } from '../../main/events/_name'
import { gzip, gunzip } from 'zlib'

let hotKeyTargetInput
let newHotKey

export default {
  name: 'Setting',
  computed: {
    ...mapGetters(['setting', 'settingVersion', 'themes', 'version', 'windowSizeList']),
    ...mapGetters('list', ['defaultList', 'loveList', 'userList']),
    isShowRebootBtn() {
      return this.current_setting.windowSizeId != window.currentWindowSizeId
    },
    downloadProgress() {
      return this.version.downloadProgress
        ? `${this.version.downloadProgress.percent.toFixed(2)}% - ${sizeFormate(this.version.downloadProgress.transferred)}/${sizeFormate(this.version.downloadProgress.total)} - ${sizeFormate(this.version.downloadProgress.bytesPerSecond)}/s`
        : this.$t('view.setting.update_init')
    },
    togglePlayMethods() {
      return [
        {
          name: this.$t('view.setting.play_toggle_list_loop'),
          value: 'listLoop',
        },
        {
          name: this.$t('view.setting.play_toggle_random'),
          value: 'random',
        },
        {
          name: this.$t('view.setting.play_toggle_list'),
          value: 'list',
        },
        {
          name: this.$t('view.setting.play_toggle_single_loop'),
          value: 'singleLoop',
        },
      ]
    },
    apiSources() {
      return apiSourceInfo.map(api => ({
        id: api.id,
        label: this.$t('view.setting.basic_source_' + api.id) || api.name,
        disabled: api.disabled,
      }))
    },
    sourceNameTypes() {
      return [
        {
          id: 'real',
          label: this.$t('view.setting.basic_sourcename_real'),
        },
        {
          id: 'alias',
          label: this.$t('view.setting.basic_sourcename_alias'),
        },
      ]
    },
    musicNames() {
      return [
        {
          name: this.$t('view.setting.download_name1'),
          value: '歌名 - 歌手',
        },
        {
          name: this.$t('view.setting.download_name2'),
          value: '歌手 - 歌名',
        },
        {
          name: this.$t('view.setting.download_name3'),
          value: '歌名',
        },
      ]
    },
    controlBtnPositionList() {
      return [
        {
          name: this.$t('view.setting.basic_control_btn_position_left'),
          id: 'left',
        },
        {
          name: this.$t('view.setting.basic_control_btn_position_right'),
          id: 'right',
        },
      ]
    },
    trayThemeList() {
      return [
        {
          id: 0,
          name: 'native',
        },
        {
          id: 1,
          name: 'origin',
        },
      ]
    },
  },
  data() {
    return {
      current_setting: {
        player: {
          togglePlayMethod: 'random',
          highQuality: false,
          isShowTaskProgess: true,
          volume: 1,
          mediaDeviceId: 'default',
          isMediaDeviceRemovedStopPlay: false,
        },
        desktopLyric: {
          enable: false,
          isLock: false,
          width: 600,
          height: 700,
          x: -1,
          y: -1,
          theme: '',
          style: {
            fontSize: 125,
            opacity: 80,
            isZoomActiveLrc: true,
          },
        },
        list: {
          isShowAlbumName: true,
          isShowSource: true,
          isSaveScrollLocation: true,
        },
        search: {
          searchSource: 'kw',
          tempSearchSource: 'kw',
          isShowHotSearch: false,
          isShowHistorySearch: false,
          isFocusSearchBox: false,
        },
        download: {
          enable: false,
          savePath: '',
          fileName: '歌名 - 歌手',
          isDownloadLrc: false,
          isEmbedPic: true,
          isEmbedLyric: true,
        },
        network: {
          proxy: {
            enable: false,
            host: '',
            port: '',
            username: '',
            password: '',
          },
        },
        odc: {
          isAutoClearSearchInput: false,
          isAutoClearSearchList: false,
        },
        tray: {
          isShow: false,
          isToTray: false,
          themeId: 0,
        },
        windowSizeId: 1,
        langId: 'cns',
        themeId: 0,
        sourceId: 0,
        isShowAnimation: true,
        randomAnimate: true,
        isAgreePact: false,
        controlBtnPosition: 'left',
        apiSource: 'temp',
      },
      current_hot_key: {
        local: {
          enable: false,
          keys: {},
        },
        global: {
          enable: false,
          keys: {},
        },
      },
      languageList,
      cacheSize: '0 B',
      mediaDevices: [],
      hotKeys: {
        local: [
          {
            name: hotKeys.player.toggle_play.name,
            action: hotKeys.player.toggle_play.action,
            type: eventsNameMainWindow.name,
          },
          {
            name: hotKeys.player.prev.name,
            action: hotKeys.player.prev.action,
            type: eventsNameMainWindow.name,
          },
          {
            name: hotKeys.player.next.name,
            action: hotKeys.player.next.action,
            type: eventsNameMainWindow.name,
          },
          {
            name: hotKeys.common.focusSearchInput.name,
            action: hotKeys.common.focusSearchInput.action,
            type: eventsNameMainWindow.name,
          },
          {
            name: hotKeys.common.min.name,
            action: hotKeys.common.min.action,
            type: eventsNameMainWindow.name,
          },
          {
            name: hotKeys.common.close.name,
            action: hotKeys.common.close.action,
            type: eventsNameMainWindow.name,
          },
        ],
        global: [
          {
            name: hotKeys.common.min_toggle.name,
            action: hotKeys.common.min_toggle.action,
            type: eventsNameMainWindow.name,
          },
          {
            name: hotKeys.common.hide_toggle.name,
            action: hotKeys.common.hide_toggle.action,
            type: eventsNameMainWindow.name,
          },
          {
            name: hotKeys.common.close.name,
            action: hotKeys.common.close.action,
            type: eventsNameMainWindow.name,
          },
          {
            name: hotKeys.player.toggle_play.name,
            action: hotKeys.player.toggle_play.action,
            type: eventsNameMainWindow.name,
          },
          {
            name: hotKeys.player.prev.name,
            action: hotKeys.player.prev.action,
            type: eventsNameMainWindow.name,
          },
          {
            name: hotKeys.player.next.name,
            action: hotKeys.player.next.action,
            type: eventsNameMainWindow.name,
          },
          {
            name: hotKeys.player.volume_up.name,
            action: hotKeys.player.volume_up.action,
            type: eventsNameMainWindow.name,
          },
          {
            name: hotKeys.player.volume_down.name,
            action: hotKeys.player.volume_down.action,
            type: eventsNameMainWindow.name,
          },
          {
            name: hotKeys.player.volume_mute.name,
            action: hotKeys.player.volume_mute.action,
            type: eventsNameMainWindow.name,
          },
          {
            name: hotKeys.desktop_lyric.toggle_visible.name,
            action: hotKeys.desktop_lyric.toggle_visible.action,
            type: eventsNameWinLyric.name,
          },
          {
            name: hotKeys.desktop_lyric.toggle_lock.name,
            action: hotKeys.desktop_lyric.toggle_lock.action,
            type: eventsNameWinLyric.name,
          },
          {
            name: hotKeys.desktop_lyric.toggle_always_top.name,
            action: hotKeys.desktop_lyric.toggle_always_top.action,
            type: eventsNameWinLyric.name,
          },
        ],
      },
      hotKeyConfig: {
        local: {},
        global: {},
      },
      hotKeyStatus: {

      },
      isEditHotKey: false,
    }
  },
  watch: {
    current_setting: {
      handler(n, o) {
        if (!this.settingVersion) return
        if (JSON.stringify(this.setting) === JSON.stringify(n)) return
        this.setSetting(JSON.parse(JSON.stringify(n)))
      },
      deep: true,
    },
    'setting.isAgreePact'(n) {
      this.current_setting.isAgreePact = n
    },
    'setting.player.mediaDeviceId'(n) {
      this.current_setting.player.mediaDeviceId = n
    },
    'setting.player.isMute'(n) {
      this.current_setting.player.isMute = n
    },
    'setting.desktopLyric.enable'(n) {
      this.current_setting.desktopLyric.enable = n
    },
    'setting.desktopLyric.isLock'(n) {
      this.current_setting.desktopLyric.isLock = n
    },
    'setting.player.togglePlayMethod'(n) {
      this.current_setting.player.togglePlayMethod = n
    },
    'current_setting.player.isShowTaskProgess'(n) {
      if (n) return
      this.$nextTick(() => {
        rendererSend(NAMES.mainWindow.progress, {
          status: -1,
          mode: 'normal',
        })
      })
    },
  },
  mounted() {
    navigator.mediaDevices.addEventListener('devicechange', this.getMediaDevice)
    window.eventHub.$on(eventBaseName.set_config, this.handleUpdateSetting)
    window.eventHub.$on(eventBaseName.key_down, this.handleKeyDown)
    window.eventHub.$on(eventBaseName.set_hot_key_config, this.handleUpdateHotKeyConfig)
    this.init()
  },
  beforeDestroy() {
    navigator.mediaDevices.removeEventListener('devicechange', this.getMediaDevice)
    window.eventHub.$off(eventBaseName.set_config, this.handleUpdateSetting)
    window.eventHub.$off(eventBaseName.key_down, this.handleKeyDown)
    window.eventHub.$off(eventBaseName.set_hot_key_config, this.handleUpdateHotKeyConfig)
  },
  methods: {
    ...mapMutations(['setSetting', 'setSettingVersion', 'setVersionModalVisible']),
    ...mapMutations('list', ['setList']),
    ...mapMutations(['setMediaDeviceId']),
    init() {
      this.current_setting = JSON.parse(JSON.stringify(this.setting))
      if (!window.currentWindowSizeId) window.currentWindowSizeId = this.setting.windowSizeId
      this.getCacheSize()
      this.getMediaDevice()
      this.current_hot_key = window.appHotKeyConfig
      this.initHotKeyConfig()
      this.getHotKeyStatus()
    },
    handleChangeSavePath() {
      selectDir({
        title: this.$t('view.setting.download_select_save_path'),
        defaultPath: this.current_setting.download.savePath,
        properties: ['openDirectory'],
      }).then(result => {
        if (result.canceled) return
        this.current_setting.download.savePath = result.filePaths[0]
      })
    },
    handleOpenDir(dir) {
      openDirInExplorer(dir)
    },
    async importSetting(path) {
      let settingData
      try {
        settingData = JSON.parse(await this.handleReadFile(path))
      } catch (error) {
        return
      }
      if (settingData.type !== 'setting') return
      const { version: settingVersion, setting } = mergeSetting(settingData.data)
      setting.isAgreePact = false
      this.refreshSetting(setting, settingVersion)
    },
    exportSetting(path) {
      console.log(path)
      const data = {
        type: 'setting',
        data: Object.assign({ version: this.settingVersion }, this.setting),
      }
      this.handleSaveFile(path, JSON.stringify(data))
    },
    async importPlayList(path) {
      let listData
      try {
        listData = JSON.parse(await this.handleReadFile(path))
      } catch (error) {
        return
      }
      console.log(listData.type)

      // 兼容0.6.2及以前版本的列表数据
      if (listData.type === 'defautlList') return this.setList({ id: 'default', list: listData.data.list, name: '试听列表', location: 0 })

      if (listData.type !== 'playList') return

      for (const list of listData.data) {
        if (list.location == null) list.location = 0
        this.setList(list)
      }
    },
    exportPlayList(path) {
      const data = {
        type: 'playList',
        data: [
          this.defaultList,
          this.loveList,
          ...this.userList,
        ],
      }
      this.handleSaveFile(path, JSON.stringify(data))
    },
    async importAllData(path) {
      let allData
      try {
        allData = JSON.parse(await this.handleReadFile(path))
      } catch (error) {
        return
      }
      if (allData.type !== 'allData') return
      const { version: settingVersion, setting } = mergeSetting(allData.setting)
      setting.isAgreePact = false
      this.refreshSetting(setting, settingVersion)

      // 兼容0.6.2及以前版本的列表数据
      if (allData.defaultList) return this.setList({ id: 'default', list: allData.defaultList.list, name: '试听列表', location: 0 })

      for (const list of allData.playList) {
        if (list.location == null) list.location = 0
        this.setList(list)
      }
    },
    async exportAllData(path) {
      let allData = {
        type: 'allData',
        setting: Object.assign({ version: this.settingVersion }, this.setting),
        playList: [
          this.defaultList,
          this.loveList,
          ...this.userList,
        ],
      }
      this.handleSaveFile(path, JSON.stringify(allData))
    },
    handleImportAllData() {
      selectDir({
        title: this.$t('view.setting.backup_all_import_desc'),
        properties: ['openFile'],
        filters: [
          { name: 'Setting', extensions: ['json', 'lxmc'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      }).then(result => {
        if (result.canceled) return
        this.importAllData(result.filePaths[0])
      })
    },
    handleExportAllData() {
      openSaveDir({
        title: this.$t('view.setting.backup_all_export_desc'),
        defaultPath: 'lx_datas.lxmc',
      }).then(result => {
        if (result.canceled) return
        this.exportAllData(result.filePath)
      })
    },
    handleImportSetting() {
      selectDir({
        title: this.$t('view.setting.backup_part_import_setting_desc'),
        properties: ['openFile'],
        filters: [
          { name: 'Setting', extensions: ['json', 'lxmc'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      }).then(result => {
        if (result.canceled) return
        this.importSetting(result.filePaths[0])
      })
    },
    handleExportSetting() {
      openSaveDir({
        title: this.$t('view.setting.backup_part_export_setting_desc'),
        defaultPath: 'lx_setting.lxmc',
      }).then(result => {
        if (result.canceled) return
        this.exportSetting(result.filePath)
      })
    },
    handleImportPlayList() {
      selectDir({
        title: this.$t('view.setting.backup_part_import_list_desc'),
        properties: ['openFile'],
        filters: [
          { name: 'Play List', extensions: ['json', 'lxmc'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      }).then(result => {
        if (result.canceled) return
        this.importPlayList(result.filePaths[0])
      })
    },
    handleExportPlayList() {
      openSaveDir({
        title: this.$t('view.setting.backup_part_export_list_desc'),
        defaultPath: 'lx_list.lxmc',
      }).then(result => {
        if (result.canceled) return
        this.exportPlayList(result.filePath)
      })
    },
    handleOpenUrl(url) {
      openUrl(url)
    },
    handleAPISourceChange(id) {
      this.$nextTick(() => {
        window.globalObj.apiSource = id
      })
    },
    showUpdateModal() {
      this.setVersionModalVisible({ isShow: true })
    },
    clipboardWriteText(text) {
      clipboardWriteText(text)
    },
    handleProxyChange(key) {
      window.globalObj.proxy[key] = this.current_setting.network.proxy[key]
    },
    getCacheSize() {
      getCacheSize().then(size => {
        this.cacheSize = sizeFormate(size)
      })
    },
    clearCache() {
      clearCache().then(() => {
        this.getCacheSize()
      })
    },
    handleWindowSizeChange(index) {
      let info = index == null ? this.windowSizeList[2] : this.windowSizeList[index]
      setWindowSize(info.width, info.height)
    },
    refreshSetting(setting, version) {
      this.setSetting(setting)
      this.setSettingVersion(version)
      if (setting.windowSizeId != null) this.handleWindowSizeChange(null, setting.windowSizeId)
      for (let key of Object.keys(setting.network.proxy)) {
        window.globalObj.proxy[key] = setting.network.proxy[key]
      }
      this.init()
      this.handleLangChange(this.current_setting.langId)
    },
    handleLangChange(id) {
      this.$i18n.locale = id
    },
    async getMediaDevice() {
      const devices = await navigator.mediaDevices.enumerateDevices()
      let audioDevices = devices.filter(device => device.kind === 'audiooutput')
      this.mediaDevices = audioDevices
      // console.log(this.mediaDevices)
    },
    handleShowPact() {
      window.globalObj.isShowPact = true
    },
    handleUpdateSetting(config) {
      this.current_setting = JSON.parse(JSON.stringify(config))
    },
    initHotKeyConfig() {
      let config = {}
      for (const type of Object.keys(this.current_hot_key)) {
        let typeInfo = this.current_hot_key[type]
        let configInfo = config[type] = {}
        for (const key of Object.keys(typeInfo.keys)) {
          let info = typeInfo.keys[key]
          if (info.name == null) continue
          configInfo[info.name] = {
            key,
            info,
          }
        }
      }
      this.hotKeyConfig = config
    },
    async handleHotKeyFocus(event, info, type) {
      await rendererInvoke(NAMES.hotKey.enable, false)
      window.isEditingHotKey = true
      this.isEditHotKey = true
      let config = this.hotKeyConfig[type][info.name]
      newHotKey = config && config.key
      hotKeyTargetInput = event.target
      event.target.value = this.$t('view.setting.hot_key_tip_input')
    },
    async handleHotKeyBlur(event, info, type) {
      await rendererInvoke(NAMES.hotKey.enable, true)
      window.isEditingHotKey = false
      this.isEditHotKey = false
      hotKeyTargetInput = null
      let config = this.hotKeyConfig[type][info.name]
      let originKey
      if (newHotKey) {
        if (type == 'global' && newHotKey && this.current_hot_key.global.enable) {
          try {
            await rendererInvoke(NAMES.hotKey.set_config, {
              action: 'register',
              data: {
                key: newHotKey,
                info,
              },
            })
          } catch (error) {
            console.log(error)
            return
          }
        }
      }
      if (config) {
        if (config.key == newHotKey) return
        originKey = config.key
        delete this.current_hot_key[type].keys[config.key]
      } else if (!newHotKey) return

      if (newHotKey) {
        for (const tempType of Object.keys(this.current_hot_key)) {
          if (tempType == type) continue
          config = this.current_hot_key[tempType].keys[newHotKey]
          if (config) {
            console.log(newHotKey, info, config, info.name, config.name)
            delete this.current_hot_key[tempType].keys[newHotKey]
            break
          }
        }
        this.current_hot_key[type].keys[newHotKey] = info
      }

      this.initHotKeyConfig()
      // console.log(this.current_hot_key.global.keys)
      if (originKey && this.current_hot_key.global.enable) {
        try {
          await rendererInvoke(NAMES.hotKey.set_config, {
            action: 'unregister',
            data: originKey,
          })
        } catch (error) {
          console.log(error)
        }
      }
      await this.handleHotKeySaveConfig()
      await this.getHotKeyStatus()
    },
    formatHotKeyName(name) {
      if (name.includes('arrow')) {
        name = name.replace(/arrow(left|right|up|down)/, s => {
          switch (s) {
            case 'arrowleft': return '←'
            case 'arrowright': return '→'
            case 'arrowup': return '↑'
            case 'arrowdown': return '↓'
          }
        })
      }
      if (name.includes('mod')) name = name.replace('mod', isMac ? 'Command' : 'Ctrl')
      name = name.replace(/(\+|^)[a-z]/g, l => l.toUpperCase())
      if (name.length > 1) name = name.replace(/\+/g, ' + ')
      return name
    },
    handleKeyDown({ event, keys, key, type }) {
      // if (!event || event.repeat) return
      if (!event || event.repeat || type == 'up' || !this.isEditHotKey) return
      event.preventDefault()
      // console.log(event, key)
      switch (key) {
        case 'delete':
        case 'backspace':
          key = ''
          break
      }
      hotKeyTargetInput.value = this.formatHotKeyName(key)
      // console.log(keys, key, type)
      newHotKey = key
    },
    handleUpdateHotKeyConfig(config) {
      // console.log(config)
      for (const type of Object.keys(config)) {
        this.current_hot_key[type] = config[type]
      }
    },
    async handleHotKeySaveConfig() {
      // console.log(this.current_hot_key)
      window.appHotKeyConfig = this.current_hot_key
      await rendererInvoke(NAMES.hotKey.set_config, {
        action: 'config',
        data: this.current_hot_key,
        source: eventsNameMainWindow.name,
      })
    },
    async handleEnableHotKey() {
      await rendererInvoke(NAMES.hotKey.set_config, {
        action: 'enable',
        data: this.current_hot_key.global.enable,
        source: eventsNameMainWindow.name,
      })
      await this.handleHotKeySaveConfig()
      await this.getHotKeyStatus()
    },
    getHotKeyStatus() {
      return rendererInvoke(NAMES.hotKey.status).then(status => {
        // console.log(status)
        this.hotKeyStatus = status
        return status
      })
    },
    handleTrayShowChange(isShow) {
      this.current_setting.tray.isToTray = isShow
    },
    async handleSaveFile(path, data) {
      if (!path.endsWith('.lxmc')) path += '.lxmc'
      fs.writeFile(path, await this.gzip(data), 'binary', err => {
        console.log(err)
      })
    },
    async handleReadFile(path) {
      let isJSON = path.endsWith('.json')
      let data = await fs.promises.readFile(path, isJSON ? 'utf8' : 'binary')
      if (!data || isJSON) return data
      data = await this.gunzip(Buffer.from(data, 'binary'))
      return data.toString('utf8')
    },
    gzip(str) {
      return new Promise((resolve, reject) => {
        gzip(str, (err, result) => {
          if (err) return reject(err)
          resolve(result)
        })
      })
    },
    gunzip(buf) {
      return new Promise((resolve, reject) => {
        gunzip(buf, (err, result) => {
          if (err) return reject(err)
          resolve(result.toString())
        })
      })
    },
  },
}
</script>

<style lang="less" module>
@import '../assets/styles/layout.less';

.setting {
  padding: 0 15px 30px 15px;
  font-size: 14px;
  box-sizing: border-box;
  overflow-y: auto;
  height: 100%;

  dt {
    border-left: 5px solid @color-theme;
    padding: 3px 7px;
    margin: 30px 0 15px;

    + dd h3 {
      margin-top: 0;
    }
  }

  dd {
    margin-left: 15px;
    // font-size: 13px;
    > div {
      padding: 0 15px;
    }

  }
  h3 {
    font-size: 12px;
    margin: 25px 0 15px;
  }
  p {
    padding: 3px 0;
    line-height: 1.3;
    .btn {
      + .btn {
        margin-left: 10px;
      }
    }
  }

}

.btn-content {
  display: inline-block;
  transition: @transition-theme;
  transition-property: opacity, transform;
  opacity: 1;
  transform: scale(1);

  &.hide {
    opacity: 0;
    transform: scale(0);
  }
}

.gap-left {
  + .gap-left {
    margin-left: 20px;
  }
}
.gap-top {
  + .gap-top {
    margin-top: 10px;
  }
}

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

.hotKeyContainer {
  display: flex;
  flex-flow: row wrap;
  // margin-top: -15px;
  margin-bottom: 15px;
  transition: opacity @transition-theme;
}
.hotKeyItem {
  width: 30%;
  padding-right: 35px;
  margin-top: 15px;
  box-sizing: border-box;
}
.hotKeyItemTitle {
  .mixin-ellipsis-1;
  padding-bottom: 5px;
  color: @color-theme_2-font-label;
  font-size: 12px;
}
.hotKeyItemInput {
  width: 100%;
  box-sizing: border-box;
  // font-family: monospace;
  &:focus {
    background-color: @color-theme_2-active;
    text-decoration: none;
  }
  &::placeholder {
    color: rgba(197, 197, 197, 0.7)!important;
  }
}
.hotKeyFailed {
  text-decoration: line-through;
}

.save-path {
  font-size: 12px;
}

.del-line {
  position: relative;
  &:before {
    display: block;
    height: 1px;
    position: absolute;
    width: 110%;
    content: ' ';
    left: 0;
    background-color: #000;
    transform: rotate(-24deg);
    transform-origin: 0;
    top: 83%;
    z-index: 1;
  }
  &:after {
    display: block;
    height: 1px;
    position: absolute;
    width: 110%;
    content: ' ';
    left: 0;
    background-color: #000;
    transform: rotate(23deg);
    transform-origin: 0px;
    top: 2px;
    z-index: 1;
  }
}

each(@themes, {
  :global(#container.@{value}) {
    .tbody {
      tr {
        &.active {
          color: ~'@{color-@{value}-theme}';
        }
      }
    }
    .setting {
      dt {
        border-left-color: ~'@{color-@{value}-theme}';
      }
    }

    .hotKeyItemTitle {
      color: ~'@{color-@{value}-theme_2-font-label}';
    }

    .theme {
      display: flex;
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
