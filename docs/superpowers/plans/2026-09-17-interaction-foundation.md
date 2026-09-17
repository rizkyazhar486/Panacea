# Panaceamed Interaction Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one reusable interaction foundation that powers slidable widget rails and upgrades the existing floating navigation into a functional Assistive Touch v2 without duplicating navigation or interfering with Body/WebGL input ownership.

**Architecture:** Pure interaction logic lives in small framework-agnostic modules. React components consume that logic through a reusable `SlidableRail` and the existing `FabNavigasi`, while `Shell` exposes the global super-page/action rail so Home, Your Body, Clinical, and For You receive the same behavior without editing active-PR-owned hub files. Existing `aksiFab.ts` remains the canonical action catalog and gains validated gesture/persistence metadata rather than being replaced.

**Tech Stack:** React 18, TypeScript 5.5, React Router 6, Tailwind 4, existing Panaceamed deterministic `.mts` test runner, existing browser/CI gates.

**Spec:** `docs/superpowers/specs/2026-09-17-interaction-foundation-design.md`

## Global Constraints

- New user-facing source strings are English.
- Do not delete existing feature routes or capabilities.
- Do not modify Body/WebGL gesture ownership or use global pointer interception over Body Explorer.
- Do not edit `FitnessHub.tsx`, `ClinicalHub.tsx`, or `ForYouHub.tsx` while active PRs #1742/#1745 own overlapping paths; integrate through shared/global surfaces instead.
- No new runtime dependency.
- Standard navigation must remain functional if Assistive Touch fails or is disabled.
- Respect `prefers-reduced-motion` and existing Panaceamed motion preferences.
- No direct push to `main`; short-lived branch + PR + exact-head validation.
- Final merge requires latest-main overlap/ancestry review, exact-head Validate pull requests, and complete Stabilization Acceptance.

---

### Task 1: Deterministic gesture kernel

**Files:**
- Create: `src/lib/interaction/gesture.ts`
- Create: `scripts/uji/interaction-gesture.mts`

**Interfaces:**
- Produces: `GestureThresholds`, `GesturePoint`, `GestureDecision`, `classifyReleasedGesture(input)`, `dominantDirection(dx, dy)`.
- Consumers: `FabNavigasi.tsx` and future pointer-driven surfaces.

- [ ] **Step 1: Write the failing deterministic test**

Test cases must cover: tap <=10 px; swipe >=38 px and <=420 ms; slow movement is not swipe; four swipe directions; long-press flag wins over release classification; drag flag suppresses tap/swipe; cancelled pointer returns `none`; exactly one semantic result per sequence.

```ts
assert.equal(classifyReleasedGesture({ dx: 3, dy: 2, elapsedMs: 120, dragged: false, longPressed: false, cancelled: false }), 'tap')
assert.equal(classifyReleasedGesture({ dx: 44, dy: 8, elapsedMs: 220, dragged: false, longPressed: false, cancelled: false }), 'swipe-right')
assert.equal(classifyReleasedGesture({ dx: 44, dy: 8, elapsedMs: 700, dragged: false, longPressed: false, cancelled: false }), 'none')
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npx tsx scripts/uji/interaction-gesture.mts` when available through the repo runner, otherwise `npm run uji` after the file is registered by auto-discovery.
Expected: FAIL because `src/lib/interaction/gesture.ts` does not exist.

- [ ] **Step 3: Implement the pure kernel**

Use constants from the approved spec:

```ts
export const DEFAULT_GESTURE_THRESHOLDS = {
  tapTolerancePx: 10,
  swipeDistancePx: 38,
  swipeMaxDurationMs: 420,
  longPressMs: 650,
  doubleTapMs: 280,
} as const
```

No DOM, React, router, or clinical imports.

- [ ] **Step 4: Run focused deterministic test**

Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `feat(interaction): add deterministic gesture kernel`

---

### Task 2: Reusable slidable rail state + React primitive

