const fs = require('fs')
const path = require('path')

const files = [
  'src/renderer/components/base/VirtualizedList.vue',
  'src/renderer/components/layout/Toolbar/ControlBtns.vue',
  'src/renderer/views/Leaderboard/index.vue',
  'src/renderer/views/Leaderboard/MusicList/index.vue',
  'src/renderer/views/List/MusicList/index.vue',
  'src/renderer/views/Setting/components/SettingDownload.vue',
  'src/renderer/views/songList/List/components/SongList.vue',
  'src/renderer/views/songList/List/index.vue',
  'src/renderer/views/songList/List/ListView.vue',
]

const results = []

files.forEach((f) => {
  const fullPath = path.resolve(__dirname, f)
  try {
    const buf = fs.readFileSync(fullPath)
    const len = buf.length
    const lastBytes = buf.slice(Math.max(0, len - 20))
    const hex = lastBytes.toString('hex').match(/.{1,2}/g).join(' ')
    const text = lastBytes.toString('utf8').replace(/\r/g, '\\r').replace(/\n/g, '\\n\n')

    let lineEnding = 'UNKNOWN'
    let hasFinalNewline = false
    if (len >= 2 && buf[len - 2] === 0x0D && buf[len - 1] === 0x0A) {
      lineEnding = 'CRLF'
      hasFinalNewline = true
    } else if (len >= 1 && buf[len - 1] === 0x0A) {
      lineEnding = 'LF'
      hasFinalNewline = true
    } else if (len >= 1 && buf[len - 1] === 0x0D) {
      lineEnding = 'CR'
    } else {
      lineEnding = 'NONE (no trailing newline)'
    }

    // 检测文件的主流行尾
    const content = buf.toString('utf8')
    const crlfCount = (content.match(/\r\n/g) || []).length
    const lfOnlyCount = (content.match(/[^\r]\n/g) || []).length
    const dominantLineEnding = crlfCount > lfOnlyCount ? 'CRLF' : 'LF'

    results.push({
      file: f,
      totalBytes: len,
      lastBytesHex: hex,
      lastBytesAsText: JSON.stringify(lastBytes.toString('utf8')),
      lastLineEnding: lineEnding,
      hasFinalNewline,
      dominantLineEnding,
      crlfCount,
      lfOnlyCount,
    })

    // 如果没有末尾换行符，按照主流行尾格式添加一个
    if (!hasFinalNewline) {
      const newLine = dominantLineEnding === 'CRLF' ? '\r\n' : '\n'
      fs.writeFileSync(fullPath, Buffer.concat([buf, Buffer.from(newLine)]))
      results[results.length - 1].action = `FIXED: appended ${dominantLineEnding}`
    } else {
      results[results.length - 1].action = 'OK (already has trailing newline)'
    }
  } catch (e) {
    results.push({ file: f, error: String(e) })
  }
})

// 输出 JSON 以便 Read 工具读取
fs.writeFileSync(path.resolve(__dirname, 'deep-check-output.json'), JSON.stringify(results, null, 2), 'utf8')
console.log('Done. Results written to deep-check-output.json')