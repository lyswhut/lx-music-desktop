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
        material-checkbox(v-for="item in apiSources" :id="`setting_api_source_${item.id}`" @change="handleAPISourceChange(item.id)" :class="$style.gapTop"
          need v-model="current_setting.apiSource" :disabled="item.disabled" :value="item.id" :label="item.label" :key="item.id")

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
    //- dt 列表设置
    //- dd(title='播放列表是否显示专辑栏')
      h3 专辑栏
      div
        material-checkbox(id="setting_list_showalbum" v-model="current_setting.list.isShowAlbumName" label="是否显示专辑栏")
    dt 网络设置
    dd
      h3 代理设置（歌曲下载暂不支持代理）
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
    dt 软件更新
    dd
      p.small
        | 最新版本：{{version.newVersion ? version.newVersion.version : '未知'}}
      p.small 当前版本：{{version.version}}
      p.small(v-if="version.newVersion")
        span(v-if="isLatestVer") 软件已是最新，尽情地体验吧~🥂
        material-btn(v-else-if="setting.ignoreVersion || version.isError" :class="[$style.btn, $style.gapLeft]" min @click="showUpdateModal") 打开更新窗口 🚀
        span(v-else) 发现新版本并在努力下载中，请稍等...⏳
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
        span.hover.underline(title="点击打开" @click="handleOpenUrl('https://github.com/lyswhut/lx-music-desktop#常见问题')") 常见问题
      //- p.small
          | 怀念曾经的
          strong @messoer
          | ，非常感谢曾经为本软件提供数据源！
      p.small
        | 阅读常见问题后仍有问题可 mail to：
        span.hover(title="点击复制" @click="clipboardWriteText('lyswhut@qq.com')") lyswhut@qq.com
        | &nbsp;或到 GitHub 提交&nbsp;
        span.hover.underline(title="点击打开" @click="handleOpenUrl('https://github.com/lyswhut/lx-music-desktop/issues')") issue
      p.small
        | 若觉得好用的话可以去 GitHub 点个
        strong star
        | 支持作者哦~~🍻
      p
        span 如果你资金充裕，还可以
        material-btn(@click="handleOpenUrl('https://cdn.stsky.cn/qrc.png')" min title="土豪，你好 🙂") 打赏下作者
        span ，以帮我分担点服务器费用~❤️
      p.small
        |  本软件仅用于学习交流使用，禁止将本软件用于
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
import { openDirInExplorer, openSelectDir, openSaveDir, updateSetting, openUrl, clipboardWriteText } from '../utils'
import { rendererSend } from '../../common/icp'
import fs from 'fs'


export default {
  name: 'Setting',
  computed: {
    ...mapGetters(['setting', 'themes', 'version']),
    ...mapGetters('list', ['defaultList']),
    isLatestVer() {
      return this.version.newVersion && this.version.version === this.version.newVersion.version
    },
  },
  data() {
    return {
      current_setting: {
        version: null,
        player: {
          togglePlayMethod: 'random',
          highQuality: false,
          isShowTaskProgess: true,
        },
        list: {
          isShowAlbumName: true,
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
        },
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
        // {
        //   id: 'messoer',
        //   // label: '由 messoer 提供的接口（推荐，软件的所有功能都可用）',
        //   label: '由 messoer 提供的接口（该接口已关闭）',
        //   disabled: true,
        // },
        // {
        //   id: 'internal',
        //   label: '内置接口（只能试听或下载128k音质，该接口支持软件的所有功能）',
        //   disabled: false,
        // },
        {
          id: 'test',
          label: '测试接口（软件的大部分功能可用，该接口访问速度略慢）',
          disabled: false,
        },
        {
          id: 'temp',
          label: '临时接口（软件的某些功能不可用，该接口比测试接口快一些，建议测试接口不可用再使用本接口）',
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
    }
  },
  watch: {
    current_setting: {
      handler(n, o) {
        if (!o.version) return
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
    ...mapMutations(['setSetting', 'setVersionModalVisible']),
    ...mapMutations('list', ['setDefaultList']),
    init() {
      this.current_setting = JSON.parse(JSON.stringify(this.setting))
    },
    handleChangeSavePath() {
      openSelectDir({
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
      let setting
      try {
        setting = JSON.parse(fs.readFileSync(path, 'utf8'))
      } catch (error) {
        return
      }
      if (setting.type !== 'setting') return
      this.setSetting(updateSetting(setting.data))
      this.init()
    },
    exportSetting(path) {
      console.log(path)
      const data = {
        type: 'setting',
        data: this.setting,
      }
      fs.writeFile(path, JSON.stringify(data, null, 2), 'utf8', err => {
        console.log(err)
      })
    },
    importPlayList(path) {
      let defautlList
      try {
        defautlList = JSON.parse(fs.readFileSync(path, 'utf8'))
      } catch (error) {
        return
      }
      if (defautlList.type !== 'defautlList') return
      this.setDefaultList(defautlList.data.list)
    },
    exportPlayList(path) {
      const data = {
        type: 'defautlList',
        data: this.defaultList,
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
      this.setSetting(updateSetting(allData.setting))
      this.init()
      this.setDefaultList(allData.defaultList.list)
    },
    exportAllData(path) {
      let allData = {
        type: 'allData',
        setting: this.setting,
        defaultList: this.defaultList,
      }
      fs.writeFile(path, JSON.stringify(allData, null, 2), 'utf8', err => {
        console.log(err)
      })
    },
    handleImportAllData() {
      openSelectDir({
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
      openSelectDir({
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
      openSelectDir({
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
    openRewardModal() {

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
