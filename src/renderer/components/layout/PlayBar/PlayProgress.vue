<template>
  <div ref="dom_btn" :class="$style.content" @click="handleShowPopup" @mouseenter="handlMsEnter" @mouseleave="handlMsLeave">
    <span>{{ nowPlayTimeStr }}</span>
    <span style="margin: 0 1px;">/</span>
    <span>{{ maxPlayTimeStr }}</span>
    <base-popup v-model:visible="visible" :btn-el="dom_btn" @mouseenter="handlMsEnter" @mouseleave="handlMsLeave">
      <div :class="$style.progress">
        <common-progress-bar :progress="progress" :handle-transition-end="handleTransitionEnd" :is-active-transition="isActiveTransition" />
      </div>
    </base-popup>
  </div>
</template>

<script>
import { ref, onMounted } from '@common/utils/vueTools'
import usePlayProgress from '@renderer/utils/compositions/usePlayProgress'


export default {
  setup() {
    const visible = ref(false)
    const dom_btn = ref<HTMLElement | null>(null)

    const handleShowPopup = (evt) => {
      if (visible.value) evt.stopPropagation()
      setTimeout(() => {
        // if (!)
        visible.value = !visible.value
      }, 50)
    }
    const {
      nowPlayTimeStr,
      maxPlayTimeStr,
      progress,
      isActiveTransition,
      handleTransitionEnd,
    } = usePlayProgress()

    let timeout = null
    const handlMsEnter = () => {
      if (visible.value) {
        if (timeout) {
          clearTimeout(timeout)
          timeout = null
        }
        return
      }
      visible.value = true
    }
    const handlMsLeave = () => {
      if (!visible.value) return
      timeout = setTimeout(() => {
        timeout = null
        visible.value = false
      }, 100)
    }

    onMounted(() => {
      visible.value = true
      requestAnimationFrame(() => {
        visible.value = false
      })
    })

    return {
      visible,
      dom_btn,
      handleShowPopup,
      nowPlayTimeStr,
      maxPlayTimeStr,
      progress,
      isActiveTransition,
      handleTransitionEnd,
      handlMsLeave,
      handlMsEnter,
    }
  },
}

</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';
.content {
  flex: none;
  position: relative;
  // display: inline-block;
  padding: 5px 0 5px 5px;
  color: var(--color-font);
  font-size: 13px;
  cursor: pointer;
  transition: opacity @transition-fast;

  &:hover {
    opacity: .7;
  }
}

.progress {
  position: relative;
  width: 300px;
  height: 15px;
  box-sizing: border-box;
  padding: 5px;
}

</style>
