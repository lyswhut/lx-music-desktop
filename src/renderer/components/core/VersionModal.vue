<template lang="pug">
material-modal(:show="versionInfo.showModal" @close="handleClose")
  main(:class="$style.main" v-if="versionInfo.isDownloaded")
    h2 🚀程序更新🚀

    div.scroll.select(:class="$style.info")
      div(:class="$style.current")
        h3 最新版本：{{versionInfo.newVersion?.version}}
        h3 当前版本：{{versionInfo.version}}
        h3 版本变化：
        pre(:class="$style.desc" v-text="versionInfo.newVersion?.desc")
      div(:class="[$style.history, $style.desc]" v-if="history.length")
        h3 历史版本：
        div(:class="$style.item" v-for="ver in history")
          h4 v{{ver.version}}
          pre(v-text="ver.desc")
    div(:class="$style.footer")
      div(:class="$style.desc")
        p 新版本已下载完毕，
        p
          | 你可以选择
          strong 立即重启更新
          | 或稍后
          strong 关闭程序时
          | 自动更新~
      base-btn(:class="$style.btn" @click.onec="handleRestartClick") 立即重启更新
  main(:class="$style.main" v-else-if="versionInfo.isError && !versionInfo.isUnknow && versionInfo.newVersion?.version != versionInfo.version")
    h2 ❌ 版本更新出错 ❌

    div.scroll.select(:class="$style.info")
      div(:class="$style.current")
        h3 最新版本：{{versionInfo.newVersion?.version}}
        h3 当前版本：{{versionInfo.version}}
        h3 版本变化：
        pre(:class="$style.desc" v-text="versionInfo.newVersion?.desc")
      div(:class="[$style.history, $style.desc]" v-if="history.length")
        h3 历史版本：
        div(:class="$style.item" v-for="ver in history")
          h4 v{{ver.version}}
          pre(v-text="ver.desc")

    div(:class="$style.footer")
      div(:class="$style.desc")
        p 发现有新版本啦，但是自动更新功能出问题了，
        p
          | 你可以去&nbsp;
          strong.hover.underline(@click="handleOpenUrl('https://github.com/lyswhut/lx-music-desktop/releases')" tips="点击打开") 软件发布页
          | &nbsp;或&nbsp;
          strong.hover.underline(@click="handleOpenUrl('https://www.lanzoui.com/b0bf2cfa/')" tips="点击打开") 网盘
          | (密码：
          strong.hover(@click="handleCopy('glqw')" tips="点击复制") glqw
          | )&nbsp;下载新版本，
        p
          | 国内Windows/MAC用户推荐到
          strong 网盘
          | 下载。
      base-btn(:class="$style.btn" @click.onec="handleIgnoreClick") {{ isIgnored ? '恢复当前版本的更新失败提醒' : '忽略当前版本的更新失败提醒'}}
  main(:class="$style.main" v-else-if="versionInfo.isDownloading && versionInfo.isTimeOut && !versionInfo.isUnknow")
    h2 ❗️ 新版本下载超时 ❗️
    div(:class="$style.desc")
      p 你当前所在网络访问GitHub较慢，导致新版本下载超时（已经下了半个钟了😳），你仍可选择继续等，但墙裂建议手动更新版本！
      p
        | 你可以去
        base-btn(min @click="handleOpenUrl('https://github.com/lyswhut/lx-music-desktop/releases')" tips="点击打开") 软件发布页
        | 或
        base-btn(min @click="handleOpenUrl('https://www.lanzoui.com/b0bf2cfa/')" tips="点击打开") 网盘
        | (密码：
        strong.hover(@click="handleCopy('glqw')" tips="点击复制") glqw
        | )下载新版本，
      p
        | 国内Windows/MAC用户推荐到
        strong 网盘
        | 下载。
      p 当前下载进度：{{progress}}
  main(:class="$style.main" v-else-if="versionInfo.isUnknow")
    h2 ❓ 获取最新版本信息失败 ❓

    div.scroll.select(:class="$style.info")
      div(:class="$style.current")
        h3 当前版本：{{versionInfo.version}}
        div(:class="$style.desc")
          p 更新信息获取失败，可能是无法访问Github导致的，请手动检查更新！
          p
            | 检查方法：打开
            base-btn(min @click="handleOpenUrl('https://github.com/lyswhut/lx-music-desktop/releases')" tips="点击打开") 软件发布页
            | 或
            base-btn(min @click="handleOpenUrl('https://www.lanzoui.com/b0bf2cfa/')" tips="点击打开") 网盘
            | (密码：
            strong.hover(@click="handleCopy('glqw')" tips="点击复制") glqw
            | )查看它们的
            strong 版本号
            | 与当前版本({{versionInfo.version}})对比是否一样，
          p 若一样则不必理会该弹窗，直接关闭即可，否则请手动下载新版本更新。
  main(:class="$style.main" v-else)
    h2 🌟发现新版本🌟

    div.scroll.select(:class="$style.info")
      div(:class="$style.current")
        h3 最新版本：{{versionInfo.newVersion?.version}}
        h3 当前版本：{{versionInfo.version}}
        h3 版本变化：
        pre(:class="$style.desc" v-text="versionInfo.newVersion?.desc")
      div(:class="[$style.history, $style.desc]" v-if="history.length")
        h3 历史版本：
        div(:class="$style.item" v-for="ver in history")
          h4 v{{ver.version}}
          pre(v-text="ver.desc")

    div(:class="$style.footer")
      div(:class="$style.desc")
        p 发现有新版本啦，正在努力更新中，若下载太慢可以手动更新哦~
        p
          | 你也可以关闭本弹窗继续使用软件，还可在
          strong 设置-软件更新
          | 重新打开本弹窗。
        p
          | 手动更新可以去&nbsp;
          strong.hover.underline(@click="handleOpenUrl('https://github.com/lyswhut/lx-music-desktop/releases')" tips="点击打开") 软件发布页
          | &nbsp;或&nbsp;
          strong.hover.underline(@click="handleOpenUrl('https://www.lanzoui.com/b0bf2cfa/')" tips="点击打开") 网盘
          | (密码：
          strong.hover(@click="handleCopy('glqw')" tips="点击复制") glqw
          | )&nbsp;下载，
        p 国内Windows/MAC用户推荐到网盘下载。
        p 当前下载进度：{{progress}}
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import { rendererSend, NAMES } from '@common/ipc'
import { compareVer, openUrl, clipboardWriteText, sizeFormate } from '@renderer/utils'
import { versionInfo } from '@renderer/core/share'

