import download from '../../utils/download'
import fs from 'fs'
import path from 'path'
import music from '../../utils/music'
import { getMusicType } from '../../utils/music/utils'
import {
  setMeta,
  saveLrc,
  getLyric as getLyricFromStorage,
  setLyric,
  getMusicUrl as getMusicUrlFormStorage,
  setMusicUrl,
  assertApiSupport,
  filterFileName,
} from '../../utils'
import { NAMES, rendererInvoke } from '@common/ipc'

window.downloadList = []
window.downloadListFull = []
window.downloadListFullMap = new Map()
// state
const state = {
  list: window.downloadList,
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


// getters
const getters = {
  list: state => state.list || [],
  downloadStatus: state => state.downloadStatus,
}

const checkPath = path => new Promise((resolve, reject) => {
  fs.access(path, fs.constants.F_OK | fs.constants.W_OK, err => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.mkdir(path, { recursive: true }, err => {
          if (err) return reject(err)
          resolve()
        })
        return
      }
      return reject(err)
    }
    resolve()
  })
})

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
    case 'wav':
      return 'wav'
  }
}

const checkList = (list, musicInfo, type, ext) => list.some(s => s.songmid === musicInfo.songmid && (s.type === type || s.ext === ext))

const getStartTask = (list, downloadStatus, maxDownloadNum) => {
  let downloadCount = 0
  const waitList = list.filter(item => item.status == downloadStatus.WAITING ? true : (item.status === downloadStatus.RUN && ++downloadCount && false))
  // console.log(downloadCount, waitList)
  return downloadCount < maxDownloadNum ? waitList.shift() || null : false
}

const handleGetMusicUrl = function(musicInfo, type, retryedSource = [], originMusic) {
  // console.log(musicInfo.source)
  if (!originMusic) originMusic = musicInfo
  let reqPromise
  try {
    reqPromise = music[musicInfo.source].getMusicUrl(musicInfo, type).promise
  } catch (err) {
    reqPromise = Promise.reject(err)
  }
  return reqPromise.catch(err => {
    if (!retryedSource.includes(musicInfo.source)) retryedSource.push(musicInfo.source)
    return this.dispatch('list/getOtherSource', originMusic).then(otherSource => {
      console.log('find otherSource', otherSource)
      if (otherSource.length) {
        for (const item of otherSource) {
          if (retryedSource.includes(item.source) || !assertApiSupport(item.source)) continue
          console.log('try toggle to: ', item.source, item.name, item.singer, item.interval)
          return handleGetMusicUrl.call(this, item, type, retryedSource, originMusic)
        }
      }
      return Promise.reject(err)
    })
  })
}

const getMusicUrl = async function(downloadInfo, isUseOtherSource, isRefresh) {
  downloadInfo = window.downloadListFullMap.get(downloadInfo.key)
  const cachedUrl = await getMusicUrlFormStorage(downloadInfo.musicInfo, downloadInfo.type)
  if (!downloadInfo.musicInfo._types[downloadInfo.type]) {
    // 兼容旧版酷我源搜索列表过滤128k音质的bug
    if (!(downloadInfo.musicInfo.source == 'kw' && downloadInfo.type == '128k')) throw new Error('该歌曲没有可下载的音频')

    // return Promise.reject(new Error('该歌曲没有可下载的音频'))
  }
  return cachedUrl && !isRefresh
    ? cachedUrl
    : (
        isUseOtherSource
          ? handleGetMusicUrl.call(this, downloadInfo.musicInfo, downloadInfo.type)
          : music[downloadInfo.musicInfo.source].getMusicUrl(downloadInfo.musicInfo, downloadInfo.type).promise
      ).then(({ url }) => {
        setMusicUrl(downloadInfo.musicInfo, downloadInfo.type, url)
        return url
      })
}
const getPic = function(musicInfo, retryedSource = [], originMusic) {
  // console.log(musicInfo.source)
  if (!originMusic) originMusic = musicInfo
  let reqPromise
  try {
    reqPromise = music[musicInfo.source].getPic(musicInfo).promise
  } catch (err) {
    reqPromise = Promise.reject(err)
  }
  return reqPromise.catch(err => {
    if (!retryedSource.includes(musicInfo.source)) retryedSource.push(musicInfo.source)
    return this.dispatch('list/getOtherSource', originMusic).then(otherSource => {
      console.log('find otherSource', otherSource)
      if (otherSource.length) {
        for (const item of otherSource) {
          if (retryedSource.includes(item.source)) continue
          console.log('try toggle to: ', item.source, item.name, item.singer, item.interval)
          return getPic.call(this, item, retryedSource, originMusic)
        }
      }
      return Promise.reject(err)
    })
  })
}

