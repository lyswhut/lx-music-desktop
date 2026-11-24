<template>
  <div :class="$style.explore">
    <!-- 无会话：空态 / 开始入口 -->
    <div v-if="!sessionView.active" :class="$style.empty">
      <div :class="$style.emptyCard">
        <div :class="$style.emptyIcon">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <use xlink:href="#icon-explore" />
          </svg>
        </div>
        <p v-if="lastErrorText" :class="$style.error">{{ lastErrorText }}</p>
        <p v-if="playInfo.isSelectionQueue" :class="$style.emptySub">{{ t('player__queue_radio_paused') }}</p>
        <p :class="$style.emptyTitle">{{ hasPlaying ? t('explore__ready_tip') : t('explore__no_playing') }}</p>
        <button type="button" :class="[$style.btn, $style.primaryBtn, { [$style.disabled]: !hasPlaying }]" :disabled="!hasPlaying" @click="handleStart">
          {{ t('explore__start') }}
        </button>
      </div>
    </div>

    <template v-else>
      <!-- 锚点 Hero 卡片 -->
      <section :class="$style.card">
        <div :class="$style.cardHeader">
          <div :class="$style.anchor">
            <img v-if="sessionView.anchor.pic && !anchorPicError" :src="sessionView.anchor.pic" :class="$style.anchorPic" decoding="async" alt="" @error="anchorPicError = true">
            <div v-else :class="$style.emptyPic"><span>L</span><span>X</span></div>
            <!-- 严格保留 DOM 契约（e2e/radio.js:50）：child[0]=你在这里, child[1]=锚点标题 -->
            <div :class="$style.anchorMeta">
              <div :class="$style.youAreHere">{{ t('explore__you_are_here') }}</div>
              <div :class="$style.anchorTitle">{{ sessionView.anchor.title }}</div>
              <div :class="$style.anchorArtist">
                <CatalogLink v-if="anchorCatalogMusic" kind="artist" :music="anchorCatalogMusic" />
                <span v-else>{{ sessionView.anchor.artist }}</span>
              </div>
            </div>
          </div>
          <div :class="$style.cardActions">
            <span :class="$style.remaining">{{ t('explore__remaining', { count: sessionView.remaining }) }}</span>
            <button type="button" :class="[$style.btn, $style.ghostBtn]" :disabled="isRefilling" @click="handleRefresh">
              {{ lastErrorText || refillState === 'retrying' ? t('explore__retry') : t('explore__refresh') }}
            </button>
            <button type="button" :class="[$style.btn, $style.endBtn]" @click="handleEnd">{{ t('explore__end') }}</button>
          </div>
        </div>

        <!-- 距离滑杆 + 一句话约束（仅旧引擎：平台推荐无听感距离/自由文本听感指令语义） -->
        <div v-if="!isPlatformEngine" :class="$style.controls">
          <div :class="$style.row">
            <span :class="$style.label">{{ t('explore__distance') }}</span>
            <div :class="$style.radiusSlider">
              <base-slider-bar :class="$style.sliderBar" :value="sessionView.radius" :min="10" :max="90" :step="5" @change="handleRadiusChange" />
            </div>
            <span :class="$style.distanceWords">{{ distanceWords }}</span>
          </div>
          <div :class="$style.row">
            <span :class="$style.label">{{ t('explore__instruction') }}</span>
            <base-input :class="$style.input" :model-value="instructionDraft" :placeholder="t('explore__instruction_tip')" @update:model-value="instructionDraft = $event" @submit="handleInstructionSend" />
            <button type="button" :class="[$style.btn, $style.primaryBtn, $style.sendBtn]" @click="handleInstructionSend">{{ t('explore__instruction_send') }}</button>
          </div>
        </div>

        <!-- 引擎/续补状态 + 提供方状态胶囊 -->
        <div :class="$style.statusBar">
          <div :class="$style.status">
            <span v-if="refillState === 'refilling'" :class="$style.statusPulse">{{ t('explore__refilling') }}</span>
            <span v-else-if="refillState === 'retrying'" :class="$style.statusWarn">{{ t('explore__retrying') }}</span>
            <span v-else-if="lastErrorText" :class="$style.statusError">
              {{ lastErrorKind === 'refill' ? t('explore__refill_failed') : t('explore__plan_failed') }}：{{ truncateText(lastErrorText, 160) }}
            </span>
            <span v-else-if="isPlatformEngine && platformStateText">{{ platformStateText }}</span>
            <span v-else-if="lastResultEngine">{{ engineLabel }}</span>
          </div>
          <div v-if="isPlatformEngine && platformProviderPills.length" :class="$style.providerPills">
            <span v-for="pill in platformProviderPills" :key="pill.provider" :class="[$style.providerPill, $style[`pill_${pill.tone}`]]" :title="pill.title">
              <span :class="$style.pillDot" />
              <span>{{ pill.label }}</span>
              <span :class="$style.pillState">{{ pill.statusLabel }}</span>
            </span>
          </div>
        </div>

        <!-- 本地计划 AI 排序失败原因 -->
        <div v-if="lastResultEngine === 'local' && lastAiRankError" :class="$style.noticeWarn">
          {{ t('explore__ai_rank_failed') }}{{ truncateText(lastAiRankError, 200) }}
        </div>

        <!-- 平台推荐：部分来源失败的非阻断提示 -->
        <div v-if="isPlatformEngine && platformSourceError" :class="$style.noticeWarn">
          {{ t('explore__partial_source_failed') }}{{ truncateText(platformSourceError, 140) }}
        </div>

        <!-- YouTube Music 地区受限非阻断提示条 -->
        <div v-if="isPlatformEngine && isYtmRegionBlocked" :class="$style.noticeInfo">
          <span>{{ t('explore__ytm_region_blocked_tip') }}</span>
          <button type="button" :class="$style.linkBtn" @click="openRecommendSettings">{{ t('explore__open_settings') }}</button>
        </div>

        <!-- 反馈：平台推荐为「喜欢这首 / 不再推荐这首」（保留唯一无障碍按钮名兼容 E2E） -->
        <div :class="$style.feedback">
          <template v-if="isPlatformEngine">
            <button
              type="button"
              :class="[$style.btn, $style.feedbackBtn, { [$style.feedbackActive]: isCurrentLiked }]"
              :aria-label="t('explore__feedback_like')"
              :aria-pressed="isCurrentLiked"
              @click="handleFeedback('good')"
            >
              <span>{{ t('explore__feedback_like') }}</span>
            </button>
            <button
              type="button"
              :class="[$style.btn, $style.feedbackBtn, { [$style.feedbackDisliked]: isCurrentDisliked }]"
              :aria-label="t('explore__feedback_dislike')"
              :aria-pressed="isCurrentDisliked"
              @click="handleFeedback('dislike')"
            >
              <span>{{ t('explore__feedback_dislike') }}</span>
            </button>
            <span v-if="isCurrentLiked" :class="$style.feedbackHintOk">{{ t('explore__feedback_liked_done') }}</span>
            <span v-else-if="isCurrentDisliked" :class="$style.feedbackHintWarn">{{ t('explore__feedback_disliked_done') }}</span>
          </template>
          <template v-else>
            <button type="button" :class="[$style.btn, $style.feedbackBtn]" @click="handleFeedback('good')">{{ t('explore__feedback_good') }}</button>
            <button type="button" :class="[$style.btn, $style.feedbackBtn]" @click="handleFeedback('far')">{{ t('explore__feedback_far') }}</button>
          </template>
        </div>
      </section>

      <!-- 路径列表（按计划批次分组展示，严格保持 pathItem DOM 契约兼容 e2e/pathProbe.js） -->
      <section :class="$style.pathWrap">
        <div :class="$style.pathHeader">
          <div :class="$style.pathTitle">{{ t('explore__path') }}</div>
        </div>

        <div v-if="!sessionView.path.length" :class="$style.pathEmptyBox">
          <div :class="$style.pathEmpty">{{ emptyPathMessage }}</div>
          <button v-if="!isRefilling" type="button" :class="[$style.btn, $style.ghostBtn]" @click="handleRefresh">
            {{ lastErrorText || refillState === 'retrying' ? t('explore__retry') : t('explore__refresh') }}
          </button>
        </div>

        <div v-for="batch in pathBatches" :key="batch.key" :class="$style.pathBatch">
          <div :class="$style.batchHeader">{{ batch.header }}</div>
          <div
            v-for="item in batch.items"
            :key="item.key"
            data-explore-path-item
            :class="[$style.pathItem, { [$style.current]: item.isCurrent, [$style.played]: item.state === 'played', [$style.dislikedRow]: item.isDisliked, [$style.clickable]: item.id != null }]"
            @click="handlePathClick(item)"
            @contextmenu.prevent="handleContextMenu($event, item)"
          >
            <!-- child[0]: 序号 / 封面缩略图 -->
            <div :class="$style.pathIndex">
              <img v-if="item.picUrl && !failedPics.has(item.key)" :src="item.picUrl" :class="$style.rowCover" decoding="async" loading="lazy" alt="" @error="markPicFailed(item.key)">
              <span v-else :class="$style.indexNum">{{ item.no }}</span>
            </div>
            <!-- child[1]: 主信息（child[0]=.pathName > child[0]=span.title 契约） -->
            <div :class="$style.pathMain">
              <div :class="$style.pathName">
                <span :class="$style.title">{{ item.title }}</span>
                <span v-if="item.artist" :class="$style.artist">
                  <span :class="$style.sep"> · </span>
                  <CatalogLink v-if="item.musicInfo" kind="artist" :music="item.musicInfo" />
                  <span v-else>{{ item.artist }}</span>
                </span>
                <span v-if="item.album && item.musicInfo" :class="$style.album">
                  <span :class="$style.sep"> · </span>
                  <CatalogLink kind="album" :music="item.musicInfo" />
                </span>
                <span v-if="item.isDisliked" :class="$style.dislikedChip">{{ t('explore__disliked_badge') }}</span>
              </div>
              <div :class="$style.reasonRow">
                <span :class="$style.reason" data-explore-reason :data-explore-source-count="item.sourceBadges.length">{{ item.reason }}</span>
                <span v-if="isPlatformEngine && item.sourceBadges.length" :class="$style.sourceBadges">
                  <span v-for="badge in item.sourceBadges" :key="badge.provider" :data-explore-provider="badge.provider" :class="[$style.sourceBadge, $style[`src_${badge.provider}`]]">{{ badge.label }}</span>
                </span>
              </div>
            </div>
            <!-- 弧线角色徽章仅旧引擎（直系 span 子节点，严格兼容 e2e/pathProbe.js:46） -->
            <span v-if="!isPlatformEngine" :class="[$style.role, $style[`role_${item.journeyRole}`]]">{{ roleLabel(item.journeyRole) }}</span>
            <!-- 右侧时长与悬浮/键盘可聚焦快捷操作 -->
            <div :class="$style.pathTrailing" @click.stop>
              <span v-if="item.interval" :class="$style.duration">{{ item.interval }}</span>
              <div :class="$style.rowActions">
                <button
                  v-if="item.id != null"
                  type="button"
                  :class="$style.iconBtn"
                  :aria-label="item.isCurrent && isPlay ? t('explore__action_pause') : t('explore__action_play')"
                  :title="item.isCurrent && isPlay ? t('explore__action_pause') : t('explore__action_play')"
                  @click.stop="handlePathClick(item)"
                >
                  <svg v-if="item.isCurrent && isPlay" viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                    <polygon points="6,4 20,12 6,20" />
                  </svg>
                </button>
                <button
                  v-if="item.musicInfo"
                  type="button"
                  :class="[$style.iconBtn, { [$style.loved]: item.isLoved }]"
                  :aria-label="item.isLoved ? t('explore__action_unlove') : t('explore__action_love')"
                  :title="item.isLoved ? t('explore__action_unlove') : t('explore__action_love')"
                  @click.stop="handleToggleLove(item)"
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" :fill="item.isLoved ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
                <button
                  v-if="item.musicInfo"
                  type="button"
                  :class="$style.iconBtn"
                  :aria-label="t('explore__action_add_to')"
                  :title="t('explore__action_add_to')"
                  @click.stop="handleOpenAddModal(item)"
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <button
                  v-if="item.id != null"
                  type="button"
                  :class="$style.iconBtn"
                  :aria-label="t('explore__action_dislike_track')"
                  :title="t('explore__action_dislike_track')"
                  @click.stop="handleDislikeRow(item.id)"
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>

    <common-list-add-modal v-model:show="isShowAddModal" :music-info="selectedAddMusic" teleport="#view" />
    <base-menu v-model="isShowMenu" :menus="contextMenus" :xy="menuLocation" item-name="name" @menu-click="handleMenuClick" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from '@common/utils/vueTools'
