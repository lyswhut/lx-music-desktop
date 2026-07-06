# Taskbar Lyric Color Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add configurable background and text colors for the Windows taskbar lyric window, including theme/custom modes and background-only opacity.

**Architecture:** Extend the existing taskbar lyric setting model with a small style namespace, then push the resolved style inputs through the current main-process state sync so the floating taskbar lyric window can render from one authoritative snapshot. Reuse the existing settings-page slider and Pickr color-picker patterns instead of inventing new controls.

**Tech Stack:** Electron main process, Vue 3 renderers, TypeScript declaration files, existing app setting store, existing taskbar lyric IPC/state pipeline, existing `pickrTools`, manual verification plus targeted builds and lint.

---

## File Structure

### Modified files

- `src/common/defaultSetting.ts`
- `src/common/types/app_setting.d.ts`
- `src/common/types/taskbar_lyric.d.ts`
- `src/main/modules/taskbarLyric/index.ts`
- `src/main/modules/taskbarLyric/main.ts`
- `src/main/modules/taskbarLyric/types.ts`
- `src/renderer/core/lyric.ts`
- `src/renderer-taskbar-lyric/App.vue`
- `src/renderer/views/Setting/components/SettingTaskbarLyric.vue`
- `src/lang/zh-cn.json`
- `src/lang/zh-tw.json`
- `src/lang/en-us.json`

### New files

- None required. Keep the change set small by reusing existing files and patterns.

### Responsibility split

- `src/common/defaultSetting.ts`: define default taskbar lyric color settings
- `src/common/types/app_setting.d.ts`: extend persistent app-setting typing
- `src/common/types/taskbar_lyric.d.ts`: extend synced taskbar lyric state typing
- `src/main/modules/taskbarLyric/types.ts`: extend internal main-process state shape
- `src/main/modules/taskbarLyric/main.ts`: include style fields in the taskbar lyric state sent to the floating window
- `src/main/modules/taskbarLyric/index.ts`: refresh the taskbar lyric window when new style-related settings change
- `src/renderer/core/lyric.ts`: include color-style settings in the taskbar lyric snapshot sent from the main renderer
- `src/renderer/views/Setting/components/SettingTaskbarLyric.vue`: add radio controls, color pickers, and opacity slider
- `src/renderer-taskbar-lyric/App.vue`: resolve theme/custom colors into final CSS and render them
- `src/lang/*.json`: localized labels for the new settings

---

### Task 1: Extend Persistent Settings And Synced State

**Files:**
- Modify: `src/common/defaultSetting.ts`
- Modify: `src/common/types/app_setting.d.ts`
- Modify: `src/common/types/taskbar_lyric.d.ts`
- Modify: `src/main/modules/taskbarLyric/types.ts`

- [ ] **Step 1: Add default taskbar lyric style settings**

```ts
// src/common/defaultSetting.ts
'taskbarLyric.style.backgroundColorMode': 'theme',
'taskbarLyric.style.backgroundColor': 'rgba(15, 23, 42, 1)',
'taskbarLyric.style.backgroundOpacity': 72,
'taskbarLyric.style.fontColorMode': 'theme',
'taskbarLyric.style.fontColor': 'rgba(248, 250, 252, 1)',
```

Place these directly after the existing taskbar lyric content settings so all taskbar lyric defaults stay grouped.

- [ ] **Step 2: Add app-setting type declarations for the new fields**

```ts
// src/common/types/app_setting.d.ts
'taskbarLyric.style.backgroundColorMode': 'theme' | 'custom'
'taskbarLyric.style.backgroundColor': string
'taskbarLyric.style.backgroundOpacity': number
'taskbarLyric.style.fontColorMode': 'theme' | 'custom'
'taskbarLyric.style.fontColor': string
```

Use the same documentation-comment style already present in the taskbar lyric section.

- [ ] **Step 3: Extend the shared taskbar lyric state with style fields**

```ts
// src/common/types/taskbar_lyric.d.ts
backgroundColorMode: 'theme' | 'custom'
backgroundColor: string
backgroundOpacity: number
fontColorMode: 'theme' | 'custom'
fontColor: string
```

Append these to `LX.TaskbarLyric.State` so the floating renderer gets style inputs through the existing sync pipeline.

- [ ] **Step 4: Mirror the same fields in the main-process internal taskbar lyric state**

```ts
// src/main/modules/taskbarLyric/types.ts
backgroundColorMode: LX.AppSetting['taskbarLyric.style.backgroundColorMode']
backgroundColor: LX.AppSetting['taskbarLyric.style.backgroundColor']
backgroundOpacity: LX.AppSetting['taskbarLyric.style.backgroundOpacity']
fontColorMode: LX.AppSetting['taskbarLyric.style.fontColorMode']
fontColor: LX.AppSetting['taskbarLyric.style.fontColor']
```

