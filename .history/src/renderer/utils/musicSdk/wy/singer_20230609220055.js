import { createEapiFetch } from './utils/index'

export default {
    /**
     * 获取歌手信息
     * @param {*} id
     * @returns
     */
    async getInfo(id){
        return createEapiFetch("/api/artist/head/info/get", { id }).then(body => {
            return {
                source: 'wy',
                musicTotal: "",
                info: {
                    name: "",
                    desc: "",
                }
            }
        })
    }
}