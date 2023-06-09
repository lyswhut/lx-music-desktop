import { createEapiFetch } from './utils/index'

export default {
    /**
     * 获取歌手信息
     * @param {*} id
     */
    async getInfo(id){
        return createEapiFetch("/api/artist/head/info/get", { id }).then(body => {
            if (!body) throw new Error("get singer info faild.")

            return {
                source: 'wy',
                info: {
                    name: "",
                    desc: "",
                    avatar: "",
                    musicCount: 111,
                }
            }
        })
    }
}