<template>
  <div ref="dom_btn" :class="$style.content" @click="handleShowPopup" @mouseenter="handlMsEnter" @mouseleave="handlMsLeave">
    <span>{{ nowPlayTimeStr }}</span>
    <span style="margin: 0 1px;">/</span>
    <span>{{ maxPlayTimeStr }}</span>
    <base-popup v-model:visible="visible" :btn-el="dom_btn" @mouseenter="handlMsEnter" @mouseleave="handlMsLeave" @transitionend="handleTranEnd">
      <div :class="$style.progress">
        <common-progress-bar v-if="visibleProgress" :progress="progress" :handle-transition-end="handleTransitionEnd" :is-active-transition="isActiveTransition" />
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
    const visibleProgress = ref(false)
    const dom_btn = ref<HTMLElement | null>(null)

    const handleShowPopup = (evt) => {
      if (visible.value) evt.stopPropagation()
      if (visible.value) handlMsLeave()
      else handlMsEnter()
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
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      if (visible.value) return
      timeout = setTimeout(() => {
        visible.value = true
        visibleProgress.value = true
      }, 100)
    }
    const handlMsLeave = () => {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      if (!visible.value) return
      timeout = setTimeout(() => {
        timeout = null
        visible.value = false
      }, 100)
    }
    const handleTranEnd = () => {
      if (visible.value) return
      visibleProgress.value = false
    }

    onMounted(() => {
      visible.value = true
      requestAnimationFrame(() => {
        visible.value = false
      })
    })

    return {
      visible,
      visibleProgress,
      dom_btn,
      handleShowPopup,
      nowPlayTimeStr,
      maxPlayTimeStr,
      progress,
      isActiveTransition,
      handleTransitionEnd,
      handlMsLeave,
      handlMsEnter,
      handleTranEnd,
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
  padding: 5px 0;
  color: var(--color-300);
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
