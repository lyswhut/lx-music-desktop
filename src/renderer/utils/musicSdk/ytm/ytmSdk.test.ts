import http from 'node:http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MusicSdkResponseError } from '@renderer/utils/musicSdk/responseError'
import {
  extractYtmListParam,
  isUnsupportedYtmMixId,
  normalizeYtmPlaylistId,
  parseYtmAlbumDetail,
  parseYtmArtistPage,
  parseYtmBrowsePlaylists,
  parseYtmCharts,
  parseYtmMoodsAndGenres,
  parseYtmPlaylistDetailPage,
  parseYtmSearchAlbumsPage,
  parseYtmSearchArtistsPage,
  parseYtmSearchPlaylistsPage,
  parseYtmSearchSongsPage,
  YtmRegionBlockedError,
} from './parser'
import { YtmPaginationCache, sharedYtmPaginationCache, type YtmCancellablePromise } from './paginationCache'
import { sharedYtmRegionCache } from './regionCache'
import { setYtmRuntimeContext } from './runtimeContext'
import { extractYtmAudioFormats, isYtmStreamUrlExpired, probeYtmOpenRangeStream, selectYtmAudioStream } from './player'
import { formatLrcTimestamp } from './lyric'
import ytm from './index'

const mocks = vi.hoisted(() => ({
  httpFetch: vi.fn(),
}))

vi.mock('@renderer/utils/request', () => ({
  httpFetch: mocks.httpFetch,
}))

const makeTrackRow = (
  videoId: string,
  title: string,
  artist: string,
  album = 'Album A',
  duration = '3:45',
  artistId = 'UCartist0001',
  albumId = 'MPREb_album01',
) => ({
  musicResponsiveListItemRenderer: {
    playlistItemData: { videoId },
    thumbnail: { musicThumbnailRenderer: { thumbnail: { thumbnails: [{ url: `https://img/${videoId}.jpg`, width: 226 }] } } },
    flexColumns: [
      {
        musicResponsiveListItemFlexColumnRenderer: {
          text: { runs: [{ text: title, navigationEndpoint: { watchEndpoint: { videoId } } }] },
        },
      },
      {
        musicResponsiveListItemFlexColumnRenderer: {
          text: {
            runs: artist
              ? [
                  { text: artist, navigationEndpoint: { browseEndpoint: { browseId: artistId } } },
                  ...(album ? [{ text: ' • ' }, { text: album, navigationEndpoint: { browseEndpoint: { browseId: albumId } } }] : []),
                  ...(duration ? [{ text: ' • ' }, { text: duration }] : []),
                ]
              : [],
          },
        },
      },
    ],
    fixedColumns: duration
      ? [{ musicResponsiveListItemFixedColumnRenderer: { text: { runs: [{ text: duration }] } } }]
      : [],
  },
})

const makeMockHttpFetch = (body: unknown, statusCode = 200) => {
  const cancelHttp = vi.fn()
  return {
    promise: Promise.resolve({ statusCode, body }),
    cancelHttp,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  sharedYtmPaginationCache.clear()
  sharedYtmRegionCache.clear()
  setYtmRuntimeContext({
    getAppSetting: () => ({ 'recommend.ytm.enable': true }),
    getProxy: () => undefined,
  })
})

afterEach(() => {
  setYtmRuntimeContext(null)
})

describe('YTM ID normalization & URL guards', () => {
  it('normalizes valid playlist IDs and rejects RD auto-mixes while keeping RDCLAK5uy_', () => {
    expect(normalizeYtmPlaylistId('PL4fGSI1pDJn6puJdseH2Rt9sMvt9E2M4i')).toBe('VLPL4fGSI1pDJn6puJdseH2Rt9sMvt9E2M4i')
    expect(normalizeYtmPlaylistId('VLPL4fGSI1pDJn6puJdseH2Rt9sMvt9E2M4i')).toBe('VLPL4fGSI1pDJn6puJdseH2Rt9sMvt9E2M4i')
    expect(normalizeYtmPlaylistId('RDCLAK5uy_kmPRjHDECIcuVwnKsx2Ng7fyNgFKWNJFs')).toBe('VLRDCLAK5uy_kmPRjHDECIcuVwnKsx2Ng7fyNgFKWNJFs')
    expect(normalizeYtmPlaylistId('RDdQw4w9WgXcQ')).toBeNull()
    expect(normalizeYtmPlaylistId('VLRDAMVMdQw4w9WgXcQ')).toBeNull()
    expect(normalizeYtmPlaylistId('UCjay1234567890')).toBeNull()
    expect(normalizeYtmPlaylistId('MPREb_album01')).toBeNull()
    expect(normalizeYtmPlaylistId('FEmusic_home')).toBeNull()
    expect(isUnsupportedYtmMixId('RDdQw4w9WgXcQ')).toBe(true)
    expect(isUnsupportedYtmMixId('RDCLAK5uy_kmPRjHDECIcuVwnKsx2Ng7fyNgFKWNJFs')).toBe(false)
    expect(extractYtmListParam('https://music.youtube.com/playlist?list=PLabc123456')).toBe('PLabc123456')
  })
})

