import { useCommit, useRefGetter } from '@renderer/utils/vueTools'
import { getPlayList } from '@renderer/utils'
import { getPlayInfo, getSearchHistoryList } from '@renderer/utils/tools'
import { initListPosition, initListPrevSelectId } from '@renderer/utils/data'
import music from '@renderer/utils/music'
import { log } from '@common/utils'
import {
  defaultList as stateDefaultList,
  loveList as stateloveList,
  userLists as stateUserLists,
  tempList as stateTempList,
} from '@renderer/core/share/list'
import { getList } from '@renderer/core/share/utils'
import { downloadStatus, downloadList } from '@renderer/core/share/download'


import useSaveData from './useSaveData'
import useInitUserApi from './useInitUserApi'

const useListInit = ({
  saveMyListThrottle,
}) => {
  const initList = useCommit('list', 'initList')
  const updateDownloadList = useCommit('download', 'initDownloadList')

  const initMyList = ({ defaultList, loveList, userList, tempList }) => {
    if (!defaultList) defaultList = { ...stateDefaultList }
    if (!loveList) loveList = { ...stateloveList }
    if (!tempList) tempList = { ...stateTempList }
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
      if (needSave) saveMyListThrottle({ userList })
    } else {
      userList = [...stateUserLists]
    }

    if (!defaultList.list) defaultList.list = []
    if (!loveList.list) loveList.list = []
    if (!tempList.list) tempList.list = []
    initList({ defaultList, loveList, userList, tempList })
  }

  const initDownloadList = list => {
    if (list) {
      list = list.filter(item => item?.key)
      for (const item of list) {
        if (item.status == downloadStatus.RUN || item.status == downloadStatus.WAITING) {
          item.status = downloadStatus.PAUSE
          item.statusText = '暂停下载'
        }

        if (!item.metadata) { // 转换v1.15.3及以前的任务信息
          if (item.name == null) {
            item.name = `${item.musicInfo.name} - ${item.musicInfo.singer}`
            item.songmid = item.musicInfo.songmid
          }
          item.metadata = {
            musicInfo: item.musicInfo,
            url: item.url,
            type: item.type,
            ext: item.ext,
            fileName: item.fileName,
            filePath: item.filePath,
          }
          delete item.musicInfo
          delete item.url
          delete item.type
          delete item.ext
          delete item.fileName
          delete item.filePath
        }
      }
      updateDownloadList(list)
    }
  }

  return () => {
    return getPlayList().then(({ defaultList, loveList, userList, tempList, downloadList }) => {
      initMyList({ defaultList, loveList, userList, tempList })
      initDownloadList(downloadList) // 初始化下载列表
    })
  }
}

const usePlayInfoInit = () => {
  const setPlayList = useCommit('player', 'setList')

  return downloadList => {
    return getPlayInfo().then(info => {
      window.restorePlayInfo = null
      if (!info?.listId || info.index < 0) return
      const list = getList(info.listId)
      if (!list || !list[info.index]) return
      window.restorePlayInfo = info
      setPlayList({
        listId: info.listId,
        index: info.index,
      })
    })
  }
}

const useSearchHistoryInit = () => {
  const setSearchHistoryList = useCommit('search', 'setHistory')
  return saveSearchHistoryListThrottle => {
    return getSearchHistoryList().then(historyList => {
      if (historyList == null) {
        historyList = []
        saveSearchHistoryListThrottle(historyList)
      } else {
        setSearchHistoryList(historyList)
      }
    })
  }
}

export default ({
  setting,
}) => {
  const searchHistoryList = useRefGetter('search', 'historyList')

  // 数据保存初始化
  const { saveMyListThrottle, saveSearchHistoryListThrottle } = useSaveData({
    setting,
    searchHistoryList,
  })

  const initUserApi = useInitUserApi({ setting })

  // 列表初始化
  const initList = useListInit({
    saveMyListThrottle,
  })


  // 播放信息初始化
  const initPlayInfo = usePlayInfoInit()

  // 搜索历史初始化
  const initSearchHistory = useSearchHistoryInit()

  return async() => {
    await Promise.all([
      initListPosition(), // 列表位置记录
      initListPrevSelectId(), // 上次选中的列表记录
      initUserApi(), // 自定义API
      music.init(), // 初始化音乐sdk
    ]).catch(err => log.error(err))
    await initList().catch(err => log.error(err)) // 初始化列表
    await initPlayInfo(downloadList.value).catch(err => log.error(err)) // 初始化上次的歌曲播放信息
    await initSearchHistory(saveSearchHistoryListThrottle).catch(err => log.error(err)) // 初始化搜索历史记录
  }
}
