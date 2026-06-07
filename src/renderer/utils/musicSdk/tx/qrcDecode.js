import { inflate, constants } from 'zlib'

/**
 * QRC 歌词解密（3DES-ECB + zlib inflate）
 *
 * 由原 C++ native 插件（qrc_decode.node）1:1 移植为纯 JS 实现。
 * 加密算法为标准 3DES（DES-EDE3，ECB 模式、无填充），密钥固定。
 * 数据流程：hex 字符串 -> 字节 -> 3DES 解密 -> zlib inflate -> UTF-8 文本。
 */

const DES_ENCRYPT = 1
const DES_DECRYPT = 0

// DES S-box。注意：QRC 使用的是非标准 DES 变体，
// 其中 S2[23]=15、S4[53]=10 两处与标准 DES 不同（标准为 14、1）。
// 这两个值与原 native 插件（qrc_decode.node）二进制完全一致，不可改为标准值，
// 否则解密结果错误。下表逐字节对应原 C++ 实现。
const sbox = [
  [
    14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7, 0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8,
    4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0, 15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13,
  ],
  [
    15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10, 3, 13, 4, 7, 15, 2, 8, 15, 12, 0, 1, 10, 6, 9, 11, 5,
    0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15, 13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9,
  ],
  [
    10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8, 13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1,
    13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7, 1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12,
  ],
  [
    7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15, 13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9,
    10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4, 3, 15, 0, 6, 10, 10, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14,
  ],
  [
    2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9, 14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6,
    4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14, 11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3,
  ],
  [
    12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11, 10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8,
    9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6, 4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13,
  ],
  [
    4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1, 13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6,
    1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2, 6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12,
  ],
  [
    13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7, 1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2,
    7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8, 2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11,
  ],
]

const key_rnd_shift = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1]
const key_perm_c = [
  56, 48, 40, 32, 24, 16, 8, 0, 57, 49, 41, 33, 25, 17, 9, 1, 58, 50, 42, 34, 26, 18, 10, 2, 59, 51, 43, 35,
]
const key_perm_d = [
  62, 54, 46, 38, 30, 22, 14, 6, 61, 53, 45, 37, 29, 21, 13, 5, 60, 52, 44, 36, 28, 20, 12, 4, 27, 19, 11, 3,
]
const key_compression = [
  13, 16, 10, 23, 0, 4, 2, 27, 14, 5, 20, 9, 22, 18, 11, 3, 25, 7, 15, 6, 26, 19, 12, 1, 40, 51, 30, 36, 46,
  54, 29, 39, 50, 44, 32, 47, 43, 48, 38, 55, 33, 52, 45, 41, 49, 35, 28, 31,
]

// 全部以无符号 32 位处理，>>> 0 保证溢出行为与 C++ uint32_t 一致
const bitnum = (a, b, c) => (((a[((b / 32) | 0) * 4 + 3 - (((b % 32) / 8) | 0)] >>> (7 - (b % 8))) & 1) << c) >>> 0

const bitnum_intr = (a, b, c) => (((a >>> (31 - b)) & 1) << c) >>> 0

const bitnum_intl = (a, b, c) => (((((a << b) >>> 0) & 0x80000000) >>> 0) >>> c) >>> 0

const sbox_bit = a => (a & 32) | ((a & 31) >>> 1) | ((a & 1) << 4)

