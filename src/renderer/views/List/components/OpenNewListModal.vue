<template>
    <material-modal :show="props.modelValue" teleport="#view" width="40%" @close="emit('update:model-value', $event)" @after-enter="$refs.input.focus()">
      <main :class="$style.main">
        <h2>{{ $t('list__new_list_btn') }}</h2>
        <div :class="$style.inputContent">
          <base-input
            ref="input"
            v-model.trim="text"
            :class="$style.input"
            :placeholder="$t('list__new_list_input')"
            @submit="handleSubmit"
          />
        </div>
        <div :class="$style.footer">
          <base-btn :class="$style.btn" @click="handleSubmit">{{ $t('btn_confirm') }}</base-btn>
        </div>
      </main>
    </material-modal>
  </template>

<script setup>
import { ref } from '@common/utils/vueTools'

const props = defineProps({
  modelValue: Boolean,
})

const emit = defineEmits(['update:model-value', 'update:model-submit'])
const text = ref('')

const handleSubmit = () => {
  if (!text.value.length) return
  emit('update:model-submit', text.value)
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
  .inputContent {
    display: flex;
    flex-flow: row nowrap;
  }
  .select {
    width: auto;
    :global {
      .label-content {
        height: 100%;
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
      }

      .selection-list {
        li {
          // background-color: var(--color-main-background);
          text-align: center;
          line-height: 32px;
          font-size: 13px;
          &:hover {
            background-color: var(--color-button-background-hover);
          }
          &:active {
            background-color: var(--color-button-background-active);
          }
        }
      }
    }
  }
  .input {
    flex: auto;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    // width: 100%;
    // height: 26px;
    padding: 8px 8px;
    color: var(--color-font);
  }
  .footer {
    margin: 50px 0 15px;
    display: flex;
    flex-flow: row nowrap;
    align-items: flex-end;
  }

  .tips {
    flex: auto;
    font-size: 12px;
    color: var(--color-font);
    line-height: 1.5;
    ul {
      list-style: decimal;
      padding-left: 15px;
    }
  }

  .btn {
    // box-sizing: border-box;
    // margin-left: 15px;
    // margin-bottom: 15px;
    // height: 36px;
    // line-height: 36px;
    // padding: 0 10px !important;
    min-width: 80px;
    // .mixin-ellipsis-1;
  }

  </style>
