export const URL_SCHEME_RXP = /^lxmusic:\/\//


export const STORE_NAMES = {
  APP_SETTINGS: 'config_v2',
  DATA: 'data',
  SYNC: 'sync',
  HOTKEY: 'hot_key',
  USER_API: 'user_api',
  LRC_RAW: 'lyrics',
  LRC_EDITED: 'lyrics_edited',
  THEME: 'theme',
} as const

export const APP_EVENT_NAMES = {
  winMainName: 'win_main',
  winLyricName: 'win_lyric',
  trayName: 'tray',
} as const

export const LIST_IDS = {
  DEFAULT: 'default',
  LOVE: 'love',
  TEMP: 'temp',
  DOWNLOAD: 'download',
} as const

export const DATA_KEYS = {
  viewPrevState: 'viewPrevState',
  playInfo: 'playInfo',
  searchHistoryList: 'searchHistoryList',
  listScrollPosition: 'listScrollPosition',
  listPrevSelectId: 'listPrevSelectId',
  listUpdateInfo: 'listUpdateInfo',
  ignoreVersion: 'ignoreVersion',

  leaderboardSetting: 'leaderboardSetting',
  songListSetting: 'songListSetting',
  searchSetting: 'searchSetting',
} as const

export const DEFAULT_SETTING = {
  leaderboard: {
    source: 'kw',
    boardId: 'kw__16',
  },

  songList: {
    source: 'kg',
    sortId: '5',
    tagId: '',
  },

  search: {
    temp_source: 'kw',
    source: 'all',
    type: 'music',
  },

  viewPrevState: {
    url: '/search',
    query: {},
  },
}

export const DOWNLOAD_STATUS = {
  RUN: 'run',
  WAITING: 'waiting',
  PAUSE: 'pause',
  ERROR: 'error',
  COMPLETED: 'completed',
} as const

export const QUALITYS = ['flac24bit', 'flac', 'wav', 'ape', '320k', '192k', '128k'] as const
