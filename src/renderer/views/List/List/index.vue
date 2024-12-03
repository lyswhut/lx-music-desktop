<!--
 * @Description: 我的最爱
 * @Author: 14K
 * @Date: 2024-12-03 15:39:40
 * @LastEditTime: 2024-12-03 23:16:57
 * @LastEditors: 14K
-->
<template>
  <div :class="$style.lists" :style="rowStyles">
    <div>
      <div>
        <Cover
        :id="loveList.id"
        :image-url="_loveLists.cover || ''"
        :play-button-size="22"
      />
     </div>
     <div :class="$style.text">
       <div :class="$style.title">{{ $t(loveList.name) }} </div>
      </div>
    </div>
    <div>
      <div>
        <Cover
        :id="defaultList.id"
        :image-url="_defaultLists.cover || ''"
        :play-button-size="22"
      />
     </div>
      <div :class="$style.text">
        <div :class="$style.title"> {{ $t(defaultList.name) }} </div>
      </div>
    </div>

    <div v-for="item in _userLists" :key="item.id">
      <div>
        <Cover
        :id="item.id"
        :image-url="item.cover || ''"
        :play-button-size="22"
      />
     </div>
     <div :class="$style.text">
        <div :class="$style.title"> {{ item.name }} </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { loveList, defaultList, userLists } from '@renderer/store/list/state'
import { getListMusics } from '@renderer/store/list/action'
import { ref, computed, onBeforeUnmount, watch } from 'vue'
import Cover from './Cover.vue'

let stopWatchUserList: any = null

interface List {
  cover: string | null | undefined
  id: string
}

const props = defineProps({
  columnNumber: {
    type: Number,
    default: 5,
  },
  gap: {
    type: String,
    default: '24px 24px',
  },
})

const _loveLists = ref<List>({ cover: null, id: '' })
const _defaultLists = ref<List>({ cover: null, id: '' })
const _userLists = ref<Array<List & { name: string }>>([])

const rowStyles = computed(() => ({
  'grid-template-columns': `repeat(${props.columnNumber}, 1fr)`,
  gap: props.gap,
}))

getListMusics(loveList.id).then(res => {
  if (res && res.length > 0) {
    _loveLists.value = {
      cover: res.find(item => item.meta.picUrl)?.meta.picUrl,
      id: loveList.id,
    }
  }
})

getListMusics(defaultList.id).then(res => {
  if (res && res.length > 0) {
    _defaultLists.value = {
      cover: res.find(item => item.meta.picUrl)?.meta.picUrl,
      id: defaultList.id,
    }
  }
})

async function fetchAndAddList(id: string, name: string) {
  const res = await getListMusics(id)
  if (res) {
    _userLists.value.push({
      cover: res.find(item => item.meta.picUrl)?.meta.picUrl,
      name,
      id,
    })
  }
}

const getList = () => {
  _userLists.value = []
  userLists.forEach(list => {
    console.log('list', list.id, list.name)
    fetchAndAddList(list.id, list.name)
  })
}
getList()
stopWatchUserList = watch(userLists, getList)

onBeforeUnmount(() => {
  if (stopWatchUserList) {
    stopWatchUserList()
    stopWatchUserList = null
  }
})

</script>
<style lang="less" module>
@import '@renderer/assets/styles/layout.less';
.lists{
  display: grid;
  > div{
    .text {
      margin-top: 8px;
      .title {
        font-size: 16px;
        font-weight: 600;
        line-height: 20px;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        word-break: break-all;
      }
      .info {
        font-size: 12px;
        opacity: 0.68;
        line-height: 18px;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        word-break: break-word;
      }
    }
  }
}
</style>
