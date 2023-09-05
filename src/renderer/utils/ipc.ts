import { rendererSend, rendererInvoke, rendererOn, rendererOff } from '@common/rendererIpc'
import { HOTKEY_RENDERER_EVENT_NAME, WIN_MAIN_RENDERER_EVENT_NAME, CMMON_EVENT_NAME } from '@common/ipcNames'
import { type ProgressInfo, type UpdateDownloadedEvent, type UpdateInfo } from 'electron-updater'
import { markRaw } from '@common/utils/vueTools'
import * as hotKeys from '@common/hotKey'
import { APP_EVENT_NAMES, DATA_KEYS, DEFAULT_SETTING } from '@common/constants'

type RemoveListener = () => void

export const getSetting = async() => {
  return rendererInvoke<LX.AppSetting>(CMMON_EVENT_NAME.get_app_setting)
}
export const updateSetting = async(setting: Partial<LX.AppSetting>) => {
  await rendererInvoke(CMMON_EVENT_NAME.set_app_setting, setting)
}
export const onSettingChanged = (listener: LX.IpcRendererEventListenerParams<Partial<LX.AppSetting>>): RemoveListener => {
  rendererOn(WIN_MAIN_RENDERER_EVENT_NAME.on_config_change, listener)
  return () => {
    rendererOff(WIN_MAIN_RENDERER_EVENT_NAME.on_config_change, listener)
  }
}

export const sendInited = () => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.inited)
}

export const getOtherSource = async(id: string): Promise<LX.Music.MusicInfoOnline[]> => {
  return rendererInvoke<string, LX.Music.MusicInfoOnline[]>(WIN_MAIN_RENDERER_EVENT_NAME.get_other_source, id)
}
export const saveOtherSource = async(id: string, sourceInfo: LX.Music.MusicInfoOnline[]) => {
  await rendererInvoke<LX.Music.MusicInfoOtherSourceSave>(WIN_MAIN_RENDERER_EVENT_NAME.save_other_source, {
    id,
    list: sourceInfo,
  })
}
export const clearOtherSource = async() => {
  await rendererInvoke(WIN_MAIN_RENDERER_EVENT_NAME.clear_other_source)
}
export const getOtherSourceCount = async() => {
  return rendererInvoke<number>(WIN_MAIN_RENDERER_EVENT_NAME.get_other_source_count)
}

// export const updateDislikeInfo = async(dislikeInfo: LX.Dislike.ListItem[]) => {
//   await rendererInvoke<LX.Dislike.ListItem[]>(WIN_MAIN_RENDERER_EVENT_NAME.update_dislike_music_infos, dislikeInfo)
// }
// export const removeDislikeInfo = async(ids: string[]) => {
//   await rendererInvoke<string[]>(WIN_MAIN_RENDERER_EVENT_NAME.remove_dislike_music_infos, ids)
// }
// export const clearDislikeInfo = async() => {
//   await rendererInvoke(WIN_MAIN_RENDERER_EVENT_NAME.clear_dislike_music_infos)
// }

export const getHotKeyConfig = async() => {
  return rendererInvoke<LX.HotKeyConfigAll>(WIN_MAIN_RENDERER_EVENT_NAME.get_hot_key)
}

export const setIgnoreMouseEvents = (ignore: boolean) => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.set_ignore_mouse_events, ignore)
}

export const getEnvParams = async() => {
  return rendererInvoke<LX.EnvParams>(CMMON_EVENT_NAME.get_env_params)
}

export const clearEnvParamsDeeplink = () => {
  rendererSend(CMMON_EVENT_NAME.clear_env_params_deeplink)
}

export const onDeeplink = (listener: LX.IpcRendererEventListenerParams<string>): RemoveListener => {
  rendererOn(CMMON_EVENT_NAME.deeplink, listener)
  return () => {
    rendererOff(CMMON_EVENT_NAME.deeplink, listener)
  }
}

export const checkUpdate = () => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.update_check)
}

export const downloadUpdate = () => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.update_download_update)
}

export const quitUpdate = () => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.quit_update)
}

export const onUpdateAvailable = (listener: LX.IpcRendererEventListenerParams<UpdateInfo>): RemoveListener => {
  rendererOn(WIN_MAIN_RENDERER_EVENT_NAME.update_available, listener)
  return () => {
    rendererOff(WIN_MAIN_RENDERER_EVENT_NAME.update_available, listener)
  }
}