import { useRouter } from '@common/utils/vueRouter'
import { normalizeRecommendEngine } from '@common/recommendationConfig'
import { debounce } from '@common/utils'
import { clipboardWriteText } from '@common/utils/electron'
import { useI18n } from '@renderer/plugins/i18n'
import { isPlay, playMusicInfo, playInfo } from '@renderer/store/player/state'
import { appSetting, updateSetting } from '@renderer/store/setting'
import { togglePlay } from '@renderer/core/player'
import { openMusicCatalog } from '@renderer/core/catalog'
import { addListMusics, getListMusics, removeListMusics } from '@renderer/store/list/action'
import { loveList } from '@renderer/store/list/state'
import CatalogLink from '@renderer/components/common/CatalogLink.vue'
import {
  applyFeedback,
  dislikePathItem,
  lastAiRankError,
  lastErrorKind,
  lastErrorText,
  lastPlatformProviders,
  lastPlatformSourceError,
  lastPlatformState,
  lastResultEngine,
  playPathItem,
  refillNow,
  refillState,
  sessionView,
  startSession,
  setInstruction,
  setRadius,
} from '@renderer/core/recommend/session'
import { groupPathByBatch, samePathEntry } from '@renderer/core/recommend/session-core'
import type { FeedbackKind, PathBatch, SessionPathItem } from '@renderer/core/recommend/session-core'
import { sameSongSimplified } from '@renderer/core/recommend/seedMatch'
import { musicInfosOf, songRefs, type SongIdentity } from '@renderer/core/recommend/songIdentity'
import type { SimilarProviderId } from '@renderer/core/recommend/similarFusion'

