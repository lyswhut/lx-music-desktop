const { spawn } = require('child_process')
const { jp } = require('./index')
const chalk = require('chalk')

module.exports = () => new Promise((resolve, reject) => {
  const pack = spawn('node', [jp('../../build-config/pack.js')])

  // pack.stdout.on('data', (data) => {
  //   console.log(chalk.blue(data))
  // })

  pack.stderr.on('data', (data) => {
    console.log(chalk.red(data))
  })

  pack.on('close', code => {
    if (code === 0) {
      resolve()
    } else {
      console.log(chalk.red('Asset compilation failed.'))
      reject()
    }
  })
})

