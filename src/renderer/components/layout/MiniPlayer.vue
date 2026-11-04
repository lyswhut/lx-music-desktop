<template>
  <div :class="$style.mini">
    <div :class="$style.picWrap" @click="handleRestore">
      <img v-if="musicInfo.pic && !imgError" :src="musicInfo.pic" decoding="async" @error="imgError = true">
      <div v-else :class="$style.emptyPic">L<span>X</span></div>
    </div>
    <div :class="$style.info">
      <div :class="$style.line1">
        <span :class="$style.name" :title="musicInfo.name">{{ musicInfo.name || 'LX Music' }}</span>
        <span v-if="musicInfo.singer" :class="$style.singer" :title="musicInfo.singer">{{ musicInfo.singer }}</span>
      </div>
      <div :class="$style.lyric" :title="lyricText">{{ lyricText }}</div>
    </div>
    <div :class="$style.btns">
      <button type="button" :class="$style.btn" :aria-label="$t('player__prev')" ignore-tip @click="playPrev()">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1024 1024" space="preserve">
          <use xlink:href="#icon-prevMusic" />
        </svg>
      </button>
      <button type="button" :class="[$style.btn, $style.playBtn]" :aria-label="isPlay ? $t('player__pause') : $t('player__play')" ignore-tip @click="togglePlay">
        <svg v-if="isPlay" :class="$style.pauseGlyph" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1024 1024" space="preserve">
          <use xlink:href="#icon-pause" />
        </svg>
        <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1024 1024" space="preserve">
          <use xlink:href="#icon-play" />
        </svg>
      </button>
      <button type="button" :class="$style.btn" :aria-label="$t('player__next')" ignore-tip @click="playNext()">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1024 1024" space="preserve">
          <use xlink:href="#icon-nextMusic" />
        </svg>
      </button>
    </div>
    <div :class="$style.progress">
      <div :class="$style.bar" :style="{ width: `${Math.min(playProgress.progress * 100, 100)}%` }" />
    </div>
    <div :class="$style.tools">
      <button
        type="button"
        :class="[$style.toolBtn, { [$style.active]: appSetting['desktopLyric.enable'] }]"
        :aria-label="toggleDesktopLyricBtnTitle"
        ignore-tip
        :title="toggleDesktopLyricBtnTitle"
        @click="toggleDesktopLyric"
        @contextmenu="toggleLockDesktopLyric"
      >
        <svg v-show="appSetting['desktopLyric.enable']" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" space="preserve">
          <use xlink:href="#icon-desktop-lyric-on" />
        </svg>
        <svg v-show="!appSetting['desktopLyric.enable']" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" space="preserve">
          <use xlink:href="#icon-desktop-lyric-off" />
        </svg>
      </button>
      <button
        type="button"
        :class="[$style.toolBtn, { [$style.active]: isLoved }]"
        :aria-label="$t('list__collect')"
        ignore-tip
        :title="isLoved ? $t('list__collected_tip') : $t('list__collect')"
        @click="handleLove"
      >
        <svg :class="$style.loveIcon" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 443.5 391.5" space="preserve">
          <use xlink:href="#icon-love" />
        </svg>
      </button>
      <button type="button" :class="$style.toolBtn" :aria-label="$t('mini_mode_exit')" ignore-tip :title="$t('mini_mode_exit')" @click="handleRestore">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24" space="preserve">
          <use xlink:href="#icon-close" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from '@common/utils/vueTools'
import { musicInfo, isPlay, playMusicInfo } from '@renderer/store/player/state'
import { playProgress } from '@renderer/store/player/playProgress'
import { lyric } from '@renderer/store/player/lyric'
import { togglePlay, playNext, playPrev } from '@renderer/core/player'
import { setMiniMode } from '@renderer/utils/compositions/useMiniMode'
import { appSetting } from '@renderer/store/setting'
import { loveList } from '@renderer/store/list/state'
import { addListMusics, removeListMusics } from '@renderer/store/list/action'
import { getMusicExistListIds } from '@renderer/store/list/listManage'
import useToggleDesktopLyric from '@renderer/utils/compositions/useToggleDesktopLyric'

const imgError = ref(false)

// 第二行优先显示当前正在播放的歌词，没有歌词时显示歌手名
const lyricText = computed(() => lyric.text || musicInfo.singer || '')

const { toggleDesktopLyricBtnTitle, toggleDesktopLyric, toggleLockDesktopLyric } = useToggleDesktopLyric()