const t = useI18n()
const router = useRouter()

/** 当前引擎模式：平台相似推荐为默认（旧 ai/local 值兼容加载）。 */
const isPlatformEngine = computed(() => normalizeRecommendEngine(appSetting['recommend.engine']) === 'platform')
const isRefilling = computed(() => refillState.value === 'refilling')
const isBusy = computed(() => refillState.value === 'refilling' || refillState.value === 'retrying')

const anchorPicError = ref(false)
const failedPics = reactive(new Set<string>())
const markPicFailed = (key: string) => { failedPics.add(key) }

// 一句话约束草稿：受控本地值，点击“发送”/按 Enter 才提交
const instructionDraft = ref('')

// 多源监听：仅在会话开关、锚点 id 或封面 URL 真正变化时复位图片错误状态，避免队列计数波动重触发坏图加载；同时清理旧会话失败封面表防止无限增长
watch(
  [() => sessionView.value.active, () => sessionView.value.anchor.id, () => sessionView.value.anchor.pic],
  () => {
    anchorPicError.value = false
    failedPics.clear()
  },
  { immediate: true },
)

watch(() => sessionView.value.active, (active) => {
  if (!active) return
  instructionDraft.value = sessionView.value.instruction
}, { immediate: true })

watch(() => sessionView.value.instruction, (instruction) => {
  if (sessionView.value.active) instructionDraft.value = instruction
})

