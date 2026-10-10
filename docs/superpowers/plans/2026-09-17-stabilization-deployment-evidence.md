# Stabilization and Deployment Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the exact-head Body 3D acceptance gate, merge the integrated stabilization repair without weakening any validator, and verify the resulting backend deployment with commit-linked Render health evidence.

**Architecture:** Keep GitHub as the sole branch/CI/merge authority. Repair the Body product boundary at the `BodyExplorer` component itself so both `/body-exposure` and the standalone `/body-explorer` acceptance route are protected from global v43/v45 DOM runtimes; after exact-head gates pass, merge with an expected head SHA and let Render's existing `main` auto-deploy execute without a second deployment mechanism.

**Tech Stack:** React 18, TypeScript, Vite, deterministic Node test scripts, Playwright Body 3D smoke, GitHub Actions, Render Node service.

**Spec:** `docs/superpowers/specs/2026-09-17-plugin-control-plane-design.md`

## Global Constraints

- GitHub `main` remains the source of truth; never push directly to `main`.
- Every production change uses a short-lived branch and PR.
- Do not weaken validators, Body/WebGL smoke, security checks, or tests to obtain green CI.
- Require exact-current-head Validate changes, complete Stabilization Acceptance, and Body 3D Render Acceptance for the stabilization PR.
- Immediately before merge, re-resolve latest `main`, mergeability, changed-file overlap, and tested head SHA; never force merge.
- Render service `panaceamed-backend` already auto-deploys `main`; do not manually trigger a duplicate deploy after merge.
- Production health evidence is `/api/health`; do not claim deployment solely from a GitHub merge.
- No medical content, anatomy geometry, patient data, clinical inference, or publication claim changes are part of this plan.

---

### Task 1: Guard the standalone Body Explorer product boundary

**Files:**
- Modify: `scripts/uji/body-exposure-foundation-boundary.mts`
- Modify: `src/pages/BodyExplorer.tsx`
- Verify: `src/main.tsx`
- Runtime references: `public/panacea-visual-first-v43.js`, `public/panacea-liquid-actions-v45.js`

**Interfaces:**
- Consumes: v43 opt-out selector `[data-pmd-unclamped="true"]`; v45 opt-out selector `[data-pmd-liquid="off"]`.
- Produces: a standalone `BodyExplorer` root that is a Body product boundary regardless of whether it is nested inside `BodyExposureOS` or opened at `/body-explorer`.

- [ ] **Step 1: Write the failing deterministic guard**

Add the direct-entry assertions to `scripts/uji/body-exposure-foundation-boundary.mts`:

```ts
const explorerPage = readFileSync(resolve('src/pages/BodyExplorer.tsx'), 'utf8')
const routes = readFileSync(resolve('src/main.tsx'), 'utf8')

assert.match(routes, /path="\/body-explorer"\s+element=\{<BodyExplorer \/>\}/,
  'the standalone Body Explorer route remains an accepted entry point and therefore needs its own runtime boundary')
assert.match(explorerPage, /data-pmd-body-exposure="true"/,
  'standalone Body Explorer must declare the same Body product boundary as Body Exposure OS')
assert.match(explorerPage, /data-pmd-unclamped="true"/,
  'standalone Body Explorer must block generic visual-first copy mutation so Body controls cannot open global context dialogs')
assert.match(explorerPage, /data-pmd-liquid="off"/,
  'standalone Body Explorer must block generic liquid-action binding on Body controls')
```

- [ ] **Step 2: Run the guard and verify RED**

Run:

```bash
node --experimental-strip-types scripts/uji/body-exposure-foundation-boundary.mts
```

Expected: FAIL specifically because `src/pages/BodyExplorer.tsx` does not yet contain the standalone Body boundary attributes. The route assertion must pass; a syntax or file-not-found error is not an acceptable RED.

- [ ] **Step 3: Apply the minimal component-level boundary**

Change only the top-level `BodyExplorer` wrapper from:

```tsx
<div className="space-y-4">
```

to:

```tsx
<div
  className="space-y-4"
  data-pmd-body-exposure="true"
  data-pmd-unclamped="true"
  data-pmd-liquid="off"
>
```

Do not change the lesion cases, global v43/v45 runtimes, smoke tests, anatomy content, or route structure.

- [ ] **Step 4: Verify GREEN deterministically**

Run:

```bash
node --experimental-strip-types scripts/uji/body-exposure-foundation-boundary.mts
```

Expected: PASS with the final boundary message. Then run the repository deterministic suite used by the PR workflow.

- [ ] **Step 5: Verify the original browser regression**

Run the same acceptance target that failed:

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
ORGAN3D_QA_URL=http://127.0.0.1:4173/#/body-explorer \
LESI3D_QA_URL=http://127.0.0.1:4173/#/body-explorer \
npm run qa:lesi-3d
```

Expected: the case selector can switch between guided cases without `#pmd-context-dialog` intercepting pointer events, and `qa:lesi-3d` passes without changing the smoke script.

- [ ] **Step 6: Commit the minimal repair**

```bash
git add scripts/uji/body-exposure-foundation-boundary.mts src/pages/BodyExplorer.tsx
git commit -m "fix(body): isolate standalone explorer from global UI runtimes"
```