export const onUpdateError = (listener: LX.IpcRendererEventListenerParams<string>): RemoveListener => {
  rendererOn(WIN_MAIN_RENDERER_EVENT_NAME.update_error, listener)
  return () => {
    rendererOff(WIN_MAIN_RENDERER_EVENT_NAME.update_error, listener)
  }
}

export const onUpdateProgress = (listener: LX.IpcRendererEventListenerParams<ProgressInfo>): RemoveListener => {
  rendererOn(WIN_MAIN_RENDERER_EVENT_NAME.update_progress, listener)
  return () => {
    rendererOff(WIN_MAIN_RENDERER_EVENT_NAME.update_progress, listener)
  }
}

export const onUpdateDownloaded = (listener: LX.IpcRendererEventListenerParams<UpdateDownloadedEvent>): RemoveListener => {
  rendererOn(WIN_MAIN_RENDERER_EVENT_NAME.update_downloaded, listener)
  return () => {
    rendererOff(WIN_MAIN_RENDERER_EVENT_NAME.update_downloaded, listener)
  }
}

export const onUpdateNotAvailable = (listener: LX.IpcRendererEventListenerParams<UpdateInfo>): RemoveListener => {
  rendererOn(WIN_MAIN_RENDERER_EVENT_NAME.update_not_available, listener)
  return () => {
    rendererOff(WIN_MAIN_RENDERER_EVENT_NAME.update_not_available, listener)
  }
}


export const importUserApi = async(fileText: string) => {
  return rendererInvoke<string, LX.UserApi.ImportUserApi>(WIN_MAIN_RENDERER_EVENT_NAME.import_user_api, fileText)
}
export const setUserApi = async(source: LX.UserApi.UserApiSetApiParams): Promise<void> => {
  return rendererInvoke<LX.UserApi.UserApiSetApiParams>(WIN_MAIN_RENDERER_EVENT_NAME.set_user_api, source)
}
export const removeUserApi = async(ids: string[]) => {
  return rendererInvoke<string[], LX.UserApi.UserApiInfo[]>(WIN_MAIN_RENDERER_EVENT_NAME.remove_user_api, ids)
}
export const onShowUserApiUpdateAlert = (listener: LX.IpcRendererEventListenerParams<LX.UserApi.UserApiUpdateInfo>): RemoveListener => {
  rendererOn(WIN_MAIN_RENDERER_EVENT_NAME.user_api_show_update_alert, listener)
  return () => {
    rendererOff(WIN_MAIN_RENDERER_EVENT_NAME.user_api_show_update_alert, listener)
  }
}
export const setAllowShowUserApiUpdateAlert = async(id: string, enable: boolean): Promise<void> => {
  return rendererInvoke(WIN_MAIN_RENDERER_EVENT_NAME.user_api_set_allow_update_alert, { id, enable })
}
export const onUserApiStatus = (listener: LX.IpcRendererEventListenerParams<LX.UserApi.UserApiStatus>): RemoveListener => {
  rendererOn(WIN_MAIN_RENDERER_EVENT_NAME.user_api_status, listener)
  return () => {
    rendererOff(WIN_MAIN_RENDERER_EVENT_NAME.user_api_status, listener)
  }
}
export const getUserApiList = async() => {
  return rendererInvoke<LX.UserApi.UserApiInfo[]>(WIN_MAIN_RENDERER_EVENT_NAME.get_user_api_list)
}
export const sendUserApiRequest = async({ requestKey, data }: LX.UserApi.UserApiRequestParams): Promise<any> => {
  return rendererInvoke(WIN_MAIN_RENDERER_EVENT_NAME.request_user_api, {
    requestKey,
    data,
  })
}
export const userApiRequestCancel = (requestKey: LX.UserApi.UserApiRequestCancelParams) => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.request_user_api_cancel, requestKey)
}

// export const setDesktopLyricInfo = (type, data, info) => {
//   rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.set_lyric_info, {
//     type,
//     data,
//     info,
//   })
// }
// export const onGetDesktopLyricInfo = callback => {
//   rendererOn(WIN_MAIN_RENDERER_EVENT_NAME.get_lyric_info, callback)
//   return () => {
//     rendererOff(callback)
//   }
// }

