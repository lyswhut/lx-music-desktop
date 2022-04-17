<template>
<material-modal :show="visible" @close="$emit('update:visible', false)" bg-close teleport="#view">
  <div :class="$style.header">
    <h2>{{$t('list_update_modal__title')}}</h2>
  </div>
  <main class="scroll" :class="$style.main">
    <ul ref="dom_list" v-if="lists.length" :class="$style.list">
      <li v-for="(list, index) in lists" :key="list.id" :class="[$style.listItem, {[$style.fetching]: fetchingListStatus[list.id]}]">
        <div :class="$style.listLeft">
          <h3 :class="$style.text">{{list.name}} <span :class="$style.label">{{list.source}}</span></h3>
          <div>
            <base-checkbox :class="$style.checkbox" :id="`list_auto_update_${list.id}`" :modelValue="autoUpdate[list.id] == true"
              @change="handleChangeAutoUpdate(list, $event)" :label="$t('list_update_modal__auto_update')" />
            <span :class="$style.label" style="vertical-align: text-top;">{{listUpdateTimes[list.id]}}</span>
          </div>
        </div>
        <div :class="$style.btns">
          <button :class="$style.btn" :disabled="fetchingListStatus[list.id]" outline="outline" :aria-label="$t('list_update_modal__update')" @click.stop="handleUpdate(index)">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" style="transform: rotate(45deg);" viewBox="0 0 24 24" space="preserve">
              <use xlink:href="#icon-refresh" />
            </svg>
          </button>
        </div>
      </li>
    </ul>
    <div :class="$style.noItem" v-else>
      <p v-text="$t('no_item')"></p>
    </div>
  </main>
  <div :class="$style.footer">
    <div :class="$style.tips">{{$t('list_update_modal__tips')}}</div>
  </div>
</material-modal>
</template>

<script>
import { computed, reactive } from '@renderer/utils/vueTools'
import { userLists, fetchingListStatus } from '@renderer/core/share/list'
import musicSdk from '@renderer/utils/music'
import { getListUpdateInfo, setListAutoUpdate } from '@renderer/utils/data'

export default {
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    listUpdateTimes: Object,
  },
  emits: ['update-list', 'update:visible'],
  setup(props, { emit }) {
    const lists = computed(() => userLists.filter(l => !!l.source && !!musicSdk[l.source]?.songList))
    const autoUpdate = reactive({})
    for (const [id, value] of Object.entries(getListUpdateInfo())) {
      autoUpdate[id] = value.isAutoUpdate == true
    }

    const handleChangeAutoUpdate = (list, enable) => {
      setListAutoUpdate(list.id, enable)
      autoUpdate[list.id] = enable
    }
    const handleUpdate = index => {
      emit('update-list', lists.value[index])
    }
    return {
      lists,
      autoUpdate,
      fetchingListStatus,
      handleUpdate,
      handleChangeAutoUpdate,
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
      background-color: @color-theme_2-hover;
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
  color: @color-btn;
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
    background-color: @color-theme_2-hover;
  }
  &:active {
    background-color: @color-theme_2-active;
  }
}

.footer {
  width: @width;
}
.tips {
  padding: 8px 15px;
  font-size: 13px;
  line-height: 1.25;
  color: @color-theme_2-font;
}

.no-item {
  position: relative;
  height: 200px;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;

  p {
    font-size: 16px;
    color: @color-theme_2-font-label;
  }
}

each(@themes, {
  :global(#root.@{value}) {
    .listItem {
      &:hover {
        background-color: ~'@{color-@{value}-theme_2-hover}';
      }
    }
    .btn {
      color: ~'@{color-@{value}-btn}';
      &:hover {
        background-color: ~'@{color-@{value}-theme_2-hover}';
      }
      &:active {
        background-color: ~'@{color-@{value}-theme_2-active}';
      }
    }
    .note {
      color: ~'@{color-@{value}-theme_2-font}';
    }
    .no-item {
      p {
        color: ~'@{color-@{value}-theme_2-font-label}';
      }
    }
  }
})

</style>
