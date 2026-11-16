<template>
  <div :class="$style.sortSegmented">
    <button
      v-for="item in list"
      :key="item.id"
      type="button"
      :class="[$style.segmentedBtn, { [$style.segmentedBtnActive]: sortId == item.id }]"
      @click="handleToggle(item.id)"
    >{{ item.name }}</button>
  </div>
</template>

<script setup>
import { watch, shallowReactive } from '@common/utils/vueTools'
import { sortList } from '@renderer/store/songList/state'
import { useRouter, useRoute } from '@common/utils/vueRouter'

const props = defineProps({
  source: {
    type: String,
    required: true,
  },
  tagId: {
    type: String,
    required: true,
  },
  sortId: {
    type: String,
    default: '',
  },
})

const router = useRouter()
const route = useRoute()

const list = shallowReactive([])


const handleToggle = (id) => {
  void router.replace({
    path: route.path,
    query: {
      source: props.source,
      tagId: props.tagId,
      sortId: id,
    },
  })
}
watch(() => props.source, async(source) => {
  // const source = (await getLeaderboardSetting()).source as LX.OnlineSource
  if (!source) return
  let _list = sortList[source] ?? []
  list.splice(0, list.length, ..._list)
  if (!props.sortId && list.length) handleToggle(list[0].id)
  // console.log(list)
}, {
  immediate: true,
})
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.sortSegmented {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  flex: none;
  border: 1px solid var(--color-primary);
  border-radius: 13px;
  overflow: hidden;
  height: 26px;
}

.segmentedBtn {
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 500;
  padding: 0 13px;
  cursor: pointer;
  transition: background-color .2s ease, color .2s ease;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(.segmentedBtnActive) {
    background-color: var(--color-primary-light-400-alpha-300);
  }
}

.segmentedBtnActive {
  background-color: var(--color-primary);
  color: #fff;

  &:hover {
    background-color: var(--color-primary);
  }
}

.tagList {
  font-size: 12px;
  position: relative;

  &.active {
    .label {
      .icon {
        svg{
          transform: rotate(180deg);
        }
      }
    }
    .list {
      opacity: 1;
      transform: scaleY(1);
    }
  }
}

.label {
  padding: 8px 15px;
  // background-color: var(--color-button-background);
  transition: background-color @transition-normal;
  // border-top: 2px solid @color-tab-border-bottom;
  // border-left: 2px solid @color-tab-border-bottom;
  box-sizing: border-box;
  text-align: center;
  // border-top-left-radius: 3px;
  color: var(--color-button-font);
  cursor: pointer;

  display: flex;

  span {
    flex: auto;
  }
  .icon {
    flex: none;
    margin-left: 7px;
    line-height: 0;
    svg {
      width: .9em;
      transition: transform .2s ease;
      transform: rotate(0);
    }
  }

  &:hover {
    background-color: var(--color-button-background-hover);
  }
  &:active {
    background-color: var(--color-button-background-active);
  }
}

.list {
  position: absolute;
  top: 100%;
  width: 645px;
  left: 0;
  // border-bottom: 2px solid @color-tab-border-bottom;
  // border-right: 2px solid @color-tab-border-bottom;
  border-bottom-right-radius: 5px;
  background-color: var(--color-main-background);
  opacity: 0;
  transform: scaleY(0);
  overflow-y: auto;
  transform-origin: 0 0 0;
  max-height: 250px;
  transition: .25s ease;
  transition-property: transform, opacity;
  z-index: 10;
  padding: 10px;
  box-sizing: border-box;

  li {
    cursor: pointer;
    padding: 8px 15px;
    // color: var(--color-button-font);
    text-align: center;
    outline: none;
    transition: background-color @transition-normal;
    background-color: var(--color-button-background);
    box-sizing: border-box;

    &:hover {
      background-color: var(--color-button-background-hover);
    }
    &:active {
      background-color: var(--color-button-background-active);
    }
  }
}

.type {
  padding-top: 10px;
  padding-bottom: 3px;
  color: var(--color-font-label);
}

.tag {
  display: inline-block;
  margin: 5px;
  background-color: var(--color-button-background);
  padding: 8px 10px;
  border-radius: @radius-progress-border;
  transition: background-color @transition-normal;
  cursor: pointer;
  &:hover {
    background-color: var(--color-button-background-hover);
  }
  &:active {
    background-color: var(--color-button-background-active);
  }
}
</style>
