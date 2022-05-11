process.env.NODE_ENV = 'production'

const chalk = require('chalk')
const del = require('del')
const webpack = require('webpack')
const Spinnies = require('spinnies')

const mainConfig = require('./main/webpack.config.prod')
const rendererConfig = require('./renderer/webpack.config.prod')
const rendererLyricConfig = require('./renderer-lyric/webpack.config.prod')

const errorLog = chalk.bgRed.white(' ERROR ') + ' '
const okayLog = chalk.bgGreen.white(' OKAY ') + ' '


function build() {
  del.sync(['dist/**', 'build/**'])

  const spinners = new Spinnies({ color: 'blue' })
  spinners.add('main', { text: 'main building' })
  spinners.add('renderer', { text: 'renderer building' })
  spinners.add('renderer-lyric', { text: 'renderer-lyric building' })
  let results = ''

  // m.on('success', () => {
  //   process.stdout.write('\x1B[2J\x1B[0f')
  //   console.log(`\n\n${results}`)
  //   console.log(`${okayLog}take it away ${chalk.yellow('`electron-builder`')}\n`)
  //   process.exit()
  // })
  function handleSuccess() {
    process.stdout.write('\x1B[2J\x1B[0f')
    console.log(`\n\n${results}`)
    console.log(`${okayLog}take it away ${chalk.yellow('`electron-builder`')}\n`)
    process.exit()
  }

  Promise.all([
    pack(mainConfig).then(result => {
      results += result + '\n\n'
      spinners.succeed('main', { text: 'main build success!' })
    }).catch(err => {
      spinners.fail('main', { text: 'main build fail :(' })
      console.log(`\n  ${errorLog}failed to build main process`)
      console.error(`\n${err}\n`)
      process.exit(1)
    }),
    pack(rendererConfig).then(result => {
      results += result + '\n\n'
      spinners.succeed('renderer', { text: 'renderer build success!' })
    }).catch(err => {
      spinners.fail('renderer', { text: 'renderer build fail :(' })
      console.log(`\n  ${errorLog}failed to build renderer process`)
      console.error(`\n${err}\n`)
      process.exit(1)
    }),
    pack(rendererLyricConfig).then(result => {
      results += result + '\n\n'
      spinners.succeed('renderer-lyric', { text: 'renderer-lyric build success!' })
    }).catch(err => {
      spinners.fail('renderer-lyric', { text: 'renderer-lyric build fail :(' })
      console.log(`\n  ${errorLog}failed to build renderer-lyric process`)
      console.error(`\n${err}\n`)
      process.exit(1)
    }),
  ]).then(handleSuccess)
}

function pack(config) {
  return new Promise((resolve, reject) => {
    config.mode = 'production'
    webpack(config, (err, stats) => {
      if (err) reject(err.stack || err)
      else if (stats.hasErrors()) {
        let err = ''

        stats.toString({
          chunks: false,
          modules: false,
          colors: true,
        })
          .split(/\r?\n/)
          .forEach(line => {
            err += `    ${line}\n`
          })

        reject(err)
      } else {
        resolve(stats.toString({
          chunks: false,
          colors: true,
        }))
      }
    })
  })
}

build()

