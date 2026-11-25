<template>
  <material-modal :show="catalogState.show" width="88%" max-width="1000px" height="82%" max-height="90%" bg-close @close="catalogActions.close">
    <section :class="$style.catalog" :aria-label="$t('catalog__title')">
      <div :class="$style.headerRow">
        <h2>{{ displayTitle }}</h2>
        <base-btn
          v-if="catalogState.target"
          :class="$style.playAllBtn"
          :disabled="!canPlayAll"
          :aria-label="$t('catalog__play_all')"
          @click="handlePlayAll"
        >
          {{ $t('catalog__play_all') }}
        </base-btn>
      </div>
      <div v-if="catalogState.targets.length > 1" :class="$style.artists" :aria-label="$t('catalog__select_artist')">
        <span>{{ $t('catalog__select_artist') }}</span>
        <base-btn v-for="target in catalogState.targets" :key="target.id" :aria-pressed="catalogState.target?.id === target.id" @click="catalogActions.select(target)">{{ target.name }}</base-btn>
      </div>
      <p v-if="catalogState.error" :class="$style.status" role="alert">{{ catalogState.error }} <base-btn :disabled="catalogState.loading" @click="retryCatalogAction">{{ $t('retry') }}</base-btn></p>
      <p v-if="catalogState.loading" :class="$style.status" role="status">{{ $t('catalog__loading') }}</p>
      <div v-if="catalogState.show && catalogState.target" :class="$style.songs">
        <material-online-list
          :key="`${catalogState.target?.source}:${catalogState.target?.kind}:${catalogState.target?.id}`"
          :list="catalogState.list" :page="1" :limit="Math.max(1, catalogState.list.length)" :total="catalogState.list.length"
          :no-item="!catalogState.loading && !catalogState.error && !catalogState.list.length ? $t('catalog__empty') : ''"
          check-api-source play-list-mode @play-list="playCatalogSong"
        />
      </div>
      <footer v-if="catalogState.target" :class="$style.footer">
        <span>{{ $t('catalog__loaded_count', { count: catalogState.list.length }) }}<span v-if="catalogState.total !== null"> · {{ $t('catalog__total_count', { count: catalogState.total }) }}</span></span>
        <base-btn v-if="catalogState.hasMore" :disabled="catalogState.loading" @click="catalogActions.loadMore">{{ $t('catalog__load_more') }}</base-btn>
        <span v-else-if="!catalogState.loading && !catalogState.error">{{ $t(catalogState.total === null ? 'catalog__no_more' : catalogState.list.length < (catalogState.total ?? 0) ? 'catalog__partial_end' : 'catalog__end') }}</span>
      </footer>
    </section>
  </material-modal>
</template>

<script setup lang="ts">
import { computed } from '@common/utils/vueTools'
import { useI18n } from '@renderer/plugins/i18n'
import { sourceNames } from '@renderer/store'
import { catalogState, catalogActions, playCatalogAt, playCatalogAll, retryCatalogAction } from '@renderer/core/catalog'
import { assertPlaybackSupport } from '@renderer/core/music/sourceCapabilities'

const t = useI18n()

const displayTitle = computed(() => {
  const target = catalogState.target
  if (!target) return catalogState.title
  const sourceLabel = sourceNames.value[target.source] || target.source
  return `${t(target.kind === 'artist' ? 'catalog__artist_title' : 'catalog__album_title', { name: target.name })} · ${sourceLabel}`
})

const canPlayAll = computed(() => {
  const first = catalogState.list[0]
  return Boolean(catalogState.target && first && assertPlaybackSupport(first.source))
})

const playCatalogSong = (index: number) => {
  void playCatalogAt(index)
}

const handlePlayAll = () => {
  void playCatalogAll()
}
</script>

<style module>
.catalog {
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 18px 22px;
  gap: 12px;
  color: var(--color-font);
}
.headerRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-right: 28px;
}
.catalog h2 {
  font-size: 17px;
  font-weight: 600;
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.playAllBtn {
  flex: none;
  font-size: 12.5px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: var(--ui-radius-pill, 999px);
}
.artists, .footer {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.artists span {
  font-size: 12.5px;
  color: var(--color-font-label);
}
.songs {
  flex: 1;
  min-height: 0;
  border-radius: var(--ui-radius-md);
  border: 1px solid var(--ui-border-subtle);
  overflow: hidden;
}
.status {
  font-size: 13px;
  color: var(--color-font-label);
  line-height: 1.5;
  margin: 0;
}
.footer {
  justify-content: space-between;
  font-size: 12.5px;
  color: var(--color-font-label);
  font-variant-numeric: tabular-nums;
  padding-top: 4px;
}
</style>
