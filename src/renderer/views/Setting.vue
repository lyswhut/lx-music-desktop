<template lang="pug">
div.scroll(:class="$style.setting")
  dl
    dt {{$t('view.setting.basic')}}
    dd
      h3 {{$t('view.setting.basic_theme')}}
      div
        ul(:class="$style.theme")
          li(v-for="theme in themes.list" :key="theme.id" :title="$t('store.state.theme_' + theme.class)" @click="current_setting.themeId = theme.id" :class="[theme.class, themes.active == theme.id ? $style.active : '']")
            span
            label {{$t('store.state.theme_' + theme.class)}}

    dd(:title="$t('view.setting.basic_animation_title')")
      h3 {{$t('view.setting.basic_animation')}}
      div
        material-checkbox(id="setting_animate" v-model="current_setting.randomAnimate" :label="$t('view.setting.is_enable')")

    dd(:title="$t('view.setting.basic_source_title')")
      h3 {{$t('view.setting.basic_source')}}
      div
        div(v-for="item in apiSources" :key="item.id" :class="$style.gapTop")
          material-checkbox(:id="`setting_api_source_${item.id}`" name="setting_api_source" @change="handleAPISourceChange(item.id)"
            need v-model="current_setting.apiSource" :disabled="item.disabled" :value="item.id" :label="item.label")

    dd(:title="$t('view.setting.basic_to_tray_title')")
      h3 {{$t('view.setting.basic_to_tray')}}
      div
        material-checkbox(id="setting_to_tray" v-model="current_setting.tray.isToTray" @change="handleToTrayChange" :label="$t('view.setting.is_enable')")

    dd(:title="$t('view.setting.basic_window_size_title')")
      h3 {{$t('view.setting.basic_window_size')}}
      div
        material-checkbox(v-for="(item, index) in windowSizeList" :id="`setting_window_size_${item.id}`" name="setting_window_size" @change="handleWindowSizeChange" :class="$style.gapLeft"
          need v-model="current_setting.windowSizeId" :value="item.id" :label="$t('view.setting.basic_window_size_' + item.name)" :key="item.id")

    dd(:title="$t('view.setting.basic_lang_title')")
      h3 {{$t('view.setting.basic_lang')}}
      div
        material-checkbox(v-for="item in languageList" :key="item.locale" :id="`setting_lang_${item.locale}`" name="setting_lang"
          @change="handleLangChange(item.locale)" :class="$style.gapLeft"
          need v-model="current_setting.langId" :value="item.locale" :label="item.name")

    dd(:title="$t('view.setting.basic_sourcename_title')")
      h3 {{$t('view.setting.basic_sourcename')}}
      div
        material-checkbox(v-for="item in sourceNameTypes" :key="item.id" :class="$style.gapLeft" :id="`setting_abasic_sourcename_${item.id}`"
          name="setting_basic_sourcename" need v-model="current_setting.sourceNameType" :value="item.id" :label="item.label")

    dt {{$t('view.setting.play')}}
    dd(:title="$t('view.setting.play_toggle_title')")
      h3 {{$t('view.setting.play_toggle')}}
      div
        material-checkbox(:id="`setting_player_togglePlay_${item.value}`" :class="$style.gapLeft" :value="item.value" :key="item.value"
            v-model="current_setting.player.togglePlayMethod" v-for="item in togglePlayMethods" :label="item.name")
    dd(:title="$t('view.setting.play_quality_title')")
      h3 {{$t('view.setting.play_quality')}}
      div
        material-checkbox(id="setting_player_highQuality" v-model="current_setting.player.highQuality" :label="$t('view.setting.is_enable')")
    dd(:title="$t('view.setting.play_task_bar_title')")
      h3 {{$t('view.setting.play_task_bar')}}
      div
        material-checkbox(id="setting_player_showTaskProgess" v-model="current_setting.player.isShowTaskProgess" :label="$t('view.setting.is_enable')")
    dd(:title="$t('view.setting.play_mediaDevice_title')")
      h3 {{$t('view.setting.play_mediaDevice')}}
      div
        material-selection(:list="mediaDevices" :class="$style.gapLeft" v-model="current_setting.player.mediaDeviceId" item-key="deviceId" item-name="label")
        material-btn(min :title="$t('view.setting.play_mediaDevice_refresh_btn_title')" :class="[$style.btnMediaDeviceRefresh, $style.gapLeft]" @click="getMediaDevice")
          svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 512 512' space='preserve')
            use(xlink:href='#icon-refresh')
          span {{$t('view.setting.play_mediaDevice_refresh_btn')}}

    dt {{$t('view.setting.search')}}
    dd(:title="$t('view.setting.search_hot_title')")
      h3 {{$t('view.setting.search_hot')}}
      div
        material-checkbox(id="setting_search_showHot_enable" v-model="current_setting.search.isShowHotSearch" :label="$t('view.setting.is_show')")
    dd(:title="$t('view.setting.search_history_title')")
      h3 {{$t('view.setting.search_history')}}
      div
        material-checkbox(id="setting_search_showHistory_enable" v-model="current_setting.search.isShowHistorySearch" :label="$t('view.setting.is_show')")
    dd(:title="$t('view.setting.search_focus_search_box_title')")
      h3 {{$t('view.setting.search_focus_search_box')}}
      div
        material-checkbox(id="setting_search_focusSearchBox_enable" v-model="current_setting.search.isFocusSearchBox" :label="$t('view.setting.is_enable')")

    dt {{$t('view.setting.list')}}
    dd(:title="$t('view.setting.list_source_title')")
      h3 {{$t('view.setting.list_source')}}
      div
        material-checkbox(id="setting_list_showSource_enable" v-model="current_setting.list.isShowSource" :label="$t('view.setting.is_show')")
    dd(:title="$t('view.setting.list_scroll_title')")
      h3 {{$t('view.setting.list_scroll')}}
      div
        material-checkbox(id="setting_list_scroll_enable" v-model="current_setting.list.scroll.enable" :label="$t('view.setting.is_enable')")
    //- dd(:title="播放列表是否显示专辑栏")
      h3 专辑栏
      div
        material-checkbox(id="setting_list_showalbum" v-model="current_setting.list.isShowAlbumName" label="是否显示专辑栏")
    dt {{$t('view.setting.download')}}
    dd(:title="$t('view.setting.download_path_title')")
      h3 {{$t('view.setting.download_path')}}
      div
        p
          | {{$t('view.setting.download_path_label')}}
          span.auto-hidden.hover(:title="$t('view.setting.download_path_open_label')" :class="$style.savePath" @click="handleOpenDir(current_setting.download.savePath)") {{current_setting.download.savePath}}
        p
          material-btn(:class="$style.btn" min @click="handleChangeSavePath") {{$t('view.setting.download_path_change_btn')}}
    dd(:title="$t('view.setting.download_name_title')")
      h3 {{$t('view.setting.download_name')}}
      div
        material-checkbox(:id="`setting_download_musicName_${item.value}`" :class="$style.gapLeft" name="setting_download_musicName" :value="item.value" :key="item.value" need
            v-model="current_setting.download.fileName" v-for="item in musicNames" :label="item.name")
    dd(:title="$t('view.setting.download_embed_pic_title')")
      h3 {{$t('view.setting.download_embed_pic')}}
      div
        material-checkbox(id="setting_download_isEmbedPic" v-model="current_setting.download.isEmbedPic" :label="$t('view.setting.is_enable')")
    dd(:title="$t('view.setting.download_lyric_title')")
      h3 {{$t('view.setting.download_lyric')}}
      div
        material-checkbox(id="setting_download_isDownloadLrc" v-model="current_setting.download.isDownloadLrc" :label="$t('view.setting.is_enable')")
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
      h3 {{$t('view.setting.other_cache')}}
      div
        p
          | {{$t('view.setting.other_cache_label')}}
          span.auto-hidden(:title="$t('view.setting.other_cache_label_title')") {{cacheSize}}
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
        | 本软件完全免费，代码已开源，开源地址：
        span.hover.underline(:title="$t('view.setting.click_open')" @click="handleOpenUrl('https://github.com/lyswhut/lx-music-desktop#readme')") https://github.com/lyswhut/lx-music-desktop
      p.small
        | 最新版网盘下载地址（网盘内有Windows、MAC版）：
        span.hover.underline(:title="$t('view.setting.click_open')" @click="handleOpenUrl('https://t-s.lanzous.com/b0bf2cfa')") 网盘地址
        | &nbsp;&nbsp;密码：
        span.hover(:title="$t('view.setting.click_copy')" @click="clipboardWriteText('glqw')") glqw
      p.small
        | 软件的常见问题可转至：
        span.hover.underline(:title="$t('view.setting.click_open')" @click="handleOpenUrl('https://github.com/lyswhut/lx-music-desktop/blob/master/FAQ.md')") 常见问题
      p.small
        strong 仔细 仔细 仔细
        | 地阅读常见问题后，
      p.small
        | 仍有问题可加企鹅群&nbsp;
        span.hover(:title="$t('view.setting.click_open')" @click="handleOpenUrl('https://jq.qq.com/?_wv=1027&k=51ECeq2')") 830125506
        | &nbsp;反馈
        strong (为免满人，无事勿加，入群先看群公告)
        | ，或到 GitHub 提交&nbsp;
        span.hover.underline(:title="$t('view.setting.click_open')" @click="handleOpenUrl('https://github.com/lyswhut/lx-music-desktop/issues')") issue

      br
      p.small 感谢以前捐赠过的人❤️，现在软件不再接受捐赠，建议把你们的爱心用来支持正版音乐，
      p.small 由于软件开发的初衷仅是为了对新技术的学习与研究，因此软件直至停止维护都将会一直保持纯净。

      p.small
        | 你已签署本软件的&nbsp;
        material-btn(min @click="handleShowPact") 许可协议
        | ，协议的在线版本在&nbsp;
        strong.hover.underline(:title="$t('view.setting.click_open')" @click="handleOpenUrl('https://github.com/lyswhut/lx-music-desktop#%E9%A1%B9%E7%9B%AE%E5%8D%8F%E8%AE%AE')") 这里
        | &nbsp;。
      br

      p
        small By：
        | 落雪无痕
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import {
  openDirInExplorer,
  selectDir,
  openSaveDir,
  updateSetting,
  openUrl,
  clipboardWriteText,
  getCacheSize,
  clearCache,
  sizeFormate,
  setWindowSize,
} from '../utils'
import { rendererSend } from '../../common/ipc'
import fs from 'fs'
import languageList from '@/lang/languages.json'

