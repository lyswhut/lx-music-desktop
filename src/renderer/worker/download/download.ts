import { createDownload, type DownloaderType, type Options as DownloadOptions } from '@common/utils/download'
// import music from '@renderer/utils/musicSdk'
import { createDownloadInfo } from './utils'
// import {
//   filterFileName,
// } from '@common/utils/common'
// import {
//   assertApiSupport,
//   getExt,
// } from '..'
import { checkAndCreateDir, checkPath, getFileStats, removeFile } from '@common/utils/nodejs'
import { DOWNLOAD_STATUS } from '@common/constants'
// import { download as eventDownloadNames } from '@renderer/event/names'

// window.downloadList = []
// window.downloadListFull = []
// window.downloadListFullMap = new Map()

const dls = new Map<string, DownloaderType>()
const tryNum = new Map<string, number>()
const taskActions = new Map<string, (action: LX.Download.DownloadTaskActions) => void>()
const tasks = new Map<string, LX.Download.ListItem>()

export const checkList = (list: LX.Download.ListItem[], musicInfo: LX.Music.MusicInfo, quality: LX.Quality, ext: string): boolean => {
  return list.some(s => s.id === musicInfo.id && (s.metadata.quality === quality || s.metadata.ext === ext))
}

// const removeTask = (id: string) => {
//   dls.delete(id)
//   tryNum.delete(id)
//   taskActions.delete(id)
//   tasks.delete(id)
// }
const sendAction = (id: string, action: LX.Download.DownloadTaskActions) => {
  const callback = taskActions.get(id)
  if (!callback) return
  callback(action)
}

export const createDownloadTasks = (
  list: LX.Music.MusicInfoOnline[],
  quality: LX.Quality,
  fileNameFormat: string,
  qualityList: LX.QualityList,
  listId?: string,
): LX.Download.ListItem[] => {
  return list.map(musicInfo => {
    return createDownloadInfo(musicInfo, quality, fileNameFormat, qualityList, listId)
  }).filter(task => task)
  // commit('addTasks', { list: taskList, addMusicLocationType: rootState.setting.list.addMusicLocationType })
  // let result = getStartTask(downloadList, DOWNLOAD_STATUS, rootState.setting.download.maxDownloadNum)
  // while (result) {
  //   dispatch('startTask', result)
  //   result = getStartTask(downloadList, DOWNLOAD_STATUS, rootState.setting.download.maxDownloadNum)
  // }
}

const createTask = async(downloadInfo: LX.Download.ListItem, savePath: string, skipExistFile: boolean, proxy?: { host: string, port: number }) => {
  // console.log('createTask', downloadInfo, savePath)
  // 开始任务
  /* commit('onStart', downloadInfo)
  commit('setStatusText', { downloadInfo, text: '任务初始化中' }) */
  if (!await checkAndCreateDir(savePath)) {
    sendAction(downloadInfo.id, {
      action: 'error',
      data: {
        error: 'download_status_error_check_path',
      },
    })
    return
  }
  if (!tasks.has(downloadInfo.id)) return

  if (downloadInfo.downloaded == 0) {
    if (skipExistFile) {
      const stats = await getFileStats(downloadInfo.metadata.filePath)
      if (stats && stats.size > 100) {
        sendAction(downloadInfo.id, {
          action: 'error',
          data: {
            error: 'download_status_error_check_path_exist',
          },
        })
        return
      }
    } else if (await checkPath(downloadInfo.metadata.filePath)) {
      try {
        await removeFile(downloadInfo.metadata.filePath)
      } catch (err) {
        sendAction(downloadInfo.id, {
          action: 'error',
          data: {
            error: 'download_status_error_check_path',
          },
        })
        return
      }
    }
  }

  const downloadOptions: DownloadOptions = {
    url: downloadInfo.metadata.url ?? '',
    path: savePath,
    fileName: downloadInfo.metadata.fileName,
    method: 'get',
    proxy,
    onCompleted() {
      // if (downloadInfo.progress.progress != '100.00') {
      //   delete.get(downloadInfo.id)?
      //   return dispatch('startTask', downloadInfo)
      // }
      downloadInfo.isComplate = true
      downloadInfo.status = DOWNLOAD_STATUS.COMPLETED
      sendAction(downloadInfo.id, { action: 'complete' })
      console.log('on complate')
    },
    onError(err: any) {
      console.error(err)
      if (err.code == 'EPERM') {
        sendAction(downloadInfo.id, {
          action: 'error',
          data: {
            error: 'download_status_error_write',
            message: err.message,
          },
          // data: `歌曲保存位置被占用或没有写入权限，请尝试更改歌曲保存目录或重启软件或重启电脑，错误详情：${err.message as string}`,
        })
        return
      }
      // console.log(tryNum[downloadInfo.id])
      let retryNum = tryNum.get(downloadInfo.id) ?? 0
      tryNum.set(downloadInfo.id, ++retryNum)
      if (retryNum > 2) {
        sendAction(downloadInfo.id, {
          action: 'error',
          data: {
            message: err.message,
          },
        })
        // dispatch('startTask')
        return
      }
      if (err.message?.startsWith('Resume failed')) {
        removeFile(downloadInfo.metadata.filePath).catch(err => {
          console.log('删除不匹配的文件失败：', err.message)
          // commit('onError', { downloadInfo, errorMsg: '删除不匹配的文件失败：' + err.message })
        }).finally(() => {
          console.log('正在重试')
          void dls.get(downloadInfo.id)?.start()
          // sendAction(downloadInfo.id, {
          //   action: 'statusText',
          //   data: 'download_status_error_retrying',
          // })
        })
        return
      }
      if (err.code == 'ENOTFOUND') {
        sendAction(downloadInfo.id, { action: 'refreshUrl' })
      } else {
        console.log('Download failed, Attempting Retry')
        setTimeout(() => {
          void dls.get(downloadInfo.id)?.start()
        }, 1000)
      }
    },
    onFail(response) {
      let retryNum = tryNum.get(downloadInfo.id) ?? 0
      tryNum.set(downloadInfo.id, ++retryNum)
      if (retryNum > 2) {
        if (response.statusCode) {
          sendAction(downloadInfo.id, {
            action: 'error',
            data: {
              error: 'download_status_error_response',
              message: String(response.statusCode),
            },
          })
        } else {
          sendAction(downloadInfo.id, {
            action: 'error',
            data: {},
          })
        }
        return
      }
      switch (response.statusCode) {
        case 401:
        case 403:
        case 410:
          sendAction(downloadInfo.id, { action: 'refreshUrl' })
          // commit('onError', { downloadInfo, errorMsg: '链接失效' })
          // refreshUrl.call(_this, commit, downloadInfo, rootState.setting.download.isUseOtherSource)
          break
        default:
          void dls.get(downloadInfo.id)?.start()
          console.log('正在重试')
          // commit('setStatusText', { downloadInfo, text: '正在重试' })
          break
      }
    },
    onStart() {
      sendAction(downloadInfo.id, { action: 'start' })
      console.log('on start')
    },
    onProgress(status) {
      downloadInfo.total = status.total
      downloadInfo.downloaded = status.downloaded
      downloadInfo.progress = status.progress
      downloadInfo.speed = status.speed
      downloadInfo.writeQueue = status.writeQueue
      sendAction(downloadInfo.id, { action: 'progress', data: status })
      // console.log(status)
    },
    onStop() {
      console.log('on stop')
      // sendAction(downloadInfo.id, { action: 'pause' })
      // commit('pauseTask', downloadInfo)
      // dispatch('startTask')
    },
  }
  // commit('setStatusText', { downloadInfo, text: '获取URL中...' })

  tryNum.set(downloadInfo.id, 0)
  dls.set(downloadInfo.id, createDownload(downloadOptions))
}

