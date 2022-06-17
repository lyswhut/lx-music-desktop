<template lang="pug">
material-modal(:show="modelValue" bg-close @close="handleClose" teleport="#view")
  main(:class="$style.main")
    h2 {{$t('user_api__title')}}
    ul.scroll(v-if="apiList.length" :class="$style.content")
      li(:class="[$style.listItem, {[$style.active]: setting.apiSource == api.id}]" v-for="(api, index) in apiList" :key="api.id")
        div(:class="$style.listLeft")
          h3 {{api.name}}
          p {{api.description}}
          div
            base-checkbox(:class="$style.checkbox" :id="`user_api_${api.id}`" v-model="api.allowShowUpdateAlert" @change="handleChangeAllowUpdateAlert(api, $event)" :label="$t('user_api__allow_show_update_alert')")
        base-btn(:class="$style.listBtn" outline :aria-label="$t('user_api__btn_remove')" @click.stop="handleRemove(index)")
          svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' viewBox='0 0 212.982 212.982' space='preserve' v-once)
            use(xlink:href='#icon-delete')
    div(v-else :class="$style.content")
      div(:class="$style.noitem") {{$t('user_api__noitem')}}
    div(:class="$style.note")
      p(:class="[$style.ruleLink]")
        | {{$t('user_api__readme')}}
        span.hover.underline(@click="handleOpenUrl('https://lxmusic.toside.cn/desktop/custom-source')" aria-label="https://lxmusic.toside.cn/desktop/custom-source") FAQ
      p {{$t('user_api__note')}}
    div(:class="$style.footer")
      base-btn(:class="$style.footerBtn" @click="handleImport") {{$t('user_api__btn_import')}}
      //- base-btn(:class="$style.footerBtn" @click="handleExport") {{$t('user_api__btn_export')}}
</template>

<script>
import { mapGetters } from 'vuex'
import { rendererInvoke, NAMES } from '@common/ipc'
import { promises as fsPromises } from 'fs'
import { selectDir, openUrl } from '@renderer/utils'
import apiSourceInfo from '@renderer/utils/music/api-source-info'
import { userApi, apiSource } from '@renderer/core/share'
import { setAllowShowUserApiUpdateAlert } from '@renderer/utils/tools'

export default {
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    return {
      userApi,
    }
  },
  computed: {
    ...mapGetters(['setting']),
    apiList() {
      return this.userApi.list
    },
  },
  methods: {
    handleImport() {
      if (this.userApi.list.length > 20) {
        this.$dialog({
          message: this.$t('user_api__max_tip'),
          confirmButtonText: this.$t('ok'),
        })
        return
      }
      selectDir({
        title: this.$t('user_api__import_file'),
        properties: ['openFile'],
        filters: [
          { name: 'LX API File', extensions: ['js'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      }).then(result => {
        if (result.canceled) return
        return fsPromises.readFile(result.filePaths[0]).then(data => {
          return rendererInvoke(NAMES.mainWindow.import_user_api, data.toString()).then(({ apiList }) => {
            userApi.list = apiList
          })
        })
      })
    },
    handleExport() {

    },
    async handleRemove(index) {
      const api = this.apiList[index]
      if (!api) return
      if (this.setting.apiSource == api.id) {
        let backApi = apiSourceInfo.find(api => !api.disabled)
        if (backApi) apiSource.value = backApi.id
      }
      userApi.list = await rendererInvoke(NAMES.mainWindow.remove_user_api, [api.id])
    },
    handleClose() {
      this.$emit('update:modelValue', false)
    },
    handleOpenUrl(url) {
      openUrl(url)
    },
    handleChangeAllowUpdateAlert(api, enable) {
      setAllowShowUserApiUpdateAlert(api.id, enable)
    },
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.main {
  padding: 15px;
  max-width: 400px;
  min-width: 300px;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  min-height: 0;
  // max-height: 100%;
  // overflow: hidden;
  h2 {
    font-size: 16px;
    color: @color-theme_2-font;
    line-height: 1.3;
    text-align: center;
  }
}

.name {
  color: @color-theme;
}

.checkbox {
  margin-top: 3px;
  font-size: 14px;
  opacity: .86;
}

.content {
  flex: auto;
  min-height: 100px;
  max-height: 100%;
  margin-top: 15px;
}
.listItem {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  transition: background-color 0.2s ease;
  padding: 10px;
  border-radius: @radius-border;
  &:hover {
    background-color: @color-theme_2-hover;
  }
  &.active {
    background-color: @color-theme_2-active;
  }
  h3 {
    font-size: 15px;
    color: @color-theme_2-font;
    word-break: break-all;
  }
  p {
    margin-top: 5px;
    font-size: 14px;
    color: @color-theme_2-font-label;
    word-break: break-all;
  }
}
.noitem {
  height: 100px;
  font-size: 18px;
  color: @color-theme_2-font-label;
  display: flex;
  justify-content: center;
  align-items: center;
}
.listLeft {
  flex: auto;
  min-width: 0;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
}
.listBtn {
  flex: none;
  height: 30px;
  width: 30px;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  svg {
    width: 60%;
  }
}
.note {
  margin-top: 15px;
  font-size: 12px;
  line-height: 1.25;
  color: @color-theme_2-font;
  p {
    + p {
      margin-top: 5px;
    }
  }
}
.footer {
  margin-top: 15px;
  display: flex;
  flex-flow: row nowrap;
}
.footerBtn {
  flex: auto;
  height: 36px;
  line-height: 36px;
  padding: 0 10px !important;
  width: 150px;
  .mixin-ellipsis-1;
  + .footerBtn {
    margin-left: 15px;
  }
}
.ruleLink {
  .mixin-ellipsis-1;
}


each(@themes, {
  :global(#root.@{value}) {
    .main {
      h2 {
        color: ~'@{color-@{value}-theme_2-font}';
      }
    }
    .listItem {
      &:hover {
        background-color: ~'@{color-@{value}-theme_2-hover}';
      }
      &.active {
        background-color: ~'@{color-@{value}-theme_2-active}';
      }
      h3 {
        color: ~'@{color-@{value}-theme_2-font}';
      }
      p {
        color: ~'@{color-@{value}-theme_2-font-label}';
      }
    }
    .noitem {
      color: ~'@{color-@{value}-theme_2-font-label}';
    }

    .note {
      color: ~'@{color-@{value}-theme_2-font}';
    }
  }
})

</style>
