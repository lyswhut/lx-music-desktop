<template>
  <div class="action-buttons" @dblclick.stop>
    <button type="button" class="action-button" title="上一首" aria-label="上一首" @pointerdown.stop @click.stop="emit('action', 'prev')">
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M5.2 4.3a1 1 0 0 1 1 1v9.4a1 1 0 1 1-2 0V5.3a1 1 0 0 1 1-1Zm9.28.58a1 1 0 0 1-.1 1.62L9.6 10l4.78 3.5a1 1 0 0 1-1.18 1.62l-5.86-4.28a1 1 0 0 1 0-1.62l5.86-4.28a1 1 0 0 1 1.28.08Z" fill="currentColor" />
      </svg>
    </button>
    <button
      type="button"
      class="action-button action-button-primary"
      :title="isPlaying ? '暂停' : '播放'"
      :aria-label="isPlaying ? '暂停' : '播放'"
      @pointerdown.stop
      @click.stop="emit('action', isPlaying ? 'pause' : 'play')"
    >
      <svg v-if="isPlaying" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M6 4.5A1.5 1.5 0 0 1 7.5 6v8A1.5 1.5 0 0 1 6 15.5 1.5 1.5 0 0 1 4.5 14V6A1.5 1.5 0 0 1 6 4.5Zm8 0A1.5 1.5 0 0 1 15.5 6v8A1.5 1.5 0 0 1 14 15.5 1.5 1.5 0 0 1 12.5 14V6A1.5 1.5 0 0 1 14 4.5Z" fill="currentColor" />
      </svg>
      <svg v-else viewBox="0 0 20 20" aria-hidden="true">
        <path d="M6.24 4.86c0-.93 1.02-1.5 1.81-1.01l7.12 4.43a2.02 2.02 0 0 1 0 3.44l-7.12 4.43c-.8.49-1.8-.08-1.8-1.01V4.86Z" fill="currentColor" />
      </svg>
    </button>
    <button type="button" class="action-button" title="下一首" aria-label="下一首" @pointerdown.stop @click.stop="emit('action', 'next')">
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M14.8 4.3a1 1 0 0 1 1 1v9.4a1 1 0 1 1-2 0V5.3a1 1 0 0 1 1-1Zm-9.28.58a1 1 0 0 1 1.28-.08l5.86 4.28a1 1 0 0 1 0 1.62L6.8 15.12a1 1 0 1 1-1.18-1.62L10.4 10 5.62 6.5a1 1 0 0 1-.1-1.62Z" fill="currentColor" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isPlaying: boolean
}>()

const emit = defineEmits<(event: 'action', action: 'prev' | 'next' | 'play' | 'pause') => void>()
</script>
