<template lang="pug">
material-modal(:show="!setting.isAgreePact || isShowPact" @close="handleClose(false)" :bgClose="setting.isAgreePact" :close-btn="setting.isAgreePact")
  main(:class="$style.main")
    h2 许可协议
    div.select.scroll(:class="$style.content")
      p
        | 本项目（软件）基于
        strong.hover.underline(@click="openUrl('http://www.apache.org/licenses/LICENSE-2.0')") Apache License 2.0
        | &nbsp;许可证发行，在使用本软件前，你（使用者）需签署本协议才可继续使用，以下协议是对于 Apache License 2.0 的补充，如有冲突，以以下协议为准。
      br
      p 词语约定：本协议中的“本软件”指洛雪音乐桌面版项目；“使用者”指签署本协议的使用者；“官方音乐平台”指对本软件内置的包括酷我、酷狗、咪咕等音乐源的官方平台统称；“版权数据”指包括但不限于图像、音频、名字等在内的他人拥有所属版权的数据。
      br
      p
        strong 1、
        | 本软件的数据来源原理是从各官方音乐平台的公开服务器中拉取数据，经过对数据简单地筛选与合并后进行展示，因此本软件不对数据的准确性负责。
      p
        strong 2、
        | 使用本软件的过程中可能会产生版权数据，对于这些版权数据，本软件不拥有它们的所有权，为了避免造成侵权，使用者务必在
        strong 24小时内
        | 清除使用本软件的过程中所产生的版权数据。
      p
        strong 3、
        | 本软件内的官方音乐平台别名为本软件内对官方音乐平台的一个称呼，不包含恶意，如果官方音乐平台觉得不妥，可联系本软件更改或移除。
      p
        strong 4、
        | 本软件内使用的部分包括但不限于字体、图片等资源来源于互联网，如果出现侵权可联系本软件移除。
      p
        strong 5、
        | 由于使用本软件产生的包括由于本协议或由于使用或无法使用本软件而引起的任何性质的任何直接、间接、特殊、偶然或结果性损害（包括但不限于因商誉损失、停工、计算机故障或故障引起的损害赔偿，或任何及所有其他商业损害或损失）由使用者负责。
      p
        strong 6、
        | 本项目完全免费，且开源发布于&nbsp;
        span.hover.underline(@click="openUrl('https://github.com/lyswhut/lx-music-desktop#readme')") GitHub
        | &nbsp;面向全世界人用作对技术的学习交流，本软件不对项目内的技术可能存在违反当地法律法规的行为作保证，
        strong 禁止在违反当地法律法规的情况下使用本软件
        |，对于使用者在明知或不知当地法律法规不允许的情况下使用本软件所造成的任何违法违规行为由使用者承担，本软件不承担由此造成的任何直接、间接、特殊、偶然或结果性责任。
      br
      p
        strong *
        | &nbsp;若协议更新，恕不另行通知，可到开源地址查看。
      p
        strong *
        | &nbsp;本软件的初衷是帮助官方音乐平台简化数据后代为展示，帮助使用者根据歌曲名、艺术家等关键字快速地定位所需内容所在的音乐平台。
      p
        strong *
        | &nbsp;音乐平台不易，建议到对应音乐平台支持正版资源。

      br
      p(v-if="!setting.isAgreePact")
        strong 若你（使用者）接受以上协议，请点击下面的“接受”按钮签署本协议，若不接受，请点击“不接受”后退出软件并清除本软件的所有数据。


    div(:class="$style.btns" v-if="!setting.isAgreePact")
      base-btn(:class="$style.btn" @click="handleClose(true)") {{$t('not_agree')}}
      base-btn(:class="$style.btn" :disabled="!btnEnable" @click="handleClick()") {{$t('agree')}} {{timeStr}}
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import { rendererSend, NAMES } from '@common/ipc'
import { openUrl } from '@renderer/utils'
import { isShowPact } from '@renderer/core/share'

export default {
  setup() {
    return {
      isShowPact,
    }
  },
  data() {
    return {
      time: 20,
    }
  },
  computed: {
    ...mapGetters(['setting']),
    btnEnable() {
      return this.time == 0
    },
    timeStr() {
      return this.btnEnable ? '' : `(${this.time})`
    },
  },
  watch: {
    'setting.isAgreePact'(n) {
      if (n) return
      this.time = 5
      this.startTimeout()
    },
  },
  mounted() {
    this.$nextTick(() => {
      if (!this.setting.isAgreePact) {
        this.startTimeout()
      }
    })
  },
  methods: {
    ...mapMutations(['setAgreePact']),
    handleClick() {
      this.setAgreePact()
      setTimeout(() => {
        this.$dialog({
          message: Buffer.from('e69cace8bdafe4bbb6e5ae8ce585a8e5858de8b4b9e4b894e5bc80e6ba90efbc8ce5a682e69e9ce4bda0e698afe88ab1e992b1e8b4ade4b9b0e79a84efbc8ce8afb7e79bb4e68ea5e7bb99e5b7aee8af84efbc810a0a5468697320736f667477617265206973206672656520616e64206f70656e20736f757263652e', 'hex').toString(),
          confirmButtonText: Buffer.from('e5a5bde79a8420284f4b29', 'hex').toString(),
        })
      }, 2e3)
    },
    handleClose(isExit) {
      if (isExit) return rendererSend(NAMES.mainWindow.close, true)
      isShowPact.value = false
    },
    openUrl(url) {
      openUrl(url)
    },
    startTimeout() {
      setTimeout(() => {
        if (--this.time > 0) this.startTimeout()
      }, 1e3)
    },
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.main {
  padding: 15px;
  max-width: 550px;
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
  margin: 15px 0;
  padding-right: 5px;
  h3 {
    font-weight: bold;
    line-height: 2;
  }
  p {
    line-height: 1.5;
    font-size: 14px;
    text-align: justify;
  }
}

.btns {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.btn {
  display: block;
  width: 48%;
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
