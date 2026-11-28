import { toMD5 } from '../utils'

export const sign = (query, body = '', now = Math.floor(Date.now() / 1000)) => {
  const stub = body ? toMD5(body) : ''
  const bytes = hex => hex.match(/../g).map(value => parseInt(value, 16))
  const input = [
    ...bytes(toMD5(query).slice(0, 8)),
    ...bytes(stub ? stub.slice(0, 8) : '00000000'),
    ...Array(8).fill(0),
    ...bytes(now.toString(16).padStart(8, '0')),
  ]
  const key = [30, 64, 224, 217, 147, 69, 0, 180]
  const table = Array.from({ length: 256 }, (_, index) => index)
  let tmp = null
  for (let i = 0; i < 256; i++) {
    let a = i == 0 ? 0 : (tmp ?? table[i - 1])
    if (a == 85 && i != 1 && tmp != 85) a = 0
    const c = (a + i + key[i % 8]) % 256
    tmp = c < i ? c : null
    table[i] = table[c]
  }
  const copy = table.slice()
  let previous = 0
  for (let i = 0; i < 20; i++) {
    const c = (table[i + 1] + previous) % 256
    previous = c
    const d = copy[c]
    copy[i + 1] = d
    input[i] ^= copy[(d * 2) % 256]
  }
  for (let i = 0; i < 20; i++) {
    let value = ((input[i] >>> 4) | (input[i] << 4)) & 255
    value ^= input[(i + 1) % 20]
    let reversed = 0
    for (let j = 0; j < 8; j++) reversed = (reversed << 1) | ((value >>> j) & 1)
    input[i] = (~(reversed ^ 20)) & 255
  }
  return {
    ...(stub ? { 'x-ss-stub': stub } : {}),
    'X-Gorgon': `0404b4d94000${input.map(value => value.toString(16).padStart(2, '0')).join('')}`,
    'X-Khronos': String(now),
  }
}
