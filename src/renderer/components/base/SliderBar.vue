<template>
  <div :class="[$style.sliderContent, { [$style.disabled]: disabled }, className]">
    <div :class="[$style.slider]">
      <div ref="dom_sliderBar" :class="$style.sliderBar" :style="{ transform: `scaleX(${(value - min) / (max - min) || 0})` }" />
    </div>
    <div :class="$style.sliderMask" @mousedown="handleSliderMsDown" />
  </div>
</template>

<script>
import { ref, onBeforeUnmount } from '@common/utils/vueTools'
// import { player as eventPlayerNames } from '@renderer/event/names'

export default {
  props: {
    className: {
      type: String,
      default: '',
    },
    value: {
      type: Number,
      required: true,
    },
    min: {
      type: Number,
      required: true,
    },
    max: {
      type: Number,
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['change'],
  setup(props, { emit }) {
    const sliderEvent = {
      isMsDown: false,
      msDownX: 0,
      msDownValue: 0,
    }
    const dom_sliderBar = ref(null)

    const handleSliderMsDown = event => {
      if (props.disabled) return

      sliderEvent.isMsDown = true
      sliderEvent.msDownX = event.clientX

      sliderEvent.msDownValue = event.offsetX / dom_sliderBar.value.clientWidth
      let val = sliderEvent.msDownValue * (props.max - props.min) + props.min
      if (val < props.min) val = props.min
      if (val > props.max) val = props.max
      emit('change', val)

      // if (isMute.value) window.app_event.setSliderIsMute(false)
    }
    const handleSliderMsUp = () => {
      sliderEvent.isMsDown = false
    }
    const handleSliderMsMove = event => {
      if (!sliderEvent.isMsDown || props.disabled) return
      let value = (sliderEvent.msDownValue + (event.clientX - sliderEvent.msDownX) / dom_sliderBar.value.clientWidth) * (props.max - props.min) + props.min
      if (value > props.max) value = props.max
      else if (value < props.min) value = props.min
      emit('change', value)
    }

    document.addEventListener('mousemove', handleSliderMsMove)
    document.addEventListener('mouseup', handleSliderMsUp)
    onBeforeUnmount(() => {
      document.removeEventListener('mousemove', handleSliderMsMove)
      document.removeEventListener('mouseup', handleSliderMsUp)
    })

    return {
      handleSliderMsDown,
      dom_sliderBar,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.sliderContent {
  flex: none;
  position: relative;
  width: 100px;
  padding: 5px 0;
  // margin-right: 10px;
  display: flex;
  align-items: center;
  opacity: .5;
  transition: opacity @transition-normal;
  &:hover {
    opacity: 1;
  }
  &.disabled {
    opacity: .3;
    .sliderMask {
      cursor: default;
    }
  }
}

.slider {
  // cursor: pointer;
  width: 100%;
  height: 5px;
  border-radius: 20px;
  overflow: hidden;
  transition: @transition-normal;
  transition-property: background-color, opacity;
  background-color: var(--color-primary-alpha-700);
  // background-color: #f5f5f5;
  position: relative;
  // border-radius: @radius-progress-border;
}

// .muted {
//   opacity: .5;
// }

.sliderBar {
  position: absolute;
  left: 0;
  top: 0;
  transform: scaleX(0);
  transform-origin: 0;
  transition-property: transform;
  transition-timing-function: ease;
  width: 100%;
  height: 100%;
  // border-radius: @radius-progress-border;
  transition-duration: 0.2s;
  background-color: var(--color-button-font);
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
}

.sliderMask {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

</style>
