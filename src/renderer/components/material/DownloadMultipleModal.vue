<template lang="pug">
material-modal(:show="show" :bg-close="bgClose" @close="handleClose")
  main(:class="$style.main")
    h2
      | {{$t('material.download_multiple_modal.tip', { len: list.length })}}
      br
      | {{$t('material.download_multiple_modal.tip2')}}
    material-btn(:class="$style.btn" @click="handleClick('128k')") {{$t('material.download_multiple_modal.normal')}} - 128K
    material-btn(:class="$style.btn" @click="handleClick('320k')") {{$t('material.download_multiple_modal.high_quality')}} - 320K
    //- material-btn(:class="$style.btn" @click="handleClick('ape')") 无损音质 - APE
    material-btn(:class="$style.btn" @click="handleClick('flac')") {{$t('material.download_multiple_modal.lossless')}} - FLAC/WAV
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
    list: {
      type: Array,
      default() {
        return []
      },
    },
  },
  methods: {
    handleClick(type) {
      this.$emit('select', type)
    },
    handleClose() {
      this.$emit('close')
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';

.main {
  padding: 15px;
  max-width: 300px;
  min-width: 200px;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  h2 {
    font-size: 13px;
    color: @color-theme_2-font;
    line-height: 1.3;
    text-align: center;
    margin-bottom: 15px;
  }
}

.btn {
  display: block;
  margin-bottom: 15px;
  &:last-child {
    margin-bottom: 0;
  }
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
