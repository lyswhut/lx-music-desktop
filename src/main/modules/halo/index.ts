/**
 * Halo 歌词同步模块入口
 *
 * 监听 LX Music 播放器状态，将歌词实时同步到 花再 Halo PixelBar 音箱。
 *
 * 数据来源: 直接读取 global.lx.player_status (零延迟)
 * 通信协议: USB HID 64字节数据包
 */

import * as net from 'net'
import log from 'electron-log/node'
import { HaloHidCommunicator, getHasHid, findHaloDevices, listDevices } from './haloHid'
import { TextLayout, UIMode } from './haloPacket'

const SYNC_INTERVAL_MS = 50
const SONG_INFO_DURATION_MS = 3000
const IDLE_TIMEOUT_MS = 30000
const OPENAPI_PORT = 23330
const PORT_WAIT_TIMEOUT_MS = 30000
const HEARTBEAT_INTERVAL_MS = 30000
const MAX_HEARTBEAT_FAILURES = 3

interface LyricLine {
  timeMs: number
  text: string
  index: number
}

const TIME_RE = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g
const TAG_RE = /^\[([a-z]+):([^\]]*)\]$/i

function parseLrc(lrcContent: string): LyricLine[] {
  if (!lrcContent) return []
  const lines: LyricLine[] = []
  const rawLines = lrcContent.split(/\r?\n/)

  for (const line of rawLines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Skip tag-only lines
    if (TAG_RE.test(trimmed) && !/\[\d/.test(trimmed)) continue

    const timeMatches: RegExpExecArray[] = []
    let match: RegExpExecArray | null
    TIME_RE.lastIndex = 0
    while ((match = TIME_RE.exec(trimmed)) !== null) {
      timeMatches.push(match)
    }
    if (!timeMatches.length) continue

    const lastMatch = timeMatches[timeMatches.length - 1]
    const text = trimmed.substring(lastMatch.index + lastMatch[0].length).trim()

    for (const m of timeMatches) {
      const minutes = parseInt(m[1], 10)
      const seconds = parseInt(m[2], 10)
      const csStr = m[3] ?? '00'
      let centiseconds: number
      if (csStr.length === 3) {
        centiseconds = parseInt(csStr, 10)
      } else {
        centiseconds = parseInt(csStr.padEnd(3, '0').substring(0, 3), 10)
      }
      const timeMs = minutes * 60000 + seconds * 1000 + centiseconds

      lines.push({ timeMs, text, index: lines.length })
    }
  }

  lines.sort((a, b) => a.timeMs - b.timeMs)
  for (let i = 0; i < lines.length; i++) {
    lines[i].index = i
  }
  return lines
}

function getLyricAtTime(lines: LyricLine[], timeMs: number): string {
  if (!lines.length) return ''
  let left = 0
  let right = lines.length - 1
  let resultIdx = 0
  while (left <= right) {
    const mid = (left + right) >> 1
    if (lines[mid].timeMs <= timeMs) {
      resultIdx = mid
      left = mid + 1
    } else {
      right = mid - 1
    }
  }
  return lines[resultIdx]?.text ?? ''
}

function checkPort(port: number, host: string = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    socket.setTimeout(2000)
    socket.once('connect', () => { socket.destroy(); resolve(true) })
    socket.once('error', () => { socket.destroy(); resolve(false) })
    socket.once('timeout', () => { socket.destroy(); resolve(false) })
    socket.connect(port, host)
  })
}

async function waitForOpenAPI(): Promise<boolean> {
  const start = Date.now()
  let delay = 500
  while (Date.now() - start < PORT_WAIT_TIMEOUT_MS) {
    if (await checkPort(OPENAPI_PORT)) {
      log.info(`[Halo] OpenAPI ready (port ${OPENAPI_PORT})`)
      return true
    }
    await new Promise(r => setTimeout(r, delay))
    delay = Math.min(delay * 2, 5000)
  }
  log.warn(`[Halo] OpenAPI port ${OPENAPI_PORT} not ready after ${PORT_WAIT_TIMEOUT_MS}ms, continuing without check`)
  return false
}

let communicator: HaloHidCommunicator | null = null
let syncTimer: ReturnType<typeof setInterval> | null = null

// Sync state
let lastSongKey = ''
let parsedLrcLines: LyricLine[] = []
let canSyncLyric = false
let songInfoStartTime = 0
let deviceConnected = false
let lastLyricTime = 0
let currentLayout: TextLayout = TextLayout.CENTER
let maxCharsPerLine = 20
let showProgress = false
let lastDisplayText = ''
let heartbeatTickCounter = 0
let heartbeatFailures = 0

function stopSyncTimer(): void {
  if (syncTimer) {
    clearInterval(syncTimer)
    syncTimer = null
  }
}

function startSyncTimer(): void {
  stopSyncTimer()
  syncTimer = setInterval(syncTick, SYNC_INTERVAL_MS)
}

function updateSettings(): void {
  const setting = global.lx.appSetting
  if (setting['halo.layout']) {
    currentLayout = setting['halo.layout'] as TextLayout
  }
  maxCharsPerLine = setting['halo.maxCharsPerLine'] ?? 20
  showProgress = setting['halo.showProgress'] ?? false
}

