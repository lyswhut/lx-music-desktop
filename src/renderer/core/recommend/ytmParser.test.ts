import { afterEach, describe, expect, it, vi } from 'vitest'
import { MusicSdkResponseError } from '@renderer/utils/musicSdk/responseError'
import {
  isValidInnerTubePayload,
  isYtmRegionBlockedHtml,
  parseYtmNextRadio,
  parseYtmRelatedSongs,
  parseYtmSearchSongs,
  simplifyForMatch,
} from './ytmParser'
import { parseProxyAddress, resolveEffectiveYtmProxy } from './ytmProxy'
import { createYtmAdapter, testYtmConnection, YtmRegionBlockedError } from './ytmAdapter'

const adapterMocks = vi.hoisted(() => ({
  httpFetch: vi.fn(),
}))

vi.mock('@renderer/utils/request', () => ({
  httpFetch: adapterMocks.httpFetch,
}))

afterEach(() => {
  vi.useRealTimers()
  adapterMocks.httpFetch.mockReset()
})

describe('ytmParser：YouTube Music InnerTube 纯解析与地区受限判定', () => {
  it('繁简归一化正确转换繁体曲名与艺人名', () => {
    expect(simplifyForMatch('周杰倫')).toBe('周杰伦')
    expect(simplifyForMatch('葉惠美')).toBe('叶惠美')
    expect(simplifyForMatch('晴天')).toBe('晴天')
  })

  it('仅明确包含地区不可用文本时判为 region-blocked（覆盖裸子串与 region 变体）', () => {
    expect(isYtmRegionBlockedHtml('<html><title>YouTube Music is not available in your area</title></html>')).toBe(true)
    expect(isYtmRegionBlockedHtml('Sorry, YouTube Music is not available in your country')).toBe(true)
    expect(isYtmRegionBlockedHtml('YouTube Music is not available in your region')).toBe(true)
    expect(isYtmRegionBlockedHtml('YouTube Music is not available')).toBe(true)
    // 单曲视频区域不可用提示不得误判为全服务地区封锁，防止污染全局 region 缓存
    expect(isYtmRegionBlockedHtml('This video is not available in your country')).toBe(false)
    expect(isYtmRegionBlockedHtml('The uploader has not made this video available in your country')).toBe(false)
    expect(isYtmRegionBlockedHtml('<html><title>YouTube Music</title><body></body></html>')).toBe(false)
    expect(isYtmRegionBlockedHtml('')).toBe(false)
  })

  it('畸形载荷防御：非对象、含 error 或缺失 responseContext 均拒绝', () => {
    expect(isValidInnerTubePayload(null)).toBe(false)
    expect(isValidInnerTubePayload('<html>error</html>')).toBe(false)
    expect(isValidInnerTubePayload({})).toBe(false)
    expect(isValidInnerTubePayload({ contents: {} })).toBe(false)
    expect(isValidInnerTubePayload({ responseContext: {}, error: { code: 429 } })).toBe(false)
    expect(isValidInnerTubePayload({ responseContext: {} })).toBe(true)
  })

  it('parseYtmSearchSongs 正确提取歌曲列表、艺人、专辑与时长，忽略无 videoId 项', () => {
    const body = {
      responseContext: {},
      contents: {
        tabbedSearchResultsRenderer: {
          tabs: [{
            tabRenderer: {
              content: {
                sectionListRenderer: {
                  contents: [{
                    musicShelfRenderer: {
                      contents: [
                        {
                          musicResponsiveListItemRenderer: {
                            overlay: {
                              musicItemThumbnailOverlayRenderer: {
                                content: {
                                  musicPlayButtonRenderer: {
                                    playNavigationEndpoint: { watchEndpoint: { videoId: 'vid_qingtian' } },
                                  },
                                },
                              },
                            },
                            thumbnail: {
                              musicThumbnailRenderer: {
                                thumbnail: { thumbnails: [{ url: 'https://lh3.googleusercontent.com/cover.jpg' }] },
                              },
                            },
                            flexColumns: [
                              { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: '晴天' }] } } },
                              {
                                musicResponsiveListItemFlexColumnRenderer: {
                                  text: {
                                    runs: [
                                      { text: 'Song' },
                                      { text: ' • ' },
                                      {
                                        text: '周杰倫',
                                        navigationEndpoint: {
                                          browseEndpoint: {
                                            browseEndpointContextSupportedConfigs: {
                                              browseEndpointContextMusicConfig: { pageType: 'MUSIC_PAGE_TYPE_ARTIST' },
                                            },
                                          },
                                        },
                                      },
                                      { text: ' • ' },
                                      {
                                        text: '葉惠美',
                                        navigationEndpoint: {
                                          browseEndpoint: {
                                            browseEndpointContextSupportedConfigs: {
                                              browseEndpointContextMusicConfig: { pageType: 'MUSIC_PAGE_TYPE_ALBUM' },
                                            },
                                          },
                                        },
                                      },
                                      { text: ' • ' },
                                      { text: '4:29' },
                                    ],
                                  },
                                },
                              },
                            ],
                          },
                        },
                        {
                          musicResponsiveListItemRenderer: {
                            flexColumns: [{ musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: '无ID噪音' }] } } }],
                          },
                        },
                      ],
                    },
                  }],
                },
              },
            },
          }],
        },
      },
    }

    const parsed = parseYtmSearchSongs(body)
    expect(parsed.hasValidContainer).toBe(true)
    expect(parsed.tracks).toEqual([{
      videoId: 'vid_qingtian',
      title: '晴天',
      artist: '周杰倫',
      album: '葉惠美',
      intervalSec: 269,
      picUrl: 'https://lh3.googleusercontent.com/cover.jpg',
    }])
  })

  it('parseYtmNextRadio 过滤种子自身、提取 continuation token 与 relatedBrowseId', () => {
    const body = {
      responseContext: {},
      contents: {
        singleColumnMusicWatchNextResultsRenderer: {
          tabbedRenderer: {
            watchNextTabbedResultsRenderer: {
              tabs: [
                {
                  tabRenderer: {
                    content: {
                      musicQueueRenderer: {
                        content: {
                          playlistPanelRenderer: {
                            contents: [
                              {
                                playlistPanelVideoRenderer: {
                                  videoId: 'seed_1',
                                  title: { runs: [{ text: '晴天' }] },
                                  longBylineText: { runs: [{ text: '周杰伦' }] },
                                  lengthText: { runs: [{ text: '4:29' }] },
                                },
                              },
                              {
                                playlistPanelVideoRenderer: {
                                  videoId: 'rec_1',
                                  title: { runs: [{ text: '七里香' }] },
                                  longBylineText: { runs: [{ text: '周杰伦' }, { text: ' • ' }, { text: '七里香' }, { text: ' • ' }, { text: '2004' }] },
                                  lengthText: { runs: [{ text: '4:59' }] },
                                  thumbnail: { thumbnails: [{ url: 'https://img/1.jpg' }] },
                                },
                              },
                            ],
                            continuations: [
                              { nextRadioContinuationData: { continuation: 'CONT_TOKEN_PAGE_2' } },
                            ],
                          },
                        },
                      },
                    },
                  },
                },
                {
                  tabRenderer: {
                    endpoint: { browseEndpoint: { browseId: 'MPTRt_related_123' } },
                  },
                },
              ],
            },
          },
        },
      },
    }

    const parsed = parseYtmNextRadio(body, 'seed_1')
    expect(parsed.hasValidContainer).toBe(true)
    expect(parsed.continuation).toBe('CONT_TOKEN_PAGE_2')
    expect(parsed.relatedBrowseId).toBe('MPTRt_related_123')
    expect(parsed.tracks).toEqual([{
      videoId: 'rec_1',
      title: '七里香',
      artist: '周杰伦',
      album: '七里香',
      intervalSec: 299,
      picUrl: 'https://img/1.jpg',
    }])
  })

  it('parseYtmRelatedSongs 过滤种子 videoId 并提取相关曲目', () => {
    const body = {
      responseContext: {},
      contents: {
        sectionListRenderer: {
          contents: [{
            musicCarouselShelfRenderer: {
              contents: [
                {
                  musicResponsiveListItemRenderer: {
                    playlistItemData: { videoId: 'seed_1' },
                    flexColumns: [
                      { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: 'Seed Song' }] } } },
                      { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: 'Seed Artist' }] } } },
                    ],
                  },
                },
                {
                  musicResponsiveListItemRenderer: {
                    playlistItemData: { videoId: 'rel_1' },
                    flexColumns: [
                      { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: '花海' }] } } },
                      { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: '周杰伦' }, { text: ' • ' }, { text: '魔杰座' }] } } },
                    ],
                  },
                },
              ],
            },
          }],
        },
      },
    }

    const parsed = parseYtmRelatedSongs(body, 'seed_1')
    expect(parsed.hasValidContainer).toBe(true)
    expect(parsed.tracks).toHaveLength(1)
    expect(parsed.tracks[0]).toMatchObject({ videoId: 'rel_1', title: '花海', artist: '周杰伦', album: '魔杰座' })
  })

  it('byline 含年份 "2004" 与数字专辑名 "1989" 不污染时长，且 fixedColumns 显式时长优先', () => {
    const body = {
      responseContext: {},
      contents: {
        sectionListRenderer: {
          contents: [{
            musicShelfRenderer: {
              contents: [
                {
                  musicResponsiveListItemRenderer: {
                    playlistItemData: { videoId: 'vid_1989' },
                    flexColumns: [
                      { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: 'Style' }] } } },
                      {
                        musicResponsiveListItemFlexColumnRenderer: {
                          text: {
                            runs: [
                              {
                                text: 'Taylor Swift',
                                navigationEndpoint: {
                                  browseEndpoint: {
                                    browseEndpointContextSupportedConfigs: {
                                      browseEndpointContextMusicConfig: { pageType: 'MUSIC_PAGE_TYPE_ARTIST' },
                                    },
                                  },
                                },
                              },
                              { text: ' • ' },
                              {
                                text: '1989',
                                navigationEndpoint: {
                                  browseEndpoint: {
                                    browseEndpointContextSupportedConfigs: {
                                      browseEndpointContextMusicConfig: { pageType: 'MUSIC_PAGE_TYPE_ALBUM' },
                                    },
                                  },
                                },
                              },
                              { text: ' • ' },
                              { text: '3:30' },
                            ],
                          },
                        },
                      },
                    ],
                  },
                },
                {
                  musicResponsiveListItemRenderer: {
                    playlistItemData: { videoId: 'vid_2004' },
                    flexColumns: [
                      { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: '七里香' }] } } },
                      {
                        musicResponsiveListItemFlexColumnRenderer: {
                          text: { runs: [{ text: '周杰伦' }, { text: ' • ' }, { text: '七里香' }, { text: ' • ' }, { text: '2004' }] },
                        },
                      },
                    ],
                    fixedColumns: [
                      { musicResponsiveListItemFixedColumnRenderer: { text: { runs: [{ text: '4:29' }] } } },
                    ],
                  },
                },
              ],
            },
          }],
        },
      },
    }
    const parsed = parseYtmSearchSongs(body)
    expect(parsed.hasValidContainer).toBe(true)
    expect(parsed.tracks[0]).toMatchObject({ videoId: 'vid_1989', artist: 'Taylor Swift', album: '1989', intervalSec: 210 })
    expect(parsed.tracks[1]).toMatchObject({ videoId: 'vid_2004', artist: '周杰伦', album: '七里香', intervalSec: 269 })
  })

  it('continuation 容器严格校验数组形状：contents 为字符串时判非法，合法空数组才判末页', () => {
    const malformed = {
      responseContext: {},
      continuationContents: {
        playlistPanelContinuation: { contents: 'corrupted-string' },
      },
    }
    expect(parseYtmNextRadio(malformed, 'seed_1', { isContinuation: true }).hasValidContainer).toBe(false)

    const validEnd = {
      responseContext: {},
      continuationContents: {
        playlistPanelContinuation: { contents: [] },
      },
    }
    const parsedEnd = parseYtmNextRadio(validEnd, 'seed_1', { isContinuation: true })
    expect(parsedEnd.hasValidContainer).toBe(true)
    expect(parsedEnd.tracks).toEqual([])
    expect(parsedEnd.continuation).toBeNull()

    // contents 含非对象元素（[null]）或畸形非字符串 continuation token 必须拒绝
    expect(parseYtmNextRadio({
      responseContext: {},
      continuationContents: { playlistPanelContinuation: { contents: [null] } },
    }, 'seed_1', { isContinuation: true }).hasValidContainer).toBe(false)

    expect(parseYtmNextRadio({
      responseContext: {},
      continuationContents: {
        playlistPanelContinuation: {
          contents: [],
          continuations: [{ nextRadioContinuationData: { continuation: 12345 } }],
        },
      },
    }, 'seed_1', { isContinuation: true }).hasValidContainer).toBe(false)
  })

  it('R2 回归：中文译名间隔号（迈克尔·杰克逊 / 安德烈·波切利 / A·Lin）在带端点与纯文本 run 下均不被切碎', () => {
    const body = {
      responseContext: {},
      contents: {
        sectionListRenderer: {
          contents: [{
            musicShelfRenderer: {
              contents: [
                {
                  musicResponsiveListItemRenderer: {
                    playlistItemData: { videoId: 'vid_mj' },
                    flexColumns: [
                      { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: 'Billie Jean' }] } } },
                      {
                        musicResponsiveListItemFlexColumnRenderer: {
                          text: {
                            runs: [
                              {
                                text: '迈克尔·杰克逊',
                                navigationEndpoint: {
                                  browseEndpoint: {
                                    browseEndpointContextSupportedConfigs: {
                                      browseEndpointContextMusicConfig: { pageType: 'MUSIC_PAGE_TYPE_ARTIST' },
                                    },
                                  },
                                },
                              },
                              { text: ' • ' },
                              { text: 'Thriller' },
                              { text: ' • ' },
                              { text: '4:54' },
                            ],
                          },
                        },
                      },
                    ],
                  },
                },
                {
                  musicResponsiveListItemRenderer: {
                    playlistItemData: { videoId: 'vid_alin' },
                    flexColumns: [
                      { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: '给我一个理由忘记' }] } } },
                      {
                        musicResponsiveListItemFlexColumnRenderer: {
                          text: { runs: [{ text: 'A·Lin · 寂寞不痛 · 4:45' }] },
                        },
                      },
                    ],
                  },
                },
                {
                  musicResponsiveListItemRenderer: {
                    playlistItemData: { videoId: 'vid_bocelli' },
                    flexColumns: [
                      { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: 'Con Te Partirò' }] } } },
                      {
                        musicResponsiveListItemFlexColumnRenderer: {
                          text: { runs: [{ text: '安德烈·波切利' }, { text: ' • ' }, { text: 'Romanza' }] },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          }],
        },
      },
    }
    const parsed = parseYtmSearchSongs(body)
    expect(parsed.tracks.map(t => [t.videoId, t.artist, t.album])).toEqual([
      ['vid_mj', '迈克尔·杰克逊', 'Thriller'],
      ['vid_alin', 'A·Lin', '寂寞不痛'],
      ['vid_bocelli', '安德烈·波切利', 'Romanza'],
    ])
  })

  it('R3 回归：带链接多艺人由 “ 和 ” / “ and ” 连接时拆为规范合作艺人，且 Radio 包装节点仅取 primaryRenderer 忽略 MV counterpart', () => {
    const artistRun = (name: string) => ({
      text: name,
      navigationEndpoint: {
        browseEndpoint: {
          browseEndpointContextSupportedConfigs: {
            browseEndpointContextMusicConfig: { pageType: 'MUSIC_PAGE_TYPE_ARTIST' },
          },
        },
      },
    })
    const albumRun = (name: string) => ({
      text: name,
      navigationEndpoint: {
        browseEndpoint: {
          browseEndpointContextSupportedConfigs: {
            browseEndpointContextMusicConfig: { pageType: 'MUSIC_PAGE_TYPE_ALBUM' },
          },
        },
      },
    })
    const searchBody = {
      responseContext: {},
      contents: {
        sectionListRenderer: {
          contents: [{
            musicShelfRenderer: {
              contents: [{
                musicResponsiveListItemRenderer: {
                  playlistItemData: { videoId: 'vid_collab' },
                  flexColumns: [
                    { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: '千里之外' }] } } },
                    {
                      musicResponsiveListItemFlexColumnRenderer: {
                        text: {
                          runs: [
                            artistRun('周杰伦'),
                            { text: ' 和 ' },
                            artistRun('费玉清'),
                            { text: ' • ' },
                            albumRun('依然范特西'),
                            { text: ' • ' },
                            { text: '4:16' },
                          ],
                        },
                      },
                    },
                  ],
                },
              }],
            },
          }],
        },
      },
    }
    const parsedSearch = parseYtmSearchSongs(searchBody)
    expect(parsedSearch.tracks).toEqual([{
      videoId: 'vid_collab',
      title: '千里之外',
      artist: '周杰伦、费玉清',
      album: '依然范特西',
      intervalSec: 256,
      picUrl: null,
    }])

    // playlistPanelVideoWrapperRenderer 仅提取 primaryRenderer，跳过 counterpart MV（含种子 MV）
    const wrappedRadio = {
      responseContext: {},
      contents: {
        playlistPanelRenderer: {
          contents: [
            {
              playlistPanelVideoWrapperRenderer: {
                primaryRenderer: {
                  playlistPanelVideoRenderer: {
                    videoId: 'seed_audio',
                    title: { runs: [{ text: '晴天' }] },
                    longBylineText: { runs: [{ text: '周杰伦' }] },
                    lengthText: { runs: [{ text: '4:29' }] },
                  },
                },
                counterpart: [{
                  counterpartRenderer: {
                    playlistPanelVideoRenderer: {
                      videoId: 'seed_mv',
                      title: { runs: [{ text: '晴天' }] },
                      longBylineText: { runs: [{ text: '周杰伦' }] },
                      lengthText: { runs: [{ text: '4:35' }] },
                    },
                  },
                }],
              },
            },
            {
              playlistPanelVideoWrapperRenderer: {
                primaryRenderer: {
                  playlistPanelVideoRenderer: {
                    videoId: 'rec_audio',
                    title: { runs: [{ text: '七里香' }] },
                    longBylineText: { runs: [{ text: '周杰伦' }] },
                    lengthText: { runs: [{ text: '4:59' }] },
                  },
                },
                counterpart: [{
                  counterpartRenderer: {
                    playlistPanelVideoRenderer: {
                      videoId: 'rec_mv',
                      title: { runs: [{ text: '七里香' }] },
                      longBylineText: { runs: [{ text: '周杰伦' }] },
                      lengthText: { runs: [{ text: '5:05' }] },
                    },
                  },
                }],
              },
            },
          ],
        },
      },
    }
    const parsedRadio = parseYtmNextRadio(wrappedRadio, 'seed_audio')
    expect(parsedRadio.hasValidContainer).toBe(true)
    expect(parsedRadio.tracks.map(t => t.videoId)).toEqual(['rec_audio'])

    // 畸形空 playlistPanelVideoRenderer 且无 continuation 时拒判合法末页
    const corruptedTerminal = {
      responseContext: {},
      continuationContents: {
        playlistPanelContinuation: {
          contents: [{ playlistPanelVideoRenderer: {} }],
        },
      },
    }
    expect(parseYtmNextRadio(corruptedTerminal, 'seed_audio', { isContinuation: true }).hasValidContainer).toBe(false)
  })
})

