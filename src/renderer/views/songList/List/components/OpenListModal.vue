<template>
  <material-modal :show="props.modelValue" teleport="#view" width="60%" @close="emit('update:model-value', $event)" @after-enter="$refs.input.focus()">
    <main class="scroll" :class="$style.main">
      <h2>{{ $t('songlist__import_input_title') }}</h2>
      <div :class="$style.sourceList">
        <button
          v-for="item in props.sourceList"
          :key="item.id"
          type="button"
          :class="[$style.sourceItem, {[$style.sourceActive]: source == item.id}]"
          @click="source = item.id"
        >{{ item.name }}</button>
      </div>
      <div :class="$style.inputContent">
        <base-input
          ref="input"
          v-model.trim="text"
          :class="$style.input"
          :placeholder="$t('songlist__import_input_tip')"
          @submit="handleSubmit"
        />
        <base-btn :class="$style.btn" @click="handleSubmit">{{ $t('songlist__import_input_btn_confirm') }}</base-btn>
      </div>
      <div :class="$style.footer">
        <div :class="$style.tips">
          <ul>
            <li>{{ $t('songlist__import_input_tip_1') }}</li>
            <li>{{ $t('songlist__import_input_tip_2') }}</li>
            <li>{{ $t('songlist__import_input_tip_3') }}</li>
            <li>
              {{ $t('songlist__import_input_tip_4') }}
              <span
                class="hover underline"
                aria-label="https://lyswhut.github.io/lx-music-doc/desktop/faq/cannot-open-songlist"
                @click="openUrl('https://lyswhut.github.io/lx-music-doc/desktop/faq/cannot-open-songlist')"
              >FAQ</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  </material-modal>
</template>

<script setup>
import { openSongListInputInfo } from '@renderer/store/songList/state'
import { setOpenSongListInputInfo } from '@renderer/store/songList/action'
import { ref, watch } from '@common/utils/vueTools'
import { useRoute, useRouter } from '@common/utils/vueRouter'
import { openUrl } from '@common/utils/electron'

const props = defineProps({
  modelValue: Boolean,
  sourceList: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['update:model-value'])

const router = useRouter()
const route = useRoute()
const text = ref('')
const source = ref('')

watch(() => props.modelValue, (visible) => {
  if (!visible) return
  if (openSongListInputInfo.source) {
    source.value = openSongListInputInfo.source
  } else if (route.query.source) {
    source.value = route.query.source
  } else {
    source.value = props.sourceList[0]?.id ?? ''
  }
  // text.value = openSongListInputInfo.text
})

const handleSubmit = () => {
  if (!text.value.length) return
  setOpenSongListInputInfo(text.value, source.value)
  void router.push({
    path: '/songList/detail',
    query: {
      source: source.value,
      id: text.value,
      refresh: 'true',
    },
  })
}

</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.main {
  padding: 0 15px;
  // max-width: 530px;
  // min-width: 300px;
  display: flex;
  flex-flow: column nowrap;
  min-height: 0;
  // max-height: 100%;
  // overflow: hidden;
  h2 {
    font-size: 14px;
    color: var(--color-font);
    line-height: 1.3;
    word-break: break-all;
    // text-align: center;
    padding: 15px 0 8px;
  }
}
.sourceList {
  display: flex;
  flex-flow: row nowrap;
  gap: 4px;
  padding-bottom: 10px;
}
.sourceItem {
  flex: none;
  border: none;
  background: none;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-font-label);
  transition: color .2s ease, background-color .2s ease;
  &:hover {
    color: var(--color-primary);
  }
}
.sourceActive {
  color: var(--color-primary);
  background-color: var(--color-primary-light-300-alpha-700);
}
.inputContent {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
}
.input {
  flex: auto;
  padding: 8px 8px;
  color: var(--color-font);
}
.footer {
  margin: 15px 0;
  display: flex;
  flex-flow: row nowrap;
  align-items: flex-end;
}

.tips {
  flex: auto;
  font-size: 12px;
  color: var(--color-font);
  line-height: 1.5;
  background-color: var(--color-primary-light-300-alpha-700);
  border-radius: 6px;
  padding: 10px 15px;
  ul {
    list-style: decimal;
    padding-left: 15px;
  }
}

.btn {
  margin-left: 10px;
  flex: none;
  min-width: 72px;
}


</style>
