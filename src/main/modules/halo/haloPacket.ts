/**
 * HID协议包构建器
 *
 * 参考: HaloPixelToolBox (https://github.com/XFEstudio/HaloPixelToolBox)
 *       HaloLyricSync (Python)
 *
 * 协议:
 * - 设备: 花再 Halo PixelBar (HID, 64字节包)
 * - 文本包: Magic(4) + 0x00(1) + TotalLen(2) + TextLen(1) + Text(N) + Checksum(1) + Pad
 *   Magic: 0x2E 0xAA 0xEC 0xE8
 * - 布局/UI包: Magic(4) + ... ; Magic: 0x2E 0xAA 0xEC 0xEF
 * - 注意: byte 4 固定为 0x00 (参考实现无颜色字段，非零值导致固件崩溃)
 */

export enum TextLayout {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
  STRETCH = 'stretch',
  SCROLL_LEFT_TO_RIGHT = 'scroll_left_to_right',
  SCROLL_RIGHT_TO_LEFT = 'scroll_right_to_left',
}

export enum UIMode {
  CLOCK = 'clock',
  GAME = 'game',
  WORK = 'work',
  READ = 'read',
  CATS = 'cats',
  DOGS = 'dogs',
  MEMES = 'memes',
  CYBER = 'cyber',
  WAVES = 'waves',
}

const PACKET_LENGTH = 64

const LAYOUT_HEADER = [0x2E, 0xAA, 0xEC, 0xEF, 0x00, 0x09, 0x01, 0xF0, 0xB4, 0xC8, 0x00, 0x02]

const LAYOUT_BYTES: Record<TextLayout, number[]> = {
  [TextLayout.LEFT]: [0x00, 0x00, 0xFF, 0xFC, 0x00],
  [TextLayout.CENTER]: [0x00, 0x01, 0xFF, 0xFD, 0x00],
  [TextLayout.RIGHT]: [0x00, 0x02, 0xFF, 0xFE, 0x00],
  [TextLayout.STRETCH]: [0x00, 0x03, 0xFF, 0xFF, 0x00],
  [TextLayout.SCROLL_LEFT_TO_RIGHT]: [0x01, 0x00, 0xFF, 0xFD, 0x00],
  [TextLayout.SCROLL_RIGHT_TO_LEFT]: [0x01, 0x01, 0xFF, 0xFE, 0x00],
}

const UI_MODE_BYTES: Record<UIMode, number[]> = {
  [UIMode.CLOCK]: [0x00, 0xFF, 0xFF, 0xFB, 0x00],
  [UIMode.GAME]: [0x01, 0xFF, 0xFF, 0xFC, 0x00],
  [UIMode.WORK]: [0x02, 0xFF, 0xFF, 0xFD, 0x00],
  [UIMode.READ]: [0x03, 0xFF, 0xFF, 0xFE, 0x00],
  [UIMode.CATS]: [0x04, 0xFF, 0xFF, 0xFF, 0x00],
  [UIMode.DOGS]: [0x05, 0xFF, 0xFF, 0x00, 0x00],
  [UIMode.MEMES]: [0x06, 0xFF, 0xFF, 0x01, 0x00],
  [UIMode.CYBER]: [0x07, 0xFF, 0xFF, 0x02, 0x00],
  [UIMode.WAVES]: [0x08, 0xFF, 0xFF, 0x03, 0x00],
}

const WRITE_TEST_PACKET = Buffer.alloc(PACKET_LENGTH)
WRITE_TEST_PACKET.set([0x2E, 0xAA, 0xEC, 0xE8, 0x00, 0x06, 0x00, 0x04], 0)

function checksum(textBytes: Uint8Array): number {
  let acc = 128
  for (const b of textBytes) {
    acc += b + 2
  }
  return acc & 0xFF
}

function padPacket(data: number[]): Buffer {
  const buf = Buffer.alloc(PACKET_LENGTH)
  const len = Math.min(data.length, PACKET_LENGTH)
  for (let i = 0; i < len; i++) {
    buf[i] = data[i]
  }
  return buf
}

const MAX_TEXT_BYTES = 53

export function buildTextPacket(text: string): Buffer {
  const textBytes = Buffer.from(text, 'utf-8')
  const truncated = textBytes.subarray(0, MAX_TEXT_BYTES)
  const textBytesFinal = truncated.length === textBytes.length
    ? truncated
    : trimBrokenUtf8(truncated)
  const textLen = textBytesFinal.length
  const totalLen = 1 + textLen + 1

  const packet: number[] = []
  packet.push(0x2E, 0xAA, 0xEC, 0xE8, 0x00)
  packet.push(totalLen & 0xFF, (totalLen >> 8) & 0xFF)
  packet.push(textLen)
  for (const b of textBytesFinal) {
    packet.push(b)
  }
  packet.push(checksum(textBytesFinal))

  return padPacket(packet)
}

function trimBrokenUtf8(buf: Buffer): Buffer {
  let end = buf.length
  while (end > 0 && (buf[end - 1] & 0xC0) === 0x80) {
    end--
  }
  return buf.subarray(0, end)
}

export function buildLayoutPacket(layout: TextLayout): Buffer {
  const layoutBytes = LAYOUT_BYTES[layout] ?? LAYOUT_BYTES[TextLayout.CENTER]
  const packet = [...LAYOUT_HEADER, ...layoutBytes]
  return padPacket(packet)
}

export function buildUIModePacket(mode: UIMode): Buffer {
  const uiBytes = UI_MODE_BYTES[mode] ?? UI_MODE_BYTES[UIMode.CLOCK]
  const packet = [0x2E, 0xAA, 0xEC, 0xEF, 0x00, 0x09, 0x02, 0xF0, 0xB4, 0xC8, 0x00, 0x01, ...uiBytes]
  return padPacket(packet)
}

export function getWriteTestPacket(): Buffer {
  return WRITE_TEST_PACKET
}

export function toHex(packet: Buffer): string {
  return packet.toString('hex')
}