const handleGetLyric = function(musicInfo, retryedSource = [], originMusic) {
  if (!originMusic) originMusic = musicInfo
  let reqPromise
  try {
    reqPromise = music[musicInfo.source].getLyric(musicInfo).promise
  } catch (err) {
    reqPromise = Promise.reject(err)
  }
  return reqPromise.catch(err => {
    if (!retryedSource.includes(musicInfo.source)) retryedSource.push(musicInfo.source)
    return this.dispatch('list/getOtherSource', originMusic).then(otherSource => {
      console.log('find otherSource', otherSource)
      if (otherSource.length) {
        for (const item of otherSource) {
          if (retryedSource.includes(item.source)) continue
          console.log('try toggle to: ', item.source, item.name, item.singer, item.interval)
          return getLyric.call(this, item, retryedSource, originMusic)
        }
      }
      return Promise.reject(err)
    })
  })
}

const getLyric = function(musicInfo, isUseOtherSource) {
  return getLyricFromStorage(musicInfo).then(lrcInfo => {
    return (
      lrcInfo.lyric
        ? Promise.resolve({ lyric: lrcInfo.lyric, tlyric: lrcInfo.tlyric || '' })
        : (
            isUseOtherSource
              ? handleGetLyric.call(this, musicInfo)
              : music[musicInfo.source].getLyric(musicInfo).promise
          ).then(({ lyric, tlyric, lxlyric }) => {
            setLyric(musicInfo, { lyric, tlyric, lxlyric })
            return { lyric, tlyric, lxlyric }
          }).catch(err => {
            console.log(err)
            return null
          })
    ).then(lrcs => {
      if (!lrcs) return lrcs
      if (global.i18n.locale != 'zh-tw') return lrcs
      return rendererInvoke(NAMES.mainWindow.lang_s2t, Buffer.from(lrcs.lyric).toString('base64')).then(b64 => Buffer.from(b64, 'base64').toString()).then(lyric => {
        lrcs.lyric = lyric
        return lrcs
      })
    })
  })
}

// 修复 1.1.x版本 酷狗源歌词格式
const fixKgLyric = lrc => /\[00:\d\d:\d\d.\d+\]/.test(lrc) ? lrc.replace(/(?:\[00:(\d\d:\d\d.\d+\]))/gm, '[$1') : lrc

/**
 * 设置歌曲meta信息
 * @param {*} downloadInfo
 * @param {*} filePath
 * @param {*} isEmbedPic // 是否嵌入图片
 */
const saveMeta = function(downloadInfo, filePath, isUseOtherSource, isEmbedPic, isEmbedLyric) {
  if (downloadInfo.type === 'ape') return
  downloadInfo = window.downloadListFullMap.get(downloadInfo.key)
  const tasks = [
    isEmbedPic
      ? downloadInfo.musicInfo.img
        ? Promise.resolve(downloadInfo.musicInfo.img)
        : (
            isUseOtherSource
              ? getPic.call(this, downloadInfo.musicInfo)
              : music[downloadInfo.musicInfo.source].getPic(downloadInfo.musicInfo).promise
          ).catch(err => {
            console.log(err)
            return null
          })
      : Promise.resolve(),
    isEmbedLyric
      ? getLyric.call(this, downloadInfo.musicInfo, isUseOtherSource)
      : Promise.resolve(),
  ]
  Promise.all(tasks).then(([imgUrl, lyrics = {}]) => {
    if (lyrics.lyric) lyrics.lyric = fixKgLyric(lyrics.lyric)
    setMeta(filePath, {
      title: downloadInfo.musicInfo.name,
      artist: downloadInfo.musicInfo.singer,
      album: downloadInfo.musicInfo.albumName,
      APIC: imgUrl,
      lyrics: lyrics.lyric,
    })
  })
}

