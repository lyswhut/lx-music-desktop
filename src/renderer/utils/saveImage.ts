import { fileURLToPath } from 'node:url'
import { openSaveDir } from '@renderer/utils/ipc'
import { httpFetch } from '@renderer/utils/request'
import { dialog } from '@renderer/plugins/Dialog'
import { filterFileName } from '@common/utils/common'
import { clipFileNameLength } from '@common/utils/tools'
import { extname, readFile } from '@common/utils/nodejs'

const mimeExtMap: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/svg+xml': 'svg',
}

const normalizeExt = (ext: string) => ext.replace(/^\./, '').toLowerCase()

const getExtFromMime = (mime?: string) => {
  if (!mime) return ''
  const key = mime.split(';')[0].trim().toLowerCase()
  return mimeExtMap[key] ?? ''
}

const getExtFromUrl = (url: string) => {
  try {
    return normalizeExt(extname(new URL(url).pathname))
  } catch {
    return normalizeExt(extname(url))
  }
}

const parseDataUrl = (url: string) => {
  const match = /^data:([^;]+);base64,(.*)$/i.exec(url)
  if (!match) return null
  const ext = getExtFromMime(match[1])
  return {
    buffer: Buffer.from(match[2], 'base64'),
    ext,
  }
}

const resolveImageData = async(url: string) => {
  if (url.startsWith('data:')) {
    const parsed = parseDataUrl(url)
    if (parsed) return parsed
  }

  if (/^https?:/i.test(url) || url.startsWith('//')) {
    const requestUrl = url.startsWith('//') ? `https:${url}` : url
    const response = await httpFetch(requestUrl, { method: 'get', timeout: 15000, format: 'buffer' }).promise
    if (response.statusCode && response.statusCode >= 400) throw new Error(`HTTP ${response.statusCode}`)
    const raw = (response as { raw?: Buffer | string }).raw
    const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw ?? '')
    if (!buffer.length) throw new Error('empty response')
    const ext = getExtFromUrl(requestUrl) || getExtFromMime(response.headers?.['content-type'] as string | undefined)
    return { buffer, ext }
  }

  const filePath = url.startsWith('file://') ? fileURLToPath(url) : url
  const buffer = await readFile(filePath)
  return { buffer, ext: normalizeExt(extname(filePath)) }
}

const ensureExt = (ext: string) => ext || 'jpg'

const buildDefaultFileName = (name: string, ext: string) => {
  const safeName = filterFileName(clipFileNameLength(name || 'image')) || 'image'
  return `${safeName}.${ext}`
}

const ensureFileExtension = (filePath: string, ext: string) => {
  return extname(filePath) ? filePath : `${filePath}.${ext}`
}

export const saveImage = async({ url, defaultName, title }: {
  url: string
  defaultName: string
  title: string
}) => {
  if (!url) return
  try {
    const { buffer, ext } = await resolveImageData(url)
    const normalizedExt = ensureExt(ext)
    const { canceled, filePath } = await openSaveDir({
      title,
      defaultPath: buildDefaultFileName(defaultName, normalizedExt),
    })
    if (canceled || !filePath) return
    await window.lx.worker.main.saveStrToFile(ensureFileExtension(filePath, normalizedExt), buffer)
  } catch (error) {
    console.log(error)
    const message = error instanceof Error ? error.message : String(error)
    dialog({
      message: window.i18n.t('save_image_failed', { message }),
      confirmButtonText: window.i18n.t('ok'),
    })
  }
}
