<template lang="pug">
material-modal(:show="sync.isShowSyncMode" @close="handleClose(false)" :bgClose="false" :close-btn="false")
  main(:class="$style.main")
    h2 {{$t('sync__title', { name: sync.deviceName })}}
    div.scroll(:class="$style.content")
      dl(:class="$style.btnGroup")
        dt(:class="$style.label") {{$t('sync__merge_label')}}
        dd(:class="$style.btns")
          base-btn(:class="$style.btn" @click="handleSelectMode('merge_local_remote')") {{$t('sync__merge_btn_local_remote')}}
          base-btn(:class="$style.btn" @click="handleSelectMode('merge_remote_local')") {{$t('sync__merge_btn_remote_local')}}
      dl(:class="$style.btnGroup")
        dt(:class="$style.label") {{$t('sync__overwrite_label')}}
        dd(:class="$style.btns")
          base-btn(:class="$style.btn" @click="handleSelectMode('overwrite_local_remote')") {{$t('sync__overwrite_btn_local_remote')}}
          base-btn(:class="$style.btn" @click="handleSelectMode('overwrite_remote_local')") {{$t('sync__overwrite_btn_remote_local')}}
        dd(style="font-size: 14px; margin-top: 5px;")
          base-checkbox(id="sync_mode_modal_isOverwrite" v-model="isOverwrite" :label="$t('sync__overwrite')")

      dl(:class="$style.btnGroup")
        dt(:class="$style.label") {{$t('sync__other_label')}}
        dd(:class="$style.btns")
          base-btn(:class="$style.btn" @click="handleSelectMode('none')") {{$t('sync__overwrite_btn_none')}}
          base-btn(:class="$style.btn" @click="handleSelectMode('cancel')") {{$t('sync__overwrite_btn_cancel')}}
      dl(:class="$style.btnGroup")
        dd
          section(:class="$style.tipGroup")
            h3(:class="$style.title") {{$t('sync__merge_tip')}}
            p(:class="$style.tip") {{$t('sync__merge_tip_desc')}}
          section(:class="$style.tipGroup")
            h3(:class="$style.title") {{$t('sync__overwrite_tip')}}
            p(:class="$style.tip") {{$t('sync__overwrite_tip_desc')}}
          section(:class="$style.tipGroup")
            h3(:class="$style.title") {{$t('sync__other_tip')}}
            p(:class="$style.tip") {{$t('sync__other_tip_desc')}}
</template>

<script>
import { sync as eventSyncName } from '@renderer/event/names'
import { sync } from '@renderer/core/share'

export default {
  setup() {
    return {
      sync,
    }
  },
  data() {
    return {
      isOverwrite: false,
    }
  },
  computed: {

  },
  methods: {
    handleSelectMode(mode) {
      if (mode.startsWith('overwrite') && this.isOverwrite) mode += '_full'
      window.eventHub.emit(eventSyncName.send_sync_list, {
        action: 'selectMode',
        data: mode,
      })
      this.handleClose()
    },
    handleClose() {
      sync.isShowSyncMode = false
    },
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.main {
  padding: 15px;
  max-width: 700px;
  min-width: 200px;
  min-height: 0;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  h2 {
    font-size: 16px;
    color: @color-theme_2-font;
    line-height: 1.3;
    text-align: center;
  }
}

.content {
  flex: auto;
  padding: 15px 0 5px;
  padding-right: 5px;
  .btnGroup + .btnGroup {
    margin-top: 10px;
  }
  .label {
    color: @color-theme_2-font-label;
    font-size: 14px;
    line-height: 2;
  }
  .desc {
    line-height: 1.5;
    font-size: 14px;
    text-align: justify;
  }

  .tipGroup {
    display: flex;
    flex-direction: row;
    font-size: 12px;

    + .tipGroup {
      margin-top: 5px;
    }

    .title {
      white-space: nowrap;
      font-weight: bold;
      margin-right: 5px;
    }

    .tip {
      line-height: 1.3;
    }
  }
}

.btns {
  display: flex;
  align-items: center;
}
.btn {
  display: block;
  white-space: nowrap;
  +.btn {
    margin-left: 15px;
  }
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
    .name {
      color: ~'@{color-@{value}-theme}';
    }
  }
})

</style>