/**
 * 保存歌词
 * @param {*} downloadInfo
 * @param {*} filePath
 */
const downloadLyric = function(downloadInfo, isUseOtherSource, filePath, lrcFormat) {
  downloadInfo = window.downloadListFullMap.get(downloadInfo.key)
  getLyric.call(this, downloadInfo.musicInfo, isUseOtherSource).then(lrcs => {
    if (lrcs?.lyric) {
      lrcs.lyric = fixKgLyric(lrcs.lyric)
      saveLrc(filePath.replace(/(mp3|flac|ape|wav)$/, 'lrc'), lrcs.lyric, lrcFormat)
    }
  })
}

const refreshUrl = function(commit, downloadInfo, isUseOtherSource) {
  commit('setStatusText', { downloadInfo, text: '链接失效，正在刷新链接' })
  getMusicUrl.call(this, downloadInfo, isUseOtherSource, true).then(url => {
    commit('updateUrl', { downloadInfo, url })
    commit('setStatusText', { downloadInfo, text: '链接刷新成功' })
    const dl = dls[downloadInfo.key]
    if (!dl) return
    dl.refreshUrl(url)
    dl.start().catch(err => {
      commit('onError', { downloadInfo, errorMsg: err.message })
      commit('setStatusText', { downloadInfo, text: err.message })
      this.dispatch('download/startTask')
    })
  }).catch(err => {
    // console.log(err)
    commit('onError', { downloadInfo, errorMsg: err.message })
    commit('setStatusText', { downloadInfo, text: err.message })
    this.dispatch('download/startTask')
  })
}

/**
 * 删除文件
 * @param {*} path
 */
const deleteFile = path => new Promise((resolve, reject) => {
  fs.access(path, fs.constants.F_OK, err => {
    if (err) return err.code == 'ENOENT' ? resolve() : reject(err)
    fs.unlink(path, err => {
      if (err) return reject(err)
      resolve()
    })
  })
})

const createDownloadInfo = ({ musicInfo, type, list, fileName, savePath }) => {
  type = getMusicType(musicInfo, type)
  let ext = getExt(type)
  const key = `${musicInfo.songmid}${ext}`
  if (checkList(list, musicInfo, type, ext)) return null
  const downloadInfo = {
    isComplate: false,
    status: state.downloadStatus.WAITING,
    statusText: '待下载',
    url: null,
    songmid: musicInfo.songmid,
    fileName: filterFileName(`${fileName
      .replace('歌名', musicInfo.name)
      .replace('歌手', musicInfo.singer)}.${ext}`),
    progress: {
      downloaded: 0,
      total: 0,
      progress: 0,
    },
    type,
    ext,
    name: `${musicInfo.name} - ${musicInfo.singer}`,
    key,
  }
  downloadInfo.filePath = path.join(savePath, downloadInfo.fileName)
  // commit('addTask', downloadInfo)

  // 删除同路径下的同名文件
  deleteFile(downloadInfo.filePath)
  // .catch(err => {
  //   if (err.code !== 'ENOENT') return commit('setStatusText', { downloadInfo, text: '文件删除失败' })
  // })

  if (dls[downloadInfo.key]) {
    const dl = dls[downloadInfo.key]
    delete dls[downloadInfo.key]
    dl.stop()
  }

  return downloadInfo
}

// let waitingUpdateTasks = {}
// const delayUpdateProgress = throttle(function(commit) {
//   commit('setProgressDelay')
// }, 1000)


