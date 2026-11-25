import { beforeEach, describe, expect, it, vi } from 'vitest'
import kwSinger from './kw/singer'
import kwAlbum from './kw/album'
import kgSinger from './kg/singer'
import kgAlbum from './kg/album'
import txSinger from './tx/singer'
import txAlbum from './tx/album'
import wySinger from './wy/singer'
import wyAlbum from './wy/album'
import mgSinger from './mg/singer'
import mgAlbum from './mg/album'

const mocks = vi.hoisted(() => ({
  httpFetch: vi.fn(),
  signRequest: vi.fn(),
  eapiRequest: vi.fn(),
}))

vi.mock('@renderer/utils/request', () => ({ httpFetch: mocks.httpFetch }))
vi.mock('@renderer/utils/musicSdk/tx/utils', () => ({ signRequest: mocks.signRequest }))
vi.mock('@renderer/utils/musicSdk/wy/utils/index', () => ({ eapiRequest: mocks.eapiRequest }))
vi.mock('@renderer/utils/index', () => ({
  decodeName: (s: string) => s,
  formatPlayTime: String,
  sizeFormate: String,
  formatPlayCount: String,
}))

const mockHttpBody = (body: unknown, statusCode = 200) => {
  const cancelHttp = vi.fn()
  mocks.httpFetch.mockReturnValueOnce({
    promise: Promise.resolve({ statusCode, body }),
    cancelHttp,
  })
  return cancelHttp
}

const mockTxBody = (body: unknown) => {
  const cancel = vi.fn()
  const promise = Object.assign(Promise.resolve({ body }), { cancel })
  mocks.signRequest.mockReturnValueOnce(promise)
  return cancel
}

