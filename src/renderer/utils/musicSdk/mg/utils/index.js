import { httpFetch } from '../../../request'

/**
 * 创建一个适用于MG的Http请求
 * @param {*} url
 * @param {*} options
 * @param {*} retryNum
 */
export const createHttpFetch = (url, options, retryNum = 0, cancelState = { cancelled: false, request: null }) => {
  if (cancelState.cancelled) return Promise.reject(new Error('request cancelled'))
  if (retryNum > 2) return Promise.reject(new Error('try max num'))
  const reqObj = httpFetch(url, options)
  cancelState.request = reqObj
  const promise = reqObj.promise.then(result => {
    if (cancelState.cancelled) throw new Error('request cancelled')
    if (result.statusCode !== 200 ||
      (
        (result.body.code !== undefined
          ? result.body.code
          : result.body.returnCode !== undefined
            ? result.body.returnCode
            : result.body.code
        ) !== '000000')
    ) return createHttpFetch(url, options, ++retryNum, cancelState)
    if (result.body.data) return result.body.data
    return result.body
  }, err => {
    if (cancelState.cancelled) throw new Error('request cancelled')
    console.log(err)
    return createHttpFetch(url, options, ++retryNum, cancelState)
  })
  promise.cancel = () => {
    cancelState.cancelled = true
    cancelState.request?.cancelHttp?.()
  }
  return promise
}
