<template>
  <material-modal :show="show" :bg-close="bgClose" :teleport="teleport" @close="handleClose">
    <main :class="$style.main">
      <h2>{{ info.name }}<br />{{ info.singer }}</h2>

      <div :class="[$style.qualityList, qualitys.length > 4 && $style.scrollable]">
        <base-btn
          v-for="quality in qualitys"
          :key="quality.type"
          :class="$style.btn"
          @click="handleClick(quality.type)"
        >
          {{ getTypeName(quality.type) }}{{ quality.size && ` - ${quality.size.toUpperCase()}` }}
        </base-btn>
      </div>
    </main>
  </material-modal>
</template>

<script>
import { qualityList } from '@renderer/store'
import { createDownloadTasks } from '@renderer/store/download/action'

export default {
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    musicInfo: {
      type: [Object, null],
      required: true,
    },
    listId: {
      type: String,
      default: '',
    },
    bgClose: {
      type: Boolean,
      default: true,
    },
    teleport: {
      type: String,
      default: '#root',
    },
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
    qualitys() {
      return this.info.meta?.qualitys?.filter((quality) => this.checkSource(quality.type)) || []
    },
  },
  methods: {
    handleClick(quality) {
      void createDownloadTasks([this.musicInfo], quality, this.listId)
      this.handleClose()
    },
    handleClose() {
      this.$emit('update:show', false)
    },
    getTypeName(quality) {
      const names = {
        '96k': '低清音质 96 kbps',
        '128k': '普通音质 128 kbps',
        '192k': '中等音质 192 kbps',
        '320k': '高清音质 320 kbps',
        flac: '高清无损 FLAC',
        hires: '高解析度 Hi-Res',
        flac24bit: '高解析度无损 FLAC 24-bit',
        vinyl: '黑胶音质 Vinyl',
        dolby: '杜比全景声 Dolby Atmos',
        atmos: '臻品音质 Atmos 2.0',
        atmos_plus: '臻品全景声 Atmos+ 2.0',
        master: '臻品母带 Master 3.0',
      }
      return names[quality] ?? quality
    },
    checkSource(quality) {
      return this.sourceQualityList.includes(quality)
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
    color: var(--color-font);
    line-height: 1.3;
    text-align: center;
    margin-bottom: 15px;
  }
}

.qualityList {
  display: flex;
  flex-direction: column;
  gap: 15px;

  &.scrollable {
    max-height: 260px;
    overflow-y: auto;
    padding-right: 5px;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: var(--color-secondary-background);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--color-border);
      border-radius: 3px;

      &:hover {
        background: var(--color-primary);
      }
    }
  }
}

.btn {
  display: block;
  flex-shrink: 0;
}
</style>
