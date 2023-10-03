declare namespace LX {
  namespace DBService {

    interface MusicInfo {
      id: string
      listId: string
      name: string
      singer: string
      interval: string | null
      source: LX.Music.MusicInfo['source']
      meta: string
      order: number
    }

    interface MusicInfoOrder {
      listId: string
      musicInfoId: string
      order: number
    }

    interface MusicInfoQuery {
      listId: string
    }

    interface MusicInfoRemove {
      listId: string
      id: string
    }

    interface ListMusicInfoQuery {
      listId: string
      musicInfoId: string
    }

    interface UserListInfo {
      id: string
      name: string
      source?: LX.OnlineSource
      sourceListId?: string
      position: number
      locationUpdateTime: number | null
    }

    type Lyricnfo = {
      id: string
      type: 'lyric'
      text: string
      source: 'raw' | 'edited'
    } | {
      id: string
      type: keyof Omit<LX.Music.LyricInfo, 'lyric'>
      text: string | null
      source: 'raw' | 'edited'
    }

    interface MusicUrlInfo {
      id: string
      url: string
    }

    interface DownloadMusicInfo {
      id: string
      isComplate: 0 | 1
      status: LX.Download.DownloadTaskStatus
      statusText: string
      progress_downloaded: number
      progress_total: number
      url: string | null
      quality: LX.Quality
      ext: LX.Download.FileExt
      fileName: string
      filePath: string
      musicInfo: string
      position: number
    }

    interface DislikeInfo {
      // type: 'music'
      content: string
      // meta: string | null
    }

    interface MusicInfoOtherSource extends Omit<MusicInfoOnline, 'listId'> {
      source_id: string
      order: number
    }

  }
}
