import { Buffer } from 'buffer'

const V1_KEY_SIZE: number = 128
const V1_OFFSET_BOUNDARY: number = 0x7FFF
const FIRST_SEGMENT_SIZE: number = 0x0080
const OTHER_SEGMENT_SIZE: number = 0x1400
const RC4_STREAM_CACHE_SIZE: number = OTHER_SEGMENT_SIZE + 512

const EKEY_V2_PREFIX: Buffer = Buffer.from('UVFNdXNpYyBFbmNWMixLZXk6')
const EKEY_V2_KEY1: Buffer = Buffer.from([
  0x33, 0x38, 0x36, 0x5A, 0x4A, 0x59, 0x21, 0x40,
  0x23, 0x2A, 0x24, 0x25, 0x5E, 0x26, 0x29, 0x28,
])
const EKEY_V2_KEY2: Buffer = Buffer.from([
  0x2A, 0x2A, 0x23, 0x21, 0x28, 0x23, 0x24, 0x25,
  0x26, 0x5E, 0x61, 0x31, 0x63, 0x5A, 0x2C, 0x54,
])
const EKEY_SIMPLE_KEY: Buffer = Buffer.from([105, 86, 70, 56, 43, 32, 21, 11])

function b2i(buf: Buffer, off: number): number {
  return ((buf[off] << 24) | (buf[off + 1] << 16) | (buf[off + 2] << 8) | buf[off + 3]) >>> 0
}

function i2b(v: number, buf: Buffer, off: number): void {
  buf[off] = (v >>> 24) & 0xFF
  buf[off + 1] = (v >>> 16) & 0xFF
  buf[off + 2] = (v >>> 8) & 0xFF
  buf[off + 3] = v & 0xFF
}

function teaDecryptBlock(block: Buffer, off: number, k: number[]): void {
  let y = b2i(block, off)
  let z = b2i(block, off + 4)
  let sum = (0x9E3779B9 * 16) >>> 0
  for (let r = 0; r < 16; r++) {
    z = (z - ((((y << 4) >>> 0) + k[2]) ^ ((y + sum) >>> 0) ^ (((y >>> 5) + k[3]) >>> 0))) >>> 0
    y = (y - ((((z << 4) >>> 0) + k[0]) ^ ((z + sum) >>> 0) ^ (((z >>> 5) + k[1]) >>> 0))) >>> 0
    sum = (sum - 0x9E3779B9) >>> 0
  }
  i2b(y, block, off)
  i2b(z, block, off + 4)
}

function teaDecrypt(cipher: Buffer, key16: Buffer): Buffer | null {
  const cipherLen = cipher.length
  if (cipherLen < 16 || (cipherLen & 7) !== 0) return null

  const k = [b2i(key16, 0), b2i(key16, 4), b2i(key16, 8), b2i(key16, 12)]

  const dec = Buffer.from(cipher)
  const iv1 = Buffer.alloc(8)
  const iv2 = Buffer.alloc(8)
  const nextIv1 = Buffer.alloc(8)

  for (let i = 0; i < cipherLen; i += 8) {
    dec.copy(nextIv1, 0, i, i + 8)
    for (let x = 0; x < 8; x++) dec[i + x] ^= iv2[x]
    teaDecryptBlock(dec, i, k)
    dec.copy(iv2, 0, i, i + 8)
    for (let x = 0; x < 8; x++) dec[i + x] ^= iv1[x]
    nextIv1.copy(iv1)
  }

  const pad = dec[0] & 7
  const hdr = 3 + pad
  const tail = 7
  if (hdr + tail > cipherLen) return null

  return dec.subarray(hdr, cipherLen - tail)
}

function ekeyDecryptV1(ekey: Buffer): Buffer | null {
  if (ekey.length < 12) return null

  const raw = Buffer.from(ekey.toString('ascii'), 'base64')
  if (raw.length < 12) return null

  const teaKey = Buffer.alloc(16)
  for (let i = 0; i < 8; i++) {
    teaKey[i * 2] = EKEY_SIMPLE_KEY[i]
    teaKey[i * 2 + 1] = raw[i]
  }

  const payload = teaDecrypt(raw.subarray(8), teaKey)
  if (!payload) return null

  const out = Buffer.alloc(8 + payload.length)
  raw.copy(out, 0, 0, 8)
  payload.copy(out, 8)
  return out
}

function ekeyDecryptV2(ekey: Buffer): Buffer | null {
  const raw = Buffer.from(ekey.toString('ascii'), 'base64')

  const dec1 = teaDecrypt(raw, EKEY_V2_KEY1)
  if (!dec1) return null

  const dec2 = teaDecrypt(dec1, EKEY_V2_KEY2)
  if (!dec2) return null

  let v1Len = 0
  while (v1Len < dec2.length && dec2[v1Len] !== 0) v1Len++

  return ekeyDecryptV1(dec2.subarray(0, v1Len))
}

function ekeyDecrypt(ekey: Buffer): Buffer | null {
  if (ekey.length > EKEY_V2_PREFIX.length &&
    ekey.subarray(0, EKEY_V2_PREFIX.length).equals(EKEY_V2_PREFIX)) {
    return ekeyDecryptV2(ekey.subarray(EKEY_V2_PREFIX.length))
  }
  return ekeyDecryptV1(ekey)
}

