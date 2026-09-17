# Panaceamed Interaction Foundation — Slidable Widgets + Assistive Touch v2

**Date:** 2026-09-17  
**Status:** Approved design direction; implementation not started  
**Base:** `main@2aa72e35592d9616f8d84997c064c571b1bd1304`

## 1. Purpose

Create one coherent interaction foundation for Panaceamed that makes horizontally slidable widgets and the global Assistive Touch command surface feel native, predictable, accessible, mobile-first, and reusable across Home, Your Body, Clinical, and For You.

The implementation must preserve existing capabilities, deep routes, Body Exposure protections, current feature-spectrum theming, and the repository's exact-head CI/PR rules. It must not reintroduce a parallel navigation system or overwrite active Body/clinical runtime ownership.

## 2. Product intent

Panaceamed should behave like one continuous operating surface rather than a collection of disconnected pages. Dense capability must be expressed through compact, visual-first, progressively disclosed interaction patterns.

The interaction foundation therefore has two primary primitives:

1. **Slidable Widget Surface** — a reusable horizontal interaction model for rails, carousels, feature groups, metric strips, and compact mini-app collections.
2. **Assistive Touch v2** — a movable global command orb that exposes high-frequency and route-aware actions without becoming a second competing navigation tree.

The two primitives share gesture semantics, motion policy, accessibility rules, and route/action metadata, but remain independently testable.

## 3. Design principles

- English is the source language for all new interface strings.
- Every visible control must perform a real action or expose a real capability.
- Important capabilities remain reachable within two interactions from Home.
- Main scrolling surfaces remain visual-first; interpretation and long explanations stay behind contextual actions.
- Wide spacing and clear hierarchy are preserved despite high capability density.
- Motion communicates manipulation, state change, spatial continuity, progressive disclosure, or feedback; it is not decorative noise.
- Existing biomedical and Body Exposure safety/provenance boundaries are not weakened.
- No feature deletion is permitted as part of this interaction work.
- No direct push to `main`; short-lived branch + PR + exact-head validation is mandatory.

## 4. Scope

### Included

- shared slidable-widget interaction contract;
- touch swipe, pointer drag, wheel/trackpad, keyboard, and programmatic reveal;
- scroll snapping, edge affordance, active-item reveal, and focus recovery;
- reduced-motion behavior;
- Assistive Touch drag, edge snap, single tap, double tap, long press, four-direction swipe, and configurable command slots;
- route-aware command suggestions;
- safe haptic feedback where browser/platform support exists;
- persisted user preferences for orb position and action mappings;
- integration hooks for Home / Your Body / Clinical / For You;
- deterministic tests for gesture classification, action routing, preference validation, and reduced-motion contracts;
- browser validation at 390x844 when repository tooling supports it.

### Explicitly excluded

- replacing the entire application shell or router;
- deleting or renaming existing feature routes solely for this work;
- rewriting Body Exposure rendering or medical visualization internals;
- introducing autonomous diagnosis, treatment, prescribing, or EMR-signing behavior;
- using generic DOM mutation to rewrite biomedical content;
- decorative infinite motion;
- force-merging stale PR #1737 or copying it wholesale into current `main`.

## 5. Architectural approach

### 5.1 Shared interaction kernel

Create a small shared interaction kernel with pure functions for pointer/gesture interpretation and deterministic state transitions. UI components consume this kernel rather than duplicating thresholds and gesture rules.

Conceptual data flow:

`pointer/touch/keyboard input -> interaction kernel -> semantic gesture/action -> component state -> route or UI action`

The kernel must not know about clinical content, anatomy, or page-specific DOM. It only classifies interaction and produces semantic events.

### 5.2 Slidable Widget primitive

A slidable surface owns only horizontal navigation behavior. Content cards/widgets remain owned by their feature domain.

Expected capabilities:

- native overflow scrolling remains available;
- touch and trackpad use native scrolling where possible;
- mouse/pen drag can translate into horizontal scrolling without blocking ordinary click/tap behavior;
- `scroll-snap-type: x proximity` by default, with opt-in mandatory snapping only when the content benefits from card-by-card paging;
- keyboard support: ArrowLeft/ArrowRight moves to the previous/next focusable item; Home/End reveals the first/last item where appropriate;
- focused/selected items are scrolled into view without disorienting jumps;
- optional edge fades communicate hidden off-screen content without decorative gradients taking visual priority;
- reduced motion uses immediate reveal instead of animated smooth scrolling;
- rails never trap vertical page scrolling on mobile;
- nested interactive controls remain clickable and do not get converted into drag actions.

The primitive exposes semantic state rather than style ownership: current index, can-scroll-left/right, dragging status, and reveal target. Product surfaces remain free to render cards, charts, anatomy selectors, actions, or feature shortcuts.

