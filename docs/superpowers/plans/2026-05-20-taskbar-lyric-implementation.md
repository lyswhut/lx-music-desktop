# Taskbar Lyric Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Windows-only pseudo-embedded taskbar lyric bar that works on both Windows 10 and Windows 11 with one shared implementation path.

**Architecture:** Add a dedicated `taskbarLyric` feature slice in the main process plus a new compact renderer target for the lyric bar UI. Reuse existing player status and lyric timing data from the main renderer, but send a smaller display-only state object to the new host window and compute placement from taskbar/display geometry in the main process.

**Tech Stack:** Electron main process, Vue 3 renderer, webpack multi-entry build, TypeScript/JavaScript, existing IPC/event system, manual Windows verification plus `eslint` and a small Node test for layout math.

---

## File Structure

### New files

- `src/main/modules/taskbarLyric/index.ts`
- `src/main/modules/taskbarLyric/main.ts`
- `src/main/modules/taskbarLyric/utils.ts`
- `src/main/modules/taskbarLyric/types.ts`
- `src/renderer-taskbar-lyric/main.ts`
- `src/renderer-taskbar-lyric/App.vue`
- `src/renderer-taskbar-lyric/index.html`
- `src/renderer-taskbar-lyric/store/state.ts`
- `src/renderer-taskbar-lyric/utils/ipc.ts`
- `src/common/types/taskbar_lyric.d.ts`
- `build-config/renderer-taskbar-lyric/webpack.config.base.js`
- `build-config/renderer-taskbar-lyric/webpack.config.dev.js`
- `build-config/renderer-taskbar-lyric/webpack.config.prod.js`
- `build-config/tests/taskbar-lyric-layout.test.mjs`

### Modified files

- `package.json`
- `build-config/runner-dev.js`
- `build-config/pack.js`
- `src/main/modules/index.ts`
- `src/common/ipcNames.ts`
- `src/common/defaultSetting.ts`
- `src/common/constants.ts`
- `src/common/types/app_setting.d.ts`
- `src/renderer/core/lyric.ts`
- `src/renderer/utils/ipc.ts`
- `src/renderer/views/Setting/components/SettingDesktopLyric.vue` or adjacent settings view file if a new dedicated section is preferable
- `src/lang/zh-cn.json`
- `src/lang/zh-tw.json`
- `src/lang/en-us.json`

### Responsibility split

- `taskbarLyric/main.ts`: host window lifecycle and bounds updates
- `taskbarLyric/utils.ts`: pure layout and placement helpers
- `taskbarLyric/index.ts`: event wiring and public module registration
- `renderer-taskbar-lyric/*`: isolated compact UI
- `renderer/core/lyric.ts`: source of display state updates
- settings/types/lang files: persisted configuration and UI controls

---

### Task 1: Add Settings, Types, And IPC Contract

**Files:**
- Create: `src/common/types/taskbar_lyric.d.ts`
- Modify: `src/common/defaultSetting.ts`
- Modify: `src/common/types/app_setting.d.ts`
- Modify: `src/common/ipcNames.ts`
- Modify: `src/common/constants.ts`
- Modify: `src/renderer/utils/ipc.ts`
- Modify: `src/lang/zh-cn.json`
- Modify: `src/lang/zh-tw.json`
- Modify: `src/lang/en-us.json`

- [ ] **Step 1: Write the failing type/test surface by defining the new contract in declarations**

```ts
// src/common/types/taskbar_lyric.d.ts
declare global {
  namespace LX {
    namespace TaskbarLyric {
      interface State {
        enabled: boolean
        isPlaying: boolean
        songId: string | null
        title: string
        artist: string
        lyricLine: string
        albumCoverUrl: string
      }
    }
  }
}

export {}
```

- [ ] **Step 2: Add persisted settings keys and defaults**

```ts
// src/common/defaultSetting.ts
'taskbarLyric.enable': false,
'taskbarLyric.position': 'right',
'taskbarLyric.width': 360,
'taskbarLyric.showCover': true,
'taskbarLyric.showSongInfo': true,
'taskbarLyric.showCurrentLine': true,
'taskbarLyric.followTaskbarAutoHide': true,
```

