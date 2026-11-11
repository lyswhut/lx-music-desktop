<template>
  <div :class="$style.tagList">
    <base-tab :model-value="activeCate" :class="$style.cateTab" :list="cateList" item-label="label" @change="activeCate = $event" />
    <div :class="$style.tagRow">
      <div v-if="activeCate === 0" :class="[$style.tag, { [$style.active]: !tagId }]" @click="handleToggleTag('')">{{ $t('default') }}</div>
      <div v-for="tag in activeTags" :key="tag.id" :class="[$style.tag, { [$style.active]: tagId == tag.id }]" @click="handleToggleTag(tag.id)">{{ tag.name }}</div>
    </div>
  </div>
</template>

<script setup>
import { watch, shallowReactive, ref, computed } from '@common/utils/vueTools'
import { setTags, getTags } from '@renderer/store/songList/action'
import { tags } from '@renderer/store/songList/state'
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
    type: [String, undefined],
    default: undefined,
  },
})

const router = useRouter()
const route = useRoute()

const list = shallowReactive([])
const activeCate = ref(0)

const cateList = computed(() => list.map((cate, index) => ({ id: index, label: cate.name })))
const activeTags = computed(() => list[activeCate.value]?.list ?? [])

const handleToggleTag = (id) => {
  void router.replace({
    path: route.path,
    query: {
      source: props.source,
      tagId: id,
      sortId: props.sortId,
    },
  })
}

watch(() => props.source, async(source) => {
  if (!source) return
  // const setting = (await getSongListSetting()).source as LX.OnlineSource
  let tagInfo = tags[source]
  if (tagInfo == null) setTags(tagInfo = await getTags(source), source)

  list.splice(0, list.length, ...[{ name: window.i18n.t('songlist__tag_info_hot_tag'), list: [...tagInfo.hotTag] }, ...tagInfo.tags])
  activeCate.value = 0
}, {
  immediate: true,
})

// 当前选中的标签不在激活分类时，自动切换到其所在分类
watch(() => [props.tagId, list.length], () => {
  if (!props.tagId) return
  const index = list.findIndex(cate => cate.list.some(tag => tag.id == props.tagId))
  if (index > -1) activeCate.value = index
}, {
  immediate: true,
})

</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.tagList {
  font-size: 12px;
  flex: auto;
  min-width: 0;
}

// 分类标签行：选中效果覆盖为基础组件的相反样式——无加粗、带下划线
.cateTab {
  :global(li[aria-selected='true']) {
    > span {
      font-weight: normal;
      position: relative;

      &:after {
        .mixin-after();
        left: 0;
        bottom: 0;
        width: 100%;
        height: 2px;
        border-radius: 20px;
        background-color: var(--color-primary-alpha-300);
      }
    }
  }
}

.tagRow {
  display: flex;
  flex-flow: row wrap;
  gap: 10px;
  padding: 6px 15px 2px;
}

.tag {
  display: inline-block;
  background-color: var(--color-button-background);
  padding: 4px 12px;
  border-radius: @radius-progress-border;
  transition: background-color @transition-normal;
  cursor: pointer;

  &:hover {
    background-color: var(--color-button-background-hover);
  }

  &:active {
    background-color: var(--color-button-background-active);
  }

  &.active {
    background-color: var(--color-primary);
    color: #fff;
    cursor: default;
  }
}

</style>
