import fs from 'fs'
import { shell, clipboard } from 'electron'
import path from 'path'
import os from 'os'
import crypto from 'crypto'
import { rendererSend, rendererInvoke } from '../../common/ipc'

/**
 * 获取两个数之间的随机整数，大于等于min，小于max
 * @param {*} min
 * @param {*} max
 */
export const getRandom = (min, max) => Math.floor(Math.random() * (max - min)) + min


export const sizeFormate = size => {
  // https://gist.github.com/thomseddon/3511330
  if (!size) return '0 B'
  let units = ['B', 'KB', 'MB', 'GB', 'TB']
  let number = Math.floor(Math.log(size) / Math.log(1024))
  return `${(size / Math.pow(1024, Math.floor(number))).toFixed(2)} ${units[number]}`
}

export const formatPlayTime = time => {
  let m = parseInt(time / 60)
  let s = parseInt(time % 60)
  return m === 0 && s === 0 ? '--/--' : (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s)
}

export const formatPlayTime2 = time => {
  let m = parseInt(time / 60)
  let s = parseInt(time % 60)
  return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s)
}

export const b64DecodeUnicode = str => {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(window.atob(str).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  }).join(''))
}

export const decodeName = str => str.replace(/&apos;/g, '\'')

export const scrollTo = (element, to, duration = 300, fn = function() {}) => {
  if (!element) return
  const start = element.scrollTop || element.scrollY || 0
  const change = to - start
  const increment = 10
  if (!change) {
    fn()
    return
  }
  let currentTime = 0; let val
  const easeInOutQuad = (t, b, c, d) => {
    t /= d / 2
    if (t < 1) return (c / 2) * t * t + b
    t--
    return (-c / 2) * (t * (t - 2) - 1) + b
  }
  const animateScroll = () => {
    currentTime += increment
    val = parseInt(easeInOutQuad(currentTime, start, change, duration))
    if (element.scrollTo) {
      element.scrollTo(0, val)
    } else {
      element.scrollTop = val
    }
    if (currentTime < duration) {
      setTimeout(animateScroll, increment)
    } else {
      fn()
    }
  }
  animateScroll()
}

/**
 * 检查路径是否存在
 * @param {*} path
 */
export const checkPath = path => fs.existsSync(path)


/**
 * 在资源管理器中打开目录
 * @param {*} 选项
 */
export const selectDir = options => rendererInvoke('selectDir', options)

/**
 * 在资源管理器中打开目录
 * @param {*} 选项
 */
export const openSaveDir = options => rendererInvoke('showSaveDialog', options)

/**
 * 在资源管理器中打开目录
 * @param {*} dir
 */
export const openDirInExplorer = dir => {
  shell.showItemInFolder(dir)
}