## 6. Gesture model

### 6.1 Shared thresholds

Gesture thresholds must be centralized and covered by tests. Initial design values:

- tap movement tolerance: **<= 10 px**;
- directional swipe minimum displacement: **>= 38 px**;
- swipe maximum duration: **<= 420 ms**;
- long-press delay: **650 ms**;
- double-tap interval: **<= 280 ms**;
- drag activation: movement > 10 px with sustained pointer movement; Assistive Touch may preserve the existing delayed-drag behavior when it reduces accidental moves.

These values are interaction heuristics, not medical constants. They may be tuned only from usability evidence while preserving deterministic tests.

### 6.2 Conflict resolution

Priority order:

`cancelled pointer > active drag > long press > directional swipe > double tap > single tap`

A gesture may trigger at most one semantic action. Once drag begins, tap/long-press actions are cancelled. Once long press fires, pointer release does not emit a tap.

## 7. Assistive Touch v2

### 7.1 Role

Assistive Touch is a global command accelerator, not a replacement for the primary three-super-page information architecture.

It should be available inside the authenticated application shell and hidden on surfaces where it would interfere with immersive/locked interactions unless that surface explicitly opts in.

### 7.2 Core behavior

- draggable within the visual viewport;
- constrained to safe-area-aware bounds;
- optional snap to nearest horizontal edge;
- persisted position after successful drag;
- configurable size and idle opacity within bounded ranges;
- single tap, double tap, long press, swipe up/down/left/right mappings;
- 4–12 configurable menu actions;
- safe vibration/haptic request when supported and enabled;
- contextual actions determined from route metadata, not scraped visible labels;
- command panel positioned relative to the orb while remaining inside the viewport;
- Escape closes open command surfaces;
- keyboard-accessible activation and focus treatment;
- screen-reader labels describe semantic actions, not gestures alone.

### 7.3 Default mappings

Default mappings are intentionally high-frequency and reversible:

- single tap -> open command menu;
- double tap -> Ask AI;
- long press -> Customize Assistive Touch;
- swipe up -> Search;
- swipe down -> Home;
- swipe left -> Back;
- swipe right -> Messages.

Defaults may be customized by the user and restored without deleting unrelated application preferences.

### 7.4 Command registry

Assistive Touch consumes a typed semantic action registry. Each action has:

- stable ID;
- English label;
- icon token;
- one target type: route, event, or callback capability;
- optional risk/visual tone metadata;
- optional availability predicate.

Clinical and emergency actions remain explicit. Contextual ranking must never silently infer diagnosis, severity, or patient-specific urgency.

## 8. Route-aware context

Route awareness should come from canonical route/action metadata rather than reading arbitrary DOM text.

Examples:

- Your Body / Body Explorer: body state, numbers, labs, relevant learning actions;
- Training: recovery, personal numbers, planning;
- Clinical: Ask AI, records, calculators/labs, drugs/evidence, search;
- For You: messages, account, community, settings, personal tools;
- Home: three super-pages plus universal Ask/Search/Log actions.

The context layer returns suggestions only. It does not mutate clinical state and does not perform autonomous EMR writes.

## 9. Coexistence with current Panaceamed runtime

### 9.1 Preserve Feature Spectrum v48

`public/panacea-feature-spectrum-v48.js` already supplies route-aware palette identity and assistive markers. The new interaction foundation must consume or coexist with those tokens rather than replacing the visual system.

### 9.2 Do not revive stale Command UI v44 as-is

PR #1737 is useful prior art but is stale/non-mergeable against the current repository state. Reusable concepts include gesture mappings, action slots, persisted orb position, edge snap, context actions, and keyboard escape behavior. Its document-level DOM injection strategy is not adopted wholesale.

### 9.3 Body Exposure boundary

Body Exposure and other immersive medical visualization surfaces may opt out of global gesture interception. The interaction foundation must not:

- intercept pointer gestures intended for WebGL orbit/pan/zoom;
- repaint Body controls through a generic global skin;
- scrape anatomical labels to decide actions;
- convert clinical explanatory content into generic UI controls;
- modify anatomy selection state unless a Body-owned integration explicitly invokes a documented action.

## 10. Component boundaries

The implementation plan should preserve these conceptual units even if final filenames follow existing repository conventions.

### A. Interaction kernel

Responsibility: classify pointer sequences and expose deterministic gesture events.

No React, router, DOM querying, or feature-domain knowledge.

### B. Slidable surface controller/component

Responsibility: horizontal scroll state, keyboard navigation, pointer-drag behavior, reveal logic, edge state, and accessibility metadata.

Does not own business content.

### C. Command registry

