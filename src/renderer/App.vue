<template lang="pug">
#container(v-if="isProd && !isLinux" :class="theme" @mouseenter="enableIgnoreMouseEvents" @mouseleave="dieableIgnoreMouseEvents")
  core-aside#left
  #right
    core-toolbar#toolbar
    core-view#view
    core-player#player
  core-icons
  material-version-modal(v-show="version.showModal")
#container(v-else :class="theme")
  core-aside#left
  #right
    core-toolbar#toolbar
    core-view#view
    core-player#player
  core-icons
  material-version-modal(v-show="version.showModal")
</template>

<script>
import { mapMutations, mapGetters, mapActions } from 'vuex'
import { rendererOn } from '../common/icp'
import { isLinux } from '../common/utils'
window.ELECTRON_DISABLE_SECURITY_WARNINGS = process.env.ELECTRON_DISABLE_SECURITY_WARNINGS
let win
let body
if (!isLinux) {
  win = require('electron').remote.getCurrentWindow()
  body = document.body
}

export default {
  data() {
    return {
      isProd: process.env.NODE_ENV === 'production',
      isLinux,
      globalObj: {
        apiSource: 'messoer',
      },
      updateTimeout: null,
    }
  },
  computed: {
    ...mapGetters(['electronStore', 'setting', 'theme', 'version']),
    ...mapGetters('list', ['defaultList']),
    ...mapGetters('download', {
      downloadList: 'list',
      downloadStatus: 'downloadStatus',
    }),
  },
  mounted() {
    document.body.classList.add(this.isLinux ? 'noTransparent' : 'transparent')
    this.init()
  },
  watch: {
    setting: {
      handler(n) {
        this.electronStore.set('setting', n)
      },
      deep: true,
    },
    defaultList: {
      handler(n) {
        // console.log(n)
        this.electronStore.set('list.defaultList', n)
      },
      deep: true,
    },
    downloadList: {
      handler(n) {
        this.electronStore.set('download.list', n)
      },
      deep: true,
    },
    'globalObj.apiSource'(n) {
      if (n != this.setting.apiSource) {
        this.setSetting(Object.assign({}, this.setting, {
          apiSource: n,
        }))
      }
    },
  },
  methods: {
    ...mapActions(['getVersionInfo']),
    ...mapMutations(['setNewVersion', 'setVersionModalVisible']),
    ...mapMutations('list', ['initDefaultList']),
    ...mapMutations('download', ['updateDownloadList']),
    ...mapMutations(['setSetting']),
    init() {
      if (this.isProd && !isLinux) {
        body.addEventListener('mouseenter', this.dieableIgnoreMouseEvents)
        body.addEventListener('mouseleave', this.enableIgnoreMouseEvents)
      }
      rendererOn('update-available', (e, info) => {
        // this.showUpdateModal(true)
        this.setNewVersion({
          version: info.version,
        })
      })
      rendererOn('update-error', () => {
        if (!this.updateTimeout) return
        this.setVersionModalVisible({ isError: true })
        this.clearUpdateTimeout()
        this.$nextTick(() => {
          this.showUpdateModal()
        })
      })
      rendererOn('update-downloaded', () => {
        this.clearUpdateTimeout()
        this.setVersionModalVisible({ isError: false })
        this.showUpdateModal()
      })
      rendererOn('update-not-available', () => {
        if (!this.updateTimeout) return
        if (this.setting.ignoreVersion) this.setSetting(Object.assign({}, this.setting, { ignoreVersion: null }))
        this.clearUpdateTimeout()
        this.setNewVersion({
          version: this.version.version,
        })
      })
      // 更新超时定时器
      this.updateTimeout = setTimeout(() => {
        this.updateTimeout = null
        this.setVersionModalVisible({ isError: true })
        this.$nextTick(() => {
          this.showUpdateModal()
        })
      }, 180000)

      this.initData()
      this.globalObj.apiSource = this.setting.apiSource
      window.globalObj = this.globalObj
    },
    enableIgnoreMouseEvents() {
      if (isLinux) return
      win.setIgnoreMouseEvents(false)
      // console.log('content enable')
    },
    dieableIgnoreMouseEvents() {
      if (isLinux) return
      // console.log('content disable')
      win.setIgnoreMouseEvents(true, { forward: true })
    },

    initData() { // 初始化数据
      this.initPlayList() // 初始化播放列表
      this.initDownloadList() // 初始化下载列表
    },
    initPlayList() {
      let defaultList = this.electronStore.get('list.defaultList')
      // console.log(defaultList)
      if (defaultList) {
        // defaultList.list.forEach(m => {
        //   m.typeUrl = {}
        // })
        this.initDefaultList(defaultList)
      }
    },
    initDownloadList() {
      let downloadList = this.electronStore.get('download.list')
      if (downloadList) {
        downloadList.forEach(item => {
          if (item.status == this.downloadStatus.RUN || item.status == this.downloadStatus.WAITING) {
            item.status = this.downloadStatus.PAUSE
            item.statusText = '暂停下载'
          }
        })
        this.updateDownloadList(downloadList)
      }
    },
    showUpdateModal() {
      (this.version.newVersion && this.version.newVersion.history ? Promise.resolve(this.version.newVersion) : this.getVersionInfo().then(body => {
        this.setNewVersion(body)
        if (body.version !== this.setting.ignoreVersion) this.setSetting(Object.assign({}, this.setting, { ignoreVersion: null }))
        return body
      })).then(body => {
        if (body.version === this.version.version) return
        if (this.version.isError && body.version === this.setting.ignoreVersion) return

        this.$nextTick(() => {
          this.setVersionModalVisible({ isShow: true })
        })
      })
    },
    clearUpdateTimeout() {
      if (!this.updateTimeout) return
      clearTimeout(this.updateTimeout)
      this.updateTimeout = null
    },
  },
  beforeDestroy() {
    this.clearUpdateTimeout()
    if (this.isProd) {
      body.removeEventListener('mouseenter', this.dieableIgnoreMouseEvents)
      body.removeEventListener('mouseleave', this.enableIgnoreMouseEvents)
    }
  },
}
</script>

<style lang="less">
@import './assets/styles/index.less';
@import './assets/styles/layout.less';

body {
  user-select: none;
  height: 100vh;
  box-sizing: border-box;
}

.transparent {
  padding: @shadow-app;
  #container {
    box-shadow: 0 0 @shadow-app rgba(0, 0, 0, 0.5);
    border-radius: 4px;
    background-color: transparent;
  }
}
.noTransparent {
  background-color: #fff;
}

#container {
  position: relative;
  display: flex;
  height: 100%;
  overflow: hidden;
  background: @color-theme-bgimg center center no-repeat;
  background-size: auto 100%;
  transition: background-color @transition-theme;
  background-color: @color-theme;
}

#left {
  flex: none;
  width: @width-app-left;
}
#right {
  flex: auto;
  display: flex;
  flex-flow: column nowrap;
  transition: background-color @transition-theme;
  background-color: @color-theme_2;
}
#toolbar, #player {
  flex: none;
}
#view {
  flex: auto;
  height: 0;
}

each(@themes, {
  #container.@{value} {
    background-color: ~'@{color-@{value}-theme}';
    background-image: ~'@{color-@{value}-theme-bgimg}';
    #right {
      background-color: ~'@{color-@{value}-theme_2}';
    }
  }
})
</style>

