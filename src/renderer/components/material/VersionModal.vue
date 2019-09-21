<template lang="pug">
material-modal(:show="version.showModal" @close="handleClose")
  main(:class="$style.main" v-if="version.newVersion")
    h2 {{ version.isError ? (isUnknow ? '❓ 版本信息获取失败 ❓' : '🌟发现新版本🌟') : '🚀程序更新🚀'}}

    div.scroll(:class="$style.info")
      div(:class="$style.current")
        h3 最新版本：{{version.newVersion.version}}
        h3 当前版本：{{version.version}}
        h3 版本变化：
        p(:class="$style.desc" v-html="version.newVersion.desc")
      div(:class="[$style.history, $style.desc]" v-if="history.length")
        h3 历史版本：
        div(:class="$style.item" v-for="ver in history")
          h4 v{{ver.version}}
          p(v-html="ver.desc")

    div(:class="$style.footer" v-if="version.isError")
      div(:class="$style.desc" v-if="!isUnknow")
        p 发现有新版本啦，但是自动更新功能出问题了
        p
          | 你现在可以选择继续使用当前版本或
          strong 去发布页下载新版本
        p
          | 推荐到
          strong 网盘
          | 下载
      div(:class="$style.btns")
        material-btn(:class="$style.btn" @click.onec="handleIgnoreClick") 忽略该版本
        material-btn(:class="$style.btn" @click.onec="handleOpenPageClick") 去下载新版本
    div(:class="$style.footer" v-else)
      div(:class="$style.desc")
        p 新版本已下载完毕，
        p
          | 你可以选择
          strong 立即重启更新
          | 或稍后
          strong 关闭程序时
          | 自动更新~
      material-btn(:class="$style.btn" @click.onec="handleRestartClick") 立即重启更新

</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import { rendererSend } from '../../../common/icp'
import { checkVersion, openUrl } from '../../utils'

export default {
  computed: {
    ...mapGetters(['version', 'setting']),
    history() {
      if (!this.version.newVersion) return []
      let arr = []
      let currentVer = this.version.version
      this.version.newVersion.history.forEach(ver => {
        if (checkVersion(currentVer, ver.version)) arr.push(ver)
      })

      return arr
    },
    isUnknow() {
      return this.version.newVersion.version == '0.0.0'
    },
  },
  methods: {
    ...mapMutations(['setVersionModalVisible', 'setSetting']),
    handleClose() {
      this.setVersionModalVisible({
        isShow: false,
      })
    },
    handleIgnoreClick(event) {
      this.handleClose()
      // event.target.disabled = true
      this.setSetting(Object.assign({}, this.setting, { ignoreVersion: this.version.newVersion.version }))
    },
    handleOpenPageClick() {
      openUrl('https://github.com/lyswhut/lx-music-desktop#readme')
    },
    handleRestartClick(event) {
      this.handleClose()
      event.target.disabled = true
      rendererSend('quit-update')
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';

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
}

.info {
  flex: 1 1 auto;
  font-size: 13px;
  line-height: 1.5;
  overflow-y: auto;
  height: 100%;
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
    font-size: 12px;
    padding: 10px 0;
    color: @color-theme;
    line-height: 1.2;
    strong {
      text-decoration: underline;
    }
  }
}
.btn {
  display: block;
  width: 100%;
}
.btns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 0 10px;
}

each(@themes, {
  :global(#container.@{value}) {
    .main {
      h2 {
        color: ~'@{color-@{value}-theme_2-font}';
      }
    }
    .footer {
      .desc {
        color: ~'@{color-@{value}-theme}';
      }
    }
  }
})

</style>
