<template>
  <material-modal :show="show" teleport="#view" @close="handleClose" @after-enter="$refs.input.focus()">
    <main :class="$style.main">
      <h2>{{ selectedNum > 0 ? $t('music_sort__title_multiple', { num: selectedNum }) : $t('music_sort__title', { name: musicInfo ? musicInfo.name : '' }) }}</h2>
      <base-input
        ref="input"
        v-model="sortNum"
        :class="$style.input"
        type="number"
        :placeholder="$t('music_sort__input_tip')"
        @submit="handleSubmit" @blur="verify"
      />
      <div :class="$style.footer">
        <base-btn :class="$style.btn" @click="handleSubmit">{{ $t('btn_confirm') }}</base-btn>
      </div>
    </main>
  </material-modal>
</template>

<script>
export default {
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    musicInfo: {
      type: Object,
      default() {
        return {}
      },
    },
    selectedNum: {
      type: Number,
      default: 0,
    },
  },
  emits: ['update:show', 'confirm'],
  data() {
    return {
      sortNum: '',
    }
  },
  watch: {
    show(n) {
      if (n) {
        this.sortNum = ''
      }
    },
  },
  methods: {
    handleClose() {
      this.$emit('update:show', false)
    },
    verify() {
      let num = /^[1-9]\d*/.exec(this.sortNum)
      num = num ? parseInt(num[0]) : ''
      this.sortNum = num.toString()
      return num
    },
    handleSubmit() {
      let num = this.verify()
      if (this.sortNum == '') return
      this.handleClose()
      this.$emit('confirm', num)
    },
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
  // .mixin-ellipsis-1();

  +.btn {
    margin-left: 10px;
  }
}


</style>
