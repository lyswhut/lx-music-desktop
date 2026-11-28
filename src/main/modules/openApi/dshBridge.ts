// DSH Bridge：在 openApi 的本地 HTTP 服务上追加 4 个端点，供 DSH 插件（dsh-music-dj）使用。
// 这些端点只是把自己的请求转交给渲染进程里现成的搜索/播放逻辑，本身不包含任何音源实现。
// 详细说明见 docs/DSH_BRIDGE.md。
import type http from 'node:http'
import querystring from 'node:querystring'
import { randomUUID } from 'node:crypto'
import { app } from 'electron'
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { sendEvent } from '@main/modules/winMain'

/** 桥接协议版本，插件据此识别魔改版能力 */
const BRIDGE_VERSION = 1

const DEFAULT_SEARCH_LIMIT = 10
const MAX_SEARCH_LIMIT = 30
const MAX_KEYWORDS_LENGTH = 200
const ALLOWED_SOURCES = ['all', 'kw', 'kg', 'tx', 'wy', 'mg']

// 各动作等待渲染进程响应的超时时间（毫秒）。搜索本身要跨源请求，5 秒不够用，按动作区分。
const ACTION_TIMEOUT: Record<LX.DshBridge.Action, number> = {
  search: 15_000,
  play: 5_000,
  searchPlay: 20_000,
}

interface PendingRequest {
  res: http.ServerResponse<http.IncomingMessage>
  timer: NodeJS.Timeout
}

const pendingRequests = new Map<string, PendingRequest>()

const sendJson = (res: http.ServerResponse<http.IncomingMessage>, code: number, body: Record<string, any>) => {
  if (res.writableEnded || res.destroyed) return
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  })
  res.end(JSON.stringify(body))
}

const readString = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) value = value[0]
  return typeof value == 'string' ? value : undefined
}

const readJsonParam = (value: string | string[] | undefined): any => {
  const raw = readString(value)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const readLimit = (value: string | string[] | undefined): number => {
  const limit = parseInt(readString(value) ?? '')
  if (Number.isNaN(limit)) return DEFAULT_SEARCH_LIMIT
  return Math.min(Math.max(limit, 1), MAX_SEARCH_LIMIT)
}

/**
 * 把一个请求发给渲染进程执行，并等待它回传结果（带超时）。
 */
const requestRenderer = async(res: http.ServerResponse<http.IncomingMessage>, action: LX.DshBridge.Action, params: LX.DshBridge.RequestParams): Promise<void> => {
  const id = randomUUID()
  await new Promise<void>(resolve => {
    const finish = () => {
      const pending = pendingRequests.get(id)
      if (!pending) return false
      pendingRequests.delete(id)
      clearTimeout(pending.timer)
      return true
    }
    const timer = setTimeout(() => {
      finish()
      sendJson(res, 504, { ok: false, code: 'TIMEOUT', error: 'renderer response timeout' })
      resolve()
    }, ACTION_TIMEOUT[action])
    pendingRequests.set(id, { res, timer })
    res.once('close', () => {
      // 客户端提前断开：清理挂起项并结束等待
      finish()
      resolve()
    })
    try {
      sendEvent(WIN_MAIN_RENDERER_EVENT_NAME.dsh_bridge_request, { id, action, params } satisfies LX.DshBridge.Request)
    } catch (error: any) {
      finish()
      sendJson(res, 500, { ok: false, code: 'IPC_ERROR', error: error?.message ?? String(error) })
      resolve()
    }
  })
}

/**
 * 渲染进程处理完请求后回传结果，这里把它写回挂起的 HTTP 响应。
 */
export const handleDshBridgeResponse = ({ params }: LX.IpcMainEventParams<LX.DshBridge.Response>) => {
  const pending = pendingRequests.get(params.id)
  if (!pending) return
  pendingRequests.delete(params.id)
  clearTimeout(pending.timer)

  if (params.ok) {
    sendJson(pending.res, 200, { ok: true, ...(params.data ?? {}) })
    return
  }
  const code = params.code == 'NOT_FOUND' ? 404 : 500
  sendJson(pending.res, code, { ok: false, code: params.code ?? 'INTERNAL_ERROR', error: params.error ?? 'unknown error' })
}

/**
 * 处理 /dsh/* 的 HTTP 请求。调用前需确认 req.url 以 `/dsh/` 开头。
 */
export const handleDshBridgeRequest = async(req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage>): Promise<void> => {
  if (req.method != 'GET') {
    sendJson(res, 405, { ok: false, code: 'METHOD_NOT_ALLOWED', error: 'Only GET is supported' })
    return
  }

  const [pathname, query = ''] = (req.url ?? '').split('?')
  const queryData = querystring.parse(query)

  switch (pathname) {
    case '/dsh/ping':
      sendJson(res, 200, {
        ok: true,
        bridge: true,
        version: BRIDGE_VERSION,
        appVersion: app.getVersion(),
      })
      return

    case '/dsh/search': {
      const keywords = readString(queryData.keywords)?.trim() ?? ''
      if (!keywords) {
        sendJson(res, 400, { ok: false, code: 'INVALID_PARAMS', error: 'keywords is required' })
        return
      }
      if (keywords.length > MAX_KEYWORDS_LENGTH) {
        sendJson(res, 400, { ok: false, code: 'INVALID_PARAMS', error: `keywords must not exceed ${MAX_KEYWORDS_LENGTH} characters` })
        return
      }
      const source = (readString(queryData.source) ?? 'all') as LX.OnlineSource | 'all'
      if (!ALLOWED_SOURCES.includes(source)) {
        sendJson(res, 400, { ok: false, code: 'INVALID_PARAMS', error: `source must be one of: ${ALLOWED_SOURCES.join(', ')}` })
        return
      }
      await requestRenderer(res, 'search', { keywords, source, limit: readLimit(queryData.limit) })
      return
    }

    case '/dsh/play': {
      const data = readJsonParam(queryData.data)
      if (!data || typeof data != 'object') {
        sendJson(res, 400, { ok: false, code: 'INVALID_PARAMS', error: 'data must be a urlencoded JSON object' })
        return
      }
      await requestRenderer(res, 'play', { data })
      return
    }

    case '/dsh/play-search': {
      const name = readString(queryData.name)?.trim() ?? ''
      if (!name) {
        sendJson(res, 400, { ok: false, code: 'INVALID_PARAMS', error: 'name is required' })
        return
      }
      await requestRenderer(res, 'searchPlay', { name, singer: readString(queryData.singer)?.trim() ?? '' })
      return
    }

    default:
      sendJson(res, 404, { ok: false, code: 'NOT_FOUND', error: 'unknown dsh bridge endpoint' })
  }
}