export const setTaskBarProgress = (progress: number, mode?: Electron.ProgressBarOptions['mode']) => {
  rendererSend<LX.Player.ProgressBarOptions>(WIN_MAIN_RENDERER_EVENT_NAME.progress, {
    progress: progress < 0 ? progress : Math.max(0.01, progress),
    mode: mode ?? 'normal',
  })
}

export const saveLastStartInfo = (version: string) => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.save_data, {
    path: DATA_KEYS.lastStartInfo,
    data: version,
  })
}
// 获取最后一次启动时的版本号
export const getLastStartInfo = async() => {
  return rendererInvoke<string, string | null>(WIN_MAIN_RENDERER_EVENT_NAME.get_data, DATA_KEYS.lastStartInfo)
}

export const savePlayInfo = (playInfo: LX.Player.SavedPlayInfo) => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.save_data, {
    path: DATA_KEYS.playInfo,
    data: playInfo,
  })
}
// 获取上次关闭时的当前歌曲播放信息
export const getPlayInfo = async() => {
  return rendererInvoke<string, LX.Player.SavedPlayInfo | null>(WIN_MAIN_RENDERER_EVENT_NAME.get_data, DATA_KEYS.playInfo)
}

export const saveSearchHistoryList = (list: LX.List.SearchHistoryList) => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.save_data, {
    path: DATA_KEYS.searchHistoryList,
    data: list,
  })
}
// 获取搜索历史列表
export const getSearchHistoryList = async() => {
  return rendererInvoke<string, string[] | null>(WIN_MAIN_RENDERER_EVENT_NAME.get_data, DATA_KEYS.searchHistoryList)
}

export const saveListPositionInfo = (listPosition: LX.List.ListPositionInfo) => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.save_data, {
    path: DATA_KEYS.listScrollPosition,
    data: listPosition,
  })
}
// 获取搜索历史列表
export const getListPositionInfo = async() => {
  return rendererInvoke<string, LX.List.ListPositionInfo | null>(WIN_MAIN_RENDERER_EVENT_NAME.get_data, DATA_KEYS.listScrollPosition)
}

export const saveListPrevSelectId = (listPosition: string | null) => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.save_data, {
    path: DATA_KEYS.listPrevSelectId,
    data: listPosition,
  })
}
// 获取上一次选中的列表id
export const getListPrevSelectId = async() => {
  return rendererInvoke<string, string | null>(WIN_MAIN_RENDERER_EVENT_NAME.get_data, DATA_KEYS.listPrevSelectId)
}

export const saveListUpdateInfo = (listPosition: LX.List.ListUpdateInfo) => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.save_data, {
    path: DATA_KEYS.listUpdateInfo,
    data: listPosition,
  })
}
// 获取列表更新记录
export const getListUpdateInfo = async() => {
  return rendererInvoke<string, LX.List.ListUpdateInfo | null>(WIN_MAIN_RENDERER_EVENT_NAME.get_data, DATA_KEYS.listUpdateInfo)
}

export const saveIgnoreVersion = (version: string) => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.save_data, {
    path: DATA_KEYS.ignoreVersion,
    data: version,
  })
}
// 获取忽略更新的版本号
export const getIgnoreVersion = async() => {
  return rendererInvoke<string, string | null>(WIN_MAIN_RENDERER_EVENT_NAME.get_data, DATA_KEYS.ignoreVersion)
}

export const saveLeaderboardSetting = (source: typeof DEFAULT_SETTING['leaderboard']) => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.save_data, {
    path: DATA_KEYS.leaderboardSetting,
    data: source,
  })
}
export const getLeaderboardSetting = async() => {
  return (await rendererInvoke<string, typeof DEFAULT_SETTING['leaderboard']>(WIN_MAIN_RENDERER_EVENT_NAME.get_data, DATA_KEYS.leaderboardSetting)) ?? { ...DEFAULT_SETTING.leaderboard }
}
export const saveSongListSetting = (setting: typeof DEFAULT_SETTING['songList']) => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.save_data, {
    path: DATA_KEYS.songListSetting,
    data: setting,
  })
}
export const getSongListSetting = async() => {
  return (await rendererInvoke<string, typeof DEFAULT_SETTING['songList']>(WIN_MAIN_RENDERER_EVENT_NAME.get_data, DATA_KEYS.songListSetting)) ?? { ...DEFAULT_SETTING.songList }
}
export const saveSearchSetting = (setting: typeof DEFAULT_SETTING['search']) => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.save_data, {
    path: DATA_KEYS.searchSetting,
    data: setting,
  })
}
export const getSearchSetting = async() => {
  return (await rendererInvoke<string, typeof DEFAULT_SETTING['search']>(WIN_MAIN_RENDERER_EVENT_NAME.get_data, DATA_KEYS.searchSetting)) ?? { ...DEFAULT_SETTING.search }
}
export const saveViewPrevState = (state: typeof DEFAULT_SETTING['viewPrevState']) => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.save_data, {
    path: DATA_KEYS.viewPrevState,
    data: state,
  })
}
export const getViewPrevState = async() => {
  return (await rendererInvoke<string, typeof DEFAULT_SETTING['viewPrevState']>(WIN_MAIN_RENDERER_EVENT_NAME.get_data, DATA_KEYS.viewPrevState)) ?? { ...DEFAULT_SETTING.viewPrevState }
}


