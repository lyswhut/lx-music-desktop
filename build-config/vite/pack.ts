
import del from 'del'
import Spinnies from 'spinnies'
import { createLogger } from 'vite'
import colors from 'picocolors'
import { runBuildWorker, type TaksName } from './utils'
// import rendererConfig from './configs/renderer'
import copyAssets from './copyAssets'

const logger = createLogger('info')

const runMainThread = async() => {
  console.time('Build time')
  del.sync(['dist/**', 'build/**', 'node_modules/.vite/**'])

  const noop = () => {}


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
    runBuildWorker('renderer-scripts', noop).then(handleResult('renderer-scripts')),
    runBuildWorker('main', noop).then(handleResult('main')),
    // build(rendererConfig, noop).then(handleResult('renderer')),
  ]

  if (!await Promise.all(buildTasks).then((result) => result.every(s => s))) {
    console.timeEnd('Build time')
    throw new Error('Build failed')
  }

  await copyAssets()

  // listr.run().then(() => {

  logger.info(colors.green('\nAll task build successfully'))
  // })
  console.timeEnd('Build time')
}

void runMainThread().then(() => {
  process.exit(0)
}).catch(err => {
  console.log(err)
  throw err
})
