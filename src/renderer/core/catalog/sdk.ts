import txAlbum from '@renderer/utils/musicSdk/tx/album'
import wyAlbum from '@renderer/utils/musicSdk/wy/album'
import kgSinger from '@renderer/utils/musicSdk/kg/singer'
import txSinger from '@renderer/utils/musicSdk/tx/singer'
import wySinger from '@renderer/utils/musicSdk/wy/singer'
import kwAlbum from '@renderer/utils/musicSdk/kw/album'
import kwSinger from '@renderer/utils/musicSdk/kw/singer'
import kgAlbum from '@renderer/utils/musicSdk/kg/album'
import mgAlbum from '@renderer/utils/musicSdk/mg/album'
import { singer as ytmSinger, album as ytmAlbum } from '@renderer/utils/musicSdk/ytm'
import getTxMusicInfo from '@renderer/utils/musicSdk/tx/musicInfo'
import getWyMusicInfo from '@renderer/utils/musicSdk/wy/musicInfo'
import { getMusicInfo as getKgMusicInfo } from '@renderer/utils/musicSdk/kg/musicInfo'
import { createCatalogAdapter } from './adapter'

export const catalogAdapter = createCatalogAdapter({
  tx: {
    album: (id, page, limit) => txAlbum.getAlbumDetail(id, page, limit),
    artist: async(id, page, limit) => txSinger.getSongList(id, page, limit),
    detail: async(music) => getTxMusicInfo(music.meta.songId),
  },
  wy: {
    album: (id, page, limit) => wyAlbum.getAlbumDetail(id, page, limit),
    artist: (id, page, limit) => wySinger.getSongList(id, page, limit),
    detail: async(music) => {
      // The legacy JS request adds promise dynamically; type only the response we consume.
      const request = getWyMusicInfo(music.meta.songId) as unknown as {
        promise: Promise<{ ar?: LX.Music.CatalogArtist[], al?: { id: number, name: string } }>
      }
      const raw = await request.promise
      return {
        artists: raw.ar?.map(artist => ({ id: artist.id, name: artist.name })),
        albumId: raw.al?.id,
        albumName: raw.al?.name,
      }
    },
  },
  kg: {
    artist: async(id, page, limit) => kgSinger.getSongList(id, page, limit),
    album: async(id, page, limit) => kgAlbum.getAlbumDetail(id, page, limit),
    detail: async(music) => music.source === 'kg' ? getKgMusicInfo(music.meta.hash) : null,
  },
  kw: {
    artist: (id, page, limit) => kwSinger.getSongList(id, page, limit),
    album: (id, page) => kwAlbum.getAlbumListDetail(id, page),
  },
  mg: { album: async(id, page) => mgAlbum.getAlbumDetail(id, page), albumPageSize: 'response-length' },
  ytm: {
    artist: (id, page, limit) => ytmSinger.getSongList(id, page, limit),
    album: (id, page, limit) => ytmAlbum.getAlbumDetail(id, page, limit),
  },
})
