# Lyric Service Refactor Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to carry out this plan in bounded steps.

**Goal:** Make taskbar lyric and desktop lyric continue working without relying on the main renderer window being visible, minimized, or even running the lyric sync loop.

**Core idea:** Move lyric-state production out of `src/renderer/core/lyric.ts` and into a shared lyric service owned outside the main renderer view layer. The main UI, desktop lyric window, and taskbar lyric window should all become consumers of the same state source instead of having the main renderer act as the only producer.

**Why now:** The current “fix” (`backgroundThrottling: false` on the main window) keeps the existing pipeline alive, but it is still a coupling workaround rather than the intended architecture.

---

## Current State

### Today’s dependency chain

1. Playback and lyric parsing run in the main renderer layer.
2. `src/renderer/core/lyric.ts` computes current lyric text and playback-derived state.
3. That renderer code:
   - pushes desktop lyric updates through a `MessagePort`
   - pushes taskbar lyric state through IPC snapshots
4. If the main renderer slows down, both external lyric surfaces are affected.

### Why desktop lyric “looks independent”

Desktop lyric already has its own window and its own always-on-top behavior, but its data source is still the main renderer. It is not yet a truly independent lyric producer.

### Main architectural pain points

- lyric progression is coupled to renderer lifecycle
- external lyric windows depend on a UI window instead of a domain service
- taskbar lyric and desktop lyric use different transport styles for similar data
- future lyric surfaces would repeat the same coupling

---

## Target Architecture

### Desired ownership

Introduce a shared `LyricService` outside the main renderer view layer.

Responsibilities:

- track current playback timing state needed by lyric displays
- parse and maintain current lyric lines
- maintain a canonical “current lyric display state”
- expose updates to multiple consumers

### Consumers

After refactor, these modules should all consume the same lyric state:

- main renderer
- desktop lyric renderer
- taskbar lyric renderer

### Non-goals for the first refactor

- rewriting the audio player stack
- redesigning desktop lyric UI or taskbar lyric UI
- changing lyric file format support
- merging every window onto one transport immediately if it increases risk too much

---

## Recommended Service Placement

### Preferred direction

Use a main-process-owned lyric coordination service, with data fed from the actual playback source through a narrow bridge.

### Why this is the best balance

- main process survives window visibility changes naturally
- both desktop lyric and taskbar lyric are already window features controlled from main process
- subscription and fan-out logic belongs naturally in main process
- later adding more surfaces is straightforward

### Practical constraint

If the real playback clock or parsed lyric source can only be obtained reliably from renderer/player-side code today, phase 1 can use a hybrid bridge:

- renderer/player layer sends only raw playback + lyric source events to the main-process lyric service
- main-process lyric service becomes the only place that computes consumer-facing lyric display state

This still removes view-layer coupling even if a low-level playback bridge remains temporarily.

---

## Proposed Modules

### New or expanded modules

- `src/main/modules/lyricService/index.ts`
  - central service lifecycle
- `src/main/modules/lyricService/state.ts`
  - canonical lyric state
- `src/main/modules/lyricService/channel.ts`
  - subscription / broadcast helpers
- `src/main/modules/lyricService/types.ts`
  - shared service-level types

### Existing modules to integrate

- `src/main/modules/taskbarLyric/*`
- `src/main/modules/winLyric/*`
- `src/main/modules/winMain/rendererEvent/process.ts`
- `src/renderer/core/lyric.ts`
- `src/common/types/taskbar_lyric.d.ts`
- desktop lyric shared type definitions

---

## Refactor Strategy

### Phase 1: Extract a canonical lyric display state

**Objective:** Stop having taskbar lyric own an ad hoc renderer snapshot format.

- [ ] Define a shared lyric-display state type used by both desktop lyric and taskbar lyric consumers.
- [ ] Split fields into:
  - playback-derived fields
  - song metadata
  - display-style fields
  - consumer-local UI fields
- [ ] Keep taskbar-specific style settings separate from the core lyric playback state.

**Deliverable:** One canonical state model for “what lyric surfaces need to know.”

### Phase 2: Introduce main-process lyric service

**Objective:** Create a single service that owns current lyric display state.

- [ ] Add `lyricService` module in main process.
- [ ] Let the service hold:
  - current song identity
  - parsed lyric payload references or normalized lyric lines
  - current play/pause status
  - current time / current line
  - current collector status if needed by taskbar menu
- [ ] Add broadcast hooks for:
  - desktop lyric window
  - taskbar lyric window
  - optional main renderer listeners

**Deliverable:** Main process becomes the source of truth for external lyric surfaces.

### Phase 3: Narrow the renderer bridge

**Objective:** Reduce the main renderer from “full lyric producer” to “event bridge” or remove that dependency where possible.

- [ ] Audit what `src/renderer/core/lyric.ts` currently computes that truly must remain renderer-side.
- [ ] Replace direct taskbar snapshot pushes with service update calls.
- [ ] Replace desktop lyric producer logic with service-fed updates.
- [ ] If the low-level player timing still lives in renderer:
  - send compact timing / song / lyric-source events into `lyricService`
  - do not send fully assembled consumer snapshots anymore

**Deliverable:** Main renderer no longer directly feeds taskbar lyric or desktop lyric UI state.

