import { dateFormat, decodeName } from '@common/utils/common'

export * from '@common/utils/renderer'
export * from '@common/utils/nodejs'
export * from '@common/utils/common'
export * from '@common/utils/tools'

/**
 * 获取歌手
 * @param singers 歌手数组
 * @param obj 读取的数据
 * @param join 插入的字符
 */
export const getSingerName = (singers: [], obj = 'name', join = '、') => {
  const singer: string[] = []
  singers.forEach(item => {
    let name  = item[obj]
    if (!name) return
    singer.push(name)
  })
  return decodeName(singer.join(join))
}

/**
 * 时间格式化
 */
export const dateFormat2 = (time: number): string => {
  let differ = Math.trunc((Date.now() - time) / 1000)
  if (differ < 60) {
    return window.i18n.t('date_format_second', { num: differ })
  } else if (differ < 3600) {
    return window.i18n.t('date_format_minute', { num: Math.trunc(differ / 60) })
  } else if (differ < 86400) {
    return window.i18n.t('date_format_hour', { num: Math.trunc(differ / 3600) })
  } else {
    return dateFormat(time)
  }
}


/**
 * 设置标题
 */
let dom_title = document.getElementsByTagName('title')[0]
export const setTitle = (title: string | null) => {
  title ||= '洛雪音乐助手'
  dom_title.innerText = title
}


// export const getProxyInfo = () => {
//   return proxy.enable && proxy.host
//     ? `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
//     : proxy.envProxy
//       ? `http://${proxy.envProxy.host}:${proxy.envProxy.port}`
//       : undefined
// }


export const getFontSizeWithScreen = (screenWidth: number = window.innerWidth): number => {
  return screenWidth <= 1440
    ? 16
    : screenWidth <= 1920
      ? 18
      : screenWidth <= 2560
        ? 20
        : screenWidth <= 2560 ? 20 : 22
}


export const deduplicationList = <T extends LX.Music.MusicInfo>(list: T[]): T[] => {
  const ids = new Set<string>()
  return list.filter(s => {
    if (ids.has(s.id)) return false
    ids.add(s.id)
    return true
  })
}

export const langS2T = async(str: string) => {
  return await window.lx.worker.main.langS2t(Buffer.from(str).toString('base64')).then(b64 => Buffer.from(b64, 'base64').toString())
}
