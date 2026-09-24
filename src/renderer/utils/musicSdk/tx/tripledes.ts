/**
 * Triple DES 实现
 * 移植自 LDDC 项目: https://github.com/chenmozhijin/LDDC
 * 原始代码: LDDC/core/decryptor/tripledes.py
 * https://github.com/imsyy/SPlayer/blob/159f2e4de772f477ca72af3fb99938238f81a32f/electron/server/qqmusic/tripledes.ts
 */

const ENCRYPT = 1
const DECRYPT = 0

// S-boxes
const sbox: number[][] = [
  // sbox1
  [
    14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7, 0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11,
    9, 5, 3, 8, 4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0, 15, 12, 8, 2, 4, 9, 1, 7, 5,
    11, 3, 14, 10, 0, 6, 13,
  ],
  // sbox2
  [
    15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10, 3, 13, 4, 7, 15, 2, 8, 15, 12, 0, 1, 10,
    6, 9, 11, 5, 0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15, 13, 8, 10, 1, 3, 15, 4, 2,
    11, 6, 7, 12, 0, 5, 14, 9,
  ],
  // sbox3
  [
    10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8, 13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12,
    11, 15, 1, 13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7, 1, 10, 13, 0, 6, 9, 8, 7, 4,
    15, 14, 3, 11, 5, 2, 12,
  ],
  // sbox4
  [
    7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15, 13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1,
    10, 14, 9, 10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4, 3, 15, 0, 6, 10, 10, 13, 8, 9,
    4, 5, 11, 12, 7, 2, 14,
  ],
  // sbox5
  [
    2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9, 14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10,
    3, 9, 8, 6, 4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14, 11, 8, 12, 7, 1, 14, 2, 13, 6,
    15, 0, 9, 10, 4, 5, 3,
  ],
  // sbox6
  [
    12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11, 10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14,
    0, 11, 3, 8, 9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6, 4, 3, 2, 12, 9, 5, 15, 10,
    11, 14, 1, 7, 6, 0, 8, 13,
  ],
  // sbox7
  [
    4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1, 13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12,
    2, 15, 8, 6, 1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2, 6, 11, 13, 8, 1, 4, 10, 7, 9,
    5, 0, 15, 14, 2, 3, 12,
  ],
  // sbox8
  [
    13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7, 1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11,
    0, 14, 9, 2, 7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8, 2, 1, 14, 7, 4, 10, 8, 13,
    15, 12, 9, 0, 3, 5, 6, 11,
  ],
]

function bitnum(a: Uint8Array, b: number, c: number): number {
  // 原始 Python: ((a[(b // 32) * 4 + 3 - (b % 32) // 8] >> (7 - b % 8)) & 1) << c
  const byteIndex = Math.floor(b / 32) * 4 + 3 - Math.floor((b % 32) / 8)
  return ((a[byteIndex] >> (7 - (b % 8))) & 1) << c
}

function bitnumIntr(a: number, b: number, c: number): number {
  return ((a >> (31 - b)) & 1) << c
}

function bitnumIntl(a: number, b: number, c: number): number {
  return (((a << b) & 0x80000000) >>> c) >>> 0
}

function sboxBit(a: number): number {
  return (a & 32) | ((a & 31) >> 1) | ((a & 1) << 4)
}

