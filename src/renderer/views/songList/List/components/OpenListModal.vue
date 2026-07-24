<template>
  <material-modal :show="props.modelValue" teleport="#view" width="75%" height="55%" @close="emit('update:model-value', $event)" @after-enter="$refs.input.focus()">
    <main class="scroll" :class="$style.main">
      <h2>{{ $t('songlist__import_input_title') }}</h2>
      <div :class="$style.inputContent">
        <div :class="$style.sourceOptions">
          <div
            v-for="item in props.sourceList"
            :key="item.id"
            :class="[$style.sourceOption, { [$style.sourceOptionActive]: source === item.id }]"
            @click="source = item.id"
          >{{ item.name }}</div>
        </div>
        <div :class="$style.inputRow">
          <base-input
            ref="input"
            v-model.trim="text"
            :class="$style.inputRowInput"
            :placeholder="$t('songlist__import_input_tip')"
            @submit="handleSubmit"
          />
          <base-btn :class="$style.inputRowBtn" @click="handleSubmit">{{ $t('songlist__import_input_btn_confirm') }}</base-btn>
        </div>
      </div>
      <div :class="$style.footer">
        <div :class="$style.tipsCard">
          <div :class="$style.tipsTitle">使用提示</div>
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
  source.value = openSongListInputInfo.source ?? route.query.source ?? (props.sourceList.length > 0 ? props.sourceList[0].id : '')
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
  display: flex;
  flex-flow: column nowrap;
  min-height: 300px;
  height: 100%;
  h2 {
    font-size: 14px;
    color: var(--color-font);
    line-height: 1.3;
    word-break: break-all;
    padding: 15px 0 8px;
  }
}
.inputContent {
  display: flex;
  flex-flow: column nowrap;
  gap: 10px;
}
.sourceOptions {
  display: flex;
  flex-flow: row wrap;
  gap: 6px;
  width: 100%;
}
.sourceOption {
  padding: 6px 14px;
  background-color: var(--color-button-background);
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s ease, color 0.2s ease;
  color: var(--color-font-desc);
  &:hover {
    background-color: var(--color-button-background-hover);
    color: var(--color-font);
  }
}
.sourceOptionActive {
  background-color: var(--color-primary);
  color: #ffffff;
  &:hover {
    background-color: var(--color-primary-light-300);
  }
}
.inputRow {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.inputRowInput {
  flex: auto;
  padding: 8px 8px;
  color: var(--color-font);
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.inputRowBtn {
  flex: 0 0 auto;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
.footer {
  margin: 20px 0 15px;
}

.tips {
  font-size: 13px;
  color: var(--color-font);
  line-height: 1.6;
  ul {
    list-style: decimal;
    padding-left: 15px;
  }
}

.tipsCard {
  background-color: var(--color-primary-light-400-alpha-700);
  border: 1px solid var(--color-primary);
  border-radius: 8px;
  padding: 12px 15px;
  box-sizing: border-box;
}

.tipsTitle {
  font-size: 13px;
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 8px;
}

.tipsCard .tips {
  font-size: 12px;
  color: var(--color-font);
  line-height: 1.6;
  ul {
    list-style: decimal;
    padding-left: 15px;
    margin: 0;
  }
}
</style>
