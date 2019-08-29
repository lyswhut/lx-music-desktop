import { httpFatch } from '../../request'

export default {
  getPic({ songmid }) {
    const requestObj = httpFatch(`http://artistpicserver.kuwo.cn/pic.web?corp=kuwo&type=rid_pic&pictype=500&size=500&rid=${songmid}`)
    requestObj.promise = requestObj.promise.then(({ body }) => body)
    return requestObj
  },
}
