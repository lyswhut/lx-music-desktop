
// const isDev = process.env.NODE_ENV === 'development'
import Store from 'electron-store'
import { windowSizeList } from '../../common/config'
import { version } from '../../../package.json'
import { rendererSend, rendererInvoke, NAMES } from '../../common/ipc'
import languageList from '@/lang/languages.json'
import path from 'path'


const electronStore_config = window.electronStore_config = new Store({
  name: 'config',
})
let setting = electronStore_config.get('setting')
let settingVersion = electronStore_config.get('version')

process.versions.app = version

// Set language automatically
if (!window.i18n.availableLocales.includes(setting.langId)) {
  let langId = null
  let locale = window.navigator.language.toLocaleLowerCase()
  if (window.i18n.availableLocales.includes(locale)) {
    langId = locale
  } else {
    for (const lang of languageList) {
      if (lang.alternate == locale) {
        langId = lang.locale
        break
      }
    }
    if (langId == null) langId = 'en-us'
  }
  setting.langId = langId
  electronStore_config.set('setting', setting)
  rendererSend(NAMES.mainWindow.set_app_setting, setting)
  console.log('Set lang', setting.langId)
}

window.i18n.locale = setting.langId

try {
  window.electronStore_list = new Store({
    name: 'playList',
    clearInvalidConfig: false,
  })
} catch (error) {
  rendererInvoke(NAMES.mainWindow.get_data_path).then(dataPath => {
    rendererSend(NAMES.mainWindow.show_dialog, {
      type: 'error',
      message: window.i18n.t('store.state.load_list_file_error_title'),
      detail: window.i18n.t('store.state.load_list_file_error_detail', {
        path: path.join(dataPath, 'playList.json.bak'),
        detail: error.message,
      }),
    })
  })
  window.electronStore_list = new Store({
    name: 'playList',
  })
}


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