- [ ] **Step 5: Run a main build to catch missing declarations early**

Run: `npm.cmd run build:main`

Expected: the main bundle compiles without “property does not exist” errors for the new taskbar lyric style keys.

- [ ] **Step 6: Commit**

```bash
git add src/common/defaultSetting.ts src/common/types/app_setting.d.ts src/common/types/taskbar_lyric.d.ts src/main/modules/taskbarLyric/types.ts
git commit -m "补充任务栏歌词颜色配置结构"
```

---

### Task 2: Sync Style Settings Through The Existing Taskbar Lyric State Pipeline

**Files:**
- Modify: `src/renderer/core/lyric.ts`
- Modify: `src/main/modules/taskbarLyric/main.ts`
- Modify: `src/main/modules/taskbarLyric/index.ts`

- [ ] **Step 1: Include the new style fields in the renderer-side taskbar lyric snapshot**

```ts
// src/renderer/core/lyric.ts inside getTaskbarLyricState()
backgroundColorMode: appSetting['taskbarLyric.style.backgroundColorMode'],
backgroundColor: appSetting['taskbarLyric.style.backgroundColor'],
backgroundOpacity: appSetting['taskbarLyric.style.backgroundOpacity'],
fontColorMode: appSetting['taskbarLyric.style.fontColorMode'],
fontColor: appSetting['taskbarLyric.style.fontColor'],
```

Keep this data in the same `getTaskbarLyricState()` helper used by the current taskbar lyric sync flow so all existing sync call sites continue to work unchanged.

- [ ] **Step 2: Extend the main-process default/current taskbar lyric state**

```ts
// src/main/modules/taskbarLyric/main.ts inside currentState
backgroundColorMode: global.lx.appSetting['taskbarLyric.style.backgroundColorMode'],
backgroundColor: global.lx.appSetting['taskbarLyric.style.backgroundColor'],
backgroundOpacity: global.lx.appSetting['taskbarLyric.style.backgroundOpacity'],
fontColorMode: global.lx.appSetting['taskbarLyric.style.fontColorMode'],
fontColor: global.lx.appSetting['taskbarLyric.style.fontColor'],
```

Add the same fields anywhere `currentState` is rehydrated from settings, including the helper that refreshes taskbar lyric state from config.

- [ ] **Step 3: Refresh the open taskbar lyric window when any color setting changes**

```ts
// src/main/modules/taskbarLyric/index.ts inside the config-change listener
if (global.lx.appSetting['taskbarLyric.enable'] && (
  keys.includes('taskbarLyric.style.backgroundColorMode') ||
  keys.includes('taskbarLyric.style.backgroundColor') ||
  keys.includes('taskbarLyric.style.backgroundOpacity') ||
  keys.includes('taskbarLyric.style.fontColorMode') ||
  keys.includes('taskbarLyric.style.fontColor')
)) {
  refreshWindowStateFromConfig()
}
```

Reuse the existing `refreshWindowStateFromConfig()` pathway rather than introducing a second style-only sync path.

- [ ] **Step 4: Run targeted builds for renderer and main**

Run: `npm.cmd run build:renderer`

Expected: renderer build succeeds without taskbar lyric state-shape errors.

Run: `npm.cmd run build:main`

