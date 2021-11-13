<template lang="pug">
div(:class="$style.main")
  //- div.scroll(:class="$style.toc")
  //-   ul(:class="$style.tocList")
  //-     li(:class="$style.tocListItem" v-for="h2 in toc.list" :key="h2.id")
  //-       h2(:class="[$style.tocH2, toc.activeId == h2.id ? $style.active : null]" :tips="h2.title")
  //-         a(:href="'#' + h2.id" @click="toc.activeId = h2.id") {{h2.title}}
  //-       ul(:class="$style.tocList" v-if="h2.children.length")
  //-         li(:class="$style.tocSubListItem" v-for="h3 in h2.children" :key="h3.id")
  //-           h3(:class="[$style.tocH3, toc.activeId == h3.id ? $style.active : null]" :tips="h3.title")
  //-             a(:href="'#' + h3.id" @click="toc.activeId = h3.id") {{h3.title}}
  div.scroll(:class="$style.setting" ref="dom_setting")
    dl(ref="dom_setting_list")
      dt#basic {{$t('view.setting.basic')}}
      dd
        h3#basic_theme {{$t('view.setting.basic_theme')}}
        div
          ul(:class="$style.theme")
            li(v-for="theme in themes.list" :key="theme.id" :tips="$t('store.state.theme_' + theme.class)" @click="current_setting.themeId = theme.id" :class="[theme.class, themes.active == theme.id ? $style.active : '']")
              span
              label {{$t('store.state.theme_' + theme.class)}}

      dd
        div(:class="[$style.gapTop, $style.top]")
          material-checkbox(id="setting_show_animate" v-model="current_setting.isShowAnimation" :label="$t('view.setting.basic_show_animation')")
        div(:class="$style.gapTop")
          material-checkbox(id="setting_animate" v-model="current_setting.randomAnimate" :label="$t('view.setting.basic_animation')")
        div(:class="$style.gapTop")
          material-checkbox(id="setting_to_tray" v-model="current_setting.tray.isShow" @change="handleTrayShowChange" :label="$t('view.setting.basic_to_tray')")


      dd(:tips="$t('view.setting.basic_source_title')")
        h3#basic_source {{$t('view.setting.basic_source')}}
        div
          div(v-for="item in apiSources" :key="item.id" :class="$style.gapTop")
            material-checkbox(:id="`setting_api_source_${item.id}`" name="setting_api_source" @change="handleAPISourceChange(item.id)"
              need v-model="current_setting.apiSource" :disabled="item.disabled" :value="item.id" :label="item.label")
          p(:class="$style.gapTop")
            material-btn(:class="$style.btn" min @click="isShowUserApiModal = true") {{$t('view.setting.basic_source_user_api_btn')}}

      dd(:tips="$t('view.setting.basic_window_size_title')")
        h3#basic_window_size {{$t('view.setting.basic_window_size')}}
        div
          material-checkbox(v-for="(item, index) in windowSizeList" :id="`setting_window_size_${item.id}`" name="setting_window_size" @change="handleWindowSizeChange" :class="$style.gapLeft"
            need v-model="current_setting.windowSizeId" :value="item.id" :label="$t('view.setting.basic_window_size_' + item.name)" :key="item.id")

      dd(:tips="$t('view.setting.basic_lang_title')")
        h3#basic_lang {{$t('view.setting.basic_lang')}}
        div
          material-checkbox(v-for="item in languageList" :key="item.locale" :id="`setting_lang_${item.locale}`" name="setting_lang"
            @change="handleLangChange(item.locale)" :class="$style.gapLeft"
            need v-model="current_setting.langId" :value="item.locale" :label="item.name")

      dd(:tips="$t('view.setting.basic_sourcename_title')")
        h3#basic_sourcename {{$t('view.setting.basic_sourcename')}}
        div
          material-checkbox(v-for="item in sourceNameTypes" :key="item.id" :class="$style.gapLeft" :id="`setting_abasic_sourcename_${item.id}`"
            name="setting_basic_sourcename" need v-model="current_setting.sourceNameType" :value="item.id" :label="item.label")

      dd
        h3#basic_control_btn_position {{$t('view.setting.basic_control_btn_position')}}
        div
          material-checkbox(v-for="item in controlBtnPositionList" :key="item.id" :class="$style.gapLeft" :id="`setting_basic_control_btn_position_${item.id}`"
            name="setting_basic_control_btn_position" need v-model="current_setting.controlBtnPosition" :value="item.id" :label="item.name")

      dt#play {{$t('view.setting.play')}}
      dd
        div(:class="$style.gapTop")
          material-checkbox(id="setting_player_save_play_time" v-model="current_setting.player.isSavePlayTime" :label="$t('view.setting.play_save_play_time')")
        div(:class="$style.gapTop")
          material-checkbox(id="setting_player_lyric_transition" v-model="current_setting.player.isShowLyricTranslation" :label="$t('view.setting.play_lyric_transition')")
        div(:class="$style.gapTop")
          material-checkbox(id="setting_player_lyric_play_lxlrc" v-model="current_setting.player.isPlayLxlrc" :label="$t('view.setting.play_lyric_lxlrc')")
        div(:class="$style.gapTop")
          material-checkbox(id="setting_player_highQuality" v-model="current_setting.player.highQuality" :label="$t('view.setting.play_quality')")
        div(:class="$style.gapTop")
          material-checkbox(id="setting_player_showTaskProgess" v-model="current_setting.player.isShowTaskProgess" :label="$t('view.setting.play_task_bar')")
        div(:class="$style.gapTop")
          material-checkbox(id="setting_player_isMediaDeviceRemovedStopPlay" v-model="current_setting.player.isMediaDeviceRemovedStopPlay" :label="$t('view.setting.play_mediaDevice_remove_stop_play')")
      dd(:tips="$t('view.setting.play_mediaDevice_title')")
        h3#play_mediaDevice {{$t('view.setting.play_mediaDevice')}}
        div
          material-selection(:list="mediaDevices" :class="$style.gapLeft" v-model="current_setting.player.mediaDeviceId" item-key="deviceId" item-name="label")
      dt#desktop_lyric {{$t('view.setting.desktop_lyric')}}
      dd
        div(:class="$style.gapTop")
          material-checkbox(id="setting_desktop_lyric_enable" v-model="current_setting.desktopLyric.enable" :label="$t('view.setting.desktop_lyric_enable')")
        div(:class="$style.gapTop")
          material-checkbox(id="setting_desktop_lyric_lock" v-model="current_setting.desktopLyric.isLock" :label="$t('view.setting.desktop_lyric_lock')")
        div(:class="$style.gapTop")
          material-checkbox(id="setting_desktop_lyric_alwaysOnTop" v-model="current_setting.desktopLyric.isAlwaysOnTop" :label="$t('view.setting.desktop_lyric_always_on_top')")
        div(:class="$style.gapTop")
          material-checkbox(id="setting_desktop_lyric_lockScreen" v-model="current_setting.desktopLyric.isLockScreen" :label="$t('view.setting.desktop_lyric_lock_screen')")
      dd
        h3#desktop_lyric_font {{$t('view.setting.desktop_lyric_font')}}
        div
          material-selection(:list="fontList" :class="$style.gapLeft" v-model="current_setting.desktopLyric.style.font" item-key="id" item-name="label")

      dt#search {{$t('view.setting.search')}}
      dd
        div(:class="$style.gapTop")
          material-checkbox(id="setting_search_showHot_enable" v-model="current_setting.search.isShowHotSearch" :label="$t('view.setting.search_hot')")
        div(:class="$style.gapTop")
          material-checkbox(id="setting_search_showHistory_enable" v-model="current_setting.search.isShowHistorySearch" :label="$t('view.setting.search_history')")
        div(:class="$style.gapTop")
          material-checkbox(id="setting_search_focusSearchBox_enable" v-model="current_setting.search.isFocusSearchBox" :label="$t('view.setting.search_focus_search_box')")

      dt#list {{$t('view.setting.list')}}
      dd
        div(:class="$style.gapTop")
          material-checkbox(id="setting_list_showSource_enable" v-model="current_setting.list.isShowSource" :label="$t('view.setting.list_source')")
        div(:class="$style.gapTop")
          material-checkbox(id="setting_list_scroll_enable" v-model="current_setting.list.isSaveScrollLocation" :label="$t('view.setting.list_scroll')")
      dd(:tips="$t('view.setting.basic_sourcename_title')")
        h3#list_addMusicLocationType {{$t('view.setting.list_add_music_location_type')}}
        div
          material-checkbox(:class="$style.gapLeft" id="setting_list_add_music_location_type_top"
            name="setting_list_add_music_location_type" need v-model="current_setting.list.addMusicLocationType" value="top" :label="$t('view.setting.list_add_music_location_type_top')")
          material-checkbox(:class="$style.gapLeft" id="setting_list_add_music_location_type_bottom"
            name="setting_list_add_music_location_type" need v-model="current_setting.list.addMusicLocationType" value="bottom" :label="$t('view.setting.list_add_music_location_type_bottom')")
      //- dd(:tips="播放列表是否显示专辑栏")
        h3 专辑栏
        div
          material-checkbox(id="setting_list_showalbum" v-model="current_setting.list.isShowAlbumName" label="是否显示专辑栏")
      dt#download {{$t('view.setting.download')}}
      dd
        material-checkbox(id="setting_download_enable" v-model="current_setting.download.enable" :label="$t('view.setting.download_enable')")
      dd(:tips="$t('view.setting.download_path_title')")
        h3#download_path {{$t('view.setting.download_path')}}
        div
          p
            | {{$t('view.setting.download_path_label')}}
            span.auto-hidden.hover(:tips="$t('view.setting.download_path_open_label')" :class="$style.savePath" @click="handleOpenDir(current_setting.download.savePath)") {{current_setting.download.savePath}}
          p
            material-btn(:class="$style.btn" min @click="handleChangeSavePath") {{$t('view.setting.download_path_change_btn')}}
      dd
        h3#download_use_other_source {{$t('view.setting.download_use_other_source')}}
        div
          material-checkbox(id="setting_download_isUseOtherSource" v-model="current_setting.download.isUseOtherSource" :label="$t('view.setting.is_enable')")
        div
      dd(:tips="$t('view.setting.download_name_title')")
        h3#download_name {{$t('view.setting.download_name')}}
        div
          material-checkbox(:id="`setting_download_musicName_${item.value}`" :class="$style.gapLeft" name="setting_download_musicName" :value="item.value" :key="item.value" need
              v-model="current_setting.download.fileName" v-for="item in musicNames" :label="item.name")
      dd
        h3#download_data_embed {{$t('view.setting.download_data_embed')}}
        div(:class="$style.gapTop")
          material-checkbox(id="setting_download_isEmbedPic" v-model="current_setting.download.isEmbedPic" :label="$t('view.setting.download_embed_pic')")
        div(:class="$style.gapTop")
          material-checkbox(id="setting_download_isEmbedLyric" v-model="current_setting.download.isEmbedLyric" :label="$t('view.setting.download_embed_lyric')")
      dd(:tips="$t('view.setting.download_lyric_title')")
        h3#download_lyric {{$t('view.setting.download_lyric')}}
        div
          material-checkbox(id="setting_download_isDownloadLrc" v-model="current_setting.download.isDownloadLrc" :label="$t('view.setting.is_enable')")
      dd
        h3#download_lyric {{$t('view.setting.download_lyric_format')}}
        div
          material-checkbox(v-for="item in lrcFormatList" :key="item.id" :class="$style.gapLeft" :id="`setting_download_lrcFormat_${item.id}`"
            name="setting_download_lrcFormat" need v-model="current_setting.download.lrcFormat" :value="item.id" :label="item.name")

      dt#sync {{$t('view.setting.sync')}}
      dd
        material-checkbox(id="setting_sync_enable" v-model="current_setting.sync.enable" @change="handleSyncChange('enable')" :label="syncEnableTitle")
        div
          p.small {{$t('view.setting.sync_auth_code', { code: sync.status.code || '' })}}
          p.small {{$t('view.setting.sync_address', { address: sync.status.address.join(', ') || '' })}}
          p.small {{$t('view.setting.sync_device', { devices: syncDevices })}}
          p
            material-btn(:class="$style.btn" min :disabled="!sync.status.status" @click="handleRefreshSyncCode") {{$t('view.setting.sync_refresh_code')}}
      dd
        h3#sync_port {{$t('view.setting.sync_port')}}
        div
          p
            material-input(:class="$style.gapLeft" v-model.trim="current_setting.sync.port" @change="handleSyncChange('port')" :placeholder="$t('view.setting.sync_port_tip')")

      dt#hot_key {{$t('view.setting.hot_key')}}
      dd
        h3#hot_key_local_title {{$t('view.setting.hot_key_local_title')}}
        div
          material-checkbox(id="setting_download_hotKeyLocal" v-model="current_hot_key.local.enable" :label="$t('view.setting.is_enable')" @change="handleHotKeySaveConfig")
        div(:class="$style.hotKeyContainer" :style="{ opacity: current_hot_key.local.enable ? 1 : .6 }")
          div(:class="$style.hotKeyItem" v-for="item in hotKeys.local")
            h4(:class="$style.hotKeyItemTitle") {{$t('view.setting.hot_key_' + item.name)}}
            material-input.key-bind(:class="$style.hotKeyItemInput" readonly @keyup.prevent :placeholder="$t('view.setting.hot_key_unset_input')"
              :value="hotKeyConfig.local[item.name] && formatHotKeyName(hotKeyConfig.local[item.name].key)"
              @focus="handleHotKeyFocus($event, item, 'local')"
              @blur="handleHotKeyBlur($event, item, 'local')")

        h3#hot_key_global_title {{$t('view.setting.hot_key_global_title')}}
        div
          material-checkbox(id="setting_download_hotKeyGlobal" v-model="current_hot_key.global.enable" :label="$t('view.setting.is_enable')" @change="handleEnableHotKey")
        div(:class="$style.hotKeyContainer" :style="{ opacity: current_hot_key.global.enable ? 1 : .6 }")
          div(:class="$style.hotKeyItem" v-for="item in hotKeys.global")
            h4(:class="$style.hotKeyItemTitle") {{$t('view.setting.hot_key_' + item.name)}}
            material-input.key-bind(:class="[$style.hotKeyItemInput, hotKeyConfig.global[item.name] && hotKeyStatus[hotKeyConfig.global[item.name].key] && hotKeyStatus[hotKeyConfig.global[item.name].key].status === false ? $style.hotKeyFailed : null]"
              :value="hotKeyConfig.global[item.name] && formatHotKeyName(hotKeyConfig.global[item.name].key)" @input.prevent readonly :placeholder="$t('view.setting.hot_key_unset_input')"
              @focus="handleHotKeyFocus($event, item, 'global')"
              @blur="handleHotKeyBlur($event, item, 'global')")

      dt#network {{$t('view.setting.network')}}
      dd
        h3#network_proxy_title {{$t('view.setting.network_proxy_title')}}
        div
          p
            material-checkbox(id="setting_network_proxy_enable" v-model="current_setting.network.proxy.enable" @change="handleProxyChange('enable')" :label="$t('view.setting.is_enable')")
          p
            material-input(:class="$style.gapLeft" v-model.trim="current_setting.network.proxy.host" @change="handleProxyChange('host')" :placeholder="$t('view.setting.network_proxy_host')")
            material-input(:class="$style.gapLeft" v-model.trim="current_setting.network.proxy.port" @change="handleProxyChange('port')" :placeholder="$t('view.setting.network_proxy_port')")
          p
            material-input(:class="$style.gapLeft" v-model.trim="current_setting.network.proxy.username" @change="handleProxyChange('username')" :placeholder="$t('view.setting.network_proxy_username')")
            material-input(:class="$style.gapLeft" v-model.trim="current_setting.network.proxy.password" @change="handleProxyChange('password')" type="password" :placeholder="$t('view.setting.network_proxy_password')")
      dt#odc {{$t('view.setting.odc')}}
      dd
        div(:class="$style.gapTop")
          material-checkbox(id="setting_odc_isAutoClearSearchInput" v-model="current_setting.odc.isAutoClearSearchInput" :label="$t('view.setting.odc_clear_search_input')")
        div(:class="$style.gapTop")
          material-checkbox(id="setting_odc_isAutoClearSearchList" v-model="current_setting.odc.isAutoClearSearchList" :label="$t('view.setting.odc_clear_search_list')")
      dt#backup {{$t('view.setting.backup')}}
      dd
        h3#backup_part {{$t('view.setting.backup_part')}}
        div
          material-btn(:class="[$style.btn, $style.gapLeft]" min @click="handleImportPlayList") {{$t('view.setting.backup_part_import_list')}}
          material-btn(:class="[$style.btn, $style.gapLeft]" min @click="handleExportPlayList") {{$t('view.setting.backup_part_export_list')}}
          material-btn(:class="[$style.btn, $style.gapLeft]" min @click="handleImportSetting") {{$t('view.setting.backup_part_import_setting')}}
          material-btn(:class="[$style.btn, $style.gapLeft]" min @click="handleExportSetting") {{$t('view.setting.backup_part_export_setting')}}
      dd
        h3#backup_all {{$t('view.setting.backup_all')}}
        div
          material-btn(:class="[$style.btn, $style.gapLeft]" min @click="handleImportAllData") {{$t('view.setting.backup_all_import')}}
          material-btn(:class="[$style.btn, $style.gapLeft]" min @click="handleExportAllData") {{$t('view.setting.backup_all_export')}}
      dt#other {{$t('view.setting.other')}}
      dd
        h3#other_tray_theme {{$t('view.setting.other_tray_theme')}}
        div
          material-checkbox(:id="'setting_tray_theme_' + item.id" v-model="current_setting.tray.themeId" name="setting_tray_theme" need :class="$style.gapLeft"
            :label="$t('view.setting.other_tray_theme_' + item.name)" :key="item.id" :value="item.id" v-for="item in trayThemeList")
      dd
        h3#other_resource_cache {{$t('view.setting.other_resource_cache')}}
        div
          p
            | {{$t('view.setting.other_resource_cache_label')}}
            span.auto-hidden {{cacheSize}}
          p
            material-btn(:class="$style.btn" min :disabled="isDisabledResourceCacheClear" @click="clearResourceCache") {{$t('view.setting.other_resource_cache_clear_btn')}}
      dd
        h3#other_play_list_cache {{$t('view.setting.other_play_list_cache')}}
        div
          material-btn(:class="$style.btn" min :disabled="isDisabledListCacheClear" @click="clearListCache") {{$t('view.setting.other_play_list_cache_clear_btn')}}

      dt#update {{$t('view.setting.update')}}
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
      dt#about {{$t('view.setting.about')}}
      dd
        p.small
          | 本软件完全免费，代码已开源，开源地址：
          span.hover.underline(:tips="$t('view.setting.click_open')" @click="handleOpenUrl('https://github.com/lyswhut/lx-music-desktop#readme')") https://github.com/lyswhut/lx-music-desktop
        p.small
          | 最新版网盘下载地址（网盘内有Windows、MAC版）：
          span.hover.underline(:tips="$t('view.setting.click_open')" @click="handleOpenUrl('https://www.lanzoui.com/b0bf2cfa/')") 网盘地址
          | &nbsp;&nbsp;密码：
          span.hover(:tips="$t('view.setting.click_copy')" @click="clipboardWriteText('glqw')") glqw
        p.small
          | 软件的常见问题可转至：
          span.hover.underline(:tips="$t('view.setting.click_open')" @click="handleOpenUrl('https://github.com/lyswhut/lx-music-desktop/blob/master/FAQ.md')") 常见问题
        p.small
          strong 本软件没有客服
          | ，但我们整理了一些常见的使用问题，
          strong 仔细 仔细 仔细
          | 地阅读常见问题后，
        p.small
          | 仍有问题可加企鹅群&nbsp;
          span.hover(:tips="$t('view.setting.click_open')" @click="handleOpenUrl('https://jq.qq.com/?_wv=1027&k=51ECeq2')") 830125506
          | &nbsp;反馈
          strong (为免满人，无事勿加，入群先看群公告)
          | ，或到 GitHub 提交&nbsp;
          span.hover.underline(:tips="$t('view.setting.click_open')" @click="handleOpenUrl('https://github.com/lyswhut/lx-music-desktop/issues')") issue

        br
        p.small
          | 如果你喜欢并经常使用洛雪音乐，并想要第一时间尝鲜洛雪的新功能&nbsp;
          span(style="text-decoration: line-through;") （当小白鼠）
          | ，
        p
          | 可以加入测试企鹅群&nbsp;
          span.hover(:tips="$t('view.setting.click_open')" @click="handleOpenUrl('https://qm.qq.com/cgi-bin/qm/qr?k=zR6aYosQoKb07g4FGFZdO9n9zL1dhFpE&jump_from=webapi')") 768786588
          | &nbsp;，注意：测试版的功可能会不稳定，
          strong 打算潜水的勿加

        br
        p.small 由于软件开发的初衷仅是为了对新技术的学习与研究，因此软件直至停止维护都将会一直保持纯净。

        p.small
          | 你已签署本软件的&nbsp;
          material-btn(min @click="handleShowPact") 许可协议
          | ，协议的在线版本在&nbsp;
          strong.hover.underline(:tips="$t('view.setting.click_open')" @click="handleOpenUrl('https://github.com/lyswhut/lx-music-desktop#%E9%A1%B9%E7%9B%AE%E5%8D%8F%E8%AE%AE')") 这里
          | &nbsp;。
        br

        p
          small By：
          | 落雪无痕
  material-user-api-modal(v-model="isShowUserApiModal")
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
  getSetting,
  saveSetting,
  saveLxConfigFile,
  readLxConfigFile,
} from '../utils'
import { rendererSend, rendererInvoke, rendererOn, NAMES, rendererOff } from '@common/ipc'
import { mergeSetting, isMac } from '../../common/utils'
import apiSourceInfo from '../utils/music/api-source-info'
import languageList from '@renderer/lang/languages.json'
import { base as eventBaseName } from '../event/names'
import * as hotKeys from '../../common/hotKey'
import { mainWindow as eventsNameMainWindow, winLyric as eventsNameWinLyric } from '../../main/events/_name'
import music from '../utils/music'

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
    // togglePlayMethods() {
    //   return [
    //     {
    //       name: this.$t('view.setting.play_toggle_list_loop'),
    //       value: 'listLoop',
    //     },
    //     {
    //       name: this.$t('view.setting.play_toggle_random'),
    //       value: 'random',
    //     },
    //     {
    //       name: this.$t('view.setting.play_toggle_list'),
    //       value: 'list',
    //     },
    //     {
    //       name: this.$t('view.setting.play_toggle_single_loop'),
    //       value: 'singleLoop',
    //     },
    //   ]
    // },
    apiSources() {
      return [
        ...apiSourceInfo.map(api => ({
          id: api.id,
          label: this.$t('view.setting.basic_source_' + api.id) || api.name,
          disabled: api.disabled,
        })),
        ...window.globalObj.userApi.list.map(api => ({
          id: api.id,
          label: `${api.name}${api.description ? `（${api.description}）` : ''}${api.id == this.setting.apiSource ? `[${this.getApiStatus()}]` : ''}`,
          status: api.status,
          message: api.message,
          disabled: false,
        })),
      ]
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
    lrcFormatList() {
      return [
        {
          name: this.$t('view.setting.download_lyric_format_utf8'),
          id: 'utf8',
        },
        {
          name: this.$t('view.setting.download_lyric_format_gbk'),
          id: 'gbk',
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
        {
          id: 2,
          name: 'black',
        },
      ]
    },
    syncEnableTitle() {
      let title = this.$t('view.setting.sync_enable')
      if (this.sync.status.message) {
        title += ` [${this.sync.status.message}]`
      }
      // else if (this.sync.status.address.length) {
      //   // title += ` [${this.sync.status.address.join(', ')}]`
      // }
      return title
    },
    syncDevices() {
      return this.sync.status.devices.length
        ? this.sync.status.devices.map(d => `${d.deviceName} (${d.clientId.substring(0, 5)})`).join(', ')
        : ''
    },
    fontList() {
      return [{ id: '', label: this.$t('view.setting.desktop_lyric_font_default') }, ...this.systemFontList]
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
            font: '',
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
          lrcFormat: 'utf8',
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
        sync: {
          enable: false,
          port: '23332',
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
      isShowUserApiModal: false,
      toc: {
        list: [],
        activeId: '',
      },
      isDisabledResourceCacheClear: false,
      isDisabledListCacheClear: false,
      sync: {
        status: {
          status: false,
          message: '',
          address: [],
          code: '',
          devices: [],
        },
      },
      systemFontList: [],
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
    'setting.apiSource'(n) {
      this.current_setting.apiSource = n
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
    // 'setting.player.isPlayLxlrc'(n) {
    //   this.current_setting.player.isPlayLxlrc = n
    // },
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
    this.syncUnInit()

    if (this.current_setting.network.proxy.enable && !this.current_setting.network.proxy.host) window.globalObj.proxy.enable = false
  },
  methods: {
    ...mapMutations(['setSetting', 'setSettingVersion', 'setVersionModalVisible']),
    ...mapMutations('list', {
      setList: 'setList',
      clearMyListCache: 'clearCache',
    }),
    ...mapMutations(['setMediaDeviceId']),
    init() {
      this.current_setting = JSON.parse(JSON.stringify(this.setting))
      if (!window.currentWindowSizeId) window.currentWindowSizeId = this.setting.windowSizeId
      // this.initTOC()
      this.getCacheSize()
      this.getSystemFonts()
      this.getMediaDevice()
      this.current_hot_key = window.appHotKeyConfig
      this.initHotKeyConfig()
      this.getHotKeyStatus()
      this.syncInit()
    },
    // initTOC() {
    //   const list = this.$refs.dom_setting_list.children
    //   const toc = []
    //   let prevTitle
    //   for (const item of list) {
    //     if (item.tagName == 'DT') {
    //       prevTitle = {
    //         title: item.innerText.replace(/[（(].+?[)）]/, ''),
    //         id: item.getAttribute('id'),
    //         dom: item,
    //         children: [],
    //       }
    //       toc.push(prevTitle)
    //       continue
    //     }
    //     const h3 = item.querySelector('h3')
    //     if (h3) {
    //       prevTitle.children.push({
    //         title: h3.innerText.replace(/[（(].+?[)）]/, ''),
    //         id: h3.getAttribute('id'),
    //         dom: h3,
    //       })
    //     }
    //   }
    //   console.log(toc)
    //   this.toc.list = toc
    // },
    // handleListScroll(event) {
    //   // console.log(event.target.scrollTop)
    // },
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
        settingData = await readLxConfigFile(path)
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
      saveLxConfigFile(path, data)
    },
    async importPlayList(path) {
      let listData
      try {
        listData = await readLxConfigFile(path)
      } catch (error) {
        return
      }
      console.log(listData.type)

      // 兼容0.6.2及以前版本的列表数据
      if (listData.type === 'defautlList') return this.setList({ id: 'default', list: listData.data.list, name: '试听列表' })

      if (listData.type !== 'playList') return

      for (const list of listData.data) {
        this.setList(list)
      }

      await this.refreshSetting(this.setting, this.settingVersion)
    },
    async exportPlayList(path) {
      const data = JSON.parse(JSON.stringify({
        type: 'playList',
        data: [
          this.defaultList,
          this.loveList,
          ...this.userList,
        ],
      }))
      for await (const list of data.data) {
        for await (const item of list.list) {
          if (item.otherSource) delete item.otherSource
        }
      }
      saveLxConfigFile(path, data)
    },
    async importAllData(path) {
      let allData
      try {
        allData = await readLxConfigFile(path)
      } catch (error) {
        return
      }
      if (allData.type !== 'allData') return

      // 兼容0.6.2及以前版本的列表数据
      if (allData.defaultList) return this.setList({ id: 'default', list: allData.defaultList.list, name: '试听列表' })

      for (const list of allData.playList) {
        this.setList(list)
      }

      const { version: settingVersion, setting } = mergeSetting(allData.setting)
      setting.isAgreePact = false

      await this.refreshSetting(setting, settingVersion)
    },
    async exportAllData(path) {
      let allData = JSON.parse(JSON.stringify({
        type: 'allData',
        setting: Object.assign({ version: this.settingVersion }, this.setting),
        playList: [
          this.defaultList,
          this.loveList,
          ...this.userList,
        ],
      }))
      for await (const list of allData.playList) {
        for await (const item of list.list) {
          if (item.otherSource) delete item.otherSource
        }
      }
      saveLxConfigFile(path, allData)
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
    clearResourceCache() {
      this.isDisabledResourceCacheClear = true
      clearCache().then(() => {
        this.getCacheSize()
        this.isDisabledResourceCacheClear = false
      })
    },
    clearListCache() {
      this.isDisabledListCacheClear = true
      this.clearMyListCache()
      this.isDisabledListCacheClear = false
    },
    handleWindowSizeChange(index) {
      let info = index == null ? this.windowSizeList[2] : this.windowSizeList[index]
      setWindowSize(info.width, info.height)
    },
    async refreshSetting(newSetting, newVersion) {
      await saveSetting(newSetting)
      const { setting, version } = await getSetting()
      this.setSetting(setting)
      this.setSettingVersion(version)
      if (setting.windowSizeId != null) this.handleWindowSizeChange(null, setting.windowSizeId)
      window.globalObj.apiSource = setting.apiSource
      if (/^user_api/.test(setting.apiSource)) {
        rendererInvoke(NAMES.mainWindow.set_user_api, setting.apiSource)
      } else {
        window.globalObj.qualityList = music.supportQuality[setting.apiSource]
      }
      for (let key of Object.keys(setting.network.proxy)) {
        window.globalObj.proxy[key] = setting.network.proxy[key]
      }
      this.init()
      this.handleLangChange(this.current_setting.langId)
    },
    handleLangChange(id) {
      this.$i18n.locale = id
      // this.$nextTick(() => this.initTOC())
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
      const prevInput = hotKeyTargetInput
      hotKeyTargetInput = null
      if (prevInput.value == this.$t('view.setting.hot_key_tip_input')) {
        prevInput.value = newHotKey ? this.formatHotKeyName(newHotKey) : ''
        return
      }
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
    getApiStatus() {
      let status
      if (window.globalObj.userApi.status) status = this.$t('view.setting.basic_source_status_success')
      else if (window.globalObj.userApi.message == 'initing') status = this.$t('view.setting.basic_source_status_initing')
      else status = `${this.$t('view.setting.basic_source_status_failed')} - ${window.globalObj.userApi.message}`

      return status
    },
    setStatus(e, status) {
      this.sync.status.status = status.status
      this.sync.status.message = status.message
      this.sync.status.address = status.address
      this.sync.status.code = status.code
      this.sync.status.devices = status.devices
    },
    syncInit() {
      rendererInvoke(NAMES.mainWindow.sync_get_status).then(status => {
        this.sync.status.status = status.status
        this.sync.status.message = status.message
        this.sync.status.address = status.address
        this.sync.status.code = status.code
        this.sync.status.devices = status.devices
      })
      rendererOn(NAMES.mainWindow.sync_status, this.setStatus)
    },
    syncUnInit() {
      rendererOff(NAMES.mainWindow.sync_status, this.setStatus)
    },
    handleSyncChange(action) {
      switch (action) {
        case 'port':
          if (!this.current_setting.sync.enable) return
        case 'enable':
          rendererInvoke(NAMES.mainWindow.sync_enable, {
            enable: this.current_setting.sync.enable,
            port: this.current_setting.sync.port,
          })
          window.globalObj.sync.enable = this.current_setting.sync.enable
          break
      }
    },
    handleRefreshSyncCode() {
      rendererInvoke(NAMES.mainWindow.sync_generate_code)
    },
    getSystemFonts() {
      rendererInvoke(NAMES.mainWindow.get_system_fonts).then(fonts => {
        this.systemFontList = fonts.map(f => ({ id: f, label: f.replace(/(^"|"$)/g, '') }))
      }).catch(() => {
        this.systemFontList = []
      })
    },
  },
}
</script>

<style lang="less" module>
@import '../assets/styles/layout.less';

.main {
  display: flex;
  flex-flow: row nowrap;
  height: 100%;
  // border-top: 1px solid rgba(0, 0, 0, 0.12);
}

// .toc {
//   flex: 0 0 15%;
//   overflow-y: scroll;
//   padding: 10px;
//   a {
//     text-decoration: none;
//     display: block;
//     line-height: 1.5;
//     .mixin-ellipsis-1;
//   }
// }
// .tocH2 {
//   font-size: 14px;
//   a {
//     color: @color-theme;
//   }
//   &.active {
//     a {
//       color: @color-theme;
//     }
//   }
// }
// .tocH3 {
//   font-size: 13px;
//   opacity: .8;
// }

// .tocList {
//   .tocList {
//     padding-left: 15px;
//   }
// }
// .tocListItem {
//   +.tocListItem {
//     padding-top: 10px;
//   }
// }
// .tocSubListItem {
//   padding-top: 10px;
// }

.setting {
  padding: 0 15px 30px 15px;
  font-size: 14px;
  box-sizing: border-box;
  overflow-y: auto;
  height: 100%;
  position: relative;

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
  &.top {
    margin-top: 25px;
  }

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

// :global(dt):target, :global(h3):target {
//   animation: highlight 1s ease;
// }

// @keyframes highlight {
//   from { background: yellow; }
//   to { background: transparent; }
// }

each(@themes, {
  :global(#container.@{value}) {
    // .tocH2 {
    //   a {
    //     color: ~'@{color-@{value}-theme}';
    //   }
    // }
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
