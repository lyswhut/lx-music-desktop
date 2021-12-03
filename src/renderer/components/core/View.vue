<template>
<div :class="$style.view">
  <router-view v-slot="{ Component }" v-if="mounted">
    <transition enter-active-class="animated-fast fadeIn" leave-active-class="animated-fast fadeOut">
      <component :is="Component" />
    </transition>
  </router-view>
</div>
</template>
<script>
import { ref, onMounted } from '@renderer/utils/vueTools'
export default {
  setup() {
    const mounted = ref(false)

    onMounted(() => {
      mounted.value = true
    })

    return {
      mounted,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.view {
  position: relative;
  z-index: 1;
  > * {
    position: absolute;
    width: 100%;
  }
  // background: #fff;
  // overflow: hidden;
}

</style>
