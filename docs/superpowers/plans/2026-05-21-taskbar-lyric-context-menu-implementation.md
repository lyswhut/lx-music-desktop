# Taskbar Lyric Context Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a native right-click menu to the Windows taskbar lyric window with previous, play/pause, next, collect/uncollect, and close actions.

**Architecture:** Extend the existing taskbar lyric state pipeline so the main process always has enough player state to build a native Electron menu on demand. The taskbar lyric renderer only reports `contextmenu`; the main process owns menu construction, action dispatch, and enable/disable rules.

**Tech Stack:** Electron main process, Vue 3 renderer, existing IPC/event system, TypeScript, existing player control wiring, manual verification plus `build` and `lint`.

---

## File Structure

### Modified files

- `src/common/ipcNames.ts`
- `src/common/types/taskbar_lyric.d.ts`
- `src/renderer/core/lyric.ts`
- `src/renderer/utils/ipc.ts`
- `src/renderer-taskbar-lyric/App.vue`
- `src/renderer-taskbar-lyric/utils/ipc.ts`
- `src/main/modules/taskbarLyric/index.ts`
- `src/main/modules/taskbarLyric/main.ts`
- `src/main/modules/taskbarLyric/types.ts`
- `src/main/modules/winMain/rendererEvent/taskbarLyric.ts`

### Responsibility split

- `src/common/ipcNames.ts`: taskbar lyric menu IPC channel names
- `src/common/types/taskbar_lyric.d.ts`: menu-required state fields shared across processes
- `src/renderer/core/lyric.ts`: source of synchronized play/collect state
- `src/renderer/utils/ipc.ts`: main-renderer IPC helpers for taskbar lyric sync
- `src/renderer-taskbar-lyric/App.vue`: emit right-click requests from the floating lyric UI
- `src/renderer-taskbar-lyric/utils/ipc.ts`: taskbar lyric renderer IPC helpers
- `src/main/modules/taskbarLyric/main.ts`: menu creation, action dispatch, and close behavior
- `src/main/modules/taskbarLyric/index.ts`: wire state updates and right-click requests
- `src/main/modules/taskbarLyric/types.ts`: internal menu state typing
- `src/main/modules/winMain/rendererEvent/taskbarLyric.ts`: renderer event registration

---

### Task 1: Extend Shared State And IPC Contract

**Files:**
- Modify: `src/common/ipcNames.ts`
- Modify: `src/common/types/taskbar_lyric.d.ts`
- Modify: `src/renderer/utils/ipc.ts`
- Modify: `src/renderer-taskbar-lyric/utils/ipc.ts`

- [ ] **Step 1: Extend the shared taskbar lyric state type with collect status**

```ts
// src/common/types/taskbar_lyric.d.ts
declare namespace LX {
  namespace TaskbarLyric {
    interface State {
      enabled: boolean
      isPlaying: boolean
      isCollected: boolean
      songId: string | null
      title: string
      artist: string
      lyricLine: string
      albumCoverUrl: string | null
      offsetX: number
      showCover: boolean
      showSongInfo: boolean
      showCurrentLine: boolean
    }
  }
}
```

- [ ] **Step 2: Add a dedicated right-click menu request IPC name**

```ts
// src/common/ipcNames.ts inside WIN_MAIN_RENDERER_EVENT_NAME
taskbar_lyric_show_menu: 'taskbar_lyric_show_menu',
```

- [ ] **Step 3: Add a main-renderer helper for pushing the enriched state**

```ts
// src/renderer/utils/ipc.ts
export const sendTaskbarLyricState = (state: LX.TaskbarLyric.State) => {
  ipcRenderer.send(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_set_state, state)
}
```

- [ ] **Step 4: Add a taskbar lyric renderer helper for requesting the menu**

```ts
// src/renderer-taskbar-lyric/utils/ipc.ts
export const requestTaskbarLyricMenu = () => {
  ipcRenderer.send(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_show_menu)
}
```

- [ ] **Step 5: Run lint to catch typing or duplicate IPC key errors**

Run: `npm.cmd run lint`

Expected: `eslint` passes and there are no duplicate object key or unused export errors.

- [ ] **Step 6: Commit**

```bash
git add src/common/ipcNames.ts src/common/types/taskbar_lyric.d.ts src/renderer/utils/ipc.ts src/renderer-taskbar-lyric/utils/ipc.ts
git commit -m "补充任务栏歌词菜单状态与IPC"
```

---

### Task 2: Synchronize Collect State From The Main Renderer

**Files:**
- Modify: `src/renderer/core/lyric.ts`

- [ ] **Step 1: Inspect existing player state source and add collect status into the taskbar lyric snapshot**

```ts
// src/renderer/core/lyric.ts
const getTaskbarLyricState = (): LX.TaskbarLyric.State => {
  return {
    enabled: appSetting['taskbarLyric.enable'],
    isPlaying: isPlay.value,
    isCollected: !!musicInfo.isCollect,
    songId: musicInfo.id,
    title: musicInfo.name,
    artist: musicInfo.singer,
    lyricLine: lyric.text,
    albumCoverUrl: musicInfo.pic,
    offsetX: appSetting['taskbarLyric.offsetX'],
    showCover: appSetting['taskbarLyric.showCover'],
    showSongInfo: appSetting['taskbarLyric.showSongInfo'],
    showCurrentLine: appSetting['taskbarLyric.showCurrentLine'],
  }
}
```