**Files:**
- Create: `src/lib/interaction/slidable.ts`
- Create: `src/components/SlidableRail.tsx`
- Create: `scripts/uji/slidable-rail.mts`

**Interfaces:**
- Produces pure helpers: `edgeState(scrollLeft, clientWidth, scrollWidth, epsilon?)`, `nextIndex(current, count, direction)`, `scrollBehavior(reducedMotion)`.
- Produces React component: `SlidableRail` accepting `ariaLabel`, `children`, optional `mandatorySnap`, optional `className`, and optional `itemClassName`.
- Consumes no feature-domain data.

- [ ] **Step 1: Write failing tests for pure helpers**

```ts
assert.deepEqual(edgeState(0, 300, 900), { canLeft: false, canRight: true })
assert.deepEqual(edgeState(600, 300, 900), { canLeft: true, canRight: false })
assert.equal(nextIndex(1, 4, 'right'), 2)
assert.equal(nextIndex(0, 4, 'left'), 0)
assert.equal(scrollBehavior(true), 'auto')
assert.equal(scrollBehavior(false), 'smooth')
```

- [ ] **Step 2: Run test and verify it fails**

- [ ] **Step 3: Implement pure helpers**

Do not include visual policy in the helper module.

- [ ] **Step 4: Implement `SlidableRail`**

Requirements:
- native horizontal overflow remains primary;
- pointer-drag applies only for mouse/pen and only after >10 px horizontal intent;
- touch remains native scrolling so vertical page scroll is never trapped;
- nested interactive children remain clickable;
- ArrowLeft/ArrowRight/Home/End reveal focusable rail items;
- `scroll-snap-type: x proximity` by default, mandatory only when requested;
- edge fades use `aria-hidden` and do not cover hit targets;
- reduced motion uses `auto` scroll behavior;
- component exposes `data-can-left`, `data-can-right`, `data-dragging` for CSS/QA.

- [ ] **Step 5: Run focused tests and TypeScript build**

Run deterministic test plus `npx tsc -b --pretty false` if local tooling is available; CI remains authoritative.

- [ ] **Step 6: Commit**

Commit: `feat(ui): add reusable slidable rail`

---

### Task 3: Assistive Touch preference and route-context model

**Files:**
- Modify: `src/lib/aksiFab.ts`
- Create: `src/lib/interaction/assistive.ts`
- Create: `scripts/uji/assistive-touch-model.mts`

**Interfaces:**
- Produces `AssistiveGestureMap`, `AssistivePreferences`, `DEFAULT_ASSISTIVE_PREFERENCES`, `normalizeAssistivePreferences(value)`, `contextActionIds(pathname)`, `clampAssistivePosition(position, viewport, size, safeInset?)`.
- `contextActionIds` returns only IDs present in `KATALOG_AKSI`.
- `FabNavigasi` consumes these interfaces in Task 4.

- [ ] **Step 1: Write failing tests**

Cover invalid JSON-equivalent input, unknown action IDs, invalid size/opacity, minimum 4 and maximum 12 visible command actions, safe coordinate clamping, route suggestions for `/`, `/tubuh`/`/fitness-hub`, `/clinical-hub`, Home For You routes, and `/body-explorer` boundary.

- [ ] **Step 2: Run test and verify it fails**

- [ ] **Step 3: Extend `aksiFab.ts` without breaking saved v1 selections**

Preserve `KATALOG_AKSI`, existing IDs, and existing `ambilAksi()` behavior. Add missing high-frequency action IDs only when their routes already exist: messages, profile, records/EMR, recovery, labs/calculators. Do not rename existing IDs.

- [ ] **Step 4: Implement validated preferences and route context**

Defaults:
- single tap: menu;
- double tap: Ask Panacea (`tanya`);
- long press: customize;
- swipe up: search (`cari`);
- swipe down: Home (`beranda`);
- swipe left: Back (`kembali`);
- swipe right: Messages;
- size 56–76 px, default 60;
- idle opacity 0.42–1.0, default 0.46;
- edge snap true;
- haptics true where supported.

- [ ] **Step 5: Run tests**

