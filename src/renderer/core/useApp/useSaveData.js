import { throttle, saveSetting } from '@renderer/utils'
import { saveMyList, saveDownloadList, saveSearchHistoryList, setUserApi } from '@renderer/utils/tools'
import music from '@renderer/utils/music'

import { useCommit, watch, toRaw, onBeforeUnmount } from '@renderer/utils/vueTools'

import { apiSource, qualityList, userApi, proxy } from '@renderer/core/share'
import { allList, defaultList, loveList, userLists, tempList } from '@renderer/core/share/list'
import { downloadList } from '@renderer/core/share/download'

import { list as eventListNames, download as eventDownloadNames } from '@renderer/event/names'

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
const saveMyListThrottle = listThrottle(data => saveMyList(data), 300)
const saveDownloadListThrottle = throttle(list => saveDownloadList(list), 1000)
const saveSearchHistoryListThrottle = throttle(list => saveSearchHistoryList(list), 500)

export default ({
  setting,
  searchHistoryList,
}) => {
  watch(setting, (newValue, oldValue) => {
    saveSetting(toRaw(newValue))
    global.appSetting = newValue
  }, { deep: true })

  // watch(defaultList, (newValue, oldValue) => {
  //   saveMyListThrottle({ defaultList: toRaw(newValue) })
  // }, { deep: true })
  // watch(loveList, (newValue, oldValue) => {
  //   saveMyListThrottle({ loveList: toRaw(newValue) })
  // }, { deep: true })
  // watch(userList, (newValue, oldValue) => {
  //   saveMyListThrottle({ userList: toRaw(newValue) })
  // }, { deep: true })

  // watch(downloadList, (newValue, oldValue) => {
  //   saveDownloadListThrottle(window.downloadListFull)
  // }, { deep: true })

  watch(searchHistoryList, (newValue, oldValue) => {
    saveSearchHistoryListThrottle(toRaw(newValue))
  }, { deep: true })


  const setApiSource = useCommit('setApiSource')
  watch(apiSource, (apiSource, oldValue) => {
    if (/^user_api/.test(apiSource)) {
      qualityList.value = {}
      userApi.status = false
      userApi.message = 'initing'
    } else {
      qualityList.value = music.supportQuality[apiSource]
    }
    if (oldValue === null) return

    setUserApi(apiSource)

    if (apiSource != setting.value.apiSource) {
      setApiSource(apiSource)
    }
  })

  const setProxyEnable = useCommit('setProxyEnable')
  watch(() => proxy.enable, (enable, oldValue) => {
    if (enable != setting.value.network.proxy.enable) setProxyEnable(enable)
  })

  const handelListChange = ids => {
    const lists = {}
    let isUserList = false
    for (const id of ids) {
      switch (id) {
        case defaultList.id:
          lists.defaultList = { ...toRaw(defaultList), list: toRaw(allList[id]) }
          break
        case loveList.id:
          lists.loveList = { ...toRaw(loveList), list: toRaw(allList[id]) }
          break
        case tempList.id:
          lists.tempList = { ...toRaw(tempList), list: toRaw(allList[id]) }
          break
        default:
          isUserList = true
      }
    }
    if (isUserList) {
      lists.userList = userLists.map(l => ({ ...toRaw(l), list: toRaw(allList[l.id]) }))
    }

    saveMyListThrottle(lists)
  }
  const handelSaveList = ({ id }) => {
    handelListChange([id])
  }

  const handelDownloadListChange = () => {
    saveDownloadListThrottle(toRaw(downloadList))
  }

  window.eventHub.on(eventListNames.listChange, handelListChange)
  window.eventHub.on(eventListNames.musicInfoChange, handelSaveList)
  window.eventHub.on(eventDownloadNames.listChange, handelDownloadListChange)

  onBeforeUnmount(() => {
    window.eventHub.off(eventListNames.listChange, handelListChange)
    window.eventHub.off(eventListNames.musicInfoChange, handelSaveList)
    window.eventHub.off(eventDownloadNames.listChange, handelDownloadListChange)
  })

  return {
    saveMyListThrottle,
    saveSearchHistoryListThrottle,
  }
}