export const getSystemFonts = async() => {
  return rendererInvoke<string[]>(CMMON_EVENT_NAME.get_system_fonts).catch(() => {
    return []
  })
}

export const getUserSoundEffectEQPresetList = async() => {
  return rendererInvoke<LX.SoundEffect.EQPreset[]>(WIN_MAIN_RENDERER_EVENT_NAME.get_sound_effect_eq_preset)
}

export const saveUserSoundEffectEQPresetList = (list: LX.SoundEffect.EQPreset[]) => {
  rendererSend<LX.SoundEffect.EQPreset[]>(WIN_MAIN_RENDERER_EVENT_NAME.save_sound_effect_eq_preset, list)
}

export const getUserSoundEffectConvolutionPresetList = async() => {
  return rendererInvoke<LX.SoundEffect.ConvolutionPreset[]>(WIN_MAIN_RENDERER_EVENT_NAME.get_sound_effect_convolution_preset)
}

export const saveUserSoundEffectConvolutionPresetList = (list: LX.SoundEffect.ConvolutionPreset[]) => {
  rendererSend<LX.SoundEffect.ConvolutionPreset[]>(WIN_MAIN_RENDERER_EVENT_NAME.save_sound_effect_convolution_preset, list)
}

// export const getUserSoundEffectPitchShifterPresetList = async() => {
//   return rendererInvoke<LX.SoundEffect.PitchShifterPreset[]>(WIN_MAIN_RENDERER_EVENT_NAME.get_sound_effect_pitch_shifter_preset)
// }

// export const saveUserSoundEffectPitchShifterPresetList = (list: LX.SoundEffect.PitchShifterPreset[]) => {
//   rendererSend<LX.SoundEffect.PitchShifterPreset[]>(WIN_MAIN_RENDERER_EVENT_NAME.save_sound_effect_pitch_shifter_preset, list)
// }

