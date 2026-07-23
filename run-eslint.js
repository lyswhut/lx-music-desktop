const { ESLint } = require('eslint')
const fs = require('fs')
const path = require('path')

async function main() {
  const baseDir = path.resolve(__dirname, 'src/renderer')
  const eslint = new ESLint({
    cwd: baseDir,
    useEslintrc: true,
    ignore: false,
  })

  const files = [
    'components/base/VirtualizedList.vue',
    'components/layout/Toolbar/ControlBtns.vue',
    'views/Leaderboard/index.vue',
    'views/Leaderboard/MusicList/index.vue',
    'views/List/MusicList/index.vue',
    'views/Setting/components/SettingDownload.vue',
    'views/songList/List/components/SongList.vue',
    'views/songList/List/index.vue',
    'views/songList/List/ListView.vue',
  ]

  const results = await eslint.lintFiles(files)
  const output = results.map(r => {
    const eolErrors = r.messages.filter(m => m.ruleId === 'eol-last')
    const otherErrors = r.messages.filter(m => m.ruleId !== 'eol-last')
    return {
      file: r.filePath.split('lx-music-desktop')[1] || r.filePath,
      hasEolLastErrors: eolErrors.length > 0,
      eolErrors: eolErrors.map(e => ({ line: e.line, column: e.column, message: e.message, source: e.source })),
      otherErrorCount: otherErrors.length,
      total: r.messages.length,
    }
  })

  fs.writeFileSync(path.resolve(__dirname, 'eslint-results.json'), JSON.stringify(output, null, 2), 'utf8')
}

main().catch(err => {
  fs.writeFileSync(path.resolve(__dirname, 'eslint-error.txt'), String(err) + '\n' + err.stack, 'utf8')
})