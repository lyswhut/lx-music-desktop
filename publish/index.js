const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const clearAssets = require('./utils/clearAssets')
// const packAssets = require('./utils/packAssets')
// const compileAssets = require('./utils/compileAssets')
const updateVersionFile = require('./utils/updateChangeLog')
// const copyFile = require('./utils/copyFile')
// const githubRelease = require('./utils/githubRelease')
// const { parseArgv } = require('./utils')

const run = async() => {
  // const params = parseArgv(process.argv.slice(2))
  // const bak = await updateVersionFile(params.ver)
  const bak = await updateVersionFile(process.argv.slice(2)[0])

  try {
    console.log(chalk.blue('Clearing assets...'))
    await clearAssets()
    console.log(chalk.green('Assets clear completed...'))

    // console.log(chalk.blue('Compileing assets...'))
    // await compileAssets()
    // console.log(chalk.green('Asset compiled successfully.'))

    // console.log(chalk.blue('Building assets...'))
    // await packAssets()
    // console.log(chalk.green('Asset build successfully.'))

    // console.log(chalk.blue('Copy files...'))
    // await copyFile()
    // console.log(chalk.green('Complete copy of all files.'))

    // console.log(chalk.blue('Create release...'))
    // await githubRelease(params)
    // console.log(chalk.green('Release created.'))

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
