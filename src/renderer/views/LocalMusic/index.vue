<template>
  <div id="local-music" :class="$style.container">
    <!-- 页头：图标 + 标题 + 添加本地歌曲按钮 -->
    <div :class="$style.pageHeader">
      <div :class="$style.pageIcon">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24" width="34" height="34" space="preserve">
          <use xlink:href="#icon-localMusic" />
        </svg>
      </div>
      <div :class="$style.pageMain">
        <h1 :class="$style.pageTitle">本地音乐</h1>
        <div :class="$style.pageActions">
          <button type="button" :class="$style.actionBtn" :disabled="isFetching" @click="handleAddLocalSongs">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24" width="15" height="15" space="preserve">
              <use xlink:href="#icon-localMusic" />
            </svg>
            {{ $t('lists__select_local_file') }}
          </button>
        </div>
      </div>
    </div>
    <!-- 歌曲列表：展示本地音乐列表（LIST_IDS.LOCAL） -->
    <MusicList :list-id="LIST_IDS.LOCAL" />
    <common-back-to-top />
  </div>
</template>

<script>
import { ref } from '@common/utils/vueTools'
import { showSelectDialog } from '@renderer/utils/ipc'
import { addListMusics } from '@renderer/store/list/action'
import { LIST_IDS } from '@common/constants'
import MusicList from '@renderer/views/List/MusicList/index.vue'

export default {
  name: 'LocalMusic',
  components: {
    MusicList,
  },
  setup() {
    const isFetching = ref(false)

    const handleAddMusics = async(filePaths, index = -1) => {
      const paths = filePaths.slice(index + 1, index + 201)
      const musicInfos = await window.lx.worker.main.createLocalMusicInfos(paths)
      if (musicInfos.length) await addListMusics(LIST_IDS.LOCAL, musicInfos)
      index += 200
      if (filePaths.length - 1 > index) await handleAddMusics(filePaths, index)
    }

    const handleAddLocalSongs = async() => {
      if (isFetching.value) return
      const { canceled, filePaths } = await showSelectDialog({
        title: window.i18n.t('lists__add_local_file_desc'),
        properties: ['openFile', 'multiSelections'],
        filters: [
          // https://support.google.com/chromebook/answer/183093
          // 3gp, .avi, .mov, .m4v, .m4a, .mp3, .mkv, .ogm, .ogg, .oga, .webm, .wav
          { name: 'Media File', extensions: ['mp3', 'flac', 'ogg', 'oga', 'wav', 'm4a'] },
          // { name: 'All Files', extensions: ['*'] },
        ],
      })
      if (canceled || !filePaths.length) return

      isFetching.value = true
      try {
        await handleAddMusics(filePaths)
      } finally {
        isFetching.value = false
      }
    }

    return {
      LIST_IDS,
      isFetching,
      handleAddLocalSongs,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.container {
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  position: relative;
}

.pageHeader {
  flex: none;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  padding: 30px 15px 14px;
}
.pageIcon {
  flex: none;
  width: 64px;
  height: 64px;
  border-radius: 10px;
  background-color: var(--color-primary-light-300-alpha-700);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;

  svg {
    fill: currentColor;
  }
}
.pageMain {
  flex: auto;
  min-width: 0;
  display: flex;
  flex-flow: column nowrap;
}
.pageTitle {
  margin: 0;
  font-size: 24px;
  font-weight: normal;
  line-height: 1.3;
  color: var(--color-font);
  .mixin-ellipsis-1();
}
.pageActions {
  flex: none;
  display: flex;
  flex-flow: row nowrap;
  margin-top: 10px;
}
.actionBtn {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  margin-right: 8px;
  border: none;
  border-radius: 7px;
  background-color: rgba(0, 0, 0, 0.06);
  color: var(--color-button-font);
  font-size: 12px;
  cursor: pointer;
  transition: background-color @transition-fast;

  svg {
    fill: currentColor;
  }

  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    opacity: .5;
    cursor: default;
  }
}
</style>
