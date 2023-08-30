import fs from 'node:fs'
import crypto from 'node:crypto'
import { gzip, gunzip } from 'node:zlib'
import path from 'node:path'
import { log } from '@common/utils'

export const joinPath = (...paths: string[]): string => path.join(...paths)

export const extname = (p: string): string => path.extname(p)
export const basename = (p: string, ext?: string): string => path.basename(p, ext)
export const dirname = (p: string): string => path.dirname(p)

/**
 * 检查路径是否存在
 * @param {*} path 路径
 */
export const checkPath = async(path: string): Promise<boolean> => {
  return new Promise(resolve => {
    if (!path) {
      resolve(false)
      return
    }
    fs.access(path, fs.constants.F_OK, err => {
      if (err) {
        resolve(false)
        return
      }
      resolve(true)
    })
  })
}

export const getFileStats = async(path: string): Promise<fs.Stats | null> => {
  return new Promise(resolve => {
    if (!path) {
      resolve(null)
      return
    }
    fs.stat(path, (err, stats) => {
      if (err) {
        resolve(null)
        return
      }
      resolve(stats)
    })
  })
}

/**
 * 检查路径并创建目录
 * @param path
 * @returns
 */
export const createDir = async(path: string) => new Promise<void>((resolve, reject) => {
  fs.access(path, fs.constants.F_OK | fs.constants.W_OK, err => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.mkdir(path, { recursive: true }, err => {
          if (err) {
            reject(err)
            return
          }
          resolve()
        })
        return
      }
      reject(err)
      return
    }
    resolve()
  })
})

export const removeFile = async(path: string) => new Promise<void>((resolve, reject) => {
  fs.access(path, fs.constants.F_OK, err => {
    if (err) {
      err.code == 'ENOENT' ? resolve() : reject(err)
      return
    }
    fs.unlink(path, err => {
      if (err) {
        reject(err)
        return
      }
      resolve()
    })
  })
})

export const readFile = async(path: string) => fs.promises.readFile(path)


/**
 * 创建 MD5 hash
 * @param {*} str
 */
export const toMD5 = (str: string) => crypto.createHash('md5').update(str).digest('hex')

export const gzipData = async(str: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    gzip(str, (err, result) => {
      if (err) {
        reject(err)
        return
      }
      resolve(result)
    })
  })
}

export const gunzipData = async(buf: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    gunzip(buf, (err, result) => {
      if (err) {
        reject(err)
        return
      }
      resolve(result.toString())
    })
  })
}

/**
 * 保存lx配置文件
 * @param path 保存路径
 * @param data 数据
 */
export const saveLxConfigFile = async(path: string, data: any) => {
  if (!path.endsWith('.lxmc')) path += '.lxmc'
  fs.writeFile(path, await gzipData(JSON.stringify(data)), 'binary', err => {
    console.log(err)
  })
}

/**
 * 读取lx配置文件
 * @param path 文件路径
 * @returns 数据
 */
export const readLxConfigFile = async(path: string): Promise<any> => {
  let isJSON = path.endsWith('.json')
  let data: string | Buffer = await fs.promises.readFile(path, isJSON ? 'utf8' : 'binary')
  if (!data || isJSON) return data
  data = await gunzipData(Buffer.from(data, 'binary'))
  data = JSON.parse(data)

  // 修复v1.14.0出现的导出数据被序列化两次的问题
  if (typeof data != 'object') {
    try {
      data = JSON.parse(data)
    } catch (err) {
      return data
    }
  }

  return data
}

export const saveStrToFile = async(path: string, str: string | Buffer): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    fs.writeFile(path, str, err => {
      if (err) {
        log.error(err)
        reject(err)
        return
      }
      resolve()
    })
  })
}

export const b64DecodeUnicode = (str: string): string => {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  // return decodeURIComponent(window.atob(str).split('').map(function(c) {
  //   return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  // }).join(''))

  return Buffer.from(str, 'base64').toString()
}

export const copyFile = async(sourcePath: string, distPath: string) => {
  return fs.promises.copyFile(sourcePath, distPath)
}

export const moveFile = async(sourcePath: string, distPath: string) => {
  return fs.promises.rename(sourcePath, distPath)
}
