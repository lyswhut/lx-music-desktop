<template lang="pug">
dt#backup {{ $t('setting__backup') }}
dd
  div(:class="$style.cardRow")
    div(:class="[$style.sectionCard, $style.wideCard]")
      h3#backup_part(:class="$style.sectionCardTitle") {{ $t('setting__backup_part') }}
      div(:class="$style.sectionCardBody")
        base-btn.btn.gap-left(min @click="handleImportPlayList") {{ $t('setting__backup_part_import_list') }}
        base-btn.btn.gap-left(min @click="handleExportPlayList") {{ $t('setting__backup_part_export_list') }}
        base-btn.btn.gap-left(min @click="handleImportSetting") {{ $t('setting__backup_part_import_setting') }}
        base-btn.btn.gap-left(min @click="handleExportSetting") {{ $t('setting__backup_part_export_setting') }}
    div(:class="$style.sectionCard")
      h3#backup_all(:class="$style.sectionCardTitle") {{ $t('setting__backup_all') }}
      div(:class="$style.sectionCardBody")
        base-btn.btn.gap-left(min @click="handleImportAllData") {{ $t('setting__backup_all_import') }}
        base-btn.btn.gap-left(min @click="handleExportAllData") {{ $t('setting__backup_all_export') }}
  div(:class="$style.cardRow")
    div(:class="$style.sectionCard")
      h3#backup_other(:class="$style.sectionCardTitle") {{ $t('setting__backup_other') }}
      div(:class="$style.sectionCardBody")
        base-btn.btn.gap-left(min @click="handleExportPlayListToText") {{ $t('setting__backup_other_export_list_text') }}
        base-btn.btn.gap-left(min @click="handleExportPlayListToCsv") {{ $t('setting__backup_other_export_list_csv') }}
    div(:class="$style.sectionCard")
      h3#backup_auto(:class="$style.sectionCardTitle") {{ $t('setting__backup_auto') }}
      div(:class="$style.sectionCardBody")
        .p(:class="$style.autoRow")
          base-checkbox(id="setting_backup_auto_enable" :model-value="appSetting['backup.autoBackup.enable']" :label="$t('setting__backup_auto_enable')" @update:model-value="handleAutoBackupEnable")
          span.auto-hidden.hover(:class="$style.savePath" :aria-label="$t('setting__backup_auto_path_open')" @click="openBackupDir") {{ appSetting['backup.autoBackup.path'] || $t('setting__backup_auto_path_unset') }}
          base-btn.btn(min @click="handleChangeBackupPath") {{ $t('setting__backup_auto_change_path') }}
        .p.gap-top(:class="$style.autoRow")
          span(:class="$style.rowLabel") {{ $t('setting__backup_auto_count') }}
          base-selection(:class="$style.selectWidth" :model-value="appSetting['backup.autoBackup.maxBackupCount']" :list="backupCounts" item-key="id" item-name="id" @change="handleUpdateBackupCount")
          base-btn.btn(min :disabled="!appSetting['backup.autoBackup.enable'] || !appSetting['backup.autoBackup.path']" @click="handleBackupNow") {{ $t('setting__backup_auto_now') }}
</template>

<script>
import { toRaw } from '@common/utils/vueTools'
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
  openDirInExplorer,
  runAutoBackup,
} from '@renderer/utils/ipc'
// import { currentStting } from '../setting'
import { dialog } from '@renderer/plugins/Dialog'
import useImportTip from '@renderer/utils/compositions/useImportTip'
import { useI18n } from '@renderer/plugins/i18n'
import { getListMusics, overwriteListFull, overwriteListMusics } from '@renderer/store/list/action'
import { LIST_IDS } from '@common/constants'
import { defaultList, loveList, userLists } from '@renderer/store/list/state'
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

    const getAllLists = async() => {
      const lists = []
      lists.push(await getListMusics(defaultList.id).then(musics => ({ ...defaultList, list: toRaw(musics) })))
      lists.push(await getListMusics(loveList.id).then(musics => ({ ...loveList, list: toRaw(musics) })))

      for await (const list of userLists) {
        lists.push(await getListMusics(list.id).then(musics => ({ ...toRaw(list), list: toRaw(musics) })))
      }

      return lists
    }

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

    // =========================自动备份========================
    const backupCounts = new Array(10).fill(null).map((_, i) => ({ id: i + 1 }))

    const selectBackupPath = async() => {
      const result = await showSelectDialog({
        title: t('setting__backup_auto_select_path'),
        properties: ['openDirectory'],
        defaultPath: appSetting['backup.autoBackup.path'] || appSetting['download.savePath'],
      })
      if (result.canceled) return null
      updateSetting({ 'backup.autoBackup.path': result.filePaths[0] })
      return result.filePaths[0]
    }

    const handleAutoBackupEnable = async(enable) => {
      // 启用时若还没设置备份路径，先选择目录
      if (enable && !appSetting['backup.autoBackup.path']) {
        const path = await selectBackupPath()
        if (!path) return
        updateSetting({ 'backup.autoBackup.enable': true })
        return
      }
      updateSetting({ 'backup.autoBackup.enable': enable })
    }

    const handleChangeBackupPath = () => {
      void selectBackupPath()
    }

    const openBackupDir = () => {
      if (!appSetting['backup.autoBackup.path']) return
      void openDirInExplorer(appSetting['backup.autoBackup.path'])
    }

    const handleUpdateBackupCount = ({ id }) => {
      updateSetting({ 'backup.autoBackup.maxBackupCount': id })
    }

    const handleBackupNow = async() => {
      try {
        await runAutoBackup()
        void dialog({
          message: t('setting__backup_auto_success'),
          confirmButtonText: t('alert_button_text'),
        })
      } catch (error) {
        void dialog({
          message: t('setting__backup_auto_failed') + (error?.message ? `\n${error.message}` : ''),
          confirmButtonText: t('alert_button_text'),
        })
      }
    }

    return {
      // currentStting,
      appSetting,
      backupCounts,
      handleAutoBackupEnable,
      handleChangeBackupPath,
      openBackupDir,
      handleUpdateBackupCount,
      handleBackupNow,
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
.savePath {
  font-size: 12px;
}

// 自动备份卡：路径/更改路径/备份数量/立即备份 一行显示
.autoRow {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 10px;

  .rowLabel {
    flex: none;
    font-size: 12px;
  }

  .savePath {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

// 设置分区卡片：头部色带 + 浅色主题底，与 SettingBasic 保持一致
.sectionCard {
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--color-primary-light-300-alpha-700);
}

// 一行两列的卡片布局
.cardRow {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 12px;
  margin-top: 16px;
  align-items: stretch;
}

.wideCard {
  grid-column: span 2;
}

.selectWidth {
  width: 90px;
  display: inline-flex;
  vertical-align: middle;
}

.sectionCardTitle {
  margin: 0;
  padding: 8px 16px;
  font-size: 13px;
  background-color: var(--color-primary-light-200-alpha-600);
}

.sectionCardBody {
  padding: 12px 16px;
}
</style>