describe('YTM InnerTube pure parsers', () => {
  it('parses search songs, artists, albums, and playlists with continuations', () => {
    const songsResp = {
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
                        makeTrackRow('vid00000001', '晴天', '周杰伦', '叶惠美', '4:29', 'UCjay123', 'MPREb_yhm'),
                      ],
                      continuations: [{ nextContinuationData: { continuation: 'CONT_SONGS_2' } }],
                    },
                  }],
                },
              },
            },
          }],
        },
      },
    }
    const parsedSongs = parseYtmSearchSongsPage(songsResp)
    expect(parsedSongs.hasValidContainer).toBe(true)
    expect(parsedSongs.continuation).toBe('CONT_SONGS_2')
    expect(parsedSongs.tracks[0]).toMatchObject({
      videoId: 'vid00000001',
      title: '晴天',
      artist: '周杰伦',
      album: '叶惠美',
      intervalSec: 269,
      albumId: 'MPREb_yhm',
      artists: [{ id: 'UCjay123', name: '周杰伦' }],
    })

    const artistResp = {
      responseContext: {},
      contents: {
        tabbedSearchResultsRenderer: {
          tabs: [{
            tabRenderer: {
              content: {
                sectionListRenderer: {
                  contents: [{
                    musicShelfRenderer: {
                      contents: [{
                        musicResponsiveListItemRenderer: {
                          navigationEndpoint: { browseEndpoint: { browseId: 'UCjay123' } },
                          thumbnail: { musicThumbnailRenderer: { thumbnail: { thumbnails: [{ url: 'https://img/jay.jpg' }] } } },
                          flexColumns: [
                            { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: '周杰伦' }] } } },
                          ],
                        },
                      }],
                    },
                  }],
                },
              },
            },
          }],
        },
      },
    }
    const parsedArtists = parseYtmSearchArtistsPage(artistResp)
    expect(parsedArtists.hasValidContainer).toBe(true)
    expect(parsedArtists.list).toEqual([{ id: 'UCjay123', name: '周杰伦', img: 'https://img/jay.jpg', source: 'ytm' }])

    const albumResp = {
      responseContext: {},
      contents: {
        tabbedSearchResultsRenderer: {
          tabs: [{
            tabRenderer: {
              content: {
                sectionListRenderer: {
                  contents: [{
                    musicShelfRenderer: {
                      contents: [{
                        musicResponsiveListItemRenderer: {
                          navigationEndpoint: { browseEndpoint: { browseId: 'MPREb_yhm' } },
                          thumbnail: { musicThumbnailRenderer: { thumbnail: { thumbnails: [{ url: 'https://img/yhm.jpg' }] } } },
                          flexColumns: [
                            { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: '叶惠美' }] } } },
                            { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: '专辑' }, { text: ' • ' }, { text: '周杰伦' }, { text: ' • ' }, { text: '2003' }] } } },
                          ],
                        },
                      }],
                    },
                  }],
                },
              },
            },
          }],
        },
      },
    }
    const parsedAlbums = parseYtmSearchAlbumsPage(albumResp)
    expect(parsedAlbums.hasValidContainer).toBe(true)
    expect(parsedAlbums.list[0]).toMatchObject({
      id: 'MPREb_yhm',
      name: '叶惠美',
      singer: '周杰伦',
      publishTime: '2003',
      source: 'ytm',
    })

    const plResp = {
      responseContext: {},
      contents: {
        tabbedSearchResultsRenderer: {
          tabs: [{
            tabRenderer: {
              content: {
                sectionListRenderer: {
                  contents: [{
                    musicShelfRenderer: {
                      contents: [{
                        musicResponsiveListItemRenderer: {
                          navigationEndpoint: { browseEndpoint: { browseId: 'VLPLabc123456' } },
                          thumbnail: { musicThumbnailRenderer: { thumbnail: { thumbnails: [{ url: 'https://img/pl.jpg' }] } } },
                          flexColumns: [
                            { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: '华语经典' }] } } },
                            { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: 'YouTube Music' }, { text: ' • ' }, { text: '10万次观看' }] } } },
                          ],
                        },
                      }],
                    },
                  }],
                },
              },
            },
          }],
        },
      },
    }
    const parsedPl = parseYtmSearchPlaylistsPage(plResp)
    expect(parsedPl.hasValidContainer).toBe(true)
    expect(parsedPl.list[0]).toMatchObject({
      id: 'VLPLabc123456',
      name: '华语经典',
      author: 'YouTube Music',
      source: 'ytm',
    })
  })

  it('parses moods & genres, browse playlists, charts, album detail (with empty col1 backfill), and artist page', () => {
    const moods = parseYtmMoodsAndGenres({
      responseContext: {},
      contents: {
        singleColumnBrowseResultsRenderer: {
          tabs: [{
            tabRenderer: {
              content: {
                sectionListRenderer: {
                  contents: [{
                    gridRenderer: {
                      header: { gridHeaderRenderer: { title: { runs: [{ text: '心情与场景' }] } } },
                      items: [{
                        musicNavigationButtonRenderer: {
                          buttonText: { runs: [{ text: '放松' }] },
                          clickCommand: { browseEndpoint: { browseId: 'FEmusic_moods_and_genres_category', params: 'ggMPOg1uX1JOQWZFeDByc2Jm' } },
                        },
                      }],
                    },
                  }],
                },
              },
            },
          }],
        },
      },
    })
    expect(moods.hasValidContainer).toBe(true)
    expect(moods.tags[0].list[0]).toMatchObject({ id: 'ggMPOg1uX1JOQWZFeDByc2Jm', name: '放松', source: 'ytm' })
    expect(moods.hotTag.length).toBe(1)

    const browsePl = parseYtmBrowsePlaylists({
      responseContext: {},
      contents: {
        singleColumnBrowseResultsRenderer: {
          tabs: [{
            tabRenderer: {
              content: {
                sectionListRenderer: {
                  contents: [{
                    musicCarouselShelfRenderer: {
                      contents: [{
                        musicTwoRowItemRenderer: {
                          title: { runs: [{ text: '精选歌单', navigationEndpoint: { browseEndpoint: { browseId: 'VLRDCLAK5uy_feat1' } } }] },
                          subtitle: { runs: [{ text: 'YouTube Music' }] },
                          thumbnailRenderer: { musicThumbnailRenderer: { thumbnail: { thumbnails: [{ url: 'https://img/f1.jpg' }] } } },
                        },
                      }],
                    },
                  }],
                },
              },
            },
          }],
        },
      },
    })
    expect(browsePl.hasValidContainer).toBe(true)
    expect(browsePl.list[0]).toMatchObject({ id: 'VLRDCLAK5uy_feat1', name: '精选歌单', source: 'ytm' })

    const charts = parseYtmCharts({
      responseContext: {},
      contents: {
        singleColumnBrowseResultsRenderer: {
          tabs: [{
            tabRenderer: {
              content: {
                sectionListRenderer: {
                  contents: [{
                    musicCarouselShelfRenderer: {
                      contents: [{
                        musicTwoRowItemRenderer: {
                          title: { runs: [{ text: '全球热门歌曲' }] },
                          navigationEndpoint: { browseEndpoint: { browseId: 'VLPL4fGSI1pDJn5kI81J1fYWK5eZRl1zJ5kM' } },
                        },
                      }],
                    },
                  }],
                },
              },
            },
          }],
        },
      },
    })
    expect(charts.hasValidContainer).toBe(true)
    expect(charts.list[0]).toEqual({
      id: 'ytm__VLPL4fGSI1pDJn5kI81J1fYWK5eZRl1zJ5kM',
      name: '全球热门歌曲',
      bangid: 'VLPL4fGSI1pDJn5kI81J1fYWK5eZRl1zJ5kM',
    })

    const albumDetail = parseYtmAlbumDetail({
      responseContext: {},
      contents: {
        twoColumnBrowseResultsRenderer: {
          tabs: [{
            tabRenderer: {
              content: {
                sectionListRenderer: {
                  contents: [{
                    musicResponsiveHeaderRenderer: {
                      title: { runs: [{ text: '叶惠美' }] },
                      straplineTextOne: { runs: [{ text: '周杰伦', navigationEndpoint: { browseEndpoint: { browseId: 'UCjay123' } } }] },
                      thumbnail: { musicThumbnailRenderer: { thumbnail: { thumbnails: [{ url: 'https://img/yhm.jpg' }] } } },
                    },
                  }],
                },
              },
            },
          }],
          secondaryContents: {
            sectionListRenderer: {
              contents: [{
                musicShelfRenderer: {
                  contents: [
                    // col1 为空的单人专辑曲目，需从头部回填歌手/专辑/封面
                    makeTrackRow('vid00000002', '以父之名', '', '', '5:42'),
                  ],
                },
              }],
            },
          },
        },
      },
    }, 'MPREb_yhm')
    expect(albumDetail.hasValidContainer).toBe(true)
    expect(albumDetail.tracks[0]).toMatchObject({
      videoId: 'vid00000002',
      title: '以父之名',
      artist: '周杰伦',
      album: '叶惠美',
      albumId: 'MPREb_yhm',
      picUrl: 'https://img/vid00000002.jpg',
    })

    const artistPage = parseYtmArtistPage({
      responseContext: {},
      header: { musicImmersiveHeaderRenderer: { title: { runs: [{ text: '周杰伦' }] } } },
      contents: {
        singleColumnBrowseResultsRenderer: {
          tabs: [{
            tabRenderer: {
              content: {
                sectionListRenderer: {
                  contents: [{
                    musicShelfRenderer: {
                      title: { runs: [{ text: '热门歌曲' }] },
                      bottomEndpoint: { browseEndpoint: { browseId: 'VLOLAK5uy_top100', params: 'gg==' } },
                      contents: [makeTrackRow('vid00000003', '稻香', '周杰伦', '魔杰座', '3:43')],
                    },
                  }],
                },
              },
            },
          }],
        },
      },
    }, 'UCjay123')
    expect(artistPage.hasValidContainer).toBe(true)
    expect(artistPage.topSongsBrowseId).toBe('VLOLAK5uy_top100')
    expect(artistPage.topSongsParams).toBe('gg==')
    expect(artistPage.inlineTracks).toHaveLength(1)

    const plDetail = parseYtmPlaylistDetailPage({
      responseContext: {},
      contents: {
        twoColumnBrowseResultsRenderer: {
          tabs: [{
            tabRenderer: {
              content: {
                sectionListRenderer: {
                  contents: [{
                    musicResponsiveHeaderRenderer: {
                      title: { runs: [{ text: '华语精选' }] },
                      description: { musicDescriptionShelfRenderer: { description: { runs: [{ text: '经典合集' }] } } },
                      straplineTextOne: { runs: [{ text: 'YTM Curator' }] },
                    },
                  }],
                },
              },
            },
          }],
          secondaryContents: {
            sectionListRenderer: {
              contents: [{
                musicPlaylistShelfRenderer: {
                  contents: [makeTrackRow('vid00000004', '七里香', '周杰伦', '七里香', '4:59')],
                  continuations: [{ nextContinuationData: { continuation: 'CONT_PL_2' } }],
                },
              }],
            },
          },
        },
      },
    })
    expect(plDetail.hasValidContainer).toBe(true)
    expect(plDetail.continuation).toBe('CONT_PL_2')
    expect(plDetail.info.name).toBe('华语精选')
    expect(plDetail.tracks[0].videoId).toBe('vid00000004')
  })

  it('rejects bare sectionListRenderer error shells and scopes playlist tracks/continuation strictly to musicPlaylistShelfRenderer', () => {
    const unavailableShell = {
      responseContext: {},
      contents: {
        twoColumnBrowseResultsRenderer: {
          secondaryContents: {
            sectionListRenderer: {
              contents: [{ messageRenderer: { text: { runs: [{ text: 'Playlist does not exist' }] } } }],
            },
          },
        },
      },
    }
    expect(parseYtmPlaylistDetailPage(unavailableShell).hasValidContainer).toBe(false)
    expect(parseYtmAlbumDetail(unavailableShell, 'MPREb_missing').hasValidContainer).toBe(false)

    // 推荐区 musicShelfRenderer 在前、正片 musicPlaylistShelfRenderer 在后，且外层 sectionListRenderer 带相关推荐续页
    const mixedPlaylist = {
      responseContext: {},
      contents: {
        twoColumnBrowseResultsRenderer: {
          secondaryContents: {
            sectionListRenderer: {
              contents: [
                {
                  musicShelfRenderer: {
                    title: { runs: [{ text: '推荐歌曲' }] },
                    contents: [makeTrackRow('vidRec000001', '推荐误入曲', '其他歌手')],
                    continuations: [{ nextContinuationData: { continuation: 'CONT_REC_BAD' } }],
                  },
                },
                {
                  musicPlaylistShelfRenderer: {
                    contents: [makeTrackRow('vidReal00001', '正片曲目', '周杰伦')],
                    continuations: [{ nextContinuationData: { continuation: 'CONT_PL_REAL' } }],
                  },
                },
              ],
              continuations: [{ nextContinuationData: { continuation: 'CONT_OUTER_RELATED' } }],
            },
          },
        },
      },
    }
    const parsedMixed = parseYtmPlaylistDetailPage(mixedPlaylist)
    expect(parsedMixed.hasValidContainer).toBe(true)
    expect(parsedMixed.tracks.map(t => t.videoId)).toEqual(['vidReal00001'])
    expect(parsedMixed.continuation).toBe('CONT_PL_REAL')

    // 缺失歌单主栏、仅剩推荐 musicShelfRenderer 时，歌单/榜单同步解析必须拒绝（hasValidContainer=false）
    const recOnlyPlaylist = {
      responseContext: {},
      contents: {
        twoColumnBrowseResultsRenderer: {
          secondaryContents: {
            sectionListRenderer: {
              contents: [{
                musicShelfRenderer: {
                  title: { runs: [{ text: '推荐歌曲' }] },
                  contents: [makeTrackRow('vidRecOnly01', '仅推荐', '其他歌手')],
                },
              }],
            },
          },
        },
      },
    }
    expect(parseYtmPlaylistDetailPage(recOnlyPlaylist).hasValidContainer).toBe(false)
    // 带标题的推荐栏即使在 allowGenericShelf=true 下也不得冒充热门歌曲全表
    expect(parseYtmPlaylistDetailPage(recOnlyPlaylist, { allowGenericShelf: true }).hasValidContainer).toBe(false)
    // 无标题通用曲目栏仅在 allowGenericShelf=true（歌手热门歌曲）下被接受
    const untitledGenericShelf = {
      responseContext: {},
      contents: {
        singleColumnBrowseResultsRenderer: {
          tabs: [{ tabRenderer: { content: { sectionListRenderer: { contents: [{ musicShelfRenderer: { contents: [makeTrackRow('vidTopGen01', '热门1', '周杰伦')] } }] } } } }],
        },
      },
    }
    expect(parseYtmPlaylistDetailPage(untitledGenericShelf).hasValidContainer).toBe(false)
    expect(parseYtmPlaylistDetailPage(untitledGenericShelf, { allowGenericShelf: true }).hasValidContainer).toBe(true)

    // 存在损坏/空命令续页节点（空 continuation、nextContinuationData: null、空 continuationEndpoint）均返回 hasValidContainer=false
    const brokenContPlaylist = {
      responseContext: {},
      contents: {
        twoColumnBrowseResultsRenderer: {
          secondaryContents: {
            sectionListRenderer: {
              contents: [{
                musicPlaylistShelfRenderer: {
                  contents: [makeTrackRow('vidBroken01', '正片', '周杰伦')],
                  continuations: [{ nextContinuationData: { continuation: '' } }],
                },
              }],
            },
          },
        },
      },
    }
    expect(parseYtmPlaylistDetailPage(brokenContPlaylist).hasValidContainer).toBe(false)
    const nullContPlaylist = {
      responseContext: {},
      contents: {
        twoColumnBrowseResultsRenderer: {
          secondaryContents: {
            sectionListRenderer: {
              contents: [{
                musicPlaylistShelfRenderer: {
                  contents: [makeTrackRow('vidBroken02', '正片', '周杰伦')],
                  continuations: [{ nextContinuationData: null }],
                },
              }],
            },
          },
        },
      },
    }
    expect(parseYtmPlaylistDetailPage(nullContPlaylist).hasValidContainer).toBe(false)
    const emptyEndpointContPlaylist = {
      responseContext: {},
      contents: {
        twoColumnBrowseResultsRenderer: {
          secondaryContents: {
            sectionListRenderer: {
              contents: [{
                musicPlaylistShelfRenderer: {
                  contents: [
                    makeTrackRow('vidBroken03', '正片', '周杰伦'),
                    { continuationItemRenderer: { continuationEndpoint: {} } },
                  ],
                },
              }],
            },
          },
        },
      },
    }
    expect(parseYtmPlaylistDetailPage(emptyEndpointContPlaylist).hasValidContainer).toBe(false)

    // 4 列曲目中 cols[2] 为低播量文案、cols[3] 为显式专辑链接时，不丢失真实专辑与 albumId
    const fourColSearch = {
      responseContext: {},
      contents: {
        tabbedSearchResultsRenderer: {
          tabs: [{
            tabRenderer: {
              content: {
                sectionListRenderer: {
                  contents: [{
                    musicShelfRenderer: {
                      contents: [{
                        musicResponsiveListItemRenderer: {
                          playlistItemData: { videoId: 'vidFourCol1' },
                          flexColumns: [
                            { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: '晴天', navigationEndpoint: { watchEndpoint: { videoId: 'vidFourCol1' } } }] } } },
                            { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: '周杰伦', navigationEndpoint: { browseEndpoint: { browseId: 'UCjay123' } } }] } } },
                            { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: '不到 1,000 次播放' }] } } },
                            { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: '叶惠美', navigationEndpoint: { browseEndpoint: { browseId: 'MPREb_4col', browseEndpointContextSupportedConfigs: { browseEndpointContextMusicConfig: { pageType: 'MUSIC_PAGE_TYPE_ALBUM' } } } } }] } } },
                          ],
                        },
                      }],
                    },
                  }],
                },
              },
            },
          }],
        },
      },
    }
    const parsedFourCol = parseYtmSearchSongsPage(fourColSearch)
    expect(parsedFourCol.tracks[0]).toMatchObject({ album: '叶惠美', albumId: 'MPREb_4col' })

    // 歌手页内联曲目若已有无链接客席歌手名，不得错误继承歌手主页主艺人 ID
    const artistGuestRow = parseYtmArtistPage({
      responseContext: {},
      header: { musicImmersiveHeaderRenderer: { title: { runs: [{ text: '周杰伦' }] } } },
      contents: {
        singleColumnBrowseResultsRenderer: {
          tabs: [{
            tabRenderer: {
              content: {
                sectionListRenderer: {
                  contents: [{
                    musicShelfRenderer: {
                      title: { runs: [{ text: '热门歌曲' }] },
                      contents: [{
                        musicResponsiveListItemRenderer: {
                          playlistItemData: { videoId: 'vidGuest01' },
                          flexColumns: [
                            { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: '客席曲' }] } } },
                            { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: '客席歌手' }] } } },
                          ],
                        },
                      }],
                    },
                  }],
                },
              },
            },
          }],
        },
      },
    }, 'UCjayMain')
    expect(artistGuestRow.inlineTracks[0].artist).toBe('客席歌手')
    expect(artistGuestRow.inlineTracks[0].artists).toBeUndefined()

    // 专辑页若带标题的推荐栏在无标题主曲目栏之前，仍准确选取无标题主栏
    const albumWithRecFirst = {
      responseContext: {},
      contents: {
        twoColumnBrowseResultsRenderer: {
          secondaryContents: {
            sectionListRenderer: {
              contents: [
                {
                  musicShelfRenderer: {
                    title: { runs: [{ text: '其他版本' }] },
                    contents: [makeTrackRow('vidOtherVer', '误入推荐', '他人')],
                  },
                },
                {
                  musicShelfRenderer: {
                    contents: [makeTrackRow('vidAlbumMain', '专辑正曲', '周杰伦')],
                  },
                },
              ],
            },
          },
        },
      },
    }
    const parsedAlbOrder = parseYtmAlbumDetail(albumWithRecFirst, 'MPREb_order')
    expect(parsedAlbOrder.hasValidContainer).toBe(true)
    expect(parsedAlbOrder.tracks.map(t => t.videoId)).toEqual(['vidAlbumMain'])
  })
})

