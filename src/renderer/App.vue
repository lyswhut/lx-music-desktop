<template lang="pug">
#container(v-if="isProd && !isDT && !isLinux" :class="theme" @mouseenter="enableIgnoreMouseEvents" @mouseleave="dieableIgnoreMouseEvents")
  core-aside#left
  #right
    core-toolbar#toolbar
    core-view#view
    core-player#player
  core-icons
  material-version-modal(v-show="version.showModal")
  material-pact-modal(v-show="!setting.isAgreePact || globalObj.isShowPact")
#container(v-else :class="theme")
  core-aside#left
  #right
    core-toolbar#toolbar
    core-view#view
    core-player#player
  core-icons
  material-version-modal(v-show="version.showModal")
  material-pact-modal(v-show="!setting.isAgreePact || globalObj.isShowPact")
</template>

<script>
import dnscache from 'dnscache'
import { mapMutations, mapGetters, mapActions } from 'vuex'
import { rendererOn, rendererSend, rendererInvoke, NAMES } from '../common/ipc'
import { isLinux } from '../common/utils'
import music from './utils/music'
import { throttle, openUrl, compareVer, getPlayList, parseUrlParams, saveSetting } from './utils'
import { base as eventBaseName } from './event/names'
import apiSourceInfo from './utils/music/api-source-info'

window.ELECTRON_DISABLE_SECURITY_WARNINGS = process.env.ELECTRON_DISABLE_SECURITY_WARNINGS
dnscache({
  enable: true,
  ttl: 21600,
  cachesize: 1000,
})

const listThrottle = (fn, delay = 100) => {
  let timer = null
  let _data = {}
  return function(data) {
    Object.assign(_data, data)
    if (timer) return
    timer = setTimeout(() => {
      timer = null
      fn.call(this, _data)
      _data = {}
    }, delay)
  }
}

