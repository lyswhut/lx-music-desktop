// openApi/index.ts 用的 IPC 搜索桥接
// 用于 tx/wy 等需要 renderer SDK 加密的搜索

import { mainHandle, mainSend } from '@common/mainIpc'

type PendingRequest = {
  resolve: (result: any) => void
  reject: (error: any) => void
  timer: NodeJS.Timeout
}

let requestId = 0
const pending = new Map<number, PendingRequest>()

// 注册回调 handler
mainHandle('open_api:search_result', async({ params }: { params: { requestId: number; result?: any; error?: string } }) => {
  const p = pending.get(params.requestId)
  if (!p) return
  pending.delete(params.requestId)
  clearTimeout(p.timer)
  if (params.error) p.reject(new Error(params.error))
  else p.resolve(params.result)
})

/**
 * 通过 IPC 调用 renderer 搜索（tx/wy 加密源）
 */
export const searchViaIpc = (win: Electron.BrowserWindow, source: string, keyword: string, page: number, limit: number): Promise<any> => {
  return new Promise((resolve, reject) => {
    const id = ++requestId
    const timer = setTimeout(() => {
      pending.delete(id)
      reject(new Error('IPC timeout'))
    }, 15000)
    pending.set(id, { resolve, reject, timer })
    mainSend(win, 'open_api:search_request', { requestId: id, source, keyword, page, limit })
  })
}