export const allHotKeys = markRaw({
  local: [
    {
      name: hotKeys.HOTKEY_PLAYER.toggle_play.name,
      action: hotKeys.HOTKEY_PLAYER.toggle_play.action,
      type: APP_EVENT_NAMES.winMainName,
    },
    {
      name: hotKeys.HOTKEY_PLAYER.prev.name,
      action: hotKeys.HOTKEY_PLAYER.prev.action,
      type: APP_EVENT_NAMES.winMainName,
    },
    {
      name: hotKeys.HOTKEY_PLAYER.next.name,
      action: hotKeys.HOTKEY_PLAYER.next.action,
      type: APP_EVENT_NAMES.winMainName,
    },
    {
      name: hotKeys.HOTKEY_PLAYER.music_dislike.name,
      action: hotKeys.HOTKEY_PLAYER.music_dislike.action,
      type: APP_EVENT_NAMES.winMainName,
    },
    {
      name: hotKeys.HOTKEY_COMMON.focusSearchInput.name,
      action: hotKeys.HOTKEY_COMMON.focusSearchInput.action,
      type: APP_EVENT_NAMES.winMainName,
    },
    {
      name: hotKeys.HOTKEY_COMMON.min.name,
      action: hotKeys.HOTKEY_COMMON.min.action,
      type: APP_EVENT_NAMES.winMainName,
    },
    {
      name: hotKeys.HOTKEY_COMMON.close.name,
      action: hotKeys.HOTKEY_COMMON.close.action,
      type: APP_EVENT_NAMES.winMainName,
    },
  ],
  global: [
    {
      name: hotKeys.HOTKEY_COMMON.min_toggle.name,
      action: hotKeys.HOTKEY_COMMON.min_toggle.action,
      type: APP_EVENT_NAMES.winMainName,
    },
    {
      name: hotKeys.HOTKEY_COMMON.hide_toggle.name,
      action: hotKeys.HOTKEY_COMMON.hide_toggle.action,
      type: APP_EVENT_NAMES.winMainName,
    },
    {
      name: hotKeys.HOTKEY_COMMON.close.name,
      action: hotKeys.HOTKEY_COMMON.close.action,
      type: APP_EVENT_NAMES.winMainName,
    },
    {
      name: hotKeys.HOTKEY_PLAYER.toggle_play.name,
      action: hotKeys.HOTKEY_PLAYER.toggle_play.action,
      type: APP_EVENT_NAMES.winMainName,
    },
    {
      name: hotKeys.HOTKEY_PLAYER.prev.name,
      action: hotKeys.HOTKEY_PLAYER.prev.action,
      type: APP_EVENT_NAMES.winMainName,
    },
    {
      name: hotKeys.HOTKEY_PLAYER.next.name,
      action: hotKeys.HOTKEY_PLAYER.next.action,
      type: APP_EVENT_NAMES.winMainName,
    },
    {
      name: hotKeys.HOTKEY_PLAYER.volume_up.name,
      action: hotKeys.HOTKEY_PLAYER.volume_up.action,
      type: APP_EVENT_NAMES.winMainName,
    },
    {
      name: hotKeys.HOTKEY_PLAYER.volume_down.name,
      action: hotKeys.HOTKEY_PLAYER.volume_down.action,
      type: APP_EVENT_NAMES.winMainName,
    },
    {
      name: hotKeys.HOTKEY_PLAYER.volume_mute.name,
      action: hotKeys.HOTKEY_PLAYER.volume_mute.action,
      type: APP_EVENT_NAMES.winMainName,
    },
    {
      name: hotKeys.HOTKEY_PLAYER.music_love.name,
      action: hotKeys.HOTKEY_PLAYER.music_love.action,
      type: APP_EVENT_NAMES.winMainName,
    },
    {
      name: hotKeys.HOTKEY_PLAYER.music_unlove.name,
      action: hotKeys.HOTKEY_PLAYER.music_unlove.action,
      type: APP_EVENT_NAMES.winMainName,
    },
    {
      name: hotKeys.HOTKEY_PLAYER.music_dislike.name,
      action: hotKeys.HOTKEY_PLAYER.music_dislike.action,
      type: APP_EVENT_NAMES.winMainName,
    },
    {
      name: hotKeys.HOTKEY_DESKTOP_LYRIC.toggle_visible.name,
      action: hotKeys.HOTKEY_DESKTOP_LYRIC.toggle_visible.action,
      type: APP_EVENT_NAMES.winLyricName,
    },
    {
      name: hotKeys.HOTKEY_DESKTOP_LYRIC.toggle_lock.name,
      action: hotKeys.HOTKEY_DESKTOP_LYRIC.toggle_lock.action,
      type: APP_EVENT_NAMES.winLyricName,
    },
    {
      name: hotKeys.HOTKEY_DESKTOP_LYRIC.toggle_always_top.name,
      action: hotKeys.HOTKEY_DESKTOP_LYRIC.toggle_always_top.action,
      type: APP_EVENT_NAMES.winLyricName,
    },
  ],
})

export const hotKeySetEnable = async(enable: boolean) => {
  return rendererInvoke(HOTKEY_RENDERER_EVENT_NAME.enable, enable)
}

export const hotKeySetConfig = async(config: LX.HotKeyActions) => {
  return rendererInvoke(HOTKEY_RENDERER_EVENT_NAME.set_config, config)
}

export const hotKeyGetStatus = async() => {
  return rendererInvoke<LX.HotKeyState>(HOTKEY_RENDERER_EVENT_NAME.status)
}

// 主进程操作播放器状态
export const onPlayerAction = (listener: LX.IpcRendererEventListenerParams<LX.Player.StatusButtonActions>): RemoveListener => {
  rendererOn(WIN_MAIN_RENDERER_EVENT_NAME.player_action_on_button_click, listener)
  return () => {
    rendererOff(WIN_MAIN_RENDERER_EVENT_NAME.player_action_on_button_click, listener)
  }
}
// export const setTaskbarThumbnailClip = async(clip: Electron.Rectangle) => {
//   await rendererInvoke(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_set_thumbnail_clip, clip)
// }
// 播放器状态更新 通知主进程
export const setPlayerAction = (buttons: LX.TaskBarButtonFlags) => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.player_action_set_buttons, buttons)
}

