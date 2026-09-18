# Panaceamed UI Anti-AI-Slop Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current AI-template visual grammar on Home/widgets/Assistive Touch with a continuous, direct-manipulation, non-card-soup interface while preserving existing functionality.

**Architecture:** Keep current data sources, routes, widget behavior, and Assistive Touch gesture kernel. Redesign only presentation and interaction composition: HomeHealthBrief becomes an edge-to-edge instrument strip, HomeCommandDeck becomes a search/direct-launch command surface, and Assistive Touch becomes an orb-anchored spatial action fan. Add a deterministic anti-slop source acceptance gate to prevent regression.

**Tech Stack:** React 18, TypeScript, React Router, existing Panacea stroke icon set, Tailwind utility classes where appropriate, focused CSS modules/files, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-17-ui-anti-ai-slop-redesign.md`

## Global Constraints
- Preserve existing health data sources and routes.
- Preserve Assistive Touch drag/tap/double-tap/long-press/swipe behavior.
- Preserve reduced-motion behavior and keyboard/focus fallback.
- No decorative gradient category tiles, nested liquid-glass primary surfaces, generic greeting copy, capability-count badges, or production emoji glyphs in targeted surfaces.
- Primary touch targets remain at least 44px.
- No Body Explorer, backend, clinical algorithm, or patient-state changes.
- Exact-head repository gates must pass before merge.

---

### Task 1: Add deterministic anti-slop acceptance gate

**Files:**
- Create: `scripts/qa/home-anti-slop.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: source files as UTF-8 text.
- Produces: build-gating assertions for the redesigned Home and Assistive Touch visual contract.

- [ ] **Step 1: Write the failing test**

Create a Node test that reads `HomeHealthBrief.tsx`, `HomeCommandDeck.tsx`, and `FabNavigasi.tsx`. Assert that the old anti-pattern markers are absent and the new semantic markers are present:

```js
assert.doesNotMatch(health, /liquid-glass|liquid-spectral-edge|Good morning|Good afternoon|Good evening/)
assert.match(health, /data-panacea-instrument-strip/)
assert.doesNotMatch(deck, /live capabilities|Welcome,|featureSurface\(|bg-gradient-to-/)
assert.match(deck, /data-panacea-command-surface/)
assert.doesNotMatch(fab, /Context commands|⚙/)
assert.match(fab, /data-panacea-assistive-orbit/)
```

- [ ] **Step 2: Register the test in `npm run build`**

Add `scripts/qa/home-anti-slop.test.mjs` to the existing `node --test` build gate.

- [ ] **Step 3: Verify RED**

Run the PR workflow on the exact head. Expected: build/Validate fails because existing production source still contains the old markers and lacks the new semantic markers.

- [ ] **Step 4: Commit**

Commit test/gate only before production code.

---

### Task 2: Replace HomeHealthBrief with an instrument strip

**Files:**
- Modify: `src/components/HomeHealthBrief.tsx`
- Create: `src/styles/home-human-interface.css`
- Modify: `src/pages/HomeSocialWorkspace.tsx`

**Interfaces:**
- Consumes: `getVitals()`, `getWorkouts()`, sleep logs, existing routes.
- Produces: `data-panacea-instrument-strip` edge-to-edge metric rail with direct links.

- [ ] **Step 1: Implement the minimal structure required by the failing acceptance test**

Use a section with `data-panacea-instrument-strip`, one dominant metric, three secondary metrics, and one compact check-in action. Remove greeting, decorative blobs, nested glass containers, and four-button footer.

- [ ] **Step 2: Add focused CSS**

Create `.panacea-human-home`, `.panacea-instrument-strip`, `.panacea-instrument-primary`, `.panacea-instrument-cell`, and responsive horizontal-scroll behavior. Use spacing and hairlines instead of filled cards.

- [ ] **Step 3: Preserve accessibility**

Keep route links, metric labels, tabular numbers, focus-visible treatment, and reduced-motion compatibility.