describe('L3 YtmPaginationCache state machine', () => {
  const makeItems = (prefix: string, start: number, count: number) =>
    Array.from({ length: count }, (_, idx) => ({ id: `${prefix}_${start + idx}` }))

  const cancellable = <T>(p: Promise<T>, onCancel?: () => void): YtmCancellablePromise<T> => {
    const out = p as YtmCancellablePromise<T>
    out.cancel = onCancel ?? vi.fn()
    return out
  }

  it('slices mixed short (10) and long (68) upstream pages into fixed limit=20 windows with dedup and exact final total', async() => {
    const cache = new YtmPaginationCache()
    const upstreamPages: Record<string, { items: Array<{ id: string }>, continuation: string | null }> = {
      INIT: { items: makeItems('s', 1, 10), continuation: 'C2' },
      // C2 包含 2 条重复 s_9/s_10 + 66 条新条目（总缓冲 76 条）
      C2: { items: [...makeItems('s', 9, 2), ...makeItems('s', 11, 66)], continuation: 'C3' },
      C3: { items: makeItems('s', 77, 4), continuation: null },
    }
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    const fetcher = vi.fn((cursor) => {
      const key = cursor.isInitial ? 'INIT' : cursor.continuation!
      return cancellable(Promise.resolve(upstreamPages[key]))
    })

    const p1 = await cache.fetchWindow({ key: 'k1', page: 1, limit: 20, getItemId: x => x.id, fetcher })
    expect(p1.list).toHaveLength(20)
    expect(p1.list[0].id).toBe('s_1')
    expect(p1.list[19].id).toBe('s_20')
    expect(p1.hasMore).toBe(true)
    // 未耗尽时 total 允许翻到下一页
    expect(Math.ceil(p1.total / p1.limit)).toBeGreaterThanOrEqual(2)
    expect(fetcher).toHaveBeenCalledTimes(2) // INIT(10) + C2(66) 一次填满

    // 翻到第 2、3 页直接命中缓冲（0 额外请求）
    const p2 = await cache.fetchWindow({ key: 'k1', page: 2, limit: 20, getItemId: x => x.id, fetcher })
    expect(p2.list.map(x => x.id)).toEqual(makeItems('s', 21, 20).map(x => x.id))
    expect(fetcher).toHaveBeenCalledTimes(2)

    const p3 = await cache.fetchWindow({ key: 'k1', page: 3, limit: 20, getItemId: x => x.id, fetcher })
    expect(p3.list.map(x => x.id)).toEqual(makeItems('s', 41, 20).map(x => x.id))
    expect(fetcher).toHaveBeenCalledTimes(2)

    // 往返翻回第 1 页仍精确一致
    const p1Again = await cache.fetchWindow({ key: 'k1', page: 1, limit: 20, getItemId: x => x.id, fetcher })
    expect(p1Again.list.map(x => x.id)).toEqual(p1.list.map(x => x.id))

    // 翻到第 4 页触发 C3 耗尽（总 80 条 = 4 页）
    const p4 = await cache.fetchWindow({ key: 'k1', page: 4, limit: 20, getItemId: x => x.id, fetcher })
    expect(p4.list).toHaveLength(20)
    expect(p4.list[19].id).toBe('s_80')
    expect(p4.hasMore).toBe(false)
    expect(p4.total).toBe(80)
    expect(Math.ceil(p4.total / p4.limit)).toBe(4)
    expect(fetcher).toHaveBeenCalledTimes(3)
  })

  it('supports single-flight sharing, refcounted cancel, and isRefresh generation isolation', async() => {
    const cache = new YtmPaginationCache()
    let resolveFirst!: (val: { items: Array<{ id: string }>, continuation: string | null }) => void
    const cancelFirst = vi.fn()
    let calls = 0
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    const fetcher = vi.fn(() => {
      calls++
      if (calls === 1) {
        return cancellable(new Promise<{ items: Array<{ id: string }>, continuation: string | null }>(resolve => {
          resolveFirst = resolve
        }), cancelFirst)
      }
      return cancellable(Promise.resolve({ items: [{ id: 'fresh_1' }], continuation: null }))
    })

    // 两个并发调用共享同一在途请求；仅取消其中一个不会取消底层请求
    const reqA = cache.fetchWindow({ key: 'sf', page: 1, limit: 20, getItemId: x => x.id, fetcher })
    const reqB = cache.fetchWindow({ key: 'sf', page: 1, limit: 20, getItemId: x => x.id, fetcher })
    expect(fetcher).toHaveBeenCalledTimes(1)
    reqA.cancel?.()
    await expect(reqA).rejects.toThrow(/cancel/i)
    expect(cancelFirst).not.toHaveBeenCalled()

    // isRefresh 启动新一代，取消旧在途请求并丢弃旧代结果
    const reqRefresh = cache.fetchWindow({ key: 'sf', page: 1, limit: 20, isRefresh: true, getItemId: x => x.id, fetcher })
    expect(cancelFirst).toHaveBeenCalledOnce()
    resolveFirst({ items: [{ id: 'stale_1' }], continuation: null })
    const freshWin = await reqRefresh
    expect(freshWin.list.map(x => x.id)).toEqual(['fresh_1'])
    await expect(reqB).rejects.toThrow(/cancel/i)
  })

  it('recovers after transient error, stops on duplicate continuation, drains extraCursors, and marks truncated at maxContinuations', async() => {
    const cache = new YtmPaginationCache({ maxContinuations: 2 })
    let attempt = 0
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    const flakyFetcher = vi.fn((cursor) => {
      attempt++
      if (attempt === 1) return cancellable(Promise.reject(new Error('network blip')))
      if (cursor.isInitial) {
        return cancellable(Promise.resolve({
          items: [{ id: 'f1' }],
          continuation: 'COMM_2',
          extraCursors: [{ channel: 'featured', continuation: 'FEAT_2' }],
        }))
      }
      if (cursor.continuation === 'COMM_2') {
        return cancellable(Promise.resolve({ items: [{ id: 'c2' }, { id: 'f1' }], continuation: null }))
      }
      return cancellable(Promise.resolve({ items: [{ id: 'f2' }], continuation: 'FEAT_2' })) // 重复游标安全终止
    })

    await expect(cache.fetchWindow({ key: 'flaky', page: 1, limit: 10, getItemId: x => x.id, fetcher: flakyFetcher })).rejects.toThrow('network blip')
    // 错误不标记 exhausted，重试成功且双游标全部拉取并去重
    const ok = await cache.fetchWindow({ key: 'flaky', page: 1, limit: 10, getItemId: x => x.id, fetcher: flakyFetcher })
    expect(ok.list.map(x => x.id)).toEqual(['f1', 'c2', 'f2'])
    expect(ok.hasMore).toBe(false)
    // 重复游标中止续页必须标记 truncated=true，避免同步覆盖原收藏列表
    expect(ok.truncated).toBe(true)

    // 正常耗尽则 truncated=false
    const clean = await cache.fetchWindow({
      key: 'clean',
      page: 1,
      limit: 10,
      getItemId: x => x.id,
      // eslint-disable-next-line @typescript-eslint/promise-function-async
      fetcher: () => cancellable(Promise.resolve({ items: [{ id: 'c1' }], continuation: null })),
    })
    expect(clean.truncated).toBe(false)
    expect(clean.hasMore).toBe(false)

    // 最后一位等待者取消后同 tick 立即重入应发起新请求并成功，不挂载到已被取消的旧 inFlight
    let callIdx = 0
    let rejectCanceled!: (err: Error) => void
    const cancelSpy = vi.fn()
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    const reentryFetcher = vi.fn(() => {
      callIdx++
      if (callIdx === 1) {
        return cancellable(new Promise<{ items: Array<{ id: string }>, continuation: string | null }>((_resolve, reject) => {
          rejectCanceled = reject
        }), () => {
          cancelSpy()
          rejectCanceled(new Error('underlying aborted'))
        })
      }
      return cancellable(Promise.resolve({ items: [{ id: 'reentry_ok' }], continuation: null }))
    })
    const firstCaller = cache.fetchWindow({ key: 'reentry', page: 1, limit: 10, getItemId: x => x.id, fetcher: reentryFetcher })
    firstCaller.cancel?.()
    const secondCaller = cache.fetchWindow({ key: 'reentry', page: 1, limit: 10, getItemId: x => x.id, fetcher: reentryFetcher })
    await expect(firstCaller).rejects.toThrow(/cancel/i)
    const reentryRes = await secondCaller
    expect(cancelSpy).toHaveBeenCalledOnce()
    expect(reentryFetcher).toHaveBeenCalledTimes(2)
    expect(reentryRes.list.map(x => x.id)).toEqual(['reentry_ok'])

    // 超过 maxContinuations (2) 仍带新游标时标记 truncated=true（1 次初始 + 2 次续页 = 15 条）
    let seq = 0
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    const infiniteFetcher = vi.fn(() => {
      seq++
      return cancellable(Promise.resolve({ items: makeItems(`p${seq}`, 1, 5), continuation: `CONT_${seq + 1}` }))
    })
    const trunc = await cache.fetchWindow({ key: 'inf', page: 1, limit: 50, getItemId: x => x.id, fetcher: infiniteFetcher })
    expect(trunc.list).toHaveLength(15)
    expect(trunc.truncated).toBe(true)
    expect(trunc.hasMore).toBe(false)

    // 多游标流中主通道重复游标但副通道仍有有效游标时，hasMore 仍为 true 暴露下一页
    const multiCache = new YtmPaginationCache()
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    const multiFetcher = vi.fn((cursor) => {
      if (cursor.isInitial) {
        return cancellable(Promise.resolve({
          items: [{ id: 'm1' }],
          continuation: 'DUP_C',
          extraCursors: [{ channel: 'featured', continuation: 'GOOD_F' }],
        }))
      }
      if (cursor.continuation === 'DUP_C') {
        return cancellable(Promise.resolve({ items: [{ id: 'm2' }], continuation: 'DUP_C' }))
      }
      return cancellable(Promise.resolve({ items: [{ id: 'm3' }], continuation: null }))
    })
    const mp1 = await multiCache.fetchWindow({ key: 'multi', page: 1, limit: 2, getItemId: x => x.id, fetcher: multiFetcher })
    expect(mp1.list.map(x => x.id)).toEqual(['m1', 'm2'])
    expect(mp1.truncated).toBe(true)
    expect(mp1.hasMore).toBe(true)
    const mp2 = await multiCache.fetchWindow({ key: 'multi', page: 2, limit: 2, getItemId: x => x.id, fetcher: multiFetcher })
    expect(mp2.list.map(x => x.id)).toEqual(['m3'])
    expect(mp2.hasMore).toBe(false)

    // 单次时钟采样：首包在 t=0 写入，第 2 页第 1 次读钟恰为 t=100（未超时）、若旧实现二次读钟会读到 t=101 越界换代；
    // 单次采样必须沿用原代际返回；同时传 isRefresh+expectedGeneration 拒绝且原流完好；真正超过 TTL 后锁代请求拒绝
    const ticks = [0, 0, 100, 101, 101, 205]
    let tickIdx = 0
    const ttlCache = new YtmPaginationCache({ ttlMs: 100, now: () => ticks[Math.min(tickIdx++, ticks.length - 1)] })
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    const ttlFetcher = vi.fn((cursor) => cancellable(Promise.resolve(
      cursor.isInitial
        ? { items: [{ id: 't1' }], continuation: 'NEXT' }
        : { items: [{ id: 't2' }], continuation: 'NEXT2' },
    )))
    const w1 = await ttlCache.fetchWindow({ key: 'ttl', page: 1, limit: 1, getItemId: x => x.id, fetcher: ttlFetcher })
    const w2 = await ttlCache.fetchWindow({
      key: 'ttl',
      page: 2,
      limit: 1,
      expectedGeneration: w1.generation,
      getItemId: x => x.id,
      fetcher: ttlFetcher,
    })
    expect(w2.generation).toBe(w1.generation)
    expect(w2.list.map(x => x.id)).toEqual(['t2'])
    expect(w2.total).toBe(3)

    // 冲突参数先拒且绝不破坏原流（随后 1→2→1 回到第 1 页命中原流缓存、不额外抓取，且 total 仍保持 3 不隐藏第 3 页）
    await expect(ttlCache.fetchWindow({
      key: 'ttl',
      page: 1,
      limit: 1,
      isRefresh: true,
      expectedGeneration: w1.generation,
      getItemId: x => x.id,
      fetcher: ttlFetcher,
    })).rejects.toThrow(/generation changed/)
    const w1Back = await ttlCache.fetchWindow({
      key: 'ttl',
      page: 1,
      limit: 1,
      expectedGeneration: w1.generation,
      getItemId: x => x.id,
      fetcher: ttlFetcher,
    })
    expect(w1Back.generation).toBe(w1.generation)
    expect(w1Back.list.map(x => x.id)).toEqual(['t1'])
    expect(w1Back.total).toBe(3)
    expect(ttlFetcher).toHaveBeenCalledTimes(2)

    // 真正超过 TTL（t=205）后，带 expectedGeneration 的后续页请求必须拒绝
    await expect(ttlCache.fetchWindow({
      key: 'ttl',
      page: 3,
      limit: 1,
      expectedGeneration: w1.generation,
      getItemId: x => x.id,
      fetcher: ttlFetcher,
    })).rejects.toThrow(/generation changed/)
  })
})

