const builder = require('electron-builder')
const chalk = require('chalk')

// Promise is returned
module.exports = () => builder.build().catch(error => {
  console.log(error)
  console.log(chalk.red('Asset build failed.'))
  return Promise.reject(error)
})