describe('ytmProxy：有效代理与缓存上下文单源解析', () => {
  it('严格校验整数端口范围 [1, 65535]：非法/空/脏后缀端口返回 null 并回退全局/直连，绝不回落端口 80', () => {
    expect(parseProxyAddress(' 127.0.0.1 ', '7890')).toEqual({ host: '127.0.0.1', port: 7890 })
    expect(parseProxyAddress('127.0.0.1', '1')).toEqual({ host: '127.0.0.1', port: 1 })
    expect(parseProxyAddress('127.0.0.1', '65535')).toEqual({ host: '127.0.0.1', port: 65535 })
    expect(parseProxyAddress('127.0.0.1', '7890abc')).toBeNull()
    expect(parseProxyAddress('127.0.0.1', '0')).toBeNull()
    expect(parseProxyAddress('127.0.0.1', '')).toBeNull()
    expect(parseProxyAddress('127.0.0.1', '65536')).toBeNull()
    expect(parseProxyAddress('', '7890')).toBeNull()

    const invalidDedicatedFallsBackToGlobal = resolveEffectiveYtmProxy({
      'recommend.ytm.proxy.enable': true,
      'recommend.ytm.proxy.host': '127.0.0.1',
      'recommend.ytm.proxy.port': '7890abc',
      'network.proxy.enable': true,
      'network.proxy.host': '10.0.0.1',
      'network.proxy.port': '8080',
    })
    expect(invalidDedicatedFallsBackToGlobal.proxyOverride).toBeUndefined()
    expect(invalidDedicatedFallsBackToGlobal.contextKey).toBe('global:10.0.0.1:8080')

    const dedicated = resolveEffectiveYtmProxy({
      'recommend.ytm.proxy.enable': true,
      'recommend.ytm.proxy.host': '127.0.0.1',
      'recommend.ytm.proxy.port': '7890',
      'network.proxy.enable': true,
      'network.proxy.host': '10.0.0.1',
      'network.proxy.port': '8080',
    })
    expect(dedicated.proxyOverride).toEqual({ host: '127.0.0.1', port: 7890 })
    expect(dedicated.contextKey).toBe('dedicated:127.0.0.1:7890')

    const fallbackGlobal = resolveEffectiveYtmProxy({
      'recommend.ytm.proxy.enable': false,
      'network.proxy.enable': true,
      'network.proxy.host': '10.0.0.1',
      'network.proxy.port': '8080',
    })
    expect(fallbackGlobal.proxyOverride).toBeUndefined()
    expect(fallbackGlobal.effective).toEqual({ host: '10.0.0.1', port: 8080 })
    expect(fallbackGlobal.contextKey).toBe('global:10.0.0.1:8080')

    const fallbackEnv = resolveEffectiveYtmProxy(
      { 'recommend.ytm.proxy.enable': false, 'network.proxy.enable': false },
      { envProxy: { host: '127.0.0.1', port: '1080' } },
    )
    expect(fallbackEnv.proxyOverride).toBeUndefined()
    expect(fallbackEnv.contextKey).toBe('env:127.0.0.1:1080')

    const direct = resolveEffectiveYtmProxy({ 'recommend.ytm.proxy.enable': false })
    expect(direct.proxyOverride).toBeUndefined()
    expect(direct.effective).toBeNull()
    expect(direct.contextKey).toBe('direct')
  })
})