// 初始置换：返回 [s0, s1]
const initial_permutation = (input) => {
  const s0 = (
    bitnum(input, 57, 31) | bitnum(input, 49, 30) | bitnum(input, 41, 29) | bitnum(input, 33, 28) |
    bitnum(input, 25, 27) | bitnum(input, 17, 26) | bitnum(input, 9, 25) | bitnum(input, 1, 24) |
    bitnum(input, 59, 23) | bitnum(input, 51, 22) | bitnum(input, 43, 21) | bitnum(input, 35, 20) |
    bitnum(input, 27, 19) | bitnum(input, 19, 18) | bitnum(input, 11, 17) | bitnum(input, 3, 16) |
    bitnum(input, 61, 15) | bitnum(input, 53, 14) | bitnum(input, 45, 13) | bitnum(input, 37, 12) |
    bitnum(input, 29, 11) | bitnum(input, 21, 10) | bitnum(input, 13, 9) | bitnum(input, 5, 8) |
    bitnum(input, 63, 7) | bitnum(input, 55, 6) | bitnum(input, 47, 5) | bitnum(input, 39, 4) |
    bitnum(input, 31, 3) | bitnum(input, 23, 2) | bitnum(input, 15, 1) | bitnum(input, 7, 0)
  ) >>> 0
  const s1 = (
    bitnum(input, 56, 31) | bitnum(input, 48, 30) | bitnum(input, 40, 29) | bitnum(input, 32, 28) |
    bitnum(input, 24, 27) | bitnum(input, 16, 26) | bitnum(input, 8, 25) | bitnum(input, 0, 24) |
    bitnum(input, 58, 23) | bitnum(input, 50, 22) | bitnum(input, 42, 21) | bitnum(input, 34, 20) |
    bitnum(input, 26, 19) | bitnum(input, 18, 18) | bitnum(input, 10, 17) | bitnum(input, 2, 16) |
    bitnum(input, 60, 15) | bitnum(input, 52, 14) | bitnum(input, 44, 13) | bitnum(input, 36, 12) |
    bitnum(input, 28, 11) | bitnum(input, 20, 10) | bitnum(input, 12, 9) | bitnum(input, 4, 8) |
    bitnum(input, 62, 7) | bitnum(input, 54, 6) | bitnum(input, 46, 5) | bitnum(input, 38, 4) |
    bitnum(input, 30, 3) | bitnum(input, 22, 2) | bitnum(input, 14, 1) | bitnum(input, 6, 0)
  ) >>> 0
  return [s0, s1]
}

// 逆置换：将 s0/s1 写回 8 字节 out
const inverse_permutation = (s0, s1, out) => {
  out[3] = (bitnum_intr(s1, 7, 7) | bitnum_intr(s0, 7, 6) | bitnum_intr(s1, 15, 5) | bitnum_intr(s0, 15, 4) | bitnum_intr(s1, 23, 3) | bitnum_intr(s0, 23, 2) | bitnum_intr(s1, 31, 1) | bitnum_intr(s0, 31, 0)) & 0xff
  out[2] = (bitnum_intr(s1, 6, 7) | bitnum_intr(s0, 6, 6) | bitnum_intr(s1, 14, 5) | bitnum_intr(s0, 14, 4) | bitnum_intr(s1, 22, 3) | bitnum_intr(s0, 22, 2) | bitnum_intr(s1, 30, 1) | bitnum_intr(s0, 30, 0)) & 0xff
  out[1] = (bitnum_intr(s1, 5, 7) | bitnum_intr(s0, 5, 6) | bitnum_intr(s1, 13, 5) | bitnum_intr(s0, 13, 4) | bitnum_intr(s1, 21, 3) | bitnum_intr(s0, 21, 2) | bitnum_intr(s1, 29, 1) | bitnum_intr(s0, 29, 0)) & 0xff
  out[0] = (bitnum_intr(s1, 4, 7) | bitnum_intr(s0, 4, 6) | bitnum_intr(s1, 12, 5) | bitnum_intr(s0, 12, 4) | bitnum_intr(s1, 20, 3) | bitnum_intr(s0, 20, 2) | bitnum_intr(s1, 28, 1) | bitnum_intr(s0, 28, 0)) & 0xff
  out[7] = (bitnum_intr(s1, 3, 7) | bitnum_intr(s0, 3, 6) | bitnum_intr(s1, 11, 5) | bitnum_intr(s0, 11, 4) | bitnum_intr(s1, 19, 3) | bitnum_intr(s0, 19, 2) | bitnum_intr(s1, 27, 1) | bitnum_intr(s0, 27, 0)) & 0xff
  out[6] = (bitnum_intr(s1, 2, 7) | bitnum_intr(s0, 2, 6) | bitnum_intr(s1, 10, 5) | bitnum_intr(s0, 10, 4) | bitnum_intr(s1, 18, 3) | bitnum_intr(s0, 18, 2) | bitnum_intr(s1, 26, 1) | bitnum_intr(s0, 26, 0)) & 0xff
  out[5] = (bitnum_intr(s1, 1, 7) | bitnum_intr(s0, 1, 6) | bitnum_intr(s1, 9, 5) | bitnum_intr(s0, 9, 4) | bitnum_intr(s1, 17, 3) | bitnum_intr(s0, 17, 2) | bitnum_intr(s1, 25, 1) | bitnum_intr(s0, 25, 0)) & 0xff
  out[4] = (bitnum_intr(s1, 0, 7) | bitnum_intr(s0, 0, 6) | bitnum_intr(s1, 8, 5) | bitnum_intr(s0, 8, 4) | bitnum_intr(s1, 16, 3) | bitnum_intr(s0, 16, 2) | bitnum_intr(s1, 24, 1) | bitnum_intr(s0, 24, 0)) & 0xff
}

