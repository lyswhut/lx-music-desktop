import { toRaw } from '../../../../common/utils/vueTools'

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

const deepToRaw = <T>(value: T, seen: WeakMap<object, unknown>): T => {
  const raw = toRaw(value)
  if (typeof raw !== 'object' || raw === null) return raw
  if (seen.has(raw)) return seen.get(raw) as T

  if (Array.isArray(raw)) {
    let changed = false
    const next = new Array(raw.length)
    seen.set(raw, next)
    for (let i = 0; i < raw.length; i++) {
      const child = deepToRaw(raw[i], seen)
      if (child !== raw[i]) changed = true
      next[i] = child
    }
    if (!changed) {
      seen.set(raw, raw)
      return raw
    }
    return next as unknown as T
  }

  if (isPlainObject(raw)) {
    let changed = false
    const next: Record<string, unknown> = {}
    seen.set(raw, next)
    for (const key of Object.keys(raw)) {
      const child = deepToRaw(raw[key], seen)
      if (child !== raw[key]) changed = true
      next[key] = child
    }
    if (!changed) {
      seen.set(raw, raw)
      return raw
    }
    return next as unknown as T
  }

  return raw
}

/** 递归剥离歌曲对象及嵌套元数据中的 Vue 代理（结构共享，无嵌套代理时零拷贝）。 */
export const unwrapMusicInfos = (musicInfos: LX.Music.MusicInfo[]): LX.Music.MusicInfo[] => {
  const seen = new WeakMap<object, unknown>()
  return musicInfos.map(item => deepToRaw(item, seen))
}
