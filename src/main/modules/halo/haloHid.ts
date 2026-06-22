/**
 * HID设备通信模块 - 与HALO PIXELBAR音箱通信
 *
 * 设备信息:
 * - 设备名称: 花再 Halo PixelBar
 * - 包长度: 64字节
 * - 权限要求: Windows管理员权限
 */

import log from 'electron-log/node'
import { buildTextPacket, buildLayoutPacket, buildUIModePacket, getWriteTestPacket, toHex, TextLayout, UIMode } from './haloPacket'

interface HidDeviceInfo {
  path: string
  vendorId: number
  productId: number
  serialNumber: string
  manufacturerString: string
  productString: string
  releaseNumber: number
}

const DEVICE_KEYWORDS = ['halo', 'pixel', '花再', 'pixelbar']

let hidApi: typeof import('node-hid') | null = null
let hasHid = false

try {
  hidApi = require('node-hid')
  hasHid = true
} catch {
  log.info('[HaloHID] node-hid not available, running in simulated mode')
}

function normalizePath(path: any): string {
  if (typeof path === 'string') return path
  if (path instanceof Uint8Array || Buffer.isBuffer(path)) {
    return Buffer.from(path).toString('utf-8').replace(/\0/g, '')
  }
  return ''
}

export function getHasHid(): boolean {
  return hasHid
}

export function listDevices(): HidDeviceInfo[] {
  if (!hasHid || !hidApi) {
    return [{
      path: 'simulated',
      vendorId: 0x1234,
      productId: 0x5678,
      serialNumber: 'SIMULATED',
      manufacturerString: 'HALO',
      productString: 'Halo PixelBar (simulated)',
      releaseNumber: 0x0100,
    }]
  }

  return hidApi.devices().map((dev: import('node-hid').Device) => ({
    path: normalizePath(dev.path),
    vendorId: dev.vendorId,
    productId: dev.productId,
    serialNumber: dev.serialNumber ?? '',
    manufacturerString: dev.manufacturer ?? '',
    productString: dev.product ?? '',
    releaseNumber: dev.release,
  }))
}

export function findHaloDevices(): HidDeviceInfo[] {
  const allDevices = listDevices()
  return allDevices.filter(dev => {
    const name = (dev.productString || '').toLowerCase()
    return DEVICE_KEYWORDS.some(keyword => name.includes(keyword))
  })
}

function displayWidth(s: string): number {
  let width = 0
  for (const ch of s) {
    const code = ch.codePointAt(0) ?? 0
    if (isWideChar(code)) {
      width += 2
    } else {
      width += 1
    }
  }
  return width
}

function isWideChar(code: number): boolean {
  return (
    (code >= 0x1100 && code <= 0x115F) || // Hangul Jamo
    (code >= 0x2E80 && code <= 0xA4CF) || // CJK Radicals Supplement .. Yi
    (code >= 0xAC00 && code <= 0xD7A3) || // Hangul Syllables
    (code >= 0xF900 && code <= 0xFAFF) || // CJK Compatibility Ideographs
    (code >= 0xFE10 && code <= 0xFE19) || // Vertical Forms
    (code >= 0xFE30 && code <= 0xFE6F) || // CJK Compatibility Forms
    (code >= 0xFF01 && code <= 0xFF60) || // Fullwidth Forms
    (code >= 0xFFE0 && code <= 0xFFE6) ||
    (code >= 0x20000 && code <= 0x2FFFD) || // CJK Extension B/C/D/E/F
    (code >= 0x30000 && code <= 0x3FFFD) || // CJK Extension G/H
    (code >= 0x2600 && code <= 0x27BF) || // Miscellaneous Symbols, Dingbats (☀☁★☕✂)
    (code >= 0x1F000 && code <= 0x1FFFF)   // Emoji (😀🎵🐱🚗🏠 etc.)
  )
}

export class HaloHidCommunicator {
  private device: any = null
  private deviceInfo: HidDeviceInfo | null = null
  private connected = false
  private simulated = false

  constructor() {
    if (!hasHid) {
      this.simulated = true
      log.info('[HaloHID] Running in simulated mode')
    }
  }

  isConnected(): boolean {
    return this.connected
  }

  connect(path?: string): boolean {
    if (this.connected) return true

    if (this.simulated) {
      this.device = 'simulated'
      this.connected = true
      log.info('[HaloHID] Simulated connect')
      return true
    }

    if (!hidApi) return false

    let candidates: HidDeviceInfo[]
    if (path) {
      const devs = listDevices().filter(d => d.path === path)
      candidates = devs
      if (!candidates.length) {
        log.info(`[HaloHID] Device not found at path: ${path}`)
        return false
      }
    } else {
      candidates = findHaloDevices()
      if (!candidates.length) {
        log.info('[HaloHID] No HALO device found')
        return false
      }
    }

    for (const devInfo of candidates) {
      try {
        log.info(`[HaloHID] Trying device: ${devInfo.productString} path=${devInfo.path.substring(0, 40)}...`)
        const dev = new hidApi.HID(devInfo.path)
        log.info(`[HaloHID] Device opened OK`)
        const result = dev.write(getWriteTestPacket())
        log.info(`[HaloHID] Write result: ${result}`)
        if (result < 0) {
          dev.close()
          continue
        }
        this.device = dev
        this.deviceInfo = devInfo
        this.connected = true
        log.info(`[HaloHID] Connected to: ${devInfo.productString}`)
        return true
      } catch (e: any) {
        log.info(`[HaloHID] Connection attempt failed: ${e.message}`)
      }
    }

    log.info('[HaloHID] Connection failed for all candidates')
    return false
  }

  disconnect(): void {
    if (this.connected && this.device && !this.simulated) {
      try {
        this.device.close()
      } catch { /* ignore */ }
      this.device = null
      this.connected = false
      log.info('[HaloHID] Disconnected')
    } else {
      this.connected = false
    }
  }

  sendText(text: string, maxLength = 50): boolean {
    while (displayWidth(text) > maxLength && text) {
      text = text.slice(0, -1)
    }

    const packet = buildTextPacket(text)

    if (this.simulated) {
      log.info(`[HaloHID] [sim] send: ${toHex(packet).substring(0, 32)}...`)
      return true
    }

    if (!this.connected || !this.device) return false

    try {
      const result = this.device.write(packet)
      if (result < 0) {
        log.info('[HaloHID] Write failed')
        return false
      }
      return true
    } catch (e: any) {
      log.info(`[HaloHID] Write error: ${e.message}`)
      this.connected = false
      return false
    }
  }

  sendLyricLine(text: string, maxChars = 20): boolean {
    return this.sendText(text.slice(0, maxChars), maxChars)
  }

  setLayout(layout: TextLayout): boolean {
    const packet = buildLayoutPacket(layout)
    if (this.simulated) return true
    if (!this.connected || !this.device) return false
    try {
      this.device.write(packet)
      return true
    } catch {
      return false
    }
  }

  setUIMode(mode: UIMode): boolean {
    const packet = buildUIModePacket(mode)
    if (this.simulated) return true
    if (!this.connected || !this.device) return false
    try {
      this.device.write(packet)
      return true
    } catch {
      return false
    }
  }

  clearDisplay(): boolean {
    return this.sendText(' ')
  }

  showSongInfo(songName: string, artist: string): boolean {
    const info = `${songName} - ${artist}`
    return this.sendText(info)
  }
}
