// openApi/index.ts 用的 IPC 桥接
// 用于 tx/wy 搜索 和 播放控制（需要 renderer SDK）

import { mainHandle, mainSend } from '@common/mainIpc'

type PendingRequest = {
  resolve: (result: any) => void
  reject: (error: any) => void
  timer: NodeJS.Timeout
}

let requestId = 0
const pending = new Map<number, PendingRequest>()

// 注册回调 handlers
mainHandle('open_api:search_result', async({ params }: { params: { requestId: number; result?: any; error?: string } }) => {
  resolvePending(params)
})

mainHandle('open_api:play_result', async({ params }: { params: { requestId: number; result?: any; error?: string } }) => {
  resolvePending(params)
})

mainHandle('open_api:queue_result', async({ params }: { params: { requestId: number; result?: any; error?: string } }) => {
  resolvePending(params)
})

const resolvePending = (params: { requestId: number; result?: any; error?: string }) => {
  const p = pending.get(params.requestId)
  if (!p) return
  pending.delete(params.requestId)
  clearTimeout(p.timer)
  if (params.error) p.reject(new Error(params.error))
  else p.resolve(params.result)
}

const sendRequest = (win: Electron.BrowserWindow, channel: string, params: Record<string, any>): Promise<any> => {
  return new Promise((resolve, reject) => {
    const id = ++requestId
    const timer = setTimeout(() => {
      pending.delete(id)
      reject(new Error('IPC timeout'))
    }, 15000)
    pending.set(id, { resolve, reject, timer })
    mainSend(win, channel, { requestId: id, ...params })
  })
}

/**
 * 通过 IPC 调用 renderer 搜索（tx/wy 加密源）
 */
export const searchViaIpc = (win: Electron.BrowserWindow, source: string, keyword: string, page: number, limit: number): Promise<any> => {
  return sendRequest(win, 'open_api:search_request', { source, keyword, page, limit })
}

/**
 * 通过 IPC 调用 renderer 播放指定歌曲
 */
export const playViaIpc = (win: Electron.BrowserWindow, listId: string, musicInfo: any, songs?: any[]): Promise<any> => {
  return sendRequest(win, 'open_api:play_request', { listId, musicInfo, songs })
}

export const queueViaIpc = (win: Electron.BrowserWindow): Promise<any> => {
  return sendRequest(win, 'open_api:queue_request', {})
}
