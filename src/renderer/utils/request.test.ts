import http from 'node:http'
import { gzipSync } from 'node:zlib'
import type needle from 'needle'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpFetch as rawHttpFetch } from './request'

const mocks = vi.hoisted(() => ({
  needleRequest: vi.fn(),
  httpsOverHttp: vi.fn((opts: unknown) => ({ __agentType: 'httpsOverHttp', opts })),
  httpOverHttp: vi.fn((opts: unknown) => ({ __agentType: 'httpOverHttp', opts })),
  proxy: { enable: false, host: '', port: '', envProxy: undefined as undefined | { host: string, port: string } },
}))

vi.mock('needle', () => ({
  default: {
    request: mocks.needleRequest,
  },
}))
vi.mock('tunnel', () => ({
  httpsOverHttp: mocks.httpsOverHttp,
  httpOverHttp: mocks.httpOverHttp,
}))
vi.mock('@renderer/store', () => ({
  proxy: mocks.proxy,
}))
vi.mock('./env', () => ({
  debugRequest: false,
}))
vi.mock('./musicSdk/options', () => ({
  bHh: 'test-header',
}))

const httpFetch = rawHttpFetch as unknown as (
  url: string,
  options?: Record<string, unknown>,
) => {
  promise: Promise<{ statusCode: number, body: unknown }>
  cancelHttp?: () => void
}