- [ ] **Step 2: Verify every existing sync path continues using `getTaskbarLyricState()`**

```ts
// src/renderer/core/lyric.ts
const syncTaskbarLyricState = () => {
  sendTaskbarLyricState(getTaskbarLyricState())
}
```

This step is complete only if the same helper is still called from:

```ts
// src/renderer/core/lyric.ts
// onPlay(...)
// onSetLyric(...)
// onUpdateLyric(...)
// setLyric()
// play()
// pause()
// stop()
// sendInfo()
```

- [ ] **Step 3: Run a renderer build to catch state-shape mismatches**

Run: `npm.cmd run build:renderer`

Expected: renderer build succeeds without `TS2353` or taskbar lyric state property errors.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/core/lyric.ts
git commit -m "同步任务栏歌词收藏状态"
```

---

### Task 3: Emit Native Menu Requests From The Taskbar Lyric Window

**Files:**
- Modify: `src/renderer-taskbar-lyric/App.vue`
- Modify: `src/renderer-taskbar-lyric/utils/ipc.ts`

- [ ] **Step 1: Add a dedicated `contextmenu` handler that does not interfere with left-button drag**

```vue
<!-- src/renderer-taskbar-lyric/App.vue -->
<div
  class="taskbar-lyric-shell"
  :class="{ disabled: !state.enabled, dragging: isDragging }"
  @pointerdown="handlePointerDown"
  @contextmenu.prevent="handleContextMenu"
>
```

```ts
// src/renderer-taskbar-lyric/App.vue
import { sendTaskbarLyricDragEnd, sendTaskbarLyricDragMove, requestTaskbarLyricMenu } from './utils/ipc'

