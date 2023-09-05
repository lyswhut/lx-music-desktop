export const ENV_PARAMS = [
  'PORT',
  'BIND_IP',
  'CONFIG_PATH',
  'LOG_PATH',
  'DATA_PATH',
  'PROXY_HEADER',
  'MAX_SNAPSHOT_NUM',
  'LIST_ADD_MUSIC_LOCATION_TYPE',
  'LX_USER_',
] as const


export const LIST_IDS = {
  DEFAULT: 'default',
  LOVE: 'love',
  TEMP: 'temp',
  DOWNLOAD: 'download',
  PLAY_LATER: null,
} as const

export const SYNC_CODE = {
  helloMsg: 'Hello~::^-^::~v4~',
  idPrefix: 'OjppZDo6',
  authMsg: 'lx-music auth::',
  msgAuthFailed: 'Auth failed',
  msgBlockedIp: 'Blocked IP',
  msgConnect: 'lx-music connect',


  authFailed: 'Auth failed',
  missingAuthCode: 'Missing auth code',
  getServiceIdFailed: 'Get service id failed',
  connectServiceFailed: 'Connect service failed',
  connecting: 'Connecting...',
  unknownServiceAddress: 'Unknown service address',
} as const

export const SYNC_CLOSE_CODE = {
  normal: 1000,
  failed: 4100,
} as const

export const TRANS_MODE: Readonly<Record<LX.Sync.List.SyncMode, LX.Sync.List.SyncMode>> = {
  merge_local_remote: 'merge_remote_local',
  merge_remote_local: 'merge_local_remote',
  overwrite_local_remote: 'overwrite_remote_local',
  overwrite_remote_local: 'overwrite_local_remote',
  overwrite_local_remote_full: 'overwrite_remote_local_full',
  overwrite_remote_local_full: 'overwrite_local_remote_full',
  cancel: 'cancel',
} as const

export const File = {
  serverDataPath: 'sync/server',
  clientDataPath: 'sync/client',

  serverInfoJSON: 'serverInfo.json',
  userDir: 'users',
  userDevicesJSON: 'devices.json',
  listDir: 'list',
  listSnapshotDir: 'snapshot',
  listSnapshotInfoJSON: 'snapshotInfo.json',
  dislikeDir: 'dislike',
  dislikeSnapshotDir: 'snapshot',
  dislikeSnapshotInfoJSON: 'snapshotInfo.json',

  syncAuthKeysJSON: 'syncAuthKey.json',
} as const

export const FeaturesList = [
  'list',
  'dislike',
] as const
