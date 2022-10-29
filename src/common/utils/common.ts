// 非业务工具方法

/**
 * 获取两个数之间的随机整数，大于等于min，小于max
 * @param {*} min
 * @param {*} max
 */
export const getRandom = (min: number, max: number): number => Math.floor(Math.random() * (max - min)) + min


export const sizeFormate = (size: number): string => {
  // https://gist.github.com/thomseddon/3511330
  if (!size) return '0 B'
  let units = ['B', 'KB', 'MB', 'GB', 'TB']
  let number = Math.floor(Math.log(size) / Math.log(1024))
  return `${(size / Math.pow(1024, Math.floor(number))).toFixed(2)} ${units[number]}`
}

const numFix = (n: number): string => n < 10 ? (`0${n}`) : n.toString()
/**
    * 日期格式化
    * @param {*} date 时间
    * @param {String} format 时间格式，默认YYYY-MM-DD hh:mm:ss
    */
export const dateFormat = (date: string | number | Date, format = 'YYYY-MM-DD hh:mm:ss') => {
  if (typeof date != 'object') date = new Date(date)
  return format
    .replace('YYYY', date.getFullYear().toString())
    .replace('MM', numFix(date.getMonth() + 1).toString())
    .replace('DD', numFix(date.getDate()))
    .replace('hh', numFix(date.getHours()))
    .replace('mm', numFix(date.getMinutes()))
    .replace('ss', numFix(date.getSeconds()))
}


export const formatPlayTime = (time: number) => {
  let m = Math.trunc(time / 60)
  let s = Math.trunc(time % 60)
  return m == 0 && s == 0 ? '--/--' : numFix(m) + ':' + numFix(s)
}

export const formatPlayTime2 = (time: number) => {
  let m = Math.trunc(time / 60)
  let s = Math.trunc(time % 60)
  return numFix(m) + ':' + numFix(s)
}


const encodeNames = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#039;': "'",
} as const
export const decodeName = (str: string | null = '') => {
  return str?.replace(/(?:&amp;|&lt;|&gt;|&quot;|&apos;|&#039;|&nbsp;)/gm, (s: string) => encodeNames[s as keyof typeof encodeNames]) ?? ''
}

export const isUrl = (path: string) => /https?:\/\//.test(path)

// 解析URL参数为对象
export const parseUrlParams = (str: string): Record<string, string> => {
  const params: Record<string, string> = {}
  if (typeof str !== 'string') return params
  const paramsArr = str.split('&')
  for (const param of paramsArr) {
    let [key, value] = param.split('=')
    params[key] = value
  }
  return params
}

/**
 * 生成节流函数
 * @param fn 回调
 * @param delay 延迟
 * @returns
 */
export function throttle<Args extends any[]>(fn: (...args: Args) => void | Promise<void>, delay = 100) {
  let timer: NodeJS.Timeout | null = null
  let _args: Args
  return (...args: Args) => {
    _args = args
    if (timer) return
    timer = setTimeout(() => {
      timer = null
      void fn(..._args)
    }, delay)
  }
}

/**
 * 生成防抖函数
 * @param fn 回调
 * @param delay 延迟
 * @returns
 */
export function debounce<Args extends any[]>(fn: (...args: Args) => void | Promise<void>, delay = 100) {
  let timer: NodeJS.Timeout | null = null
  let _args: Args
  return (...args: Args) => {
    _args = args
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      void fn(..._args)
    }, delay)
  }
}

const fileNameRxp = /[\\/:*?#"<>|]/g
export const filterFileName = (name: string): string => name.replace(fileNameRxp, '')


// https://blog.csdn.net/xcxy2015/article/details/77164126#comments
/**
 *
 * @param a
 * @param b
 */
export const similar = (a: string, b: string) => {
  if (!a || !b) return 0
  if (a.length > b.length) { // 保证 a <= b
    let t = b
    b = a
    a = t
  }
  let al = a.length
  let bl = b.length
  let mp = [] // 一个表
  let i, j, ai, lt, tmp // ai：字符串a的第i个字符。 lt：左上角的值。 tmp：暂存新的值。
  for (i = 0; i <= bl; i++) mp[i] = i
  for (i = 1; i <= al; i++) {
    ai = a.charAt(i - 1)
    lt = mp[0]
    mp[0] = mp[0] + 1
    for (j = 1; j <= bl; j++) {
      tmp = Math.min(mp[j] + 1, mp[j - 1] + 1, lt + (ai == b.charAt(j - 1) ? 0 : 1))
      lt = mp[j]
      mp[j] = tmp
    }
  }
  return 1 - (mp[bl] / bl)
}

/**
 * 排序字符串
 * @param arr
 * @param data
 */
export const sortInsert = (arr: Array<{ num: number, data: any }>, data: { num: number, data: any }) => {
  let key = data.num
  let left = 0
  let right = arr.length - 1

  while (left <= right) {
    let middle = Math.trunc((left + right) / 2)
    if (key == arr[middle].num) {
      left = middle
      break
    } else if (key < arr[middle].num) {
      right = middle - 1
    } else {
      left = middle + 1
    }
  }
  while (left > 0) {
    if (arr[left - 1].num != key) break
    left--
  }

  arr.splice(left, 0, data)
}
