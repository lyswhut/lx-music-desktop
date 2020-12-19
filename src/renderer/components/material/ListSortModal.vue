<template lang="pug">
material-modal(:show="show" @close="handleClose")
  main(:class="$style.main")
    h2 {{selectedNum > 0 ? $t('material.list_sort_modal.title_multiple', { num: selectedNum }) : $t('material.list_sort_modal.title', { name: musicInfo ? musicInfo.name : '' })}}
    material-input(:class="$style.input" type="number" v-model="sortNum" ref="input" :placeholder="$t('material.list_sort_modal.input_tip')" @keydown.native.enter="handleSubmit")
    material-btn(:class="$style.btn" @click="handleSubmit") {{$t('material.list_sort_modal.btn_confirm')}}
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
  data() {
    return {
      sortNum: '',
    }
  },
  watch: {
    show(n) {
      if (n) {
        this.sortNum = ''
        this.$nextTick(() => {
          this.$refs.input.focus()
        })
      }
    },
  },
  computed: {

  },
  methods: {
    handleClose() {
      this.$emit('close')
    },
    handleSubmit() {
      let num = /^[1-9]\d*/.exec(this.sortNum)
      num = num ? parseInt(num[0]) : ''
      this.sortNum = num.toString()
      if (this.sortNum == '') return
      this.$emit('confirm', num)
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';

.main {
  padding: 0 15px;
  max-width: 530px;
  min-width: 320px;
  display: flex;
  flex-flow: column nowrap;
  min-height: 0;
  // max-height: 100%;
  // overflow: hidden;
  h2 {
    font-size: 13px;
    color: @color-theme_2-font;
    line-height: 1.3;
    // text-align: center;
    padding: 15px 0 8px;
  }
}

.input {
  // width: 100%;
  // height: 26px;
  padding: 8px 8px;
}
.btn {
  margin: 20px auto 15px;
  // box-sizing: border-box;
  // margin-left: 15px;
  // margin-bottom: 15px;
  // height: 36px;
  // line-height: 36px;
  // padding: 0 10px !important;
  min-width: 100px;
  // .mixin-ellipsis-1;
}

each(@themes, {
  :global(#container.@{value}) {
    .main {
      h2 {
        color: ~'@{color-@{value}-theme_2-font}';
      }
    }
  }
})

</style>
