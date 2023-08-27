<template>
  <material-modal :show="visible" bg-close teleport="#view" width="60%" max-width="900px" @close="$emit('update:visible', false)">
    <div :class="$style.header">
      <h2>{{ listName }}</h2>
    </div>
    <base-virtualized-list
      v-if="duplicateList.length" v-slot="{ item, index }" :list="duplicateList" key-name="id" :class="$style.list" style="contain: none;"
      :item-height="listItemHeight" container-class="scroll" content-class="list"
    >
      <div :class="$style.listItem">
        <div :class="$style.num">{{ item.index + 1 }}</div>
        <div :class="$style.textContent">
          <h3 :class="$style.text" :aria-label="`${item.musicInfo.name} - ${item.musicInfo.singer}`">{{ item.musicInfo.name }} - {{ item.musicInfo.singer }}</h3>
          <h3 v-if="item.musicInfo.meta.albumName" :class="[$style.text, $style.albumName]" :aria-label="item.musicInfo.meta.albumName">{{ item.musicInfo.meta.albumName }}</h3>
        </div>
        <div :class="$style.label">{{ item.musicInfo.source }}</div>
        <div :class="$style.label">{{ item.musicInfo.interval }}</div>
        <div :class="$style.btns">
          <button type="button" :class="$style.btn" @click="handlePlay(index)">
            <svg v-once version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="50%" viewBox="0 0 287.386 287.386" space="preserve">
              <use xlink:href="#icon-testPlay" />
            </svg>
          </button>
          <button type="button" :class="$style.btn" @click="handleRemove(index)">
            <svg v-once version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="50%" viewBox="0 0 212.982 212.982" space="preserve">
              <use xlink:href="#icon-delete" />
            </svg>
          </button>
        </div>
      </div>
    </base-virtualized-list>
    <div v-else :class="$style.noItem">
      <p v-text="$t('no_item')" />
    </div>
  </material-modal>
</template>

<script>
import { ref, watch, computed, markRawList } from '@common/utils/vueTools'
import { playList } from '@renderer/core/player'
import { getListMusics, removeListMusics } from '@renderer/store/list/action'
import { isFullscreen } from '@renderer/store'
import { appSetting } from '@renderer/store/setting'
import { getFontSizeWithScreen } from '@renderer/utils'
import { LIST_IDS } from '@common/constants'
import { useI18n } from '@root/lang'

export default {
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    listInfo: { // { id: '', name: '' }
      type: Object,
      required: true,
    },
  },
  emits: ['update:visible'],
  setup(props) {
    const t = useI18n()
    const duplicateList = ref([])
    const listItemHeight = computed(() => {
      return Math.ceil((isFullscreen.value ? getFontSizeWithScreen() : appSetting['common.fontSize']) * 3.2)
    })

    const handlePlay = (index) => {
      const { index: musicInfoIndex } = duplicateList.value[index]
      playList(props.listInfo.id, musicInfoIndex)
    }
    const handleFilterList = async() => {
      // console.time('filter')
      duplicateList.value = markRawList(await window.lx.worker.main.filterDuplicateMusic(await getListMusics(props.listInfo.id)))
      // console.log(duplicateList.value)
      // console.timeEnd('filter')
    }
    const handleRemove = async(index) => {
      const { musicInfo: targetMusicInfo } = duplicateList.value.splice(index, 1)[0]
      duplicateList.value = [...duplicateList.value]
      await removeListMusics({ listId: props.listInfo.id, ids: [targetMusicInfo.id] })
      await handleFilterList()
    }

    watch(() => props.visible, (visible) => {
      if (visible) {
        if (duplicateList.value.length) duplicateList.value = []
        void handleFilterList()
      }
    })

    const listName = computed(() => {
      switch (props.listInfo.id) {
        case LIST_IDS.DEFAULT:
        case LIST_IDS.LOVE:
          return t(props.listInfo.name)

        default: return props.listInfo.name
      }
    })

    return {
      listItemHeight,
      duplicateList,
      handleFilterList,
      handleRemove,
      handlePlay,
      listName,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.header {
  flex: none;
  padding: 15px;
  text-align: center;
  h2 {
    word-break: break-all;
  }
}
.main {
  min-height: 200px;
  min-width: 460px;
  // display: flex;
  // flex-flow: column nowrap;
}

.list {
  min-height: 200px;
  min-width: 460px;
  // background-color: @color-search-form-background;
  font-size: 13px;
  transition-property: height;
  // position: relative;
  .listItem {
    position: relative;
    padding: 0 5px;
    transition: background-color .2s ease;
    line-height: 1.4;
    height: 100%;
    // overflow: hidden;
    display: flex;
    flex-flow: row nowrap;
    align-items: center;

    &:hover {
      background-color: var(--color-primary-background-hover);
    }
    // border-radius: 4px;
    // &:last-child {
    //   border-bottom-left-radius: 4px;
    //   border-bottom-right-radius: 4px;
    // }
  }
}

.num {
  flex: none;
  font-size: 12px;
  width: 30px;
  text-align: center;
  color: var(--color-font-label);
}

.textContent {
  flex: auto;
  padding-left: 5px;
  min-width: 0;
  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
  overflow: hidden;
}
.text {
  max-width: 100%;
  .mixin-ellipsis-1;
}
.albumName {
  font-size: 12px;
  opacity: 0.6;
  // .mixin-ellipsis-1;
}
.label {
  flex: none;
  font-size: 12px;
  opacity: 0.5;
  padding: 0 5px;
  display: flex;
  align-items: center;
  // transform: rotate(45deg);
  // background-color:
}
.btns {
  flex: none;
  font-size: 12px;
  padding: 0 5px;
  display: flex;
  align-items: center;
}
.btn {
  background-color: transparent;
  border: none;
  border-radius: @form-radius;
  margin-right: 5px;
  cursor: pointer;
  padding: 4px 7px;
  color: var(--color-button-font);
  outline: none;
  transition: background-color 0.2s ease;
  line-height: 0;
  &:last-child {
    margin-right: 0;
  }

  svg {
    height: 16px;
  }

  &:hover {
    background-color: var(--color-primary-background-hover);
  }
  &:active {
    background-color: var(--color-primary-font-active);
  }
}

.noItem {
  position: relative;
  height: 200px;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;

  p {
    font-size: 16px;
    color: var(--color-font-label);
  }
}

</style>