- [ ] **Step 6: Commit**

Commit: `feat(assistive): add validated preferences and route context`

---

### Task 4: Upgrade existing `FabNavigasi` to Assistive Touch v2

**Files:**
- Modify: `src/components/FabNavigasi.tsx`
- Modify: `src/components/PemilihAksiFab.tsx` only if required for English labels or new gesture mappings.
- Test: `scripts/uji/assistive-touch-component-contract.mts`

**Interfaces:**
- Consumes gesture kernel from Task 1 and assistive model from Task 3.
- Keeps current `FabNavigasi` public props so `Shell.tsx` remains backwards-compatible.

- [ ] **Step 1: Add failing structural contract test**

The contract inspects source/AST text for: shared kernel import, shared preference normalization import, `aria-label="Panacea Assistive Touch"`, single/double/long/swipe mappings, pointercancel path, Body Explorer opt-out, reduced-motion-aware scrolling, and no generic document-wide pointer listener.

- [ ] **Step 2: Refactor pointer handling**

Replace duplicated release classification with `classifyReleasedGesture`. Preserve pointer capture only on the orb. Add long-press timer and double-tap arbitration so one sequence cannot emit both single and double tap.

- [ ] **Step 3: Add gesture action execution**

Route action IDs through existing catalog execution. Add safe `navigator.vibrate?.(9)` guarded by preference and try/catch. Never vibrate during drag move.

- [ ] **Step 4: Add preference-backed size, opacity, edge snap and gesture mapping**

Existing v1 position remains readable; v2 preferences use a separate versioned key. Invalid preferences fall back to defaults.

- [ ] **Step 5: Preserve Body boundary and accessibility**

Keep `/body-explorer` opt-out. Use `aria-haspopup`, `aria-expanded`, semantic menu roles, visible focus, Escape close, and focus return where practical.

- [ ] **Step 6: Replace the command menu's raw snap container with `SlidableRail`**

Keep the 3x3 page layout and page indicators; only the horizontal interaction implementation changes.

- [ ] **Step 7: Run contract + deterministic tests**

- [ ] **Step 8: Commit**

Commit: `feat(assistive): upgrade floating command orb to v2`

---

### Task 5: Global slidable super-page/action rail without hub-file overlap

**Files:**
- Create: `src/components/SuperPageActionRail.tsx`
- Modify: `src/components/Shell.tsx`
- Create: `scripts/uji/superpage-action-rail.mts`

**Interfaces:**
- `SuperPageActionRail` consumes `SlidableRail`, canonical routes, current pathname, and `KATALOG_AKSI` IDs.
- It is rendered only for authenticated patient/doctor/owner shell states.

- [ ] **Step 1: Add failing contract test**

Require four primary destinations: Home, Your Body, Clinical, For You; route-context actions must be real links/actions; rail must use `SlidableRail`; Body Explorer receives either no rail overlay over the canvas or a safe non-overlapping placement.

- [ ] **Step 2: Implement compact rail**

Keep primary visual hierarchy small: one line labels only, 48 px minimum hit targets, no explanatory paragraphs, no permanent multicolor tile wall. Use feature-spectrum CSS variables when available and neutral fallback tokens.

- [ ] **Step 3: Integrate in Shell**

Place the rail below/within the existing sticky header in a way that does not replace sidebar/drawer navigation. It is an accelerator, so if it fails the existing sidebar/header/drawer still work.

Do not edit `FitnessHub.tsx`, `ClinicalHub.tsx`, or `ForYouHub.tsx` while active overlapping PRs remain open.

- [ ] **Step 4: Run contract tests + existing header/nav targeted checks**

Run relevant deterministic QA such as `npm run qa:bilah-atas` where available.

- [ ] **Step 5: Commit**

Commit: `feat(shell): add slidable super-page action rail`

---

### Task 6: Home high-value rail adoption, reduced-motion CSS, and exact-head QA

