import { eapiRequest } from './utils/index'

export default {
    /**
     * 获取歌手信息
     * @param {*} id
     * @returns
     */
    async getInfo(id){
        return eapiRequest("/api/artist/head/info/get", { id }).then(({ body }) => {

        })
    }
}