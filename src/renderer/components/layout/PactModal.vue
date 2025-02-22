<template>
  <material-modal :show="!isAgreePact || isShowPact" max-width="70%" :bg-close="isAgreePact" :close-btn="isAgreePact" @close="handleClose(false)">
    <main :class="$style.main">
      <h2>许可协议</h2>
      <div class="select scroll" :class="$style.content">
        <template v-if="!isAgreePact"><p><strong>在使用本软件前，你（使用者）需签署本协议才可继续使用！</strong></p><br></template>
        <p>本项目基于&nbsp;<strong class="hover underline" @click="openUrl('http://www.apache.org/licenses/LICENSE-2.0')">Apache License 2.0</strong>&nbsp;许可证发行。以下协议是对于 Apache License 2.0 的补充，如有冲突，以以下协议为准。</p><br>
        <p>词语约定：本协议中的“本项目”指 LX Music（洛雪音乐助手）桌面版项目；“使用者”指签署本协议的使用者；“官方音乐平台”指对本项目内置的包括酷我、酷狗、咪咕等音乐源的官方平台统称；“版权数据”指包括但不限于图像、音频、名字等在内的他人拥有所属版权的数据。</p><br>
        <p><strong>一、数据来源</strong></p><br>
        <p>1.1&nbsp;本项目的各官方平台在线数据来源原理是从其公开服务器中拉取数据（与未登录状态在官方平台 APP 获取的数据相同），经过对数据简单地筛选与合并后进行展示，因此本项目不对数据的合法性、准确性负责。</p><br>
        <p>1.2&nbsp;本项目本身没有获取某个音频数据的能力，本项目使用的在线音频数据来源来自软件设置内“自定义源”设置所选择的“源”返回的在线链接。例如播放某首歌，本项目所做的只是将希望播放的歌曲名、艺术家等信息传递给“源”，若“源”返回了一个链接，则本项目将认为这就是该歌曲的音频数据而进行使用，至于这是不是正确的音频数据本项目无法校验其准确性，所以使用本项目的过程中可能会出现希望播放的音频与实际播放的音频不对应或者无法播放的问题。</p><br>
        <p>1.3&nbsp;本项目的非官方平台数据（例如“我的列表”内列表）来自使用者本地系统或者使用者连接的同步服务，本项目不对这些数据的合法性、准确性负责。</p><br>
        <p><strong>二、版权数据</strong></p><br>
        <p>2.1&nbsp;使用本项目的过程中可能会产生版权数据。对于这些版权数据，本项目不拥有它们的所有权。为了避免侵权，使用者务必在&nbsp;<strong>24&nbsp;小时内</strong>&nbsp;清除使用本项目的过程中所产生的版权数据。</p><br>
        <p><strong>三、音乐平台别名</strong></p><br>
        <p>3.1&nbsp;本项目内的官方音乐平台别名为本项目内对官方音乐平台的一个称呼，不包含恶意。如果官方音乐平台觉得不妥，可联系本项目更改或移除。</p><br>
        <p><strong>四、资源使用</strong></p><br>
        <p>4.1&nbsp;本项目内使用的部分包括但不限于字体、图片等资源来源于互联网。如果出现侵权可联系本项目移除。</p><br>
        <p><strong>五、免责声明</strong></p><br>
        <p>5.1&nbsp;由于使用本项目产生的包括由于本协议或由于使用或无法使用本项目而引起的任何性质的任何直接、间接、特殊、偶然或结果性损害（包括但不限于因商誉损失、停工、计算机故障或故障引起的损害赔偿，或任何及所有其他商业损害或损失）由使用者负责。</p><br>
        <p><strong>六、使用限制</strong></p><br>
        <p>6.1&nbsp;本项目完全免费，且开源发布于&nbsp;<span class="hover underline" @click="openUrl('https://github.com/lyswhut/lx-music-desktop#readme')">GitHub</span>&nbsp;面向全世界人用作对技术的学习交流，本项目不对项目内的技术可能存在违反当地法律法规的行为作保证。</p><br>
        <p>6.2&nbsp;<strong>禁止在违反当地法律法规的情况下使用本项目。</strong>&nbsp;对于使用者在明知或不知当地法律法规不允许的情况下使用本项目所造成的任何违法违规行为由使用者承担，本项目不承担由此造成的任何直接、间接、特殊、偶然或结果性责任。</p><br>
        <p><strong>七、版权保护</strong></p><br>
        <p>7.1&nbsp;音乐平台不易，请尊重版权，支持正版。</p><br>
        <p><strong>八、非商业性质</strong></p><br>
        <p>8.1&nbsp;本项目仅用于对技术可行性的探索及研究，不接受任何商业（包括但不限于广告等）合作及捐赠。</p><br>
        <p><strong>九、接受协议</strong></p><br>
        <p>9.1&nbsp;若你使用了本项目，即代表你接受本协议。</p><br>
        <p><strong>*</strong>&nbsp;若协议更新，恕不另行通知，可到开源地址查看。</p>
        <p v-if="!isAgreePact"><strong>若你（使用者）接受以上协议，请点击下面的“接受”按钮签署本协议，若不接受，请点击“不接受”后退出软件并清除本软件的所有数据。</strong></p>
      </div>
      <div v-if="!isAgreePact" :class="$style.btns">
        <base-btn :class="$style.btn" @click="handleClose(true)">{{ $t('not_agree') }}</base-btn>
        <base-btn :class="$style.btn" :disabled="!btnEnable" @click="handleClick">{{ $t('agree') }} {{ timeStr }}</base-btn>
      </div>
    </main>
  </material-modal>
