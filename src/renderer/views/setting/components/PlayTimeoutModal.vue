<template lang="pug">
material-modal(:show="modelValue" bg-close @close="handleCloseModal" @after-enter="$refs.dom_input.focus()" teleport="#view")
  main(:class="$style.main")
    h2 {{$t('play_timeout')}}
    div(:class="$style.content")
      div(:class="[$style.row, $style.inputGroup]")
        base-input(:class="$style.input" ref="dom_input" v-model="time" type="number")
        p(:class="$style.inputLabel") {{$t('play_timeout_unit')}}
      div(:class="$style.row")
        base-checkbox(id="play_timeout_end" v-model="currentStting.player.waitPlayEndStop" :label="$t('play_timeout_end')")
      div(:class="[$style.row, $style.tip, { [$style.show]: !!timeLabel }]")
        p {{$t('play_timeout_tip', { time: timeLabel })}}
    div(:class="$style.footer")
        base-btn(:class="$style.footerBtn" @click="handleCancel") {{$t(timeLabel ? 'play_timeout_stop' : 'play_timeout_close')}}
        base-btn(:class="$style.footerBtn" @click="handleConfirm") {{$t(timeLabel ? 'play_timeout_update' : 'play_timeout_confirm')}}
</template>

<script>
import { currentStting } from '../setting'
import { useTimeout, startTimeoutStop, stopTimeoutStop } from '@renderer/utils/timeoutStop'
import { ref } from '@renderer/utils/vueTools'

const MAX_MIN = 1440

const rxp = /([1-9]\d*)/

export default {
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const { timeLabel } = useTimeout()
    const time = ref(currentStting.value.player.waitPlayEndStopTime)

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
          text = text.substring(0, text.length - 1)
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
      currentStting.value.player.waitPlayEndStopTime = time
      startTimeoutStop(time * 60)
      handleCloseModal()
    }
    return {
      currentStting,
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
    color: @color-theme_2-font;
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
  }
})

</style>
