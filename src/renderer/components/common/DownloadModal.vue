<template>
<material-modal :show="show" :bg-close="bgClose" @close="handleClose" :teleport="teleport">
  <main :class="$style.main">
    <h2>{{ info.name }}<br/>{{ info.singer }}</h2>
    <base-btn :class="$style.btn" :key="type.type" @click="handleClick(type.type)" v-for="type in types"
    >{{getTypeName(type.type)}} {{ type.type.toUpperCase() }}{{ type.size && ` - ${type.size.toUpperCase()}` }}</base-btn>
  </main>
</material-modal>
</template>

<script>
import { mapActions } from 'vuex'
import { qualityList } from '@renderer/core/share'

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
    teleport: String,
  },
  emits: ['update:show'],
  setup() {
    return {
      qualityList,
    }
  },
  computed: {
    info() {
      return this.musicInfo || {}
    },
    sourceQualityList() {
      return this.qualityList[this.musicInfo.source] || []
    },
    types() {
      return this.info?.types?.filter(type => this.checkSource(type.type)) || []
    },
  },
  methods: {
    ...mapActions('download', ['createDownload']),
    handleClick(type) {
      this.createDownload({ musicInfo: this.musicInfo, type })
      this.handleClose()
    },
    handleClose() {
      this.$emit('update:show', false)
    },
    getTypeName(type) {
      switch (type) {
        case 'flac32bit':
        case 'flac':
        case 'ape':
        case 'wav':
          return this.$t('download__lossless')
        case '320k':
          return this.$t('download__high_quality')
        case '192k':
        case '128k':
          return this.$t('download__normal')
      }
    },
    checkSource(type) {
      return this.sourceQualityList.includes(type)
    },
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.main {
  padding: 15px;
  max-width: 400px;
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
  :global(#root.@{value}) {
    .main {
      h2 {
        color: ~'@{color-@{value}-theme_2-font}';
      }
    }
  }
})

</style>
