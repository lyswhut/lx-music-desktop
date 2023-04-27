import { createHttpFetch } from './utils'

export default {
  getAlbumSong(songInfo) {
    return createHttpFetch(`http://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/queryAlbumSong?albumId=${songInfo.albumId}&pageNo=1`).then(body => {
      return body.songList
    })
  },
}