### Phase 4: Unify desktop lyric and taskbar lyric subscriptions

**Objective:** External lyric windows subscribe to the same service semantics.

- [ ] Keep separate render payloads only where UI needs differ.
- [ ] Share common state emission helpers.
- [ ] Remove duplicated “current lyric line” calculation paths.
- [ ] Ensure both windows can reconnect and request latest state after recreation.

**Deliverable:** Desktop lyric and taskbar lyric become parallel consumers of one service.

### Phase 5: Remove workaround dependencies

**Objective:** Make the current main-window throttling fix non-essential.

- [ ] Verify taskbar lyric still updates when main window is:
  - minimized
  - hidden to tray
  - not focused for long periods
- [ ] Verify desktop lyric also remains correct under the same conditions.
- [ ] Confirm external lyric updates still work after recreating the main window.
- [ ] Re-evaluate whether `backgroundThrottling: false` on the main window is still needed for lyric correctness.

**Deliverable:** External lyric surfaces no longer rely on main renderer staying “awake.”

---

## Data Model Proposal

### Core service state

```ts
interface LyricServiceState {
  songId: string | null
  title: string
  artist: string
  album: string
  albumCoverUrl: string | null
  isPlaying: boolean
  currentTime: number
  currentLine: number
  lyricLine: string
  lyricLines: string[]
  isCollected: boolean
}
```

### Taskbar view state

Keep taskbar-only settings outside the core service:

```ts
interface TaskbarLyricViewState {
  offsetX: number
  showCover: boolean
  showSongInfo: boolean
  showCurrentLine: boolean
  themeColor: string
  backgroundColorMode: 'theme' | 'custom'
  backgroundColor: string
  backgroundOpacity: number
  fontColorMode: 'theme' | 'custom'
  fontColor: string
}
```

### Merge rule

Taskbar renderer should receive:

- core lyric service state
- taskbar view settings from config

Desktop lyric should receive:

- core lyric service state
- desktop lyric config/settings

---

## Transport Plan

### Short-term

Keep existing transports but change their producer:

- desktop lyric can continue using `MessagePort`
- taskbar lyric can continue using its current IPC state push

### Mid-term

Hide transport differences behind main-process adapters:

- `broadcastToDesktopLyric(state)`
- `broadcastToTaskbarLyric(state)`

This lets the service stay transport-agnostic.

---

## Migration Notes

### What should stay in `src/renderer/core/lyric.ts`

Only code that must remain bound to renderer/player APIs, such as:

- access to player-side timing APIs if they are not available elsewhere
- temporary bridge logic during migration

### What should move out

- taskbar lyric snapshot assembly
- external lyric consumer sync ownership
- shared lyric display state ownership

### Compatibility approach

Do not rewrite desktop lyric and taskbar lyric rendering together in one step. Prefer this order:

1. introduce service and duplicate-feed it
2. switch taskbar lyric to service output
3. switch desktop lyric to service output
4. remove old direct producer paths

This reduces regression risk.

---

## Risks

### Risk 1: Playback timing source is still renderer-only

**Impact:** Full independence may need a bridge instead of a pure main-process implementation.

**Mitigation:** Treat renderer timing as an input source, not as the owner of final lyric UI state.

### Risk 2: Desktop lyric regressions during migration

**Impact:** Desktop lyric is mature and easier to break than taskbar lyric.

**Mitigation:** Migrate taskbar lyric first, keep desktop lyric on existing transport until service output is verified.

### Risk 3: Duplicate state during transition

**Impact:** Old and new producers may drift briefly.

**Mitigation:** Mark one source authoritative per consumer at each migration step, and delete old sync paths quickly after cutover.

### Risk 4: Theme / collect status ownership becomes unclear

**Impact:** UI metadata may still leak back into the lyric service.

**Mitigation:** Keep domain state and view-state separate from the beginning.

---

## Verification Plan

### Functional checks

- [ ] Taskbar lyric updates while main interface is visible
- [ ] Taskbar lyric updates while main interface is minimized
- [ ] Taskbar lyric updates while main interface is hidden to tray
- [ ] Desktop lyric updates under the same three states
- [ ] Theme switching still updates taskbar lyric colors
- [ ] Collect status still updates taskbar right-click menu
- [ ] Recreating either lyric window restores the latest state correctly

### Build checks

- [ ] `npm.cmd run build:main`
- [ ] `npm.cmd run build:renderer`
- [ ] `npm.cmd run build:renderer-lyric`
- [ ] `npm.cmd run build:renderer-taskbar-lyric`
- [ ] `npm.cmd run lint`

---

## Recommended Execution Order

### Milestone 1

Create shared lyric service types and main-process service shell.

### Milestone 2

Feed the service from the existing renderer lyric pipeline without changing consumers yet.

### Milestone 3

Switch taskbar lyric to service-owned state.

### Milestone 4

Switch desktop lyric to service-owned state.

### Milestone 5

Delete legacy direct producer logic and re-verify hidden/minimized behavior.

---

## Decision Summary

This refactor should not be treated as “make taskbar lyric special.” It should be treated as:

**“Introduce one shared lyric service so every lyric surface stops depending on the main interface renderer lifecycle.”**

That is the cleanest path, the most extensible path, and the one least likely to create another round of coupling bugs later.
