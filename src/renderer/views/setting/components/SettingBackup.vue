<template lang="pug">
dt#backup {{$t('setting__backup')}}
dd
  h3#backup_part {{$t('setting__backup_part')}}
  div
    base-btn.btn.gap-left(min @click="handleImportPlayList") {{$t('setting__backup_part_import_list')}}
    base-btn.btn.gap-left(min @click="handleExportPlayList") {{$t('setting__backup_part_export_list')}}
    base-btn.btn.gap-left(min @click="handleImportSetting") {{$t('setting__backup_part_import_setting')}}
    base-btn.btn.gap-left(min @click="handleExportSetting") {{$t('setting__backup_part_export_setting')}}
dd
  h3#backup_all {{$t('setting__backup_all')}}
  div
    base-btn.btn.gap-left(min @click="handleImportAllData") {{$t('setting__backup_all_import')}}
    base-btn.btn.gap-left(min @click="handleExportAllData") {{$t('setting__backup_all_export')}}
dd
  h3#backup_other {{$t('setting__backup_other')}}
  div
    base-btn.btn.gap-left(min @click="handleExportPlayListToText") {{$t('setting__backup_other_export_list_text')}}
    base-btn.btn.gap-left(min @click="handleExportPlayListToCsv") {{$t('setting__backup_other_export_list_csv')}}
</template>

<script>
import { useCommit, useI18n, onBeforeUnmount, toRaw, useRefGetter } from '@renderer/utils/vueTools'
import { mergeSetting } from '@common/utils'
import { base as eventBaseName } from '@renderer/event/names'
import { defaultList, loveList, userLists } from '@renderer/core/share/list'
import {
  getSetting,
  saveSetting,
  saveLxConfigFile,
  readLxConfigFile,
  selectDir,
  openSaveDir,
  filterFileName,
  saveStrToFile,
} from '@renderer/utils'
import { currentStting } from '../setting'
import { getList } from '@renderer/core/share/utils'
import path from 'path'
import { dialog } from '@renderer/plugins/Dialog'
import iconv from 'iconv-lite'
import useImportTip from '@renderer/utils/compositions/useImportTip'