```ts
// src/common/types/app_setting.d.ts
'taskbarLyric.enable': boolean
'taskbarLyric.position': 'right' | 'center'
'taskbarLyric.width': number
'taskbarLyric.showCover': boolean
'taskbarLyric.showSongInfo': boolean
'taskbarLyric.showCurrentLine': boolean
'taskbarLyric.followTaskbarAutoHide': boolean
```

- [ ] **Step 3: Define IPC/event names for state push and host lifecycle**

```ts
// src/common/ipcNames.ts inside modules.winMain
process_new_taskbar_lyric_client: 'process_new_taskbar_lyric_client',
taskbar_lyric_set_state: 'taskbar_lyric_set_state',
taskbar_lyric_request_refresh: 'taskbar_lyric_request_refresh',
```

```ts
// src/common/constants.ts
export const APP_EVENT_NAMES = {
  winMainName: 'win_main',
  winLyricName: 'win_lyric',
  trayName: 'tray',
  taskbarLyricName: 'taskbar_lyric',
} as const
```

- [ ] **Step 4: Add renderer-side helper wrappers for the new IPC**

```ts
// src/renderer/utils/ipc.ts
export const sendTaskbarLyricState = (state: LX.TaskbarLyric.State) => {
  rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_set_state, state)
}
```

- [ ] **Step 5: Add user-visible strings before wiring the UI**

```json
// src/lang/zh-cn.json
"setting__taskbar_lyric": "任务栏歌词",
"setting__taskbar_lyric_enable": "启用任务栏歌词",
"setting__taskbar_lyric_experimental": "Windows 专属实验性功能，视觉贴附任务栏，不是真实系统扩展",
"setting__taskbar_lyric_show_cover": "显示封面",
"setting__taskbar_lyric_show_song_info": "显示歌曲信息",
"setting__taskbar_lyric_show_current_line": "显示当前歌词",
"setting__taskbar_lyric_follow_autohide": "跟随任务栏自动隐藏",
"setting__taskbar_lyric_position": "任务栏歌词位置"
```

- [ ] **Step 6: Run lint to catch declaration/import mistakes early**

Run: `npm.cmd run lint`

Expected: `eslint` passes without unknown setting keys or unused IPC wrappers.

- [ ] **Step 7: Commit**

```bash
git add src/common/defaultSetting.ts src/common/types/app_setting.d.ts src/common/types/taskbar_lyric.d.ts src/common/ipcNames.ts src/common/constants.ts src/renderer/utils/ipc.ts src/lang/zh-cn.json src/lang/zh-tw.json src/lang/en-us.json
git commit -m "补充任务栏歌词配置与类型"
```

---

### Task 2: Build A Minimal Main-Process Host And Placement Utility

**Files:**
- Create: `src/main/modules/taskbarLyric/index.ts`
- Create: `src/main/modules/taskbarLyric/main.ts`
- Create: `src/main/modules/taskbarLyric/utils.ts`
- Create: `src/main/modules/taskbarLyric/types.ts`
- Modify: `src/main/modules/index.ts`
- Test: `build-config/tests/taskbar-lyric-layout.test.mjs`

- [ ] **Step 1: Write a failing pure test for bounds computation**

```js
// build-config/tests/taskbar-lyric-layout.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { calcTaskbarLyricBounds } from '../../dist/main/modules/taskbarLyric/utils.js'

test('calcTaskbarLyricBounds anchors to bottom-right by default', () => {
  const bounds = calcTaskbarLyricBounds({
    display: { x: 0, y: 0, width: 1920, height: 1080, workArea: { x: 0, y: 0, width: 1920, height: 1040 } },
    width: 360,
    height: 56,
    position: 'right',
  })

  assert.equal(bounds.y, 1040)
  assert.equal(bounds.x, 1560)
})
```

- [ ] **Step 2: Implement the pure utility first**

```ts
// src/main/modules/taskbarLyric/utils.ts
export const calcTaskbarLyricBounds = ({ display, width, height, position }) => {
  const taskbarAtBottom = display.workArea.y + display.workArea.height < display.y + display.height
  const x = position === 'center'
    ? Math.round(display.workArea.x + (display.workArea.width - width) / 2)
    : display.workArea.x + display.workArea.width - width
  const y = taskbarAtBottom
    ? display.workArea.y + display.workArea.height
    : display.workArea.y - height
  return { x, y, width, height }
}
```

- [ ] **Step 3: Create the minimal host window wrapper**

