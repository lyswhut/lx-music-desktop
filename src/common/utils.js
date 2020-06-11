const log = require('electron-log')
const Store = require('electron-store')
const { defaultSetting, overwriteSetting } = require('./defaultSetting')
const apiSource = require('../renderer/utils/music/api-source-info')

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


exports.checkVersion = (currentVer, targetVer) => {
  // console.log(currentVer)
  // console.log(targetVer)
  currentVer = currentVer.split('.')
  targetVer = targetVer.split('.')
  let maxLen = Math.max(currentVer.length, targetVer.length)
  if (currentVer.length < maxLen) {
    for (let index = 0, len = maxLen - currentVer.length; index < len; index++) {
      currentVer.push(0)
    }
  }
  if (targetVer.length < maxLen) {
    for (let index = 0, len = maxLen - targetVer.length; index < len; index++) {
      targetVer.push(0)
    }
  }
  for (let index = 0; index < currentVer.length; index++) {
    if (parseInt(currentVer[index]) < parseInt(targetVer[index])) return true
    if (parseInt(currentVer[index]) > parseInt(targetVer[index])) return false
  }
  return false
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
  const defaultVersion = defaultSetting.version
  if (!version) {
    if (setting) {
      version = setting.version
      delete setting.version
    }
  }

  if (!setting) {
    setting = defaultSetting
  } else if (exports.checkVersion(version, defaultVersion)) {
    exports.objectDeepMerge(defaultSetting, setting)
    exports.objectDeepMerge(defaultSetting, overwriteSetting)
    setting = defaultSetting
  }

  if (!apiSource.some(api => api.id === setting.apiSource && !api.disabled)) {
    let api = apiSource.find(api => !api.disabled)
    if (api) setting.apiSource = api.id
  }

  return { setting, version: defaultVersion }
}

/**
 * 初始化设置
 * @param {*} setting
 */
exports.initSetting = () => {
  const electronStore_list = new Store({
    name: 'playList',
  })
  const electronStore_config = new Store({
    name: 'config',
  })
  let setting = electronStore_config.get('setting')
  if (!electronStore_config.get('version') && setting) { // 迁移配置
    electronStore_config.set('version', electronStore_config.get('setting.version'))
    electronStore_config.delete('setting.version')
    const list = electronStore_config.get('list')
    if (list) {
      if (list.defaultList) electronStore_list.set('defaultList', list.defaultList)
      if (list.loveList) electronStore_list.set('loveList', list.loveList)
      electronStore_config.delete('list')
    }
    const downloadList = electronStore_config.get('download')
    if (downloadList) {
      if (downloadList.list) electronStore_list.set('downloadList', downloadList.list)
      electronStore_config.delete('download')
    }
  }

  // 迁移列表滚动位置设置 ~0.18.3
  if (setting && setting.list.scroll) {
    let scroll = setting.list.scroll
    electronStore_list.set('defaultList.location', scroll.locations.defaultList || 0)
    electronStore_list.set('loveList.location', scroll.locations.loveList || 0)
    electronStore_config.delete('setting.list.scroll')
    electronStore_config.set('setting.list.isSaveScrollLocation', scroll.enable)
  }

  const { version: settingVersion, setting: newSetting } = exports.mergeSetting(setting, electronStore_config.get('version'))

  // 重置 ^0.18.2 排行榜ID
  if (!newSetting.leaderboard.tabId.includes('__')) newSetting.leaderboard.tabId = 'kw__16'

  // newSetting.controlBtnPosition = 'right'
  electronStore_config.set('version', settingVersion)
  electronStore_config.set('setting', newSetting)
  return newSetting
}