Responsibility: stable action metadata and action execution interfaces.

Does not render UI.

### D. Route context resolver

Responsibility: map canonical route state to suggested command IDs.

Does not scrape rendered text.

### E. Assistive Touch component

Responsibility: orb rendering, position state, gesture hookup, command-panel presentation, focus management, and preference controls.

Consumes kernel + registry + route context.

### F. Preference persistence

Responsibility: versioned validation/normalization of orb position and Assistive Touch preferences.

Invalid persisted values fall back safely to defaults.

## 11. Motion and accessibility

### Motion

- Use motion only for manipulation/state/spatial continuity/feedback.
- Respect `prefers-reduced-motion` and any existing Panaceamed reduced-motion preference.
- Reduced motion disables animated transform travel and smooth auto-scroll; state changes remain immediate and understandable.
- No infinite pulse/breathe animation is required for Assistive Touch. If an attention state is ever needed, it must be finite, semantic, and dismissible.

### Accessibility

- minimum practical touch target: 44x44 CSS px; prefer 48x48 for primary mobile controls;
- visible focus states;
- meaningful `aria-label` and dialog/menu relationships;
- no hover-only affordances;
- keyboard navigation for slidable surfaces and command panels;
- focus returns to the invoking control after a modal/sheet closes where appropriate;
- scroll affordances do not hide focusable items from assistive technology.

## 12. Persistence and failure behavior

Assistive preferences are local presentation preferences, not clinical data.

Persisted data must be versioned and validated before use. Invalid JSON, unknown action IDs, impossible orb coordinates, undersized menu arrays, invalid opacity, or invalid size values must fail closed to bounded defaults without breaking the application shell.

No interaction failure may block access to the underlying normal navigation. If Assistive Touch fails to initialize, standard product navigation must remain functional.

## 13. Testing strategy

### Deterministic unit/logic tests

Cover at minimum:

- tap vs drag separation;
- single vs double tap;
- long press cancels tap;
- four-direction swipe classification;
- one-pointer-sequence -> at most one semantic action;
- pointer cancel emits no action;
- preference normalization and invalid-storage fallback;
- route context produces only registered action IDs;
- reduced-motion reveal behavior;
- slidable edge-state calculation;
- keyboard previous/next/first/last navigation;
- nested interactive controls do not trigger accidental drag actions.

### Integration/browser checks

At 390x844, verify:

- horizontal widget rails can be swiped without blocking vertical page scroll;
- mouse/trackpad behavior still works on desktop;
- Assistive Touch can be dragged and edge-snapped;
- tap/double tap/long press/swipe actions do not conflict;
- command panel stays within the viewport and safe areas;
- keyboard focus remains visible;
- reduced-motion mode is usable;
- Body/WebGL gestures remain owned by Body when the viewer is active;
- Home, Your Body, Clinical, and For You retain direct access to their real capabilities.

Repository-wide exact-head **Validate pull requests** and complete **Stabilization Acceptance** remain mandatory before merge.

## 14. Rollout strategy

Implementation is split into independently reviewable waves:

1. shared gesture kernel + deterministic tests;
2. slidable surface primitive + targeted integration tests;
3. Assistive Touch action registry/context/persistence;
4. Assistive Touch UI + mobile/keyboard accessibility;
5. integrate high-value rails on Home / Your Body / Clinical / For You;
6. browser validation and exact-head repository gates.

Each wave must be reversible. If another active PR gains ownership of an overlapping file before implementation, refresh from latest `main` and choose a non-overlapping integration point rather than overwriting it.

## 15. Acceptance criteria

The feature is complete only when all of the following are true:

- one reusable slidable interaction model is available to Panaceamed surfaces;
- touch, pointer, keyboard, focus, reduced motion, and native scroll behavior are deterministic and tested;
- Assistive Touch is functional rather than decorative;
- Assistive Touch supports drag/snap, tap, double tap, long press, four directional swipes, configurable menu actions, and route-aware suggestions;
- standard navigation remains usable when Assistive Touch is disabled or fails;
- no feature route is deleted;
- Body Exposure input ownership and WebGL interaction remain intact;
- all new UI text uses English as source text;
- affected mobile surfaces are checked at 390x844 when browser tooling supports it;
- exact current PR head passes required repository gates;
- final merge uses latest-main overlap/ancestry verification and never a force merge.

## 16. Design decision

Proceed with **Approach A: additive Interaction Foundation on latest `main`**.

This approach is preferred over patching stale Command UI v44 because it keeps gesture/action logic reusable and testable while avoiding document-level ownership conflicts. It is preferred over a full shell rewrite because it produces the requested functional interaction model with materially lower overlap risk against the many active Panaceamed feature and Body branches.
