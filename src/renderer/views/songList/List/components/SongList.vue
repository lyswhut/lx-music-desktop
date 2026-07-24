<template>
  <div :class="[$style.container, { [$style.containerOuterScroll]: props.useOuterScroll }]">
    <div v-show="!props.listInfo.noItemLabel" ref="dom_list_ref" :class="[$style.listContent, { [$style.listContentOuterScroll]: props.useOuterScroll }, { scroll: !props.useOuterScroll }]" @scroll="!props.useOuterScroll && handleScroll()">
      <ul>
        <li v-for="item in props.listInfo.list" :key="item.id" :class="$style.item" @click="toDetail(item)">
          <div :class="$style.image">
            <img :class="$style.img" loading="lazy" decoding="async" :src="item.img">
          </div>
          <div :class="$style.desc">
            <h4>{{ item.name }}</h4>
            <div>
              <p :class="$style.author">{{ item.author }}</p>
              <p v-if="item.time" :class="$style.time">{{ item.time }}</p>
              <div :class="$style.songlist_info">
                <span v-if="item.total != null"><svg-icon name="music" />{{ item.total }}</span>
                <span v-if="item.play_count != null"><svg-icon name="headphones" />{{ item.play_count }}</span>
                <span v-if="visibleSource">{{ item.source }}</span>
              </div>
            </div>
          </div>
        </li>
        <li v-for="(i, index) in 6" :key="index" :class="$style.item" style="margin-bottom: 0;height: 0;" />
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
    <div v-if="showScrollTopBtn" :class="$style.scrollTopBtn" @click="scrollToTop">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from '@common/utils/vueTools'
import type { ListInfo, ListInfoItem } from '@renderer/store/songList/state'
import { useRoute, useRouter } from '@common/utils/vueRouter'


const props = withDefaults(defineProps<{
  listInfo: ListInfo
  visibleSource?: boolean
  useOuterScroll?: boolean
}>(), {
  visibleSource: false,
  useOuterScroll: false,
})

const router = useRouter()
const route = useRoute()

const dom_list_ref = ref<HTMLElement | null>(null)
const dom_outerScrollContainer = ref<HTMLElement | null>(null)
const showScrollTopBtn = ref(false)

const emit = defineEmits(['toggle-page'])


const findOuterScrollContainer = (el: HTMLElement | null): HTMLElement | null => {
  while (el && el !== document.body) {
    const style = window.getComputedStyle(el)
    const overflowY = style.overflowY
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return el
    }
    el = el.parentElement
  }
  return null
}

const getScrollContainer = (): HTMLElement | null => props.useOuterScroll ? dom_outerScrollContainer.value : dom_list_ref.value

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

const scrollToTop = () => {
  const container = getScrollContainer()
  if (container) {
    container.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }
}

const handleScroll = () => {
  const container = getScrollContainer()
  if (container) {
    showScrollTopBtn.value = container.scrollTop > 100
  }
}

onMounted(() => {
  if (props.useOuterScroll) {
    void nextTick(() => {
      dom_outerScrollContainer.value = findOuterScrollContainer(dom_list_ref.value?.parentElement ?? null)
      if (dom_outerScrollContainer.value) {
        dom_outerScrollContainer.value.addEventListener('scroll', handleScroll)
      }
    })
  }
})

onBeforeUnmount(() => {
  if (props.useOuterScroll && dom_outerScrollContainer.value) {
    dom_outerScrollContainer.value.removeEventListener('scroll', handleScroll)
  }
})

defineExpose({
  scrollTo(top: number) {
    const container = getScrollContainer()
    container?.scrollTo({
      top,
      // behavior: 'smooth',
    })
  },
  getScrollTop() {
    const container = getScrollContainer()
    return container?.scrollTop ?? 0
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
.containerOuterScroll {
  overflow: visible;
  height: auto;
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
  padding: 15px 15px 0;

  ul {
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
  }
}
.listContentOuterScroll {
  position: static;
  width: 100%;
  height: auto;
  display: flex;
  flex-flow: column nowrap;
  font-size: 14px;
  box-sizing: border-box;
  padding: 15px 15px 0;

  ul {
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
  }
}
.item {
  max-width: 360px;
  width: 32%;
  box-sizing: border-box;
  display: flex;
  // flex-flow: column nowrap;
  // padding: 10px;
  margin-bottom: 20px;
  cursor: pointer;
  transition: opacity @transition-normal;
  &:hover {
    opacity: .7;
  }
}
.image {
  flex: none;
  width: 40%;
  display: flex;
  background-position: center;
  background-size: cover;
  border-radius: 4px;
  overflow: hidden;
  opacity: .9;
  aspect-ratio: 1 / 1;

  box-shadow: 0 0 2px 0 rgba(0,0,0,.2);
}
.img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.desc {
  flex: auto;
  padding: 2px 15px 2px 7px;
  overflow: hidden;
  h4 {
    font-size: 14px;
    // height: 2.6em;
    text-align: justify;
    line-height: 1.3;
    .mixin-ellipsis-2();
  }
}
.songlist_info {
  display: flex;
  flex-flow: row nowrap;
  gap: 15px;
  margin-top: 8px;
  font-size: 12px;
  .mixin-ellipsis-1();
  text-align: justify;
  line-height: 1.2;
  // text-indent: 24px;
  color: var(--color-font-label);
  svg {
    margin-right: 2px;
  }
}
.author {
  margin-top: 6px;
  font-size: 12px;
  .mixin-ellipsis-1();
  text-align: justify;
  line-height: 1.3;
  // text-indent: 24px;
  color: var(--color-font-label);
}
.time {
  margin-top: 3px;
  font-size: 12px;
  .mixin-ellipsis-1();
  text-align: justify;
  line-height: 1.3;
  // text-indent: 24px;
  color: var(--color-font-label);
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
    color: var(--color-font-label);
  }
}

.scrollTopBtn {
  position: fixed !important;
  right: 24px !important;
  bottom: 80px !important;
  width: 44px !important;
  height: 44px !important;
  border-radius: 50% !important;
  background-color: #42b883 !important;
  color: #ffffff !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  box-shadow: 0 4px 16px rgba(66, 184, 131, 0.4) !important;
  z-index: 99999 !important;
  transition: background-color 0.2s ease !important;

  &:hover {
    background-color: #36a070 !important;
  }

  svg {
    width: 24px;
    height: 24px;
  }
}
</style>