export default {
  name: 'Setting',
  computed: {
    ...mapGetters(['setting', 'settingVersion', 'themes', 'version', 'windowSizeList']),
    ...mapGetters('list', ['defaultList', 'loveList']),
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
      return [
        {
          id: 'test',
          label: this.$t('view.setting.basic_source_test'),
          disabled: false,
        },
        {
          id: 'temp',
          label: this.$t('view.setting.basic_source_temp'),
          disabled: false,
        },
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
        },
        list: {
          isShowAlbumName: true,
          isShowSource: true,
          scroll: {
            enable: true,
            locations: {},
          },
        },
        search: {
          searchSource: 'kw',
          tempSearchSource: 'kw',
          isShowHotSearch: false,
          isShowHistorySearch: false,
          isFocusSearchBox: false,
        },
        download: {
          savePath: '',
          fileName: '歌名 - 歌手',
          isDownloadLrc: false,
          isEmbedPic: true,
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
        },
        windowSizeId: 1,
        langId: 'cns',
        themeId: 0,
        sourceId: 0,
        randomAnimate: true,
        isAgreePact: false,
        apiSource: 'temp',
      },
      languageList,
      cacheSize: '0 B',
      mediaDevices: [],
    }
  },
  watch: {
    current_setting: {
      handler(n, o) {
        if (!this.settingVersion) return
        this.setSetting(JSON.parse(JSON.stringify(n)))
      },
      deep: true,
    },
    'setting.isAgreePact'(n) {
      this.current_setting.isAgreePact = n
    },
    'current_setting.player.isShowTaskProgess'(n) {
      if (n) return
      this.$nextTick(() => {
        rendererSend('progress', {
          status: -1,
          mode: 'normal',
        })
      })
    },
  },
  mounted() {
    this.init()
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
        settingData = JSON.parse(await fs.promises.readFile(path, 'utf8'))
      } catch (error) {
        return
      }
      if (settingData.type !== 'setting') return
      const { version: settingVersion, setting } = updateSetting(settingData.data)
      setting.isAgreePact = false
      this.refreshSetting(setting, settingVersion)
    },
    exportSetting(path) {
      console.log(path)
      const data = {
        type: 'setting',
        data: Object.assign({ version: this.settingVersion }, this.setting),
      }
      fs.writeFile(path, JSON.stringify(data, null, 2), 'utf8', err => {
        console.log(err)
      })
    },
    async importPlayList(path) {
      let listData
      try {
        listData = JSON.parse(await fs.promises.readFile(path, 'utf8'))
      } catch (error) {
        return
      }
      console.log(listData.type)

      // 兼容0.6.2及以前版本的列表数据
      if (listData.type === 'defautlList') return this.setList({ id: 'default', list: listData.data.list })

      if (listData.type !== 'playList') return

      for (const list of listData.data) {
        this.setList({ id: list.id, list: list.list })
      }
    },
    exportPlayList(path) {
      const data = {
        type: 'playList',
        data: [
          this.defaultList,
          this.loveList,
        ],
      }
      fs.writeFile(path, JSON.stringify(data, null, 2), 'utf8', err => {
        console.log(err)
      })
    },
    async importAllData(path) {
      let allData
      try {
        allData = JSON.parse(await fs.promises.readFile(path, 'utf8'))
      } catch (error) {
        return
      }
      if (allData.type !== 'allData') return
      const { version: settingVersion, setting } = updateSetting(allData.setting)
      setting.isAgreePact = false
      this.refreshSetting(setting, settingVersion)

      // 兼容0.6.2及以前版本的列表数据
      if (allData.defaultList) return this.setList({ id: 'default', list: allData.defaultList.list })

      for (const list of allData.playList) {
        this.setList({ id: list.id, list: list.list })
      }
    },
    exportAllData(path) {
      let allData = {
        type: 'allData',
        setting: Object.assign({ version: this.settingVersion }, this.setting),
        playList: [
          this.defaultList,
          this.loveList,
        ],
      }
      fs.writeFile(path, JSON.stringify(allData, null, 2), 'utf8', err => {
        console.log(err)
      })
    },
    handleImportAllData() {
      selectDir({
        title: this.$t('view.setting.backup_all_import_desc'),
        properties: ['openFile'],
        filters: [
          { name: 'Setting', extensions: ['json'] },
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
        defaultPath: 'lx_datas.json',
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
          { name: 'Setting', extensions: ['json'] },
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
        defaultPath: 'lx_setting.json',
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
          { name: 'Play List', extensions: ['json'] },
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
        defaultPath: 'lx_list.json',
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
      this.handleToTrayChange()
    },
    handleLangChange(id) {
      this.$i18n.locale = id
    },
    async getMediaDevice() {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioDevices = devices.filter(device => device.kind === 'audiooutput')
      this.mediaDevices = audioDevices
      // console.log(this.mediaDevices)
    },
    handleToTrayChange(isToTray) {
      if (isToTray != null) this.current_setting.tray.isShow = isToTray
      rendererSend('changeTray', this.current_setting.tray)
    },
    handleShowPact() {
      window.globalObj.isShowPact = true
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
        border-radius: 4px;
        background-position: center;
        background-size: auto 100%;
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
.btn-media-device-refresh {
  height: 28px;
  line-height: 28px;
  padding: 0px 15px;
  svg {
    width: 1em;
    vertical-align: middle;
    margin-right: 5px;
  }
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
