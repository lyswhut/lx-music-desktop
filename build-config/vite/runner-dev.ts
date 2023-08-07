import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process'
import path from 'node:path'
import colors from 'picocolors'
import del from 'del'
import electron from 'electron'
import { createLogger } from 'vite'
import { type TaksName, build, runBuildWorker } from './utils'
import Spinnies from 'spinnies'
import replaceLib from '../build-before-pack'
import { Arch } from 'electron-builder'
import mainConfig from './configs/main'

const logger = createLogger('info')

del.sync(['dist/**', 'node_modules/.vite/**'])

const logs = [
  'Manifest version 2 is deprecated, and support will be removed in 2023',
  '"Extension server error: Operation failed: Permission denied", source: devtools://devtools/bundled',

  // https://github.com/electron/electron/issues/32133
  '"Electron sandbox_bundle.js script failed to run"',
  '"TypeError: object null is not iterable (cannot read property Symbol(Symbol.iterator))",',
]
function electronLog(data: Buffer, color: 'red' | 'blue') {
  let log = data.toString()
  if (/[0-9A-z]+/.test(log)) {
    // 抑制某些无关的报错日志
    if (color == 'red' && typeof log === 'string' && logs.some(l => log.includes(l))) return

    logger.info(colors[color](log))
  }
}
export const runElectron = () => {
  let args = [
    '--inspect=5858',
    // 'NODE_ENV=development',
    path.join(__dirname, '../../dist/main/main.js'),
  ]

  // detect yarn or npm and process commandline args accordingly
  if (process.env.npm_execpath?.endsWith('yarn.js')) {
    args = args.concat(process.argv.slice(3))
  } else if (process.env.npm_execpath?.endsWith('npm-cli.js')) {
    args = args.concat(process.argv.slice(2))
  }

  const electronProcess = spawn(electron as unknown as string, args)

  electronProcess.stdout.on('data', data => {
    electronLog(data, 'blue')
  })
  electronProcess.stderr.on('data', data => {
    electronLog(data, 'red')
  })

  electronProcess.on('close', () => {
    process.exit()
  })

  return electronProcess
}

const runMainThread = async() => {
  console.time('init')

  // let server: ViteDevServer | undefined
  let electronProcess: ChildProcessWithoutNullStreams | undefined

  const noop = () => {}
  const handleUpdate = () => {
    logger.info(colors.green('\nrebuild the electron main process successfully'))

    if (electronProcess) {
      electronProcess.removeAllListeners()
      electronProcess.kill()
    }

    electronProcess = runElectron()
    logger.info(colors.green('\nrestart electron app...'))
  }

  const spinners = new Spinnies({ color: 'blue' })
  spinners.add('renderer', { text: 'renderer compiling' })
  spinners.add('renderer-lyric', { text: 'renderer-lyric compiling' })
  spinners.add('renderer-scripts', { text: 'renderer-scripts compiling' })
  spinners.add('main', { text: 'main compiling' })
  const handleResult = (name: TaksName) => {
    return (success: boolean) => {
      if (success) {
        spinners.succeed(name, { text: name + ' compile success!' })
      } else {
        spinners.fail(name, { text: name + ' compile fail!' })
      }
      return success
    }
  }

  const buildTasks = [
    runBuildWorker('renderer', noop).then(handleResult('renderer')),
    runBuildWorker('renderer-lyric', noop).then(handleResult('renderer-lyric')),
    runBuildWorker('renderer-scripts', handleUpdate).then(handleResult('renderer-scripts')),
    replaceLib({ electronPlatformName: process.platform, arch: Arch[process.arch as any] }).then(async() => {
      return build(mainConfig, handleUpdate).then(handleResult('main'))
    }),
  ]

  if (!await Promise.all(buildTasks).then((result) => result.every(s => s))) return
  // listr.run().then(() => {
  electronProcess = runElectron()

  logger.info(colors.green('\nAll task build successfully'))
  // })
  console.timeEnd('init')
}

void runMainThread()


