declare namespace LX {
  namespace List {
    interface UserListInfo {
      id: string
      name: string
      // list: LX.Music.MusicInfo[]
      source?: LX.OnlineSource
      sourceListId?: string
      // position?: number
      locationUpdateTime: number | null
    }

    interface MyDefaultListInfo {
      id: 'default'
      name: 'list__name_default'
      // name: '试听列表'
      // list: LX.Music.MusicInfo[]
    }

    interface MyLoveListInfo {
      id: 'love'
      name: 'list__name_love'
      // name: '我的收藏'
      // list: LX.Music.MusicInfo[]
    }

    interface MyTempListInfo {
      id: 'temp'
      name: '临时列表'
      // list: LX.Music.MusicInfo[]
      // TODO: save default lists info
      meta: {
        id?: string
      }
    }

    type MyListInfo = MyDefaultListInfo | MyLoveListInfo | UserListInfo

    interface MyAllList {
      defaultList: MyDefaultListInfo
      loveList: MyLoveListInfo
      userList: UserListInfo[]
      tempList: MyTempListInfo
    }


    type SearchHistoryList = string[]
    type ListPositionInfo = Record<string, number>
    type ListUpdateInfo = Record<string, {
      updateTime: number
      isAutoUpdate: boolean
    }>

    type ListSaveType = 'myList' | 'downloadList'
    type ListSaveInfo = {
      type: 'myList'
      data: Partial<MyAllList>
    } | {
      type: 'downloadList'
      data: LX.Download.ListItem[]
    }


    type ListActionDataOverwrite = MakeOptional<LX.List.ListDataFull, 'tempList'>
    interface ListActionAdd {
      position: number
      listInfos: UserListInfo[]
    }
    type ListActionRemove = string[]
    type ListActionUpdate = UserListInfo[]
    interface ListActionUpdatePosition {
      /**
       * 列表id
       */
      ids: string[]
      /**
       * 位置
       */
      position: number
    }

    interface ListActionMusicAdd {
      id: string
      musicInfos: LX.Music.MusicInfo[]
      addMusicLocationType: LX.AddMusicLocationType
    }

    interface ListActionMusicMove {
      fromId: string
      toId: string
      musicInfos: LX.Music.MusicInfo[]
      addMusicLocationType: LX.AddMusicLocationType
    }

    interface ListActionCheckMusicExistList {
      listId: string
      musicInfoId: string
    }

    interface ListActionMusicRemove {
      listId: string
      ids: string[]
    }

    type ListActionMusicUpdate = Array<{
      id: string
      musicInfo: LX.Music.MusicInfo
    }>

    interface ListActionMusicUpdatePosition {
      listId: string
      position: number
      ids: string[]
    }

    interface ListActionMusicOverwrite {
      listId: string
      musicInfos: LX.Music.MusicInfo[]
    }

    type ListActionMusicClear = string[]

    interface MyDefaultListInfoFull extends MyDefaultListInfo {
      list: LX.Music.MusicInfo[]
    }
    interface MyLoveListInfoFull extends MyLoveListInfo {
      list: LX.Music.MusicInfo[]
    }
    interface UserListInfoFull extends UserListInfo {
      list: LX.Music.MusicInfo[]
    }
    interface MyTempListInfoFull extends MyTempListInfo {
      list: LX.Music.MusicInfo[]
    }

    interface ListDataFull {
      defaultList: LX.Music.MusicInfo[]
      loveList: LX.Music.MusicInfo[]
      userList: UserListInfoFull[]
      tempList: LX.Music.MusicInfo[]
    }
  }
}
