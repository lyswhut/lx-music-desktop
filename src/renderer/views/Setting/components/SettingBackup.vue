<template lang="pug">
dt#backup {{ $t('setting__backup') }}
dd
  h3#backup_part {{ $t('setting__backup_part') }}
  div(:class="$style.partBtns")
    base-btn.btn.gap-left(min @click="handleImportPlayList") {{ $t('setting__backup_part_import_list') }}
    base-btn.btn.gap-left(min @click="handleExportPlayList") {{ $t('setting__backup_part_export_list') }}
    base-btn.btn.gap-left(min @click="handleImportSetting") {{ $t('setting__backup_part_import_setting') }}
    base-btn.btn.gap-left(min @click="handleExportSetting") {{ $t('setting__backup_part_export_setting') }}
dd
  h3#backup_all {{ $t('setting__backup_all') }}
  div
    base-btn.btn.gap-left(min @click="handleImportAllData") {{ $t('setting__backup_all_import') }}
    base-btn.btn.gap-left(min @click="handleExportAllData") {{ $t('setting__backup_all_export') }}
div(data-line-break)
dd
    h3#backup_other {{ $t('setting__backup_other') }}
    div
      base-btn.btn.gap-left(min @click="handleExportPlayListToText") {{ $t('setting__backup_other_export_list_text') }}
      base-btn.btn.gap-left(min @click="handleExportPlayListToCsv") {{ $t('setting__backup_other_export_list_csv') }}
dd
  h3#backup_auto {{ $t('setting__backup_auto') }}
  div(:class="$style.autoMeta")
    base-checkbox.autoEnable(id="setting_backup_auto_enable" :model-value="appSetting['backup.autoEnable']" :label="$t('setting__backup_auto_enable')" @update:model-value="handleUpdateAutoEnable")
    p(:class="$style.autoPath")
      span(:class="$style.autoPathLabel") {{ $t('setting__backup_auto_path') }}
      strong(:class="$style.autoPathValue") {{ appSetting['backup.autoPath'] || $t('setting__backup_auto_none') }}
    base-btn.btn(:class="$style.autoPathChangeBtn" min @click="handleChangeAutoPath") {{ $t('setting__backup_auto_path_change') }}
  div(:class="$style.autoActions")
    span(:class="$style.autoCountLabel") {{ $t('setting__backup_auto_count') }}
    base-selection(:class="$style.selectWidth" :model-value="appSetting['backup.autoKeepCount']" :list="backupCounts" item-key="id" item-name="id" @change="handleUpdateAutoCount")
    base-btn.btn(min :disabled="isHandlingAutoBackup" @click="handleAutoBackup") {{ $t('setting__backup_auto_btn') }}
</template>

<script>
import { ref } from '@common/utils/vueTools'
// import { mergeSetting } from '@common/utils'
// import { base as eventBaseName } from '@renderer/event/names'
// import { defaultList, loveList, userLists } from '@renderer/core/share/list'
import {
  toNewMusicInfo,
  // toOldMusicInfo,
  filterMusicList,
  fixNewMusicInfoQuality,
} from '@renderer/utils'
import {
  showSelectDialog,
  openSaveDir,
} from '@renderer/utils/ipc'
import { getAllLists } from '@renderer/utils/autoBackup'
// import { currentStting } from '../setting'
import { dialog } from '@renderer/plugins/Dialog'
import { log } from '@common/utils'
import useImportTip from '@renderer/utils/compositions/useImportTip'
import { useI18n } from '@renderer/plugins/i18n'
import { overwriteListFull, overwriteListMusics } from '@renderer/store/list/action'
import { LIST_IDS } from '@common/constants'
import { appSetting, updateSetting } from '@renderer/store/setting'
import migrateSetting from '@common/utils/migrateSetting'