function initialPermutation(inputData: Uint8Array): [number, number] {
  const s0 =
    (bitnum(inputData, 57, 31) |
      bitnum(inputData, 49, 30) |
      bitnum(inputData, 41, 29) |
      bitnum(inputData, 33, 28) |
      bitnum(inputData, 25, 27) |
      bitnum(inputData, 17, 26) |
      bitnum(inputData, 9, 25) |
      bitnum(inputData, 1, 24) |
      bitnum(inputData, 59, 23) |
      bitnum(inputData, 51, 22) |
      bitnum(inputData, 43, 21) |
      bitnum(inputData, 35, 20) |
      bitnum(inputData, 27, 19) |
      bitnum(inputData, 19, 18) |
      bitnum(inputData, 11, 17) |
      bitnum(inputData, 3, 16) |
      bitnum(inputData, 61, 15) |
      bitnum(inputData, 53, 14) |
      bitnum(inputData, 45, 13) |
      bitnum(inputData, 37, 12) |
      bitnum(inputData, 29, 11) |
      bitnum(inputData, 21, 10) |
      bitnum(inputData, 13, 9) |
      bitnum(inputData, 5, 8) |
      bitnum(inputData, 63, 7) |
      bitnum(inputData, 55, 6) |
      bitnum(inputData, 47, 5) |
      bitnum(inputData, 39, 4) |
      bitnum(inputData, 31, 3) |
      bitnum(inputData, 23, 2) |
      bitnum(inputData, 15, 1) |
      bitnum(inputData, 7, 0)) >>>
    0

  const s1 =
    (bitnum(inputData, 56, 31) |
      bitnum(inputData, 48, 30) |
      bitnum(inputData, 40, 29) |
      bitnum(inputData, 32, 28) |
      bitnum(inputData, 24, 27) |
      bitnum(inputData, 16, 26) |
      bitnum(inputData, 8, 25) |
      bitnum(inputData, 0, 24) |
      bitnum(inputData, 58, 23) |
      bitnum(inputData, 50, 22) |
      bitnum(inputData, 42, 21) |
      bitnum(inputData, 34, 20) |
      bitnum(inputData, 26, 19) |
      bitnum(inputData, 18, 18) |
      bitnum(inputData, 10, 17) |
      bitnum(inputData, 2, 16) |
      bitnum(inputData, 60, 15) |
      bitnum(inputData, 52, 14) |
      bitnum(inputData, 44, 13) |
      bitnum(inputData, 36, 12) |
      bitnum(inputData, 28, 11) |
      bitnum(inputData, 20, 10) |
      bitnum(inputData, 12, 9) |
      bitnum(inputData, 4, 8) |
      bitnum(inputData, 62, 7) |
      bitnum(inputData, 54, 6) |
      bitnum(inputData, 46, 5) |
      bitnum(inputData, 38, 4) |
      bitnum(inputData, 30, 3) |
      bitnum(inputData, 22, 2) |
      bitnum(inputData, 14, 1) |
      bitnum(inputData, 6, 0)) >>>
    0

  return [s0, s1]
}

function inversePermutation(s0: number, s1: number): Uint8Array {
  const data = new Uint8Array(8)

  data[3] =
    bitnumIntr(s1, 7, 7) |
    bitnumIntr(s0, 7, 6) |
    bitnumIntr(s1, 15, 5) |
    bitnumIntr(s0, 15, 4) |
    bitnumIntr(s1, 23, 3) |
    bitnumIntr(s0, 23, 2) |
    bitnumIntr(s1, 31, 1) |
    bitnumIntr(s0, 31, 0)

  data[2] =
    bitnumIntr(s1, 6, 7) |
    bitnumIntr(s0, 6, 6) |
    bitnumIntr(s1, 14, 5) |
    bitnumIntr(s0, 14, 4) |
    bitnumIntr(s1, 22, 3) |
    bitnumIntr(s0, 22, 2) |
    bitnumIntr(s1, 30, 1) |
    bitnumIntr(s0, 30, 0)

  data[1] =
    bitnumIntr(s1, 5, 7) |
    bitnumIntr(s0, 5, 6) |
    bitnumIntr(s1, 13, 5) |
    bitnumIntr(s0, 13, 4) |
    bitnumIntr(s1, 21, 3) |
    bitnumIntr(s0, 21, 2) |
    bitnumIntr(s1, 29, 1) |
    bitnumIntr(s0, 29, 0)

  data[0] =
    bitnumIntr(s1, 4, 7) |
    bitnumIntr(s0, 4, 6) |
    bitnumIntr(s1, 12, 5) |
    bitnumIntr(s0, 12, 4) |
    bitnumIntr(s1, 20, 3) |
    bitnumIntr(s0, 20, 2) |
    bitnumIntr(s1, 28, 1) |
    bitnumIntr(s0, 28, 0)

  data[7] =
    bitnumIntr(s1, 3, 7) |
    bitnumIntr(s0, 3, 6) |
    bitnumIntr(s1, 11, 5) |
    bitnumIntr(s0, 11, 4) |
    bitnumIntr(s1, 19, 3) |
    bitnumIntr(s0, 19, 2) |
    bitnumIntr(s1, 27, 1) |
    bitnumIntr(s0, 27, 0)

  data[6] =
    bitnumIntr(s1, 2, 7) |
    bitnumIntr(s0, 2, 6) |
    bitnumIntr(s1, 10, 5) |
    bitnumIntr(s0, 10, 4) |
    bitnumIntr(s1, 18, 3) |
    bitnumIntr(s0, 18, 2) |
    bitnumIntr(s1, 26, 1) |
    bitnumIntr(s0, 26, 0)

  data[5] =
    bitnumIntr(s1, 1, 7) |
    bitnumIntr(s0, 1, 6) |
    bitnumIntr(s1, 9, 5) |
    bitnumIntr(s0, 9, 4) |
    bitnumIntr(s1, 17, 3) |
    bitnumIntr(s0, 17, 2) |
    bitnumIntr(s1, 25, 1) |
    bitnumIntr(s0, 25, 0)

  data[4] =
    bitnumIntr(s1, 0, 7) |
    bitnumIntr(s0, 0, 6) |
    bitnumIntr(s1, 8, 5) |
    bitnumIntr(s0, 8, 4) |
    bitnumIntr(s1, 16, 3) |
    bitnumIntr(s0, 16, 2) |
    bitnumIntr(s1, 24, 1) |
    bitnumIntr(s0, 24, 0)

  return data
}

