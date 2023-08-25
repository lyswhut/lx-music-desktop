<template>
  <material-modal :show="sync.isShowAuthCodeModal" :bg-close="false" @close="handleClose" @after-enter="$refs.input.focus()">
    <main :class="$style.main">
      <h2>{{ $t('sync__auth_code_title') }}</h2>
      <base-input
        ref="input"
        v-model="authCode"
        :class="$style.input"
        :placeholder="$t('sync__auth_code_input_tip')"
        @submit="handleSubmit" @blur="verify"
      />
      <div :class="$style.footer">
        <base-btn :class="$style.btn" @click="handleSubmit">{{ $t('btn_confirm') }}</base-btn>
      </div>
    </main>
  </material-modal>
</template>

<script>
import { ref } from '@common/utils/vueTools'
import { sync } from '@renderer/store'
import { appSetting } from '@renderer/store/setting'
import { sendSyncAction } from '@renderer/utils/ipc'

export default {
  setup() {
    const authCode = ref('')
    const handleClose = () => {
      sync.isShowAuthCodeModal = false
    }
    const verify = () => {
      if (authCode.value.length > 100) authCode.value = authCode.value.substring(0, 100)
      return authCode.value
    }
    const handleSubmit = () => {
      let code = verify()
      if (code == '') return
      authCode.value = ''
      handleClose()
      sendSyncAction({
        action: 'enable_client',
        data: {
          enable: appSetting['sync.enable'],
          host: appSetting['sync.client.host'],
          authCode: code,
        },
      }).catch(err => {
        console.log(err)
      })
    }
    return {
      sync,
      authCode,
      handleClose,
      verify,
      handleSubmit,
    }
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.main {
  padding: 0 15px;
  max-width: 530px;
  min-width: 280px;
  display: flex;
  flex-flow: column nowrap;
  min-height: 0;
  // max-height: 100%;
  // overflow: hidden;
  h2 {
    font-size: 13px;
    color: var(--color-font);
    line-height: 1.3;
    word-break: break-all;
    // text-align: center;
    padding: 15px 0 8px;
  }
}

.input {
  // width: 100%;
  // height: 26px;
  padding: 8px 8px;
}
.footer {
  margin: 20px 0 15px auto;
}
.btn {
  // box-sizing: border-box;
  // margin-left: 15px;
  // margin-bottom: 15px;
  // height: 36px;
  // line-height: 36px;
  // padding: 0 10px !important;
  min-width: 70px;
  // .mixin-ellipsis-1;

  +.btn {
    margin-left: 10px;
  }
}


</style>
