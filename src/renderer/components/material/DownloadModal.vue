<template lang="pug">
material-modal(:show="show" :bg-close="bgClose" @close="handleClose")
  main(:class="$style.main")
    h2
      | {{ info.name }}
      br
      | {{ info.singer }}
    material-btn(:class="$style.btn" v-if="checkSource(type.type)" :tips="!checkSource(type.type) && $t('material.download_modal.btn_tip')" :disabled="!checkSource(type.type)" :key="type.type" @click="handleClick(type.type)" v-for="type in info.types") {{getTypeName(type.type)}} {{ type.type.toUpperCase() }}{{ type.size && ` - ${type.size.toUpperCase()}` }}

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
    },
    bgClose: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    info() {
      return this.musicInfo || {}
    },
    qualityList() {
      return window.globalObj.qualityList[this.musicInfo.source] || []
    },
  },
  methods: {
    handleClick(type) {
      this.$emit('select', type)
    },
    handleClose() {
      this.$emit('close')
    },
    getTypeName(type) {
      switch (type) {
        case 'flac':
        case 'ape':
        case 'wav':
          return this.$t('material.download_modal.lossless')
        case '320k':
          return this.$t('material.download_modal.high_quality')
        case '192k':
        case '128k':
          return this.$t('material.download_modal.normal')
      }
    },
    checkSource(type) {
      return this.qualityList.includes(type)
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
