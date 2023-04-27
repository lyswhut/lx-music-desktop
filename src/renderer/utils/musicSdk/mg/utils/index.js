import { httpFetch } from '../../../request'

/**
 * 创建一个适用于MG的Http请求
 * @param {*} url
 * @param {*} options
 * @param {*} retryNum
 */
export const createHttpFetch = async(url, options, retryNum = 0) => {
  if (retryNum > 2) throw new Error('try max num')
  let result
  try {
    result = await httpFetch(url, options).promise
  } catch (err) {
    console.log(err)
    return createHttpFetch(url, options, ++retryNum)
  }
  if (result.statusCode !== 200 ||
    (
      (result.body.code !== undefined
        ? result.body.code
        : result.body.returnCode !== undefined
          ? result.body.returnCode
          : result.body.code
      ) !== '000000')
  ) return createHttpFetch(url, options, ++retryNum)
  if (result.body.data) return result.body.data
  return result.body
}
