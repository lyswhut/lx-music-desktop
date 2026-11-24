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
})
