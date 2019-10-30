import kw from './kw'
import kg from './kg'
import tx from './tx'
import wy from './wy'
import mg from './mg'
import bd from './bd'
const sources = {
  sources: [
    {
      name: '酷我音乐',
      id: 'kw',
    },
    {
      name: '酷狗音乐',
      id: 'kg',
    },
    {
      name: 'QQ音乐',
      id: 'tx',
    },
    {
      name: '网易音乐',
      id: 'wy',
    },
    {
      name: '咪咕音乐',
      id: 'mg',
    },
    {
      name: '百度音乐',
      id: 'bd',
    },
  ],
  kw,
  kg,
  tx,
  wy,
  mg,
  bd,
}
export default {
  ...sources,
  init() {
    for (let source of sources.sources) {
      let sm = sources[source.id]
      sm && sm.init && sm.init()
    }
  },
}
