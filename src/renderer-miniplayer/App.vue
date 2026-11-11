<template>
  <div id="container" :style="lyricColorStyle">
    <div class="player-card">
      <div class="cover">
        <img v-if="playerStatus.picUrl" :src="playerStatus.picUrl" decoding="async">
        <div v-else class="empty-pic">L<span>X</span></div>
      </div>
      <div class="info">
        <div class="title">
          <span class="name">{{ playerStatus.name || 'LX Music' }}</span>
          <span v-if="playerStatus.singer" class="singer">{{ playerStatus.singer }}</span>
        </div>
        <div class="lyric">
          <template v-if="lyricWords.length">
            <span
              v-for="(word, index) in lyricWords"
              :key="index"
              :class="['lrc-word', word.state]"
              :style="word.ratio != null ? { '--p': word.ratio } : undefined"
            >{{ word.text }}</span>
          </template>
          <template v-else>{{ lyricLineText || '···' }}</template>
        </div>
      </div>
      <div class="controls">
        <button class="ctrl-btn" aria-label="prev" @click="sendPlayerAction('prev')">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 1024 1024" space="preserve">
            <use xlink:href="#icon-prevMusic" />
          </svg>
        </button>
        <button class="ctrl-btn play-btn" :aria-label="isPlay ? 'pause' : 'play'" @click="sendPlayerAction(isPlay ? 'pause' : 'play')">
          <svg v-if="isPlay" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 1024 1024" space="preserve">
            <use xlink:href="#icon-pause" />
          </svg>
          <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 1024 1024" space="preserve" class="play-icon">
            <use xlink:href="#icon-play" />
          </svg>
        </button>
        <button class="ctrl-btn" aria-label="next" @click="sendPlayerAction('next')">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 1024 1024" space="preserve">
            <use xlink:href="#icon-nextMusic" />
          </svg>
        </button>
      </div>
      <div class="top-btns">
        <button class="icon-btn lrc-btn" :class="{ active: isDesktopLyricOn }" :aria-label="isDesktopLyricOn ? 'lyric off' : 'lyric on'" @click="toggleDesktopLyric">LRC</button>
        <button class="icon-btn fav-btn" :class="{ collected: playerStatus.collect }" :aria-label="playerStatus.collect ? 'uncollect' : 'collect'" @click="toggleCollect">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 24 24" space="preserve">
            <use xlink:href="#icon-heart" />
          </svg>
        </button>
        <button class="icon-btn" aria-label="close" @click="sendClose">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 24 24" space="preserve">
            <use xlink:href="#icon-close" />
          </svg>
        </button>
      </div>
      <div class="progress">
        <div class="progress-inner" :style="{ width: `${progress * 100}%` }" />
      </div>
    </div>
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" style="display: none;" aria-hidden="true">
      <defs>
        <g id="icon-play" fill="currentColor">
          <!-- 0 0 1024 1024-->
          <path d="M209.962 21.763c-88.986-51.043-161.129-9.228-161.129 93.323v756.778c0 102.653 72.144 144.414 161.129 93.419l661.462-379.344c89.016-51.061 89.016-133.789 0-184.838l-661.462-379.338z" />
        </g>
        <g id="icon-pause" fill="currentColor">
          <!-- 0 0 1024 1024-->
          <path d="M52.504 168.606v686.806c0 93.13 61.701 168.588 137.82 168.588 76.127 0 137.865-75.462 137.865-168.588v-686.806c0-93.085-61.738-168.577-137.865-168.577-76.119-0.030-137.82 75.492-137.82 168.577z" />
          <path d="M833.635 0c-76.112 0-137.813 75.492-137.813 168.577v686.806c0 93.13 61.701 168.558 137.813 168.558s137.861-75.433 137.861-168.558v-686.776c-0.033-93.085-61.749-168.606-137.861-168.606z" />
        </g>
        <g id="icon-prevMusic" fill="currentColor">
          <!-- 0 0 1024 1024-->
          <path d="M96.902 152.172c-53.489 0-96.898 64.037-96.898 143.005v433.651c0 78.944 43.432 143 96.898 143 53.545 0 96.902-64.056 96.902-143v-119.627l352.203 201.97c67.023 38.471 121.477 8.351 123.795-67l-225.149-129.123c-44.415-25.451-69.917-63.036-69.917-103.083 0-40.084 25.502-77.637 69.917-103.134l225.149-129.072c-2.318-75.295-56.772-105.452-123.795-66.986l-352.203 201.919v-119.515c0.023-78.995-43.358-143.005-96.902-143.005z" />
          <path d="M502.256 583.092l397.712 228.079c68.475 39.291 124.032 7.103 124.032-71.883v-454.684c0-78.94-55.557-111.137-124.032-71.832l-397.74 228.019c-68.452 39.301-68.452 103.009 0.028 142.3z" />
        </g>
        <g id="icon-nextMusic" fill="currentColor">
          <!-- 0 0 1024 1024-->
          <path d="M927.098 871.828c53.489 0 96.898-64.037 96.898-143.005v-433.651c0-78.944-43.432-143-96.898-143-53.545 0-96.902 64.056-96.902 143v119.627l-352.203-201.97c-67.023-38.471-121.477-8.351-123.795 67l225.149 129.123c44.415 25.451 69.917 63.036 69.917 103.083 0 40.084-25.502 77.637-69.917 103.134l-225.149 129.072c2.318 75.295 56.772 105.452 123.795 66.986l352.203-201.919v119.515c-0.023 78.995 43.358 143.005 96.902 143.005z" />
          <path d="M521.744 440.908l-397.712-228.079c-68.475-39.291-124.032-7.103-124.032 71.883v454.684c0 78.94 55.557 111.137 124.032 71.832l397.74-228.019c68.452-39.301 68.452-103.009-0.028-142.3z" />
        </g>
        <g id="icon-heart" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <!-- 24 心形：fill/stroke 不在此指定，由按钮 CSS 控制空心/实心 -->
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </g>
        <g id="icon-close" fill="currentColor">
          <!-- 0 0 24 24-->
          <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
        </g>
      </defs>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from '@common/utils/vueTools'
