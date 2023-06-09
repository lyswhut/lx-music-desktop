import { createEapiFetch } from './utils/index'

export default {
    filterSongList(raw) {
        const list = []
        raw.forEach(item => {
            if (!item.id) return
            
        })
    },
    /**
     * 获取歌手信息
     * @param {*} id
     */
    async getInfo(id) {
        return createEapiFetch('/api/artist/head/info/get', { id }).then(body => {
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
    /**
     * 获取歌手歌曲列表
     * @param {*} id
     * @param {*} page
     * @param {*} limit
     */
    async getSongList(id, page = 1, limit = 100) {
        if (page === 1) page = 0
        return createEapiFetch('/api/v2/artist/songs', {
            id,
            limit,
            offset: limit * page
        }).then(body => {
            if (!body) throw new Error("get singer songs faild.")

        })
    }
}