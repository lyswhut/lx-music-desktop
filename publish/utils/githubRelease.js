const fs = require('fs')
const ghRelease = require('gh-release')
const token = require('./githubToken')
const pkg = require('../../package.json')
const { jp } = require('./index')

const changeLog = fs.readFileSync(jp('../changeLog.md'), 'utf-8')

const assetsDir = '../assets'

const getBuildFiles = () => {
  const files = []
  const pathRegExp = [
    /latest\.yml$/,
    /\.exe$/,
    /\.blockmap$/,
  ]
  const names = fs.readdirSync(jp(assetsDir), 'utf8')
  names.forEach(name => {
    pathRegExp.forEach(regexp => {
      if (regexp.test(name)) files.push(jp(assetsDir, name))
    })
  })
  return files
}

// all options have defaults and can be omitted
const options = {
  tag_name: `v${pkg.version}`,
  target_commitish: 'master',
  name: `v${pkg.version}`,
  body: changeLog,
  draft: false,
  prerelease: false,
  repo: pkg.name,
  owner: pkg.author,
  endpoint: 'https://api.github.com', // for GitHub enterprise, use http(s)://hostname/api/v3
  auth: {
    token,
  },
  assets: getBuildFiles(),
}


module.exports = ({ isDraft = false, isPrerelease = false, target_commitish = 'master' }) => new Promise((resolve, reject) => {
  options.target_commitish = target_commitish
  options.draft = isDraft
  options.prerelease = isPrerelease

  ghRelease(options, function(err, result) {
    if (err) return reject(err)
    resolve(result)
    console.log(result) // create release response: https://developer.github.com/v3/repos/releases/#response-4
  })
})

