<template>
  <div ref="dom_btn" :class="$style.content" @click="handleShowPopup" @mouseenter="handlMsEnter" @mouseleave="handlMsLeave">
    <slot />
    <base-popup v-model:visible="visible" :btn-el="dom_btn" @mouseenter="handlMsEnter" @mouseleave="handlMsLeave">
      <slot name="content" />
    </base-popup>
  </div>
</template>

<script setup lang="ts">
import { ref } from '@common/utils/vueTools'

const visible = ref(false)
const dom_btn = ref<HTMLElement | null>(null)

const handleShowPopup = (evt: MouseEvent) => {
  if (visible.value) {
    evt.stopPropagation()
    handlMsLeave()
  } else handlMsEnter()
  // setTimeout(() => {
  //   // if (!)
  //   visible.value = !visible.value
  // }, 50)
}

let timeout: number | null = null
const handlMsEnter = () => {
  if (timeout) {
    clearTimeout(timeout)
    timeout = null
  }
  if (visible.value) return
  timeout = setTimeout(() => {
    visible.value = true
  }, 100) as unknown as number
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
  }, 100) as unknown as number
}

defineExpose({
  hide() {
    visible.value = false
  },
})

</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';
.content {
  position: relative;
  display: inline-block;
}

</style>