```ts
// src/main/modules/taskbarLyric/main.ts
import path from 'node:path'
import { BrowserWindow, screen } from 'electron'
import { calcTaskbarLyricBounds } from './utils'

let browserWindow: Electron.BrowserWindow | null = null

export const createWindow = () => {
  const display = screen.getPrimaryDisplay().bounds
  const workArea = screen.getPrimaryDisplay().workArea
  const bounds = calcTaskbarLyricBounds({
    display: { ...display, workArea },
    width: global.lx.appSetting['taskbarLyric.width'],
    height: 56,
    position: global.lx.appSetting['taskbarLyric.position'],
  })

  browserWindow = new BrowserWindow({
    ...bounds,
    frame: false,
    show: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      sandbox: false,
    },
  })

  const winURL = process.env.NODE_ENV !== 'production'
    ? 'http://localhost:9082/taskbar-lyric.html'
    : `file://${path.join(__dirname, 'taskbar-lyric.html')}`

  void browserWindow.loadURL(winURL)
}
```

- [ ] **Step 4: Register the module with no-op safety**

```ts
// src/main/modules/taskbarLyric/index.ts
import { isWin } from '@common/utils'
import { closeWindow, createWindow, updateWindowState } from './main'

export default () => {
  global.lx.event_app.on('updated_config', (keys) => {
    if (!isWin || !keys.some(key => key.startsWith('taskbarLyric.'))) return
    if (global.lx.appSetting['taskbarLyric.enable']) createWindow()
    else closeWindow()
  })

  global.lx.event_app.on('app_inited', () => {
    if (isWin && global.lx.appSetting['taskbarLyric.enable']) createWindow()
    updateWindowState()
  })
}
```

```ts
// src/main/modules/index.ts
import registerTaskbarLyric from './taskbarLyric'
// ...
registerTaskbarLyric()
```

- [ ] **Step 5: Run the focused test and then lint**

Run: `npm.cmd run build:main`

Expected: main bundle compiles with the new module exported to `dist`.

Run: `node --test build-config/tests/taskbar-lyric-layout.test.mjs`

Expected: the layout test passes.

Run: `npm.cmd run lint`

Expected: no new lint failures.

- [ ] **Step 6: Commit**

```bash
git add src/main/modules/taskbarLyric src/main/modules/index.ts build-config/tests/taskbar-lyric-layout.test.mjs
git commit -m "新增任务栏歌词主进程宿主"
```

---

### Task 3: Add The Dedicated Renderer Target And Minimal UI

**Files:**
- Create: `src/renderer-taskbar-lyric/index.html`
- Create: `src/renderer-taskbar-lyric/main.ts`
- Create: `src/renderer-taskbar-lyric/App.vue`
- Create: `src/renderer-taskbar-lyric/store/state.ts`
- Create: `src/renderer-taskbar-lyric/utils/ipc.ts`
- Create: `build-config/renderer-taskbar-lyric/webpack.config.base.js`
- Create: `build-config/renderer-taskbar-lyric/webpack.config.dev.js`
- Create: `build-config/renderer-taskbar-lyric/webpack.config.prod.js`
- Modify: `build-config/runner-dev.js`
- Modify: `build-config/pack.js`
- Modify: `package.json`

- [ ] **Step 1: Create the renderer scaffold with explicit state fallbacks**

```ts
// src/renderer-taskbar-lyric/store/state.ts
import { reactive } from 'vue'

export const state = reactive<LX.TaskbarLyric.State>({
  enabled: false,
  isPlaying: false,
  songId: null,
  title: '',
  artist: '',
  lyricLine: '',
  albumCoverUrl: '',
})
```

```ts
// src/renderer-taskbar-lyric/main.ts
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#root')
```

- [ ] **Step 2: Implement a compact static-first UI before live wiring**

```vue
<!-- src/renderer-taskbar-lyric/App.vue -->
<template>
  <div :class="$style.bar">
    <img v-if="state.albumCoverUrl" :class="$style.cover" :src="state.albumCoverUrl" alt="">
    <div :class="$style.content">
      <div :class="$style.title">{{ state.title || 'LX Music' }}</div>
      <div :class="$style.subline">{{ state.lyricLine || state.artist || '任务栏歌词' }}</div>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Clone the lyric renderer webpack pattern with a new entry/output**

