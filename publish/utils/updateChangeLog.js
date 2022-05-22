const fs = require('fs')
const { jp, formatTime } = require('./index')
const pkgDir = '../../package.json'
const pkg = require(pkgDir)
const version = require('../version.json')
const chalk = require('chalk')
const pkg_bak = JSON.stringify(pkg, null, 2)
const version_bak = JSON.stringify(version, null, 2)
const parseChangelog = require('changelog-parser')
const changelogPath = jp('../../CHANGELOG.md')

// const md_renderer = markdownStr => new (require('markdown-it'))({
//   html: true,
//   linkify: true,
//   typographer: true,
//   breaks: true,
// }).render(markdownStr)

const getPrevVer = () => parseChangelog(changelogPath).then(res => {
  if (!res.versions.length) throw new Error('CHANGELOG 无法解析到版本号')
  return res.versions[0].version
})

const updateChangeLog = async(newVerNum, newChangeLog) => {
  let changeLog = fs.readFileSync(changelogPath, 'utf-8')
  const prevVer = await getPrevVer()
  const log = `## [${newVerNum}](${pkg.repository.url.replace(/^git\+(http.+)\.git$/, '$1')}/compare/v${prevVer}...v${newVerNum}) - ${formatTime()}\n\n${newChangeLog}`
  fs.writeFileSync(changelogPath, changeLog.replace(new RegExp('(## [?0.1.1]?)'), log + '\n$1'), 'utf-8')
}

// const renderChangeLog = md => md_renderer(md)


module.exports = async newVerNum => {
  if (!newVerNum) {
    let verArr = pkg.version.split('.')
    verArr[verArr.length - 1] = parseInt(verArr[verArr.length - 1]) + 1
    newVerNum = verArr.join('.')
  }
  const newMDChangeLog = fs.readFileSync(jp('../changeLog.md'), 'utf-8')
  // const newChangeLog = renderChangeLog(newMDChangeLog)
  version.history.unshift({
    version: version.version,
    desc: version.desc,
  })
  version.version = newVerNum
  version.desc = newMDChangeLog.replace(/(?:^|(\n))#{1,6} (.+)\n/g, '$1$2').trim()
  pkg.version = newVerNum

  console.log(chalk.blue('new version: ') + chalk.green(newVerNum))

  fs.writeFileSync(jp('../version.json'), JSON.stringify(version) + '\n', 'utf-8')

  fs.writeFileSync(jp(pkgDir), JSON.stringify(pkg, null, 2) + '\n', 'utf-8')

  await updateChangeLog(newVerNum, newMDChangeLog)

  return {
    pkg_bak,
    version_bak,
    // changeLog: newChangeLog,
  }
}

