import { beforeEach, expect, it, vi } from 'vitest'
import useMenu from './useMenu'
import { assertPlaybackSupport, canDirectDownload } from '@renderer/core/music/sourceCapabilities'

const mocks = vi.hoisted(() => {
  const userApi: { apis: Record<string, any>, qualityLists: Record<string, any> } = { apis: {}, qualityLists: {} }
  const qualityList: { value: Record<string, any> } = { value: {} }
  return {
    qualityList,
    userApi,
    setting: { 'common.apiSource': 'primary', 'common.apiSourceBackups': ['backup'] },
  }
})
vi.mock('@renderer/store', () => mocks)
vi.mock('@renderer/store/setting', () => ({ appSetting: mocks.setting }))
vi.mock('@renderer/utils/musicSdk', () => ({ default: {} }))
vi.mock('@renderer/plugins/i18n', () => ({ useI18n: () => (key: string) => key }))
vi.mock('@renderer/core/dislikeList', () => ({ hasDislike: () => false }))

beforeEach(() => {
  mocks.qualityList.value = {}
  mocks.userApi.apis = {}
  mocks.userApi.qualityLists = {}
})

const showMenu = (
  checkApiSource = true,
  musicInfo: { source: LX.Source, id?: string, meta?: { _qualitys?: Record<string, any> } } = { source: 'wy', id: 'wy_1' },
  assertApiSupport = () => false,
) => {
  const menu = useMenu({
    props: { checkApiSource },
    assertApiSupport,
    assertPlaybackSupport,
    canDirectDownload,
    emit: vi.fn(),
    handleShowDownloadModal: vi.fn(),
    handlePlayMusic: vi.fn(),
    handlePlayMusicLater: vi.fn(),
    handleSearch: vi.fn(),
    handleShowMusicAddModal: vi.fn(),
    handleOpenMusicDetail: vi.fn(),
    handleDislikeMusic: vi.fn(),
  })
  menu.showMenu({ pageX: 0, pageY: 0 }, musicInfo)
  return Object.fromEntries(menu.menus.value.map(item => [item.action, item.disabled]))
}

it('ready backup-only provider enables Play and Play Later but leaves Download disabled', () => {
  mocks.userApi.apis.backup = { wy: { getMusicUrl: vi.fn() } }
  mocks.userApi.qualityLists.backup = { wy: ['128k'] }
  expect(showMenu()).toMatchObject({ play: false, playLater: false, download: true })
})

it('no supporting source disables both playback actions and Download', () => {
  expect(showMenu()).toMatchObject({ play: true, playLater: true, download: true })
})

it('lists that do not require source support preserve their playback actions', () => {
  expect(showMenu(false)).toMatchObject({ play: false, playLater: false, download: true })
})

it('ytm tracks with built-in qualities always enable Play, Play Later, and Download even without domestic scripts', () => {
  expect(showMenu(true, {
    source: 'ytm',
    id: 'ytm_abc12345678',
    meta: { _qualitys: { '128k': { size: '' }, '320k': { size: '' } } },
  })).toMatchObject({
    play: false,
    playLater: false,
    download: false,
  })
})

it('ytm tracks lacking _qualitys still enable direct Play/Play Later but disable Download', () => {
  expect(showMenu(true, { source: 'ytm', id: 'ytm_abc12345678', meta: { _qualitys: {} } })).toMatchObject({
    play: false,
    playLater: false,
    download: true,
  })
})
