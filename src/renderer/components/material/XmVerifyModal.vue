<template lang="pug">
material-modal(:show="show" :bg-close="bgClose" @close="handleClose")
  main.ignore-to-rem(:class="$style.main")
    h2 {{$t('material.xm_verify_modal.title')}}
</template>

<script>
export default {
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    bgClose: {
      type: Boolean,
      default: true,
    },
  },
  methods: {
    handleClose() {
      this.$emit('close')
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';

.main {
  background: #fff !important;
  &:global(.ignore-to-rem) {
    padding: 15px;
    width: 360px;
    height: 330px;
    h2 {
      font-size: 16px;
    }
  }

  h2 {
    font-size: 13px;
    color: @color-theme_2-font;
    line-height: 1.3;
    text-align: center;
  }
}

</style>