// 点击心形切换收藏状态：未收藏则加入「我的收藏」，已收藏则取消收藏
const isLoved = ref(false)
let lovedCheckId = null
const checkLoved = (id) => {
  if (!id) {
    isLoved.value = false
    return
  }
  lovedCheckId = id
  getMusicExistListIds(id).then(ids => {
    if (lovedCheckId !== id) return
    isLoved.value = ids.includes(loveList.id)
  }).catch(() => {})
}
watch(() => musicInfo.id, checkLoved, { immediate: true })

const handleLove = () => {
  const info = playMusicInfo.musicInfo
  if (!info) return
  const target = 'progress' in info ? info.metadata.musicInfo : info
  const nextLoved = !isLoved.value
  isLoved.value = nextLoved
  const task = nextLoved
    ? addListMusics(loveList.id, [target])
    : removeListMusics({ listId: loveList.id, ids: [target.id] })
  task.catch(() => {
    isLoved.value = !nextLoved
  })
}

const handleRestore = () => {
  void setMiniMode(false)
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.mini {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 12px;
  padding: 14px 8px 14px 16px;
  box-sizing: border-box;
  background-color: var(--color-main-background);
  // 大圆角卡片 + 细边框，参照目标截图样式
  border: 1px solid var(--color-primary-light-100-alpha-800);
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  -webkit-app-region: drag;
}

.picWrap {
  flex: none;
  width: 72px;
  height: 72px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  -webkit-app-region: no-drag;
  background-color: var(--color-primary-light-300-alpha-700);
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.emptyPic {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: var(--color-primary);
}

.info {
  flex: auto;
  min-width: 0;
  display: flex;
  flex-flow: column nowrap;
  gap: 6px;
}

.line1 {
  display: flex;
  flex-flow: row nowrap;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.name {
  .mixin-ellipsis-1();
  flex: 0 1 auto;
  font-size: 16px;
  font-weight: bold;
  color: var(--color-font);
}

.singer {
  .mixin-ellipsis-1();
  flex: 0 1 auto;
  font-size: 11px;
  color: var(--color-font-label);
}

.lyric {
  .mixin-ellipsis-1();
  font-size: 14px;
  color: var(--color-primary);
}

.progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 4px;
  border-radius: 0 0 13px 13px;
  overflow: hidden;
  background-color: var(--color-primary-light-400-alpha-300);
}

.bar {
  height: 100%;
  background-color: var(--color-primary);
  transition: width .3s linear;
}

.btns {
  flex: none;
  display: flex;
  align-items: center;
  gap: 4px;
  -webkit-app-region: no-drag;
}

.btn {
  width: 32px;
  height: 32px;
  padding: 7px;
  border: none;
  outline: none;
  background: none;
  border-radius: 50%;
  cursor: pointer;
  color: var(--color-font);
  transition: color @transition-fast, background-color @transition-fast;
  display: flex;
  align-items: center;
  justify-content: center;
  svg {
    width: 100%;
    height: 100%;
    fill: currentColor;
  }
  &:hover {
    color: var(--color-primary);
  }
}

// 与主窗体播放按钮同款：实心圆徽标，图标反白挖空
.playBtn {
  width: 42px;
  height: 42px;
  padding: 0;
  color: #fff;
  background-color: var(--color-primary);
  transition: opacity @transition-fast;

  // 播放三角的画面只占画布 58%，暂停竖条占满，两者要分开给尺寸才能一样粗
  svg {
    width: auto;
    height: 51%;
    filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.2));
  }
  .pauseGlyph {
    height: 40%;
  }
  &:hover {
    color: #fff;
    background-color: var(--color-primary);
    opacity: .8;
  }
  &:active {
    opacity: .6;
  }
}

.tools {
  position: absolute;
  right: 10px;
  top: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0;
  transition: opacity @transition-fast;
  -webkit-app-region: no-drag;
}

.toolBtn {
  height: 26px;
  width: 26px;
  padding: 0;
  border: none;
  outline: none;
  cursor: pointer;
  border-radius: 50%;
  background-color: var(--color-150);
  color: var(--color-font);
  font-size: 10px;
  font-weight: bold;
  line-height: 1;
  transition: background-color @transition-fast, color @transition-fast;
  display: flex;
  align-items: center;
  justify-content: center;
  svg {
    width: 16px;
    height: 16px;
    fill: currentColor;
  }
  // 心形图标画布为宽扁比例（830x740），按原始比例给尺寸才能在圆钮内居中；实心填充视觉偏重，尺寸比其它图标小一档
  .loveIcon {
    width: 14px;
    height: 12px;
  }
  &:hover {
    background-color: var(--color-200);
    color: var(--color-primary);
  }
  &.active {
    background-color: var(--color-primary);
    // 激活态按钮底色是主题绿，图标必须用白色，否则与背景同色会“隐形”成一个纯色圆点
    color: #fff;
  }
}

.mini:hover .tools {
  opacity: 1;
}
</style>
