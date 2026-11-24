import { describe, expect, it } from 'vitest'
import zhCn from './zh-cn.json'
import zhTw from './zh-tw.json'
import enUs from './en-us.json'
import koKr from './ko-kr.json'

const LOCALES: Array<[string, Record<string, string>]> = [
  ['zh-cn', zhCn],
  ['zh-tw', zhTw],
  ['en-us', enUs],
  ['ko-kr', koKr],
]

const RELEVANT_PREFIXES = ['explore__', 'setting__recommend', 'setting__ai', 'sidebar__']

const extractPlaceholders = (text: string): string[] => {
  const matches = text.match(/\{[a-zA-Z0-9_]+\}/g) ?? []
  return [...new Set(matches)].sort()
}

describe('四语言探索与推荐设置文案完整性门禁', () => {
  const baseKeys = Object.keys(zhCn).filter(key => RELEVANT_PREFIXES.some(prefix => key.startsWith(prefix)))

  it('关键文案前缀集合非空且覆盖新增键', () => {
    expect(baseKeys.length).toBeGreaterThan(50)
    expect(baseKeys).toContain('explore__refresh')
    expect(baseKeys).toContain('explore__ytm_region_blocked_tip')
    expect(baseKeys).toContain('setting__recommend_ytm_proxy_enable')
    expect(baseKeys).toContain('sidebar__collapse')
  })

  it.each(LOCALES)('%s 无缺失键、无空字符串、插值占位符与 zh-cn 完全一致', (_locale, dict) => {
    const missing: string[] = []
    const empty: string[] = []
    const placeholderMismatch: string[] = []

    for (const key of baseKeys) {
      if (!(key in dict)) {
        missing.push(key)
        continue
      }
      const value = dict[key]
      if (typeof value !== 'string' || !value.trim()) {
        empty.push(key)
        continue
      }
      const expectedPh = extractPlaceholders(zhCn[key as keyof typeof zhCn])
      const actualPh = extractPlaceholders(value)
      if (JSON.stringify(expectedPh) !== JSON.stringify(actualPh)) {
        placeholderMismatch.push(`${key}: expected=${JSON.stringify(expectedPh)}, actual=${JSON.stringify(actualPh)}`)
      }
    }

    expect(missing).toEqual([])
    expect(empty).toEqual([])
    expect(placeholderMismatch).toEqual([])
  })
})