export default {
  data() {
    return {
      isProd: process.env.NODE_ENV === 'production',
      isDT: false,
      isLinux,
      globalObj: {
        apiSource: null,
        proxy: {},
        isShowPact: false,
        qualityList: {},
        userApi: {
          list: [],
          status: false,
          message: 'initing',
          apis: {},
        },
      },
      updateTimeout: null,
      envParams: {
        nt: false,
      },
    }
  },
  computed: {
    ...mapGetters(['setting', 'theme', 'version', 'windowSizeActive']),
    ...mapGetters('list', ['defaultList', 'loveList', 'userList']),
    ...mapGetters('download', {
      downloadList: 'list',
      downloadStatus: 'downloadStatus',
    }),
    ...mapGetters('search', {
      searchHistoryList: 'historyList',
    }),
  },
  created() {
    this.saveMyList = listThrottle(data => {
      rendererSend(NAMES.mainWindow.save_playlist, {
        type: 'myList',
        data,
      })
    }, 300)
    this.saveDownloadList = throttle(n => {
      rendererSend(NAMES.mainWindow.save_playlist, {
        type: 'downloadList',
        data: n,
      })
    }, 1000)
    this.saveSearchHistoryList = throttle(n => {
      rendererSend(NAMES.mainWindow.save_data, {
        path: 'searchHistoryList',
        data: n,
      })
    }, 500)
  },
  mounted() {
    document.body.classList.add(this.isDT ? 'disableTransparent' : 'transparent')
    window.eventHub.$emit(eventBaseName.bindKey)
    this.init()
  },
  watch: {
    setting: {
      handler(n, o) {
        saveSetting(n)
      },
      deep: true,
    },
    defaultList: {
      handler(n) {
        this.saveMyList({ defaultList: n })
      },
      deep: true,
    },
    loveList: {
      handler(n) {
        this.saveMyList({ loveList: n })
      },
      deep: true,
    },
    userList: {
      handler(n) {
        this.saveMyList({ userList: n })
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
    'globalObj.apiSource'(n, o) {
      if (/^user_api/.test(n)) {
        this.globalObj.qualityList = {}
        this.globalObj.userApi.status = false
        this.globalObj.userApi.message = 'initing'
      } else {
        this.globalObj.qualityList = music.supportQuality[n]
      }
      if (o === null) return
      rendererInvoke(NAMES.mainWindow.set_user_api, n).catch(err => {
        console.log(err)
        let api = apiSourceInfo.find(api => !api.disabled)
        if (api) this.globalObj.apiSource = api.id
      })
      if (n != this.setting.apiSource) {
        this.setSetting(Object.assign({}, this.setting, {
          apiSource: n,
        }))
      }
    },
    'globalObj.proxy.enable'(n, o) {
      if (n != this.setting.network.proxy.enable) {
        this.setSetting({
          ...this.setting,
          network: {
            ...this.setting.network,
            proxy: {
              ...this.setting.network.proxy,
              enable: n,
            },
          },
        })
      }
    },
    'windowSizeActive.fontSize'(n) {
      document.documentElement.style.fontSize = n
    },
    'setting.isShowAnimation': {
      handler(n) {
        if (n) {
          if (document.body.classList.contains('disableAnimation')) {
            document.body.classList.remove('disableAnimation')
          }
        } else {
          if (!document.body.classList.contains('disableAnimation')) {
            document.body.classList.add('disableAnimation')
          }
        }
      },
      immediate: true,
    },
  },
  methods: {
    ...mapActions(['getVersionInfo']),
    ...mapMutations(['setNewVersion', 'setVersionModalVisible', 'setDownloadProgress', 'setSetting', 'setDesktopLyricConfig']),
    ...mapMutations('list', ['initList']),
    ...mapMutations('download', ['updateDownloadList']),
    ...mapMutations('search', {
      setSearchHistoryList: 'setHistory',
    }),
    ...mapMutations('player', {
      setPlayList: 'setList',
    }),
    ...mapActions('songList', ['getListDetailAll']),
    init() {
      document.documentElement.style.fontSize = this.windowSizeActive.fontSize

      const asyncTask = []
      asyncTask.push(rendererInvoke(NAMES.mainWindow.get_env_params).then(this.handleEnvParamsInit))

      document.body.addEventListener('click', this.handleBodyClick, true)
      rendererOn(NAMES.mainWindow.update_available, (e, info) => {
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
      rendererOn(NAMES.mainWindow.update_error, (event, err) => {
        // console.log(err)
        this.clearUpdateTimeout()
        this.setVersionModalVisible({ isError: true })
        this.$nextTick(() => {
          this.showUpdateModal()
        })
      })
      rendererOn(NAMES.mainWindow.update_progress, (event, progress) => {
        // console.log(progress)
        this.setDownloadProgress(progress)
      })
      rendererOn(NAMES.mainWindow.update_downloaded, info => {
        // console.log(info)
        this.clearUpdateTimeout()
        this.setVersionModalVisible({ isDownloaded: true })
        this.$nextTick(() => {
          this.showUpdateModal()
        })
      })
      rendererOn(NAMES.mainWindow.update_not_available, (event, info) => {
        this.clearUpdateTimeout()
        this.setNewVersion({
          version: info.version,
          desc: info.releaseNotes,
        })
        this.setVersionModalVisible({ isLatestVer: true })
      })

      rendererOn(NAMES.mainWindow.set_config, (event, config) => {
        console.log(config)
        // this.setDesktopLyricConfig(config)
        // console.log('set_config', JSON.stringify(this.setting) === JSON.stringify(config))
        this.setSetting(Object.assign({}, this.setting, config))
        window.eventHub.$emit(eventBaseName.set_config, config)
      })
      // 更新超时定时器
      this.updateTimeout = setTimeout(() => {
        this.updateTimeout = null
        this.setVersionModalVisible({ isTimeOut: true })
        this.$nextTick(() => {
          this.showUpdateModal()
        })
      }, 60 * 30 * 1000)

      this.listenEvent()
      asyncTask.push(this.initData())
      asyncTask.push(this.initUserApi())
      this.globalObj.apiSource = this.setting.apiSource
      if (/^user_api/.test(this.setting.apiSource)) {
        rendererInvoke(NAMES.mainWindow.set_user_api, this.setting.apiSource)
      } else {
        this.globalObj.qualityList = music.supportQuality[this.setting.apiSource]
      }
      this.globalObj.proxy = Object.assign({}, this.setting.network.proxy)
      window.globalObj = this.globalObj

      // 初始化音乐sdk
      asyncTask.push(music.init())
      Promise.all(asyncTask).then(() => {
        this.handleInitEnvParamSearch()
        this.handleInitEnvParamPlay()
      })
    },
    enableIgnoreMouseEvents() {
      if (this.isDT) return
      rendererSend(NAMES.mainWindow.set_ignore_mouse_events, false)
      // console.log('content enable')
    },
    dieableIgnoreMouseEvents() {
      if (this.isDT) return
      // console.log('content disable')
      rendererSend(NAMES.mainWindow.set_ignore_mouse_events, true)
    },

    initData() { // 初始化数据
      return Promise.all([
        this.initMyList(), // 初始化播放列表
        this.initSearchHistoryList(), // 初始化搜索历史列表
      ])
      // this.initDownloadList() // 初始化下载列表
    },
    initMyList() {
      return getPlayList().then(({ defaultList, loveList, userList, downloadList }) => {
        if (!defaultList) defaultList = this.defaultList
        if (!loveList) loveList = this.loveList
        if (userList) {
          let needSave = false
          const getListId = id => id.includes('.') ? getListId(id.substring(0, id.lastIndexOf('_'))) : id
          userList.forEach(l => {
            if (!l.id.includes('__') || l.source) return
            let [source, id] = l.id.split('__')
            id = getListId(id)
            l.source = source
            l.sourceListId = id
            if (!needSave) needSave = true
          })
          if (needSave) this.saveMyList({ userList })
        } else {
          userList = this.userList
        }

        if (!defaultList.list) defaultList.list = []
        if (!loveList.list) loveList.list = []
        this.initList({ defaultList, loveList, userList })
        this.initDownloadList(downloadList) // 初始化下载列表
        this.initPlayInfo()
      })
    },
    initDownloadList(downloadList) {
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
    initSearchHistoryList() {
      rendererInvoke(NAMES.mainWindow.get_data, 'searchHistoryList').then(historyList => {
        if (historyList == null) {
          historyList = []
          rendererSend(NAMES.mainWindow.save_data, { path: 'searchHistoryList', data: historyList })
        } else {
          this.setSearchHistoryList(historyList)
        }
      })
    },
    initPlayInfo() {
      rendererInvoke(NAMES.mainWindow.get_data, 'playInfo').then(info => {
        // console.log(info, window.allList)
        window.restorePlayInfo = null
        if (!info) return
        if (info.index < 0) return
        if (info.listId) {
          const list = window.allList[info.listId]
          // console.log(list)
          if (!list || !list.list[info.index]) return
          info.list = list.list
        }

        window.restorePlayInfo = info
        this.setPlayList({
          list: {
            list: info.list,
            id: info.listId,
          },
          index: info.index,
        })
      })
    },
    initUserApi() {
      return Promise.all([
        rendererOn(NAMES.mainWindow.user_api_status, (event, { status, message, apiInfo }) => {
          // console.log(apiInfo)
          this.globalObj.userApi.status = status
          this.globalObj.userApi.message = message
          if (status) {
            if (apiInfo.id === this.setting.apiSource) {
              let apis = {}
              let qualitys = {}
              for (const [source, { actions, type, qualitys: sourceQualitys }] of Object.entries(apiInfo.sources)) {
                if (type != 'music') continue
                apis[source] = {}
                for (const action of actions) {
                  switch (action) {
                    case 'musicUrl':
                      apis[source].getMusicUrl = (songInfo, type) => {
                        const requestKey = `request__${Math.random().toString().substring(2)}`
                        return {
                          canceleFn() {
                            rendererInvoke(NAMES.mainWindow.request_user_api_cancel, requestKey)
                          },
                          promise: rendererInvoke(NAMES.mainWindow.request_user_api, {
                            requestKey,
                            data: {
                              source: source,
                              action: 'musicUrl',
                              info: {
                                type,
                                musicInfo: songInfo,
                              },
                            },
                          }).then(res => {
                            // console.log(res)
                            if (!/^https?:/.test(res.data.url)) return Promise.reject(new Error('Get url failed'))
                            return { type, url: res.data.url }
                          }).catch(err => {
                            console.log(err.message)
                            return Promise.reject(err)
                          }),
                        }
                      }
                      break

                    default:
                      break
                  }
                }
                qualitys[source] = sourceQualitys
              }
              this.globalObj.qualityList = qualitys
              this.globalObj.userApi.apis = apis
            }
          }
        }),
        rendererInvoke(NAMES.mainWindow.get_user_api_list).then(res => {
          // console.log(res)
          if (![...apiSourceInfo.map(s => s.id), ...res.map(s => s.id)].includes(this.setting.apiSource)) {
            console.warn('reset api')
            let api = apiSourceInfo.find(api => !api.disabled)
            if (api) this.globalObj.apiSource = api.id
          }
          this.globalObj.userApi.list = res
        }),
      ])
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
        if (result.version == '0.0.0') return this.setVersionModalVisible({ isUnknow: true, isShow: true })
        if (compareVer(this.version.version, result.version) != -1) return this.setVersionModalVisible({ isLatestVer: true })

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
      this.isDT = this.envParams.dt
      if (this.isDT) {
        document.body.classList.remove('transparent')
        document.body.classList.add('disableTransparent')
      }
      if (this.isProd && !this.isDT && !this.isLinux) {
        document.body.addEventListener('mouseenter', this.dieableIgnoreMouseEvents)
        document.body.addEventListener('mouseleave', this.enableIgnoreMouseEvents)
      }
      this.handleInitEnvParamSearch()
      this.handleInitEnvParamPlay()
    },
    // 处理启动参数 search
    handleInitEnvParamSearch() {
      if (this.envParams.search == null) return
      this.$router.push({
        path: 'search',
        query: {
          text: this.envParams.search,
        },
      })
    },
    // 处理启动参数 play
    handleInitEnvParamPlay() {
      if (this.envParams.play == null || typeof this.envParams.play != 'string') return
      // -play="source=kw&link=链接、ID"
      // -play="source=myList&name=名字"
      // -play="source=myList&name=名字&index=位置"
      const params = parseUrlParams(this.envParams.play)
      if (params.type != 'songList') return
      this.handlePlaySongList(params)
    },
    handlePlaySongList(params) {
      switch (params.source) {
        case 'myList':
          if (params.name != null) {
            let targetList
            const lists = Object.values(window.allList)
            for (const list of lists) {
              if (list.name === params.name) {
                targetList = list
                break
              }
            }
            if (!targetList) return


            this.setPlayList({
              list: {
                list: targetList.list,
                id: targetList.id,
              },
              index: this.getListPlayIndex(targetList.list, params.index),
            })
          }
          break
        case 'kw':
        case 'kg':
        case 'tx':
        case 'mg':
        case 'wy':
          this.playSongListDetail(params.source, params.link, params.index)
          break
      }
    },
    async playSongListDetail(source, link, playIndex) {
      if (link == null) return
      let list
      try {
        list = await this.getListDetailAll({ source, id: decodeURIComponent(link) })
      } catch (err) {
        console.log(err)
      }
      this.setPlayList({
        list: {
          list,
          id: null,
        },
        index: this.getListPlayIndex(list, playIndex),
      })
    },
    getListPlayIndex(list, index) {
      if (index == null) {
        index = 1
      } else {
        index = parseInt(index)
        if (Number.isNaN(index)) {
          index = 1
        } else {
          if (index < 1) index = 1
          else if (index > list.length) index = list.length
        }
      }
      return index - 1
    },
    listenEvent() {
      window.eventHub.$on('key_escape_down', this.handle_key_esc_down)
    },
    unlistenEvent() {
      window.eventHub.$off('key_escape_down', this.handle_key_esc_down)
    },
    handle_key_esc_down({ event }) {
      if (event.repeat) return
      if (event.target.tagName != 'INPUT' || event.target.classList.contains('ignore-esc')) return
      event.target.value = ''
      event.target.blur()
    },
  },
  beforeDestroy() {
    this.clearUpdateTimeout()
    this.unlistenEvent()
    if (this.isProd) {
      document.body.removeEventListener('mouseenter', this.dieableIgnoreMouseEvents)
      document.body.removeEventListener('mouseleave', this.enableIgnoreMouseEvents)
    }
    document.body.removeEventListener('click', this.handleBodyClick)
    window.eventHub.$emit(eventBaseName.unbindKey)
  },
}
</script>

<style lang="less">
@import './assets/styles/index.less';
@import './assets/styles/layout.less';

html, body {
  overflow: hidden;
}

body {
  user-select: none;
  height: 100vh;
  box-sizing: border-box;
}

.disableAnimation * {
  transition: none !important;
  animation: none !important;
}

.transparent {
  padding: @shadow-app;
  #container {
    box-shadow: 0 0 @shadow-app rgba(0, 0, 0, 0.5);
    border-radius: @radius-border;
    background-color: transparent;
  }
}
.disableTransparent {
  background-color: #fff;

  #right {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }

  #view { // 偏移5px距离解决非透明模式下右侧滚动条无法拖动的问题
    margin-right: 5Px;
  }
}

#container {
  position: relative;
  display: flex;
  height: 100%;
  overflow: hidden;
  color: @color-theme_2-font;
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

  border-top-left-radius: @radius-border;
  border-bottom-left-radius: @radius-border;
  overflow: hidden;
  box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.1);
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
    color: ~'@{color-@{value}-theme_2-font}';
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