import { playerStatus, mergePlayerStatus, isPlay } from './store/state'
import { getPlayerStatus, onPlayerStatus, onThemeChange, sendPlayerAction, sendClose, getAppSetting, updateAppSetting, onAppSetting } from './utils/ipc'
import { parseLyric, findCurrentLineIndex, findCurrentWordIndex, getWordPlayedRatio } from './utils/lyric'

// 逐字歌词片段渲染状态
interface LyricWordView {
  text: string
  state: 'sung' | 'current' | 'unsung'
  ratio: number | null // 当前正在唱的字内部填充比例
}

// 播放进度（0~1）
const progress = computed(() => {
  return playerStatus.duration > 0 ? Math.min(Math.max(playerStatus.progress / playerStatus.duration, 0), 1) : 0
})

// 是否启用逐字歌词（跟随系统设置 player.isPlayLxlrc）
const isPlayLxlrc = ref(false)

// 解析后的歌词：开启逐字且有逐字数据时用 lxlyric，否则用普通 lrc
const parsedLyric = computed(() => {
  const rawLyric = isPlayLxlrc.value && playerStatus.lxlyric ? playerStatus.lxlyric : playerStatus.lyric
  return rawLyric ? parseLyric(rawLyric) : { isWordMode: false, lines: [] }
})

// 逐行模式下当前行文本
const lyricLineText = computed(() => playerStatus.lyricLineText)

// 逐字模式下当前行的逐字片段（含已唱/正在唱/未唱状态）
const lyricWords = computed<LyricWordView[]>(() => {
  const { isWordMode, lines } = parsedLyric.value
  if (!isWordMode) return []
  const curMs = playerStatus.progress * 1000
  const lineIndex = findCurrentLineIndex(lines, curMs)
  const line = lineIndex > -1 ? lines[lineIndex] : null
  if (!line?.words) return []
  const relMs = curMs - line.time
  const currentIndex = findCurrentWordIndex(line.words, relMs)
  return line.words.map((word, index) => {
    if (index < currentIndex) return { text: word.text, state: 'sung', ratio: null }
    if (index > currentIndex) return { text: word.text, state: 'unsung', ratio: null }
    return { text: word.text, state: 'current', ratio: getWordPlayedRatio(word, relMs) }
  })
})

