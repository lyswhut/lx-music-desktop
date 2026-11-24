// Check the same inline TypeScript templates used by vue-loader's production build.
// Optional argument: a Git revision for reproducing an earlier failure.
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync, spawnSync } = require('node:child_process')
const { parse, compileScript } = require('@vue/compiler-sfc')
const root = path.resolve(__dirname, '..')
const directory = fs.mkdtempSync(path.join(__dirname, 'inline-'))
try {
  for (const file of ['src/renderer/components/common/MusicCatalogModal.vue', 'src/renderer/components/layout/PlayBar/PlaybackQueue.vue', 'src/renderer/views/Explore/index.vue']) {
    const source = process.argv[2] ? execFileSync('git', ['show', `${process.argv[2]}:${file}`], { cwd: root, encoding: 'utf8' }) : fs.readFileSync(path.join(root, file), 'utf8')
    const { descriptor } = parse(source, { filename: file })
    const id = path.basename(file, '.vue')
    fs.writeFileSync(path.join(directory, `${id}.ts`), compileScript(descriptor, { id, inlineTemplate: true }).content)
  }
  const project = path.join(directory, 'tsconfig.json')
  fs.writeFileSync(project, JSON.stringify({ extends: '../tsconfig.playback.json', include: ['./*.ts', '../../src/common/types/**/*.d.ts', '../../src/renderer/types/**/*.d.ts'], exclude: ['../../node_modules', '../../src/**/*.test.ts'] }))
  const result = spawnSync(process.execPath, [require.resolve('typescript/bin/tsc'), '--noEmit', '-p', project], { cwd: root, stdio: 'inherit' })
  process.exitCode = result.status ?? 1
} finally {
  fs.rmSync(directory, { recursive: true, force: true })
}
