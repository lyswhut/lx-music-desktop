<template>
  <div :class="$style.wrap">
    <div class="chip-row" :class="$style.hotRow">
      <button
        ref="dom_btn"
        type="button"
        class="chip"
        :class="[$style.trigger, { active: triggerActive, [$style.open]: popupVisible }]"
        aria-haspopup="dialog"
        :aria-expanded="popupVisible"
        @click.stop="handleShow"
      >
        <span>{{ triggerLabel }}</span>
        <svg :class="$style.chevron" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 451.847 451.847" space="preserve">
          <use xlink:href="#icon-down" />
        </svg>
      </button>
      <button type="button" class="chip" :class="{ active: !tagId }" @click="handleToggleTag('')">{{ $t('default') }}</button>
      <button
        v-for="tag in hotTags"
        :key="tag.id"
        type="button"
        class="chip"
        :class="{ active: tagId == tag.id }"
        @click="handleToggleTag(tag.id)"
      >{{ tag.name }}</button>
    </div>
    <div ref="dom_popup" :class="[$style.popup, { [$style.open]: popupVisible }]" :style="popupStyle" :aria-hidden="!popupVisible" @click.stop>
      <header :class="$style.popupHead">
        <strong>{{ $t('songlist__all_tags') }}</strong>
      </header>
      <div :class="$style.list" class="scroll">
        <button type="button" class="chip" :class="{ active: !tagId }" @click="handleToggleTag('')">{{ $t('default') }}</button>
        <dl v-for="tagInfo in list" :key="tagInfo.name">
          <dt :class="$style.type">{{ tagInfo.name }}</dt>
          <div :class="$style.chips">
            <dd v-for="tag in tagInfo.list" :key="tag.id">
              <button type="button" class="chip" :class="{ active: tagId == tag.id }" @click="handleToggleTag(tag.id)">{{ tag.name }}</button>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch, shallowReactive, ref, onMounted, onBeforeUnmount, computed, reactive, nextTick } from '@common/utils/vueTools'
import { setTags, getTags } from '@renderer/store/songList/action'
import { tags } from '@renderer/store/songList/state'
import { useRouter, useRoute } from '@common/utils/vueRouter'
import { useI18n } from '@renderer/plugins/i18n'

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
const t = useI18n()

const list = shallowReactive([])
const popupVisible = ref(false)
const handleToggleTag = (id) => {
  void router.replace({
    path: route.path,
    query: {
      source: props.source,
      tagId: id,
      sortId: props.sortId,
    },
  })
  handleHide()
}
watch(() => props.source, async(source) => {
  if (!source) return
  // const source = (await getLeaderboardSetting()).source as LX.OnlineSource
  let tagInfo = tags[source]
  // console.log(await getTags(source))
  if (tagInfo == null) setTags(tagInfo = await getTags(source), source)

  list.splice(0, list.length, ...[{ name: window.i18n.t('songlist__tag_info_hot_tag'), list: [...tagInfo.hotTag] }, ...tagInfo.tags])
}, {
  immediate: true,
})
const tagName = computed(() => {
  if (!props.tagId) return t('default')
  for (const tags of list) {
    const tag = tags.list.find(t => t.id == props.tagId)
    if (tag) return tag.name
  }
  return props.tagId
})
const hotTags = computed(() => list[0]?.list?.slice(0, 8) ?? [])
const triggerShowsSelection = computed(() => !!props.tagId && !hotTags.value.some(tag => tag.id == props.tagId))
const triggerLabel = computed(() => triggerShowsSelection.value ? tagName.value : t('songlist__all_tags'))
const triggerActive = computed(() => popupVisible.value || triggerShowsSelection.value)

const popupStyle = reactive({
  width: 'min(640px, calc(100vw - 96px))',
  maxHeight: '320px',
  top: '0px',
  left: '0px',
})

const placePopup = () => {
  const btn = dom_btn.value
  if (!btn) return
  const rect = btn.getBoundingClientRect()
  const view = document.getElementById('view')
  const maxWidth = Math.min(640, Math.max(280, (view?.clientWidth ?? 640) - 48))
  const top = `${Math.round(rect.bottom + 8)}px`
  const left = `${Math.round(Math.max(16, Math.min(rect.left, window.innerWidth - maxWidth - 16)))}px`
  popupStyle.width = maxWidth + 'px'
  popupStyle.maxHeight = '320px'
  popupStyle.top = top
  popupStyle.left = left
  const popup = dom_popup.value
  if (popup) {
    popup.style.width = maxWidth + 'px'
    popup.style.top = top
    popup.style.left = left
  }
}

const setTagPopupWidth = () => {
  window.setTimeout(() => {
    if (popupVisible.value) placePopup()
  }, 50)
}

const dom_btn = ref<HTMLElement | null>(null)
const dom_popup = ref<HTMLElement | null>(null)
const handleShow = () => {
  popupVisible.value = !popupVisible.value
  if (popupVisible.value) void nextTick(placePopup)
}

watch(popupVisible, (open) => {
  if (open) void nextTick(placePopup)
})
const handleHide = (evt) => {
  if (evt && (evt.target == dom_btn.value || dom_btn.value?.contains(evt.target))) return
  if (evt && (evt.target == dom_popup.value || dom_popup.value?.contains(evt.target))) return
  popupVisible.value = false
}


onMounted(() => {
  setTagPopupWidth()
  document.addEventListener('click', handleHide)
  window.addEventListener('resize', setTagPopupWidth)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleHide)
  window.removeEventListener('resize', setTagPopupWidth)
})

</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.wrap {
  min-width: 0;
  flex: auto;
  :global(.chip) {
    appearance: none;
  }
}
.hotRow {
  flex: auto;
}
.trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.chevron {
  flex: none;
  width: .8em;
  height: .8em;
  fill: currentColor;
  transition: transform .2s ease;
}
.open .chevron {
  transform: rotate(180deg);
}

.popup {
  position: fixed;
  top: calc(100% + 8px);
  left: 0;
  width: min(640px, calc(100vw - 96px));
  margin-top: 0;
  max-height: 320px;
  border-radius: 12px;
  border: 1px solid var(--color-line);
  background: var(--color-glass);
  backdrop-filter: blur(24px) saturate(1.15);
  box-shadow: 0 12px 40px color-mix(in srgb, var(--color-font) 16%, transparent), 0 1px 4px color-mix(in srgb, var(--color-font) 10%, transparent);
  opacity: 0;
  transform: translateY(4px);
  transform-origin: 0 0 0;
  transition: .18s ease;
  transition-property: transform, opacity;
  z-index: 110;
  pointer-events: none;
  display: flex;
  flex-flow: column nowrap;
  overflow: hidden;
  &.open {
    opacity: 1;
    transform: scale(1);
    pointer-events: initial;
  }
}
.popupHead {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-line);
  strong {
    font-size: 13px;
    font-weight: 650;
  }
}
.list {
  padding: 12px 16px;
  box-sizing: border-box;
  min-height: 0;
  flex: auto;
  dl {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--color-line);
    &:last-child {
      border-bottom: 0;
    }
  }
}

.type {
  padding-top: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-secondary);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  dd {
    display: block;
    margin: 0;
  }
}


</style>