/**
 * On Theme Change
 * @param listener LX.IpcRendererEventListenerParams<shouldUseDarkColors: boolean>
 * @returns RemoveListener Fn
 */
export const onThemeChange = (listener: LX.IpcRendererEventListenerParams<LX.ThemeSetting>): RemoveListener => {
  rendererOn(CMMON_EVENT_NAME.theme_change, listener)
  return () => {
    rendererOff(CMMON_EVENT_NAME.theme_change, listener)
  }
}

/**
 * 选择路径
 */
export const showSelectDialog = async(options: Electron.OpenDialogOptions) => {
  return rendererInvoke<Electron.OpenDialogOptions, Electron.OpenDialogReturnValue>(WIN_MAIN_RENDERER_EVENT_NAME.show_select_dialog, options)
}

/**
 * 打开保存对话框
 */
export const openSaveDir = async(options: Electron.SaveDialogOptions) => {
  return rendererInvoke<Electron.SaveDialogOptions, Electron.SaveDialogReturnValue>(WIN_MAIN_RENDERER_EVENT_NAME.show_save_dialog, options)
}


/**
 * 获取缓存大小
 */
export const getCacheSize = async() => {
  return rendererInvoke<number>(WIN_MAIN_RENDERER_EVENT_NAME.get_cache_size)
}

/**
 * 清除缓存
 */
export const clearCache = async() => {
  await rendererInvoke(WIN_MAIN_RENDERER_EVENT_NAME.clear_cache)
}

/**
 * 设置窗口大小
 * @param {*} width
 * @param {*} height
 */
export const setWindowSize = (width: number, height: number) => {
  const params: Partial<Electron.Rectangle> = {
    width,
    height,
  }
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.set_window_size, params)
}


export const getPlayerLyric = async(musicInfo: LX.Music.MusicInfo) => {
  return rendererInvoke<string, LX.Player.LyricInfo>(WIN_MAIN_RENDERER_EVENT_NAME.get_palyer_lyric, musicInfo.id)
}

export const getLyricRaw = async(musicInfo: LX.Music.MusicInfo): Promise<LX.Music.LyricInfo> => {
  return rendererInvoke<string, LX.Music.LyricInfo>(WIN_MAIN_RENDERER_EVENT_NAME.get_lyric_raw, musicInfo.id)
}

export const clearLyricRaw = async() => {
  await rendererInvoke(WIN_MAIN_RENDERER_EVENT_NAME.clear_lyric_raw)
}

export const getLyricRawCount = async() => {
  return rendererInvoke<number>(WIN_MAIN_RENDERER_EVENT_NAME.get_lyric_raw_count)
}


export const getLyricEdited = async(musicInfo: LX.Music.MusicInfo): Promise<LX.Music.LyricInfo> => {
  return rendererInvoke<string, LX.Music.LyricInfo>(WIN_MAIN_RENDERER_EVENT_NAME.get_lyric_edited, musicInfo.id)
}

export const saveLyric = async(musicInfo: LX.Music.MusicInfo, lyricInfo: LX.Music.LyricInfo | LX.Player.LyricInfo) => {
  // console.log(musicInfo)
  if ('rawlrcInfo' in lyricInfo) {
    const { rawlrcInfo, ...info } = lyricInfo
    const tasks = [
      rendererInvoke<LX.Music.LyricInfoSave>(WIN_MAIN_RENDERER_EVENT_NAME.save_lyric_raw, {
        id: musicInfo.id,
        lyrics: rawlrcInfo,
      }),
    ]
    if (info.lyric != rawlrcInfo.lyric) {
      tasks.push(rendererInvoke<LX.Music.LyricInfoSave>(WIN_MAIN_RENDERER_EVENT_NAME.save_lyric_edited, {
        id: musicInfo.id,
        lyrics: info,
      }))
    }
    console.log(tasks)
    await Promise.all(tasks)
  } else {
    await rendererInvoke<LX.Music.LyricInfoSave>(WIN_MAIN_RENDERER_EVENT_NAME.save_lyric_raw, {
      id: musicInfo.id,
      lyrics: lyricInfo,
    })
  }
}
export const saveLyricEdited = async(musicInfo: LX.Music.MusicInfo, lyricInfo: LX.Music.LyricInfo) => {
  await rendererInvoke<LX.Music.LyricInfoSave>(WIN_MAIN_RENDERER_EVENT_NAME.save_lyric_edited, {
    id: musicInfo.id,
    lyrics: lyricInfo,
  })
}
export const removeLyricEdited = async(musicInfo: LX.Music.MusicInfo) => {
  await rendererInvoke(WIN_MAIN_RENDERER_EVENT_NAME.remove_lyric_edited, musicInfo.id)
}

