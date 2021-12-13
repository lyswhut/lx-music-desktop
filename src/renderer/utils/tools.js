import { rendererOn, rendererSend, rendererInvoke, NAMES, rendererOff } from '@common/ipc'
import apiSourceInfo from '../utils/music/api-source-info'
import { apiSource } from '@renderer/core/share'
import * as hotKeys from '@common/hotKey'
import { markRaw } from '@renderer/utils/vueTools'
import { mainWindow as eventsNameMainWindow, winLyric as eventsNameWinLyric } from '@main/events/_name'

export const setUserApi = source => {
  return rendererInvoke(NAMES.mainWindow.set_user_api, source).catch(err => {
    console.log(err)
    let api = apiSourceInfo.find(api => !api.disabled)
    if (api) apiSource.value = api.id
  })
}

export const saveMyList = data => {
  rendererSend(NAMES.mainWindow.save_playlist, {
    type: 'myList',
    data: data,
  })
}
export const saveDownloadList = list => {
  rendererSend(NAMES.mainWindow.save_playlist, {
    type: 'downloadList',
    data: list,
  })
}

export const saveSearchHistoryList = list => {
  rendererSend(NAMES.mainWindow.save_data, {
    path: 'searchHistoryList',
    data: list,
  })
}

export const syncEnable = ({ enable, port }) => {
  return rendererInvoke(NAMES.mainWindow.sync_enable, {
    enable,
    port,
  })
}

export const setIgnoreMouseEvents = ignore => {
  rendererSend(NAMES.mainWindow.set_ignore_mouse_events, ignore)
}

export const getEnvParams = () => {
  return rendererInvoke(NAMES.mainWindow.get_env_params)
}

export const onUpdateAvailable = callback => {
  rendererOn(NAMES.mainWindow.update_available, callback)
  return () => {
    rendererOff(callback)
  }
}

export const onUpdateError = callback => {
  rendererOn(NAMES.mainWindow.update_error, callback)
  return () => {
    rendererOff(callback)
  }
}

export const onUpdateProgress = callback => {
  rendererOn(NAMES.mainWindow.update_progress, callback)
  return () => {
    rendererOff(callback)
  }
}

export const onUpdateDownloaded = callback => {
  rendererOn(NAMES.mainWindow.update_downloaded, callback)
  return () => {
    rendererOff(callback)
  }
}

export const onUpdateNotAvailable = callback => {
  rendererOn(NAMES.mainWindow.update_not_available, callback)
  return () => {
    rendererOff(callback)
  }
}

export const onSetConfig = callback => {
  rendererOn(NAMES.mainWindow.set_config, callback)
  return () => {
    rendererOff(callback)
  }
}

// 获取上次关闭时的当前歌曲播放信息
export const getPlayInfo = () => {
  return rendererInvoke(NAMES.mainWindow.get_data, 'playInfo')
}

// 获取搜索历史列表
export const getSearchHistoryList = () => {
  return rendererInvoke(NAMES.mainWindow.get_data, 'searchHistoryList')
}

export const onUserApiStatus = callback => {
  rendererOn(NAMES.mainWindow.user_api_status, (event, { status, message, apiInfo }) => callback({ status, message, apiInfo }))
  return () => {
    rendererOff(callback)
  }
}

export const getUserApiList = () => {
  return rendererInvoke(NAMES.mainWindow.get_user_api_list)
}

export const userApiRequest = ({ requestKey, data }) => {
  return rendererInvoke(NAMES.mainWindow.request_user_api, {
    requestKey,
    data,
  })
}
export const userApiRequestCancel = requestKey => {
  rendererSend(NAMES.mainWindow.request_user_api_cancel, requestKey)
}

export const setDesktopLyricInfo = (type, data, info) => {
  rendererSend(NAMES.mainWindow.set_lyric_info, {
    type,
    data,
    info,
  })
}
export const onGetDesktopLyricInfo = callback => {
  rendererOn(NAMES.mainWindow.get_lyric_info, (event, info) => callback(event, info))
  return () => {
    rendererOff(callback)
  }
}

export const setTaskBarProgress = (status, mode) => {
  rendererSend(NAMES.mainWindow.progress, {
    status: status < 0 ? status : Math.max(0.01, status),
    mode: mode || 'normal',
  })
}

