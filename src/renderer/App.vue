<template lang="pug">
#container(v-if="isProd && !isNt" :class="theme" @mouseenter="enableIgnoreMouseEvents" @mouseleave="dieableIgnoreMouseEvents")
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
import dnscache from 'dnscache'
import { mapMutations, mapGetters, mapActions } from 'vuex'
import { rendererOn, rendererSend, rendererInvoke } from '../common/ipc'
import { isLinux } from '../common/utils'
import music from './utils/music'
import { throttle, openUrl } from './utils'
window.ELECTRON_DISABLE_SECURITY_WARNINGS = process.env.ELECTRON_DISABLE_SECURITY_WARNINGS
dnscache({
  enable: true,
  ttl: 21600,
  cachesize: 1000,
})

export default {
  data() {
    return {
      isProd: process.env.NODE_ENV === 'production',
      isNt: false,
      globalObj: {
        apiSource: 'test',
        proxy: {},
      },
      updateTimeout: null,
      envParams: {
        nt: false,
      },
    }
  },
  computed: {
    ...mapGetters(['setting', 'theme', 'version', 'windowSizeActive']),
    ...mapGetters('list', ['defaultList', 'loveList']),
    ...mapGetters('download', {
      downloadList: 'list',
      downloadStatus: 'downloadStatus',
    }),
    ...mapGetters('search', {
      searchHistoryList: 'historyList',
    }),
  },
  created() {
    this.saveSetting = throttle(n => {
      window.electronStore_config.set('setting', n)
    })
    this.saveDefaultList = throttle(n => {
      window.electronStore_list.set('defaultList', n)
    }, 500)
    this.saveLoveList = throttle(n => {
      window.electronStore_list.set('loveList', n)
    }, 500)
    this.saveDownloadList = throttle(n => {
      window.electronStore_list.set('downloadList', n)
    }, 1000)
    this.saveSearchHistoryList = throttle(n => {
      window.electronStore_data.set('searchHistoryList', n)
    }, 1000)
  },
  mounted() {
    document.body.classList.add(this.isNt ? 'noTransparent' : 'transparent')
    this.init()
  },
  watch: {
    setting: {
      handler(n) {
        this.saveSetting(n)
      },
      deep: true,
    },
    defaultList: {
      handler(n) {
        this.saveDefaultList(n)
      },
      deep: true,
    },
    loveList: {
      handler(n) {
        this.saveLoveList(n)
      },
      deep: true,
    },
    downloadList: {
      handler(n) {
        this.saveDownloadList(n)
      },
      deep: true,
    },
    searchHistoryList(n) {
      this.saveSearchHistoryList(n)
    },
    'globalObj.apiSource'(n) {
      if (n != this.setting.apiSource) {
        this.setSetting(Object.assign({}, this.setting, {
          apiSource: n,
        }))
      }
    },
    'windowSizeActive.fontSize'(n) {
      document.documentElement.style.fontSize = n
    },
  },
  methods: {
    ...mapActions(['getVersionInfo']),
    ...mapMutations(['setNewVersion', 'setVersionModalVisible', 'setDownloadProgress']),
    ...mapMutations('list', ['initList']),
    ...mapMutations('download', ['updateDownloadList']),
    ...mapMutations(['setSetting']),
    init() {
      document.documentElement.style.fontSize = this.windowSizeActive.fontSize

      rendererInvoke('getEnvParams').then(this.handleEnvParamsInit)

      document.body.addEventListener('click', this.handleBodyClick, true)
      rendererOn('update-available', (e, info) => {
        // this.showUpdateModal(true)
        // console.log(info)
        this.setVersionModalVisible({ isDownloading: true })
        this.getVersionInfo().catch(() => ({
          version: info.version,
          desc: info.releaseNotes,
        })).then(body => {
          // console.log(body)
          this.setNewVersion(body)
          this.$nextTick(() => {
            this.setVersionModalVisible({ isShow: true })
          })
        })
      })
      rendererOn('update-error', (event, err) => {
        // console.log(err)
        this.clearUpdateTimeout()
        this.setVersionModalVisible({ isError: true })
        this.$nextTick(() => {
          this.showUpdateModal()
        })
      })
      rendererOn('update-progress', (event, progress) => {
        // console.log(progress)
        this.setDownloadProgress(progress)
      })
      rendererOn('update-downloaded', info => {
        // console.log(info)
        this.clearUpdateTimeout()
        this.setVersionModalVisible({ isDownloaded: true })
        this.$nextTick(() => {
          this.showUpdateModal()
        })
      })
      rendererOn('update-not-available', (e, info) => {
        this.clearUpdateTimeout()
        this.setNewVersion({
          version: info.version,
          desc: info.releaseNotes,
        })
        this.setVersionModalVisible({ isLatestVer: true })
      })
      // 更新超时定时器
      this.updateTimeout = setTimeout(() => {
        this.updateTimeout = null
        this.setVersionModalVisible({ isTimeOut: true })
        this.$nextTick(() => {
          this.showUpdateModal()
        })
      }, 60 * 30 * 1000)

      this.initData()
      this.globalObj.apiSource = this.setting.apiSource
      this.globalObj.proxy = Object.assign({}, this.setting.network.proxy)
      window.globalObj = this.globalObj

      // 初始化音乐sdk
      music.init()
    },
    enableIgnoreMouseEvents() {
      if (this.isNt) return
      rendererSend('setIgnoreMouseEvents', false)
      // console.log('content enable')
    },
    dieableIgnoreMouseEvents() {
      if (this.isNt) return
      // console.log('content disable')
      rendererSend('setIgnoreMouseEvents', true)
    },

    initData() { // 初始化数据
      this.initPlayList() // 初始化播放列表
      this.initDownloadList() // 初始化下载列表
    },
    initPlayList() {
      let defaultList = window.electronStore_list.get('defaultList')
      let loveList = window.electronStore_list.get('loveList')
      this.initList({ defaultList, loveList })
    },
    initDownloadList() {
      let downloadList = window.electronStore_list.get('downloadList')
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
      (this.version.newVersion && this.version.newVersion.history
        ? Promise.resolve(this.version.newVersion)
        : this.getVersionInfo().then(body => {
          this.setNewVersion(body)
          return body
        })
      ).catch(() => {
        if (this.version.newVersion) return this.version.newVersion
        this.setVersionModalVisible({ isUnknow: true })
        let result = {
          version: '0.0.0',
          desc: null,
        }
        this.setNewVersion(result)
        return result
      }).then(result => {
        let newVer = result.version.replace(/\./g, '')
        let currentVer = this.version.version.replace(/\./g, '')
        let len = Math.max(newVer.length, currentVer.length)
        newVer.padStart(len, '0')
        currentVer.padStart(len, '0')
        if (parseInt(newVer) <= parseInt(currentVer)) return this.setVersionModalVisible({ isLatestVer: true })

        if (result.version === this.setting.ignoreVersion) return
        // console.log(this.version)
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
    handleBodyClick(event) {
      if (event.target.tagName != 'A') return
      if (event.target.host == window.location.host) return
      event.preventDefault()
      if (/^https?:\/\//.test(event.target.href)) openUrl(event.target.href)
    },
    handleEnvParamsInit(envParams) {
      this.envParams = envParams
      this.isNt = isLinux || this.envParams.nt
      if (this.isNt) {
        document.body.classList.remove('transparent')
        document.body.classList.add('noTransparent')
      }
      if (this.isProd && !this.isNt) {
        document.body.addEventListener('mouseenter', this.dieableIgnoreMouseEvents)
        document.body.addEventListener('mouseleave', this.enableIgnoreMouseEvents)
      }

      if (this.envParams.search != null) {
        this.$router.push({
          path: 'search',
          query: {
            text: this.envParams.search,
          },
        })
      }
    },
  },
  beforeDestroy() {
    this.clearUpdateTimeout()
    if (this.isProd) {
      document.body.removeEventListener('mouseenter', this.dieableIgnoreMouseEvents)
      document.body.removeEventListener('mouseleave', this.enableIgnoreMouseEvents)
    }
    document.body.removeEventListener('click', this.handleBodyClick)
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
  background: @color-theme-bgimg @color-theme-bgposition no-repeat;
  background-size: @color-theme-bgsize;
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
    background-size: ~'@{color-@{value}-theme-bgsize}';
    background-position: ~'@{color-@{value}-theme-bgposition}';
    #right {
      background-color: ~'@{color-@{value}-theme_2}';
    }
  }
})
</style>

