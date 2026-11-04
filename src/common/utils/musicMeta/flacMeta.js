const path = require('path')
const fs = require('fs/promises')
const getImgSize = require('image-size')
const download = require('./downloader')

const extReg = /^(\.(?:jpe?g|png)).*$/

module.exports = async(filePath, meta, proxy) => {
  const { updateFile } = await import('music-metadata-editor')
  const patch = {
    title: meta.title,
    artist: meta.artist,
    album: meta.album,
  }
  if (meta.lyrics) patch.lyrics = meta.lyrics

  let picPath
  try {
    if (meta.APIC && /^http/.test(meta.APIC)) {
      const ext = path.extname(meta.APIC)
      picPath = filePath.replace(/\.flac$/, '') + (ext ? ext.replace(extReg, '$1') : '.jpg')
      let picUrl = meta.APIC
      if (picUrl.includes('music.126.net')) picUrl += `${picUrl.includes('?') ? '&' : '?'}param=500y500`
      if (await download(picUrl, picPath, proxy)) {
        const data = await fs.readFile(picPath)
        const { width, height } = getImgSize(data)
        const format = data[0] === 0x89 ? 'image/png' : 'image/jpeg'
        patch.picture = [{
          format,
          data,
          type: 'Cover (front)',
          description: '',
          width,
          height,
          colourDepth: format === 'image/png' ? 32 : 24,
        }]
      }
    }
    await updateFile(filePath, patch)
  } finally {
    if (picPath) {
      await fs.unlink(picPath).catch(err => {
        if (err.code !== 'ENOENT') console.log(err.message)
      })
    }
  }
}