export const checkVersion = (currentVer, targetVer) => {
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

export const isObject = item => item && typeof item === 'object' && !Array.isArray(item)

/**
 * 对象深度合并
 * 注意：循环引用的对象会出现死循环
 * @param  {} target 要合并源对象
 * @param  {} source 要合并目标对象
 */
export const objectDeepMerge = (target, source) => {
  let base = {}
  Object.keys(source).forEach(item => {
    if (Array.isArray(source[item])) {
      let arr = Array.isArray(target[item]) ? target[item] : []
      target[item] = arr.concat(source[item])
      return
    } else if (isObject(source[item])) {
      if (!isObject(target[item])) target[item] = {}
      objectDeepMerge(target[item], source[item])
      return
    }
    base[item] = source[item]
  })
  Object.assign(target, base)
}

/**
 * 判断是否父子元素
 * @param {*} parent
 * @param {*} children
 */
export const isChildren = (parent, children) => {
  return children.parentNode ? children.parentNode === parent ? true : isChildren(parent, children.parentNode) : false
}

/**
 * 升级设置
 * @param {*} setting
 */
export const updateSetting = setting => {
  const defaultVersion = '1.0.13'
  const defaultSetting = {
    version: defaultVersion,
    player: {
      togglePlayMethod: 'listLoop',
      highQuality: false,
      isShowTaskProgess: true,
      volume: 1,
    },
    list: {
      isShowAlbumName: true,
      isShowSource: false,
      scroll: {
        enable: true,
        locations: {},
      },
    },
    download: {
      savePath: path.join(os.homedir(), 'Desktop'),
      fileName: '歌名 - 歌手',
      maxDownloadNum: 3,
      isDownloadLrc: false,
      isEmbedPic: true,
    },
    leaderboard: {
      source: 'kw',
      tabId: 'kwbiaosb',
    },
    songList: {
      source: 'kg',
      sortId: '5',
      tagInfo: {
        name: '默认',
        id: null,
      },
    },
    odc: {
      isAutoClearSearchInput: false,
    },
    search: {
      searchSource: 'kw',
      tempSearchSource: 'kw',
    },
    network: {
      proxy: {
        enable: false,
        host: '',
        port: '',
        username: '',
        password: '',
      },
    },
    windowSizeId: 1,
    themeId: 0,
    sourceId: 'kw',
    apiSource: 'test',
    randomAnimate: true,
  }
  const overwriteSetting = {
    version: defaultVersion,
  }


  if (!setting) {
    setting = defaultSetting
  } else if (checkVersion(setting.version, defaultSetting.version)) {
    objectDeepMerge(defaultSetting, setting)
    objectDeepMerge(defaultSetting, overwriteSetting)
    setting = defaultSetting
  }
  if (setting.apiSource != 'temp') setting.apiSource = 'test' // 强制设置回 test 接口源
  return setting
}

/**
 * 在浏览器打开URL
 * @param {*} url
 */
export const openUrl = url => {
  shell.openExternal(url)
}

/**
 * 设置标题
 */
let dom_title = document.getElementsByTagName('title')[0]
export const setTitle = title => {
  dom_title.innerText = title || '洛雪音乐助手'
}


/**
 * 创建 MD5 hash
 * @param {*} str
 */
export const toMD5 = str => crypto.createHash('md5').update(str).digest('hex')

/**
 * 复制文本到剪贴板
 * @param {*} str
 */
export const clipboardWriteText = str => clipboard.writeText(str)

/**
 * 设置音频 meta 信息
 * @param {*} filePath
 * @param {*} meta
 */
export const setMeta = (filePath, meta) => {
  rendererSend('setMusicMeta', { filePath, meta })
}

/**
 * 保存歌词文件
 * @param {*} filePath
 * @param {*} lrc
 */
export const saveLrc = (filePath, lrc) => {
  fs.writeFile(filePath, lrc, 'utf8', err => {
    if (err) console.log(err)
  })
}

/**
 * 生成节流函数
 * @param {*} fn
 * @param {*} delay
 */
export const throttle = (fn, delay = 100) => {
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
export const debounce = (fn, delay = 100) => {
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

const async_removeItem = (arr, num, callback) => window.requestAnimationFrame(() => {
  let len = arr.length
  if (len > num) {
    arr.splice(0, num)
    return async_removeItem(arr, num, callback)
  } else {
    arr.splice(0, len)
    return callback()
  }
})
const async_addItem = (arr, newArr, num, callback) => window.requestAnimationFrame(() => {
  let len = newArr.length
  if (len > num) {
    arr.push(...newArr.splice(0, num))
    return async_addItem(arr, newArr, num, callback)
  } else {
    arr.push(...newArr.splice(0, len))
    return callback()
  }
})
/**
 * 异步设置数组
 * @param {*} from 原数组
 * @param {*} to 设置后的数组内容
 * @param {*} num 每次设置的个数
 */
export const asyncSetArray = (from, to, num = 100) => new Promise(resolve => {
  async_removeItem(from, num, () => {
    async_addItem(from, Array.from(to), num, () => {
      resolve()
    })
  })
})


/**
 * 获取缓存大小
 */
export const getCacheSize = () => rendererInvoke('getCacheSize')

/**
 * 清除缓存
 */
export const clearCache = () => rendererInvoke('clearCache')

/**
 * 设置窗口大小
 * @param {*} width
 * @param {*} height
 */
export const setWindowSize = (width, height) => rendererSend('setWindowSize', { width, height })
