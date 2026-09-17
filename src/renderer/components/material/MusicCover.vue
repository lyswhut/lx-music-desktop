<template>
  <span class="list-item-art" :class="size" aria-hidden="true">
    <img v-if="url" :src="url" decoding="async" @error="failed = true">
    <span v-else>{{ fallback }}</span>
  </span>
</template>

<script setup>
import { computed, ref, watch } from '@common/utils/vueTools'

const props = defineProps({
  src: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: '',
  },
})

const failed = ref(false)
watch(() => props.src, () => {
  failed.value = false
})

const url = computed(() => (!failed.value && props.src) ? props.src : '')
const fallback = computed(() => (props.name || '').trim().slice(0, 1) || '♪')
</script>