describe('httpFetch 独立代理覆盖与异常拒绝', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.proxy.enable = false
    mocks.proxy.host = ''
    mocks.proxy.port = ''
    mocks.proxy.envProxy = undefined
  })

  it('对象型 proxy 覆盖不会透传到 needle.request，只生成 tunnel agent', async() => {
    mocks.needleRequest.mockImplementation((_method, _url, _data, opts, cb) => {
      // 模拟真实 needle 检查：若 options.proxy 为对象会同步抛出 indexOf is not a function
      if (opts.proxy && typeof opts.proxy.indexOf !== 'function') {
        throw new TypeError('config.proxy.indexOf is not a function')
      }
      cb(null, { statusCode: 200, headers: {}, raw: Buffer.from('{"ok":true}') }, '{"ok":true}')
      return { abort: vi.fn() }
    })

    const req = httpFetch('https://music.youtube.com/youtubei/v1/search', {
      method: 'post',
      body: { query: 'test' },
      proxy: { host: '127.0.0.1', port: 7890 },
    })
    const res = await req.promise

    expect(res.statusCode).toBe(200)
    expect(mocks.httpsOverHttp).toHaveBeenCalledWith({
      proxy: { host: '127.0.0.1', port: 7890 },
    })
    const needleOptions = mocks.needleRequest.mock.calls[0][3]
    expect(needleOptions.proxy).toBeUndefined()
    expect(needleOptions.agent).toEqual({
      __agentType: 'httpsOverHttp',
      opts: { proxy: { host: '127.0.0.1', port: 7890 } },
    })
  })

  it('未传 proxy 覆盖时不干扰国内直连（不注入 agent）', async() => {
    mocks.needleRequest.mockImplementation((_method, _url, _data, _opts, cb) => {
      cb(null, { statusCode: 200, headers: {}, raw: Buffer.from('ok') }, 'ok')
      return { abort: vi.fn() }
    })

    const req = httpFetch('https://music.163.com/api/test', { method: 'get' })
    await req.promise

    expect(mocks.httpsOverHttp).not.toHaveBeenCalled()
    expect(mocks.httpOverHttp).not.toHaveBeenCalled()
    expect(mocks.needleRequest.mock.calls[0][3].agent).toBeUndefined()
  })

  it('needle 构造期同步抛错会被外层 Promise 正常 reject（不泄漏未捕获异常）', async() => {
    mocks.needleRequest.mockImplementation(() => {
      throw new Error('sync construct error')
    })

    const req = httpFetch('https://music.youtube.com/youtubei/v1/next', {
      method: 'post',
      proxy: { host: '127.0.0.1', port: 7890 },
    })
    await expect(req.promise).rejects.toThrow('sync construct error')
  })

  it('非法独立代理端口（空/0/65536/含非数字后缀）绝不回落端口 80', async() => {
    mocks.needleRequest.mockImplementation((_method, _url, _data, _opts, cb) => {
      cb(null, { statusCode: 200, headers: {}, raw: Buffer.from('ok') }, 'ok')
      return { abort: vi.fn() }
    })

    for (const badPort of ['', '0', '65536', '7890abc', '-1']) {
      await httpFetch('https://music.youtube.com/youtubei/v1/search', {
        method: 'post',
        proxy: { host: '127.0.0.1', port: badPort },
      }).promise
    }
    expect(mocks.httpsOverHttp).not.toHaveBeenCalled()
    expect(mocks.httpOverHttp).not.toHaveBeenCalled()
  })

  it('R2 回归：全局代理与命令行 envProxy 端口为空或非法时绝不回落端口 80', async() => {
    mocks.needleRequest.mockImplementation((_method, _url, _data, _opts, cb) => {
      cb(null, { statusCode: 200, headers: {}, raw: Buffer.from('ok') }, 'ok')
      return { abort: vi.fn() }
    })

    mocks.proxy.enable = true
    mocks.proxy.host = '127.0.0.1'
    mocks.proxy.port = ''
    await httpFetch('https://music.youtube.com/youtubei/v1/search', { method: 'post' }).promise

    mocks.proxy.enable = false
    mocks.proxy.envProxy = { host: '127.0.0.1', port: 'abc' }
    await httpFetch('https://music.youtube.com/youtubei/v1/search', { method: 'post' }).promise

    expect(mocks.httpsOverHttp).not.toHaveBeenCalled()
    expect(mocks.httpOverHttp).not.toHaveBeenCalled()
  })

  it('R2 回归：Needle 重定向动态替换 stream.request 后 cancelHttp 仍中止最新在途连接', async() => {
    const firstAbort = vi.fn()
    const redirectedAbort = vi.fn()
    const streamDestroy = vi.fn()
    const liveStream: any = {
      request: { abort: firstAbort },
      destroy: streamDestroy,
    }
    mocks.needleRequest.mockImplementation(() => liveStream)

    const req = httpFetch('https://music.youtube.com/', { method: 'get' })
    // 模拟 Needle 收到 302 后替换底层 request 对象
    liveStream.request = { abort: redirectedAbort }
    req.cancelHttp?.()

    await expect(req.promise).rejects.toThrow()
    expect(redirectedAbort).toHaveBeenCalledTimes(1)
    expect(streamDestroy).toHaveBeenCalledTimes(1)
    expect(firstAbort).not.toHaveBeenCalled()
  })

  it('独立代理支持剥离 http(s):// 前缀、解析内嵌端口，并拒绝冲突端口与 socks:// 协议', async() => {
    mocks.needleRequest.mockImplementation((_method, _url, _data, _opts, cb) => {
      cb(null, { statusCode: 200, headers: {}, raw: Buffer.from('ok') }, 'ok')
      return { abort: vi.fn() }
    })

    await httpFetch('https://music.youtube.com/youtubei/v1/search', {
      method: 'post',
      proxy: { host: 'http://127.0.0.1:7897/', port: 7897 },
    }).promise
    expect(mocks.httpsOverHttp).toHaveBeenCalledTimes(1)
    expect(mocks.httpsOverHttp).toHaveBeenCalledWith({
      proxy: { host: '127.0.0.1', port: 7897 },
    })

    // 仅在 URL 中提供端口且 port 字段为空时也能正确解析
    mocks.httpsOverHttp.mockClear()
    await httpFetch('https://music.youtube.com/youtubei/v1/search', {
      method: 'post',
      proxy: { host: 'http://127.0.0.1:7897/', port: '' },
    }).promise
    expect(mocks.httpsOverHttp).toHaveBeenCalledWith({
      proxy: { host: '127.0.0.1', port: 7897 },
    })

    // 内嵌端口与显式端口冲突时拒绝代理
    mocks.httpsOverHttp.mockClear()
    await httpFetch('https://music.youtube.com/youtubei/v1/search', {
      method: 'post',
      proxy: { host: 'http://127.0.0.1:7897/', port: 8080 },
    }).promise
    expect(mocks.httpsOverHttp).not.toHaveBeenCalled()

    // 拒绝 https:// 代理（tunnel 仅支持明文 HTTP 代理握手）与 socks5:// 协议
    await httpFetch('https://music.youtube.com/youtubei/v1/search', {
      method: 'post',
      proxy: { host: 'https://proxy.example:443/', port: '' },
    }).promise
    await httpFetch('https://music.youtube.com/youtubei/v1/search', {
      method: 'post',
      proxy: { host: 'socks5://127.0.0.1:7897', port: 7897 },
    }).promise
    expect(mocks.httpsOverHttp).not.toHaveBeenCalled()
    expect(mocks.httpOverHttp).not.toHaveBeenCalled()
  })

  it('compressed: true 经真实 needle 解压链路返回 gzip JSON 对象、字符串字面量 "123" 与 HTML，且不破坏默认未压缩链路', async() => {
    const actualNeedle = await vi.importActual<{ default?: typeof needle, request?: typeof needle.request }>('needle')
    const realRequest = actualNeedle.default?.request ?? actualNeedle.request!
    const server = http.createServer((req, res) => {
      if (req.url === '/json-string') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Encoding': 'gzip' })
        res.end(gzipSync(Buffer.from('"123"')))
        return
      }
      if (req.url === '/json-object') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Encoding': 'gzip' })
        res.end(gzipSync(Buffer.from('{"responseContext":{"ok":true}}')))
        return
      }
      if (req.url === '/html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Encoding': 'gzip' })
        res.end(gzipSync(Buffer.from('<html><title>YouTube Music</title></html>')))
        return
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Encoding': 'identity' })
      res.end('{"code":200}')
    })

    await new Promise<void>(resolve => { server.listen(0, '127.0.0.1', resolve) })
    const addr = server.address()
    const port = typeof addr === 'object' && addr ? addr.port : 0

    try {
      mocks.needleRequest.mockImplementation((method, url, data, opts, cb) =>
        realRequest(method, url, data, opts, cb),
      )

      // 真实 needle + gzip 解压：JSON 字符串 "123" 保持为 string '123'（不再被二次 JSON.parse 成数字 123）
      const jsonStringRes = await httpFetch(`http://127.0.0.1:${port}/json-string`, {
        method: 'get',
        compressed: true,
      }).promise
      expect(jsonStringRes.body).toBe('123')

      const jsonObjRes = await httpFetch(`http://127.0.0.1:${port}/json-object`, {
        method: 'get',
        compressed: true,
      }).promise
      expect(jsonObjRes.body).toEqual({ responseContext: { ok: true } })

      const htmlRes = await httpFetch(`http://127.0.0.1:${port}/html`, {
        method: 'get',
        format: 'text',
        compressed: true,
      }).promise
      expect(htmlRes.body).toBe('<html><title>YouTube Music</title></html>')

      // content-encoding: identity 与未传 compressed 默认链路均正常解析 JSON
      const identityRes = await httpFetch(`http://127.0.0.1:${port}/identity`, {
        method: 'get',
        compressed: true,
      }).promise
      expect(identityRes.body).toEqual({ code: 200 })

      const defaultRes = await httpFetch(`http://127.0.0.1:${port}/identity`, {
        method: 'get',
      }).promise
      expect(defaultRes.body).toEqual({ code: 200 })
    } finally {
      await new Promise<void>(resolve => { server.close(() => { resolve() }) })
    }
  })
})