// 切换当前播放歌曲的收藏状态
const toggleCollect = () => {
  sendPlayerAction(playerStatus.collect ? 'unCollect' : 'collect')
}

// 桌面歌词是否开启
const isDesktopLyricOn = ref(false)
// 切换桌面歌词（与主窗口底部 LRC 按钮功能一致）
const toggleDesktopLyric = () => {
  isDesktopLyricOn.value = !isDesktopLyricOn.value
  void updateAppSetting({ 'desktopLyric.enable': isDesktopLyricOn.value })
}

// 歌词颜色 CSS 变量（跟随桌面歌词设置：未播放 / 已播放 / 阴影）
// 未提供颜色时回退到主题色 / 字体色，保证主题切换后默认观感不丢
const lyricUnplayColor = ref('')
const lyricPlayedColor = ref('')
const lyricShadowColor = ref('')
// 把颜色变量挂到 #container 上，供 CSS 通过 var(--mini-lrc-unplay) 等使用
const lyricColorStyle = computed(() => {
  const style: Record<string, string> = {}
  if (lyricUnplayColor.value) style['--mini-lrc-unplay'] = lyricUnplayColor.value
  if (lyricPlayedColor.value) style['--mini-lrc-played'] = lyricPlayedColor.value
  if (lyricShadowColor.value) style['--mini-lrc-shadow'] = lyricShadowColor.value
  return style
})

// 应用一份增量设置到本地响应式状态
const applySetting = (setting: Partial<LX.AppSetting>) => {
  if (setting['desktopLyric.enable'] != null) isDesktopLyricOn.value = !!setting['desktopLyric.enable']
  if (setting['player.isPlayLxlrc'] != null) isPlayLxlrc.value = !!setting['player.isPlayLxlrc']
  if (setting['desktopLyric.style.lyricUnplayColor'] != null) lyricUnplayColor.value = setting['desktopLyric.style.lyricUnplayColor']
  if (setting['desktopLyric.style.lyricPlayedColor'] != null) lyricPlayedColor.value = setting['desktopLyric.style.lyricPlayedColor']
  if (setting['desktopLyric.style.lyricShadowColor'] != null) lyricShadowColor.value = setting['desktopLyric.style.lyricShadowColor']
}

// 监听主窗口推送的播放状态增量更新
const removePlayerStatusListener = onPlayerStatus(({ params }) => {
  mergePlayerStatus(params)
})
// 监听主题变更
const removeThemeChangeListener = onThemeChange(({ params: setting }) => {
  window.setTheme(setting.theme.colors)
})
// 监听应用设置增量更新（主进程仅转发迷你窗关心的字段）
const removeAppSettingListener = onAppSetting(({ params }) => {
  applySetting(params)
})

onMounted(() => {
  // 初始化时拉取一次完整状态
  void getPlayerStatus().then(mergePlayerStatus)
  // 读取桌面歌词当前开关状态、逐字歌词开关以及歌词颜色配置
  void getAppSetting().then(setting => {
    applySetting(setting)
  })
})

onBeforeUnmount(() => {
  removePlayerStatusListener()
  removeThemeChangeListener()
  removeAppSettingListener()
})
</script>

<style lang="less">
body {
  // 本页未引入全局 reset，需清掉 Chromium 默认的 8px 外边距，
  // 否则卡片整体下移 8px，底部阴影超出窗口边界被裁剪（顶部阴影却正常）
  margin: 0;
  user-select: none;
  height: 100vh;
  box-sizing: border-box;
  overflow: hidden;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
#root {
  height: 100%;
}
#container {
  height: 100%;
  box-sizing: border-box;
  // 底部需留出阴影空间：阴影向下延伸约 5px（1px 偏移 + 4px 模糊），
  // 底部留白取 6px，避免被窗口边缘裁剪（其余三边 4px 即可）
  padding: 4px 4px 6px;
}

.player-card {
  position: relative;
  box-sizing: border-box;
  height: 100%;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 10px;
  padding: 0 14px 0 10px;
  border-radius: 12px;
  overflow: hidden;
  background-color: var(--color-main-background);
  color: var(--color-font);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  -webkit-app-region: drag;

  * {
    box-sizing: border-box;
  }
}