</template>

<script>
import { checkUpdate, quitApp } from '@renderer/utils/ipc'
import { openUrl } from '@common/utils/electron'
import { isShowPact } from '@renderer/store'
import { appSetting, saveAgreePact } from '@renderer/store/setting'
import { computed } from '@common/utils/vueTools'

export default {
  setup() {
    const isAgreePact = computed(() => appSetting['common.isAgreePact'])

    return {
      isShowPact,
      isAgreePact,
      appSetting,
    }
  },
  data() {
    return {
      time: 20,
    }
  },
  computed: {
    btnEnable() {
      return this.time == 0
    },
    timeStr() {
      return this.btnEnable ? '' : `(${this.time})`
    },
  },
  watch: {
    isAgreePact(n) {
      if (n) return
      this.time = 5
      this.startTimeout()
    },
  },
  mounted() {
    this.$nextTick(() => {
      if (!this.isAgreePact) {
        this.startTimeout()
      }
    })
  },
  methods: {
    handleClick() {
      saveAgreePact(true)
      window.setTimeout(() => {
        this.$dialog({
          message: Buffer.from('e69cace8bdafe4bbb6e5ae8ce585a8e5858de8b4b9e4b894e5bc80e6ba90efbc8ce5a682e69e9ce4bda0e698afe88ab1e992b1e8b4ade4b9b0e79a84efbc8ce8afb7e79bb4e68ea5e7bb99e5b7aee8af84efbc810a0a5468697320736f667477617265206973206672656520616e64206f70656e20736f757263652e', 'hex').toString(),
          confirmButtonText: Buffer.from('e5a5bde79a8420284f4b29', 'hex').toString(),
        }).then(() => {
          checkUpdate()
        })
      }, 2e3)
    },
    handleClose(isExit) {
      if (isExit) {
        quitApp(true)
        return
      }
      isShowPact.value = false
    },
    openUrl(url) {
      void openUrl(url)
    },
    startTimeout() {
      window.setTimeout(() => {
        if (--this.time > 0) this.startTimeout()
      }, 1e3)
    },
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.main {
  padding: 15px 8px 12px;
  min-width: 200px;
  min-height: 0;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  h2 {
    font-size: 16px;
    color: var(--color-font);
    line-height: 1.3;
    text-align: center;
  }
}

.content {
  flex: auto;
  margin: 15px 0;
  padding: 0 7px;
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


</style>