// Feistel 轮函数 f(state, key)
const des_f = (state, key) => {
  const t1 = (
    bitnum_intl(state, 31, 0) | (((state & 0xF0000000) >>> 0) >>> 1) | bitnum_intl(state, 4, 5) |
    bitnum_intl(state, 3, 6) | (((state & 0x0F000000) >>> 0) >>> 3) | bitnum_intl(state, 8, 11) |
    bitnum_intl(state, 7, 12) | (((state & 0x00F00000) >>> 0) >>> 5) | bitnum_intl(state, 12, 17) |
    bitnum_intl(state, 11, 18) | (((state & 0x000F0000) >>> 0) >>> 7) | bitnum_intl(state, 16, 23)
  ) >>> 0
  const t2 = (
    bitnum_intl(state, 15, 0) | (((state & 0x0000F000) << 15) >>> 0) | bitnum_intl(state, 20, 5) |
    bitnum_intl(state, 19, 6) | (((state & 0x00000F00) << 13) >>> 0) | bitnum_intl(state, 24, 11) |
    bitnum_intl(state, 23, 12) | (((state & 0x000000F0) << 11) >>> 0) | bitnum_intl(state, 28, 17) |
    bitnum_intl(state, 27, 18) | (((state & 0x0000000F) << 9) >>> 0) | bitnum_intl(state, 0, 23)
  ) >>> 0

  const lrgstate = [
    (t1 >>> 24) & 0xFF, (t1 >>> 16) & 0xFF, (t1 >>> 8) & 0xFF,
    (t2 >>> 24) & 0xFF, (t2 >>> 16) & 0xFF, (t2 >>> 8) & 0xFF,
  ]
  for (let i = 0; i < 6; i++) lrgstate[i] ^= key[i]

  let s = (
    (sbox[0][sbox_bit(lrgstate[0] >>> 2)] << 28) |
    (sbox[1][sbox_bit(((lrgstate[0] & 0x03) << 4) | (lrgstate[1] >>> 4))] << 24) |
    (sbox[2][sbox_bit(((lrgstate[1] & 0x0F) << 2) | (lrgstate[2] >>> 6))] << 20) |
    (sbox[3][sbox_bit(lrgstate[2] & 0x3F)] << 16) |
    (sbox[4][sbox_bit(lrgstate[3] >>> 2)] << 12) |
    (sbox[5][sbox_bit(((lrgstate[3] & 0x03) << 4) | (lrgstate[4] >>> 4))] << 8) |
    (sbox[6][sbox_bit(((lrgstate[4] & 0x0F) << 2) | (lrgstate[5] >>> 6))] << 4) |
    sbox[7][sbox_bit(lrgstate[5] & 0x3F)]
  ) >>> 0

  return (
    bitnum_intl(s, 15, 0) | bitnum_intl(s, 6, 1) | bitnum_intl(s, 19, 2) | bitnum_intl(s, 20, 3) |
    bitnum_intl(s, 28, 4) | bitnum_intl(s, 11, 5) | bitnum_intl(s, 27, 6) | bitnum_intl(s, 16, 7) |
    bitnum_intl(s, 0, 8) | bitnum_intl(s, 14, 9) | bitnum_intl(s, 22, 10) | bitnum_intl(s, 25, 11) |
    bitnum_intl(s, 4, 12) | bitnum_intl(s, 17, 13) | bitnum_intl(s, 30, 14) | bitnum_intl(s, 9, 15) |
    bitnum_intl(s, 1, 16) | bitnum_intl(s, 7, 17) | bitnum_intl(s, 23, 18) | bitnum_intl(s, 13, 19) |
    bitnum_intl(s, 31, 20) | bitnum_intl(s, 26, 21) | bitnum_intl(s, 2, 22) | bitnum_intl(s, 8, 23) |
    bitnum_intl(s, 18, 24) | bitnum_intl(s, 12, 25) | bitnum_intl(s, 29, 26) | bitnum_intl(s, 5, 27) |
    bitnum_intl(s, 21, 28) | bitnum_intl(s, 10, 29) | bitnum_intl(s, 3, 30) | bitnum_intl(s, 24, 31)
  ) >>> 0
}