function f(state: number, key: number[]): number {
  const t1 =
    (bitnumIntl(state, 31, 0) |
      ((state & 0xf0000000) >>> 1) |
      bitnumIntl(state, 4, 5) |
      bitnumIntl(state, 3, 6) |
      ((state & 0x0f000000) >>> 3) |
      bitnumIntl(state, 8, 11) |
      bitnumIntl(state, 7, 12) |
      ((state & 0x00f00000) >>> 5) |
      bitnumIntl(state, 12, 17) |
      bitnumIntl(state, 11, 18) |
      ((state & 0x000f0000) >>> 7) |
      bitnumIntl(state, 16, 23)) >>>
    0

  const t2 =
    (bitnumIntl(state, 15, 0) |
      ((state & 0x0000f000) << 15) |
      bitnumIntl(state, 20, 5) |
      bitnumIntl(state, 19, 6) |
      ((state & 0x00000f00) << 13) |
      bitnumIntl(state, 24, 11) |
      bitnumIntl(state, 23, 12) |
      ((state & 0x000000f0) << 11) |
      bitnumIntl(state, 28, 17) |
      bitnumIntl(state, 27, 18) |
      ((state & 0x0000000f) << 9) |
      bitnumIntl(state, 0, 23)) >>>
    0

  const lrgstate = [
    ((t1 >>> 24) & 0x000000ff) ^ key[0],
    ((t1 >>> 16) & 0x000000ff) ^ key[1],
    ((t1 >>> 8) & 0x000000ff) ^ key[2],
    ((t2 >>> 24) & 0x000000ff) ^ key[3],
    ((t2 >>> 16) & 0x000000ff) ^ key[4],
    ((t2 >>> 8) & 0x000000ff) ^ key[5],
  ]

  state =
    ((sbox[0][sboxBit(lrgstate[0] >>> 2)] << 28) |
      (sbox[1][sboxBit(((lrgstate[0] & 0x03) << 4) | (lrgstate[1] >>> 4))] << 24) |
      (sbox[2][sboxBit(((lrgstate[1] & 0x0f) << 2) | (lrgstate[2] >>> 6))] << 20) |
      (sbox[3][sboxBit(lrgstate[2] & 0x3f)] << 16) |
      (sbox[4][sboxBit(lrgstate[3] >>> 2)] << 12) |
      (sbox[5][sboxBit(((lrgstate[3] & 0x03) << 4) | (lrgstate[4] >>> 4))] << 8) |
      (sbox[6][sboxBit(((lrgstate[4] & 0x0f) << 2) | (lrgstate[5] >>> 6))] << 4) |
      sbox[7][sboxBit(lrgstate[5] & 0x3f)]) >>>
    0

  return (
    (bitnumIntl(state, 15, 0) |
      bitnumIntl(state, 6, 1) |
      bitnumIntl(state, 19, 2) |
      bitnumIntl(state, 20, 3) |
      bitnumIntl(state, 28, 4) |
      bitnumIntl(state, 11, 5) |
      bitnumIntl(state, 27, 6) |
      bitnumIntl(state, 16, 7) |
      bitnumIntl(state, 0, 8) |
      bitnumIntl(state, 14, 9) |
      bitnumIntl(state, 22, 10) |
      bitnumIntl(state, 25, 11) |
      bitnumIntl(state, 4, 12) |
      bitnumIntl(state, 17, 13) |
      bitnumIntl(state, 30, 14) |
      bitnumIntl(state, 9, 15) |
      bitnumIntl(state, 1, 16) |
      bitnumIntl(state, 7, 17) |
      bitnumIntl(state, 23, 18) |
      bitnumIntl(state, 13, 19) |
      bitnumIntl(state, 31, 20) |
      bitnumIntl(state, 26, 21) |
      bitnumIntl(state, 2, 22) |
      bitnumIntl(state, 8, 23) |
      bitnumIntl(state, 18, 24) |
      bitnumIntl(state, 12, 25) |
      bitnumIntl(state, 29, 26) |
      bitnumIntl(state, 5, 27) |
      bitnumIntl(state, 21, 28) |
      bitnumIntl(state, 10, 29) |
      bitnumIntl(state, 3, 30) |
      bitnumIntl(state, 24, 31)) >>>
    0
  )
}