export default {
  name: 'SettingUpdate',
  setup() {
    const t = useI18n()
    // const setting = useRefGetter('setting')
    // const settingVersion = useRefGetter('settingVersion')
    // const setSettingVersion = useCommit('setSettingVersion')
    // const setList = useCommit('list', 'setList')
    const showImportTip = useImportTip()

    const importOldListData = async(lists) => {
      const allLists = await getAllLists()
      for (const list of lists) {
        try {
          const targetList = allLists.find(l => l.id == list.id)
          if (targetList) {
            targetList.list = filterMusicList(list.list.map(m => toNewMusicInfo(m)))
          } else {
            allLists.push({
              name: list.name,
              id: list.id,
              list: filterMusicList(list.list.map(m => toNewMusicInfo(m))),
              source: list.source,
              sourceListId: list.sourceListId,
              locationUpdateTime: list.locationUpdateTime ?? null,
            })
          }
        } catch (err) {
          console.log(err)
        }
      }
      const defaultList = allLists.shift().list
      const loveList = allLists.shift().list
      await overwriteListFull({ defaultList, loveList, userList: allLists })
    }
    const importNewListData = async(lists) => {
      const allLists = await getAllLists()
      for (const list of lists) {
        try {
          const targetList = allLists.find(l => l.id == list.id)
          if (targetList) {
            targetList.list = filterMusicList(list.list).map(m => fixNewMusicInfoQuality(m))
          } else {
            allLists.push({
              name: list.name,
              id: list.id,
              list: filterMusicList(list.list).map(m => fixNewMusicInfoQuality(m)),
              source: list.source,
              sourceListId: list.sourceListId,
              locationUpdateTime: list.locationUpdateTime ?? null,
            })
          }
        } catch (err) {
          console.log(err)
        }
      }
      const defaultList = allLists.shift().list
      const loveList = allLists.shift().list
      await overwriteListFull({ defaultList, loveList, userList: allLists })
    }
    const importOldSettingData = (setting) => {
      console.log(setting)
      setting = migrateSetting(setting)
      setting['common.isAgreePact'] = false
      updateSetting(setting)
    }
    const importNewSettingData = (setting) => {
      setting['common.isAgreePact'] = false
      updateSetting(setting)
    }


    const importAllData = async(path) => {
      let allData
      try {
        allData = await window.lx.worker.main.readLxConfigFile(path)
      } catch (error) {
        return
      }

      switch (allData.type) {
        case 'allData':
          // 兼容0.6.2及以前版本的列表数据
          if (allData.defaultList) await overwriteListMusics({ listId: LIST_IDS.DEFAULT, musicInfos: filterMusicList(allData.defaultList.list.map(m => toNewMusicInfo(m))) })
          else await importOldListData(allData.playList)
          importOldSettingData(allData.setting)
          break
        case 'allData_v2':
          await importNewListData(allData.playList)
          importNewSettingData(allData.setting)
          break
        default: { showImportTip(allData.type) }
      }
    }
    const handleImportAllData = () => {
      void showSelectDialog({
        title: t('setting__backup_all_import_desc'),
        properties: ['openFile'],
        filters: [
          { name: 'Setting', extensions: ['json', 'lxmc'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      }).then(result => {
        if (result.canceled) return
        void dialog.confirm({
          message: t('setting__backup_part_import_list_confirm'),
          cancelButtonText: t('cancel_button_text'),
          confirmButtonText: t('confirm_button_text'),
        }).then(confirm => {
          if (!confirm) return
          void importAllData(result.filePaths[0])
        })
      })
    }

    const exportAllData = async(path) => {
      let allData = {
        type: 'allData_v2',
        setting: { ...appSetting },
        playList: await getAllLists(),
      }
      void window.lx.worker.main.saveLxConfigFile(path, allData)
    }
    const handleExportAllData = () => {
      void openSaveDir({
        title: t('setting__backup_all_export_desc'),
        defaultPath: 'lx_datas_v2.lxmc',
      }).then(result => {
        if (result.canceled) return
        void exportAllData(result.filePath)
      })
    }

    const exportSetting = (path) => {
      const data = {
        type: 'setting_v2',
        data: { ...appSetting },
      }
      void window.lx.worker.main.saveLxConfigFile(path, data)
    }
    const handleExportSetting = () => {
      void openSaveDir({
        title: t('setting__backup_part_export_setting_desc'),
        defaultPath: 'lx_setting_v2.lxmc',
      }).then(result => {
        if (result.canceled) return
        exportSetting(result.filePath)
      })
    }

    const importSetting = async(path) => {
      let settingData
      try {
        settingData = await window.lx.worker.main.readLxConfigFile(path)
      } catch (error) {
        return
      }

      switch (settingData.type) {
        case 'setting':
          importOldSettingData(settingData.data)
          break
        case 'setting_v2':
          importNewSettingData(settingData.data)
          break
        default: { showImportTip(settingData.type) }
      }
    }
    const handleImportSetting = () => {
      void showSelectDialog({
        title: t('setting__backup_part_import_setting_desc'),
        properties: ['openFile'],
        filters: [
          { name: 'Setting', extensions: ['json', 'lxmc'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      }).then(result => {
        if (result.canceled) return
        void importSetting(result.filePaths[0])
      })
    }

    const exportPlayList = async(path) => {
      const data = {
        type: 'playList_v2',
        data: await getAllLists(),
      }
      void window.lx.worker.main.saveLxConfigFile(path, data)
    }
    const handleExportPlayList = () => {
      void openSaveDir({
        title: t('setting__backup_part_export_list_desc'),
        defaultPath: 'lx_list.lxmc',
      }).then(result => {
        if (result.canceled) return
        void exportPlayList(result.filePath)
      })
    }

    const importPlayList = async(path) => {
      let listData
      try {
        listData = await window.lx.worker.main.readLxConfigFile(path)
      } catch (error) {
        return
      }
      console.log(listData.type)

      switch (listData.type) {
        case 'defautlList': // 兼容0.6.2及以前版本的列表数据
          await overwriteListMusics({ listId: LIST_IDS.DEFAULT, musicInfos: filterMusicList(listData.data.list.map(m => toNewMusicInfo(m))) })
          break
        case 'playList':
          await importOldListData(listData.data)
          break
        case 'playList_v2':
          await importNewListData(listData.data)
          break
        default: { showImportTip(listData.type) }
      }
    }
    const handleImportPlayList = () => {
      void showSelectDialog({
        title: t('setting__backup_part_import_list_desc'),
        properties: ['openFile'],
        filters: [
          { name: 'Play List', extensions: ['json', 'lxmc'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      }).then(result => {
        if (result.canceled) return
        void dialog.confirm({
          message: t('setting__backup_part_import_list_confirm'),
          cancelButtonText: t('cancel_button_text'),
          confirmButtonText: t('confirm_button_text'),
        }).then(confirm => {
          if (!confirm) return
          void importPlayList(result.filePaths[0])
        })
      })
    }

    const exportPlayListToText = async(savePath, isMerge) => {
      const lists = await getAllLists()
      await window.lx.worker.main.exportPlayListToText(savePath, lists, isMerge)
    }
    const handleExportPlayListToText = async() => {
      const confirm = await dialog.confirm({
        message: t('setting__backup_other_export_list_text_confirm'),
        cancelButtonText: t('cancel_button_text'),
        confirmButtonText: t('confirm_button_text'),
      })
      if (confirm) {
        void openSaveDir({
          title: t('setting__backup_other_export_dir'),
          defaultPath: 'lx_list_all.txt',
        }).then(result => {
          if (result.canceled) return
          let path = result.filePath
          if (!path.endsWith('.txt')) path += '.txt'
          void exportPlayListToText(path, true)
        })
      } else {
        void showSelectDialog({
          title: t('setting__backup_other_export_dir'),
          // defaultPath: currentStting.value.download.savePath,
          properties: ['openDirectory'],
        }).then(result => {
          if (result.canceled) return
          void exportPlayListToText(result.filePaths[0], false)
        })
      }
    }

    const exportPlayListToCsv = async(savePath, isMerge) => {
      const lists = await getAllLists()
      await window.lx.worker.main.exportPlayListToCSV(savePath, lists, isMerge, `${t('music_name')},${t('music_singer')},${t('music_album')}\n`)
    }
    const handleExportPlayListToCsv = async() => {
      const confirm = await dialog.confirm({
        message: t('setting__backup_other_export_list_text_confirm'),
        cancelButtonText: t('cancel_button_text'),
        confirmButtonText: t('confirm_button_text'),
      })
      if (confirm) {
        void openSaveDir({
          title: t('setting__backup_other_export_dir'),
          defaultPath: 'lx_list_all.csv',
        }).then(result => {
          if (result.canceled) return
          let path = result.filePath
          if (!path.endsWith('.csv')) path += '.csv'
          void exportPlayListToCsv(path, true)
        })
      } else {
        void showSelectDialog({
          title: t('setting__backup_other_export_dir'),
          // defaultPath: currentStting.value.download.savePath,
          properties: ['openDirectory'],
        }).then(result => {
          if (result.canceled) return
          void exportPlayListToCsv(result.filePaths[0], false)
        })
      }
    }

    // window.eventHub.on(eventBaseName.set_config, handleUpdateSetting)

    // onBeforeUnmount(() => {
    //   window.eventHub.off(eventBaseName.set_config, handleUpdateSetting)
    // })

    const isHandlingAutoBackup = ref(false)

    const handleUpdateAutoEnable = async(enabled) => {
      updateSetting({ 'backup.autoEnable': enabled })
      if (enabled && !appSetting['backup.autoPath']) await handleChangeAutoPath()
    }

    const backupCounts = [1, 2, 3, 5, 10, 20].map(id => ({ id }))

    const handleUpdateAutoCount = ({ id }) => {
      updateSetting({ 'backup.autoKeepCount': id })
    }

    const handleChangeAutoPath = async() => {
      const result = await showSelectDialog({
        title: t('setting__backup_auto_path_desc'),
        properties: ['openDirectory'],
        defaultPath: appSetting['backup.autoPath'] || undefined,
      })
      if (result.canceled || !result.filePaths.length) return
      updateSetting({ 'backup.autoPath': result.filePaths[0] })
    }

    const handleAutoBackup = async() => {
      if (isHandlingAutoBackup.value) return
      let path = appSetting['backup.autoPath']
      if (!path) {
        const result = await showSelectDialog({
          title: t('setting__backup_auto_path_desc'),
          properties: ['openDirectory'],
        })
        if (result.canceled || !result.filePaths.length) return
        path = result.filePaths[0]
        updateSetting({ 'backup.autoPath': path })
      }
      isHandlingAutoBackup.value = true
      try {
        const date = new Date()
        const pad = n => String(n).padStart(2, '0')
        const fileName = `lx_datas_v2_${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.lxmc`
        const allData = {
          type: 'allData_v2',
          setting: { ...appSetting },
          playList: await getAllLists(),
        }
        // 去除路径末尾的分隔符，避免生成 "D:\/xxx" 这类路径
        const targetDir = path.replace(/[\\/]+$/, '')
        const dirOk = await window.lx.worker.main.checkAndCreateDir(targetDir)
        if (!dirOk) throw new Error(`Cannot create backup directory: ${targetDir}`)
        await window.lx.worker.main.saveLxConfigFile(`${targetDir}/${fileName}`, allData)
        void dialog.confirm({
          message: t('setting__backup_auto_success'),
          showCancel: false,
          confirmButtonText: t('confirm_button_text'),
        })
      } catch (err) {
        log.error('auto backup failed:', err)
        void dialog.confirm({
          message: `${t('setting__backup_auto_failed')}\n${err.message}`,
          showCancel: false,
          confirmButtonText: t('confirm_button_text'),
        })
      } finally {
        isHandlingAutoBackup.value = false
      }
    }

    return {
      // currentStting,
      appSetting,
      updateSetting,
      isHandlingAutoBackup,
      handleExportPlayList,
      handleImportPlayList,
      handleExportSetting,
      handleImportSetting,
      handleExportAllData,
      handleImportAllData,
      handleExportPlayListToText,
      handleExportPlayListToCsv,
      handleChangeAutoPath,
      handleUpdateAutoEnable,
      handleUpdateAutoCount,
      backupCounts,
      handleAutoBackup,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.savePath {
  font-size: 12px;
}

// 「部分数据」卡片内的按钮：缩小间距与尺寸，使四个按钮在一行显示
.partBtns {
  display: flex;
  flex-flow: row wrap;
  align-items: center;

  :global(.gap-left) + :global(.gap-left) {
    margin-left: 8px;
  }

  button {
    padding: 2px 6px !important;
    font-size: 11px !important;
  }
}

// 「自动备份」卡片：复选框与路径同行
.autoMeta {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 16px;
  min-width: 0;
  margin-bottom: 10px;
}
.autoEnable {
  flex: none;
}

// 「自动备份」卡片：路径显示与操作按钮
.autoPath {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: 12px;
  color: var(--color-font);
  .mixin-ellipsis-1();

  span {
    color: var(--color-font-label);
  }

  strong {
    font-weight: normal;
    color: var(--color-font);
  }
}
.autoPathChangeBtn {
  flex: none;
  margin-left: auto;
}
.autoActions {
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  gap: 12px;
}
.autoCountLabel {
  font-size: 12px;
  color: var(--color-font-label);
}
.selectWidth {
  width: 72px;
}
</style>
