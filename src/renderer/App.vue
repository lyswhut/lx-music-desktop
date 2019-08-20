<template lang="pug">
#container(v-if="isProd" :class="theme" @mouseenter="enableIgnoreMouseEvents" @mouseleave="dieableIgnoreMouseEvents")
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
window.ELECTRON_DISABLE_SECURITY_WARNINGS = process.env.ELECTRON_DISABLE_SECURITY_WARNINGS
const win = require('electron').remote.getCurrentWindow()
const body = document.body

export default {
  data() {
    return {
      isProd: process.env.NODE_ENV === 'production',
      globalObj: {
        apiSource: 'messoer',
      },
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
        console.log(n)
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
    ...mapMutations(['setNewVersion', 'setVersionVisible']),
    ...mapMutations('list', ['initDefaultList']),
    ...mapMutations('download', ['updateDownloadList']),
    ...mapMutations(['setSetting']),
    init() {
      if (this.isProd) {
        body.addEventListener('mouseenter', this.dieableIgnoreMouseEvents)
        body.addEventListener('mouseleave', this.enableIgnoreMouseEvents)
      }
      rendererOn('update-downloaded', () => {
        this.getVersionInfo().then(body => {
          this.setNewVersion(body)
          this.$nextTick(() => {
            this.setVersionVisible(true)
          })
        })
      })

      this.initData()
      this.globalObj.apiSource = this.setting.apiSource
      window.globalObj = this.globalObj
    },
    enableIgnoreMouseEvents() {
      win.setIgnoreMouseEvents(false)
      // console.log('content enable')
    },
    dieableIgnoreMouseEvents() {
      // console.log('content disable')
      win.setIgnoreMouseEvents(true, { forward: true })
    },

    initData() { // 初始化数据
      this.initPlayList() // 初始化播放列表
      this.initDownloadList() // 初始化下载列表
    },
    initPlayList() {
      let defaultList = this.electronStore.get('list.defaultList')
      console.log(defaultList)
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
  },
  beforeDestroy() {
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
  // background-color: #fff;
  padding: @shadow-app;
  user-select: none;
  height: 100vh;
  box-sizing: border-box;
}

#container {
  position: relative;
  display: flex;
  height: 100%;
  box-shadow: 0 0 @shadow-app rgba(0, 0, 0, 0.5);
  // background-color: #fff;
  border-radius: 4px;
  overflow: hidden;
}
#left {
  flex: none;
  width: @width-app-left;
}
#right {
  flex: auto;
  display: flex;
  flex-flow: column nowrap;
}
#toolbar, #player {
  flex: none;
}
#view {
  flex: auto;
  height: 0;
}
</style>

