const fs = require('fs')
const { jp, sizeFormate } = require('./index')
const chalk = require('chalk')
const COS = require('cos-nodejs-sdk-v5')
const config = require('./cosConfig')
const MultiProgress = require('multi-progress')
const multi = new MultiProgress(process.stderr)

const cos = new COS({
  SecretId: config.secretId,
  SecretKey: config.secretKey,
  KeepAlive: false,
})

const getCosFileList = () => new Promise((resolve, reject) => {
  cos.getBucket({
    Bucket: config.bucket,
    Region: config.region,
    Prefix: config.prefix,
  }, function(err, data) {
    if (err) {
      console.log(err)
      reject(err)
      console.log(chalk.red('COS文件列表获取失败'))
    }
    resolve(data.Contents.filter(o => o.Key !== config.prefix).map(o => o.Key.replace(config.prefix, '')))
  })
})

const getLocalFileList = () => fs.readdirSync(jp('../assets'), 'utf8')

const diffFileList = (localFiles, cosFiles) => {
  const removeFiles = []
  cosFiles.forEach(file => {
    let index = localFiles.indexOf(file)
    if (index < 0) return removeFiles.push(file)
    localFiles.splice(index, 1)
  })
  if (cosFiles.includes('latest.yml')) {
    removeFiles.push('latest.yml')
    localFiles.push('latest.yml')
  }
  if (cosFiles.includes('version.json')) {
    removeFiles.push('version.json')
    localFiles.push('version.json')
  }
  return removeFiles
}

const deleteCosFiles = files => new Promise((resolve, reject) => {
  files = files.map(f => ({ Key: config.prefix + f }))
  cos.deleteMultipleObject({
    Bucket: config.bucket,
    Region: config.region,
    Objects: files,
  }, function(err, data) {
    if (err) {
      console.log(err)
      reject(err)
    }
    resolve()
  })
})

const createProgressBar = (name, spacekLen, total) => multi.newBar(
  `${`  ${name}`.padEnd(spacekLen, ' ')} :status [:bar] :current/:total  :percent  :speed`, {
    complete: '=',
    incomplete: ' ',
    width: 30,
    total,
  })


const uploadFile = (fileName, len) => new Promise((resolve, reject) => {
  const filePath = jp('../assets', fileName)
  // let size = fs.statSync(filePath).size
  let bar = null
  let prevLoaded = 0

  cos.sliceUploadFile({
    Bucket: config.bucket,
    Region: config.region,
    Key: config.prefix + fileName, /* 必须 */
    FilePath: filePath, /* 必须 */
    // TaskReady: function(taskId) { /* 非必须 */
    //   console.log(taskId)
    // },
    onHashProgress(progressData) { /* 非必须 */
      if (!bar) {
        bar = createProgressBar(fileName, len, progressData.total)
        prevLoaded = 0
      }
      bar.tick(progressData.loaded - prevLoaded, {
        status: '校验中',
        speed: sizeFormate(progressData.speed) + '/s',
      })
      prevLoaded = progressData.loaded
      // console.log('校验', fileName, JSON.stringify(progressData))
      // console.log('校验', JSON.stringify(progressData))
    },
    onProgress(progressData) { /* 非必须 */
      if (!bar) {
        bar = createProgressBar(fileName, len, progressData.total)
        prevLoaded = 0
      }
      bar.tick(progressData.loaded - prevLoaded, {
        status: '上传中',
        speed: sizeFormate(progressData.speed) + '/s',
      })
      prevLoaded = progressData.loaded
      // console.log('上传', fileName, JSON.stringify(progressData))
      // console.log('上传', JSON.stringify(progressData))
    },
  }, (err, data) => {
    if (err) {
      console.log(err)
      return reject(err)
    }
    bar.tick({
      status: '已完成',
      speed: '',
    })
    resolve(data)
  })
})


module.exports = async() => {
  console.log(chalk.blue('正在获取COS文件列表...'))
  const cosFiles = await getCosFileList()
  console.log(chalk.green('COS文件列表获取成功'))
  const uploadFiles = getLocalFileList()
  const removeFiles = diffFileList(uploadFiles, cosFiles)
  if (removeFiles.length) {
    console.log(chalk.blue('共需删除') + chalk.yellow(removeFiles.length) + chalk.blue('个文件'))
    console.log(chalk.blue('正在从COS删除多余的文件...'))
    await deleteCosFiles(removeFiles)
    console.log(chalk.green('多余文件删除成功'))
  } else {
    console.log(chalk.blue('没有在COS发现多余的文件'))
  }
  if (uploadFiles.length) {
    console.log(chalk.blue('共需上传') + chalk.green(uploadFiles.length) + chalk.blue('个文件'))
    console.log(chalk.blue('正在上传新文件到COS...'))
    let max = Math.max(...uploadFiles.map(f => f.length)) + 2
    let tasks = uploadFiles.map(f => uploadFile(f, max))
    await Promise.all(tasks)
    console.log(''.padEnd(Math.max(2, tasks.length - 2), '\n'))
    console.log(chalk.green('所有文件上传完成'))
  } else {
    console.log(chalk.blue('没有需要上传的文件'))
  }
}
