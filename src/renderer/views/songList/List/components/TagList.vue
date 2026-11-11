<template>
  <div :class="$style.tagList">
    <div :class="$style.categoryRow">
      <div
        v-for="(tagInfo, index) in list"
        :key="tagInfo.name"
        :class="[$style.category, { [$style.categoryActive]: activeCategory === index }]"
        @click="handleSwitchCategory(index)"
      >{{ tagInfo.name }}</div>
    </div>
    <div :class="$style.tagRow">
      <div :class="[$style.tag, { [$style.tagActive]: !tagId }]" @click="handleToggleTag('')">{{ $t('default') }}</div>
      <div
        v-for="tag in activeTagList"
        :key="tag.id"
        :class="[$style.tag, { [$style.tagActive]: tagId === tag.id }]"
        @click="handleToggleTag(tag.id)"
      >{{ tag.name }}</div>
    </div>
  </div>
</template>

<script setup>
import { watch, shallowReactive, ref, computed } from '@common/utils/vueTools'
import { setTags, getTags } from '@renderer/store/songList/action'
import { tags } from '@renderer/store/songList/state'
import { requestMsg } from '@renderer/utils/message'
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
const activeCategory = ref(0)

const activeTagList = computed(() => list[activeCategory.value]?.list ?? [])

const handleSwitchCategory = (index) => {
  activeCategory.value = index
}

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
  let tagInfo = tags[source]
  if (tagInfo == null) {
    try {
      tagInfo = await getTags(source)
    } catch (error) {
      // 快速切换源时旧请求被取消，属正常流程
      if (error?.message !== requestMsg.cancelRequest) console.log(error)
      return
    }
    setTags(tagInfo, source)
  }

  list.splice(0, list.length, ...[{ name: window.i18n.t('songlist__tag_info_hot_tag'), list: [...tagInfo.hotTag] }, ...tagInfo.tags])
  activeCategory.value = 0
}, {
  immediate: true,
})
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.tagList {
  width: 100%;
  padding-left: 12px;
}

.categoryRow {
  display: flex;
  flex-flow: row wrap;
  gap: 8px;
  padding: 4px 0;
}

.category {
  font-size: 13px;
  color: var(--color-font-label);
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 4px;
  transition: color @transition-fast, background-color @transition-fast;

  &:hover {
    color: var(--color-primary-font-hover);
    background-color: var(--color-primary-light-400-alpha-300);
  }

  &.categoryActive {
    color: var(--color-primary);
    background-color: var(--color-primary-light-400-alpha-300);
    font-weight: 500;
  }
}

.tagRow {
  display: flex;
  flex-flow: row wrap;
  gap: 8px;
  padding: 4px 0 10px;
}

.tag {
  display: inline-block;
  font-size: 12px;
  background-color: var(--color-primary-light-400-alpha-300);
  padding: 4px 10px;
  border-radius: @radius-progress-border;
  transition: background-color @transition-fast, color @transition-fast;
  cursor: pointer;
  color: var(--color-primary);

  &:hover {
    background-color: var(--color-primary-light-400-alpha-500);
  }

  &.tagActive {
    background-color: var(--color-primary);
    color: #fff;
  }
}
</style>
