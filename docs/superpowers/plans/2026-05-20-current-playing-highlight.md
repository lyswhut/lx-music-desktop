# Current Playing Highlight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the currently playing song easier to distinguish in song-style lists by adding a theme-driven background highlight.

**Architecture:** Reuse the existing "currently playing" row state already exposed in list views, and strengthen that state in the view-local styles instead of changing shared list selection behavior. Keep the change scoped to views that already know which row is playing so theme switching continues to work automatically.

**Tech Stack:** Vue 3, Electron renderer, Less CSS modules

---

### Task 1: Strengthen current-playing row styling

**Files:**
- Modify: `src/renderer/views/List/MusicList/index.vue`
- Modify: `src/renderer/views/Download/index.vue`

- [ ] **Step 1: Confirm the current-playing class bindings**

Check that the playing row already uses a dedicated module class:

```vue
:class="[{ [$style.active]: playerInfo.isPlayList && playerInfo.playIndex === index }]"
```

and in downloads:

```vue
:class="[{ [$style.active]: playTaskId == item.id }]"
```

- [ ] **Step 2: Update the local active style to add a stronger theme background**

Add a local `.active` rule under each view container so the current-playing row keeps:

```less
background-color: var(--color-primary-light-100-alpha-900);
color: var(--color-button-font);
```

and keep the same background on hover:

```less
&:hover {
  background-color: var(--color-primary-light-100-alpha-900);
}
```

- [ ] **Step 3: Verify the style does not affect selection-only rows**

Leave the shared global list styles unchanged so:
- global `.list-item.active` still means multi-select selection
- local `$style.active` only means "currently playing"

- [ ] **Step 4: Run lint for verification**

Run: `npm.cmd run lint`

Expected: exit code `0`