```js
// build-config/renderer-taskbar-lyric/webpack.config.base.js
entry: {
  'renderer-taskbar-lyric': path.join(__dirname, '../../src/renderer-taskbar-lyric/main.ts'),
},
plugins: [
  new HTMLPlugin({
    filename: 'taskbar-lyric.html',
    template: path.join(__dirname, '../../src/renderer-taskbar-lyric/index.html'),
  }),
]
```

```json
// package.json
"build:renderer-taskbar-lyric": "cross-env NODE_ENV=production webpack --config build-config/renderer-taskbar-lyric/webpack.config.prod.js --progress"
```

- [ ] **Step 4: Wire dev/prod build runners**

```js
// build-config/runner-dev.js
const rendererTaskbarLyricConfig = require('./renderer-taskbar-lyric/webpack.config.dev')
// add startRendererTaskbarLyric() on port 9082
// include spinner label: renderer-taskbar-lyric
```

```js
// build-config/pack.js
const rendererTaskbarLyricConfig = './renderer-taskbar-lyric/webpack.config.prod'
// include in Promise.all build fan-out
```

- [ ] **Step 5: Verify the renderer bundle can compile independently**

Run: `npm.cmd run build:renderer-taskbar-lyric`

Expected: `dist/taskbar-lyric.html` and matching renderer bundle are generated.

Run: `npm.cmd run lint`

Expected: new renderer files pass lint.

- [ ] **Step 6: Commit**

```bash
git add src/renderer-taskbar-lyric build-config/renderer-taskbar-lyric build-config/runner-dev.js build-config/pack.js package.json
git commit -m "新增任务栏歌词渲染进程"
```

---

### Task 4: Connect Live Playback State From The Main Renderer

**Files:**
- Modify: `src/renderer/core/lyric.ts`
- Modify: `src/renderer/utils/ipc.ts`
- Modify: `src/main/modules/taskbarLyric/index.ts`
- Modify: `src/main/modules/taskbarLyric/main.ts`
- Modify: `src/renderer-taskbar-lyric/utils/ipc.ts`
- Modify: `src/renderer-taskbar-lyric/main.ts`
- Modify: `src/renderer-taskbar-lyric/store/state.ts`

- [ ] **Step 1: Add a state derivation helper near the existing lyric pipeline**

```ts
// src/renderer/core/lyric.ts
const getTaskbarLyricState = (): LX.TaskbarLyric.State => ({
  enabled: appSetting['taskbarLyric.enable'],
  isPlaying: isPlay.value,
  songId: musicInfo.id || null,
  title: musicInfo.name || '',
  artist: musicInfo.singer || '',
  lyricLine: lyric.text || '',
  albumCoverUrl: musicInfo.pic || '',
})
```

- [ ] **Step 2: Push updates from every relevant playback edge**

```ts
// src/renderer/core/lyric.ts
const syncTaskbarLyric = () => {
  sendTaskbarLyricState(getTaskbarLyricState())
}

// call from:
// - onPlay()
// - setLyric()
// - play()
// - pause()
// - stop()
```

- [ ] **Step 3: Cache and forward state in the main-process module**

```ts
// src/main/modules/taskbarLyric/index.ts
let currentState: LX.TaskbarLyric.State = {
  enabled: false,
  isPlaying: false,
  songId: null,
  title: '',
  artist: '',
  lyricLine: '',
  albumCoverUrl: '',
}

mainHandle(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_set_state, ({ params }) => {
  currentState = params
  updateWindowState(currentState)
})
```

- [ ] **Step 4: Receive state in the taskbar lyric renderer and patch the reactive store**

```ts
// src/renderer-taskbar-lyric/utils/ipc.ts
import { rendererOn } from '@common/rendererIpc'
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'

export const onTaskbarLyricState = (listener) => {
  rendererOn(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_set_state, listener)
}
```

```ts
// src/renderer-taskbar-lyric/main.ts
import { state } from './store/state'
import { onTaskbarLyricState } from './utils/ipc'

onTaskbarLyricState(({ params }) => {
  Object.assign(state, params)
})
```

- [ ] **Step 5: Run the app manually and confirm live updates**

Run: `npm.cmd run dev`

Expected:
- the new renderer server starts on `9082`
- enabling the feature creates the lyric bar
- switching songs updates title/artist/lyric without reopening the window

Run: `npm.cmd run lint`

