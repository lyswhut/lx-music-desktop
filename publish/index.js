const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const clearAssets = require('./utils/clearAssets')
const updateVersionFile = require('./utils/updateChangeLog')

const run = async () => {
  const bak = await updateVersionFile(process.argv.slice(2)[0])

  try {
    console.log(chalk.blue('Clearing assets...'))
    clearAssets()
    console.log(chalk.green('Assets clear completed...'))
    console.log(chalk.green('日志更新完成~'))
  } catch (error) {
    console.log(error)
    console.log(chalk.red('程序发布失败'))
    console.log(chalk.blue('正在还原版本信息'))
    fs.writeFileSync(path.join(__dirname, './version.json'), bak.version_bak + '\n', 'utf-8')
    fs.writeFileSync(path.join(__dirname, '../package.json'), bak.pkg_bak + '\n', 'utf-8')
    console.log(chalk.blue('版本信息还原完成'))
  }
}

run()
