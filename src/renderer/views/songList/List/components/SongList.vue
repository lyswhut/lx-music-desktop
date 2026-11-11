<template>
  <div :class="$style.container">
    <div v-show="!props.listInfo.noItemLabel" ref="dom_list_ref" :class="$style.listContent" class="scroll">
      <ul>
        <li v-for="item in props.listInfo.list" :key="item.id" :class="$style.item" @click="toDetail(item)">
          <div :class="$style.image">
            <img :class="$style.img" loading="lazy" decoding="async" :src="item.img">
            <div :class="$style.mask" />
            <div :class="$style.playBtn">
              <svg-icon name="play" />
            </div>
            <div v-if="item.play_count != null" :class="$style.playCount">
              <svg-icon name="headphones" />{{ item.play_count }}
            </div>
          </div>
          <div :class="$style.desc">
            <h4>{{ item.name }}</h4>
          </div>
        </li>
        <li v-for="(i, index) in 6" :key="index" :class="$style.item" style="margin-bottom: 0;height: 0;" />
      </ul>
      <div v-if="infiniteScroll" :class="$style.loadMore">
        <span v-show="loadingMore">{{ $t('list__loading') }}</span>
      </div>
      <div v-else :class="$style.pagination">
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
import { ref, onMounted, onBeforeUnmount } from '@common/utils/vueTools'
import type { ListInfo, ListInfoItem } from '@renderer/store/songList/state'
import { useRoute, useRouter } from '@common/utils/vueRouter'


const props = withDefaults(defineProps<{
  listInfo: ListInfo
  visibleSource?: boolean
  // 无限滚动模式：隐藏分页，滚动到列表底部附近时触发 load-more 事件
  infiniteScroll?: boolean
  // 无限滚动模式下的加载中状态（防止重复触发）
  loadingMore?: boolean
}>(), {
  visibleSource: false,
  infiniteScroll: false,
  loadingMore: false,
})

const router = useRouter()
const route = useRoute()

const dom_list_ref = ref<HTMLElement | null>(null)

const emit = defineEmits(['toggle-page', 'load-more'])


const togglePage = (page: number) => {
  emit('toggle-page', page)
}

// 无限滚动：滚动到距离底部 600px 内时触发加载下一页
const handleListScroll = () => {
  if (!props.infiniteScroll || props.loadingMore) return
  const el = dom_list_ref.value
  if (!el) return
  const info = props.listInfo
  if (!info.list.length) return
  if (info.total && info.list.length >= info.total) return
  if (el.scrollHeight - el.scrollTop - el.clientHeight > 600) return
  emit('load-more')
}

onMounted(() => {
  dom_list_ref.value?.addEventListener('scroll', handleListScroll, { passive: true })
})
onBeforeUnmount(() => {
  dom_list_ref.value?.removeEventListener('scroll', handleListScroll)
})

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
  padding: 15px 15px 0;

  ul {
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
  }
}
.item {
  max-width: 220px;
  width: 18%;
  box-sizing: border-box;
  display: flex;
  flex-flow: column nowrap;
  margin-bottom: 20px;
  cursor: pointer;
  &:hover {
    animation: card-bounce .55s cubic-bezier(.28, .84, .42, 1);
    .image {
      opacity: 1;
      .mask {
        opacity: 1;
      }
      .playBtn {
        opacity: 1;
      }
    }
  }
}
@keyframes card-bounce {
  0% {
    transform: translateY(0);
  }
  28% {
    transform: translateY(-11px);
  }
  54% {
    transform: translateY(0);
  }
  72% {
    transform: translateY(-4px);
  }
  100% {
    transform: translateY(0);
  }
}
.image {
  flex: none;
  width: 100%;
  display: flex;
  background-position: center;
  background-size: cover;
  border-radius: 4px;
  overflow: hidden;
  opacity: .9;
  aspect-ratio: 1 / 1;
  position: relative;
  box-shadow: 0 0 2px 0 rgba(0,0,0,.2);
  transition: opacity @transition-normal;
}
.mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  opacity: 0;
  transition: opacity @transition-normal;
}
.playBtn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 45px;
  height: 45px;
  background-color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity @transition-normal;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  svg {
    width: 28px;
    height: 28px;
    color: #666;
    margin-left: 3px;
  }
}
.img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.songCount {
  position: absolute;
  bottom: 6px;
  left: 6px;
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 3px;
  svg {
    width: 12px;
    height: 12px;
  }
}
.playCount {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 3px;
  svg {
    width: 12px;
    height: 12px;
  }
}

.desc {
  flex: auto;
  padding: 8px 0 0;
  overflow: hidden;
  h4 {
    font-size: 13px;
    text-align: justify;
    line-height: 1.3;
    .mixin-ellipsis-2();
  }
}
.author {
  position: absolute;
  top: 6px;
  left: 6px;
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  max-width: 70%;
  .mixin-ellipsis-1();
}
.pagination {
  text-align: center;
  padding: 15px 0;
}
.loadMore {
  padding: 12px 0;
  text-align: center;
  font-size: 13px;
  color: var(--color-font-label);
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

  p {
    font-size: 24px;
    color: var(--color-font-label);
  }
}

</style>
