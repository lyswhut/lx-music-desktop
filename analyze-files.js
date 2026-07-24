const fs = require('fs')
const path = require('path')

const rootDir = __dirname

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

const lines = []

files.forEach(f => {
  const fullPath = path.join(rootDir, f)
  const content = fs.readFileSync(fullPath, 'utf8')
  const contentLines = content.split('\n')
  const totalLines = contentLines.length
  const last10 = contentLines.slice(Math.max(0, totalLines - 10))
  const lastBytes = Buffer.from(content).slice(-50)
  const hex = lastBytes.toString('hex').match(/.{1,2}/g).join(' ')

  lines.push(`=== ${f} (${totalLines} lines) ===`)
  lines.push('Last 10 lines:')
  last10.forEach((line, i) => {
    const lineNum = totalLines - last10.length + i + 1
    lines.push(`  ${String(lineNum).padStart(3)} | ${line}`)
  })
  lines.push(`Last 50 bytes hex: ${hex}`)
  lines.push(`Last 50 bytes as text: ${JSON.stringify(lastBytes.toString())}`)
  lines.push(`Ends with \\n: ${content.endsWith('\n')}`)
  lines.push(`Ends with \\r\\n: ${content.endsWith('\r\n')}`)
  lines.push(`Last char code: ${content.charCodeAt(content.length - 1)}`)
  lines.push('')
})

fs.writeFileSync(path.join(rootDir, 'file-structure.txt'), lines.join('\n'), 'utf8')
console.log('Wrote file-structure.txt')