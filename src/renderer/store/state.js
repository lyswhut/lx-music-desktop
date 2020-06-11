
// const isDev = process.env.NODE_ENV === 'development'
import Store from 'electron-store'
import { windowSizeList } from '../../common/config'
import { version } from '../../../package.json'

window.electronStore_list = new Store({
  name: 'playList',
})
const electronStore_config = window.electronStore_config = new Store({
  name: 'config',
})
let setting = electronStore_config.get('setting')
let settingVersion = electronStore_config.get('version')

process.versions.app = version

window.i18n.locale = setting.langId

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
      id: 10,
      name: '粉装玉琢',
      class: 'pink',
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
      id: 11,
      name: '青出于黑',
      class: 'ming',
    },
    {
      id: 12,
      name: '青出于黑',
      class: 'blue2',
    },
    {
      id: 7,
      name: '月里嫦娥',
      class: 'mid_autumn',
    },
    {
      id: 8,
      name: '木叶之村',
      class: 'naruto',
    },
    {
      id: 9,
      name: '新年快乐',
      class: 'happy_new_year',
    },
  ],
  version: {
    version,
    newVersion: null,
    showModal: false,
    isError: false,
    isTimeOut: false,
    isUnknow: false,
    isDownloaded: false,
    isDownloading: false,
    isLatestVer: false,
    downloadProgress: null,
  },
  userInfo: null,
  setting,
  settingVersion,

  windowSizeList,
}
