<template>
    <span v-if="playMusicInfo.quality === 'flac24bit'" class="no-select badge badge-theme-primary">{{ $t('tag__lossless_24bit') }}</span>
    <span v-else-if="playMusicInfo.quality === 'ape' || playMusicInfo.quality === 'flac' || playMusicInfo.quality === 'wav'" class="no-select badge badge-theme-primary">{{ $t('tag__lossless') }}</span>
    <span v-else-if="playMusicInfo.quality === '320k'" class="no-select badge badge-theme-secondary">{{ $t('tag__high_quality') }}</span>
    <span v-else-if="playMusicInfo.quality === '128k'" class="no-select badge badge-theme-tertiary">{{ $t('tag__low_quality') }}</span>
</template>

<script>
import { playMusicInfo } from '@renderer/store/player/state'

export default {
  setup() {
    return {
      playMusicInfo,
    }
  },
}
</script>