export default {
  name: 'SettingUpdate',
  setup() {
    const { t } = useI18n()
    const setting = useRefGetter('setting')
    const settingVersion = useRefGetter('settingVersion')
    const setSettingVersion = useCommit('setSettingVersion')
    const setList = useCommit('list', 'setList')
    const showImportTip = useImportTip()

    const handleUpdateSetting = (config) => {
      currentStting.value = JSON.parse(JSON.stringify(config))
    }
    const refreshSetting = async(newSetting, newVersion) => {
      await saveSetting(toRaw(newSetting))
      const { setting, version } = await getSetting()
      currentStting.value = setting
      setSettingVersion(version)
    }

    const importAllData = async(path) => {
      let allData
      try {
        allData = await readLxConfigFile(path)
      } catch (error) {
        return
      }
      if (allData.type !== 'allData') return showImportTip(allData.type)

      // 兼容0.6.2及以前版本的列表数据
      if (allData.defaultList) return setList({ id: 'default', list: allData.defaultList.list, name: '试听列表' })

      for (const list of allData.playList) {
        setList(list)
      }

      const { version: settingVersion, setting } = mergeSetting(allData.setting)
      setting.isAgreePact = false

      await refreshSetting(setting, settingVersion)
    }
    const handleImportAllData = () => {
      selectDir({
        title: t('setting__backup_all_import_desc'),
        properties: ['openFile'],
        filters: [
          { name: 'Setting', extensions: ['json', 'lxmc'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      }).then(result => {
        if (result.canceled) return
        importAllData(result.filePaths[0])
      })
    }

    const exportAllData = async(path) => {
      let allData = JSON.parse(JSON.stringify({
        type: 'allData',
        setting: Object.assign({ version: settingVersion.value }, toRaw(setting.value)),
        playList: [
          { ...toRaw(defaultList), list: toRaw(getList(defaultList.id)) },
          { ...toRaw(loveList), list: toRaw(getList(loveList.id)) },
          ...userLists.map(l => ({ ...toRaw(l), list: toRaw(getList(l.id)) })),
        ],
      }))
      for await (const list of allData.playList) {
        for await (const item of list.list) {
          if (item.otherSource) delete item.otherSource
        }
      }
      saveLxConfigFile(path, allData)
    }
    const handleExportAllData = () => {
      openSaveDir({
        title: t('setting__backup_all_export_desc'),
        defaultPath: 'lx_datas.lxmc',
      }).then(result => {
        if (result.canceled) return
        exportAllData(result.filePath)
      })
    }

    const exportSetting = (path) => {
      const data = {
        type: 'setting',
        data: Object.assign({ version: settingVersion.value }, toRaw(setting.value)),
      }
      saveLxConfigFile(path, data)
    }
    const handleExportSetting = () => {
      openSaveDir({
        title: t('setting__backup_part_export_setting_desc'),
        defaultPath: 'lx_setting.lxmc',
      }).then(result => {
        if (result.canceled) return
        exportSetting(result.filePath)
      })
    }

    const importSetting = async(path) => {
      let settingData
      try {
        settingData = await readLxConfigFile(path)
      } catch (error) {
        return
      }
      if (settingData.type !== 'setting') return showImportTip(settingData.type)
      const { version: settingVersion, setting } = mergeSetting(settingData.data)
      setting.isAgreePact = false
      refreshSetting(setting, settingVersion)
    }
    const handleImportSetting = () => {
      selectDir({
        title: t('setting__backup_part_import_setting_desc'),
        properties: ['openFile'],
        filters: [
          { name: 'Setting', extensions: ['json', 'lxmc'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      }).then(result => {
        if (result.canceled) return
        importSetting(result.filePaths[0])
      })
    }

    const exportPlayList = async(path) => {
      const data = JSON.parse(JSON.stringify({
        type: 'playList',
        data: [
          { ...toRaw(defaultList), list: toRaw(getList(defaultList.id)) },
          { ...toRaw(loveList), list: toRaw(getList(loveList.id)) },
          ...userLists.map(l => ({ ...toRaw(l), list: toRaw(getList(l.id)) })),
        ],
      }))
      for await (const list of data.data) {
        for await (const item of list.list) {
          if (item.otherSource) delete item.otherSource
        }
      }
      saveLxConfigFile(path, data)
    }
    const handleExportPlayList = () => {
      openSaveDir({
        title: t('setting__backup_part_export_list_desc'),
        defaultPath: 'lx_list.lxmc',
      }).then(result => {
        if (result.canceled) return
        exportPlayList(result.filePath)
      })
    }

    const importPlayList = async(path) => {
      let listData
      try {
        listData = await readLxConfigFile(path)
      } catch (error) {
        return
      }
      console.log(listData.type)

      // 兼容0.6.2及以前版本的列表数据
      if (listData.type === 'defautlList') return setList({ id: 'default', list: listData.data.list, name: '试听列表' })

      if (listData.type !== 'playList') return showImportTip(listData.type)

      for (const list of listData.data) {
        setList(list)
      }

      await refreshSetting(setting.value, settingVersion.value)
    }
    const handleImportPlayList = () => {
      selectDir({
        title: t('setting__backup_part_import_list_desc'),
        properties: ['openFile'],
        filters: [
          { name: 'Play List', extensions: ['json', 'lxmc'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      }).then(result => {
        if (result.canceled) return
        importPlayList(result.filePaths[0])
      })
    }

    const exportPlayListToText = async(savePath, isMerge) => {
      const lists = JSON.parse(JSON.stringify([
        { ...toRaw(defaultList), list: toRaw(getList(defaultList.id)) },
        { ...toRaw(loveList), list: toRaw(getList(loveList.id)) },
        ...userLists.map(l => ({ ...toRaw(l), list: toRaw(getList(l.id)) })),
      ]))
      for await (const list of lists) {
        for await (const item of list.list) {
          if (item.otherSource) delete item.otherSource
        }
      }
      if (isMerge) {
        saveStrToFile(savePath, iconv.encode(lists.map(l => l.list.map(m => `${m.name}  ${m.singer}  ${m.albumName}`).join('\n')).join('\n\n'), 'utf8', { addBOM: true }))
      } else {
        for await (const list of lists) {
          await saveStrToFile(path.join(savePath, `lx_list_${filterFileName(list.name)}.txt`), iconv.encode(list.list.map(m => `${m.name}  ${m.singer}  ${m.albumName}`).join('\n'), 'utf8', { addBOM: true }))
        }
      }
    }
    const handleExportPlayListToText = async() => {
      const confirm = await dialog.confirm({
        message: t('setting__backup_other_export_list_text_confirm'),
        cancelButtonText: t('cancel_button_text'),
        confirmButtonText: t('confirm_button_text'),
      })
      if (confirm) {
        openSaveDir({
          title: t('setting__backup_other_export_dir'),
          defaultPath: 'lx_list_all.txt',
        }).then(result => {
          if (result.canceled) return
          let path = result.filePath
          if (!path.endsWith('.txt')) path += '.txt'
          exportPlayListToText(path, true)
        })
      } else {
        selectDir({
          title: t('setting__backup_other_export_dir'),
          defaultPath: currentStting.value.download.savePath,
          properties: ['openDirectory'],
        }).then(result => {
          if (result.canceled) return
          exportPlayListToText(result.filePaths[0], false)
        })
      }
    }

    const exportPlayListToCsv = async(savePath, isMerge) => {
      const lists = JSON.parse(JSON.stringify([
        { ...toRaw(defaultList), list: toRaw(getList(defaultList.id)) },
        { ...toRaw(loveList), list: toRaw(getList(loveList.id)) },
        ...userLists.map(l => ({ ...toRaw(l), list: toRaw(getList(l.id)) })),
      ]))
      for await (const list of lists) {
        for await (const item of list.list) {
          if (item.otherSource) delete item.otherSource
        }
      }
      const filterStr = str => {
        if (!str) return ''
        str = str.replace(/"/g, '""')
        if (/,/.test(str)) str = `"${str}"`
        return str
      }
      const header = `${t('music_name')},${t('music_singer')},${t('music_album')}\n`
      if (isMerge) {
        saveStrToFile(savePath, iconv.encode(header + lists.map(l => l.list.map(m => `${filterStr(m.name)},${filterStr(m.singer)},${filterStr(m.albumName)}`).join('\n')).join('\n'), 'utf8', { addBOM: true }))
      } else {
        for await (const list of lists) {
          await saveStrToFile(path.join(savePath, `lx_list_${filterFileName(list.name)}.csv`), iconv.encode(header + list.list.map(m => `${filterStr(m.name)},${filterStr(m.singer)},${filterStr(m.albumName)}`).join('\n'), 'utf8', { addBOM: true }))
        }
      }
    }
    const handleExportPlayListToCsv = async() => {
      const confirm = await dialog.confirm({
        message: t('setting__backup_other_export_list_text_confirm'),
        cancelButtonText: t('cancel_button_text'),
        confirmButtonText: t('confirm_button_text'),
      })
      if (confirm) {
        openSaveDir({
          title: t('setting__backup_other_export_dir'),
          defaultPath: 'lx_list_all.csv',
        }).then(result => {
          if (result.canceled) return
          let path = result.filePath
          if (!path.endsWith('.csv')) path += '.csv'
          exportPlayListToCsv(path, true)
        })
      } else {
        selectDir({
          title: t('setting__backup_other_export_dir'),
          defaultPath: currentStting.value.download.savePath,
          properties: ['openDirectory'],
        }).then(result => {
          if (result.canceled) return
          exportPlayListToCsv(result.filePaths[0], false)
        })
      }
    }

    window.eventHub.on(eventBaseName.set_config, handleUpdateSetting)

    onBeforeUnmount(() => {
      window.eventHub.off(eventBaseName.set_config, handleUpdateSetting)
    })

    return {
      currentStting,
      handleExportPlayList,
      handleImportPlayList,
      handleExportSetting,
      handleImportSetting,
      handleExportAllData,
      handleImportAllData,
      handleExportPlayListToText,
      handleExportPlayListToCsv,
    }
  },
}
</script>

<style lang="less" module>
.save-path {
  font-size: 12px;
}
</style>