// actions
const actions = {
  async createDownload({ state, rootState, commit, dispatch }, { musicInfo, type }) {
    const downloadInfo = createDownloadInfo({
      musicInfo,
      type,
      fileName: rootState.setting.download.fileName,
      savePath: rootState.setting.download.savePath,
      list: state.list,
    })
    if (!downloadInfo) return
    commit('addTask', { downloadInfo, musicInfo, addMusicLocationType: rootState.setting.list.addMusicLocationType })
    let result = getStartTask(state.list, state.downloadStatus, rootState.setting.download.maxDownloadNum)
    while (result) {
      dispatch('startTask', result)
      result = getStartTask(state.list, state.downloadStatus, rootState.setting.download.maxDownloadNum)
    }
  },
  createDownloadMultiple({ state, rootState, commit, dispatch }, { list, type }) {
    if (!list.length) return
    const downloadList = []
    for (const musicInfo of list) {
      const downloadInfo = createDownloadInfo({
        musicInfo,
        type,
        fileName: rootState.setting.download.fileName,
        savePath: rootState.setting.download.savePath,
        list: state.list,
      })
      if (downloadInfo) downloadList.push({ downloadInfo, musicInfo })
    }
    commit('addTasks', { list: downloadList, addMusicLocationType: rootState.setting.list.addMusicLocationType })
    let result = getStartTask(state.list, state.downloadStatus, rootState.setting.download.maxDownloadNum)
    while (result) {
      dispatch('startTask', result)
      result = getStartTask(state.list, state.downloadStatus, rootState.setting.download.maxDownloadNum)
    }
  },
  async handleStartTask({ commit, dispatch, rootState }, downloadInfo) {
    // 开始任务
    commit('onStart', downloadInfo)
    commit('setStatusText', { downloadInfo, text: '任务初始化中' })
    try {
      await checkPath(rootState.setting.download.savePath)
    } catch (error) {
      commit('onError', { downloadInfo, errorMsg: error.message })
      commit('setStatusText', { downloadInfo, text: '检查下载目录出错: ' + error.message })
      await dispatch('startTask')
      return
    }
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
        //   return dispatch('startTask', downloadInfo)
        // }
        commit('onCompleted', downloadInfo)
        dispatch('startTask')

        saveMeta.call(_this, downloadInfo, downloadInfo.filePath, rootState.setting.download.isUseOtherSource, rootState.setting.download.isEmbedPic, rootState.setting.download.isEmbedLyric)
        if (rootState.setting.download.isDownloadLrc) downloadLyric.call(_this, downloadInfo, rootState.setting.download.isUseOtherSource, downloadInfo.filePath, rootState.setting.download.lrcFormat)
        console.log('on complate')
      },
      onError(err) {
        console.log(err)
        if (err.code == 'EPERM') {
          commit('onError', { downloadInfo, errorMsg: '歌曲保存位置被占用或没有写入权限，请尝试更改歌曲保存目录或重启软件或重启电脑，错误详情：' + err.message })
          return
        }
        // console.log(tryNum[downloadInfo.key])
        if (++tryNum[downloadInfo.key] > 2) {
          commit('onError', { downloadInfo, errorMsg: err.message })
          dispatch('startTask')
          return
        }
        if (err.code == 'ENOTFOUND') {
          commit('onError', { downloadInfo, errorMsg: '链接失效' })
          refreshUrl.call(_this, commit, downloadInfo, rootState.setting.download.isUseOtherSource)
        } else {
          console.log('Download failed, Attempting Retry')
          dls[downloadInfo.key].start()
          commit('setStatusText', { downloadInfo, text: '正在重试' })
        }
      },
      onFail(response) {
        if (++tryNum[downloadInfo.key] > 2) {
          commit('onError', { downloadInfo, errorMsg: '下载失败' })
          dispatch('startTask')
          return
        }
        switch (response.statusCode) {
          case 401:
          case 403:
          case 410:
            commit('onError', { downloadInfo, errorMsg: '链接失效' })
            refreshUrl.call(_this, commit, downloadInfo, rootState.setting.download.isUseOtherSource)
            break
          default:
            dls[downloadInfo.key].start()
            commit('setStatusText', { downloadInfo, text: '正在重试' })
            break
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
        dispatch('startTask')
      },
    }
    commit('setStatusText', { downloadInfo, text: '获取URL中...' })
    let p = options.url
      ? Promise.resolve()
      : getMusicUrl.call(this, downloadInfo, rootState.setting.download.isUseOtherSource).then(url => {
        commit('updateUrl', { downloadInfo, url })
        if (!url) return Promise.reject(new Error('获取URL失败'))
        options.url = url
      })
    p.then(() => {
      tryNum[downloadInfo.key] = 0
      dls[downloadInfo.key] = download(options)
    }).catch(err => {
      // console.log(err.message)
      commit('onError', { downloadInfo, errorMsg: err.message })
      commit('setStatusText', { downloadInfo, text: err.message })
      dispatch('startTask')
    })
  },
  async removeTask({ commit, state, dispatch }, item) {
    if (dls[item.key]) {
      if (item.status == state.downloadStatus.RUN) {
        try {
          await dls[item.key].stop()
        } catch (_) {}
      }
      delete dls[item.key]
    }
    commit('removeTask', item)
    if (item.status != state.downloadStatus.COMPLETED) {
      try {
        await deleteFile(item.filePath)
      } catch (_) {}
    }
    switch (item.status) {
      case state.downloadStatus.RUN:
      case state.downloadStatus.WAITING:
        await dispatch('startTask')
    }
  },
  removeTasks({ rootState, commit, dispatch }, list) {
    for (const item of list) {
      if (dls[item.key]) {
        if (item.status == state.downloadStatus.RUN) {
          dls[item.key].stop().finally(() => {
            delete dls[item.key]
          })
        } else {
          delete dls[item.key]
        }
      }
      if (item.status != state.downloadStatus.COMPLETED) {
        deleteFile(item.filePath).catch(_ => _)
      }
    }
    commit('removeTasks', list)
    let result = getStartTask(state.list, state.downloadStatus, rootState.setting.download.maxDownloadNum)
    while (result) {
      dispatch('startTask', result)
      result = getStartTask(state.list, state.downloadStatus, rootState.setting.download.maxDownloadNum)
    }
  },
  async startTask({ state, rootState, commit, dispatch }, downloadInfo) {
    // 检查是否可以开始任务
    if (downloadInfo && !downloadInfo.isComplate && downloadInfo.status != state.downloadStatus.RUN) {
      const result = getStartTask(state.list, state.downloadStatus, rootState.setting.download.maxDownloadNum)
      if (result === false) {
        commit('setStatus', { downloadInfo, status: state.downloadStatus.WAITING })
        return
      }
    } else {
      const result = getStartTask(state.list, state.downloadStatus, rootState.setting.download.maxDownloadNum)
      if (!result) return
      downloadInfo = result
    }

    let dl = dls[downloadInfo.key]
    if (dl) {
      commit('updateFilePath', {
        downloadInfo,
        filePath: path.join(rootState.setting.download.savePath, downloadInfo.fileName),
      })
      dl.updateSaveInfo(rootState.setting.download.savePath, downloadInfo.fileName)
      try {
        await dl.start()
      } catch (error) {
        commit('onError', { downloadInfo, errorMsg: error.message })
        commit('setStatusText', error.message)
        await dispatch('startTask')
      }
    } else {
      await dispatch('handleStartTask', downloadInfo)
    }
  },
  startTasks({ commit, rootState, dispatch }, list) {
    list = list.filter(item => !(item.isComplate || item.status == state.downloadStatus.RUN || item.status == state.downloadStatus.WAITING))
    commit('setStatus', { list, status: state.downloadStatus.WAITING })
    let result = getStartTask(state.list, state.downloadStatus, rootState.setting.download.maxDownloadNum)
    while (result) {
      dispatch('startTask', result)
      result = getStartTask(state.list, state.downloadStatus, rootState.setting.download.maxDownloadNum)
    }
  },
  async pauseTask({ commit }, item) {
    if (item.isComplate) return
    let dl = dls[item.key]
    if (dl) dl.stop()
    commit('setStatus', { downloadInfo: item, status: state.downloadStatus.PAUSE })
  },
  pauseTasks({ commit, rootState, dispatch }, list) {
    const waitingTasks = list.filter(item => item.status == state.downloadStatus.WAITING)
    commit('setStatus', { list: waitingTasks, status: state.downloadStatus.PAUSE })
    const runningTasks = list.filter(item => item.status == state.downloadStatus.RUN)
    for (const item of runningTasks) {
      if (item.isComplate) return
      let dl = dls[item.key]
      if (dl) dl.stop()
    }
    commit('setStatus', { list: runningTasks, status: state.downloadStatus.PAUSE })
  },
}

