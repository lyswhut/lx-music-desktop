
<template>
    <div class="navigation-buttons">
        <base-button-icon @click="go('back')"><base-svg-icon icon-class="arrow-left" /></base-button-icon>
        <base-button-icon @click="go('forward')"><base-svg-icon icon-class="arrow-right" /></base-button-icon>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
const go = (where) => {
  if (where === 'back') router.go(-1)
  else router.go(1)
}
</script>

<style lang="less" scoped>
@import '@renderer/assets/styles/layout.less';
.navigation-buttons{
    .svg-icon {
      height: 24px;
      width: 24px;
    }
    button {
      -webkit-app-region: no-drag;
    }
  }
</style>
