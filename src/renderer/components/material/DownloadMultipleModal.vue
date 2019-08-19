<template lang="pug">
material-modal(:show="show" :bg-close="bgClose" @close="handleClose")
  main(:class="$style.main")
    h2
      | 已选择 {{list.length}} 首歌曲
      br
      | 请选择要优先下载的音质
    material-btn(:class="$style.btn" @click="handleClick('128k')") 普通音质 - 128K
    material-btn(:class="$style.btn" @click="handleClick('320k')") 高品音质 - 320K
    material-btn(:class="$style.btn" @click="handleClick('ape')") 无损音质 - APE
    material-btn(:class="$style.btn" @click="handleClick('flac')") 无损音质 - FLAC
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