**Files:**
- Modify: `src/components/HomeCommandDeck.tsx` only if no current active PR changed-file overlap exists at execution time; otherwise skip this file and record the ruling.
- Modify: `src/index.css` only for narrowly scoped `.pmd-slidable-*` / `.pmd-assistive-*` classes if component-local utility classes are insufficient.
- Create: `scripts/uji/interaction-foundation-acceptance.mts`

**Interfaces:**
- Consumes `SlidableRail` from Task 2.
- Acceptance test consumes source files only and makes no medical assertions.

- [ ] **Step 1: Re-check open PR overlap immediately before editing Home**

If any active PR owns `HomeCommandDeck.tsx`, do not edit it. The Shell integration from Task 5 satisfies global availability until that PR resolves.

- [ ] **Step 2: When safe, wrap Home anchor/domain/category horizontal groups in `SlidableRail`**

Do not change feature routing or catalog counts. Preserve existing search/filter behavior.

- [ ] **Step 3: Add reduced-motion and accessibility acceptance checks**

Require: no infinite Assistive Touch pulse; `prefers-reduced-motion` path exists; 44 px minimum target contract; pointer capture remains local to orb/rail; Body Explorer opt-out remains.

- [ ] **Step 4: Run targeted deterministic suite**

Run all new `scripts/uji/*interaction*`, Assistive, slidable, and super-page tests plus relevant existing targeted QA.

- [ ] **Step 5: Run repository build and full deterministic tests**

Run: `npm run uji` and `npm run build`.
Expected: PASS on implementation head. If a pre-existing unrelated failure exists, diagnose and document rather than weakening the gate.

- [ ] **Step 6: Browser acceptance at 390x844**

Verify touch rail behavior, vertical scrolling, orb drag/snap, tap/double/long/swipes, command panel viewport containment, reduced motion, keyboard focus, and Body/WebGL non-interference using repository-supported browser tooling.

- [ ] **Step 7: Final PR and exact-head gates**

Open/update one coherent implementation PR. Require exact-head Validate pull requests and complete Stabilization Acceptance. Re-resolve `main`, compare overlap/ancestry, and never force merge.

- [ ] **Step 8: Commit**

Commit: `test(interaction): add foundation acceptance coverage`

---

## Pre-flight dependency/overlap scan

| Tasks | Shared file/interface | Ruling |
| --- | --- | --- |
| 1 -> 4 | `gesture.ts` consumed by `FabNavigasi` | Sequential interface dependency; Task 1 lands before Task 4. |
| 2 -> 4 | `SlidableRail` consumed by Assistive command pages | Sequential interface dependency; independent from Task 3. |
| 3 -> 4 | assistive preferences/context consumed by `FabNavigasi` | Sequential interface dependency; Task 3 may be developed in parallel with Task 2 after Task 1. |
| 2 -> 5 | `SlidableRail` consumed by shell rail | Task 5 follows Task 2. |
| 3 -> 5 | action IDs/context consumed by shell rail | Task 5 follows Task 3. |
| 4 + 5 | separate files, shared user experience only | Implement independently, then run integrated tests. |
| 5 + 6 | Shell rail guarantees global integration if Home file is blocked | Home edit is optional/conditional on fresh overlap audit. |
| active PRs #1742/#1745 -> 5/6 | hub page ownership | Do not edit their hub files; integrate globally through Shell. |
| stale PR #1737 -> 4/5 | old command UI subsystem | New implementation supersedes concepts, not commits; close #1737 only after replacement PR exists. |

## Plan self-review

- Spec coverage: gesture kernel, slidable rail, Assistive Touch, route context, persistence, reduced motion, accessibility, Body boundary, global super-page integration, and QA are each mapped to a task.
- Placeholder scan: no TBD/TODO/future placeholders.
- Type consistency: Task 4 consumes exact names defined in Tasks 1 and 3; Tasks 4/5 consume `SlidableRail` from Task 2.
- Scope ruling: direct edits to active-owned hub pages are intentionally excluded; Shell-level integration fulfills the product requirement without multi-agent overwrite risk.
