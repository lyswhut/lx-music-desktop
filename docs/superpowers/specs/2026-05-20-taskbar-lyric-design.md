# Taskbar Lyric Design

**Date:** 2026-05-20

**Status:** Proposed

**Goal:** Add a Windows-only taskbar-style lyric bar that visually attaches to the system taskbar on both Windows 10 and Windows 11, using one shared pseudo-embedded implementation instead of separate native and overlay paths.

---

## 1. Decision Summary

This feature will **not** use true Windows taskbar embedding.

Instead, both Windows 10 and Windows 11 will use the same approach:

- create a dedicated lightweight lyric bar window
- keep it visually aligned with the system taskbar
- make it behave like a taskbar-resident strip rather than a normal app window
- reuse existing player and lyric synchronization logic already used by desktop lyric

The product positioning becomes:

> "Taskbar-style lyric bar" rather than "true taskbar plugin."

This trade-off is intentional. It removes the need for Win32 shell extensions, COM integration, native Node modules, and dual maintenance paths while preserving most of the intended user experience.

---

## 2. Why This Approach

### Rejected approach: true taskbar embedding on Windows 10

Windows 10 historically had shell-extension-style paths such as DeskBand/taskbar toolbar integration, but that route is old, poorly aligned with the current Electron architecture, and would introduce:

- native C++/COM code
- packaging and signing complexity
- higher crash/debug risk
- a second platform path to maintain

### Rejected approach: split implementation

The earlier split plan was:

- Windows 10: true embedding
- Windows 11: pseudo embedding

This was rejected because it would force two independent host implementations, two test matrices, and different failure modes for what should be one user-facing feature.

### Selected approach: one pseudo-embedded host for both Windows 10 and 11

This approach gives us:

- one code path
- one UI implementation
- one settings model
- one verification strategy
- easier iteration for future controls, layout improvements, and theming

---

## 3. User Experience

### First version scope

Version 1 only needs to display:

- album cover
- song title
- singer name
- current lyric line

Version 1 does **not** include:

- play/pause/previous/next buttons
- in-bar interaction beyond optional hover behavior
- drag repositioning by the user
- true taskbar injection

### Expected appearance

The lyric bar should look like a compact taskbar widget:

- horizontally arranged
- anchored near the taskbar edge
- visually sized to feel native beside taskbar elements
- hidden from Alt+Tab
- non-focus-stealing during normal playback updates

Suggested default layout:

- left: album cover thumbnail
- center: two text rows
- first row: song title
- second row: current lyric line

Fallback when lyric is unavailable:

- first row: song title
- second row: singer name

### Interaction expectations

- The lyric bar appears when enabled.
- It updates with song and lyric changes in real time.
- It should survive track changes without flicker.
- It should follow taskbar visibility and screen position rules closely enough to feel attached.
- It should never block the main player workflow.

---

## 4. Architecture

The feature should be implemented as a new display layer, not as a modification of the current desktop lyric window.

### 4.1 Main units

#### A. Taskbar lyric service

New main-process module:

- `src/main/modules/taskbarLyric/`

Responsibilities:

- feature lifecycle
- platform gating
- host window creation/destruction
- taskbar position/work-area tracking
- cached lyric-bar state
- synchronization with renderer/player events

#### B. Taskbar lyric renderer

New dedicated renderer target:

- recommended path: `src/renderer-taskbar-lyric/`

Responsibilities:

- render the compact taskbar-style UI
- receive structured playback state from main/renderer bridge
- apply Windows-oriented layout and visual styling
- remain isolated from the existing desktop lyric renderer

This should be separate from `src/renderer-lyric/` because the desktop lyric renderer is optimized for floating lyric presentation, scrolling, and rich lyric styling, not compact taskbar-density presentation.

#### C. Player-to-host bridge

Existing player lyric pipeline already lives in:

- [src/renderer/core/lyric.ts](/d:/src/lx-music-desktop/src/renderer/core/lyric.ts)

The new feature should reuse the existing player state source, but send a smaller, dedicated payload tailored for the taskbar lyric bar.

#### D. Settings and configuration

Configuration changes will live in existing settings/type locations:

- [src/common/defaultSetting.ts](/d:/src/lx-music-desktop/src/common/defaultSetting.ts)
- `src/common/types/app_setting.d.ts`
- taskbar lyric settings UI under renderer settings views
- language files under `src/lang/`

---

## 5. Data Model

The taskbar lyric host should consume a minimal display-oriented state object.

```ts
interface TaskbarLyricState {
  enabled: boolean
  isPlaying: boolean
  songId: string | null
  title: string
  artist: string
  lyricLine: string
  albumCoverUrl: string
}
```

Notes:

- `songId` is used to detect song changes and avoid unnecessary redraw work.
- `lyricLine` is the current active line only, not the full lyric document.
- `albumCoverUrl` can be empty when unavailable.
- The renderer should tolerate incomplete data and show graceful fallbacks.

### Update model

Use one-way state updates:

1. player state changes in renderer
2. taskbar lyric payload is derived from the current playback state
3. payload is sent to main
4. main caches the latest state
5. host window receives push updates

This keeps the host display-only in V1.

---

## 6. Window Behavior

The pseudo-embedded bar should behave like a highly constrained utility window.

### Required characteristics

- frameless
- non-resizable in normal mode
- hidden from Alt+Tab
- skip taskbar entry
- transparent or translucency-capable background as needed
- does not steal focus when updating
- always on top relative to normal windows when enabled

### Positioning strategy

The main process should derive the bar position from taskbar/work-area information rather than storing freeform drag coordinates.

The window should anchor based on:

- detected taskbar edge
- current display
- configured alignment (`right` or `center`)
- configured width
- taskbar auto-hide state if available

Expected behavior:

- if taskbar is at bottom, the bar hugs the bottom edge
- if taskbar is at top/left/right, the bar adapts accordingly
- if monitor scaling changes, the bar recomputes bounds
- if Explorer or display topology changes, the bar repositions

### Multi-display behavior

V1 should target the primary display only.

This keeps the problem bounded and avoids ambiguous placement across secondary taskbars.

---

## 7. Visual Design Rules

The bar should feel intentional and Windows-friendly, but it does not need to mimic every system metric perfectly.

### Design direction

- compact, low-noise layout
- subtle background separation
- readable text at small sizes
- graceful clipping for long song names and lyric lines
- cover art optional but enabled by default

### Suggested style rules

- rounded corners on Windows 11 style path
- slightly tighter geometry on Windows 10 if needed
- semi-opaque dark neutral background by default
- strong contrast for title text
- softer contrast for secondary line when not showing lyric

### Theme relationship

This feature should **not** directly inherit the app theme colors in V1.

Reason:

- taskbar-like presentation is closer to OS chrome than app content
- user theme colors may reduce legibility against desktop/taskbar backgrounds

Instead, V1 should use a constrained visual preset tuned for readability. Future versions can add appearance presets or "follow app theme" as an opt-in.

---

## 8. Settings Design

Add a dedicated settings group rather than reusing `desktopLyric.*`.

Recommended keys:

```ts
'taskbarLyric.enable': boolean
'taskbarLyric.position': 'right' | 'center'
'taskbarLyric.width': number
'taskbarLyric.showCover': boolean
'taskbarLyric.showSongInfo': boolean
'taskbarLyric.showCurrentLine': boolean
```

### Defaults

- disabled by default
- position: `right`
- width: medium preset or fixed default
- show cover: `true`
- show song info: `true`
- show current line: `true`

### Settings UI copy

This should be labeled as Windows-only and experimental.

The settings description should clearly state:

- this feature visually attaches to the taskbar
- it is not a true system taskbar extension
- behavior may vary slightly with taskbar auto-hide, DPI, or multiple monitors

---

## 9. Reuse vs New Code

### Reuse

- playback state source
- lyric line tracking
- album/song metadata source
- app settings persistence
- existing IPC/event patterns

### New code

- taskbar lyric main-process module
- dedicated taskbar lyric renderer
- taskbar position detection and window bounds policy
- taskbar lyric settings group
- taskbar lyric state bridge

### Explicit non-goal

Do not retrofit the existing desktop lyric window to impersonate the taskbar lyric bar.

Reason:

- desktop lyric and taskbar lyric solve different layout problems
- sharing one renderer would add conditionals and reduce maintainability
- taskbar bar should stay simple and bounded

---

## 10. Failure Handling

The app must degrade safely.

If taskbar lyric creation fails:

- the main app must continue running
- desktop lyric must remain unaffected
- the setting should either auto-disable or surface a clear failure state

If taskbar position cannot be determined:

- fall back to bottom-right placement on the primary display

If album cover is unavailable:

- hide the image region or show a generic placeholder

If lyric is unavailable:

- show singer name in the secondary row

---

## 11. Testing Strategy

There is no dedicated automated test suite today, so V1 verification will be mostly manual plus lint.

### Functional checks

- enable/disable taskbar lyric
- switch songs
- pause/resume playback
- update lyric line during playback
- no visible focus stealing
- no taskbar icon or Alt+Tab entry

### Environment checks

- Windows 10
- Windows 11
- 100%, 125%, 150% display scaling
- bottom taskbar
- top/left/right taskbar where supported
- taskbar auto-hide on/off
- Explorer restart recovery

### Regression checks

- existing desktop lyric still works
- tray behavior still works
- normal player operation unaffected

---

## 12. Open Follow-Ups For Later Versions

Not in V1:

- playback control buttons
- progress display
- user drag repositioning
- secondary monitor taskbar targeting
- appearance presets
- "follow app theme" mode

These should remain out of scope until the base windowing behavior is stable.

---

## 13. Implementation Readiness

This design is now narrow enough for one implementation plan.

The next step should be:

1. add the written spec to the repo
2. review and approve the spec
3. write a concrete implementation plan with file-level tasks