---

### Task 2: Re-establish exact-head stabilization evidence

**Files:**
- No production file changes expected.
- Read: `.github/workflows/validate-pr.yml`
- Read: `.github/workflows/stabilization-acceptance.yml`
- Read: `.github/workflows/organ-3d-acceptance.yml`

**Interfaces:**
- Consumes: current PR head SHA after Task 1.
- Produces: one exact SHA with successful Validate changes, Stabilization Acceptance, Security Baseline Inventory/Enforcement, and Body 3D Render Acceptance.

- [ ] **Step 1: Resolve the exact current PR head**

Record the SHA from GitHub. Do not use an earlier green run after the branch moves.

- [ ] **Step 2: Inspect every workflow run attached to that SHA**

Required success conclusions:

```text
Validate changes: success
Stabilization Acceptance: success
Body 3D Render Acceptance: success
Security Baseline Inventory: success
Security Baseline Enforcement: success
```

- [ ] **Step 3: If any gate fails, diagnose that exact failure before another push**

Classify it as candidate defect, current-main defect, runner/infrastructure failure, or hidden dependency. Preserve the failing gate's intent; do not patch tests to hide the failure.

- [ ] **Step 4: Update PR documentation with the newly discovered direct-route defect**

The PR body must explicitly state that the original five-path integration exposed a sixth-path boundary gap at `src/pages/BodyExplorer.tsx`, why it was discovered by the real Body acceptance smoke, and which regression guard now prevents recurrence.

---

### Task 3: Perform the latest-main race audit and merge safely

**Files:**
- No source edits expected.

**Interfaces:**
- Consumes: exact green PR head from Task 2; latest `main` SHA.
- Produces: a merge only if the tested head and current-main ancestry remain safe.

- [ ] **Step 1: Re-resolve `main` immediately before merge**

Record latest main SHA and compare it with the PR base/merge base.

- [ ] **Step 2: Compare `main...PR-head` and inspect overlap**

Review changed paths, especially:

```text
scripts/qa/home-widget-theme.test.mjs
scripts/uji/permukaan-tak-terjangkau.mts
scripts/uji/body-exposure-foundation-boundary.mts
src/components/BodyAllSystems3D.tsx
src/pages/BodyExposureOS.tsx
src/pages/BodyExplorer.tsx
.github/workflows/*
```

If main moved into overlapping product or workflow paths, refresh the branch and rerun exact-head gates instead of force-merging.

- [ ] **Step 3: Merge with expected-head protection**

Use the GitHub merge API with `expected_head_sha` equal to the exact green PR head. Do not force, bypass, or merge if GitHub reports the head moved.

- [ ] **Step 4: Verify the resulting `main`**

Resolve `main` again and confirm the merge commit contains the tested PR head.

- [ ] **Step 5: Close superseded baseline PRs only after verification**

Close the PRs explicitly superseded by the integrated repair (currently #1746, #1749, #1752; #1748 is validation-only), with a short note pointing to the verified merged integration. Do not close unrelated feature PRs.

---

### Task 4: Verify Render auto-deployment as evidence, not as a second authority

**Files:**
- Read only unless an actual evidence gap is found: `.github/workflows/render-live-smoke.yml`
- Read: `server/src/index.ts`
- No new deploy workflow by default.

**Interfaces:**
- Consumes: verified merged main SHA; Render service `srv-d8ppfdernols73ej01dg` configured for `main` auto-deploy and `/api/health`.
- Produces: commit-linked deployment evidence plus a successful backend health result.

- [ ] **Step 1: List Render deploys after the merge**

Find the auto-triggered deployment for `panaceamed-backend`. Do not invoke a manual deploy while `autoDeploy=yes` has already reacted to the merge.

- [ ] **Step 2: Verify deployment commit identity**

Confirm the Render deployment points to the merged `main` commit or a descendant that contains it. If commit identity is unavailable, report that limitation rather than inferring deployment from timestamp alone.

- [ ] **Step 3: Verify deployment state and health evidence**

Require a successful/live Render deploy and successful `/api/health` evidence. The existing server route is the production health contract; do not add a second health endpoint.

- [ ] **Step 4: Inspect existing `render-live-smoke.yml` before changing CI**

If the current workflow already provides equivalent health evidence, retain it. Only open a separate PR if a concrete missing invariant is demonstrated, such as no commit correlation or no post-merge health assertion.

- [ ] **Step 5: Record deployment verification without overstating it**

Document:

```text
merged main SHA
Render deploy ID
Render deploy status
health endpoint result/evidence
verification timestamp
```

Do not label implementation as deployed until all four items have direct evidence.

---

## Self-review coverage

- Stabilization blocker is handled before observability work.
- The regression is fixed at the Body product boundary, not in the smoke test or one lesion card.
- Exact-head Validate/Stabilization/Body 3D gates remain authoritative.
- Latest-main race handling and expected-head merge are explicit.
- Render remains an executor after merge; no duplicate deploy mechanism is introduced.
- Deployment and health are separately verified.
- PostHog, MCP, Supabase, and Vercel integration changes are intentionally excluded from this plan and get their own independently reviewable plans/PRs.