// 红心列表 ID 集合（同步维护单曲红心按钮状态）
const lovedIds = ref<Set<string>>(new Set())
const syncLovedIds = async() => {
  try {
    const musics = await getListMusics(loveList.id)
    lovedIds.value = new Set(musics.map(m => String(m.id)))
  } catch {
    lovedIds.value = new Set()
  }
}
const handleListChanged = (listIds: string[]) => {
  if (Array.isArray(listIds) && listIds.includes(loveList.id)) void syncLovedIds()
}
onMounted(() => {
  void syncLovedIds()
  window.app_event.on('myListUpdate', handleListChanged)
})
onBeforeUnmount(() => {
  window.app_event.off('myListUpdate', handleListChanged)
})

const hasPlaying = computed(() => Boolean(playMusicInfo.musicInfo?.id))

const sameIdentitySimplified = (a: SongIdentity, b: SongIdentity): boolean => {
  const right = songRefs(b)
  return songRefs(a).some(left => right.some(ref => sameSongSimplified(left, ref)))
}

const currentPlayingTrack = computed(() => {
  const play = playMusicInfo.musicInfo
  if (!play) return null
  const info = 'progress' in play ? play.metadata.musicInfo : play
  if (!info?.id) return null
  const baseTrack = {
    id: info.id,
    artist: info.singer,
    title: info.name,
    musicInfo: info,
    alternativeMusicInfos: playMusicInfo.alternativeMusicInfos,
  }
  const matchedPath = sessionView.value.path.find(item => samePathEntry(item, baseTrack))
  const matchedAnchor = sessionView.value.active && samePathEntry(sessionView.value.anchor, baseTrack)
    ? sessionView.value.anchor
    : null
  const extraInfos = [
    ...(matchedPath ? musicInfosOf(matchedPath) : []),
    ...(matchedAnchor ? musicInfosOf(matchedAnchor) : []),
  ]
  return extraInfos.length
    ? { ...baseTrack, alternativeMusicInfos: [...extraInfos, ...(baseTrack.alternativeMusicInfos ?? [])] }
    : baseTrack
})

const anchorCatalogMusic = computed(() => {
  const raw = sessionView.value.anchor.musicInfo
  if (!raw) return null
  const info = 'progress' in raw ? raw.metadata.musicInfo : raw
  if (!info || info.source === 'local') return null
  return info
})

const isCurrentLiked = computed(() => {
  const track = currentPlayingTrack.value
  if (!track) return false
  return (sessionView.value.likedTracks ?? []).some(item => sameIdentitySimplified(item, track))
})

const isCurrentDisliked = computed(() => {
  const track = currentPlayingTrack.value
  if (!track) return false
  return sessionView.value.dislikedTracks.some(item => sameIdentitySimplified(item, track))
})

const providerDisplayName = (provider: SimilarProviderId | string): string => {
  switch (provider) {
    case 'wy': return t('explore__provider_wy')
    case 'tx': return t('explore__provider_tx')
    case 'ytm': return t('explore__provider_ytm')
    default: return String(provider)
  }
}

const providerStatusDisplay = (status: string): { label: string, tone: 'ok' | 'muted' | 'warn' | 'err' } => {
  switch (status) {
    case 'success': return { label: t('explore__provider_status_ok'), tone: 'ok' }
    case 'empty': return { label: t('explore__provider_status_empty'), tone: 'muted' }
    case 'no-match': return { label: t('explore__provider_status_no_match'), tone: 'muted' }
    case 'region-blocked': return { label: t('explore__provider_status_region_blocked'), tone: 'warn' }
    case 'no-playable-source': return { label: t('explore__provider_status_no_playable_source'), tone: 'warn' }
    default: return { label: t('explore__provider_status_error'), tone: 'err' }
  }
}

interface ProviderPill {
  provider: string
  label: string
  statusLabel: string
  tone: 'ok' | 'muted' | 'warn' | 'err'
  title: string
}

