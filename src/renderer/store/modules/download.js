import download from '../../utils/download'
import fs from 'fs'
import path from 'path'
import music from '../../utils/music'

// state
const state = {
  list: [],
}

const dls = {}

// getters
const getters = {
  list: state => state.list || [],
  dls: () => dls || {},
}

const checkPath = path => {
  try {
    if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true })
  } catch (error) {
    return error.message
  }
  return false
}

const getExt = type => {
  switch (type) {
    case '128k':
    case '192k':
    case '320k':
      return 'mp3'
    case 'ape':
      return 'ape'
    case 'flac':
      return 'flac'
  }
}

const checkList = (list, musicInfo, type) => list.some(s => s.musicInfo.songmid === musicInfo.songmid && s.type === type)

const refreshUrl = downloadInfo => {
  return music[downloadInfo.musicInfo.source].getMusicUrl(downloadInfo.musicInfo, downloadInfo.type)
}

// actions
const actions = {
  createDownload({ state, rootState }, { musicInfo, type }) {
    if (checkList(state.list, musicInfo, type)) return
    let ext = getExt(type)
    const downloadInfo = {
      isComplate: false,
      isDownloading: false,
      statusText: '任务初始化中',
      url: null,
      fileName: `${rootState.setting.download.fileName
        .replace('歌名', musicInfo.name)
        .replace('歌手', musicInfo.singer)}.${ext}`,
      progress: {
        downloaded: 0,
        total: 0,
        progress: 0,
      },
      type,
      ext,
      musicInfo,
      key: `${musicInfo.songmid}${ext}`,
    }
    downloadInfo.filePath = path.join(rootState.setting.download.savePath, downloadInfo.fileName)
    if (dls[downloadInfo.key]) {
      dls[downloadInfo.key].stop().finally(() => {
        this.dispatch('download/addTask', downloadInfo)
      })
    } else {
      // console.log(downloadInfo)
      this.dispatch('download/addTask', downloadInfo)
    }
  },
  addTask({ commit, rootState }, downloadInfo) {
    commit('addTask', downloadInfo)
    let msg = checkPath(rootState.setting.download.savePath)
    if (msg) return commit('setStatusText', '检查下载目录出错: ' + msg)
    const options = {
      url: downloadInfo.url,
      path: rootState.setting.download.savePath,
      fileName: downloadInfo.fileName,
      method: 'get',
      override: true,
      onEnd() {
        commit('onEnd', downloadInfo)
        console.log('on complate')
      },
      onError(err) {
        console.log(err)
        if (err.message.includes('Response status was')) {
          const code = err.message.replace(/Response status was (\d+)$/, '$1')
          switch (code) {
            case '401':
            case '403':
            case '410':
              commit('setStatusText', { downloadInfo, text: '链接失效，正在刷新链接' })
              refreshUrl(downloadInfo).then(result => {
                commit('updateUrl', { downloadInfo, url: result.url })
                commit('setStatusText', { downloadInfo, text: '链接刷新成功' })
                dls[downloadInfo.key].url = dls[downloadInfo.key].requestURL = result.url
                dls[downloadInfo.key].__initProtocol(result.url)
                dls[downloadInfo.key].resume()
              }).catch(err => {
                console.log(err)
              })
              return

            default:
              break
          }
        }
        commit('onError', downloadInfo)
      },
      onStateChanged(state) {
        console.log(state)
      },
      onDownload() {
        commit('onDownload', downloadInfo)
        console.log('on download')
      },
      onProgress(status) {
        commit('onProgress', { downloadInfo, status })
        console.log(status)
      },
      onPause() {
        commit('pauseTask', downloadInfo)
      },
      onResume() {
        commit('resumeTask', downloadInfo)
      },
    }
    let p = options.url ? Promise.resolve() : refreshUrl(downloadInfo).then(result => {
      commit('updateUrl', { downloadInfo, url: result.url })
      options.url = result.url
    })
    p.then(() => {
      dls[downloadInfo.key] = download(options)
    })
  },
  removeTask({ commit, state }, index) {
    let info = state.list[index]
    if (state.list[index].isDownloading) {
      dls[info.key].stop().finally(() => {
        delete dls[info.key]
      })
    }
    commit('removeTask', index)
    if (dls[info.key]) delete dls[info.key]
  },
  resumeTask({ commit, rootState }, downloadInfo) {
    let msg = checkPath(rootState.setting.download.savePath)
    if (msg) return commit('setStatusText', '检查下载目录出错: ' + msg)
    const options = {
      url: downloadInfo.url,
      path: rootState.setting.download.savePath,
      fileName: downloadInfo.fileName,
      method: 'get',
      override: true,
      onEnd() {
        commit('onEnd', downloadInfo)
        console.log('on complate')
      },
      onError(err) {
        commit('onError', downloadInfo)
        commit('setStatusText', { downloadInfo, text: '链接失效，正在刷新链接' })
        refreshUrl(downloadInfo).then(result => {
          commit('updateUrl', { downloadInfo, url: result.url })
          commit('setStatusText', { downloadInfo, text: '链接刷新成功' })
          dls[downloadInfo.key].url = dls[downloadInfo.key].requestURL = result.url
          dls[downloadInfo.key].__initProtocol(result.url)
          dls[downloadInfo.key].resume()
        }).catch(err => {
          console.log(err)
        })
        console.log(err)
      },
      onStateChanged(state) {
        console.log(state)
      },
      onDownload() {
        commit('onDownload', downloadInfo)
        console.log('on download')
      },
      onProgress(status) {
        commit('onProgress', { downloadInfo, status })
        console.log(status)
      },
      onPause() {
        commit('pauseTask', downloadInfo)
      },
      onResume() {
        commit('resumeTask', downloadInfo)
      },
    }

    let p = options.url ? Promise.resolve() : refreshUrl(downloadInfo).then(result => {
      commit('updateUrl', { downloadInfo, url: result.url })
      options.url = result.url
    })

    if (fs.existsSync(downloadInfo.filePath)) {
      options.resumeInfo = {
        totalFileSize: downloadInfo.progress.total,
      }
    }
    p.then(() => {
      dls[downloadInfo.key] = download(options)
    })
  },
}

// mitations
const mutations = {
  addTask(state, downloadInfo) {
    state.list.push(downloadInfo)
  },
  removeTask(state, index) {
    state.list.splice(index, 1)
  },
  pauseTask(state, downloadInfo) {
    downloadInfo.isDownloading = false
  },
  resumeTask(state, downloadInfo) {
    downloadInfo.statusText = '恢复下载'
  },
  setStatusText(state, { downloadInfo, index, text }) {
    if (downloadInfo) {
      downloadInfo.statusText = text
    } else {
      state.list[index].statusText = text
    }
  },
  onEnd(state, downloadInfo) {
    downloadInfo.isComplate = true
    downloadInfo.isDownloading = false
    downloadInfo.statusText = '下载完成'
  },
  onError(state, downloadInfo) {
    downloadInfo.isDownloading = false
    downloadInfo.statusText = '任务出错'
  },
  onDownload(state, downloadInfo) {
    downloadInfo.isDownloading = true
    downloadInfo.statusText = '正在下载'
  },
  onProgress(state, { downloadInfo, status }) {
    downloadInfo.progress.progress = status.progress
    downloadInfo.progress.downloaded = status.downloaded
    downloadInfo.progress.total = status.total
  },
  setTotal(state, { order, downloadInfo }) {
    downloadInfo.order = order
  },
  updateDownloadList(state, list) {
    state.list = list
  },
  updateUrl(state, { downloadInfo, url }) {
    downloadInfo.url = url
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
