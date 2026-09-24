import crypto from 'crypto'
import dns from 'dns'
import { decodeName } from '@renderer/utils'

export const toMD5 = (str: string): string => crypto.createHash('md5').update(str).digest('hex')

interface IpResult {
  address: string
  family: number
}

const ipMap = new Map<string, IpResult | true>()
export const getHostIp = (hostname: string): IpResult | undefined => {
  const result = ipMap.get(hostname)
  if (typeof result === 'object') return result
  if (result === true) return
  ipMap.set(hostname, true)
  dns.lookup(
    hostname,
    {
      all: false,
    },
    (err: NodeJS.ErrnoException | null, address: string, family: number) => {
      if (err) { console.log(err); return }
      ipMap.set(hostname, { address, family })
    },
  )
}

export const dnsLookup = (
  hostname: string,
  options: dns.LookupOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void,
): void => {
  const result = getHostIp(hostname)
  if (result) { callback(null, result.address, result.family); return }

  dns.lookup(hostname, options, callback as any)
}

/**
 * 格式化歌手
 * @param singers 歌手数组
 * @param nameKey 歌手名键值
 * @param join 歌手分割字符
 */
export const formatSingerName = (singers: any, nameKey: string = 'name', join: string = '、'): string => {
  if (Array.isArray(singers)) {
    const singer: string[] = []
    singers.forEach((item: any) => {
      let name = item[nameKey]
      if (!name) return
      singer.push(name)
    })
    return decodeName(singer.join(join))
  }
  return decodeName(String(singers ?? ''))
}