const platformProviderPills = computed<ProviderPill[]>(() => {
  return lastPlatformProviders.value.map(p => {
    const status = providerStatusDisplay(p.status)
    return {
      provider: p.provider,
      label: providerDisplayName(p.provider),
      statusLabel: status.label,
      tone: status.tone,
      title: p.error ? `${providerDisplayName(p.provider)}: ${p.error}` : `${providerDisplayName(p.provider)} · ${status.label}`,
    }
  })
})

const isYtmRegionBlocked = computed(() => {
  return lastPlatformProviders.value.some(p => p.provider === 'ytm' && p.status === 'region-blocked')
})

interface SourceBadgeItem {
  provider: SimilarProviderId
  label: string
}

// 顶层 type 仅引用 imported 类型（兼容 compileScript inlineTemplate）
type PathViewItem = SessionPathItem & {
  isCurrent: boolean
  no: number
  key: string
  isLoved: boolean
  isDisliked: boolean
  sourceBadges: SourceBadgeItem[]
}

const pathItems = computed<PathViewItem[]>(() => {
  const loved = lovedIds.value
  const disliked = sessionView.value.dislikedTracks
  return sessionView.value.path.map((item, i) => {
    const refs = songRefs(item)
    const isLoved = refs.some(r => r.id != null && loved.has(r.id))
    const isDisliked = disliked.some(d => sameIdentitySimplified(d, item))
    const sourceBadges: SourceBadgeItem[] = (item.recommendSources ?? []).map(s => ({
      provider: s.provider,
      label: providerDisplayName(s.provider),
    }))
    return {
      ...item,
      no: i + 1,
      key: item.id ?? `path-${i}`,
      isLoved,
      isDisliked,
      sourceBadges,
    }
  })
})

/** 组头文案：平台推荐批次无距离/约束语义，用独立模板；旧引擎保留三元组模板。 */
const buildBatchHeader = (batch: PathBatch | null | undefined, index: number): string => {
  const engine = batch ? t(batch.engine === 'ai' ? 'explore__engine_ai' : batch.engine === 'platform' ? 'explore__engine_platform' : 'explore__engine_local') : ''
  if (batch?.engine === 'platform') {
    return t('explore__path_batch_header_platform', { index, engine: engine || '—' })
  }
  return t('explore__path_batch_header', {
    index,
    radius: batch ? batch.radius : '—',
    instruction: batch && String(batch.instruction ?? '').trim() ? batch.instruction : t('explore__path_batch_none'),
    engine: engine || '—',
  })
}

const pathBatches = computed(() => {
  return groupPathByBatch(pathItems.value).map((group, gi) => ({
    key: group.key,
    header: buildBatchHeader(group.batch, gi + 1),
    items: group.items,
  }))
})

const distanceWords = computed(() => {
  const radius = sessionView.value.radius
  if (radius <= 20) return t('explore__distance_near')
  if (radius <= 42) return t('explore__distance_medium')
  if (radius <= 65) return t('explore__distance_far')
  return t('explore__distance_farthest')
})

const engineLabel = computed(() => {
  const engine = lastResultEngine.value
  if (engine === 'platform') return t('explore__engine_platform')
  if (engine === 'ai') return t('explore__engine_ai')
  return t('explore__engine_local')
})

const platformStateText = computed(() => {
  switch (lastPlatformState.value) {
    case 'exhausted': return t('explore__state_exhausted')
    case 'no-match': return t('explore__state_no_match')
    case 'empty': return t('explore__state_empty')
    case 'empty-after-filter': return t('explore__state_empty_after_filter')
    case 'no-playable-source': return t('explore__state_no_playable_source')
    default: return ''
  }
})

const platformSourceError = computed(() => lastPlatformSourceError.value)

const emptyPathMessage = computed(() => {
  if (isBusy.value) return t('explore__path_empty')
  if (lastErrorText.value) return `${lastErrorKind.value === 'refill' ? t('explore__refill_failed') : t('explore__plan_failed')}：${truncateText(lastErrorText.value, 160)}`
  if (isPlatformEngine.value && platformStateText.value) return platformStateText.value
  return t('explore__path_empty_idle')
})

const roleLabel = (role: string): string => {
  switch (role) {
    case 'hold': return t('explore__role_hold')
    case 'deepen': return t('explore__role_deepen')
    case 'turn': return t('explore__role_turn')
    case 'land': return t('explore__role_land')
    default: return t('explore__role_open')
  }
}

// 修复死锁：当电台开关持久化为 true 但当前无活跃会话时，直接调用 startSession() 立即开台
const handleStart = () => {
  if (!hasPlaying.value) return
  if (appSetting['recommend.radio']) {
    void startSession().catch(console.warn)
    return
  }
  updateSetting({ 'recommend.radio': true })
}

const handleEnd = () => {
  updateSetting({ 'recommend.radio': false })
}

const handleRefresh = () => {
  refillNow()
}

const openRecommendSettings = () => {
  void router.push({ path: '/setting', query: { name: 'SettingAi' } })
}