// 单次 DES 加/解密一个 8 字节分组（轮密钥 schedule 为 16x6）
const des_crypt = (input, schedule, output) => {
  let [s0, s1] = initial_permutation(input)
  for (let i = 0; i < 15; i++) {
    const prev = s1
    s1 = (des_f(s1, schedule[i]) ^ s0) >>> 0
    s0 = prev
  }
  s0 = (des_f(s1, schedule[15]) ^ s0) >>> 0
  inverse_permutation(s0, s1, output)
}

// 生成 16 轮子密钥
const key_schedule = (key, mode) => {
  const schedule = Array.from({ length: 16 }, () => new Uint8Array(6))
  let c = 0
  let d = 0
  for (let i = 0; i < 28; i++) {
    c = (c | bitnum(key, key_perm_c[i], 31 - i)) >>> 0
    d = (d | bitnum(key, key_perm_d[i], 31 - i)) >>> 0
  }
  for (let i = 0; i < 16; i++) {
    c = ((((c << key_rnd_shift[i]) >>> 0) | (c >>> (28 - key_rnd_shift[i]))) & 0xFFFFFFF0) >>> 0
    d = ((((d << key_rnd_shift[i]) >>> 0) | (d >>> (28 - key_rnd_shift[i]))) & 0xFFFFFFF0) >>> 0
    const togen = mode === DES_DECRYPT ? 15 - i : i
    for (let j = 0; j < 24; j++) {
      schedule[togen][(j / 8) | 0] |= bitnum_intr(c, key_compression[j], 7 - (j % 8))
    }
    for (let j = 24; j < 48; j++) {
      schedule[togen][(j / 8) | 0] |= bitnum_intr(d, key_compression[j] - 27, 7 - (j % 8))
    }
  }
  return schedule
}

// 3DES（EDE3）密钥编排，返回 3 组 schedule
const tripledes_key_setup = (key, mode) => {
  if (mode === DES_ENCRYPT) {
    return [
      key_schedule(key.subarray(0, 8), DES_ENCRYPT),
      key_schedule(key.subarray(8, 16), DES_DECRYPT),
      key_schedule(key.subarray(16, 24), DES_ENCRYPT),
    ]
  }
  return [
    key_schedule(key.subarray(16, 24), DES_DECRYPT),
    key_schedule(key.subarray(8, 16), DES_ENCRYPT),
    key_schedule(key.subarray(0, 8), DES_DECRYPT),
  ]
}

// 3DES 加/解密一个 8 字节分组
const tripledes_crypt = (input, schedule, output) => {
  const buf = new Uint8Array(8)
  des_crypt(input, schedule[0], buf)
  des_crypt(buf, schedule[1], output)
  des_crypt(output, schedule[2], buf)
  output.set(buf)
}

// QRC 固定密钥：!@#)(*$%123ZXC!@!@#)(NHL
const QRC_KEY = Buffer.from([
  0x21, 0x40, 0x23, 0x29, 0x28, 0x2a, 0x24, 0x25, 0x31, 0x32, 0x33, 0x5a,
  0x58, 0x43, 0x21, 0x40, 0x21, 0x40, 0x23, 0x29, 0x28, 0x4e, 0x48, 0x4c,
])

const handleInflate = (data) => new Promise((resolve, reject) => {
  // Z_SYNC_FLUSH：容忍尾部不完整的 zlib 流（对应原实现忽略 Z_BUF_ERROR 的行为）
  inflate(data, { finishFlush: constants.Z_SYNC_FLUSH }, (err, result) => {
    if (err) reject(err)
    else resolve(result)
  })
})
/**
 * 解密腾讯 QRC 歌词。
 * @param {string} hexData 服务端返回的十六进制字符串
 * @returns {Promise<string>} 解密并解压后的歌词文本（解析失败时返回空字符串）
 */
export const decodeQrc = async(hexData) => {
  if (!hexData || hexData.length % 2 !== 0) return ''
  const encrypted = Buffer.from(hexData, 'hex')
  if (encrypted.length === 0) return ''

  const schedule = tripledes_key_setup(QRC_KEY, DES_DECRYPT)

  const block = new Uint8Array(8)
  for (let i = 0; i + 8 <= encrypted.length; i += 8) {
    tripledes_crypt(encrypted.subarray(i, i + 8), schedule, block)
    encrypted.set(block, i)
  }

  try {
    const result = await handleInflate(encrypted)
    return result.toString('utf8')
  } catch {
    return ''
  }
}