describe('ytmAdapter：地区封锁识别、HTTP 状态异常类型与连通性测试总截止', () => {
  it('InnerTube 返回地区封锁 HTML 抛 YtmRegionBlockedError；429 抛 MusicSdkResponseError', async() => {
    const adapter = createYtmAdapter()
    adapterMocks.httpFetch.mockReturnValueOnce({
      promise: Promise.resolve({ statusCode: 200, body: '<html>YouTube Music is not available in your region</html>' }),
      cancelHttp: vi.fn(),
    })
    await expect(adapter.searchSongs('晴天')).rejects.toBeInstanceOf(YtmRegionBlockedError)

    adapterMocks.httpFetch.mockReturnValueOnce({
      promise: Promise.resolve({ statusCode: 429, body: {} }),
      cancelHttp: vi.fn(),
    })
    await expect(adapter.searchSongs('晴天')).rejects.toBeInstanceOf(MusicSdkResponseError)
  })

  it('testYtmConnection 主页正常但搜索返回合法空数组时报告 error 而非 region-blocked；正文卡死时触发总截止并取消请求', async() => {
    adapterMocks.httpFetch
      .mockReturnValueOnce({
        promise: Promise.resolve({ statusCode: 200, body: '<html><title>YouTube Music</title></html>' }),
        cancelHttp: vi.fn(),
      })
      .mockReturnValueOnce({
        promise: Promise.resolve({
          statusCode: 200,
          body: { responseContext: {}, contents: { sectionListRenderer: { contents: [] } } },
        }),
        cancelHttp: vi.fn(),
      })
    const emptyRes = await testYtmConnection()
    expect(emptyRes.ok).toBe(false)
    expect(emptyRes.status).toBe('error')

    // 模拟代理发回响应头后卡死正文：到达总截止后必须主动取消请求并返回超时错误
    vi.useFakeTimers()
    const cancelHttp = vi.fn()
    adapterMocks.httpFetch.mockReturnValueOnce({
      promise: new Promise(() => {}),
      cancelHttp,
    })
    const stalledPromise = testYtmConnection(undefined, 500)
    await vi.advanceTimersByTimeAsync(600)
    const stalledRes = await stalledPromise
    expect(stalledRes.ok).toBe(false)
    expect(stalledRes.status).toBe('error')
    expect(stalledRes.message).toContain('超时')
    expect(cancelHttp).toHaveBeenCalledTimes(1)
  })
})
