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
                    name: body.artist.name,
                    desc: body.artist.briefDesc,
                    avatar: body.user.avatarUrl,
                    gender: body.user.gender === 1 ? '1' : '2',
                },
                count: {
                    music: body.artist.musicSize,
                    album: body.artist.albumSize,
                }
            }
        })
    },
    async getSongList(){

    }
}