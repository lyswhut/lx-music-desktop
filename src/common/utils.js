const log = require('electron-log')
const { defaultSetting, overwriteSetting } = require('./defaultSetting')
// const apiSource = require('../renderer/utils/music/api-source-info')
const getStore = require('./store')
const defaultHotKey = require('./defaultHotKey')

exports.isLinux = process.platform == 'linux'
exports.isWin = process.platform == 'win32'
exports.isMac = process.platform == 'darwin'


/**
 * 生成节流函数
 * @param {*} fn
 * @param {*} delay
 */
exports.throttle = (fn, delay = 100) => {
  let timer = null
  let _args = null
  return function(...args) {
    _args = args
    if (timer) return
    timer = setTimeout(() => {
      timer = null
      fn.apply(this, _args)
    }, delay)
  }
}

/**
 * 生成防抖函数
 * @param {*} fn
 * @param {*} delay
 */
exports.debounce = (fn, delay = 100) => {
  let timer = null
  let _args = null
  return function(...args) {
    _args = args
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn.apply(this, _args)
    }, delay)
  }
}


exports.log = log

// https://stackoverflow.com/a/53387532
exports.compareVer = (currentVer, targetVer) => {
  // treat non-numerical characters as lower version
  // replacing them with a negative number based on charcode of each character
  const fix = s => `.${s.toLowerCase().charCodeAt(0) - 2147483647}.`

  currentVer = ('' + currentVer).replace(/[^0-9.]/g, fix).split('.')
  targetVer = ('' + targetVer).replace(/[^0-9.]/g, fix).split('.')
  let c = Math.max(currentVer.length, targetVer.length)
  for (let i = 0; i < c; i++) {
    // convert to integer the most efficient way
    currentVer[i] = ~~currentVer[i]
    targetVer[i] = ~~targetVer[i]
    if (currentVer[i] > targetVer[i]) return 1
    else if (currentVer[i] < targetVer[i]) return -1
  }
  return 0
}

exports.isObject = item => item && typeof item === 'object' && !Array.isArray(item)

/**
 * 对象深度合并
 * @param  {} target 要合并源对象
 * @param  {} source 要合并目标对象
 */
exports.objectDeepMerge = (target, source, mergedObj) => {
  if (!mergedObj) {
    mergedObj = new Set()
    mergedObj.add(target)
  }
  let base = {}
  Object.keys(source).forEach(item => {
    if (exports.isObject(source[item])) {
      if (mergedObj.has(source[item])) return
      if (!exports.isObject(target[item])) target[item] = {}
      mergedObj.add(source[item])
      exports.objectDeepMerge(target[item], source[item], mergedObj)
      return
    }
    base[item] = source[item]
  })
  Object.assign(target, base)
}

exports.mergeSetting = (setting, version) => {
  let defaultSettingCopy = JSON.parse(JSON.stringify(defaultSetting))
  let overwriteSettingCopy = JSON.parse(JSON.stringify(overwriteSetting))
  const defaultVersion = defaultSettingCopy.version
  if (!version) {
    if (setting) {
      version = setting.version
      delete setting.version
    }
  }

  if (!setting) {
    setting = defaultSettingCopy
  } else if (exports.compareVer(version, defaultVersion) < 0) {
    exports.objectDeepMerge(defaultSettingCopy, setting)
    exports.objectDeepMerge(defaultSettingCopy, overwriteSettingCopy)
    setting = defaultSettingCopy
  }

  // if (!apiSource.some(api => api.id === setting.apiSource && !api.disabled)) {
  //   let api = apiSource.find(api => !api.disabled)
  //   if (api) setting.apiSource = api.id
  // }

  return { setting, version: defaultVersion }
}

/**
 * 初始化设置
 * @param {*} setting
 * @param {*} isShowErrorAlert
 */
exports.initSetting = isShowErrorAlert => {
  const electronStore_list = getStore('playList', true, isShowErrorAlert)
  const electronStore_config = getStore('config')
  const electronStore_downloadList = getStore('downloadList')

  let setting = electronStore_config.get('setting')
  if (setting) {
    let version = electronStore_config.get('version')
    if (!version) { // 迁移配置
      version = electronStore_config.get('setting.version')
      electronStore_config.set('version', version)
      electronStore_config.delete('setting.version')
      const list = electronStore_config.get('list')
      if (list) {
        if (list.defaultList) electronStore_list.set('defaultList', list.defaultList)
        if (list.loveList) electronStore_list.set('loveList', list.loveList)
        electronStore_config.delete('list')
      }
      const downloadList = electronStore_config.get('download')
      if (downloadList) {
        if (downloadList.list) electronStore_downloadList.set('list', downloadList.list)
        electronStore_config.delete('download')
      }
    }

    // 迁移列表滚动位置设置 ~0.18.3
    if (setting.list.scroll) {
      let scroll = setting.list.scroll
      electronStore_config.delete('setting.list.scroll')
      electronStore_config.set('setting.list.isSaveScrollLocation', scroll.enable)
      delete setting.list.scroll
    }
  }

  // 从我的列表分离下载列表 v1.7.0 后
  let downloadList = electronStore_list.get('downloadList')
  if (downloadList) {
    electronStore_downloadList.set('list', downloadList)
    electronStore_list.delete('downloadList')
  }

  const { version: settingVersion, setting: newSetting } = exports.mergeSetting(setting, electronStore_config.get('version'))

  // 修正拼写问题 v1.8.2 及以前
  if (newSetting.player.isShowLyricTransition != null) {
    newSetting.player.isShowLyricTranslation = newSetting.player.isShowLyricTransition
    delete newSetting.player.isShowLyricTransition
  }

  // 迁移v1.19.0之前的主题设置
  if (newSetting.themeId != null) {
    newSetting.theme.id = newSetting.themeId
    delete newSetting.themeId
  }

  // 重置 ^0.18.2 排行榜ID
  if (!newSetting.leaderboard.tabId.includes('__')) newSetting.leaderboard.tabId = 'kw__16'

  // newSetting.controlBtnPosition = 'right'
  electronStore_config.set({ version: settingVersion, setting: newSetting })
  return { version: settingVersion, setting: newSetting }
}

/**
 * 初始化快捷键设置
 */
exports.initHotKey = () => {
  const electronStore_hotKey = getStore('hotKey')

  let localConfig = electronStore_hotKey.get('local')
  if (!localConfig) {
    localConfig = defaultHotKey.local
    electronStore_hotKey.set('local', localConfig)
  }

  let globalConfig = electronStore_hotKey.get('global')

  // 移除v1.0.1及之前设置的全局声音媒体快捷键接管
  if (globalConfig && globalConfig.keys.VolumeUp) {
    delete globalConfig.keys.VolumeUp
    delete globalConfig.keys.VolumeDown
    delete globalConfig.keys.VolumeMute
    electronStore_hotKey.set('global', globalConfig)
  }

  if (!globalConfig) {
    globalConfig = defaultHotKey.global
    electronStore_hotKey.set('global', globalConfig)
  }

  return {
    global: globalConfig,
    local: localConfig,
  }
}
