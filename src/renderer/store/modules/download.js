import download from '../../utils/download'
import fs from 'fs'
import path from 'path'
import music from '../../utils/music'
import { getMusicType } from '../../utils/music/utils'
import { setMeta, saveLrc } from '../../utils'

// state
const state = {
  list: [],
  waitingList: [],
  downloadStatus: {
    RUN: 'run',
    WAITING: 'waiting',
    PAUSE: 'pause',
    ERROR: 'error',
    COMPLETED: 'completed',
  },
}


const dls = {}
const tryNum = {}

const filterFileName = /[\\/:*?#"<>|]/g

// getters
const getters = {
  list: state => state.list || [],
  dls: () => dls || {},
  downloadStatus: state => state.downloadStatus,
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

const checkList = (list, musicInfo, type, ext) => list.some(s => s.musicInfo.songmid === musicInfo.songmid && (s.type === type || s.ext === ext))

const getStartTask = (list, downloadStatus, maxDownloadNum) => {
  let downloadCount = 0
  const waitList = list.filter(item => item.status == downloadStatus.WAITING ? true : (item.status === downloadStatus.RUN && ++downloadCount && false))
  // console.log(downloadCount, waitList)
  return downloadCount < maxDownloadNum && waitList.length > 0 && waitList.shift()
}

const addTask = (list, type, store) => {
  window.requestAnimationFrame(() => {
    let item = list.shift()
    store.dispatch('download/createDownload', {
      musicInfo: item,
      type: getMusicType(item, type),
    })
    if (list.length) addTask(list, type, store)
  })
}

const getUrl = (downloadInfo, isRefresh) => {
  const url = downloadInfo.musicInfo.typeUrl[downloadInfo.type]
  if (!downloadInfo.musicInfo._types[downloadInfo.type]) {
    // 兼容旧版酷我源搜索列表过滤128k音质的bug
    if (!(downloadInfo.musicInfo.source == 'kw' && downloadInfo.type == '128k')) return Promise.reject(new Error('该歌曲没有可下载的音频'))

    // return Promise.reject(new Error('该歌曲没有可下载的音频'))
  }
  return url && !isRefresh ? Promise.resolve({ url }) : music[downloadInfo.musicInfo.source].getMusicUrl(downloadInfo.musicInfo, downloadInfo.type).promise
}

/**
 * 设置歌曲meta信息
 * @param {*} downloadInfo
 * @param {*} filePath
 * @param {*} isEmbedPic // 是否嵌入图片
 */
const saveMeta = (downloadInfo, filePath, isEmbedPic) => {
  if (downloadInfo.type === 'ape' || downloadInfo.type === 'flac') return
  const promise = isEmbedPic
    ? downloadInfo.musicInfo.img
      ? Promise.resolve(downloadInfo.musicInfo.img)
      : music[downloadInfo.musicInfo.source].getPic(downloadInfo.musicInfo).promise
    : Promise.resolve()
  promise.then(url => {
    setMeta(filePath, {
      title: downloadInfo.musicInfo.name,
      artist: downloadInfo.musicInfo.singer,
      album: downloadInfo.musicInfo.albumName,
      APIC: url,
    })
  })
}

/**
 * 保存歌词
 * @param {*} downloadInfo
 * @param {*} filePath
 */
const downloadLyric = (downloadInfo, filePath) => {
  const promise = downloadInfo.musicInfo.lrc
    ? Promise.resolve(downloadInfo.musicInfo.lrc)
    : music[downloadInfo.musicInfo.source].getLyric(downloadInfo.musicInfo).promise
  promise.then(lrc => {
    if (lrc) saveLrc(filePath.replace(/(mp3|flac|ape)$/, 'lrc'), lrc)
  })
}

const refreshUrl = function(commit, downloadInfo) {
  commit('setStatusText', { downloadInfo, text: '链接失效，正在刷新链接' })
  getUrl(downloadInfo, true).then(result => {
    commit('updateUrl', { downloadInfo, url: result.url })
    commit('setStatusText', { downloadInfo, text: '链接刷新成功' })
    const dl = dls[downloadInfo.key]
    if (!dl) return
    dl.refreshUrl(result.url)
    dl.start()
  }).catch(err => {
    console.log(err)
    this.dispatch('download/startTask')
  })
}

/**
 * 删除文件
 * @param {*} path
 */
const deleteFile = path => new Promise((resolve, reject) => {
  fs.access(path, fs.constants.F_OK, err => {
    if (err) return reject(err)
    fs.unlink(path, err => {
      if (err) return reject(err)
      resolve()
    })
  })
})


// actions
const actions = {
  createDownload({ state, rootState, commit }, { musicInfo, type }) {
    let ext = getExt(type)
    if (checkList(state.list, musicInfo, type, ext)) return
    const downloadInfo = {
      isComplate: false,
      status: state.downloadStatus.WAITING,
      statusText: '待下载',
      url: null,
      fileName: `${rootState.setting.download.fileName
        .replace('歌名', musicInfo.name)
        .replace('歌手', musicInfo.singer)}.${ext}`.replace(filterFileName, ''),
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
    commit('addTask', downloadInfo)
    try { // 删除同路径下的同名文件
      fs.unlinkSync(downloadInfo.filePath)
    } catch (err) {
      if (err.code !== 'ENOENT') return commit('setStatusText', { downloadInfo, text: '文件删除失败' })
    }
    if (dls[downloadInfo.key]) {
      dls[downloadInfo.key].stop().finally(() => {
        delete dls[downloadInfo.key]
        this.dispatch('download/startTask', downloadInfo)
      })
    } else {
      // console.log(downloadInfo)
      this.dispatch('download/startTask', downloadInfo)
    }
  },
  createDownloadMultiple({ state, rootState }, { list, type }) {
    addTask([...list], type, this)
  },
  startTask({ commit, state, rootState }, downloadInfo) {
    // 检查是否可以开始任务
    if (downloadInfo && downloadInfo != state.downloadStatus.WAITING) commit('setStatus', { downloadInfo, status: state.downloadStatus.WAITING })
    let result = getStartTask(state.list, state.downloadStatus, rootState.setting.download.maxDownloadNum)
    if (!result) return
    if (!downloadInfo) downloadInfo = result

    // 开始任务
    commit('onStart', downloadInfo)
    commit('setStatusText', { downloadInfo, text: '任务初始化中' })
    let msg = checkPath(rootState.setting.download.savePath)
    if (msg) return commit('setStatusText', '检查下载目录出错: ' + msg)
    const _this = this
    const options = {
      url: downloadInfo.url,
      path: rootState.setting.download.savePath,
      fileName: downloadInfo.fileName,
      method: 'get',
      override: true,
      onCompleted() {
        // if (downloadInfo.progress.progress != '100.00') {
        //   delete dls[downloadInfo.key]
        //   return this.dispatch('download/startTask', downloadInfo)
        // }
        commit('onCompleted', downloadInfo)
        _this.dispatch('download/startTask')
        const filePath = path.join(options.path, options.fileName)

        saveMeta(downloadInfo, filePath, rootState.setting.download.isEmbedPic)
        if (rootState.setting.download.isDownloadLrc) downloadLyric(downloadInfo, filePath)
        console.log('on complate')
      },
      onError(err) {
        // console.log(tryNum[downloadInfo.key])
        if (++tryNum[downloadInfo.key] > 2) {
          commit('onError', downloadInfo)
          _this.dispatch('download/startTask')
          return
        }
        if (err.code == 'ENOTFOUND') {
          refreshUrl.call(_this, commit, downloadInfo)
        } else {
          console.log('Download failed, Attempting Retry')
          dls[downloadInfo.key].start()
          commit('setStatusText', { downloadInfo, text: '正在重试' })
        }
      },
      onFail(response) {
        if (++tryNum[downloadInfo.key] > 2) {
          commit('onError', downloadInfo)
          _this.dispatch('download/startTask')
          return
        }
        switch (response.statusCode) {
          case 401:
          case 403:
          case 410:
            refreshUrl.call(_this, commit, downloadInfo)
        }
      },
      onStart() {
        commit('onStart', downloadInfo)
        console.log('on start')
      },
      onProgress(status) {
        commit('onProgress', { downloadInfo, status })
        console.log(status)
      },
      onStop() {
        commit('pauseTask', downloadInfo)
        _this.dispatch('download/startTask')
      },
    }
    commit('setStatusText', { downloadInfo, text: '获取URL中...' })
    let p = options.url ? Promise.resolve() : getUrl(downloadInfo).then(result => {
      commit('updateUrl', { downloadInfo, url: result.url })
      if (!result.url) return Promise.reject(new Error('获取URL失败'))
      options.url = result.url
    })
    p.then(() => {
      tryNum[downloadInfo.key] = 0
      dls[downloadInfo.key] = download(options)
    }).catch(err => {
      // console.log(err.message)
      commit('onError', downloadInfo)
      commit('setStatusText', { downloadInfo, text: err.message })
      this.dispatch('download/startTask')
    })
  },
  // startTaskMultiple({ state, rootState }, list) {

  // },
  removeTask({ commit, state }, index) {
    let info = state.list[index]
    if (state.list[index].status == state.downloadStatus.RUN) {
      if (dls[info.key]) {
        dls[info.key].stop().finally(() => {
          delete dls[info.key]
        })
      }
    }
    commit('removeTask', index)
    if (dls[info.key]) delete dls[info.key]
    ;(info.status != state.downloadStatus.COMPLETED ? deleteFile(info.filePath) : Promise.resolve()).finally(() => {
      this.dispatch('download/startTask')
    })
  },
  removeTaskMultiple({ commit, rootState, state }, list) {
    list.forEach(item => {
      let index = state.list.indexOf(item)
      if (index < 0) return
      // this.dispatch('download/removeTask', index)
      if (state.list[index].status == state.downloadStatus.RUN) {
        if (dls[item.key]) {
          dls[item.key].stop().finally(() => {
            delete dls[item.key]
          })
        }
      }
      commit('removeTask', index)
      if (dls[item.key]) delete dls[item.key]
    })
    let result = getStartTask(state.list, state.downloadStatus, rootState.setting.download.maxDownloadNum)
    while (result) {
      this.dispatch('download/startTask', result)
      result = getStartTask(state.list, state.downloadStatus, rootState.setting.download.maxDownloadNum)
    }
  },
}

// mitations
const mutations = {
  addTask(state, downloadInfo) {
    state.list.unshift(downloadInfo)
  },
  removeTask(state, index) {
    state.list.splice(index, 1)
  },
  pauseTask(state, downloadInfo) {
    downloadInfo.status = state.downloadStatus.PAUSE
    downloadInfo.statusText = '暂停下载'
  },
  setStatusText(state, { downloadInfo, index, text }) { // 设置状态文本
    if (downloadInfo) {
      downloadInfo.statusText = text
    } else {
      state.list[index].statusText = text
    }
  },
  setStatus(state, { downloadInfo, index, status }) { // 设置状态及状态文本
    let text
    switch (status) {
      case state.downloadStatus.RUN:
        text = '正在下载'
        break
      case state.downloadStatus.WAITING:
        text = '等待下载'
        break
      case state.downloadStatus.PAUSE:
        text = '暂停下载'
        break
      case state.downloadStatus.ERROR:
        text = '任务出错'
        break
      case state.downloadStatus.COMPLETED:
        text = '下载完成'
        break
    }
    if (downloadInfo) {
      downloadInfo.statusText = text
      downloadInfo.status = status
    } else {
      state.list[index].statusText = text
      state.list[index].status = status
    }
  },
  onCompleted(state, downloadInfo) {
    downloadInfo.isComplate = true
    downloadInfo.status = state.downloadStatus.COMPLETED
    downloadInfo.statusText = '下载完成'
  },
  onError(state, downloadInfo) {
    downloadInfo.status = state.downloadStatus.ERROR
    downloadInfo.statusText = '任务出错'
  },
  onStart(state, downloadInfo) {
    downloadInfo.status = state.downloadStatus.RUN
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