function keyCompress(src: Buffer): Buffer {
  const dst = Buffer.alloc(V1_KEY_SIZE)
  for (let i = 0; i < V1_KEY_SIZE; i++) {
    const idx = (i * i + 71214) % src.length
    const b = src[idx]
    const shift = (idx + 4) % 8
    dst[i] = ((b << shift) | (b >>> (8 - shift))) & 0xFF
  }
  return dst
}

function mapDecrypt(key: Buffer, data: Buffer, offset: number): void {
  for (let i = 0; i < data.length; i++) {
    let off = offset + i
    if (off > V1_OFFSET_BOUNDARY) off = off % V1_OFFSET_BOUNDARY
    data[i] ^= key[off % V1_KEY_SIZE]
  }
}

function rc4Hash(key: Buffer): number {
  let h = 1
  for (let i = 0; i < key.length; i++) {
    if (key[i] === 0) continue
    const next = Math.imul(h, key[i]) >>> 0
    if (next === 0 || next <= h) break
    h = next
  }
  return h
}

function rc4SegmentKey(id: number, seed: number, hash: number): number {
  if (seed === 0) return 0
  return Math.trunc(hash / ((id + 1) * seed) * 100.0)
}

function rc4InitStream(key: Buffer, outLen: number): Buffer {
  const n = key.length
  const s = new Uint8Array(n)
  for (let i = 0; i < n; i++) s[i] = i & 0xFF

  let j = 0
  for (let i = 0; i < n; i++) {
    j = (j + s[i] + key[i % n]) % n
    const t = s[i]
    s[i] = s[j]
    s[j] = t
  }

  const out = Buffer.alloc(outLen)
  let si = 0; let sj = 0
  for (let k = 0; k < outLen; k++) {
    si = (si + 1) % n
    sj = (sj + s[si]) % n
    const t = s[si]
    s[si] = s[sj]
    s[sj] = t
    out[k] = s[(s[si] + s[sj]) % n]
  }
  return out
}

interface Rc4Ctx {
  key: Buffer
  keyLen: number
  hash: number
  keyStream: Buffer
}

function rc4Decrypt(ctx: Rc4Ctx, data: Buffer, offset: number): void {
  const n = ctx.keyLen
  let pos = 0

  if (offset < FIRST_SEGMENT_SIZE) {
    const block = Math.min(data.length, FIRST_SEGMENT_SIZE - offset)
    for (let i = 0; i < block; i++) {
      const off = offset + i
      const seed = ctx.key[off % n]
      const idx = Number(BigInt(Math.trunc(ctx.hash / ((off + 1) * seed) * 100.0)) % BigInt(n))
      data[i] ^= ctx.key[idx]
    }
    pos = block
    offset += block
  }

  const excess = offset % OTHER_SEGMENT_SIZE
  if (pos < data.length && excess !== 0) {
    const block = Math.min(data.length - pos, OTHER_SEGMENT_SIZE - excess)
    const id = Math.trunc(offset / OTHER_SEGMENT_SIZE)
    const seed = ctx.key[id % n]
    const skip = rc4SegmentKey(id, seed, ctx.hash) & 0x1FF
    for (let i = 0; i < block; i++) {
      data[pos + i] ^= ctx.keyStream[skip + excess + i]
    }
    pos += block
    offset += block
  }

  while (pos < data.length) {
    const block = Math.min(data.length - pos, OTHER_SEGMENT_SIZE)
    const id = Math.trunc(offset / OTHER_SEGMENT_SIZE)
    const seed = ctx.key[id % n]
    const skip = rc4SegmentKey(id, seed, ctx.hash) & 0x1FF
    for (let i = 0; i < block; i++) {
      data[pos + i] ^= ctx.keyStream[skip + i]
    }
    pos += block
    offset += block
  }
}

const CIPHER_MAP = 0
const CIPHER_RC4 = 1

export class MflacCrypto {
  private readonly _type: number
  private readonly _mapKey?: Buffer
  private readonly _rc4?: Rc4Ctx

  constructor(ekey: Buffer | Uint8Array | string) {
    let ekeyBuf: Buffer
    if (typeof ekey === 'string') {
      ekeyBuf = Buffer.from(ekey, 'ascii')
    } else if (ekey instanceof Buffer) {
      ekeyBuf = ekey
    } else {
      ekeyBuf = Buffer.from(ekey)
    }

    const key = ekeyDecrypt(ekeyBuf)
    if (!key) throw new Error('解密 ekey 失败')

    if (key.length <= 300) {
      this._type = CIPHER_MAP
      this._mapKey = keyCompress(key)
    } else {
      this._type = CIPHER_RC4
      this._rc4 = {
        key,
        keyLen: key.length,
        hash: rc4Hash(key),
        keyStream: rc4InitStream(key, RC4_STREAM_CACHE_SIZE),
      }
    }
  }

  decrypt(data: Buffer | Uint8Array, offset: number): Buffer {
    const out = Buffer.from(data)
    if (this._type === CIPHER_MAP && this._mapKey) {
      mapDecrypt(this._mapKey, out, offset)
    } else if (this._type === CIPHER_RC4 && this._rc4) {
      rc4Decrypt(this._rc4, out, offset)
    }
    return out
  }
}
