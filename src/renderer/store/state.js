
// const isDev = process.env.NODE_ENV === 'development'
import Store from 'electron-store'
import { updateSetting } from '../utils'
import { windowSizeList } from '../../common/config'
import { version } from '../../../package.json'
const electronStore_list = window.electronStore_list = new Store({
  name: 'playList',
})
const electronStore_config = window.electronStore_config = new Store({
  name: 'config',
})
if (!electronStore_config.get('version') && electronStore_config.get('setting')) { // 迁移配置
  electronStore_config.set('version', electronStore_config.get('setting.version'))
  electronStore_config.delete('setting.version')
  const list = electronStore_config.get('list')
  if (list) {
    if (list.defaultList) electronStore_list.set('defaultList', list.defaultList)
    if (list.loveList) electronStore_list.set('loveList', list.loveList)
    electronStore_config.delete('list')
  }
  const downloadList = electronStore_config.get('download')
  if (downloadList) {
    if (downloadList.list) electronStore_list.set('downloadList', downloadList.list)
    electronStore_config.delete('download')
  }
}
const { version: settingVersion, setting } = updateSetting(electronStore_config.get('setting'), electronStore_config.get('version'))
electronStore_config.set('version', settingVersion)
electronStore_config.set('setting', setting)
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