export const clearLyric = async() => {
  await rendererInvoke(WIN_MAIN_RENDERER_EVENT_NAME.clear_lyric_raw)
}

export const clearLyricEdited = async() => {
  await rendererInvoke(WIN_MAIN_RENDERER_EVENT_NAME.clear_lyric_edited)
}

export const getLyricEditedCount = async() => {
  return rendererInvoke<number>(WIN_MAIN_RENDERER_EVENT_NAME.get_lyric_edited_count)
}


export const saveTheme = async(theme: LX.Theme) => {
  return rendererInvoke<LX.Theme>(WIN_MAIN_RENDERER_EVENT_NAME.save_theme, theme)
}
export const removeTheme = async(id: string) => {
  return rendererInvoke<string>(WIN_MAIN_RENDERER_EVENT_NAME.remove_theme, id)
}
export const getThemes = async() => {
  return rendererInvoke<{ themes: LX.Theme[], userThemes: LX.Theme[], dataPath: string }>(WIN_MAIN_RENDERER_EVENT_NAME.get_themes)
}

/**
 * 从缓存获取歌曲URL
 * @param musicInfo 歌曲信息
 * @param type URL音质
 * @returns
 */
export const getMusicUrl = async(musicInfo: LX.Music.MusicInfo, type: LX.Quality): Promise<string> => {
  return rendererInvoke<string, string>(WIN_MAIN_RENDERER_EVENT_NAME.get_music_url, `${musicInfo.id}_${type}`)
}

/**
 * 缓存歌曲URL
 * @param musicInfo 歌曲信息
 * @param type URL音质
 * @param url 歌曲URL
 */
export const saveMusicUrl = async(musicInfo: LX.Music.MusicInfo, type: LX.Quality, url: string) => {
  await rendererInvoke<LX.Music.MusicUrlInfo>(WIN_MAIN_RENDERER_EVENT_NAME.save_music_url, {
    id: `${musicInfo.id}_${type}`,
    url,
  })
}
/**
 * 清理所有缓存的歌曲URL
 */
export const clearMusicUrl = async() => {
  await rendererInvoke(WIN_MAIN_RENDERER_EVENT_NAME.clear_music_url)
}

export const getMusicUrlCount = async() => {
  return rendererInvoke<number>(WIN_MAIN_RENDERER_EVENT_NAME.get_music_url_count)
}

/**
 * 退出应用
 */
export const quitApp = () => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.quit)
}

/**
 * 关闭窗口
 */
export const closeWindow = () => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.close)
}

/**
 * 最小化窗口
 */
export const minWindow = () => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.min)
}

/**
 * 最大化窗口
 */
export const maxWindow = () => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.max)
}

/**
 * 最小化、最大化窗口切换
 */
export const minMaxWindowToggle = () => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.min_toggle)
}
/**
 * 显示、隐藏窗口切换
 */
export const showHideWindowToggle = () => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.hide_toggle)
}
/**
 * 聚焦窗口
 */
export const focusWindow = () => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.focus)
}

/**
 * 窗口获取焦点事件
 * @param listener
 * @returns
 */
export const onFocus = (listener: LX.IpcRendererEventListener): RemoveListener => {
  rendererOn(WIN_MAIN_RENDERER_EVENT_NAME.focus, listener)
  return () => {
    rendererOff(WIN_MAIN_RENDERER_EVENT_NAME.focus, listener)
  }
}

/**
 * 快捷键触发事件
 * @param listener
 * @returns
 */
export const onKeyDown = (listener: LX.IpcRendererEventListenerParams<LX.HotKeyEvent>): RemoveListener => {
  rendererOn(WIN_MAIN_RENDERER_EVENT_NAME.key_down, listener)
  return () => {
    rendererOff(WIN_MAIN_RENDERER_EVENT_NAME.key_down, listener)
  }
}

