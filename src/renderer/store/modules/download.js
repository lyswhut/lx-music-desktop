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
import { initDownloadList, downloadList, downloadListMap, downloadStatus } from '@renderer/core/share/download'
import { markRaw } from '@renderer/utils/vueTools'
import { download as eventDownloadNames } from '@renderer/event/names'

// window.downloadList = []
// window.downloadListFull = []
// window.downloadListFullMap = new Map()
// state
const state = {
  // list: window.downloadList,
  // downloadStatus: {
  //   RUN: 'run',
  //   WAITING: 'waiting',
  //   PAUSE: 'pause',
  //   ERROR: 'error',
  //   COMPLETED: 'completed',
  // },
}


const dls = {}
const tryNum = {}


// getters
const getters = {
  // list: state => downloadList || [],
  // downloadStatus: state => downloadStatus,
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
    case 'flac32bit':
      return 'flac'
    case 'wav':
      return 'wav'
  }
}

const checkList = (list, musicInfo, type, ext) => list.some(s => s.songmid === musicInfo.songmid && (s.metadata.type === type || s.metadata.ext === ext))

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
  const cachedUrl = await getMusicUrlFormStorage(downloadInfo.metadata.musicInfo, downloadInfo.metadata.type)
  if (!downloadInfo.metadata.musicInfo._types[downloadInfo.metadata.type]) {
    // 兼容旧版酷我源搜索列表过滤128k音质的bug
    if (!(downloadInfo.metadata.musicInfo.source == 'kw' && downloadInfo.metadata.type == '128k')) throw new Error('该歌曲没有可下载的音频')

    // return Promise.reject(new Error('该歌曲没有可下载的音频'))
  }
  return cachedUrl && !isRefresh
    ? cachedUrl
    : (
        isUseOtherSource
          ? handleGetMusicUrl.call(this, downloadInfo.metadata.musicInfo, downloadInfo.metadata.type)
          : music[downloadInfo.metadata.musicInfo.source].getMusicUrl(downloadInfo.metadata.musicInfo, downloadInfo.metadata.type).promise
      ).then(({ url }) => {
        setMusicUrl(downloadInfo.metadata.musicInfo, downloadInfo.metadata.type, url)
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

const existTimeExp = /\[\d{1,2}:.*\d{1,4}\]/
const handleGetLyric = function(musicInfo, retryedSource = [], originMusic) {
  if (!originMusic) originMusic = musicInfo
  let reqPromise
  try {
    reqPromise = music[musicInfo.source].getLyric(musicInfo).promise
  } catch (err) {
    reqPromise = Promise.reject(err)
  }
  return reqPromise.then(lyricInfo => {
    return existTimeExp.test(lyricInfo.lyric) ? lyricInfo : Promise.reject(new Error('failed'))
  }).catch(err => {
    // console.log(err)
    if (!retryedSource.includes(musicInfo.source)) retryedSource.push(musicInfo.source)
    return this.dispatch('list/getOtherSource', originMusic).then(otherSource => {
      console.log('find otherSource', otherSource)
      if (otherSource.length) {
        for (const item of otherSource) {
          if (retryedSource.includes(item.source)) continue
          console.log('try toggle to: ', item.source, item.name, item.singer, item.interval)
          return handleGetLyric.call(this, item, retryedSource, originMusic)
        }
      }
      return Promise.reject(err)
    })
  })
}

const getLyric = function(musicInfo, isUseOtherSource, isS2t) {
  return getLyricFromStorage(musicInfo).then(lrcInfo => {
    return (
      existTimeExp.test(lrcInfo.lyric)
        ? Promise.resolve({ lyric: lrcInfo.lyric, tlyric: lrcInfo.tlyric || '', rlyric: lrcInfo.rlyric || '', lxlyric: lrcInfo.lxlyric || '' })
        : (
            isUseOtherSource
              ? handleGetLyric.call(this, musicInfo)
              : music[musicInfo.source].getLyric(musicInfo).promise
          ).then(({ lyric, tlyric, rlyric, lxlyric }) => {
            setLyric(musicInfo, { lyric, tlyric, rlyric, lxlyric })
            return { lyric, tlyric, rlyric, lxlyric }
          }).catch(err => {
            console.log(err)
            return null
          })
    ).then(lrcs => {
      if (!lrcs || !isS2t) return lrcs
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
const saveMeta = function({ downloadInfo, filePath, isUseOtherSource, isEmbedPic, isEmbedLyric, isS2t }) {
  if (downloadInfo.metadata.type === 'ape') return
  const tasks = [
    isEmbedPic
      ? downloadInfo.metadata.musicInfo.img
        ? Promise.resolve(downloadInfo.metadata.musicInfo.img)
        : (
            isUseOtherSource
              ? getPic.call(this, downloadInfo.metadata.musicInfo)
              : music[downloadInfo.metadata.musicInfo.source].getPic(downloadInfo.metadata.musicInfo).promise
          ).catch(err => {
            console.log(err)
            return null
          })
      : Promise.resolve(),
    isEmbedLyric
      ? getLyric.call(this, downloadInfo.metadata.musicInfo, isUseOtherSource, isS2t)
      : Promise.resolve(),
  ]
  Promise.all(tasks).then(([imgUrl, lyrics = {}]) => {
    if (lyrics?.lyric) lyrics.lyric = fixKgLyric(lyrics.lyric)
    setMeta(filePath, {
      title: downloadInfo.metadata.musicInfo.name,
      artist: downloadInfo.metadata.musicInfo.singer,
      album: downloadInfo.metadata.musicInfo.albumName,
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
const downloadLyric = function({ downloadInfo, isUseOtherSource, filePath, lrcFormat, isS2t }) {
  getLyric.call(this, downloadInfo.metadata.musicInfo, isUseOtherSource, isS2t).then(lrcs => {
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
    status: downloadStatus.WAITING,
    statusText: '待下载',
    songmid: musicInfo.songmid,
    progress: {
      downloaded: 0,
      total: 0,
      progress: 0,
    },
    name: `${musicInfo.name} - ${musicInfo.singer}`,
    key,
    metadata: {
      musicInfo,
      url: null,
      type,
      ext,
      fileName: filterFileName(`${fileName
        .replace('歌名', musicInfo.name)
        .replace('歌手', musicInfo.singer)}.${ext}`),
    },
  }
  downloadInfo.metadata.filePath = path.join(savePath, downloadInfo.metadata.fileName)
  // commit('addTask', downloadInfo)

  // 删除同路径下的同名文件
  deleteFile(downloadInfo.metadata.filePath)
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
      list: downloadList,
    })
    if (!downloadInfo) return
    commit('addTask', { downloadInfo, addMusicLocationType: rootState.setting.list.addMusicLocationType })
    let result = getStartTask(downloadList, downloadStatus, rootState.setting.download.maxDownloadNum)
    console.log(result)
    while (result) {
      dispatch('startTask', result)
      result = getStartTask(downloadList, downloadStatus, rootState.setting.download.maxDownloadNum)
    }
  },
  createDownloadMultiple({ state, rootState, commit, dispatch }, { list, type }) {
    if (!list.length) return
    const taskList = list.map(musicInfo => {
      return createDownloadInfo({
        musicInfo,
        type,
        fileName: rootState.setting.download.fileName,
        savePath: rootState.setting.download.savePath,
        list: downloadList,
      })
    }).filter(task => task)
    commit('addTasks', { list: taskList, addMusicLocationType: rootState.setting.list.addMusicLocationType })
    let result = getStartTask(downloadList, downloadStatus, rootState.setting.download.maxDownloadNum)
    while (result) {
      dispatch('startTask', result)
      result = getStartTask(downloadList, downloadStatus, rootState.setting.download.maxDownloadNum)
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
      url: downloadInfo.metadata.url,
      path: rootState.setting.download.savePath,
      fileName: downloadInfo.metadata.fileName,
      method: 'get',
      override: true,
      onCompleted() {
        // if (downloadInfo.progress.progress != '100.00') {
        //   delete dls[downloadInfo.key]
        //   return dispatch('startTask', downloadInfo)
        // }
        commit('onCompleted', downloadInfo)
        dispatch('startTask')

        saveMeta.call(_this, {
          downloadInfo,
          filePath: downloadInfo.metadata.filePath,
          isUseOtherSource: rootState.setting.download.isUseOtherSource,
          isEmbedPic: rootState.setting.download.isEmbedPic,
          isEmbedLyric: rootState.setting.download.isEmbedLyric,
          isS2t: rootState.setting.player.isS2t,
        })
        if (rootState.setting.download.isDownloadLrc) {
          downloadLyric.call(_this, {
            downloadInfo,
            isUseOtherSource: rootState.setting.download.isUseOtherSource,
            filePath: downloadInfo.metadata.filePath,
            lrcFormat: rootState.setting.download.lrcFormat,
            isS2t: rootState.setting.player.isS2t,
          })
        }
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
        if (err.message?.startsWith('Resume failed')) {
          fs.unlink(downloadInfo.metadata.filePath, err => {
            if (err) return commit('onError', { downloadInfo, errorMsg: '删除不匹配的文件失败：' + err.message })
            dls[downloadInfo.key].start()
            commit('setStatusText', { downloadInfo, text: '正在重试' })
          })
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
      if (item.status == downloadStatus.RUN) {
        try {
          await dls[item.key].stop()
        } catch (_) {}
      }
      delete dls[item.key]
    }
    commit('removeTask', item)
    // 没有未完成、已下载大于1k
    if (item.status != downloadStatus.COMPLETED && item.progress.total && item.progress.downloaded > 1024) {
      try {
        await deleteFile(item.metadata.filePath)
      } catch (_) {}
    }
    switch (item.status) {
      case downloadStatus.RUN:
      case downloadStatus.WAITING:
        await dispatch('startTask')
    }
  },
  removeTasks({ rootState, commit, dispatch }, list) {
    for (const item of list) {
      if (dls[item.key]) {
        if (item.status == downloadStatus.RUN) {
          dls[item.key].stop().finally(() => {
            delete dls[item.key]
          })
        } else {
          delete dls[item.key]
        }
      }
      // 没有未完成、已下载大于1k
      if (item.status != downloadStatus.COMPLETED && item.progress.total && item.progress.downloaded > 1024) {
        deleteFile(item.metadata.filePath).catch(_ => _)
      }
    }
    commit('removeTasks', list)
    let result = getStartTask(downloadList, downloadStatus, rootState.setting.download.maxDownloadNum)
    while (result) {
      dispatch('startTask', result)
      result = getStartTask(downloadList, downloadStatus, rootState.setting.download.maxDownloadNum)
    }
  },
  async startTask({ state, rootState, commit, dispatch }, downloadInfo) {
    // 检查是否可以开始任务
    if (downloadInfo && !downloadInfo.isComplate && downloadInfo.status != downloadStatus.RUN) {
      const result = getStartTask(downloadList, downloadStatus, rootState.setting.download.maxDownloadNum)
      if (result === false) {
        commit('setStatus', { downloadInfo, status: downloadStatus.WAITING })
        return
      }
    } else {
      const result = getStartTask(downloadList, downloadStatus, rootState.setting.download.maxDownloadNum)
      if (!result) return
      downloadInfo = result
    }
    commit('setStatus', { downloadInfo, status: downloadStatus.RUN })

    let dl = dls[downloadInfo.key]
    if (dl) {
      commit('updateFilePath', {
        downloadInfo,
        filePath: path.join(rootState.setting.download.savePath, downloadInfo.metadata.fileName),
      })
      dl.updateSaveInfo(rootState.setting.download.savePath, downloadInfo.metadata.fileName)
      if (tryNum[downloadInfo.key]) tryNum[downloadInfo.key] = 0
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
    list = list.filter(item => !(item.isComplate || item.status == downloadStatus.RUN || item.status == downloadStatus.WAITING))
    commit('setStatus', { list, status: downloadStatus.WAITING })
    let result = getStartTask(downloadList, downloadStatus, rootState.setting.download.maxDownloadNum)
    while (result) {
      dispatch('startTask', result)
      result = getStartTask(downloadList, downloadStatus, rootState.setting.download.maxDownloadNum)
    }
  },
  async pauseTask({ commit }, item) {
    if (item.isComplate) return
    let dl = dls[item.key]
    if (dl) dl.stop()
    commit('setStatus', { downloadInfo: item, status: downloadStatus.PAUSE })
  },
  pauseTasks({ commit, rootState, dispatch }, list) {
    const waitingTasks = list.filter(item => item.status == downloadStatus.WAITING)
    commit('setStatus', { list: waitingTasks, status: downloadStatus.PAUSE })
    const runningTasks = list.filter(item => item.status == downloadStatus.RUN)
    for (const item of runningTasks) {
      if (item.isComplate) return
      let dl = dls[item.key]
      if (dl) dl.stop()
    }
    commit('setStatus', { list: runningTasks, status: downloadStatus.PAUSE })
  },
}

// mitations
const mutations = {
  addTask(state, { downloadInfo, addMusicLocationType }) {
    downloadListMap.set(downloadInfo.key, downloadInfo)
    switch (addMusicLocationType) {
      case 'top':
        downloadList.unshift(downloadInfo)
        break
      case 'bottom':
      default:
        downloadList.push(downloadInfo)
        break
    }
    window.eventHub.emit(eventDownloadNames.listChange)
  },
  addTasks(state, { list, addMusicLocationType }) {
    let newList
    const map = {}
    const fullMap = {}
    const ids = []
    switch (addMusicLocationType) {
      case 'top':
        newList = [...list, ...downloadList]
        for (let i = newList.length - 1; i > -1; i--) {
          const item = newList[i]
          if (map[item.key]) continue
          ids.unshift(item.key)
          map[item.key] = item
          fullMap[item.key] = newList[i]
        }
        break
      case 'bottom':
      default:
        newList = [...downloadList, ...list]
        newList.forEach((item, index) => {
          if (map[item.key]) return
          ids.push(item.key)
          map[item.key] = item
          fullMap[item.key] = newList[index]
        })
        break
    }
    initDownloadList(ids.map(id => map[id]))
    window.eventHub.emit(eventDownloadNames.listChange)
  },
  removeTask(state, downloadInfo) {
    const index = downloadList.findIndex(m => m.key == downloadInfo.key)
    if (index < 0) return
    downloadListMap.delete(downloadInfo.key)
    downloadList.splice(index, 1)
    window.eventHub.emit(eventDownloadNames.listChange)
  },
  removeTasks(state, list) {
    let set = new Set()
    let ids = []
    for (const item of downloadList) {
      ids.push(item.key)
      set.add(item.key)
    }
    for (const { key } of list) {
      if (set.has(key)) delete set.delete(key)
    }
    let newList = []
    for (const id of ids) {
      if (set.has(id)) {
        newList.push(downloadListMap.get(id))
      }
    }
    initDownloadList(newList)
    window.eventHub.emit(eventDownloadNames.listChange)
  },
  pauseTask(state, downloadInfo) {
    const index = downloadList.findIndex(m => m.key == downloadInfo.key)
    if (index < 0) return
    downloadInfo = downloadList[index]
    downloadInfo.status = downloadStatus.PAUSE
    downloadInfo.statusText = '暂停下载'
    window.eventHub.emit(eventDownloadNames.listChange)
  },
  setStatusText(state, { downloadInfo, index, text }) { // 设置状态文本
    if (downloadInfo) {
      index = downloadList.findIndex(m => m.key == downloadInfo.key)
    }
    if (index < 0) return
    downloadInfo = downloadList[index]
    downloadInfo.statusText = text
    window.eventHub.emit(eventDownloadNames.listChange)
  },
  setStatus(state, { downloadInfo, index, status, list }) { // 设置状态及状态文本
    let text
    switch (status) {
      case downloadStatus.RUN:
        text = '正在下载'
        break
      case downloadStatus.WAITING:
        text = '等待下载'
        break
      case downloadStatus.PAUSE:
        text = '暂停下载'
        break
      case downloadStatus.ERROR:
        text = '任务出错'
        break
      case downloadStatus.COMPLETED:
        text = '下载完成'
        break
    }
    if (list) {
      for (let downloadInfo of list) {
        const index = downloadList.findIndex(m => m.key == downloadInfo.key)
        if (index < 0) return
        downloadInfo = downloadList[index]
        downloadInfo.statusText = text
        downloadInfo.status = status
      }
    } else {
      if (downloadInfo) {
        index = downloadList.findIndex(m => m.key == downloadInfo.key)
      }
      if (index < 0) return
      downloadInfo = downloadList[index]
      downloadInfo.statusText = text
      downloadInfo.status = status
    }
    window.eventHub.emit(eventDownloadNames.listChange)
  },
  onCompleted(state, downloadInfo) {
    const index = downloadList.findIndex(m => m.key == downloadInfo.key)
    // console.log(index)
    if (index < 0) return
    downloadInfo = downloadList[index]
    downloadInfo.isComplate = true
    downloadInfo.status = downloadStatus.COMPLETED
    downloadInfo.statusText = '下载完成'
    window.eventHub.emit(eventDownloadNames.listChange)
  },
  onError(state, { downloadInfo, errorMsg }) {
    const index = downloadList.findIndex(m => m.key == downloadInfo.key)
    if (index < 0) return
    downloadInfo = downloadList[index]
    downloadInfo.status = downloadStatus.ERROR
    downloadInfo.statusText = errorMsg || '任务出错'
    window.eventHub.emit(eventDownloadNames.listChange)
  },
  onStart(state, downloadInfo) {
    const index = downloadList.findIndex(m => m.key == downloadInfo.key)
    if (index < 0) return
    downloadInfo = downloadList[index]
    downloadInfo.status = downloadStatus.RUN
    downloadInfo.statusText = '正在下载'
    window.eventHub.emit(eventDownloadNames.listChange)
  },
  onProgress(state, { downloadInfo, status }) {
    const index = downloadList.findIndex(m => m.key == downloadInfo.key)
    if (index < 0) return
    downloadInfo = downloadList[index]
    downloadInfo.progress.progress = status.progress
    downloadInfo.progress.downloaded = status.downloaded
    downloadInfo.progress.total = status.total
  },
  initDownloadList(state, list) {
    for (const task of list) {
      markRaw(task.metadata)
    }
    initDownloadList(list)
    window.eventHub.emit(eventDownloadNames.listChange)
  },
  updateUrl(state, { downloadInfo, url }) {
    const index = downloadList.findIndex(m => m.key == downloadInfo.key)
    if (index < 0) return
    downloadInfo = downloadList[index]
    downloadInfo.metadata.url = url
    window.eventHub.emit(eventDownloadNames.listChange)
  },
  updateFilePath(state, { downloadInfo, filePath }) {
    if (downloadInfo.metadata.filePath === filePath) return
    const index = downloadList.findIndex(m => m.key == downloadInfo.key)
    if (index < 0) return
    downloadInfo = downloadList[index]
    downloadInfo.metadata.filePath = filePath
    window.eventHub.emit(eventDownloadNames.listChange)
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