const handlePathClick = (item: PathViewItem) => {
  if (item.isCurrent) {
    togglePlay()
    return
  }
  playPathItem(item.id)
}

const handleToggleLove = async(item: PathViewItem) => {
  const info = item.musicInfo
  if (!info) return
  if (item.isLoved) {
    const matchedIds = songRefs(item)
      .map(ref => ref.id)
      .filter((id): id is string => id != null && lovedIds.value.has(id))
    const idsToRemove = matchedIds.length ? [...new Set(matchedIds)] : [info.id]
    await removeListMusics({ listId: loveList.id, ids: idsToRemove })
  } else {
    await addListMusics(loveList.id, [info])
  }
  await syncLovedIds()
}

const isShowAddModal = ref(false)
const selectedAddMusic = ref<LX.Music.MusicInfo | null>(null)
const handleOpenAddModal = (item: PathViewItem) => {
  if (!item.musicInfo) return
  selectedAddMusic.value = item.musicInfo
  isShowAddModal.value = true
}

const handleDislikeRow = (id: string | null) => {
  dislikePathItem(id)
}

// 右键菜单
interface ExploreMenuItem {
  name: string
  action: 'play' | 'love' | 'addTo' | 'artist' | 'album' | 'copy' | 'dislike'
  disabled?: boolean
}
const isShowMenu = ref(false)
const menuLocation = reactive({ x: 0, y: 0 })
const menuTarget = ref<PathViewItem | null>(null)

const contextMenus = computed<ExploreMenuItem[]>(() => {
  const item = menuTarget.value
  if (!item) return []
  const hasInfo = Boolean(item.musicInfo)
  return [
    { name: item.isCurrent && isPlay.value ? t('explore__action_pause') : t('explore__action_play'), action: 'play', disabled: item.id == null },
    { name: item.isLoved ? t('explore__action_unlove') : t('explore__action_love'), action: 'love', disabled: !hasInfo },
    { name: t('explore__action_add_to'), action: 'addTo', disabled: !hasInfo },
    { name: t('explore__action_open_artist'), action: 'artist', disabled: !hasInfo },
    { name: t('explore__action_open_album'), action: 'album', disabled: !hasInfo || !item.album },
    { name: t('explore__action_copy'), action: 'copy' },
    { name: t('explore__action_dislike_track'), action: 'dislike', disabled: item.id == null },
  ]
})

const handleContextMenu = (event: MouseEvent, item: PathViewItem) => {
  menuTarget.value = item
  menuLocation.x = event.pageX
  menuLocation.y = event.pageY
  isShowMenu.value = true
}

const handleMenuClick = (action: ExploreMenuItem | null) => {
  isShowMenu.value = false
  const item = menuTarget.value
  if (!action || !item) return
  switch (action.action) {
    case 'play':
      handlePathClick(item)
      break
    case 'love':
      void handleToggleLove(item)
      break
    case 'addTo':
      handleOpenAddModal(item)
      break
    case 'artist':
      if (item.musicInfo) openMusicCatalog('artist', item.musicInfo)
      break
    case 'album':
      if (item.musicInfo) openMusicCatalog('album', item.musicInfo)
      break
    case 'copy':
      clipboardWriteText(item.artist ? `${item.title} - ${item.artist}` : item.title)
      break
    case 'dislike':
      handleDislikeRow(item.id)
      break
  }
}

const truncateText = (text: string, max: number): string => {
  const s = String(text ?? '')
  return s.length > max ? `${s.slice(0, max)}…` : s
}

const handleFeedback = (kind: FeedbackKind) => {
  applyFeedback(kind)
}

const handleRadiusChange = debounce((value: number) => {
  setRadius(Number(value))
}, 300)

const handleInstructionSend = () => {
  setInstruction(instructionDraft.value)
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.explore {
  overflow-y: auto;
  height: 100%;
  padding: 20px 24px 28px;
  box-sizing: border-box;
  color: var(--color-font);
}

.empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emptyCard {
  max-width: 420px;
  width: 100%;
  padding: 36px 28px;
  border-radius: var(--ui-radius-lg, 14px);
  background: var(--ui-surface-card, var(--color-primary-light-200-alpha-400));
  border: 1px solid var(--ui-border-subtle);
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  text-align: center;
  gap: 14px;
}

.emptyIcon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ui-surface-active);
  color: var(--color-primary);
  svg {
    width: 26px;
    height: 26px;
  }
}

.emptyTitle {
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-font);
}

.emptySub {
  font-size: 12px;
  color: var(--color-font-label);
}

.error {
  font-size: 12px;
  color: var(--color-badge-secondary);
  max-width: 100%;
}