Expected: main build succeeds without missing setting-key or state-field errors.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/core/lyric.ts src/main/modules/taskbarLyric/main.ts src/main/modules/taskbarLyric/index.ts
git commit -m "同步任务栏歌词颜色状态"
```

---

### Task 3: Add Settings UI For Background And Text Colors

**Files:**
- Modify: `src/renderer/views/Setting/components/SettingTaskbarLyric.vue`
- Modify: `src/lang/zh-cn.json`
- Modify: `src/lang/zh-tw.json`
- Modify: `src/lang/en-us.json`

- [ ] **Step 1: Reuse Pickr patterns to add two color-picker refs and lifecycle wiring**

```js
// src/renderer/views/Setting/components/SettingTaskbarLyric.vue
import { onMounted, onBeforeUnmount, ref } from '@common/utils/vueTools'
import { pickrTools } from '@renderer/utils/pickrTools'
```

```js
// src/renderer/views/Setting/components/SettingTaskbarLyric.vue
const backgroundColorRef = ref(null)
const fontColorRef = ref(null)
let backgroundColorTools = null
let fontColorTools = null
```

```js
// src/renderer/views/Setting/components/SettingTaskbarLyric.vue
const initColorPickers = () => {
  if (backgroundColorRef.value) {
    backgroundColorTools = pickrTools.create(backgroundColorRef.value, appSetting['taskbarLyric.style.backgroundColor'], [
      'rgba(15, 23, 42, 1)',
      'rgba(30, 41, 59, 1)',
      'rgba(17, 24, 39, 1)',
      'rgba(255, 255, 255, 1)',
      'rgba(59, 130, 246, 1)',
    ], color => {
      updateSetting({ 'taskbarLyric.style.backgroundColor': color })
    })
  }
  if (fontColorRef.value) {
    fontColorTools = pickrTools.create(fontColorRef.value, appSetting['taskbarLyric.style.fontColor'], [
      'rgba(248, 250, 252, 1)',
      'rgba(255, 255, 255, 1)',
      'rgba(226, 232, 240, 1)',
      'rgba(15, 23, 42, 1)',
      'rgba(17, 24, 39, 1)',
    ], color => {
      updateSetting({ 'taskbarLyric.style.fontColor': color })
    })
  }
}
```

Destroy both Pickr instances in `onBeforeUnmount()`.

- [ ] **Step 2: Add background mode, custom color, and opacity controls**

```pug
dd
  h3#taskbar_lyric_background {{ $t('setting__taskbar_lyric_background') }}
  div
    base-checkbox.gap-left(
      id="setting_taskbar_lyric_background_theme"
      name="setting_taskbar_lyric_background_mode"
      need
      :model-value="appSetting['taskbarLyric.style.backgroundColorMode']"
      value="theme"
      :label="$t('setting__taskbar_lyric_theme_color')"
      :disabled="!isWin"
      @update:model-value="updateSetting({ 'taskbarLyric.style.backgroundColorMode': $event })"
    )
    base-checkbox.gap-left(
      id="setting_taskbar_lyric_background_custom"
      name="setting_taskbar_lyric_background_mode"
      need
      :model-value="appSetting['taskbarLyric.style.backgroundColorMode']"
      value="custom"
      :label="$t('setting__taskbar_lyric_custom_color')"
      :disabled="!isWin"
      @update:model-value="updateSetting({ 'taskbarLyric.style.backgroundColorMode': $event })"
    )
  .gap-top(:class="$style.colorLine")
    div(
      ref="backgroundColorRef"
      :class="[$style.colorSwatch, appSetting['taskbarLyric.style.backgroundColorMode'] != 'custom' ? $style.colorSwatchDisabled : '']"
    )
    span(:class="$style.colorLabel") {{ appSetting['taskbarLyric.style.backgroundColor'] }}
  .gap-top(:class="$style.sliderLine")
    base-slider-bar(
      :class-name="$style.slider"
      :value="appSetting['taskbarLyric.style.backgroundOpacity']"
      :min="0"
      :max="100"
      :step="1"
      :disabled="!isWin"
      @change="updateSetting({ 'taskbarLyric.style.backgroundOpacity': $event })"
    )
    span(:class="$style.sliderValue") {{ appSetting['taskbarLyric.style.backgroundOpacity'] }}%
```

- [ ] **Step 3: Add text color mode and custom color controls**

```pug
dd
  h3#taskbar_lyric_font_color {{ $t('setting__taskbar_lyric_font_color') }}
  div
    base-checkbox.gap-left(
      id="setting_taskbar_lyric_font_theme"
      name="setting_taskbar_lyric_font_mode"
      need
      :model-value="appSetting['taskbarLyric.style.fontColorMode']"
      value="theme"
      :label="$t('setting__taskbar_lyric_theme_color')"
      :disabled="!isWin"
      @update:model-value="updateSetting({ 'taskbarLyric.style.fontColorMode': $event })"
    )
    base-checkbox.gap-left(
      id="setting_taskbar_lyric_font_custom"
      name="setting_taskbar_lyric_font_mode"
      need
      :model-value="appSetting['taskbarLyric.style.fontColorMode']"
      value="custom"
      :label="$t('setting__taskbar_lyric_custom_color')"
      :disabled="!isWin"
      @update:model-value="updateSetting({ 'taskbarLyric.style.fontColorMode': $event })"
    )
  .gap-top(:class="$style.colorLine")
    div(
      ref="fontColorRef"
      :class="[$style.colorSwatch, appSetting['taskbarLyric.style.fontColorMode'] != 'custom' ? $style.colorSwatchDisabled : '']"
    )
    span(:class="$style.colorLabel") {{ appSetting['taskbarLyric.style.fontColor'] }}