export const savePlayInfo = ({ time, maxTime, listId, list, index }) => {
  rendererSend(NAMES.mainWindow.save_data, {
    path: 'playInfo',
    data: {
      time,
      maxTime,
      listId,
      list: [],
      index,
    },
  })
}

export const wait = (time, id) => {
  return rendererInvoke(NAMES.mainWindow.wait, { time, id })
}

export const waitCancel = id => {
  return rendererSend(NAMES.mainWindow.wait_cancel, id)
}

// 简体转繁体
export const langS2T = str => {
  return rendererInvoke(NAMES.mainWindow.lang_s2t, Buffer.from(str).toString('base64'))
    .then(b64 => Buffer.from(b64, 'base64').toString())
}

export const getSystemFonts = () => {
  return rendererInvoke(NAMES.mainWindow.get_system_fonts).catch(() => {
    return []
  })
}

export const refreshSyncCode = () => {
  return rendererInvoke(NAMES.mainWindow.sync_generate_code)
}

export const onSyncStatus = callback => {
  rendererOn(NAMES.mainWindow.sync_status, callback)

  return () => {
    rendererOff(callback)
  }
}

export const allHotKeys = markRaw({
  local: [
    {
      name: hotKeys.player.toggle_play.name,
      action: hotKeys.player.toggle_play.action,
      type: eventsNameMainWindow.name,
    },
    {
      name: hotKeys.player.prev.name,
      action: hotKeys.player.prev.action,
      type: eventsNameMainWindow.name,
    },
    {
      name: hotKeys.player.next.name,
      action: hotKeys.player.next.action,
      type: eventsNameMainWindow.name,
    },
    {
      name: hotKeys.common.focusSearchInput.name,
      action: hotKeys.common.focusSearchInput.action,
      type: eventsNameMainWindow.name,
    },
    {
      name: hotKeys.common.min.name,
      action: hotKeys.common.min.action,
      type: eventsNameMainWindow.name,
    },
    {
      name: hotKeys.common.close.name,
      action: hotKeys.common.close.action,
      type: eventsNameMainWindow.name,
    },
  ],
  global: [
    {
      name: hotKeys.common.min_toggle.name,
      action: hotKeys.common.min_toggle.action,
      type: eventsNameMainWindow.name,
    },
    {
      name: hotKeys.common.hide_toggle.name,
      action: hotKeys.common.hide_toggle.action,
      type: eventsNameMainWindow.name,
    },
    {
      name: hotKeys.common.close.name,
      action: hotKeys.common.close.action,
      type: eventsNameMainWindow.name,
    },
    {
      name: hotKeys.player.toggle_play.name,
      action: hotKeys.player.toggle_play.action,
      type: eventsNameMainWindow.name,
    },
    {
      name: hotKeys.player.prev.name,
      action: hotKeys.player.prev.action,
      type: eventsNameMainWindow.name,
    },
    {
      name: hotKeys.player.next.name,
      action: hotKeys.player.next.action,
      type: eventsNameMainWindow.name,
    },
    {
      name: hotKeys.player.volume_up.name,
      action: hotKeys.player.volume_up.action,
      type: eventsNameMainWindow.name,
    },
    {
      name: hotKeys.player.volume_down.name,
      action: hotKeys.player.volume_down.action,
      type: eventsNameMainWindow.name,
    },
    {
      name: hotKeys.player.volume_mute.name,
      action: hotKeys.player.volume_mute.action,
      type: eventsNameMainWindow.name,
    },
    {
      name: hotKeys.desktop_lyric.toggle_visible.name,
      action: hotKeys.desktop_lyric.toggle_visible.action,
      type: eventsNameWinLyric.name,
    },
    {
      name: hotKeys.desktop_lyric.toggle_lock.name,
      action: hotKeys.desktop_lyric.toggle_lock.action,
      type: eventsNameWinLyric.name,
    },
    {
      name: hotKeys.desktop_lyric.toggle_always_top.name,
      action: hotKeys.desktop_lyric.toggle_always_top.action,
      type: eventsNameWinLyric.name,
    },
  ],
})

export const hotKeySetEnable = (enable) => {
  return rendererInvoke(NAMES.hotKey.enable, enable)
}

export const hotKeySetConfig = (config) => {
  return rendererInvoke(NAMES.hotKey.set_config, config)
}

export const hotKeyGetStatus = () => {
  return rendererInvoke(NAMES.hotKey.status)
}