.btn {
  border: 1px solid var(--ui-border-subtle);
  border-radius: var(--ui-radius-pill, 999px);
  background-color: var(--ui-surface-elevated, var(--color-primary-background));
  color: var(--color-font);
  font-size: 12.5px;
  font-weight: 500;
  padding: 7px 15px;
  cursor: pointer;
  transition: background-color @transition-fast, color @transition-fast, border-color @transition-fast, opacity @transition-fast, transform 0.12s ease;
  &:hover {
    background-color: var(--color-primary-background-hover);
    border-color: var(--ui-primary-border-soft);
  }
  &:active {
    transform: scale(0.98);
    background-color: var(--color-primary-background-active);
  }
  &.disabled, &[disabled] {
    opacity: .4;
    cursor: default;
    transform: none;
  }
}

.primaryBtn {
  border-color: var(--ui-border-subtle);
  background-color: var(--color-primary);
  color: var(--ui-on-primary, #fff);
  &:hover {
    background-color: var(--ui-primary-hover-bg, var(--color-primary-dark-100));
    border-color: var(--ui-border-strong);
  }
}

.ghostBtn {
  background-color: transparent;
}

.endBtn {
  background-color: transparent;
  color: var(--color-font-label);
  &:hover {
    color: var(--color-badge-secondary);
    border-color: var(--color-badge-secondary);
    border-color: color-mix(in srgb, var(--color-badge-secondary) 35%, transparent);
    background-color: var(--ui-badge-secondary-bg);
  }
}

.card {
  background: var(--ui-surface-card, var(--color-primary-light-200-alpha-600));
  border: 1px solid var(--ui-border-subtle);
  border-radius: var(--ui-radius-lg, 14px);
  padding: 18px 20px;
  margin-bottom: 18px;
  box-shadow: var(--ui-shadow-sm, 0 2px 10px rgba(0, 0, 0, 0.04));
}

.cardHeader {
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.anchor {
  min-width: 0;
  flex: 1 1 260px;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 14px;
}

.anchorPic {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: var(--ui-radius-md, 10px);
  box-shadow: var(--ui-shadow-md, 0 6px 18px rgba(0, 0, 0, 0.14));
  flex: none;
}

.emptyPic {
  width: 72px;
  height: 72px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-primary-light-900-alpha-200);
  border-radius: var(--ui-radius-md, 10px);
  color: var(--color-primary-light-400-alpha-200);
  font-size: 20px;
  font-family: Consolas, 'Courier New', monospace;
}

.anchorMeta {
  min-width: 0;
  display: flex;
  flex-flow: column nowrap;
  gap: 3px;
  .youAreHere {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--color-primary);
  }
  .anchorTitle {
    font-size: 17px;
    font-weight: 600;
    line-height: 1.3;
    .mixin-ellipsis-1();
  }
  .anchorArtist {
    font-size: 12.5px;
    color: var(--color-font-label);
    .mixin-ellipsis-1();
  }
}

.cardActions {
  flex: none;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 8px;
  .remaining {
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    color: var(--color-font-label);
    padding: 4px 10px;
    border-radius: 999px;
    background-color: var(--ui-surface-hover);
  }
}

.controls {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--ui-border-subtle);
  .row {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }
  .label {
    flex: none;
    font-size: 12px;
    color: var(--color-font-label);
    width: 64px;
  }
  .radiusSlider {
    flex: auto;
    max-width: 300px;
    min-width: 120px;
  }
  .sliderBar {
    width: 100%;
  }
  .distanceWords {
    flex: none;
    font-size: 12px;
    color: var(--color-font);
  }
  .input {
    flex: auto;
    max-width: 300px;
  }
  .sendBtn {
    flex: none;
  }
}

.statusBar {
  margin-top: 12px;
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 12px;
}

.status {
  font-size: 12px;
  color: var(--color-font-label);
  min-height: 18px;
  line-height: 1.4;
}

.statusPulse {
  color: var(--color-primary);
  font-weight: 500;
}

.statusWarn {
  color: var(--color-badge-secondary);
}

.statusError {
  color: var(--color-badge-secondary);
}

.providerPills {
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  gap: 6px;
}

.providerPill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  line-height: 1;
  padding: 4px 9px;
  border-radius: 999px;
  background-color: var(--ui-surface-hover);
  color: var(--color-font-label);
}

.pillDot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
  flex: none;
}

.pillState {
  opacity: 0.8;
}

.pill_ok {
  color: var(--color-primary);
  background-color: var(--ui-surface-active);
}

.pill_muted {
  color: var(--color-font-label);
}

.pill_warn {
  color: var(--color-badge-secondary);
  background-color: var(--ui-badge-secondary-bg);
}

.pill_err {
  color: var(--color-badge-secondary);
  background-color: var(--ui-badge-secondary-bg);
}

.noticeWarn, .noticeInfo {
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: var(--ui-radius-sm, 8px);
  font-size: 12px;
  line-height: 1.45;
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.noticeWarn {
  color: var(--color-badge-secondary);
  background-color: var(--ui-badge-secondary-bg);
}

.noticeInfo {
  color: var(--color-font);
  background-color: var(--ui-surface-active);
}

.linkBtn {
  border: none;
  background: transparent;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 6px;
  &:hover {
    background-color: var(--ui-surface-active);
  }
}

.feedback {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--ui-border-subtle);
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  gap: 8px;
}