export const updateUrl = (id: string, url: string) => {
  const task = tasks.get(id)
  if (!task) return
  task.metadata.url = url
  // commit('setStatusText', { downloadInfo, text: '链接刷新成功' })
  const dl = dls.get(id)
  if (!dl) return
  dl.refreshUrl(url)
  dl.start().catch(err => {
    sendAction(id, {
      action: 'error',
      data: {
        message: err.message,
      },
    })
  })
}

export const startTask = async(downloadInfo: LX.Download.ListItem, savePath: string, skipExistFile: boolean, callback: (action: LX.Download.DownloadTaskActions) => void, proxy?: { host: string, port: number }) => {
  await pauseTask(downloadInfo.id)

  tasks.set(downloadInfo.id, downloadInfo)
  taskActions.set(downloadInfo.id, callback)
  // 检查是否可以开始任务
  // if (!downloadInfo.isComplate && downloadInfo.status != DOWNLOAD_STATUS.RUN) {
  //   const result = getStartTask(downloadList, DOWNLOAD_STATUS, rootState.setting.download.maxDownloadNum)
  //   if (result === false) {
  //     commit('setStatus', { downloadInfo, status: DOWNLOAD_STATUS.WAITING })
  //     return
  //   }
  // } else {
  //   const result = getStartTask(downloadList, DOWNLOAD_STATUS, rootState.setting.download.maxDownloadNum)
  //   if (!result) return
  //   downloadInfo = result
  // }
  // commit('setStatus', { downloadInfo, status: DOWNLOAD_STATUS.RUN })

  let dl = dls.get(downloadInfo.id)
  if (dl) {
    // commit('updateFilePath', {
    //   downloadInfo,
    //   filePath: path.join(rootState.setting.download.savePath, downloadInfo.metadata.fileName),
    // })
    dl.updateSaveInfo(savePath, downloadInfo.metadata.fileName)
    if (tryNum.has(downloadInfo.id)) tryNum.set(downloadInfo.id, 0)
    try {
      await dl.start()
    } catch (error) {
      // commit('onError', { downloadInfo, errorMsg: error.message })
      // commit('setStatusText', error.message)
      // await dispatch('startTask')
    }
  } else {
    await createTask(downloadInfo, savePath, skipExistFile, proxy)
    // await dispatch('handleStartTask', downloadInfo)
  }
}

export const pauseTask = async(id: string) => {
  const dl = dls.get(id)
  if (dl) {
    dls.delete(id)
    tasks.delete(id)
    taskActions.delete(id)
    tryNum.delete(id)

    try {
      await dl.stop()
    } catch (e) {
      console.log(e)
    }
  }
  // commit('setStatus', { downloadInfo: downloadInfo, status: DOWNLOAD_STATUS.PAUSE })
}

export const removeTask = async(id: string) => {
  const dl = dls.get(id)
  const downloadInfo = tasks.get(id)
  if (dl) {
    dls.delete(id)
    tasks.delete(id)
    taskActions.delete(id)
    tryNum.delete(id)

    try {
      await dl.stop()
    } catch (e) {
      console.log(e)
    }
  }

  if (downloadInfo) {
    // 没有未完成、已下载大于1k
    if (!downloadInfo.isComplate && downloadInfo.total && downloadInfo.downloaded > 1024) {
      try {
        await removeFile(downloadInfo.metadata.filePath)
      } catch (_) {}
    }
  }
}
