<template>
  <div ref="dom_btn" :class="$style.content" @click="handleShowPopup">
    <slot />
    <base-popup v-model:visible="visible" :btn-el="dom_btn">
      <slot name="content" />
    </base-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, defineExpose } from '@common/utils/vueTools'

const visible = ref(false)
const dom_btn = ref<HTMLElement | null>(null)

const handleShowPopup = (evt: MouseEvent) => {
  if (visible.value) evt.stopPropagation()
  setTimeout(() => {
    // if (!)
    visible.value = !visible.value
  }, 50)
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
