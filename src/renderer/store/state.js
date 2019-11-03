
// const isDev = process.env.NODE_ENV === 'development'
import Store from 'electron-store'
import { updateSetting } from '../utils'
import { windowSizeList } from '../../common/config'
import { version } from '../../../package.json'
let electronStore = new Store()
const setting = updateSetting(electronStore.get('setting'))
electronStore.set('setting', setting)
process.versions.app = version

export default {
  themes: [
    {
      id: 0,
      name: '绿意盎然',
      class: 'green',
    },
    {
      id: 1,
      name: '蓝田生玉',
      class: 'blue',
    },
    {
      id: 2,
      name: '信口雌黄',
      class: 'yellow',
    },
    {
      id: 3,
      name: '橙黄橘绿',
      class: 'orange',
    },
    {
      id: 4,
      name: '热情似火',
      class: 'red',
    },
    {
      id: 5,
      name: '重斤球紫',
      class: 'purple',
    },
    {
      id: 6,
      name: '灰常美丽',
      class: 'grey',
    },
    {
      id: 7,
      name: '月里嫦娥',
      class: 'midAutumn',
    },
    {
      id: 8,
      name: '木叶之村',
      class: 'dhHyrz',
    },
  ],
  version: {
    version,
    newVersion: null,
    showModal: false,
    isError: false,
    downloadProgress: null,
  },
  userInfo: null,
  setting,
  electronStore,
  windowSizeList,
}