function onSettingChange(keys: string[]): void {
  if (keys.some(k => k.startsWith('halo.'))) {
    updateSettings()

    if (keys.includes('halo.enable')) {
      const enable = global.lx.appSetting['halo.enable']
      if (enable) {
        startModule()
      } else {
        stopModule()
      }
      return
    }

    if (keys.includes('halo.layout') && communicator?.isConnected()) {
      communicator.setLayout(currentLayout)
    }
  }
}

function ensureDevice(): boolean {
  if (!deviceConnected) {
    if (!communicator) return false
    deviceConnected = communicator.connect()
    if (deviceConnected) {
      canSyncLyric = true
      lastSongKey = ''
      parsedLrcLines = []
      const layout = global.lx.appSetting['halo.layout'] as TextLayout | undefined
      communicator.setLayout(layout ?? TextLayout.CENTER)
    }
  }
  return deviceConnected
}

function syncTick(): void {
  if (!communicator || !canSyncLyric) return
  if (!ensureDevice()) return

  // Heartbeat: check OpenAPI port periodically
  heartbeatTickCounter++
  if (heartbeatTickCounter >= Math.ceil(HEARTBEAT_INTERVAL_MS / SYNC_INTERVAL_MS)) {
    heartbeatTickCounter = 0
    checkPort(OPENAPI_PORT).then(ready => {
      if (!ready) {
        heartbeatFailures++
        log.warn(`[Halo] Heartbeat fail (${heartbeatFailures}/${MAX_HEARTBEAT_FAILURES})`)
        if (heartbeatFailures >= MAX_HEARTBEAT_FAILURES) {
          log.warn(`[Halo] OpenAPI ${OPENAPI_PORT} unreachable, stopping sync`)
          canSyncLyric = false
        }
      } else {
        heartbeatFailures = 0
      }
    })
  }

  const status = global.lx.player_status

  // Not playing - skip
  if (status.status !== 'playing') return

  const songKey = `${status.name}::${status.singer}`

  // Song changed
  if (songKey !== lastSongKey && songKey !== '::') {
    lastSongKey = songKey
    parsedLrcLines = parseLrc(status.lyric || '')
    songInfoStartTime = Date.now()

    if (global.lx.appSetting['halo.enable'] && status.name) {
      communicator.showSongInfo(status.name, status.singer)
    }
    lastDisplayText = ''
    return
  }

  // Song info display duration
  if (Date.now() - songInfoStartTime < SONG_INFO_DURATION_MS) {
    return
  }

  // Get lyric text
  let displayText = status.lyricLineText

  // Fallback: binary search in LRC
  if (!displayText && parsedLrcLines.length > 0) {
    displayText = getLyricAtTime(parsedLrcLines, status.progress)
  }

  if (!displayText) {
    // Idle: switch to clock after timeout
    if (Date.now() - lastLyricTime > IDLE_TIMEOUT_MS) {
      communicator.setUIMode(UIMode.CLOCK)
      lastLyricTime = Date.now()
    }
    lastDisplayText = ''
    return
  }

  lastLyricTime = Date.now()

  // Build display text with optional progress
  if (showProgress && parsedLrcLines.length > 0) {
    const currentIdx = parsedLrcLines.findIndex(l => l.text === displayText)
    if (currentIdx >= 0) {
      displayText = `${displayText} [${currentIdx + 1}/${parsedLrcLines.length}]`
    }
  }

  if (displayText !== lastDisplayText) {
    lastDisplayText = displayText
    communicator.sendLyricLine(displayText, maxCharsPerLine)
  }
}

function startModule(): void {
  updateSettings()

  if (!communicator) {
    communicator = new HaloHidCommunicator()
  }

  waitForOpenAPI().then(apiReady => {
    log.info(`[Halo] Module starting, OpenAPI ready: ${apiReady}`)

    const hasApi = getHasHid()
    log.info(`[Halo] HID available: ${hasApi}`)
    if (hasApi) {
      const devices = findHaloDevices()
      log.info(`[Halo] Found ${devices.length} HALO device(s)`)
    }

    deviceConnected = communicator!.connect()
    if (deviceConnected) {
      canSyncLyric = true
      lastSongKey = ''
      parsedLrcLines = []
    }

    heartbeatTickCounter = 0
    heartbeatFailures = 0
    startSyncTimer()
  })
}

function stopModule(): void {
  stopSyncTimer()
  canSyncLyric = false
  deviceConnected = false

  if (communicator?.isConnected()) {
    communicator.setUIMode(UIMode.CLOCK)
    communicator.disconnect()
  }

  lastSongKey = ''
  parsedLrcLines = []
}

function onPlayerStatus(_status: Partial<LX.Player.Status>): void {
  // Status updates come from the renderer via IPC
  // The global.lx.player_status is already updated before this event fires
  // We use syncTick to read the current state
}

let isModuleRegistered = false

export default function registerHalo(): void {
  if (isModuleRegistered) return
  isModuleRegistered = true

  global.lx.event_app.on('updated_config', onSettingChange)
  global.lx.event_app.on('player_status', onPlayerStatus)

  // Check if halo is enabled on startup
  if (global.lx.appSetting['halo.enable']) {
    startModule()
  }

  log.info('[Halo] Module registered')
}

export { startModule, stopModule, HaloHidCommunicator, findHaloDevices, listDevices }