.feedbackBtn {
  padding: 6px 14px;
}

.feedbackActive {
  color: var(--color-primary);
  border-color: var(--ui-primary-border-soft);
  background-color: var(--ui-surface-active);
}

.feedbackDisliked {
  color: var(--color-badge-secondary);
  border-color: var(--color-badge-secondary);
  border-color: color-mix(in srgb, var(--color-badge-secondary) 45%, transparent);
  background-color: var(--ui-badge-secondary-bg);
}

.feedbackHintOk {
  font-size: 12px;
  color: var(--color-primary);
  margin-left: 4px;
}

.feedbackHintWarn {
  font-size: 12px;
  color: var(--color-badge-secondary);
  margin-left: 4px;
}

.pathWrap {
  .pathHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .pathTitle {
    font-size: 14px;
    font-weight: 600;
  }
}

.pathEmptyBox {
  padding: 28px 20px;
  border-radius: var(--ui-radius-md, 10px);
  background: var(--ui-surface-card, var(--color-primary-light-200-alpha-400));
  border: 1px dashed var(--ui-border-subtle);
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.pathEmpty {
  font-size: 13px;
  color: var(--color-font-label);
}

.pathBatch {
  margin-bottom: 14px;
  .batchHeader {
    font-size: 11.5px;
    font-weight: 500;
    color: var(--color-font-label);
    margin: 12px 0 6px;
    padding-left: 4px;
  }
}

.pathItem {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 12px;
  padding: 9px 12px;
  border-radius: var(--ui-radius-md, 10px);
  margin-bottom: 4px;
  background-color: transparent;
  border: 1px solid transparent;
  transition: background-color @transition-fast, border-color @transition-fast, opacity @transition-fast;
  &.current {
    background-color: var(--ui-surface-active);
    border-color: var(--ui-primary-border-soft);
  }
  &.played {
    opacity: .78;
  }
  &.dislikedRow {
    opacity: .45;
  }
  &.clickable {
    cursor: pointer;
    &:hover {
      background-color: var(--ui-surface-hover, var(--color-primary-light-300-alpha-400));
    }
  }
  &:hover .rowActions,
  &:focus-within .rowActions {
    opacity: 1;
  }
}

.pathIndex {
  flex: none;
  width: 38px;
  height: 38px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--ui-surface-hover);
  overflow: hidden;
}

.rowCover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.indexNum {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--color-font-label);
}

.pathMain {
  flex: auto;
  min-width: 0;
  .pathName {
    display: flex;
    flex-flow: row nowrap;
    align-items: baseline;
    gap: 2px;
    min-width: 0;
    .title {
      font-size: 13.5px;
      font-weight: 500;
      .mixin-ellipsis-1();
      flex: 0 1 auto;
    }
    .artist, .album {
      font-size: 12px;
      color: var(--color-font-label);
      display: inline-flex;
      align-items: baseline;
      min-width: 0;
      max-width: 32%;
      .mixin-ellipsis-1();
    }
    .sep {
      flex: none;
      opacity: 0.55;
      margin: 0 2px;
    }
  }
}

.dislikedChip {
  flex: none;
  margin-left: 6px;
  font-size: 10.5px;
  padding: 1px 6px;
  border-radius: 999px;
  color: var(--color-badge-secondary);
  background-color: var(--ui-badge-secondary-bg);
}

.reasonRow {
  margin-top: 3px;
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  gap: 6px;
}

.reason {
  font-size: 11.5px;
  color: var(--color-font-label);
}

.sourceBadges {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.sourceBadge {
  font-size: 10px;
  line-height: 1;
  padding: 2px 6px;
  border-radius: 999px;
  background-color: var(--ui-surface-hover);
  color: var(--color-font-label);
}

.src_wy {
  color: var(--color-badge-secondary);
  background-color: var(--ui-badge-secondary-bg);
}

.src_tx {
  color: var(--color-badge-tertiary);
  background-color: var(--ui-badge-tertiary-bg);
}

.src_ytm {
  color: var(--color-primary);
  background-color: var(--ui-surface-active);
}

.role {
  flex: none;
  font-size: 11px;
  line-height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  color: var(--color-primary);
  background-color: var(--ui-surface-active);
  &.role_turn {
    color: var(--color-badge-secondary);
    background-color: var(--ui-badge-secondary-bg);
  }
  &.role_land {
    color: var(--color-badge-tertiary);
    background-color: var(--ui-badge-tertiary-bg);
  }
}

.pathTrailing {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
}

.duration {
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  color: var(--color-font-label);
  min-width: 36px;
  text-align: right;
}

.rowActions {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0.35;
  transition: opacity @transition-fast;
}

.iconBtn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-font-label);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color @transition-fast, color @transition-fast;
  &:hover {
    background-color: var(--ui-surface-hover);
    color: var(--color-font);
  }
  &.loved {
    color: var(--color-badge-secondary);
  }
}
</style>