```

- [ ] **Step 4: Add matching localized labels**

```json
// src/lang/zh-cn.json
"setting__taskbar_lyric_background": "背景颜色",
"setting__taskbar_lyric_font_color": "文字颜色",
"setting__taskbar_lyric_theme_color": "主题色",
"setting__taskbar_lyric_custom_color": "自定义",
```

```json
// src/lang/en-us.json
"setting__taskbar_lyric_background": "Background Color",
"setting__taskbar_lyric_font_color": "Text Color",
"setting__taskbar_lyric_theme_color": "Theme",
"setting__taskbar_lyric_custom_color": "Custom",
```

Add corresponding Traditional Chinese strings in `src/lang/zh-tw.json`.

- [ ] **Step 5: Add minimal styles for the color rows**

```less
// src/renderer/views/Setting/components/SettingTaskbarLyric.vue
.colorLine {
  display: flex;
  align-items: center;
  gap: 12px;
}

.colorSwatch {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background-color: var(--pcr-color);
  box-shadow: 0 0 3px var(--color-primary-light-100-alpha-300);
  transition: opacity .2s ease;
}

.colorSwatchDisabled {
  opacity: .45;
}

.colorLabel {
  font-size: 12px;
  opacity: .8;
}
```

- [ ] **Step 6: Run the renderer build and lint**

Run: `npm.cmd run build:renderer`

Expected: settings renderer compiles and Pickr refs/hooks are typed correctly.

Run: `npm.cmd run lint`

Expected: no unused imports, duplicate IDs, or Vue template binding issues.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/views/Setting/components/SettingTaskbarLyric.vue src/lang/zh-cn.json src/lang/zh-tw.json src/lang/en-us.json
git commit -m "新增任务栏歌词颜色设置界面"
```

---

### Task 4: Render Resolved Background And Text Colors In The Floating Taskbar Lyric Window

**Files:**
- Modify: `src/renderer-taskbar-lyric/App.vue`

- [ ] **Step 1: Add small color helpers for alpha replacement, luminance checks, and theme-derived colors**

```ts
// src/renderer-taskbar-lyric/App.vue
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const parseRgb = (color: string) => {
  const match = color.match(/rgba?\(([^)]+)\)/i)
  if (!match) return null
  const [r, g, b] = match[1].split(',').slice(0, 3).map(part => Number.parseFloat(part.trim()))
  if ([r, g, b].some(num => Number.isNaN(num))) return null
  return { r, g, b }
}

const withAlpha = (color: string, alpha: number) => {
  const rgb = parseRgb(color)
  if (!rgb) return `rgba(15, 23, 42, ${alpha})`
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

const getLuminance = ({ r, g, b }: { r: number, g: number, b: number }) => {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

const mix = (from: { r: number, g: number, b: number }, to: { r: number, g: number, b: number }, amount: number) => {
  return {
    r: Math.round(from.r + (to.r - from.r) * amount),
    g: Math.round(from.g + (to.g - from.g) * amount),
    b: Math.round(from.b + (to.b - from.b) * amount),
  }
}
```

- [ ] **Step 2: Read theme variables and derive stable panel/text colors**

```ts
// src/renderer-taskbar-lyric/App.vue
const getThemePrimaryColor = () => {
  const color = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()
  return parseRgb(color) ?? { r: 59, g: 130, b: 246 }
}

const getThemeBackgroundColor = () => {
  const primary = getThemePrimaryColor()
  const target = getLuminance(primary) > 0.62 ? { r: 15, g: 23, b: 42 } : { r: 30, g: 41, b: 59 }
  const mixed = mix(primary, target, 0.72)
  return `rgb(${mixed.r}, ${mixed.g}, ${mixed.b})`
}

const getThemeFontColor = () => {
  const primary = getThemePrimaryColor()
  const target = getLuminance(primary) > 0.52 ? { r: 15, g: 23, b: 42 } : { r: 248, g: 250, b: 252 }
  const mixed = mix(primary, target, 0.88)
  return `rgb(${mixed.r}, ${mixed.g}, ${mixed.b})`
}
```

- [ ] **Step 3: Build computed shell styles from the synced state**

```ts
// src/renderer-taskbar-lyric/App.vue
import { computed } from 'vue'
```

```ts
// src/renderer-taskbar-lyric/App.vue
const shellStyle = computed(() => {
  const opacity = clamp(state.backgroundOpacity, 0, 100) / 100
  const baseBackground = state.backgroundColorMode === 'custom'
    ? state.backgroundColor
    : getThemeBackgroundColor()
  const fontColor = state.fontColorMode === 'custom'
    ? state.fontColor
    : getThemeFontColor()
  const secondaryFontColor = withAlpha(fontColor, 0.72)

  return {
    '--taskbar-lyric-bg': withAlpha(baseBackground, opacity),
    '--taskbar-lyric-border': withAlpha(fontColor, 0.14),
    '--taskbar-lyric-font': withAlpha(fontColor, 1),
    '--taskbar-lyric-font-secondary': secondaryFontColor,
  }
})
```