// mitations
const mutations = {
  addTask(state, { downloadInfo, musicInfo, addMusicLocationType }) {
    const downloadInfoFull = { ...downloadInfo, musicInfo }
    window.downloadListFullMap.set(downloadInfo.key, downloadInfoFull)
    switch (addMusicLocationType) {
      case 'top':
        window.downloadListFull.unshift(downloadInfoFull)
        state.list.unshift(downloadInfo)
        break
      case 'bottom':
      default:
        window.downloadListFull.push(downloadInfoFull)
        state.list.push(downloadInfo)
        break
    }
  },
  addTasks(state, { list, addMusicLocationType }) {
    const downloadInfoList = []
    const curDownloadListFull = []
    for (const { downloadInfo, musicInfo } of list) {
      downloadInfoList.push(downloadInfo)
      curDownloadListFull.push({ ...downloadInfo, musicInfo })
    }
    let newList
    let newListFull
    const map = {}
    const fullMap = {}
    const ids = []
    switch (addMusicLocationType) {
      case 'top':
        newList = [...downloadInfoList, ...state.list]
        newListFull = [...curDownloadListFull, ...window.downloadListFull]
        for (let i = newList.length - 1; i > -1; i--) {
          const item = newList[i]
          if (map[item.key]) continue
          ids.unshift(item.key)
          map[item.key] = item
          fullMap[item.key] = newListFull[i]
        }
        break
      case 'bottom':
      default:
        newList = [...state.list, ...downloadInfoList]
        newListFull = [...window.downloadListFull, ...curDownloadListFull]
        newList.forEach((item, index) => {
          if (map[item.key]) return
          ids.push(item.key)
          map[item.key] = item
          fullMap[item.key] = newListFull[index]
        })
        break
    }
    window.downloadListFullMap.clear()
    window.downloadListFull = ids.map(id => {
      const info = fullMap[id]
      window.downloadListFullMap.set(info.key, info)
      return info
    })
    state.list.splice(0, state.list.length, ...ids.map(id => map[id]))
  },
  removeTask({ list }, downloadInfo) {
    const index = list.findIndex(m => m.key == downloadInfo.key)
    if (index < 0) return
    window.downloadListFull.splice(index, 1)
    window.downloadListFullMap.delete(downloadInfo.key)
    list.splice(index, 1)
  },
  removeTasks(state, list) {
    let map = {}
    let ids = []
    for (const item of state.list) {
      ids.push(item.key)
      map[item.key] = item
    }
    for (const { key } of list) {
      if (map[key]) delete map[key]
    }
    let newList = []
    let newListFull = []
    for (const id of ids) {
      if (map[id]) {
        newList.push(map[id])
        newListFull.push(window.downloadListFullMap.get(id))
      }
    }

    window.downloadListFull = newListFull
    window.downloadListFullMap.clear()
    for (const item of newListFull) {
      window.downloadListFullMap.set(item.key, item)
    }
    state.list.splice(0, state.list.length, ...newList)
  },
  pauseTask(state, downloadInfo) {
    const index = state.list.findIndex(m => m.key == downloadInfo.key)
    if (index < 0) return
    const downloadInfoFull = window.downloadListFull[index]
    downloadInfoFull.status = state.downloadStatus.PAUSE
    downloadInfoFull.statusText = '暂停下载'

    downloadInfo.status = state.downloadStatus.PAUSE
    downloadInfo.statusText = '暂停下载'
  },
  setStatusText(state, { downloadInfo, index, text }) { // 设置状态文本
    if (downloadInfo) {
      const index = state.list.findIndex(m => m.key == downloadInfo.key)
      if (index < 0) return
      const downloadInfoFull = window.downloadListFull[index]
      if (downloadInfoFull) downloadInfoFull.statusText = text
      downloadInfo.statusText = text
    } else {
      state.list[index].statusText = text
      const downloadInfoFull = window.downloadListFull[index]
      if (downloadInfoFull) downloadInfoFull.statusText = text
    }
  },
  setStatus(state, { downloadInfo, index, status, list }) { // 设置状态及状态文本
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
    if (list) {
      for (const downloadInfo of list) {
        const index = state.list.findIndex(m => m.key == downloadInfo.key)
        if (index < 0) return
        const downloadInfoFull = window.downloadListFull[index]
        downloadInfoFull.statusText = text
        downloadInfoFull.status = status

        downloadInfo.statusText = text
        downloadInfo.status = status
      }
    } else {
      if (downloadInfo) {
        const index = state.list.findIndex(m => m.key == downloadInfo.key)
        if (index < 0) return
        const downloadInfoFull = window.downloadListFull[index]
        downloadInfoFull.statusText = text
        downloadInfoFull.status = status

        downloadInfo.statusText = text
        downloadInfo.status = status
      } else {
        const downloadInfoFull = window.downloadListFull[index]
        downloadInfoFull.statusText = text
        downloadInfoFull.status = status

        state.list[index].statusText = text
        state.list[index].status = status
      }
    }
  },
  onCompleted(state, downloadInfo) {
    const index = state.list.findIndex(m => m.key == downloadInfo.key)
    console.log(index)
    if (index < 0) return
    const downloadInfoFull = window.downloadListFull[index]
    downloadInfoFull.isComplate = true
    downloadInfoFull.status = state.downloadStatus.COMPLETED
    downloadInfoFull.statusText = '下载完成'


    downloadInfo.isComplate = true
    downloadInfo.status = state.downloadStatus.COMPLETED
    downloadInfo.statusText = '下载完成'
  },
  onError(state, { downloadInfo, errorMsg }) {
    const index = state.list.findIndex(m => m.key == downloadInfo.key)
    if (index < 0) return
    const downloadInfoFull = window.downloadListFull[index]
    downloadInfoFull.status = state.downloadStatus.ERROR
    downloadInfoFull.statusText = errorMsg || '任务出错'

    downloadInfo.status = state.downloadStatus.ERROR
    downloadInfo.statusText = errorMsg || '任务出错'
  },
  onStart(state, downloadInfo) {
    const index = state.list.findIndex(m => m.key == downloadInfo.key)
    if (index < 0) return
    const downloadInfoFull = window.downloadListFull[index]
    downloadInfoFull.status = state.downloadStatus.RUN
    downloadInfoFull.statusText = '正在下载'

    downloadInfo.status = state.downloadStatus.RUN
    downloadInfo.statusText = '正在下载'
  },
  onProgress(state, { downloadInfo, status }) {
    const index = state.list.findIndex(m => m.key == downloadInfo.key)
    if (index < 0) return
    const downloadInfoFull = window.downloadListFull[index]
    downloadInfoFull.progress.progress = status.progress
    downloadInfoFull.progress.downloaded = status.downloaded
    downloadInfoFull.progress.total = status.total

    downloadInfo.progress.progress = status.progress
    downloadInfo.progress.downloaded = status.downloaded
    downloadInfo.progress.total = status.total
  },
  updateDownloadList(state, list) {
    window.downloadListFullMap.clear()
    const stateList = list.map(downloadInfoFull => {
      window.downloadListFullMap.set(downloadInfoFull.key, downloadInfoFull)
      const downloadInfo = { ...downloadInfoFull }
      delete downloadInfo.musicInfo
      return downloadInfo
    })
    window.downloadListFull = list
    state.list = window.downloadList = stateList
  },
  updateUrl(state, { downloadInfo, url }) {
    const index = state.list.findIndex(m => m.key == downloadInfo.key)
    if (index < 0) return
    const downloadInfoFull = window.downloadListFull[index]
    downloadInfoFull.url = url
    downloadInfo.url = url
  },
  updateFilePath(state, { downloadInfo, filePath }) {
    if (downloadInfo.filePath === filePath) return
    const index = state.list.findIndex(m => m.key == downloadInfo.key)
    if (index < 0) return
    const downloadInfoFull = window.downloadListFull[index]
    downloadInfoFull.filePath = filePath
    downloadInfo.filePath = filePath
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
