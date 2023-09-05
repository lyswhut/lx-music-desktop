<template>
  <material-modal :show="sync.isShowSyncMode" :bg-close="false" :close-btn="false" @close="handleClose(false)">
    <main v-if="sync.type == 'list'" :class="$style.main">
      <h2>{{ $t('sync__list_title', { name: sync.deviceName }) }}</h2>
      <div class="scroll" :class="$style.content">
        <dl :class="$style.btnGroup">
          <dt :class="$style.label">{{ $t('sync__merge_label') }}</dt>
          <dd :class="$style.btns">
            <base-btn :class="$style.btn" @click="handleSelectMode('merge_local_remote')">{{ $t('sync__merge_btn_local_remote') }}</base-btn>
            <base-btn :class="$style.btn" @click="handleSelectMode('merge_remote_local')">{{ $t('sync__merge_btn_remote_local') }}</base-btn>
          </dd>
        </dl>
        <dl :class="$style.btnGroup">
          <dt :class="$style.label">{{ $t('sync__overwrite_label') }}</dt>
          <dd :class="$style.btns">
            <base-btn :class="$style.btn" @click="handleSelectMode('overwrite_local_remote')">{{ $t('sync__overwrite_btn_local_remote') }}</base-btn>
            <base-btn :class="$style.btn" @click="handleSelectMode('overwrite_remote_local')">{{ $t('sync__overwrite_btn_remote_local') }}</base-btn>
          </dd>
          <dd style="font-size: 14px; margin-top: 5px;">
            <base-checkbox id="sync_mode_modal_isOverwrite" v-model="isOverwrite" :label="$t('sync__overwrite')" />
          </dd>
        </dl>
        <dl :class="$style.btnGroup">
          <dt :class="$style.label">{{ $t('sync__other_label') }}</dt>
          <dd :class="$style.btns">
            <!-- <base-btn :class="$style.btn" @click="handleSelectMode('none')">{{ $t('sync__overwrite_btn_none') }}</base-btn> -->
            <base-btn :class="$style.btn" @click="handleSelectMode('cancel')">{{ $t('sync__overwrite_btn_cancel') }}</base-btn>
          </dd>
        </dl>
        <dl :class="$style.btnGroup">
          <dd>
            <section :class="$style.tipGroup">
              <h3 :class="$style.title">{{ $t('sync__merge_tip') }}</h3>
              <p :class="$style.tip">{{ $t('sync__list_merge_tip_desc') }}</p>
            </section>
            <section :class="$style.tipGroup">
              <h3 :class="$style.title">{{ $t('sync__overwrite_tip') }}</h3>
              <p :class="$style.tip">{{ $t('sync__list_overwrite_tip_desc') }}</p>
            </section>
            <section :class="$style.tipGroup">
              <h3 :class="$style.title">{{ $t('sync__other_tip') }}</h3>
              <p :class="$style.tip">{{ $t('sync__list_other_tip_desc') }}</p>
            </section>
          </dd>
        </dl>
      </div>
    </main>
    <main v-else-if="sync.type == 'dislike'" :class="$style.main">
      <h2>{{ $t('sync__dislike_title', { name: sync.deviceName }) }}</h2>
      <div class="scroll" :class="$style.content">
        <dl :class="$style.btnGroup">
          <dt :class="$style.label">{{ $t('sync__merge_label') }}</dt>
          <dd :class="$style.btns">
            <base-btn :class="$style.btn" @click="handleSelectMode('merge_local_remote')">{{ $t('sync__merge_btn_local_remote') }}</base-btn>
            <base-btn :class="$style.btn" @click="handleSelectMode('merge_remote_local')">{{ $t('sync__merge_btn_remote_local') }}</base-btn>
          </dd>
        </dl>
        <dl :class="$style.btnGroup">
          <dt :class="$style.label">{{ $t('sync__overwrite_label') }}</dt>
          <dd :class="$style.btns">
            <base-btn :class="$style.btn" @click="handleSelectMode('overwrite_local_remote')">{{ $t('sync__overwrite_btn_local_remote') }}</base-btn>
            <base-btn :class="$style.btn" @click="handleSelectMode('overwrite_remote_local')">{{ $t('sync__overwrite_btn_remote_local') }}</base-btn>
          </dd>
        </dl>
        <dl :class="$style.btnGroup">
          <dt :class="$style.label">{{ $t('sync__other_label') }}</dt>
          <dd :class="$style.btns">
            <!-- <base-btn :class="$style.btn" @click="handleSelectMode('none')">{{ $t('sync__overwrite_btn_none') }}</base-btn> -->
            <base-btn :class="$style.btn" @click="handleSelectMode('cancel')">{{ $t('sync__overwrite_btn_cancel') }}</base-btn>
          </dd>
        </dl>
        <dl :class="$style.btnGroup">
          <dd>
            <section :class="$style.tipGroup">
              <h3 :class="$style.title">{{ $t('sync__merge_tip') }}</h3>
              <p :class="$style.tip">{{ $t('sync__dislike_merge_tip_desc') }}</p>
            </section>
            <section :class="$style.tipGroup">
              <h3 :class="$style.title">{{ $t('sync__overwrite_tip') }}</h3>
              <p :class="$style.tip">{{ $t('sync__dislike_overwrite_tip_desc') }}</p>
            </section>
            <section :class="$style.tipGroup">
              <h3 :class="$style.title">{{ $t('sync__other_tip') }}</h3>
              <p :class="$style.tip">{{ $t('sync__dislike_other_tip_desc') }}</p>
            </section>
          </dd>
        </dl>
      </div>
    </main>
  </material-modal>
</template>

<script>
import { ref } from '@common/utils/vueTools'
import { sync } from '@renderer/store'
import { sendSyncAction } from '@renderer/utils/ipc'

export default {
  setup() {
    const isOverwrite = ref(false)
    const handleClose = () => {
      sync.isShowSyncMode = false
    }
    const handleSelectMode = (mode) => {
      if (sync.type == 'list') {
        if (mode.startsWith('overwrite') && isOverwrite.value) mode += '_full'
      }
      void sendSyncAction({ action: 'select_mode', data: { type: sync.type, mode } })
      handleClose()
    }
    return {
      sync,
      isOverwrite,
      handleClose,
      handleSelectMode,
    }
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.main {
  padding: 15px;
  max-width: 700px;
  min-width: 200px;
  min-height: 0;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  h2 {
    font-size: 16px;
    color: var(--color-font);
    line-height: 1.3;
    text-align: center;
  }
}

.content {
  flex: auto;
  padding: 15px 0 5px;
  padding-right: 5px;
  .btnGroup + .btnGroup {
    margin-top: 10px;
  }
  .label {
    color: var(--color-font-label);
    font-size: 14px;
    line-height: 2;
  }
  .desc {
    line-height: 1.5;
    font-size: 14px;
    text-align: justify;
  }

  .tipGroup {
    display: flex;
    flex-direction: row;
    font-size: 12px;

    + .tipGroup {
      margin-top: 5px;
    }

    .title {
      white-space: nowrap;
      font-weight: bold;
      margin-right: 5px;
    }

    .tip {
      line-height: 1.3;
    }
  }
}

.btns {
  display: flex;
  align-items: center;
}
.btn {
  display: block;
  white-space: nowrap;
  +.btn {
    margin-left: 15px;
  }
  &:last-child {
    margin-bottom: 0;
  }
}


</style>