describe('YTM SDK endpoints & proxy context isolation', () => {
  it('locks proxy: false when direct, isolates cache on proxy change, and throws MusicSdkResponseError / YtmRegionBlockedError', async() => {
    const validSongs = {
      responseContext: {},
      contents: {
        tabbedSearchResultsRenderer: {
          tabs: [{
            tabRenderer: {
              content: {
                sectionListRenderer: {
                  contents: [{
                    musicShelfRenderer: {
                      contents: [makeTrackRow('vidDirect001', '稻香', '周杰伦')],
                    },
                  }],
                },
              },
            },
          }],
        },
      },
    }
    mocks.httpFetch.mockReturnValueOnce(makeMockHttpFetch(validSongs))
    const directRes = await ytm.musicSearch.search('稻香', 1, 20)
    expect(directRes.list[0].songmid).toBe('vidDirect001')
    expect(mocks.httpFetch.mock.calls[0][1]).toMatchObject({ proxy: false })

    // 切换代理后不再复用直连缓存
    setYtmRuntimeContext({
      getAppSetting: () => ({ 'recommend.ytm.enable': true, 'recommend.ytm.proxy.enable': true, 'recommend.ytm.proxy.host': '127.0.0.1', 'recommend.ytm.proxy.port': '7890' }),
      getProxy: () => undefined,
    })
    mocks.httpFetch.mockReturnValueOnce(makeMockHttpFetch({ ok: true })) // 畸形 200 载荷
    await expect(ytm.musicSearch.search('稻香', 1, 20)).rejects.toBeInstanceOf(MusicSdkResponseError)
    expect(mocks.httpFetch.mock.calls[1][1]).toMatchObject({ proxy: { host: '127.0.0.1', port: 7890 } })

    // 地区受限 HTML 抛 YtmRegionBlockedError 并写入共享区域缓存
    mocks.httpFetch.mockReturnValueOnce(makeMockHttpFetch('<html><body>YouTube Music is not available in your area</body></html>'))
    await expect(ytm.musicSearch.search('七里香', 1, 20)).rejects.toBeInstanceOf(YtmRegionBlockedError)
    expect(sharedYtmRegionCache.get('dedicated:127.0.0.1:7890')).toBe(true)

    // 已有地区受限缓存时，收到带 responseContext 的无效/空壳 200 JSON 绝不抹除地区受限缓存
    mocks.httpFetch.mockReturnValueOnce(makeMockHttpFetch({ responseContext: {} }))
    await expect(ytm.musicSearch.search('空壳测试', 1, 20)).rejects.toBeInstanceOf(MusicSdkResponseError)
    expect(sharedYtmRegionCache.get('dedicated:127.0.0.1:7890')).toBe(true)

    // 真正解析出非空曲目后才将共享地区缓存更新为可达 (false)
    mocks.httpFetch.mockReturnValueOnce(makeMockHttpFetch(validSongs))
    const recoveredSearch = await ytm.musicSearch.search('恢复测试', 1, 30)
    expect(recoveredSearch.limit).toBe(20)
    expect(sharedYtmRegionCache.get('dedicated:127.0.0.1:7890')).toBe(false)
  })

  it('artist getSongList falls back to inlineTracks when topSongsBrowseId fails; playback/lyric/pic reject', async() => {
    const artistResp = {
      responseContext: {},
      header: { musicImmersiveHeaderRenderer: { title: { runs: [{ text: '周杰伦' }] } } },
      contents: {
        singleColumnBrowseResultsRenderer: {
          tabs: [{
            tabRenderer: {
              content: {
                sectionListRenderer: {
                  contents: [{
                    musicShelfRenderer: {
                      title: { runs: [{ text: '热门歌曲' }] },
                      bottomEndpoint: { browseEndpoint: { browseId: 'VLOLAK5uy_topfail' } },
                      contents: [makeTrackRow('vidInline001', '告白气球', '周杰伦')],
                    },
                  }],
                },
              },
            },
          }],
        },
      },
    }
    mocks.httpFetch
      .mockImplementationOnce(() => makeMockHttpFetch(artistResp))
      .mockImplementationOnce(() => ({ promise: Promise.reject(new Error('500')), cancelHttp: vi.fn() }))

    const res = await ytm.singer.getSongList('UCjay123', 1, 50)
    expect(res.list.map(item => item.songmid)).toEqual(['vidInline001'])

    // 降级预览为 ephemeral，不缓存；服务恢复后再次请求应拉取完整热门列表
    const fullTopResp = {
      responseContext: {},
      contents: {
        singleColumnBrowseResultsRenderer: {
          tabs: [{
            tabRenderer: {
              content: {
                sectionListRenderer: {
                  contents: [{
                    musicPlaylistShelfRenderer: {
                      contents: [
                        makeTrackRow('vidTop001', '稻香', '周杰伦'),
                        makeTrackRow('vidTop002', '晴天', '周杰伦'),
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
    mocks.httpFetch
      .mockImplementationOnce(() => makeMockHttpFetch(artistResp))
      .mockImplementationOnce(() => makeMockHttpFetch(fullTopResp))
    const recovered = await ytm.singer.getSongList('UCjay123', 1, 50)
    expect(recovered.list.map(item => item.songmid)).toEqual(['vidTop001', 'vidTop002'])

    mocks.httpFetch
      .mockImplementationOnce(() => makeMockHttpFetch(artistResp))
      .mockImplementationOnce(() => makeMockHttpFetch({
        responseContext: {},
        contents: { singleColumnBrowseResultsRenderer: { tabs: [{ tabRenderer: { content: { sectionListRenderer: { contents: [{ messageRenderer: {} }] } } } }] } },
      }))
    const malformedFallback = await ytm.singer.getSongList('UCjayMalformed', 1, 50)
    expect(malformedFallback.list.map(item => item.songmid)).toEqual(['vidInline001'])

    // 歌手主页返回内联曲目后，若热门全表返回地区受限 HTML，回退展示内联预览绝不可覆盖刚写入的地区受限缓存 true
    mocks.httpFetch
      .mockImplementationOnce(() => makeMockHttpFetch(artistResp))
      .mockImplementationOnce(() => makeMockHttpFetch('<html><body>YouTube Music is not available in your area</body></html>'))
    const regionFallback = await ytm.singer.getSongList('UCjayRegionBlocked', 1, 50)
    expect(regionFallback.list.map(item => item.songmid)).toEqual(['vidInline001'])
    expect(sharedYtmRegionCache.get('direct')).toBe(true)

    // 响应式歌单行仅在首列标题 run 提供 browseEndpoint 且带小写 vl 前缀时仍可被 parseYtmBrowsePlaylists 识别
    const responsivePlaylistBody = {
      responseContext: {},
      contents: {
        singleColumnBrowseResultsRenderer: {
          tabs: [{
            tabRenderer: {
              content: {
                sectionListRenderer: {
                  contents: [{
                    musicShelfRenderer: {
                      contents: [{
                        musicResponsiveListItemRenderer: {
                          flexColumns: [
                            {
                              musicResponsiveListItemFlexColumnRenderer: {
                                text: {
                                  runs: [{
                                    text: 'Title-Linked Playlist',
                                    navigationEndpoint: {
                                      browseEndpoint: {
                                        browseId: 'vlPLTitleRun0001',
                                        browseEndpointContextSupportedConfigs: {
                                          browseEndpointContextMusicConfig: { pageType: 'MUSIC_PAGE_TYPE_PLAYLIST' },
                                        },
                                      },
                                    },
                                  }],
                                },
                              },
                            },
                            { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: 'YouTube Music' }] } } },
                          ],
                        },
                      }],
                    },
                  }],
                },
              },
            },
          }],
        },
      },
    }
    const respPlaylists = parseYtmBrowsePlaylists(responsivePlaylistBody)
    expect(respPlaylists.list.map(p => p.id)).toEqual(['VLPLTitleRun0001'])
    expect(normalizeYtmPlaylistId('vlPLLowerCase01')).toBe('VLPLLowerCase01')

    // 专辑响应若缺少无标题主曲目栏、仅剩带标题的「其他版本/推荐歌曲」栏，绝不可冒充专辑曲目
    const albumWithRecOnly = {
      responseContext: {},
      header: { musicResponsiveHeaderRenderer: { title: { runs: [{ text: '叶惠美' }] } } },
      contents: {
        twoColumnBrowseResultsRenderer: {
          secondaryContents: {
            sectionListRenderer: {
              contents: [{
                musicShelfRenderer: {
                  title: { runs: [{ text: '推荐歌曲' }] },
                  contents: [makeTrackRow('vidOtherRec1', '别张专辑的歌', '周杰伦')],
                },
              }],
            },
          },
        },
      },
    }
    expect(parseYtmAlbumDetail(albumWithRecOnly, 'MPREb_test').hasValidContainer).toBe(false)

    // 200 错误壳降级预览同样为 ephemeral，不写长缓存；恢复后再次调用可拉取全表
    mocks.httpFetch
      .mockImplementationOnce(() => makeMockHttpFetch(artistResp))
      .mockImplementationOnce(() => makeMockHttpFetch(fullTopResp))
    const recoveredFromMalformed = await ytm.singer.getSongList('UCjayMalformed', 1, 50)
    expect(recoveredFromMalformed.list.map(item => item.songmid)).toEqual(['vidTop001', 'vidTop002'])
    expect(recoveredFromMalformed.list[0].types.map(t => t.type)).toEqual(['128k', '320k'])
  })

  it('album getAlbumDetail paginates continuations and backfills header artist/album/pic on page 2', async() => {
    const page1 = {
      responseContext: {},
      contents: {
        twoColumnBrowseResultsRenderer: {
          tabs: [{
            tabRenderer: {
              content: {
                sectionListRenderer: {
                  contents: [{
                    musicResponsiveHeaderRenderer: {
                      title: { runs: [{ text: '叶惠美' }] },
                      straplineTextOne: { runs: [{ text: '周杰伦', navigationEndpoint: { browseEndpoint: { browseId: 'UCjay123' } } }] },
                      thumbnail: { musicThumbnailRenderer: { thumbnail: { thumbnails: [{ url: 'https://img/yhm_cover.jpg' }] } } },
                    },
                  }],
                },
              },
            },
          }],
          secondaryContents: {
            sectionListRenderer: {
              contents: [{
                musicShelfRenderer: {
                  contents: [makeTrackRow('vidAlb01', '以父之名', '', '', '5:42')],
                  continuations: [{ nextContinuationData: { continuation: 'CONT_ALB_2' } }],
                },
              }],
            },
          },
        },
      },
    }
    const page2 = {
      responseContext: {},
      continuationContents: {
        musicShelfContinuation: {
          contents: [{
            musicResponsiveListItemRenderer: {
              playlistItemData: { videoId: 'vidAlb02' },
              flexColumns: [
                { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: '晴天', navigationEndpoint: { watchEndpoint: { videoId: 'vidAlb02' } } }] } } },
                { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [] } } },
              ],
              fixedColumns: [{ musicResponsiveListItemFixedColumnRenderer: { text: { runs: [{ text: '4:29' }] } } }],
            },
          }],
        },
      },
    }
    mocks.httpFetch
      .mockReturnValueOnce(makeMockHttpFetch(page1))
      .mockReturnValueOnce(makeMockHttpFetch(page2))

    const res = await ytm.album.getAlbumDetail('MPREb_yhm', 1, 50)
    expect(res.list).toHaveLength(2)
    expect(res.list[1]).toMatchObject({
      songmid: 'vidAlb02',
      name: '晴天',
      singer: '周杰伦',
      albumName: '叶惠美',
      img: 'https://img/yhm_cover.jpg',
    })
  })

  it('songList.getList prioritizes charts sort over tagId, and marks partial failures as ephemeral / partialFailure', async() => {
    const chartResp = {
      responseContext: {},
      contents: {
        singleColumnBrowseResultsRenderer: {
          tabs: [{
            tabRenderer: {
              content: {
                sectionListRenderer: {
                  contents: [{
                    musicCarouselShelfRenderer: {
                      contents: [{
                        musicTwoRowItemRenderer: {
                          title: { runs: [{ text: '本地热榜' }] },
                          navigationEndpoint: { browseEndpoint: { browseId: 'VLPLlocalChart1' } },
                        },
                      }],
                    },
                  }],
                },
              },
            },
          }],
        },
      },
    }
    // sortId='charts' 且带残留 tagId → 仍请求 FEmusic_charts；若全球榜 500 失败则不缓存残缺流
    mocks.httpFetch
      .mockImplementationOnce(() => makeMockHttpFetch(chartResp))
      .mockImplementationOnce(() => ({ promise: Promise.reject(new Error('global 500')), cancelHttp: vi.fn() }))

    const partialCharts = await ytm.songList.getList('charts', 'staleMoodTag', 1)
    expect(partialCharts.list.map(i => i.id)).toEqual(['VLPLlocalChart1'])
    expect(mocks.httpFetch.mock.calls[0][1].body).toMatchObject({ browseId: 'FEmusic_charts' })

    // 再次请求时因前次为 ephemeral，会重新拉取
    mocks.httpFetch
      .mockImplementationOnce(() => makeMockHttpFetch(chartResp))
      .mockImplementationOnce(() => makeMockHttpFetch(chartResp))
    await ytm.songList.getList('charts', 'staleMoodTag', 1)
    expect(mocks.httpFetch).toHaveBeenCalledTimes(4)

    // songList.search 双分支一侧失败返回 partialFailure=true 且不持久化残缺缓存
    const commResp = {
      responseContext: {},
      contents: {
        tabbedSearchResultsRenderer: {
          tabs: [{
            tabRenderer: {
              content: {
                sectionListRenderer: {
                  contents: [{
                    musicShelfRenderer: {
                      contents: [{
                        musicResponsiveListItemRenderer: {
                          navigationEndpoint: { browseEndpoint: { browseId: 'VLPLcomm123456' } },
                          flexColumns: [
                            { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: '社区歌单' }] } } },
                            { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: 'User' }] } } },
                          ],
                        },
                      }],
                    },
                  }],
                },
              },
            },
          }],
        },
      },
    }
    mocks.httpFetch
      .mockImplementationOnce(() => makeMockHttpFetch(commResp))
      .mockImplementationOnce(() => ({ promise: Promise.reject(new Error('featured 503')), cancelHttp: vi.fn() }))
    const partialSearch = await ytm.songList.search('华语', 1, 18)
    expect(partialSearch.list.map(i => i.id)).toEqual(['VLPLcomm123456'])
    expect(partialSearch.partialFailure).toBe(true)

    // leaderboard.getBoards 一侧失败暴露 partial=true
    mocks.httpFetch
      .mockImplementationOnce(() => makeMockHttpFetch(chartResp))
      .mockImplementationOnce(() => ({ promise: Promise.reject(new Error('global 503')), cancelHttp: vi.fn() }))
    const partialBoards = await ytm.leaderboard.getBoards()
    expect(partialBoards.list).toHaveLength(1)
    expect(partialBoards.partial).toBe(true)
  })

  it('first-class YTM parity: player direct streams (ANDROID itag 18 primary, verified IOS fallback, open-range probe, PO-token cache guard), timed/untimed lyrics, pic, hotSearch, tipSearch, simiSong', async() => {
    // 1. googlevideo 签名直链过期与旧版无 pot 自适应 403 缓存自愈判断（含提前 5 分钟缓冲）
    const nowMs = 1_700_000_000_000
    const nowSec = Math.floor(nowMs / 1000)
    expect(isYtmStreamUrlExpired('https://cdn.example.com/song.mp3', nowMs)).toBe(false)
    expect(isYtmStreamUrlExpired('https://rr1---sn-test.googlevideo.com/videoplayback?itag=140', nowMs)).toBe(true)
    expect(isYtmStreamUrlExpired(`https://rr1---sn-test.googlevideo.com/videoplayback?expire=${nowSec + 120}`, nowMs)).toBe(true)
    expect(isYtmStreamUrlExpired(`https://rr1---sn-test.googlevideo.com/videoplayback?expire=${nowSec + 3600}`, nowMs)).toBe(false)
    // 无 pot 的 IOS/ANDROID 非渐进式音频流（itag 140/251）开放 Range 会返回 403，必须自动视为失效
    expect(isYtmStreamUrlExpired(`https://rr1---sn-test.googlevideo.com/videoplayback?c=IOS&itag=251&expire=${nowSec + 3600}`, nowMs)).toBe(true)
    expect(isYtmStreamUrlExpired(`https://rr1---sn-test.googlevideo.com/videoplayback?c=ANDROID&itag=140&expire=${nowSec + 3600}`, nowMs)).toBe(true)
    // ANDROID 渐进式 itag 18 与带有效 pot 的流在有效期内保持有效
    expect(isYtmStreamUrlExpired(`https://rr1---sn-test.googlevideo.com/videoplayback?c=ANDROID&itag=18&expire=${nowSec + 3600}`, nowMs)).toBe(false)
    expect(isYtmStreamUrlExpired(`https://rr1---sn-test.googlevideo.com/videoplayback?c=IOS&itag=251&pot=token123&expire=${nowSec + 3600}`, nowMs)).toBe(false)

    // 2. 流提取与择优：渐进式 itag 18 (video/mp4+mp4a) 识别为 MP4/m4a；preferProgressive 锁定 itag 18；preferMp4 拒绝纯 webm
    const sampleFormats = [
      { url: 'https://rr1.googlevideo.com/prog18', itag: 18, mimeType: 'video/mp4; codecs="avc1.42001E, mp4a.40.2"', bitrate: 154_000, contentLength: 4_000_000, isProgressive: true },
      { url: 'https://rr1.googlevideo.com/aac140', itag: 140, mimeType: 'audio/mp4; codecs="mp4a.40.2"', bitrate: 130_000, contentLength: 3_000_000, isProgressive: false },
      { url: 'https://rr1.googlevideo.com/opus251', itag: 251, mimeType: 'audio/webm; codecs="opus"', bitrate: 162_000, contentLength: 3_500_000, isProgressive: false },
    ]
    expect(selectYtmAudioStream(sampleFormats, '320k', { preferProgressive: true })).toMatchObject({ url: 'https://rr1.googlevideo.com/prog18', type: '320k', itag: 18, ext: 'm4a' })
    expect(selectYtmAudioStream(sampleFormats, '320k', { preferMp4: true, preferProgressive: true })).toMatchObject({ url: 'https://rr1.googlevideo.com/prog18', type: '320k', itag: 18, ext: 'm4a' })
    expect(selectYtmAudioStream(sampleFormats, '128k')).toMatchObject({ url: 'https://rr1.googlevideo.com/aac140', type: '128k', ext: 'm4a' })
    expect(selectYtmAudioStream(sampleFormats, '320k')).toMatchObject({ url: 'https://rr1.googlevideo.com/opus251', type: '320k', ext: 'webm' })
    expect(selectYtmAudioStream(sampleFormats, '320k', { preferMp4: true })).toMatchObject({ url: 'https://rr1.googlevideo.com/aac140', type: '320k', ext: 'm4a' })
    expect(selectYtmAudioStream([sampleFormats[0]], '320k', { preferMp4: true })).toMatchObject({ url: 'https://rr1.googlevideo.com/prog18', type: '320k', ext: 'm4a' })
    expect(selectYtmAudioStream([sampleFormats[2]], '320k', { preferMp4: true })).toBeNull()
    expect(extractYtmAudioFormats({
      streamingData: {
        formats: [{ itag: 18, url: 'https://rr1.googlevideo.com/p18', mimeType: 'video/mp4; codecs="avc1.42001E, mp4a.40.2"', bitrate: 150_000 }],
        adaptiveFormats: [{ itag: 137, url: 'https://rr1.googlevideo.com/v137', mimeType: 'video/mp4; codecs="avc1.640028"', bitrate: 2_000_000 }],
      },
    })).toHaveLength(1)

    // 3. getMusicUrl：主路径 ANDROID 失败时回退 ANDROID_FALLBACK 获取渐进式 itag 18（无须额外探针）
    const androidProgressiveOk = {
      responseContext: {},
      playabilityStatus: { status: 'OK' },
      streamingData: {
        formats: [
          { itag: 18, url: 'https://rr1.googlevideo.com/videoplayback?c=ANDROID&itag=18&expire=2999999999', mimeType: 'video/mp4; codecs="avc1.42001E, mp4a.40.2"', bitrate: 154_000, audioChannels: 2 },
        ],
        adaptiveFormats: [
          { itag: 140, url: 'https://rr1.googlevideo.com/videoplayback?c=ANDROID&itag=140&expire=2999999999', mimeType: 'audio/mp4; codecs="mp4a.40.2"', bitrate: 130_000 },
        ],
      },
      videoDetails: {
        thumbnail: {
          thumbnails: [
            { url: 'https://i.ytimg.com/small.jpg', width: 120 },
            { url: 'https://i.ytimg.com/maxres.jpg', width: 1280 },
          ],
        },
      },
    }
    const probeSpy = vi.fn(() => ({ promise: Promise.resolve({ ok: true, statusCode: 206 }), cancel: vi.fn() }))
    mocks.httpFetch
      .mockImplementationOnce(() => makeMockHttpFetch({ responseContext: {}, playabilityStatus: { status: 'UNPLAYABLE', reason: 'transient' } }))
      .mockImplementationOnce(() => makeMockHttpFetch(androidProgressiveOk))
    const stream = await ytm.getMusicUrl({ songmid: 'dQw4w9WgXcQ' }, '320k', { probeStreamUrl: probeSpy }).promise
    expect(stream).toMatchObject({
      type: '320k',
      url: 'https://rr1.googlevideo.com/videoplayback?c=ANDROID&itag=18&expire=2999999999',
      ext: 'm4a',
    })
    expect(probeSpy).not.toHaveBeenCalled()

    // 3b. 当两个 ANDROID 均无渐进式流（即便 adaptiveFormats 含 140/251 也绝不未验直接返回）而落入 IOS_VERIFIED 时，
    // 强制执行开放 Range 探针：403 必须干净拒绝，绝不把 403 坏链交给播放器
    const adaptiveOnlyPayload = {
      responseContext: {},
      playabilityStatus: { status: 'OK' },
      streamingData: {
        formats: [],
        adaptiveFormats: [
          { itag: 140, url: 'https://rr1.googlevideo.com/videoplayback?c=ANDROID&itag=140&expire=2999999999', mimeType: 'audio/mp4; codecs="mp4a.40.2"', bitrate: 130_000 },
          { itag: 251, url: 'https://rr1.googlevideo.com/videoplayback?c=ANDROID&itag=251&expire=2999999999', mimeType: 'audio/webm; codecs="opus"', bitrate: 160_000 },
        ],
      },
    }
    const iosAdaptiveOnly = {
      responseContext: {},
      playabilityStatus: { status: 'OK' },
      streamingData: {
        adaptiveFormats: [
          { itag: 140, url: 'https://rr1.googlevideo.com/videoplayback?c=IOS&itag=140&expire=2999999999', mimeType: 'audio/mp4; codecs="mp4a.40.2"', bitrate: 130_000 },
          { itag: 251, url: 'https://rr1.googlevideo.com/videoplayback?c=IOS&itag=251&expire=2999999999', mimeType: 'audio/webm; codecs="opus"', bitrate: 160_000 },
        ],
      },
    }
    const probe403 = vi.fn(() => ({ promise: Promise.resolve({ ok: false, statusCode: 403, reason: 'HTTP 403' }), cancel: vi.fn() }))
    mocks.httpFetch
      .mockImplementationOnce(() => makeMockHttpFetch(adaptiveOnlyPayload))
      .mockImplementationOnce(() => makeMockHttpFetch(adaptiveOnlyPayload))
      .mockImplementationOnce(() => makeMockHttpFetch(iosAdaptiveOnly))
    await expect(ytm.getMusicUrl({ songmid: 'dQw4w9WgXcQ' }, '320k', { probeStreamUrl: probe403 }).promise).rejects.toThrow(/HTTP 403/)
    expect(probe403).toHaveBeenCalledTimes(1)

    // 3c. verifyOpenRange=true（刷新重试路径）遇 403 沿 ANDROID -> ANDROID_FALLBACK -> IOS_VERIFIED 级联探测，命中 206 才放行；并验证探针阶段 cancelHttp
    const probeCascade = vi.fn()
      .mockImplementationOnce(() => ({ promise: Promise.resolve({ ok: false, statusCode: 403, reason: 'HTTP 403' }), cancel: vi.fn() }))
      .mockImplementationOnce(() => ({ promise: Promise.resolve({ ok: false, statusCode: 403, reason: 'HTTP 403' }), cancel: vi.fn() }))
      .mockImplementationOnce(() => ({ promise: Promise.resolve({ ok: true, statusCode: 206 }), cancel: vi.fn() }))
    mocks.httpFetch
      .mockImplementationOnce(() => makeMockHttpFetch(androidProgressiveOk))
      .mockImplementationOnce(() => makeMockHttpFetch(androidProgressiveOk))
      .mockImplementationOnce(() => makeMockHttpFetch(iosAdaptiveOnly))
    const cascaded = await ytm.getMusicUrl({ songmid: 'dQw4w9WgXcQ' }, '128k', { verifyOpenRange: true, probeStreamUrl: probeCascade }).promise
    expect(cascaded).toMatchObject({ type: '128k', url: 'https://rr1.googlevideo.com/videoplayback?c=IOS&itag=140&expire=2999999999', ext: 'm4a' })
    expect(probeCascade).toHaveBeenCalledTimes(3)

    let cancelProbeSpy = vi.fn()
    let rejectProbe!: (e: Error) => void
    let notifyProbeStarted!: () => void
    const probeStarted = new Promise<void>(resolve => { notifyProbeStarted = resolve })
    mocks.httpFetch.mockImplementationOnce(() => makeMockHttpFetch(androidProgressiveOk))
    const cancellable = ytm.getMusicUrl({ songmid: 'dQw4w9WgXcQ' }, '128k', {
      verifyOpenRange: true,
      probeStreamUrl: () => {
        notifyProbeStarted()
        return {
          promise: new Promise((_resolve, reject) => { rejectProbe = reject }),
          cancel: () => {
            cancelProbeSpy()
            rejectProbe(new Error('request cancelled'))
          },
        }
      },
    })
    await probeStarted
    cancellable.cancelHttp()
    expect(cancelProbeSpy).toHaveBeenCalledTimes(1)
    await expect(cancellable.promise).rejects.toThrow(/cancelled/i)
    await expect(ytm.getMusicUrl({ songmid: 'bad' }, '128k').promise).rejects.toThrow(/invalid/i)

    // 4. getPic 主客户端失败时回退下一客户端仍返回最高分辨率缩略图；getMusicDetailPageUrl 返回规范观看链接
    mocks.httpFetch
      .mockImplementationOnce(() => ({ promise: Promise.reject(new Error('android transient')), cancelHttp: vi.fn() }))
      .mockImplementationOnce(() => makeMockHttpFetch(androidProgressiveOk))
    expect(await ytm.getPic({ songmid: 'dQw4w9WgXcQ' })).toBe('https://i.ytimg.com/maxres.jpg')
    expect(ytm.getMusicDetailPageUrl({ songmid: 'dQw4w9WgXcQ' })).toBe('https://music.youtube.com/watch?v=dQw4w9WgXcQ')

    // 5. getLyric：优先 ANDROID_MUSIC 同步时间轴歌词，失败时回退 WEB_REMIX 纯文本 untimedLyric
    expect(formatLrcTimestamp(65_430)).toBe('[01:05.43]')
    const nextWithLyricTab = {
      responseContext: {},
      contents: {
        singleColumnMusicWatchNextResultsRenderer: {
          tabbedRenderer: {
            watchNextTabbedResultsRenderer: {
              tabs: [{ tabRenderer: { endpoint: { browseEndpoint: { browseId: 'MPLYt_test123' } } } }],
            },
          },
        },
      },
    }
    const timedBrowse = {
      responseContext: {},
      contents: {
        elementRenderer: {
          newElement: {
            type: {
              componentType: {
                model: {
                  timedLyricsModel: {
                    lyricsData: {
                      timedLyricsData: [
                        { lyricLine: '第一句歌词', cueRange: { startTimeMilliseconds: '12340' } },
                        { lyricLine: '第二句歌词', cueRange: { startTimeMilliseconds: '65430' } },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    }
    mocks.httpFetch
      .mockImplementationOnce(() => makeMockHttpFetch(nextWithLyricTab))
      .mockImplementationOnce(() => makeMockHttpFetch(timedBrowse))
    const timedLyric = await ytm.getLyric({ songmid: 'dQw4w9WgXcQ' }).promise
    expect(timedLyric.lyric).toBe('[00:12.34]第一句歌词\n[01:05.43]第二句歌词')

    const plainBrowse = {
      responseContext: {},
      contents: {
        sectionListRenderer: {
          contents: [{
            musicDescriptionShelfRenderer: {
              description: { runs: [{ text: 'Line One\nLine Two' }] },
            },
          }],
        },
      },
    }
    mocks.httpFetch
      .mockImplementationOnce(() => makeMockHttpFetch(nextWithLyricTab))
      .mockImplementationOnce(() => ({ promise: Promise.reject(new Error('android_music 500')), cancelHttp: vi.fn() }))
      .mockImplementationOnce(() => makeMockHttpFetch(plainBrowse))
    const plainLyric = await ytm.getLyric({ songmid: 'dQw4w9WgXcQ' }).promise
    expect(plainLyric.lyric).toBe('')
    expect(plainLyric.untimedLyric).toBe('[00:00.00]Line One\n[00:00.00]Line Two')

    // 6. hotSearch / tipSearch / simiSong
    const chartsForHot = {
      responseContext: {},
      contents: {
        singleColumnBrowseResultsRenderer: {
          tabs: [{
            tabRenderer: {
              content: {
                sectionListRenderer: {
                  contents: [{
                    musicCarouselShelfRenderer: {
                      contents: [
                        makeTrackRow('vidHot001', 'APT.', 'ROSÉ'),
                        makeTrackRow('vidHot002', '晴天', '周杰伦'),
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
    mocks.httpFetch.mockImplementationOnce(() => makeMockHttpFetch(chartsForHot))
    const hot = await ytm.hotSearch.getList()
    expect(hot.source).toBe('ytm')
    expect(hot.list).toEqual(['APT.', '晴天'])

    const suggestBody = {
      responseContext: {},
      contents: [{
        searchSuggestionsSectionRenderer: {
          contents: [{
            searchSuggestionRenderer: {
              suggestion: { runs: [{ text: '周杰伦' }, { text: ' 晴天' }] },
            },
          }, {
            searchSuggestionRenderer: {
              navigationEndpoint: { searchEndpoint: { query: '周杰伦 七里香' } },
            },
          }],
        },
      }],
    }
    mocks.httpFetch.mockImplementationOnce(() => makeMockHttpFetch(suggestBody))
    const tips = await ytm.tipSearch.search('周杰伦')
    expect(tips).toEqual(['周杰伦 晴天', '周杰伦 七里香'])

    const radioNextBody = {
      responseContext: {},
      contents: {
        singleColumnMusicWatchNextResultsRenderer: {
          tabbedRenderer: {
            watchNextTabbedResultsRenderer: {
              tabs: [{
                tabRenderer: {
                  content: {
                    musicQueueRenderer: {
                      content: {
                        playlistPanelRenderer: {
                          contents: [{
                            playlistPanelVideoRenderer: {
                              videoId: 'vidSimi01',
                              title: { runs: [{ text: '七里香' }] },
                              longBylineText: { runs: [{ text: '周杰伦' }] },
                              lengthText: { runs: [{ text: '4:59' }] },
                            },
                          }],
                        },
                      },
                    },
                  },
                },
              }],
            },
          },
        },
      },
    }
    mocks.httpFetch.mockImplementationOnce(() => makeMockHttpFetch(radioNextBody))
    const simi = await ytm.simiSong.getSimiSong('dQw4w9WgXcQ')
    expect(simi.source).toBe('ytm')
    expect(simi.list).toHaveLength(1)
    expect(simi.list[0]).toMatchObject({ songmid: 'vidSimi01', name: '七里香', singer: '周杰伦' })
    expect(simi.list[0].types.map(t => t.type)).toEqual(['128k', '320k'])

    // 7. songList / leaderboard 详情页链接与热搜并发取代竞态保护
    expect(ytm.songList.getDetailPageUrl('VLPLtest123')).toBe('https://music.youtube.com/playlist?list=PLtest123')
    expect(ytm.leaderboard.getDetailPageUrl('ytm__VLPLchart99')).toBe('https://music.youtube.com/playlist?list=PLchart99')

    let resolveFirstHot!: (v: any) => void
    const cancelFirst = vi.fn()
    const cancelSecond = vi.fn()
    const callsBeforeHotRace = mocks.httpFetch.mock.calls.length
    mocks.httpFetch
      .mockImplementationOnce(() => ({ promise: new Promise(resolve => { resolveFirstHot = resolve }), cancelHttp: cancelFirst }))
      .mockImplementationOnce(() => ({ ...makeMockHttpFetch(chartsForHot), cancelHttp: cancelSecond }))
    const hot1 = ytm.hotSearch.getList()
    const hot2 = ytm.hotSearch.getList()
    expect(cancelFirst).toHaveBeenCalledTimes(1)
    resolveFirstHot({ statusCode: 200, body: { responseContext: {} } })
    await expect(hot1).rejects.toThrow(/cancelled/i)
    await expect(hot2).resolves.toMatchObject({ source: 'ytm', list: ['APT.', '晴天'] })
    expect(mocks.httpFetch).toHaveBeenCalledTimes(callsBeforeHotRace + 2)
  })

  it('probeYtmOpenRangeStream verifies Range: bytes=0- (206 ok, 403/0-len/text-html reject, 302 redirect/limit, in-flight cancel, deadline timeout)', async() => {
    const receivedRanges: string[] = []
    const timers: NodeJS.Timeout[] = []
    let onSlowArrived: (() => void) | null = null
    const server = http.createServer((req, res) => {
      receivedRanges.push(String(req.headers.range ?? ''))
      if (req.url === '/ok206') {
        res.writeHead(206, { 'Content-Type': 'video/mp4', 'Content-Length': '102400' })
        res.end('x'.repeat(64))
      } else if (req.url === '/deny403') {
        res.writeHead(403, { 'Content-Type': 'text/plain', 'Content-Length': '0' })
        res.end()
      } else if (req.url === '/empty200') {
        res.writeHead(200, { 'Content-Type': 'video/mp4', 'Content-Length': '0' })
        res.end()
      } else if (req.url === '/html200') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': '128' })
        res.end('<html>blocked</html>')
      } else if (req.url === '/redir') {
        res.writeHead(302, { Location: '/ok206' })
        res.end()
      } else if (req.url === '/redir-loop') {
        res.writeHead(302, { Location: '/redir-loop' })
        res.end()
      } else if (req.url === '/redir-slow') {
        res.writeHead(302, { Location: '/slow' })
        res.end()
      } else if (req.url === '/slow') {
        onSlowArrived?.()
        onSlowArrived = null
        timers.push(setTimeout(() => {
          if (!res.writableEnded) {
            res.writeHead(200, { 'Content-Type': 'video/mp4', 'Content-Length': '1024' })
            res.end()
          }
        }, 5000))
      } else {
        res.writeHead(404)
        res.end()
      }
    })
    await new Promise<void>(resolve => { server.listen(0, '127.0.0.1', resolve) })
    const addr = server.address() as { port: number }
    const base = `http://127.0.0.1:${addr.port}`
    try {
      expect(await probeYtmOpenRangeStream(`${base}/ok206`, false, 3000).promise).toMatchObject({ ok: true, statusCode: 206 })
      expect(await probeYtmOpenRangeStream(`${base}/deny403`, false, 3000).promise).toMatchObject({ ok: false, statusCode: 403 })
      expect(await probeYtmOpenRangeStream(`${base}/empty200`, false, 3000).promise).toMatchObject({ ok: false, statusCode: 200, reason: 'empty response (HTTP 200)' })
      expect(await probeYtmOpenRangeStream(`${base}/html200`, false, 3000).promise).toMatchObject({ ok: false, statusCode: 200 })
      expect(await probeYtmOpenRangeStream(`${base}/redir`, false, 3000).promise).toMatchObject({ ok: true, statusCode: 206 })
      expect(await probeYtmOpenRangeStream(`${base}/redir-loop`, false, 3000).promise).toMatchObject({ ok: false, reason: 'too many redirects' })

      // 真正在途取消（经 302 到达 /slow 后取消）
      const slowArrived = new Promise<void>(resolve => { onSlowArrived = resolve })
      const slowProbe = probeYtmOpenRangeStream(`${base}/redir-slow`, false, 3000)
      await slowArrived
      slowProbe.cancel()
      await expect(slowProbe.promise).rejects.toThrow(/cancelled/i)

      // 整链共享 deadline 超时
      const timeoutRes = await probeYtmOpenRangeStream(`${base}/slow`, false, 150).promise
      expect(timeoutRes).toMatchObject({ ok: false, reason: 'probe timeout' })

      expect(receivedRanges.every(r => r === 'bytes=0-')).toBe(true)
    } finally {
      for (const t of timers) clearTimeout(t)
      await new Promise<void>(resolve => { server.close(() => { resolve() }) })
    }
  })
})
