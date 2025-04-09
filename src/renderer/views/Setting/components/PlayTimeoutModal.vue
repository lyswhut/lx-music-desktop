<template lang="pug">
material-modal(:show="modelValue" teleport="#view" @close="handleCloseModal" @after-enter="$refs.dom_input.focus()")
  main(:class="$style.main")
    h2 {{ $t('play_timeout') }}
    div(:class="$style.content")
      div(:class="[$style.row, $style.inputGroup]")
        base-input(ref="dom_input" v-model="time" :class="$style.input" type="number")
        p(:class="$style.inputLabel") {{ $t('play_timeout_unit') }}
      div(:class="$style.row")
        base-checkbox(id="play_timeout_end" :model-value="appSetting['player.waitPlayEndStop']" :label="$t('play_timeout_end')" @update:model-value="updateSetting({'player.waitPlayEndStop': $event})")
      div(:class="[$style.row, $style.tip, { [$style.show]: !!timeLabel }]")
        p {{ $t('play_timeout_tip', { time: timeLabel }) }}
    div(:class="$style.footer")
        base-btn(:class="$style.footerBtn" @click="handleCancel") {{ $t(timeLabel ? 'play_timeout_stop' : 'play_timeout_close') }}
        base-btn(:class="$style.footerBtn" @click="handleConfirm") {{ $t(timeLabel ? 'play_timeout_update' : 'play_timeout_confirm') }}
</template>

<script>
import { useTimeout, startTimeoutStop, stopTimeoutStop } from '@renderer/core/player/timeoutStop'
import { ref } from '@common/utils/vueTools'
import { appSetting, updateSetting } from '@renderer/store/setting'

const MAX_MIN = 1440

const rxp = /([1-9]\d*)/

export default {
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { timeLabel } = useTimeout()
    const time = ref(appSetting['player.waitPlayEndStopTime'])

    const handleCloseModal = () => {
      emit('update:modelValue', false)
    }
    const handleCancel = () => {
      if (timeLabel.value) {
        stopTimeoutStop()
      }
      handleCloseModal()
    }
    const verify = () => {
      const orgText = time.value
      let text = time.value

      if (rxp.test(text)) {
        text = RegExp.$1
        if (parseInt(text) > MAX_MIN) {
          text = MAX_MIN
        }
      } else {
        text = ''
      }
      time.value = text
      return text && orgText == text ? parseInt(text) : ''
    }
    const handleConfirm = () => {
      let time = verify()
      if (time == '') return
      if (appSetting['player.waitPlayEndStopTime'] != time) updateSetting({ 'player.waitPlayEndStopTime': time })
      startTimeoutStop(time * 60)
      handleCloseModal()
    }
    return {
      appSetting,
      updateSetting,
      timeLabel,
      time,
      handleCloseModal,
      handleCancel,
      handleConfirm,
    }
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.main {
  padding: 15px;
  max-width: 530px;
  min-width: 280px;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  min-height: 0;
  // max-height: 100%;
  // overflow: hidden;
  h2 {
    font-size: 16px;
    color: var(--color-font);
    line-height: 1.3;
    text-align: center;
  }
}
.content {
  padding-top: 15px;
  font-size: 14px;
}
.row {
  padding-top: 5px;
}
.inputGroup {
  display: flex;
  align-items: center;
}
.input {
  flex: auto;
}
.inputLabel {
  flex: none;
  margin-left: 10px;
}
.tip {
  visibility: hidden;

  &.show {
    visibility: visible;
  }
}
.footer {
  margin-top: 20px;
  display: flex;
  flex-flow: row nowrap;
}
.footerBtn {
  flex: auto;
  height: 36px;
  line-height: 36px;
  padding: 0 10px !important;
  width: 150px;
  .mixin-ellipsis-1();
  + .footerBtn {
    margin-left: 15px;
  }
}
.ruleLink {
  .mixin-ellipsis-1();
}

</style>
