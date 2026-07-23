<template>
  <div v-if="list.length" :class="$style.tagList">
    <div :class="$style.categoryRow">
      <span
        v-for="(tagInfo, index) in list"
        :key="tagInfo.name"
        :class="[$style.category, { [$style.categoryActive]: activeCategoryIndex == index }]"
        @click="activeCategoryIndex = index"
      >{{ tagInfo.name }}</span>
    </div>
    <div :class="$style.tagRow">
      <span
        :class="[$style.tag, { [$style.tagActive]: !tagId }]"
        @click="handleToggleTag('')"
      >{{ $t('default') }}</span>
      <span
        v-for="tag in list[activeCategoryIndex].list"
        :key="tag.id"
        :class="[$style.tag, { [$style.tagActive]: tagId == tag.id }]"
        @click="handleToggleTag(tag.id)"
      >{{ tag.name }}</span>
    </div>
  </div>
</template>

<script setup>
import { watch, shallowReactive, ref } from '@common/utils/vueTools'
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
const activeCategoryIndex = ref(0)

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
  if (tagInfo == null) setTags(tagInfo = await getTags(source), source)

  list.splice(0, list.length, ...[{ name: window.i18n.t('songlist__tag_info_hot_tag'), list: [...tagInfo.hotTag] }, ...tagInfo.tags])
  activeCategoryIndex.value = 0
}, {
  immediate: true,
})
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.tagList {
  display: flex;
  flex-flow: column nowrap;
  padding: 0 20px;
}

.categoryRow {
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  padding-bottom: 5px;
}

.category {
  display: inline-block;
  font-size: 12px;
  padding: 6px 12px;
  cursor: pointer;
  color: var(--color-font-label);
  transition: color @transition-normal;
  &:hover {
    color: var(--color-primary-font-hover);
  }
}

.categoryActive {
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-primary);
}

.tagRow {
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  gap: 5px;
  padding-bottom: 5px;
}

.tag {
  display: inline-block;
  font-size: 12px;
  background-color: var(--color-button-background);
  padding: 6px 12px;
  border-radius: @radius-progress-border;
  transition: background-color @transition-normal;
  cursor: pointer;
  color: var(--color-font);
  &:hover {
    background-color: var(--color-button-background-hover);
  }
  &:active {
    background-color: var(--color-button-background-active);
  }
}

.tagActive {
  background-color: var(--color-primary);
  color: #fff;
  &:hover {
    background-color: var(--color-primary-dark-100);
  }
  &:active {
    background-color: var(--color-primary-dark-200);
  }
}

</style>
