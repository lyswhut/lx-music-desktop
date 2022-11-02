import { ref, reactive, shallowRef, markRaw, computed, watch } from '@common/utils/vueTools'
import { windowSizeList as configWindowSizeList } from '@common/config'
import { appSetting } from './setting'
import pkg from '../../../package.json'
import { ProgressInfo } from 'electron-updater'
import music from '@renderer/utils/musicSdk'
process.versions.app = pkg.version

export const apiSource = ref<string | null>(null)
export const proxy: {
  enable: boolean
  host: string
  port: string
  username: string
  password: string

  envProxy?: {
    host: string
    port: string
  }
} = {
  enable: false,
  host: '',
  port: '',
  username: '',
  password: '',
}
export const sync: {
  enable: boolean
  port: string
  isShowSyncMode: boolean
  deviceName: string
  status: {
    status: boolean
    message: string
    address: string[]
    code: string
    devices: LX.Sync.KeyInfo[]
  }
} = reactive({
  enable: false,
  port: '',
  isShowSyncMode: false,
  deviceName: '',
  status: {
    status: false,
    message: '',
    address: [],
    code: '',
    devices: [],
  },
})


export const windowSizeActive = computed(() => {
  return windowSizeList.find(i => i.id === appSetting['common.windowSizeId']) ?? windowSizeList[0]
})

export const sourceNames = computed(() => {
  const prefix = appSetting['common.sourceNameType'] == 'real' ? 'source_' : 'source_alias_'
  const sourceNames: Record<LX.OnlineSource | 'all', string> = {
    kw: 'kw',
    tx: 'tx',
    kg: 'kg',
    mg: 'mg',
    wy: 'wy',
    all: window.i18n.t(prefix + 'all' as any),
  }
  for (const { id } of music.sources) {
    sourceNames[id as LX.OnlineSource] = window.i18n.t(prefix + id as any)
  }

  return sourceNames
})

export const windowSizeList = markRaw(configWindowSizeList)

export const isShowPact = ref(false)

export const versionInfo = window.lxData.versionInfo = reactive<{
  version: string
  newVersion: {
    version: string
    desc: string
    history?: LX.VersionInfo[]
  } | null
  showModal: boolean
  isError: boolean
  isTimeOut: boolean
  isUnknow: boolean
  isDownloaded: boolean
  isDownloading: boolean
  isLatestVer: boolean
  downloadProgress: ProgressInfo | null
}>({
  version: pkg.version,
  newVersion: null,
  showModal: false,
  isError: false,
  isTimeOut: false,
  isUnknow: false,
  isDownloaded: false,
  isDownloading: false,
  isLatestVer: false,
  downloadProgress: null,
})
export const userApi = reactive<{
  list: LX.UserApi.UserApiInfo[]
  status: boolean
  message?: string
  apis: Partial<LX.UserApi.UserApiSources>
}>({
  list: [],
  status: false,
  message: 'initing',
  apis: {},
})

export const isFullscreen = ref(false)
watch(isFullscreen, isFullscreen => {
  window.lx.rootOffset = window.dt || isFullscreen ? 0 : 8
}, { immediate: true })

export const themeShouldUseDarkColors = ref(window.shouldUseDarkColors)


export const qualityList = shallowRef<LX.QualityList>({})
export const setQualityList = (_qualityList: LX.QualityList) => {
  qualityList.value = _qualityList
}

export const themeId = ref('green')
export const themeInfo: LX.ThemeInfo = {
  themes: [],
  userThemes: [],
  dataPath: '',
}