const handleContextMenu = () => {
  stopDragging()
  requestTaskbarLyricMenu()
}
```

- [ ] **Step 2: Keep left-button drag behavior unchanged**

```ts
// src/renderer-taskbar-lyric/App.vue
const handlePointerDown = (event: PointerEvent) => {
  if (event.button !== 0) return
  isDragging.value = true
  pointerId = event.pointerId
  startScreenX = event.screenX
  startOffsetX = state.offsetX
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', stopDragging)
  window.addEventListener('pointercancel', stopDragging)
}
```

- [ ] **Step 3: Verify the taskbar lyric renderer still builds**

Run: `npm.cmd run build:renderer-taskbar-lyric`

Expected: build passes and template/event bindings compile without duplicate handler or missing import errors.

- [ ] **Step 4: Commit**

```bash
git add src/renderer-taskbar-lyric/App.vue src/renderer-taskbar-lyric/utils/ipc.ts
git commit -m "增加任务栏歌词右键菜单请求"
```

---

### Task 4: Build The Native Menu In The Main Process

**Files:**
- Modify: `src/main/modules/taskbarLyric/types.ts`
- Modify: `src/main/modules/taskbarLyric/main.ts`
- Modify: `src/main/modules/taskbarLyric/index.ts`
- Modify: `src/main/modules/winMain/rendererEvent/taskbarLyric.ts`

- [ ] **Step 1: Extend internal taskbar lyric state typing for menu generation**

```ts
// src/main/modules/taskbarLyric/types.ts
export interface TaskbarLyricState {
  enabled: boolean
  isPlaying: boolean
  isCollected: boolean
  songId: string | null
  title: string
  artist: string
  lyricLine: string
  albumCoverUrl: string | null
  offsetX: number
  showCover: boolean
  showSongInfo: boolean
  showCurrentLine: boolean
}
```

- [ ] **Step 2: Add a helper that derives the menu labels and enable state**

```ts
// src/main/modules/taskbarLyric/main.ts
const hasActiveSong = (state?: TaskbarLyricState | null) => {
  return !!state?.songId
}
```

```ts
// src/main/modules/taskbarLyric/main.ts
const createTaskbarLyricMenuTemplate = (state?: TaskbarLyricState | null): Electron.MenuItemConstructorOptions[] => {
  const enabled = hasActiveSong(state)

  return [
    {
      label: '上一首',
      enabled,
      click: () => sendTaskbarButtonClick('prev'),
    },
    {
      label: state?.isPlaying ? '暂停' : '播放',
      enabled,
      click: () => sendTaskbarButtonClick('pause'),
    },
    {
      label: '下一首',
      enabled,
      click: () => sendTaskbarButtonClick('next'),
    },
    {
      label: state?.isCollected ? '取消收藏' : '收藏',
      enabled,
      click: () => sendTaskbarButtonClick(state?.isCollected ? 'uncollect' : 'collect'),
    },
    { type: 'separator' },
    {
      label: '关闭任务栏歌词',
      click: () => {
        global.lx.event_app.settingUpdated({
          'taskbarLyric.enable': false,
        })
      },
    },
  ]
}
```

- [ ] **Step 3: Use the same player-control dispatch path as tray/openAPI**

```ts
// src/main/modules/taskbarLyric/main.ts
import { Menu } from 'electron'
import { sendTaskbarButtonClick } from '@main/modules/tray'
```

If `sendTaskbarButtonClick` is not exported today, make the smallest change necessary in the existing module so the taskbar lyric menu can reuse it instead of duplicating player-control dispatch logic.

- [ ] **Step 4: Add a public function that pops the native menu on the taskbar lyric window**

```ts
// src/main/modules/taskbarLyric/main.ts
export const showTaskbarLyricMenu = () => {
  if (!win) return
  const menu = Menu.buildFromTemplate(createTaskbarLyricMenuTemplate(currentState))
  menu.popup({
    window: win,
  })
}
```

- [ ] **Step 5: Wire IPC events to cached state and menu popup**

```ts
// src/main/modules/winMain/rendererEvent/taskbarLyric.ts
mainWindow.webContents.on(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_set_state, (_event, state) => {
  setTaskbarLyricState(state)
})
```

```ts
// src/main/modules/winMain/rendererEvent/taskbarLyric.ts
ipcMain.on(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_show_menu, () => {
  showTaskbarLyricMenu()
})
```

```ts
// src/main/modules/taskbarLyric/index.ts
export const setTaskbarLyricState = (state: TaskbarLyricState) => {
  currentState = state
  sendStateToWindow()
}
```

- [ ] **Step 6: Implement close behavior through settings, not direct window destruction**

```ts
// src/main/modules/taskbarLyric/main.ts
const closeTaskbarLyricBySetting = () => {
  global.lx.event_app.settingUpdated({
    'taskbarLyric.enable': false,
  })
}
```

If this repository updates settings through a different helper than `settingUpdated`, substitute the real repository function, but keep the behavior: update persisted app setting first and let the existing config listener close the window.

- [ ] **Step 7: Run main build and lint**

Run: `npm.cmd run build:main`

Expected: main bundle compiles, including new menu code and imported player-control helper.

Run: `npm.cmd run lint`

Expected: no unused imports, no invalid click handler typings, no duplicate state definitions.

- [ ] **Step 8: Commit**

```bash
git add src/main/modules/taskbarLyric/types.ts src/main/modules/taskbarLyric/main.ts src/main/modules/taskbarLyric/index.ts src/main/modules/winMain/rendererEvent/taskbarLyric.ts
git commit -m "实现任务栏歌词原生右键菜单"
```

---

### Task 5: Run Manual Verification In `npm run dev`

**Files:**
- Modify: none required unless bugs are found during verification

- [ ] **Step 1: Start the app in development mode**

Run: `npm.cmd run dev`

Expected: the main window and taskbar lyric renderer start normally without compile errors.

- [ ] **Step 2: Verify empty-state menu behavior**

Manual steps:

1. Enable taskbar lyric.
2. Ensure no track is actively loaded or switch to a state with no current song if supported.
3. Right-click the taskbar lyric window.

Expected:

- `上一首` disabled
- `播放` or `暂停` disabled
- `下一首` disabled
- `收藏` disabled
- `关闭任务栏歌词` enabled

- [ ] **Step 3: Verify playback-state menu behavior**

Manual steps:

1. Play a song.
2. Right-click the taskbar lyric window while playing.
3. Click `暂停`.
4. Right-click again.
5. Click `播放`.

Expected:

- playing state shows `暂停`
- paused state shows `播放`
- action toggles real playback state

- [ ] **Step 4: Verify collect/uncollect menu behavior**

Manual steps:

1. Play an uncollected song.
2. Right-click and click `收藏`.
3. Right-click again.
4. Click `取消收藏`.

Expected:

- uncollected song shows `收藏`
- after collect, reopening the menu shows `取消收藏`
- after uncollect, reopening the menu returns to `收藏`

- [ ] **Step 5: Verify previous/next and close behavior**

Manual steps:

1. Right-click and click `下一首`.
2. Right-click and click `上一首`.
3. Right-click and click `关闭任务栏歌词`.
4. Check the settings page.

Expected:

- track changes correctly on prev/next
- taskbar lyric disappears after close
- settings page shows `taskbarLyric.enable` turned off

- [ ] **Step 6: If no fixes are needed, create the verification commit or leave the tree clean**

Run: `git status --short`

Expected: no changes if verification required no follow-up fixes.

---

## Self-Review

### Spec coverage

- Native menu on right-click: covered by Tasks 3 and 4
- Dynamic play/pause label: covered by Task 4
- Dynamic collect/uncollect label: covered by Tasks 2 and 4
- Disabled player actions when no song exists: covered by Task 4 and verified in Task 5
- Close through settings sync: covered by Task 4 and verified in Task 5

### Placeholder scan

- No `TODO` or `TBD` markers remain.
- All touched files are named explicitly.
- All verification commands are concrete.

### Type consistency

- Shared state uses `isCollected` consistently across common types, renderer sync, and main-process menu logic.
- Right-click menu request uses one IPC name: `taskbar_lyric_show_menu`.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-21-taskbar-lyric-context-menu-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
