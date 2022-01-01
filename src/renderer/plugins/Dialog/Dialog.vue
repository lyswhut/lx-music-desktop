<template>
<Modal :show="visible" @close="handleCancel" @after-leave="afterLeave" :closeBtn="false" :teleport="teleport">
  <main :class="$style.main">{{message}}</main>
  <footer :class="$style.footer">
    <Btn :class="$style.btn" v-if="showCancel" @click="handleCancel">{{cancelBtnText}}</Btn>
    <Btn :class="$style.btn" @click="handleComfirm">{{confirmBtnText}}</Btn>
  </footer>
</Modal>
</template>

<script>
import Modal from '@renderer/components/material/Modal'
import Btn from '@renderer/components/base/Btn'
export default {
  props: {
    afterLeave: {
      type: Function,
      default: () => {},
    },
  },
  components: {
    Modal,
    Btn,
  },
  data() {
    return {
      visible: false,
      message: '',
      showCancel: false,
      cancelButtonText: '',
      confirmButtonText: '',
      teleport: '#root',
    }
  },
  computed: {
    cancelBtnText() {
      return this.cancelButtonText || this.$t('cancel_button_text')
    },
    confirmBtnText() {
      return this.confirmButtonText || this.$t('confirm_button_text')
    },
  },
  beforeUnmount() {
    const el = this.$el
    el.parentNode.removeChild(el)
  },
  methods: {
    handleCancel() {
    },
    handleComfirm() {
    },
  },
}
</script>

<style lang="less" module>

.main {
  flex: auto;
  min-height: 40px;
  padding: 15px;
  font-size: 14px;
  max-width: 320px;
  min-width: 220px;
  line-height: 1.5;
  white-space: pre-line;
}

.footer {
  flex: none;
  padding: 0 15px 15px;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  gap: 15px;
}
</style>