function crypt(inputData: Uint8Array, key: number[][]): Uint8Array {
  let [s0, s1] = initialPermutation(inputData)

  for (let idx = 0; idx < 15; idx++) {
    const previousS1 = s1
    s1 = (f(s1, key[idx]) ^ s0) >>> 0
    s0 = previousS1
  }
  s0 = (f(s1, key[15]) ^ s0) >>> 0

  return inversePermutation(s0, s1)
}

function keySchedule(key: Uint8Array, mode: number): number[][] {
  const schedule: number[][] = Array.from({ length: 16 }, () => Array(6).fill(0))
  const keyRndShift = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1]
  const keyPermC = [
    56, 48, 40, 32, 24, 16, 8, 0, 57, 49, 41, 33, 25, 17, 9, 1, 58, 50, 42, 34, 26, 18, 10, 2, 59,
    51, 43, 35,
  ]
  const keyPermD = [
    62, 54, 46, 38, 30, 22, 14, 6, 61, 53, 45, 37, 29, 21, 13, 5, 60, 52, 44, 36, 28, 20, 12, 4, 27,
    19, 11, 3,
  ]
  const keyCompression = [
    13, 16, 10, 23, 0, 4, 2, 27, 14, 5, 20, 9, 22, 18, 11, 3, 25, 7, 15, 6, 26, 19, 12, 1, 40, 51,
    30, 36, 46, 54, 29, 39, 50, 44, 32, 47, 43, 48, 38, 55, 33, 52, 45, 41, 49, 35, 28, 31,
  ]

  let c = 0
  let d = 0
  for (let i = 0; i < 28; i++) {
    c |= bitnum(key, keyPermC[i], 31 - i)
    d |= bitnum(key, keyPermD[i], 31 - i)
  }

  for (let i = 0; i < 16; i++) {
    c = (((c << keyRndShift[i]) | (c >>> (28 - keyRndShift[i]))) & 0xfffffff0) >>> 0
    d = (((d << keyRndShift[i]) | (d >>> (28 - keyRndShift[i]))) & 0xfffffff0) >>> 0

    const togen = mode === DECRYPT ? 15 - i : i

    for (let j = 0; j < 6; j++) {
      schedule[togen][j] = 0
    }

    for (let j = 0; j < 24; j++) {
      schedule[togen][Math.floor(j / 8)] |= bitnumIntr(c, keyCompression[j], 7 - (j % 8))
    }

    for (let j = 24; j < 48; j++) {
      schedule[togen][Math.floor(j / 8)] |= bitnumIntr(d, keyCompression[j] - 27, 7 - (j % 8))
    }
  }

  return schedule
}

function tripleDesKeySetup(key: Uint8Array, mode: number): number[][][] {
  if (mode === ENCRYPT) {
    return [
      keySchedule(key.slice(0), ENCRYPT),
      keySchedule(key.slice(8), DECRYPT),
      keySchedule(key.slice(16), ENCRYPT),
    ]
  }
  return [
    keySchedule(key.slice(16), DECRYPT),
    keySchedule(key.slice(8), ENCRYPT),
    keySchedule(key.slice(0), DECRYPT),
  ]
}

function tripleDesCrypt(data: Uint8Array, key: number[][][]): Uint8Array {
  let result = data
  for (let i = 0; i < 3; i++) {
    result = crypt(result, key[i])
  }
  return result
}

/**
 * 解密 QRC 歌词
 * @param encryptedData - 加密的字节数组
 * @param key - 24字节密钥
 * @returns 解密后的字节数组
 */
export function qrcDecrypt(encryptedData: Uint8Array, key: Uint8Array): Uint8Array {
  const schedule = tripleDesKeySetup(key, DECRYPT)
  const result: number[] = []

  // 以 8 字节为单位迭代
  for (let i = 0; i < encryptedData.length; i += 8) {
    const block = encryptedData.slice(i, i + 8)
    const decrypted = tripleDesCrypt(block, schedule)
    result.push(...decrypted)
  }

  return new Uint8Array(result)
}