export default {
  setup() {
    return {
      versionInfo,
    }
  },
  computed: {
    ...mapGetters(['setting']),
    history() {
      if (!this.versionInfo.newVersion || !this.versionInfo.newVersion?.history) return []
      let arr = []
      let currentVer = this.versionInfo.version
      this.versionInfo.newVersion?.history.forEach(ver => {
        if (compareVer(currentVer, ver.version) < 0) arr.push(ver)
      })

      return arr
    },
    progress() {
      return this.versionInfo.downloadProgress
        ? `${this.versionInfo.downloadProgress.percent.toFixed(2)}% - ${sizeFormate(this.versionInfo.downloadProgress.transferred)}/${sizeFormate(this.versionInfo.downloadProgress.total)} - ${sizeFormate(this.versionInfo.downloadProgress.bytesPerSecond)}/s`
        : '处理更新中...'
    },
    isIgnored() {
      return this.setting.ignoreVersion == this.versionInfo.newVersion?.version
    },
  },
  methods: {
    ...mapMutations(['setIgnoreVersion']),
    handleClose() {
      versionInfo.showModal = false
    },
    handleOpenUrl(url) {
      openUrl(url)
    },
    handleRestartClick(event) {
      this.handleClose()
      event.target.disabled = true
      rendererSend(NAMES.mainWindow.quit_update)
    },
    handleCopy(text) {
      clipboardWriteText(text)
    },
    handleIgnoreClick() {
      this.setIgnoreVersion(this.isIgnored ? null : this.versionInfo.newVersion?.version)
      this.handleClose()
    },
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.main {
  position: relative;
  padding: 15px;
  max-width: 450px;
  min-width: 300px;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  overflow: hidden;
  // overflow-y: auto;
  * {
    box-sizing: border-box;
  }
  h2 {
    flex: 0 0 none;
    font-size: 16px;
    color: @color-theme_2-font;
    line-height: 1.3;
    text-align: center;
    margin-bottom: 15px;
  }
  h3 {
    font-size: 14px;
    line-height: 1.3;
  }
  pre {
    white-space: pre-wrap;
    text-align: justify;
    margin-top: 10px;
  }
}

.info {
  flex: 1 1 auto;
  font-size: 13px;
  line-height: 1.5;
  overflow-y: auto;
  height: 100%;
  padding-right: 5px;
}
.current {
  > p {
    padding-left: 15px;
  }
}

.desc {
  h3, h4 {
    font-weight: bold;
  }
  h3 {
    padding: 5px 0 3px;
  }
  ul {
    list-style: initial;
    padding-inline-start: 30px;
  }
  p {
    font-size: 14px;
    line-height: 1.5;
  }
}

.history {
  h3 {
    padding-top: 15px;
  }

  .item {
    h3 {
      padding: 5px 0 3px;
    }
    padding: 0 15px;
    + .item {
      padding-top: 15px;
    }
    h4 {
      font-weight: 700;
    }
    > p {
      padding-left: 15px;
    }
  }

}
.footer {
  flex: 0 0 none;
  .desc {
    padding-top: 10px;
    font-size: 12px;
    color: @color-theme;
    line-height: 1.25;

    p {
      font-size: 12px;
      color: @color-theme;
      line-height: 1.25;
    }
  }
}
.btn {
  margin-top: 10px;
  display: block;
  width: 100%;
}

each(@themes, {
  :global(#root.@{value}) {
    .main {
      h2 {
        color: ~'@{color-@{value}-theme_2-font}';
      }
    }
    .footer {
      .desc {
        color: ~'@{color-@{value}-theme}';
        p {
          color: ~'@{color-@{value}-theme}';
        }
      }
    }
  }
})

</style>