const mockWyBody = (body: unknown) => {
  const cancelHttp = vi.fn()
  mocks.eapiRequest.mockReturnValueOnce({
    promise: Promise.resolve({ body }),
    cancelHttp,
  })
  return cancelHttp
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('musicSdk 5 音源歌手/专辑搜索解析与严格畸形校验', () => {
  describe('kw (酷我)', () => {
    it('singer.search 正常解析、接受显式 0 结果并拒绝畸形载荷/空对象/脏条目', async() => {
      mockHttpBody({
        TOTAL: '2',
        BASEPICPATH: 'https://img1.kuwo.cn/star/starheads/',
        abslist: [
          { ARTISTID: '336', ARTIST: '周杰伦', PICPATH: 'jay.jpg', SONGNUM: '500', ALBUMNUM: '' },
          { ARTISTID: '337', ARTIST: '林俊杰', hts_PICPATH: 'https://img.example/jj.jpg', SONGNUM: null, ALBUMNUM: '20' },
        ],
      })
      const ok = await kwSinger.search('周杰伦', 1, 20)
      expect(ok).toEqual({
        source: 'kw',
        page: 1,
        limit: 20,
        total: 2,
        list: [
          { id: '336', name: '周杰伦', img: 'https://img1.kuwo.cn/star/starheads/jay.jpg', songCount: 500, albumCount: null, source: 'kw' },
          { id: '337', name: '林俊杰', img: 'https://img.example/jj.jpg', songCount: null, albumCount: 20, source: 'kw' },
        ],
      })

      mockHttpBody({ TOTAL: '0' })
      await expect(kwSinger.search('none', 1, 20)).resolves.toMatchObject({ list: [], total: 0, source: 'kw' })

      for (const bad of [{}, { TOTAL: '5' }, { TOTAL: '0', abslist: {} }, { TOTAL: 'bad', abslist: [] }, { TOTAL: '1', abslist: [null] }, { TOTAL: '1', abslist: [{ ARTISTID: {}, ARTIST: 'x' }] }]) {
        mockHttpBody(bad)
        await expect(kwSinger.search('x', 1, 20)).rejects.toMatchObject({ name: 'MusicSdkResponseError' })
      }
    })

    it('singer.getSongList 严格解析曲目、支持 musicrid/id、省略 total 时返回 undefined 并拒绝畸形项与 artistid=0', async() => {
      mockHttpBody({
        artist: '周杰伦',
        total: '276',
        musiclist: [
          {
            musicrid: 'MUSIC_12345',
            name: '晴天',
            artist: '周杰伦',
            artistid: '336',
            album: '叶惠美',
            albumid: '1287',
            duration: '269',
            N_MINFO: 'level:ff,bitrate:2000,format:flac,size:28.5Mb;level:h,bitrate:128,format:mp3,size:4.1Mb',
          },
          {
            id: '67890',
            name: '七里香',
            artist: '周杰伦',
            artistid: '0',
            album: '七里香',
            albumid: '0',
            duration: '299',
            formats: 'MP3128|MP3H',
          },
        ],
      })
      const ok = await kwSinger.getSongList('336', 1, 50)
      expect(ok.total).toBe(276)
      expect(ok.list).toHaveLength(2)
      expect(ok.list[0]).toMatchObject({ songmid: '12345', name: '晴天', artists: [{ id: '336', name: '周杰伦' }], albumId: '1287' })
      expect(ok.list[1]).toMatchObject({ songmid: '67890', name: '七里香', artists: [{ id: '336', name: '周杰伦' }], albumId: '' })

      // 缺少 total 时返回 undefined，交给 adapter 按未知总数续页，不伪造 list.length
      mockHttpBody({
        musiclist: [{ musicrid: 'MUSIC_1', name: 'Song 1', artist: 'A', artistid: '0' }],
      })
      const noTotal = await kwSinger.getSongList('0', 1, 50)
      expect(noTotal.total).toBeUndefined()
      expect(noTotal.list[0].artists).toBeUndefined()

      // 显式 0 首且缺 musiclist 返回合法空页
      mockHttpBody({ total: '0' })
      await expect(kwSinger.getSongList('336', 1, 50)).resolves.toMatchObject({ list: [], total: 0 })

      // 畸形项 [null] / 缺名 / MUSIC_0 / 显式错类型 total 或 musiclist 必须抛 MusicSdkResponseError
      for (const bad of [
        { total: '0', musiclist: {} },
        { total: 'bad', musiclist: [{ musicrid: 'MUSIC_1', name: 'Song 1' }] },
        { total: false, musiclist: [{ musicrid: 'MUSIC_1', name: 'Song 1' }] },
        { total: '1', musiclist: [null] },
        { total: '1', musiclist: [{ musicrid: 'MUSIC_0', name: 'Zero ID' }] },
        { total: '1', musiclist: [{ musicrid: 'MUSIC_1', name: '' }] },
      ]) {
        mockHttpBody(bad)
        await expect(kwSinger.getSongList('336', 1, 50)).rejects.toMatchObject({ name: 'MusicSdkResponseError' })
      }
    })

    it('album.search 正常解析、接受显式 0 结果与越界空 abslist，并拒绝畸形载荷', async() => {
      mockHttpBody({
        total: '1',
        albumlist: [{ albumid: '1287', name: '范特西', artist: '周杰伦', pic: 'a.jpg', pub: '2001-09-14', musiccnt: '10' }],
      })
      const ok = await kwAlbum.search('范特西', 1, 20)
      expect(ok.list[0]).toMatchObject({ id: '1287', name: '范特西', singer: '周杰伦', songCount: 10, publishTime: '2001-09-14' })

      mockHttpBody({ total: '0' })
      await expect(kwAlbum.search('none', 1, 20)).resolves.toMatchObject({ list: [], total: 0 })

      // 酷我 ft=album 真实越界翻页载荷：省略 albumlist 且返回空 abslist 与非零 total
      mockHttpBody({ SHOW: '0', abslist: [], total: '48' })
      await expect(kwAlbum.search('范特西', 4, 20)).resolves.toMatchObject({ list: [], total: 48, page: 4, limit: 20, source: 'kw' })

      // 第 1 页未越界时缺少 albumlist 仍拒绝
      mockHttpBody({ SHOW: '0', abslist: [], total: '48' })
      await expect(kwAlbum.search('范特西', 1, 20)).rejects.toMatchObject({ name: 'MusicSdkResponseError' })

      for (const bad of [{}, { total: '3' }, { total: '0', albumlist: {} }, { total: '1', albumlist: [null] }, { total: '1', albumlist: [{ albumid: {}, name: 'A' }] }]) {
        mockHttpBody(bad)
        await expect(kwAlbum.search('x', 1, 20)).rejects.toMatchObject({ name: 'MusicSdkResponseError' })
      }
    })
  })

  describe('kg (酷狗)', () => {
    it('singer.search 兼容平铺数组与分页对象并拒绝 status!=1、畸形条目与非法计数', async() => {
      mockHttpBody({ status: 1, errcode: 0, data: [{ singerid: 3520, singername: '周杰伦', songcount: null, albumcount: '' }] })
      const ok = await kgSinger.search('周杰伦', 1, 20)
      expect(ok).toMatchObject({
        total: 1,
        list: [{ id: '3520', name: '周杰伦', songCount: null, albumCount: null, source: 'kg' }],
      })

      mockHttpBody({ status: 1, errcode: 0, data: { total: 0 } })
      await expect(kgSinger.search('none', 1, 20)).resolves.toMatchObject({ list: [], total: 0 })

      // 酷狗真实 0 结果响应为 { status: 1, errcode: 0, data: null, error: '' }
      mockHttpBody({ status: 1, errcode: 0, data: null, error: '' })
      await expect(kgSinger.search('none', 1, 20)).resolves.toMatchObject({ list: [], total: 0 })

      for (const bad of [
        { status: 0, errcode: 0, data: { total: 0, info: [] } },
        { status: 1, errcode: 0, data: {} },
        { status: 1, errcode: 0, data: [null] },
        { status: 1, errcode: 0, data: [{ singerid: {}, singername: 'x' }] },
        { status: 1, errcode: 0, data: { total: 0, info: {} } },
        { status: 1, errcode: 0, data: { total: -1, info: [] } },
      ]) {
        mockHttpBody(bad)
        await expect(kgSinger.search('x', 1, 20)).rejects.toMatchObject({ name: 'MusicSdkResponseError' })
      }
    })

    it('album.search 正常解析、兼容 data:null 零结果并拒绝 status!=1 / [null] / 对象 albumid / 零计数错类型 info', async() => {
      mockHttpBody({
        status: 1,
        errcode: 0,
        data: {
          total: 1,
          info: [{ albumid: 970, albumname: '范特西', singername: '周杰伦', imgurl: 'https://img/{size}/a.jpg', publishtime: '2001-09-14 00:00:00', songcount: 10 }],
        },
      })
      const ok = await kgAlbum.search('范特西', 1, 20)
      expect(ok.list[0]).toMatchObject({
        id: '970',
        name: '范特西',
        img: 'https://img/480/a.jpg',
        publishTime: '2001-09-14',
        songCount: 10,
      })

      mockHttpBody({ status: 1, errcode: 0, data: null, error: '' })
      await expect(kgAlbum.search('none', 1, 20)).resolves.toMatchObject({ list: [], total: 0 })

      mockHttpBody({ status: 1, errcode: 0, data: { total: 0 } })
      await expect(kgAlbum.search('none', 1, 20)).resolves.toMatchObject({ list: [], total: 0 })

      for (const bad of [
        { status: 0, errcode: 0, data: { total: 0, info: [] } },
        { status: 1, errcode: 0, data: {} },
        { status: 1, errcode: 0, data: { total: 0, info: {} } },
        { status: 1, errcode: 0, data: { total: 1, info: [null] } },
        { status: 1, errcode: 0, data: { total: 1, info: [{ albumid: {}, albumname: 'A' }] } },
        { status: 1, errcode: 0, data: { total: '', info: [] } },
      ]) {
        mockHttpBody(bad)
        await expect(kgAlbum.search('x', 1, 20)).rejects.toMatchObject({ name: 'MusicSdkResponseError' })
      }
    })
  })

  describe('tx (QQ 音乐)', () => {
    it('singer.search 强制要求 string singerMID，兼容合法 0 结果并拒绝纯数字回退与错类型容器', async() => {
      mockTxBody({
        code: 0,
        req: {
          code: 0,
          data: {
            meta: { sum: 2 },
            body: {
              singer: {
                list: [
                  { singerMID: '0025NhlN2yWrP4', singerName: '周杰伦', singerPic: 'http://img/jay.jpg', songNum: 500, albumNum: null },
                  { singerMID: '', singerID: 999, singerName: '无MID占位' },
                ],
              },
            },
          },
        },
      })
      const ok = await txSinger.search('周杰伦', 1, 20)
      expect(ok.list).toEqual([
        { id: '0025NhlN2yWrP4', name: '周杰伦', img: 'https://img/jay.jpg', songCount: 500, albumCount: null, source: 'tx' },
      ])

      // 合法 0 结果（含列表为空数组或省略）
      mockTxBody({ code: 0, req: { code: 0, data: { meta: { sum: 0 }, body: { singer: { list: [] } } } } })
      await expect(txSinger.search('none', 1, 20)).resolves.toMatchObject({ list: [], total: 0 })

      mockTxBody({ code: 0, req: { code: 0, data: { meta: { sum: 0 }, body: {} } } })
      await expect(txSinger.search('none', 1, 20)).resolves.toMatchObject({ list: [], total: 0 })

      // 全部条目仅有数字 singerID 而无 singerMID 时不可静默伪装为空列表
      mockTxBody({
        code: 0,
        req: {
          code: 0,
          data: {
            meta: { sum: 1 },
            body: { singer: { list: [{ singerID: 4558, singerName: '纯数字ID歌手' }] } },
          },
        },
      })
      await expect(txSinger.search('x', 1, 20)).rejects.toMatchObject({ name: 'MusicSdkResponseError' })

      for (const bad of [
        { code: 0, req: { code: 0, data: { meta: { sum: 0 }, body: { singer: 'bad' } } } },
        { code: 0, req: { code: 0, data: { meta: { sum: 0 }, body: { singer: { list: {} } } } } },
        { code: 0, req: { code: 0, data: { meta: { sum: 1 }, body: { singer: { list: [null] } } } } },
      ]) {
        mockTxBody(bad)
        await expect(txSinger.search('x', 1, 20)).rejects.toMatchObject({ name: 'MusicSdkResponseError' })
      }
    })

    it('album.search 正常解析、兼容 0 结果并拒绝非法 albumMID / 脏 singer_list / 错类型容器', async() => {
      mockTxBody({
        code: 0,
        req: {
          code: 0,
          data: {
            meta: { sum: 1 },
            body: {
              album: {
                list: [{ albumMID: '000MkMni19ClKG', albumName: '范特西', singerName: '周杰伦', publicTime: '2001-09-14', song_count: '' }],
              },
            },
          },
        },
      })
      const ok = await txAlbum.search('范特西', 1, 20)
      expect(ok.list[0]).toMatchObject({
        id: '000MkMni19ClKG',
        name: '范特西',
        songCount: null,
        img: 'https://y.gtimg.cn/music/photo_new/T002R300x300M000000MkMni19ClKG.jpg',
      })

      mockTxBody({ code: 0, req: { code: 0, data: { meta: { sum: 0 }, body: {} } } })
      await expect(txAlbum.search('none', 1, 20)).resolves.toMatchObject({ list: [], total: 0 })

      for (const bad of [
        { code: 0, req: { code: 0, data: { meta: { sum: -1 }, body: { album: { list: [] } } } } },
        { code: 0, req: { code: 0, data: { meta: { sum: 0 }, body: { album: 'bad' } } } },
        { code: 0, req: { code: 0, data: { meta: { sum: 0 }, body: { album: { list: {} } } } } },
        { code: 0, req: { code: 0, data: { meta: { sum: 1 }, body: { album: { list: [{ albumMID: {}, albumID: 123, albumName: 'A' }] } } } } },
        { code: 0, req: { code: 0, data: { meta: { sum: 1 }, body: { album: { list: [{ albumMID: 'm1', albumName: 'A', singer_list: [null] }] } } } } },
        { code: 0, req: { code: 0, data: { meta: { sum: 1 }, body: { album: { list: [{ albumMID: 'm1', albumName: 'A', singer_list: [{ name: {} }] }] } } } } },
      ]) {
        mockTxBody(bad)
        await expect(txAlbum.search('x', 1, 20)).rejects.toMatchObject({ name: 'MusicSdkResponseError' })
      }
    })
  })

  describe('wy (网易云音乐)', () => {
    it('singer.search 与 album.search 接受显式 0 结果并拒绝空 result / 脏 artists / 零计数错类型', async() => {
      mockWyBody({
        code: 200,
        result: {
          artistCount: 1,
          artists: [{ id: 6452, name: '周杰伦', picUrl: 'https://p1.music.126.net/jay.jpg', musicSize: 500, albumSize: null }],
        },
      })
      const singerRes = await wySinger.search('周杰伦', 1, 20)
      expect(singerRes.list[0]).toMatchObject({ id: 6452, name: '周杰伦', songCount: 500, albumCount: null })

      mockWyBody({ code: 200, result: { artistCount: 0 } })
      await expect(wySinger.search('none', 1, 20)).resolves.toMatchObject({ list: [], total: 0 })

      for (const bad of [{ code: 200 }, { code: 200, result: {} }, { code: 200, result: { artistCount: 0, artists: {} } }, { code: 200, result: { artistCount: 2 } }, { code: 200, result: { artistCount: 1, artists: [null] } }]) {
        mockWyBody(bad)
        await expect(wySinger.search('x', 1, 20)).rejects.toMatchObject({ name: 'MusicSdkResponseError' })
      }

      mockWyBody({
        code: 200,
        result: {
          albumCount: 1,
          // 1000396800000 = 2001-09-14 00:00:00+08:00
          albums: [{ id: 18905, name: '范特西', artists: [{ name: '周杰伦' }], picUrl: 'https://img/a.jpg', publishTime: 1000396800000, size: 10 }],
        },
      })
      const albumRes = await wyAlbum.search('范特西', 1, 20)
      expect(albumRes.list[0]).toMatchObject({ id: 18905, name: '范特西', singer: '周杰伦', publishTime: '2001-09-14', songCount: 10 })

      mockWyBody({ code: 200, result: { albumCount: 0 } })
      await expect(wyAlbum.search('none', 1, 20)).resolves.toMatchObject({ list: [], total: 0 })

      for (const bad of [
        { code: 200 },
        { code: 200, result: {} },
        { code: 200, result: { albumCount: 0, albums: {} } },
        { code: 200, result: { albumCount: 1, albums: [{ id: {}, name: 'A' }] } },
        { code: 200, result: { albumCount: 1, albums: [{ id: 1, name: 'A', artists: [null] }] } },
        { code: 200, result: { albumCount: 1, albums: [{ id: 1, name: 'A', artists: [[]] }] } },
        { code: 200, result: { albumCount: 1, albums: [{ id: 1, name: 'A', artists: [{ name: {} }] }] } },
      ]) {
        mockWyBody(bad)
        await expect(wyAlbum.search('x', 1, 20)).rejects.toMatchObject({ name: 'MusicSdkResponseError' })
      }
    })
  })

  describe('mg (咪咕音乐)', () => {
    it('singer.search 与 album.search 正常解析、支持 // 协议图地址并拒绝缺 code 与畸形容器', async() => {
      mockHttpBody({
        code: '000000',
        singerResultData: {
          totalCount: '2',
          result: [
            { id: '112', name: '周杰伦', singerPicUrl: [{ img: '/pic/jay.jpg' }], songCount: '300', albumCount: '' },
            { id: '113', name: '林俊杰', singerPicUrl: [{ img: '//cdn.migu.cn/jj.jpg' }], songCount: '200', albumCount: '15' },
          ],
        },
      })
      const singerRes = await mgSinger.search('周杰伦', 1, 20)
      expect(singerRes.list[0]).toEqual({
        id: '112',
        name: '周杰伦',
        img: 'https://d.musicapp.migu.cn/pic/jay.jpg',
        songCount: 300,
        albumCount: null,
        source: 'mg',
      })
      expect(singerRes.list[1].img).toBe('https://cdn.migu.cn/jj.jpg')

      mockHttpBody({ code: '000000', singerResultData: { totalCount: '0' } })
      await expect(mgSinger.search('none', 1, 20)).resolves.toMatchObject({ list: [], total: 0 })

      for (const bad of [
        {},
        { code: '000000' },
        { code: '000000', singerResultData: {} },
        { code: '000000', singerResultData: { totalCount: '0', result: {} } },
        { code: '000000', singerResultData: { totalCount: '1', result: [null] } },
      ]) {
        mockHttpBody(bad)
        await expect(mgSinger.search('x', 1, 20)).rejects.toMatchObject({ name: 'MusicSdkResponseError' })
      }

      mockHttpBody({
        code: '000000',
        albumResultData: {
          totalCount: '1',
          result: [{ id: '888', name: '范特西', singer: '周杰伦', imgItems: [{ img: 'https://img/a.jpg' }], publishDate: '2001-09-14', songCount: '10' }],
        },
      })
      const albumRes = await mgAlbum.search('范特西', 1, 20)
      expect(albumRes.list[0]).toMatchObject({
        id: '888',
        name: '范特西',
        img: 'https://img/a.jpg',
        songCount: 10,
      })

      mockHttpBody({ code: '000000', albumResultData: { totalCount: '0' } })
      await expect(mgAlbum.search('none', 1, 20)).resolves.toMatchObject({ list: [], total: 0 })

      for (const bad of [
        { code: '000000' },
        { code: '000000', albumResultData: {} },
        { code: '000000', albumResultData: { totalCount: '0', result: {} } },
        { code: '000000', albumResultData: { totalCount: '1', result: [{ id: {}, name: 'A' }] } },
      ]) {
        mockHttpBody(bad)
        await expect(mgAlbum.search('x', 1, 20)).rejects.toMatchObject({ name: 'MusicSdkResponseError' })
      }
    })
  })
})
