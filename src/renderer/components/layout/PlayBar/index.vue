<template>
  <FullWidthProgress v-if="appSetting['common.playBarProgressStyle'] == 'full'" />
  <MiddleWidthProgress v-else-if="appSetting['common.playBarProgressStyle'] == 'middle'" />
  <MiniWidthProgress v-else />
</template>

<script setup>
import { appSetting } from '@renderer/store/setting'
import MiniWidthProgress from './MiniWidthProgress.vue'
import FullWidthProgress from './FullWidthProgress.vue'
import MiddleWidthProgress from './MiddleWidthProgress.vue'

</script>
