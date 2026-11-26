import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TRAY_AUTO_ID } from '@common/constants'
import { createTrayImage, resolveTrayTheme } from './tray'

const mocks = vi.hoisted(() => ({
  isMac: true,
  isWin: false,
  createdImages: [] as Array<{ path: string, setTemplateImage: ReturnType<typeof vi.fn> }>,
}))

vi.mock('electron', () => ({
  Tray: vi.fn(),
  Menu: { buildFromTemplate: vi.fn() },
  nativeImage: {
    createFromPath: vi.fn((filePath: string) => {
      const img = {
        path: filePath,
        setTemplateImage: vi.fn(),
      }
      mocks.createdImages.push(img)
      return img
    }),
  },
}))
vi.mock('@common/utils', () => ({
  get isMac() { return mocks.isMac },
  get isWin() { return mocks.isWin },
}))
vi.mock('./winMain', () => ({
  hideWindow: vi.fn(),
  isExistWindow: vi.fn(() => false),
  isShowWindow: vi.fn(() => false),
  sendTaskbarButtonClick: vi.fn(),
  showWindow: vi.fn(),
}))
vi.mock('@main/app', () => ({ quitApp: vi.fn() }))

beforeEach(() => {
  mocks.isMac = true
  mocks.isWin = false
  mocks.createdImages.length = 0
  ;(global as any).staticPath = '/app/static'
  ;(global as any).lx = {
    theme: { shouldUseDarkColors: true },
    appSetting: { 'tray.themeId': 0 },
  }
})

describe('macOS tray icon template image contract', () => {
  it('id=0 and TRAY_AUTO_ID load trayTemplate.png and set template image true on macOS', () => {
    ;(global as any).lx.theme.shouldUseDarkColors = true
    const img0 = createTrayImage(0) as any
    expect(img0.path).toBe('/app/static/images/tray/trayTemplate.png')
    expect(img0.setTemplateImage).toHaveBeenCalledExactlyOnceWith(true)

    ;(global as any).lx.theme.shouldUseDarkColors = false
    const imgAutoLight = createTrayImage(TRAY_AUTO_ID) as any
    expect(imgAutoLight.path).toBe('/app/static/images/tray/trayTemplate.png')
    expect(imgAutoLight.setTemplateImage).toHaveBeenCalledExactlyOnceWith(true)
  })

  it('id=1 and id=2 load non-template icons and explicitly set template image false on macOS', () => {
    const imgOrigin = createTrayImage(1) as any
    expect(imgOrigin.path).toBe('/app/static/images/tray/tray_origin.png')
    expect(imgOrigin.setTemplateImage).toHaveBeenCalledExactlyOnceWith(false)

    const imgBlack = createTrayImage(2) as any
    expect(imgBlack.path).toBe('/app/static/images/tray/tray_black.png')
    expect(imgBlack.setTemplateImage).toHaveBeenCalledExactlyOnceWith(false)
  })

  it('resolveTrayTheme switches by shouldUseDarkColors on non-macOS for TRAY_AUTO_ID', () => {
    expect(resolveTrayTheme(TRAY_AUTO_ID, true, false).fileName).toBe('trayTemplate')
    expect(resolveTrayTheme(TRAY_AUTO_ID, false, false).fileName).toBe('tray_black')
  })
})