Expected: still passes.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/core/lyric.ts src/main/modules/taskbarLyric src/renderer-taskbar-lyric src/renderer/utils/ipc.ts
git commit -m "接入任务栏歌词实时状态同步"
```

---

### Task 5: Add Settings UI, Placement Refresh, And Manual Verification Pass

**Files:**
- Modify: `src/renderer/views/Setting/components/SettingDesktopLyric.vue` or split into a new `SettingTaskbarLyric.vue`
- Modify: `src/main/modules/taskbarLyric/main.ts`
- Modify: `src/main/modules/taskbarLyric/utils.ts`
- Modify: `src/main/modules/taskbarLyric/index.ts`
- Modify: `docs/superpowers/specs/2026-05-20-taskbar-lyric-design.md` if implementation notes need reconciliation

- [ ] **Step 1: Add the settings controls in the renderer**

```pug
dt#taskbar_lyric {{ $t('setting__taskbar_lyric') }}
dd
  .gap-top
    base-checkbox(
      id="setting_taskbar_lyric_enable"
      :model-value="appSetting['taskbarLyric.enable']"
      :label="$t('setting__taskbar_lyric_enable')"
      @update:model-value="updateSetting({ 'taskbarLyric.enable': $event })"
    )
  p.gap-top {{ $t('setting__taskbar_lyric_experimental') }}
```

```pug
  .gap-top
    base-checkbox.gap-left(
      id="setting_taskbar_lyric_position_right"
      :model-value="appSetting['taskbarLyric.position']"
      need value="right"
      :label="$t('setting__desktop_lyric_align_right')"
      @update:model-value="updateSetting({ 'taskbarLyric.position': $event })"
    )
```

- [ ] **Step 2: Recompute bounds on display and Explorer-adjacent events**

```ts
// src/main/modules/taskbarLyric/index.ts
screen.on('display-metrics-changed', () => refreshBounds())
screen.on('display-added', () => refreshBounds())
screen.on('display-removed', () => refreshBounds())
global.lx.event_app.on('system_theme_change', () => refreshBounds())
```

```ts
// src/main/modules/taskbarLyric/main.ts
export const refreshBounds = () => {
  if (!browserWindow) return
  browserWindow.setBounds(getWindowBounds())
}
```

- [ ] **Step 3: Add a graceful fallback when taskbar geometry cannot be inferred**

```ts
// src/main/modules/taskbarLyric/utils.ts
export const getFallbackBounds = ({ display, width, height }) => ({
  x: display.workArea.x + display.workArea.width - width,
  y: display.workArea.y + display.workArea.height - height,
  width,
  height,
})
```

- [ ] **Step 4: Run the full manual verification matrix**

Run: `npm.cmd run lint`

Expected: pass.

Run: `npm.cmd run dev`

Expected manual checks:
- Windows 10: bottom taskbar, 100% and 125% DPI
- Windows 11: bottom taskbar, 100% and 150% DPI
- enable/disable feature from settings
- pause/play and track switch update text
- no Alt+Tab entry and no taskbar icon
- existing desktop lyric still opens and works

- [ ] **Step 5: Reconcile documentation if behavior diverges from the spec**

```md
If final implementation chooses a fixed bar height, primary-display-only scope,
or omits auto-hide following in V1, update the spec document immediately so the
repo does not claim behavior we did not ship.
```

- [ ] **Step 6: Commit**

```bash
git add src/renderer/views/Setting/components/SettingDesktopLyric.vue src/main/modules/taskbarLyric docs/superpowers/specs/2026-05-20-taskbar-lyric-design.md
git commit -m "完善任务栏歌词设置与窗口定位"
```

---

## Self-Review

### Spec coverage

- One shared Win10/Win11 pseudo-embedded path: covered by Tasks 2-5
- Dedicated renderer target: covered by Task 3
- Dedicated settings group: covered by Tasks 1 and 5
- Display-only V1 scope: preserved throughout Tasks 3 and 4
- Primary-display positioning and graceful fallback: covered by Tasks 2 and 5

### Placeholder scan

- No `TODO` or `TBD` markers remain.
- Each task names exact files and commands.
- Verification steps are explicit rather than implied.

### Type consistency

- `LX.TaskbarLyric.State` is introduced once and reused consistently.
- Settings keys use the same `taskbarLyric.*` namespace across default settings, app setting types, renderer settings, and main-process watchers.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-20-taskbar-lyric-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**