.cover {
  flex: none;
  width: 62px;
  height: 62px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .empty-pic {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-primary-light-900-alpha-200);
    color: var(--color-primary-light-400-alpha-200);
    font-size: 18px;
    font-family: Consolas, 'Courier New', monospace;

    span {
      padding-left: 2px;
    }
  }
}

.info {
  flex: auto;
  min-width: 0;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  gap: 6px;
  line-height: 1.3;
}

.title {
  display: flex;
  flex-flow: row nowrap;
  align-items: baseline;
  gap: 8px;
  min-width: 0;

  .name {
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .singer {
    flex: none;
    max-width: 45%;
    font-size: 11px;
    color: var(--color-font-label);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.lyric {
  font-size: 15px;
  line-height: 1.3;
  // 逐行模式下整行使用「已播放颜色」，无配置时回退主题色
  color: var(--mini-lrc-played, var(--color-primary));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 逐字歌词片段
.lrc-word {
  // 当前字渐变位置的过渡，让填充更平滑（progress 推送有间隔）
  transition: background-size .2s linear;
}
// 已唱：「已播放颜色」
.lrc-word.sung {
  color: var(--mini-lrc-played, var(--color-primary));
}
// 未唱：「未播放颜色」
.lrc-word.unsung {
  color: var(--mini-lrc-unplay, var(--color-font));
}
// 正在唱：文字透明 + 从左到右的双色渐变裁切成文字颜色
// 渐变左段为「已播放颜色」，右段为「未播放颜色」
.lrc-word.current {
  color: transparent;
  background-image: linear-gradient(
    to right,
    var(--mini-lrc-played, var(--color-primary)) 0,
    var(--mini-lrc-played, var(--color-primary)) calc(var(--p) * 100%),
    var(--mini-lrc-unplay, var(--color-font)) calc(var(--p) * 100%),
    var(--mini-lrc-unplay, var(--color-font)) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
}

.controls {
  flex: none;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 12px;
  -webkit-app-region: no-drag;
}

.ctrl-btn {
  flex: none;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  background-color: transparent;
  color: var(--color-button-font);
  cursor: pointer;
  opacity: .8;
  transition: opacity .2s ease;

  svg {
    fill: currentColor;
  }
  &:hover {
    opacity: 1;
  }
  &:active {
    opacity: .6;
  }
}

.play-btn {
  width: 36px;
  height: 36px;
  padding: 9px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: #fff;
  opacity: 1;

  &:hover {
    opacity: .88;
  }

  // 播放图标视觉居中补偿
  .play-icon {
    margin-left: 1px;
  }
}

.top-btns {
  position: absolute;
  top: 5px;
  right: 5px;
  display: flex;
  flex-flow: row nowrap;
  gap: 5px;
  opacity: 0;
  transition: opacity .2s ease;
  -webkit-app-region: no-drag;
}

// 收藏/关闭按钮共用的圆形样式
.icon-btn {
  flex: none;
  width: 20px;
  height: 20px;
  padding: 4px;
  border: none;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.32);
  color: #fff;
  cursor: pointer;
  transition: background-color .2s ease;

  svg {
    display: block;
  }
  &:hover {
    background-color: rgba(0, 0, 0, 0.5);
  }
}

// 歌词按钮：LRC 文字，开启时变主题色
.lrc-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 7px;
  font-weight: bold;
  line-height: 1;
  letter-spacing: -0.3px;

  &.active {
    color: var(--color-primary);
  }
}

// 收藏按钮：默认空心心形，已收藏时变绿色实心
.fav-btn svg {
  fill: none;
  stroke: currentColor;
}
.fav-btn.collected {
  color: var(--color-primary);

  svg {
    fill: currentColor;
    stroke: none;
  }
}

.player-card:hover {
  .top-btns {
    opacity: 1;
  }
}

.progress {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 3px;
  background-color: var(--color-primary-alpha-900);
}

.progress-inner {
  height: 100%;
  background-color: var(--color-primary);
  transition: width .3s linear;
}
</style>
