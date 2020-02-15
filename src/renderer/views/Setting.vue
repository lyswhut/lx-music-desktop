<template lang="pug">
div.scroll(:class="$style.setting")
  dl
    dt 基本设置
    dd
      h3 主题颜色
      div
        ul(:class="$style.theme")
          li(v-for="theme in themes.list" :key="theme.id" @click="current_setting.themeId = theme.id" :class="[theme.class, themes.active == theme.id ? $style.active : '']")
            span
            | {{theme.name}}

    dd(title='弹出层的动画效果')
      h3 弹出层随机动画
      div
        material-checkbox(id="setting_animate" v-model="current_setting.randomAnimate" label="是否启用")

    dd(title='选择音乐来源')
      h3 音乐来源
      div
        div(v-for="item in apiSources" :key="item.id" :class="$style.gapTop")
          material-checkbox(:id="`setting_api_source_${item.id}`" name="setting_api_source" @change="handleAPISourceChange(item.id)"
            need v-model="current_setting.apiSource" :disabled="item.disabled" :value="item.id" :label="item.label")

    dd(title='设置软件窗口尺寸')
      h3 窗口尺寸
      div
        material-checkbox(v-for="(item, index) in windowSizeList" :id="`setting_window_size_${item.id}`" name="setting_window_size" @change="handleWindowSizeChange(index)" :class="$style.gapLeft"
          need v-model="current_setting.windowSizeId" :value="item.id" :label="item.name" :key="item.id")

    dt 播放设置
    dd(title="都不选时播放完当前歌曲就停止播放")
      h3 歌曲切换方式
      div
        material-checkbox(:id="`setting_player_togglePlay_${item.value}`" :class="$style.gapLeft" :value="item.value" :key="item.value"
            v-model="current_setting.player.togglePlayMethod" v-for="item in togglePlayMethods" :label="item.name")
    dd(title='启用时将优先播放320K品质的歌曲')
      h3 优先播放高品质音乐
      div
        material-checkbox(id="setting_player_highQuality" v-model="current_setting.player.highQuality" label="是否启用")
    dd(title='在任务栏上显示当前歌曲播放进度')
      h3 任务栏播放进度条
      div
        material-checkbox(id="setting_player_showTaskProgess" v-model="current_setting.player.isShowTaskProgess" label="是否启用")
    dt 列表设置
    dd(title='是否显示歌曲源')
      h3 是否显示歌曲源（仅对我的音乐分类有效）
      div
        material-checkbox(id="setting_list_showSource_enable" v-model="current_setting.list.isShowSource" label="是否显示")
    dd(title='是否记住播放列表滚动条位置')
      h3 记住列表滚动位置（仅对我的音乐分类有效）
      div
        material-checkbox(id="setting_list_scroll_enable" v-model="current_setting.list.scroll.enable" label="是否启用")
    //- dd(title='播放列表是否显示专辑栏')
      h3 专辑栏
      div
        material-checkbox(id="setting_list_showalbum" v-model="current_setting.list.isShowAlbumName" label="是否显示专辑栏")
    dt 下载设置
    dd(title='下载歌曲保存的路径')
      h3 下载路径
      div
        p
          | 当前下载路径：
          span.auto-hidden.hover(title="点击打开当前路径" :class="$style.savePath" @click="handleOpenDir(current_setting.download.savePath)") {{current_setting.download.savePath}}
        p
          material-btn(:class="$style.btn" min @click="handleChangeSavePath") 更改
    dd(title='下载歌曲时的命名方式')
      h3 文件命名方式
      div
        material-checkbox(:id="`setting_download_musicName_${item.value}`" :class="$style.gapLeft" name="setting_download_musicName" :value="item.value" :key="item.value" need
            v-model="current_setting.download.fileName" v-for="item in musicNames" :label="item.name")
    dd(title='是否将封面嵌入音频文件中')
      h3 封面嵌入（只支持MP3格式）
      div
        material-checkbox(id="setting_download_isEmbedPic" v-model="current_setting.download.isEmbedPic" label="是否启用")
    dd(title='是否同时下载歌词文件')
      h3 歌词下载
      div
        material-checkbox(id="setting_download_isDownloadLrc" v-model="current_setting.download.isDownloadLrc" label="是否启用")
    dt 网络设置
    dd
      h3 代理设置（乱设置软件将无法联网）
      div
        p
          material-checkbox(id="setting_network_proxy_enable" v-model="current_setting.network.proxy.enable" @change="handleProxyChange('enable')" label="是否启用")
        p
          material-input(:class="$style.gapLeft" v-model="current_setting.network.proxy.host" @change="handleProxyChange('host')" placeholder="主机")
          material-input(:class="$style.gapLeft" v-model="current_setting.network.proxy.port" @change="handleProxyChange('port')" placeholder="端口")
        p
          material-input(:class="$style.gapLeft" v-model="current_setting.network.proxy.username" @change="handleProxyChange('username')" placeholder="用户名")
          material-input(:class="$style.gapLeft" v-model="current_setting.network.proxy.password" @change="handleProxyChange('password')" type="password" placeholder="密码")
    dt 强迫症设置
    dd
      h3 离开搜索界面时清空搜索框
      div
        material-checkbox(id="setting_odc_isAutoClearSearchInput" v-model="current_setting.odc.isAutoClearSearchInput" label="是否启用")
    dd
      h3 离开搜索界面时清空搜索列表
      div
        material-checkbox(id="setting_odc_isAutoClearSearchList" v-model="current_setting.odc.isAutoClearSearchList" label="是否启用")
    dt 备份与恢复
    dd
      h3 部分数据
      div
        material-btn(:class="[$style.btn, $style.gapLeft]" min @click="handleImportPlayList") 导入列表
        material-btn(:class="[$style.btn, $style.gapLeft]" min @click="handleExportPlayList") 导出列表
        material-btn(:class="[$style.btn, $style.gapLeft]" min @click="handleImportSetting") 导入设置
        material-btn(:class="[$style.btn, $style.gapLeft]" min @click="handleExportSetting") 导出设置
    dd
      h3 所有数据（设置与试听列表）
      div
        material-btn(:class="[$style.btn, $style.gapLeft]" min @click="handleImportAllData") 导入
        material-btn(:class="[$style.btn, $style.gapLeft]" min @click="handleExportAllData") 导出
    dt 其他
    dd
      h3 缓存大小（清理缓存后图片等资源将需要重新下载，不建议清理，软件会根据磁盘空间动态管理缓存大小）
      div
        p
          | 软件已使用缓存大小：
          span.auto-hidden(title="当前已用缓存") {{cacheSize}}
        p
          material-btn(:class="$style.btn" min @click="clearCache") 清理缓存
    dt 软件更新
    dd
      p.small
        | 最新版本：{{version.newVersion ? version.newVersion.version : '未知'}}
      p.small 当前版本：{{version.version}}
      p.small(v-if="this.version.downloadProgress" style="line-height: 1.5;")
        | 发现新版本并在努力下载中，请稍后...⏳
        br
        | 下载进度：{{downloadProgress}}
      p(v-if="version.newVersion")
        span(v-if="version.isLatestVer") 软件已是最新，尽情地体验吧~🥂
        material-btn(v-else :class="[$style.btn, $style.gapLeft]" min @click="showUpdateModal") 打开更新窗口 🚀
      p.small(v-else) 检查更新中...
    dt 关于洛雪音乐
    dd
      p.small
        | 本软件完全免费，代码已开源，开源地址：
        span.hover.underline(title="点击打开" @click="handleOpenUrl('https://github.com/lyswhut/lx-music-desktop#readme')") https://github.com/lyswhut/lx-music-desktop
      p.small
        | 最新版网盘下载地址（网盘内有Windows、MAC版）：
        span.hover.underline(title="点击打开" @click="handleOpenUrl('https://www.lanzous.com/b906260/')") 网盘地址
        | &nbsp;&nbsp;密码：
        span.hover(title="点击复制" @click="clipboardWriteText('glqw')") glqw
      p.small
        | 软件的常见问题可转至：
        span.hover.underline(title="点击打开" @click="handleOpenUrl('https://github.com/lyswhut/lx-music-desktop/blob/master/FAQ.md')") 常见问题
      p.small
        | 阅读常见问题后仍有问题可 mail to：
        span.hover(title="点击复制" @click="clipboardWriteText('lyswhut@qq.com')") lyswhut@qq.com
        | &nbsp;或到 GitHub 提交&nbsp;
        span.hover.underline(title="点击打开" @click="handleOpenUrl('https://github.com/lyswhut/lx-music-desktop/issues')") issue

      br
      p.small
        span 如果你资金充裕，或许可以
        material-btn(@click="handleOpenUrl('https://cdn.stsky.cn/qrc.png')" min title="土豪，你好 🙂") 捐赠下作者
        span ~❤️，捐赠完全是一种
        strong 用户自愿
        | 的行为，
      p.small 捐赠不会获得任何特权，并且你可能还要做好前一秒捐赠，下一秒软件将不可用的心理准备！
      p.small
        | 由于软件开发的初衷仅是为了
        span(:class="$style.delLine") 自用
        | 学习研究，因此软件直至停止维护都将会一直保持纯净。

      br
      p.small
        | 使用本软件可能产生的
        strong 任何涉及版权相关的数据
        | 请于
        strong 24小时内删除
        | ，
      p.small
        |  本软件仅用于学习与交流使用，禁止将本软件用于
        strong 非法用途
        | 或
        strong 商业用途
        | 。
      p.small
        | 使用本软件造成的一切后果由
        strong 使用者
        | 承担！
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
        : '更新初始化中...'
    },
  },
  data() {
    return {
      current_setting: {
        player: {
          togglePlayMethod: 'random',
          highQuality: false,
          isShowTaskProgess: true,
        },
        list: {
          isShowAlbumName: true,
          isShowSource: true,
          scroll: {
            enable: true,
            locations: {},
          },
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
        windowSizeId: 1,
        themeId: 0,
        sourceId: 0,
        randomAnimate: true,
        apiSource: 'messoer',
      },
      togglePlayMethods: [
        {
          name: '列表循环',
          value: 'listLoop',
        },
        {
          name: '列表随机',
          value: 'random',
        },
        {
          name: '顺序播放',
          value: 'list',
        },
        {
          name: '单曲循环',
          value: 'singleLoop',
        },
      ],
      apiSources: [
        {
          id: 'test',
          label: '测试接口（几乎软件的所有功能都可用）',
          disabled: false,
        },
        {
          id: 'temp',
          label: '临时接口（软件的某些功能不可用，建议测试接口不可用再使用本接口）',
          disabled: false,
        },
      ],
      musicNames: [
        {
          name: '歌名 - 歌手',
          value: '歌名 - 歌手',
        },
        {
          name: '歌手 - 歌名',
          value: '歌手 - 歌名',
        },
        {
          name: '歌名',
          value: '歌名',
        },
      ],
      cacheSize: '0 B',
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
    init() {
      this.current_setting = JSON.parse(JSON.stringify(this.setting))
      if (!window.currentWindowSizeId) window.currentWindowSizeId = this.setting.windowSizeId
      this.getCacheSize()
    },
    handleChangeSavePath() {
      selectDir({
        title: '选择歌曲保存路径',
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
    importSetting(path) {
      let settingData
      try {
        settingData = JSON.parse(fs.readFileSync(path, 'utf8'))
      } catch (error) {
        return
      }
      if (settingData.type !== 'setting') return
      const { version: settingVersion, setting } = updateSetting(settingData.data)
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
    importPlayList(path) {
      let listData
      try {
        listData = JSON.parse(fs.readFileSync(path, 'utf8'))
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
    importAllData(path) {
      let allData
      try {
        allData = JSON.parse(fs.readFileSync(path, 'utf8'))
      } catch (error) {
        return
      }
      if (allData.type !== 'allData') return
      const { version: settingVersion, setting } = updateSetting(allData.setting)
      this.refreshSetting(setting, settingVersion)

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
        title: '选择备份文件',
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
        title: '选择备份保存位置',
        defaultPath: 'lx_datas.json',
      }).then(result => {
        if (result.canceled) return
        this.exportAllData(result.filePath)
      })
    },
    handleImportSetting() {
      selectDir({
        title: '选择配置文件',
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
        title: '选择设置保存位置',
        defaultPath: 'lx_setting.json',
      }).then(result => {
        if (result.canceled) return
        this.exportSetting(result.filePath)
      })
    },
    handleImportPlayList() {
      selectDir({
        title: '选择列表文件',
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
        title: '选择设置保存位置',
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
    handleWindowSizeChange(index, id) {
      let info = id == null ? this.windowSizeList[index] : this.windowSizeList.find(s => s.id == id)
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
    padding: 5px 0;
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
    margin-bottom: 20px;

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