- [ ] **Step 4: Run build/test**

Expected: health assertions pass; command-surface and Assistive assertions remain RED.

---

### Task 3: Replace HomeCommandDeck gradient mosaic with command surface

**Files:**
- Replace: `src/components/HomeCommandDeck.tsx`
- Modify: `src/styles/home-human-interface.css`

**Interfaces:**
- Consumes: `FITUR_DARI_HUB`, canonical route mapping, user query state.
- Produces: `data-panacea-command-surface`, direct-launch row, domain text switcher, searchable progressive capability index.

- [ ] **Step 1: Keep feature de-duplication and route canonicalization**

Preserve unique destination filtering and the existing redirect normalization.

- [ ] **Step 2: Remove visual categorization as color**

Delete category-specific gradient/glow surface generation. Category/domain remain information architecture only.

- [ ] **Step 3: Build the default calm state**

Show a short label, search field, text-based domain switcher, and a small direct-launch rail. Do not show greeting, avatar initials, capability counts, or marketing badges.

- [ ] **Step 4: Build progressive disclosure**

Only display the full plain-row capability index when search/filter is active or the user explicitly opens it. Each row remains a real link.

- [ ] **Step 5: Run build/test**

Expected: Home health and command-surface anti-slop assertions pass; Assistive Touch assertion remains RED.

---

### Task 4: Replace Assistive Touch command panel with orb-anchored spatial actions

**Files:**
- Modify: `src/components/FabNavigasi.tsx`
- Create: `src/components/AssistiveActionIcon.tsx`
- Modify: `src/styles/home-human-interface.css`

**Interfaces:**
- Consumes: existing `KATALOG_AKSI`, route-aware suggestion IDs, gesture mapping, `SlidableRail` paging.
- Produces: `data-panacea-assistive-orbit` spatial action fan with consistent stroke icons.

- [ ] **Step 1: Add icon mapping**

Map common action IDs to existing stroke icons; use a neutral stroke fallback for unknown route actions. Do not render `AksiFab.ikon` emoji strings in production Assistive Touch.

- [ ] **Step 2: Remove rectangular command panel**

Keep orb as anchor and position each page’s action controls spatially around/along the orb using CSS transforms. Remove panel header, “Context commands” copy, glass rectangle, and visible gear emoji.

- [ ] **Step 3: Preserve paging and gestures**

Keep `SlidableRail`, page navigation, drag, tap, double-tap, long-press, swipe, edge snap, persistence, haptics, and reduced-motion behavior.

- [ ] **Step 4: Run existing Assistive tests plus build**

Expected: anti-slop gate passes and all pre-existing gesture/interaction tests remain green.

---

### Task 5: Remove widget header-box chrome

**Files:**
- Modify: `src/styles/rel-widget-rumah.css`
- Modify only if required: `src/components/Tumpukan.tsx`

**Interfaces:**
- Consumes: existing widget active state and navigation dots.
- Produces: data-first widget board whose outer chrome visually recedes.

- [ ] **Step 1: Remove the light boxed widget header treatment**

Delete the standalone Canvas-colored header background and excess container padding while retaining legibility.

- [ ] **Step 2: Keep direct position dots and swipe behavior**

Do not regress the visible-index/key tracking fixes already implemented.

- [ ] **Step 3: Run widget tests and build**

Expected: existing widget navigation tests and all build gates pass.

---

### Task 6: Exact-head verification

**Files:** none unless a failing gate exposes a scoped regression.

- [ ] **Step 1: Run/inspect exact-head `Validate changes`**
- [ ] **Step 2: Run/inspect exact-head `Stabilization Acceptance`**
- [ ] **Step 3: Run/inspect exact-head `Body 3D Render Acceptance`**
- [ ] **Step 4: Run/inspect both security baseline workflows**
- [ ] **Step 5: Verify PR head is unchanged across all five successful runs**
- [ ] **Step 6: Re-check latest `main` ancestry/overlap before any merge**

No force merge.
