import { httpFetch } from '../../../request'

/**
 * 创建一个适用于MG的Http请求
 * @param {*} url
 * @param {*} options
 * @param {*} retryNum
 */
export const createHttpFetch = async(url: string, options?: any, retryNum: number = 0): Promise<any> => {
  if (retryNum > 2) throw new Error('try max num')
  let result
  try {
    result = await httpFetch(url, options).promise
  } catch (err) {
    console.log(err)
    return createHttpFetch(url, options, ++retryNum)
  }
  const code = result.body.code ?? result.body.returnCode
  if (result.statusCode !== 200 || code !== '000000') { return createHttpFetch(url, options, ++retryNum) }
  if (result.body.data) return result.body.data
  return result.body
}
