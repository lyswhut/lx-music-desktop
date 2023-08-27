<template>
  <material-modal :show="visible" bg-close teleport="#view" @close="$emit('update:visible', false)">
    <div :class="$style.header">
      <h2>{{ $t('list_update_modal__title') }}</h2>
    </div>
    <main class="scroll" :class="$style.main">
      <ul v-if="lists.length" ref="dom_list" :class="$style.list">
        <li v-for="list in lists" :key="list.id" :class="[$style.listItem, {[$style.fetching]: fetchingListStatus[list.id]}]">
          <div :class="$style.listLeft">
            <h3 :class="$style.text">{{ list.name }} <span :class="$style.label">{{ list.source }}</span></h3>
            <div>
              <base-checkbox
                :id="`list_auto_update_${list.id}`" :model-value="updateInfo[list.id]?.isAutoUpdate == true"
                :class="$style.checkbox" :label="$t('list_update_modal__auto_update')" @change="handleChangeAutoUpdate(list, $event)"
              />
              <span :class="$style.label" style="vertical-align: text-top;">{{ listUpdateTimes[list.id] }}</span>
            </div>
          </div>
          <div :class="$style.btns">
            <button :class="$style.btn" :disabled="fetchingListStatus[list.id]" outline="outline" :aria-label="$t('list_update_modal__update')" @click.stop="handleUpdate(list)">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" style="transform: rotate(45deg);" viewBox="0 0 24 24" space="preserve">
                <use xlink:href="#icon-refresh" />
              </svg>
            </button>
          </div>
        </li>
      </ul>
      <div v-else :class="$style.noItem">
        <p v-text="$t('no_item')" />
      </div>
    </main>
    <div :class="$style.footer">
      <div :class="$style.tips">{{ $t('list_update_modal__tips') }}</div>
    </div>
  </material-modal>
</template>

<script>
import { computed, ref } from '@common/utils/vueTools'
import { userLists, fetchingListStatus, listUpdateTimes } from '@renderer/store/list/state'
import handleSyncSourceList from '@renderer/store/list/syncSourceList'
import musicSdk from '@renderer/utils/musicSdk'
// import { dateFormat } from '@common/utils/renderer'
import { getListUpdateInfo, setListAutoUpdate } from '@renderer/utils/data'

export default {
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:visible'],
  setup() {
    const lists = computed(() => userLists.filter(l => !!l.source && !!musicSdk[l.source]?.songList))
    const updateInfo = ref({})
    // const updateTimes = ref({})

    void getListUpdateInfo().then((listUpdateInfo) => {
      updateInfo.value = listUpdateInfo
      // if (listUpdateTimes._inited) {
      //   for (const [id, value] of Object.entries(info)) {
      //     autoUpdate[id] = value.isAutoUpdate == true
      //   }
      // } else {
      //   for (const [id, value] of Object.entries(info)) {
      //     autoUpdate[id] = value.isAutoUpdate == true
      //     listUpdateTimes[id] = value.updateTime ? dateFormat(value.updateTime) : ''
      //   }
      // }
      // listUpdateTimes._inited = true
    })

    const handleUpdate = (targetListInfo) => {
      void handleSyncSourceList(targetListInfo)
      // console.log(targetListInfo.list.length, list.length)
    }

    const handleChangeAutoUpdate = (list, enable) => {
      void setListAutoUpdate(list.id, enable)
    }

    return {
      lists,
      updateInfo,
      fetchingListStatus,
      handleUpdate,
      handleChangeAutoUpdate,
      listUpdateTimes,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

@width: 460px;

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
  width: @width;
}

.list {
  // background-color: @color-search-form-background;
  font-size: 13px;
  transition-property: height;
  position: relative;
  .listItem {
    position: relative;
    padding: 15px 10px 15px 15px;
    transition: .3s ease;
    transition-property: background-color, opacity;
    line-height: 1.3;
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
    &.fetching {
      opacity: .5;
    }
  }
}

.listLeft {
  flex: auto;
  min-width: 0;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
}

.text {
  flex: auto;
  margin-bottom: 2px;
  .mixin-ellipsis-1;
}
.checkbox {
  margin-top: 3px;
  font-size: 14px;
  opacity: .86;
}

.label {
  flex: none;
  font-size: 12px;
  opacity: 0.5;
  padding: 0 10px;
  // display: flex;
  // align-items: center;
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
    height: 22px;
    width: 22px;
  }

  &:hover {
    background-color: var(--color-primary-background-hover);
  }
  &:active {
    background-color: var(--color-primary-font-active);
  }
}

.footer {
  width: @width;
}
.tips {
  padding: 8px 15px;
  font-size: 13px;
  line-height: 1.25;
  color: var(--color-font);
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
