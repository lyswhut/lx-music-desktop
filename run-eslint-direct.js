const { ESLint } = require('eslint')

async function main() {
  const eslint = new ESLint({
    cwd: require('path').resolve(__dirname, 'src/renderer'),
    overrideConfigFile: null,
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
    return {
      file: r.filePath.split('lx-music-desktop')[1] || r.filePath,
      hasEolLastErrors: eolErrors.length > 0,
      eolErrors: eolErrors.map(e => ({ line: e.line, column: e.column, message: e.message })),
      totalErrors: r.errorCount,
      totalWarnings: r.warningCount,
    }
  })

  console.log(JSON.stringify(output, null, 2))
}

main().catch(console.error)