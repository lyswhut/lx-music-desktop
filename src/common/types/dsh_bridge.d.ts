// DSH Bridge：仅供 DSH 插件（dsh-music-dj）通过本地回环 HTTP 接口联动使用，
// 与官方 LX Music 无关。详细说明见 docs/DSH_BRIDGE.md。
declare namespace LX {
  namespace DshBridge {
    type Action = 'search' | 'play' | 'searchPlay'

    /**
     * 与 LX Music 自身 `music/play` deeplink 接受的 musicInfo 保持一致（旧版字段命名），
     * 不同源还会带有 hash / strMediaMid / copyrightId 等源特有字段。
     */
    interface MusicInfo {
      name: string
      singer: string
      source: LX.OnlineSource
      songmid: string | number
      types: LX.Music.MusicQualityType[]
      albumName?: string
      albumId?: string | number
      interval?: string
      img?: string | null
      hash?: string
      albumAudioId?: string
      strMediaMid?: string
      albumMid?: string
      copyrightId?: string | number
      lrcUrl?: string
      trcUrl?: string
      mrcUrl?: string
      [key: string]: any
    }

    interface RequestParams {
      // search
      keywords?: string
      source?: LX.OnlineSource | 'all'
      limit?: number
      // play
      data?: MusicInfo
      // searchPlay
      name?: string
      singer?: string
    }

    /** main -> renderer 的请求 */
    interface Request {
      id: string
      action: Action
      params: RequestParams
    }

    /** renderer -> main 的响应 */
    interface Response<T = any> {
      id: string
      ok: boolean
      data?: T
      code?: string
      error?: string
    }

    /** /dsh/search 返回的候选项 */
    interface SearchItem {
      source: LX.OnlineSource
      songmid: string | number
      name: string
      singer: string
      albumName: string
      interval: string
      img: string | null
      types: LX.Music.MusicQualityType[]
      /** 搜索源返回的完整 musicInfo，可直接回传给 /dsh/play 的 data */
      raw: MusicInfo
    }
  }
}