Apply it to the shell:

```vue
<div
  class="taskbar-lyric-shell"
  :class="{ disabled: !state.enabled, dragging: isDragging }"
  :style="shellStyle"
  @pointerdown="handlePointerDown"
  @contextmenu.prevent="handleContextMenu"
>
```

- [ ] **Step 4: Replace hard-coded colors with CSS variables**

```less
// src/renderer-taskbar-lyric/App.vue
.taskbar-lyric-shell {
  background: var(--taskbar-lyric-bg);
  border: 1px solid var(--taskbar-lyric-border);
}

.title {
  color: var(--taskbar-lyric-font);
}

.separator,
.artist,
.lyric-line {
  color: var(--taskbar-lyric-font-secondary);
}
```

Remove the current fixed dark gradient background and fixed text colors so the new state-driven style is the only source of truth.

- [ ] **Step 5: Verify the taskbar lyric renderer build**

Run: `npm.cmd run build:renderer-taskbar-lyric`

Expected: the floating renderer builds without TypeScript errors around `computed`, helper return types, or style bindings.

- [ ] **Step 6: Commit**

```bash
git add src/renderer-taskbar-lyric/App.vue
git commit -m "支持任务栏歌词颜色渲染"
```

---

### Task 5: Run End-To-End Verification In Development Mode

**Files:**
- Modify: none required unless bugs are found during verification

- [ ] **Step 1: Run lint and all relevant targeted builds one more time**

Run: `npm.cmd run build:renderer`

Expected: PASS

Run: `npm.cmd run build:renderer-taskbar-lyric`

Expected: PASS

Run: `npm.cmd run build:main`

Expected: PASS

Run: `npm.cmd run lint`

Expected: PASS

- [ ] **Step 2: Start the app in development mode**

Run: `npm.cmd run dev`

Expected: the main window and taskbar lyric window compile and open without new build errors.

- [ ] **Step 3: Verify default theme mode behavior**

Manual steps:

1. Enable taskbar lyric.
2. Leave background mode as `主题色`.
3. Leave text mode as `主题色`.
4. Play a song with lyrics.

Expected:

- taskbar lyric renders with theme-following colors
- text remains fully opaque
- width, drag, and right-click menu still work

- [ ] **Step 4: Verify custom background color and opacity behavior**

Manual steps:

1. Switch background mode to `自定义`.
2. Pick a visible custom background color.
3. Move the background opacity slider to `20%`, `72%`, and `100%`.

Expected:

- background color changes immediately
- only the panel background changes transparency
- text remains fully opaque at every opacity value

- [ ] **Step 5: Verify custom text color behavior**

Manual steps:

1. Switch text mode to `自定义`.
2. Pick a bright text color, then a dark text color.

Expected:

- taskbar lyric text updates immediately
- title and secondary text remain readable
- no unintended transparency appears on text

- [ ] **Step 6: Verify persistence and theme switching**

Manual steps:

1. Close and reopen the app.
2. Confirm the last-selected taskbar lyric colors persist.
3. Switch the app theme while both background and text are in `主题色` mode.

Expected:

- saved custom values persist after restart
- theme-mode background and text update with the new theme

- [ ] **Step 7: Leave the tree clean or commit only follow-up fixes**

Run: `git status --short`

Expected: no uncommitted changes if verification required no extra fixes.

---

## Self-Review

### Spec coverage

- Background theme/custom mode: covered by Tasks 1, 2, and 3
- Background-only opacity: covered by Tasks 1, 3, and 4
- Text theme/custom mode: covered by Tasks 1, 2, 3, and 4
- Text stays opaque: covered explicitly in Task 4 and verified in Task 5
- Theme-derived readable colors: covered by Task 4
- Live refresh for open taskbar lyric window: covered by Task 2 and verified in Task 5

### Placeholder scan

- No `TODO`, `TBD`, or “implement later” placeholders remain.
- Every modified file is named explicitly.
- Every verification step includes exact commands or explicit manual steps.

### Type consistency

- Setting keys use one naming scheme: `taskbarLyric.style.*`
- Shared state and main-process state use the same five style fields
- Renderer UI and floating renderer both reference the same setting/state property names

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-21-taskbar-lyric-color-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