/**
 * 快捷键设置更新事件
 * @param listener
 * @returns
 */
export const onUpdateHotkey = (listener: LX.IpcRendererEventListenerParams<LX.HotKeyConfigAll>): RemoveListener => {
  rendererOn(WIN_MAIN_RENDERER_EVENT_NAME.set_hot_key_config, listener)
  return () => {
    rendererOff(WIN_MAIN_RENDERER_EVENT_NAME.set_hot_key_config, listener)
  }
}

/**
 * 设置全屏
 * @param isFullscreen 是否全屏
 * @returns
 */
export const setFullScreen = async(isFullscreen: boolean): Promise<boolean> => {
  return rendererInvoke<boolean, boolean>(WIN_MAIN_RENDERER_EVENT_NAME.fullscreen, isFullscreen)
}

/**
 * 打开开发者工具
 * @returns
 */
export const openDevTools = () => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.open_dev_tools)
}

/**
 * 接收同步事件
 * @param listener
 * @returns
 */
export const onSyncAction = (listener: LX.IpcRendererEventListenerParams<LX.Sync.SyncMainWindowActions>): RemoveListener => {
  rendererOn(WIN_MAIN_RENDERER_EVENT_NAME.sync_action, listener)
  return () => {
    rendererOff(WIN_MAIN_RENDERER_EVENT_NAME.sync_action, listener)
  }
}

/**
 * 发送同步事件
 * @param action
 * @returns
 */
export const sendSyncAction = async(action: LX.Sync.SyncServiceActions) => {
  return rendererInvoke<LX.Sync.SyncServiceActions>(WIN_MAIN_RENDERER_EVENT_NAME.sync_action, action)
}

/**
 * 获取同步服务端连接设备历史列表
 * @returns
 */
export const getSyncServerDevices = () => {
  return rendererInvoke<LX.Sync.ServerDevices>(WIN_MAIN_RENDERER_EVENT_NAME.sync_get_server_devices)
}

/**
 * 移除同步服务端连接设备
 * @returns
 */
export const removeSyncServerDevice = (clientId: string) => {
  return rendererInvoke<string>(WIN_MAIN_RENDERER_EVENT_NAME.sync_remove_server_device, clientId)
}


// export const refreshSyncCode = async(): Promise<string> => {
//   return rendererInvoke(WIN_MAIN_RENDERER_EVENT_NAME.sync_generate_code)
// }

// export const onSyncStatus = (listener: LX.IpcRendererEventListenerParams<LX.Sync.Status>): RemoveListener => {
//   rendererOn(WIN_MAIN_RENDERER_EVENT_NAME.sync_status, listener)

//   return () => {
//     rendererOff(WIN_MAIN_RENDERER_EVENT_NAME.sync_status, listener)
//   }
// }

/**
 * 桌面歌词进程创建事件
 * @param listener
 * @returns
 */
export const onNewDesktopLyricProcess = (listener: LX.IpcRendererEventListener): RemoveListener => {
  rendererOn(WIN_MAIN_RENDERER_EVENT_NAME.process_new_desktop_lyric_client, listener)
  return () => {
    rendererOff(WIN_MAIN_RENDERER_EVENT_NAME.process_new_desktop_lyric_client, listener)
  }
}


export const downloadTasksGet = async() => {
  return rendererInvoke<LX.Download.ListItem[]>(WIN_MAIN_RENDERER_EVENT_NAME.download_list_get)
}
export const downloadTasksCreate = async(list: LX.Download.ListItem[], addMusicLocationType: LX.AddMusicLocationType) => {
  return rendererInvoke<LX.Download.saveDownloadMusicInfo>(WIN_MAIN_RENDERER_EVENT_NAME.download_list_add, {
    list,
    addMusicLocationType,
  })
}
export const downloadTasksUpdate = async(list: LX.Download.ListItem[]) => {
  return rendererInvoke<LX.Download.ListItem[]>(WIN_MAIN_RENDERER_EVENT_NAME.download_list_update, list)
}
export const downloadTasksRemove = async(ids: string[]) => {
  return rendererInvoke<string[]>(WIN_MAIN_RENDERER_EVENT_NAME.download_list_remove, ids)
}
export const downloadListClear = async() => {
  return rendererInvoke(WIN_MAIN_RENDERER_EVENT_NAME.download_list_clear)
}
