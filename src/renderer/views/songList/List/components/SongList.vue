<template>
  <div :class="$style.container">
    <div v-show="!props.listInfo.noItemLabel" ref="dom_list_ref" :class="$style.listContent" class="scroll">
      <ul>
        <li v-for="item in props.listInfo.list" :key="item.id" :class="$style.item" @click="toDetail(item)">
          <div :class="$style.image">
            <img :class="$style.img" loading="lazy" decoding="async" :src="item.img">
            <span v-if="item.play_count != null" :class="$style.countOverlay">{{ item.play_count }}</span>
            <span :class="$style.artPlay">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1024 1024" space="preserve">
                <use xlink:href="#icon-play" />
              </svg>
            </span>
          </div>
          <div :class="$style.desc">
            <h4 :title="item.name">{{ item.name }}</h4>
            <p :class="$style.meta">
              <template v-if="item.author">{{ item.author }}</template>
              <template v-if="item.total != null"> · {{ item.total }}</template>
            </p>
          </div>
        </li>
      </ul>
      <div :class="$style.pagination">
        <material-pagination :count="props.listInfo.total" :limit="props.listInfo.limit" :page="props.listInfo.page" @btn-click="togglePage" />
      </div>
    </div>
    <transition enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
      <div v-show="props.listInfo.noItemLabel" :class="$style.noitem">
        <p v-text="props.listInfo.noItemLabel" />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from '@common/utils/vueTools'
import type { ListInfo, ListInfoItem } from '@renderer/store/songList/state'
import { useRoute, useRouter } from '@common/utils/vueRouter'


const props = withDefaults(defineProps<{
  listInfo: ListInfo
  visibleSource?: boolean
}>(), {
  visibleSource: false,
})

const router = useRouter()
const route = useRoute()

const dom_list_ref = ref<HTMLElement | null>(null)

const emit = defineEmits(['toggle-page'])


const togglePage = (page: number) => {
  emit('toggle-page', page)
}

const toDetail = (info: ListInfoItem) => {
  void router.push({
    path: '/songList/detail',
    query: {
      source: info.source,
      id: info.id,
      picUrl: info.img,
      fromName: route.name as string,
    },
  })
}

defineExpose({
  scrollTo(top: number) {
    dom_list_ref.value?.scrollTo({
      top,
      // behavior: 'smooth',
    })
  },
  getScrollTop() {
    return dom_list_ref.value?.scrollTop ?? 0
  },
})


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

.listContent {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  font-size: 14px;
  box-sizing: border-box;
  padding: 0;

  ul {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 19px;
    align-items: start;
  }
}
.item {
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-flow: column nowrap;
  cursor: pointer;
  text-align: left;
  &:hover, &:focus-within {
    .img {
      transform: scale(1.035);
    }
    .artPlay {
      opacity: 1;
      transform: none;
    }
    .countOverlay {
      opacity: 0;
    }
  }
}
.image {
  position: relative;
  flex: none;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 9px;
  background: var(--color-well);
  box-shadow: 0 4px 13px color-mix(in srgb, var(--color-font) 7%, transparent);
}
.img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .4s ease;
}

.countOverlay {
  position: absolute;
  top: 9px;
  right: 9px;
  padding: 3px 6px;
  border-radius: 9px;
  background: color-mix(in srgb, var(--color-font) 45%, transparent);
  color: white;
  font-size: 9px;
  backdrop-filter: blur(6px);
  z-index: 1;
}

.artPlay {
  position: absolute;
  right: 10px;
  bottom: 10px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--color-panel) 86%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-000) 38%, transparent);
  color: var(--color-font);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--color-font) 12%, transparent);
  backdrop-filter: blur(10px);
  opacity: 0;
  transform: translateY(3px);
  transition: opacity .18s ease, transform .18s ease;
  svg {
    width: 16px;
    height: 16px;
    fill: currentColor;
  }
}

.desc {
  min-width: 0;
  padding: 10px 0 0;
  overflow: hidden;
  h4 {
    margin: 0;
    font-size: 12px;
    line-height: 1.6;
    font-weight: 620;
    .mixin-ellipsis-2();
  }
}
.meta {
  margin: 1px 0 0;
  font-size: 10px;
  color: var(--color-secondary);
  .mixin-ellipsis-1();
}
.pagination {
  text-align: center;
  padding: 15px 0;
  // left: 50%;
  // transform: translateX(-50%);
}
.noitem {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  // background-color: var(--color-000);

  p {
    font-size: 24px;
    color: var(--color-secondary);
  }
}

</style>
