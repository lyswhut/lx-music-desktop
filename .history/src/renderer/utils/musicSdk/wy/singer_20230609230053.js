import { createEapiFetch } from './utils/index'
import { formatPlayTime, sizeFormate } from '../../index'
import { formatSingerName } from '../utils'

export default {
    filterSongList(raw) {
        const list = []
        raw.forEach(item => {
            if (!item.id) return

            const types = []
            const _types = {}
            item.privilege.chargeInfoList.forEach(i => {
                switch (i.rate) {
                    case 128000:
                        size = item.lMusic ? sizeFormate(item.lMusic.size) : null
                        types.push({ type: '128k', size })
                        _types['128k'] = {
                            size,
                        }
                    case 320000:
                        size = item.hMusic ? sizeFormate(item.hMusic.size) : null
                        types.push({ type: '320k', size })
                        _types['320k'] = {
                            size,
                        }
                    case 999000:
                        size = item.sqMusic ? sizeFormate(item.sqMusic.size) : null
                        types.push({ type: 'flac', size })
                        _typesflac = {
                            size,
                        }
                    case 1999000:
                        size = item.hrMusic ? sizeFormate(item.hrMusic.size) : null
                        types.push({ type: 'flac24bit', size })
                        _types.flac24bit = {
                            size,
                        }
                }
            })

            list.push({
                singer: formatSingerName(item.artists),
                name: item.name,
                albumName: item.album.name,
                albumId: item.album.id,
                songmid: item.id,
                source: 'wy',
                interval: formatPlayTime(item.duration),
                img: null,
                lrc: null,
                otherSource: null,
                types,
                _types,
                typeUrl: {},
            })
        })
        return list
    },
    /**
     * 获取歌手信息
     * @param {*} id
     */
    getInfo(id) {
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
    getSongList(id, page = 1, limit = 100) {
        if (page === 1) page = 0
        return createEapiFetch('/api/v2/artist/songs', {
            id,
            limit,
            offset: limit * page
        }).then(body => {
            if (!body.songs) throw new Error("get singer songs faild.")
            return filterSongList(body.songs)
        })
    },
    /**
     * 获取歌手专辑列表
     * @param {*} id
     * @param {*} page
     * @param {*} limit
     */
    getAlbumList(id, page = 1, limit = 10) {
        if (page === 1) page = 0
        return createEapiFetch(`/api/artist/albums/${id}`, {
            limit,
            offset: limit * page
        }).then(body => {
            if (!body.hotAlbums) throw new Error("get singer songs faild.")
            return filterSongList(body.hotAlbums)
        })
    }
}