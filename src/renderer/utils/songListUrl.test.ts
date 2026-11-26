import { describe, expect, it } from 'vitest'
import { isUnsupportedYtmPlaylistUrl, parseSongListUrl } from './songListUrl'

describe('歌单链接音源识别', () => {
  it('识别各平台常规歌单链接', () => {
    expect(parseSongListUrl('https://music.163.com/#/playlist?id=123')).toEqual({ source: 'wy', id: '123' })
    expect(parseSongListUrl('https://y.qq.com/n/yqq/playlist/456.html')).toEqual({ source: 'tx', id: '456' })
    expect(parseSongListUrl('https://www.kugou.com/yy/special/single/789.html')).toEqual({ source: 'kg', id: '789' })
    expect(parseSongListUrl('https://www.kuwo.cn/playlist_detail/321')).toEqual({ source: 'kw', id: '321' })
    expect(parseSongListUrl('https://music.migu.cn/v3/music/playlist/654')).toEqual({ source: 'mg', id: '654' })
  })

  it('酷狗用户歌单链接保留原 URL 交给 SDK 继续解析', () => {
    const urls = [
      'https://www.kugou.com/songlist/abc/?uid=1',
      'https://www.kugou.com/yy/zlist.html?pagesize=30',
      'https://www.kugou.com/share/gcid_abc123',
      'https://www.kugou.com/share/index.html?chain=abc123',
      'https://www.kugou.com/share/index.html?global_collection_id=abc123&chain=def456',
    ]
    for (const url of urls) expect(parseSongListUrl(url)).toEqual({ source: 'kg', id: url })
  })

  it('分享文字、网易 token 和末尾标点可以识别', () => {
    expect(parseSongListUrl('打开歌单：https://y.qq.com/n/yqq/playlist/456.html。')).toEqual({ source: 'tx', id: '456' })
    expect(parseSongListUrl('https://music.163.com/#/playlist?id=123###token')).toEqual({ source: 'wy', id: '123' })
  })

  it('纯数字 id 不自动猜测音源', () => {
    expect(parseSongListUrl('123456')).toBeNull()
  })

  it('识别 YouTube Music 与 YouTube 公开歌单链接并规范化 VL 前缀', () => {
    expect(parseSongListUrl('https://music.youtube.com/playlist?list=PL4fGSI1pDJn6puJdseH2Rt9sMvt9E2M4i')).toEqual({
      source: 'ytm',
      id: 'VLPL4fGSI1pDJn6puJdseH2Rt9sMvt9E2M4i',
    })
    expect(parseSongListUrl('https://www.youtube.com/playlist?list=RDCLAK5uy_kmPRjHDECIcuVwnKsx2Ng7fyNgFKWNJFs')).toEqual({
      source: 'ytm',
      id: 'VLRDCLAK5uy_kmPRjHDECIcuVwnKsx2Ng7fyNgFKWNJFs',
    })
    expect(parseSongListUrl('分享歌单 https://music.youtube.com/watch?v=abc12345678&list=OLAK5uy_k1234567890。')).toEqual({
      source: 'ytm',
      id: 'VLOLAK5uy_k1234567890',
    })
    expect(isUnsupportedYtmPlaylistUrl('https://music.youtube.com/playlist?list=RDCLAK5uy_kmPRjHDECIcuVwnKsx2Ng7fyNgFKWNJFs')).toBe(false)
  })

  it('拒绝不可浏览的 YouTube 自动混音电台 RD 链接', () => {
    const mixes = [
      'https://music.youtube.com/playlist?list=RDdQw4w9WgXcQ',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDAMVMdQw4w9WgXcQ',
      'https://music.youtube.com/watch?v=abc&list=RDMM',
    ]
    for (const url of mixes) {
      expect(parseSongListUrl(url)).toBeNull()
      expect(isUnsupportedYtmPlaylistUrl(url)).toBe(true)
    }

    // 含 RD 前缀文字与 youtube.com 查询参数的国内分享文案不可被误拦
    const wyWithYtParam = 'RD精选 https://music.163.com/playlist?id=123456&from=youtube.com'
    expect(parseSongListUrl(wyWithYtParam)).toEqual({ source: 'wy', id: '123456' })
    expect(isUnsupportedYtmPlaylistUrl(wyWithYtParam)).toBe(false)
    expect(isUnsupportedYtmPlaylistUrl('RD1234567890', false)).toBe(false)
    expect(isUnsupportedYtmPlaylistUrl('RD1234567890', true)).toBe(true)
    expect(isUnsupportedYtmPlaylistUrl('music.youtube.com:443/watch?v=x&list=RD1234567890', false)).toBe(true)
  })
})
