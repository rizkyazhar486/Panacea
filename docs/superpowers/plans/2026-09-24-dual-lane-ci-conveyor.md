# Dual-Lane Continuous Integration Conveyor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a safe two-lane Panacea integration conveyor that detects overlap before implementation, blocks known-red work before remote CI, reacts immediately to green CI, safely syncs stale branches without force-push, and measures whether validated integrations are approaching 2/hour.

**Architecture:** Keep product code untouched. Add a small Node 24 ESM orchestration layer under `scripts/conveyor/`, deterministic tests under `scripts/uji/`, and one opt-in GitHub Actions workflow for branches named `conveyor/a/*` or `conveyor/b/*`. Remote scope locks use temporary Git refs so reservations do not mutate `main`; PR metadata carries the base SHA and timing fields needed for exact-head/stale-main decisions and metrics.

**Tech Stack:** Node.js 24 ESM, built-in `fetch`, `node:crypto`, `node:child_process`, existing `npm run build` / `npm run uji`, GitHub REST API, GitHub CLI available on GitHub-hosted runners, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-24-dual-lane-ci-conveyor-design.md`

## Global Constraints

- Preserve `AGENTS.md`, `CLAUDE.md`, and `PANACEA_CONSTITUTION.md` authority.
- Never force-push, rewrite shared history, or overwrite a newer `main`.
- Never remove or bypass meaningful validation to improve throughput.
- Existing required gates remain authoritative: `Validate changes`, `Stabilization Acceptance`, `Body 3D Render Acceptance`, `Security Baseline Inventory`, and `Security Baseline Enforcement`.
- Only same-repository owner-authorized conveyor PRs may be auto-integrated.
- Product source files are out of scope for this implementation.
- Node version for new conveyor tooling is 24, matching active validation workflows.
- Direct-main remains allowed by repository policy; automated event-driven merge applies only to opt-in conveyor PR branches.
- Throughput is measured as validated integrations, not artificial micro-PR count.

## Review Focus

1. **Concurrent reservation race:** two workers request the same task or exact file scope at nearly the same time; exactly one must acquire the corresponding lock ref.
2. **Main moves after CI turns green:** the candidate must sync current `main` non-destructively and rerun CI rather than merge stale validation.
3. **Workflow-run privilege boundary:** a fork PR, draft PR, non-owner PR, or non-conveyor branch must never reach merge/sync side effects.
4. **Duplicate/old workflow runs:** readiness must use required workflow results for the exact current PR head SHA and must not accept stale green runs.
5. **Crash/stale reservation:** a lock must remain inspectable and explicitly releasable without editing `main`; automatic force deletion is forbidden.

---

## File structure

Create:
- `scripts/conveyor/model.mjs` — pure state, metadata, scope, workflow-readiness, and metrics functions.
- `scripts/conveyor/github-api.mjs` — small authenticated GitHub REST adapter with injectable `fetch`.
- `scripts/conveyor/reserve.mjs` — acquire/release/inspect task + file-scope lock refs.
- `scripts/conveyor/preflight.mjs` — choose and execute local validation commands from touched paths.
- `scripts/conveyor/open-pr.mjs` — open an opt-in PR with machine-readable conveyor metadata after local green.
- `scripts/conveyor/auto-integrate.mjs` — exact-head readiness, stale-main sync, overlap block, and merge side effects.
- `scripts/conveyor/metrics.mjs` — calculate throughput, green-to-merge, lead time, and waste from conveyor PR history.
- `.github/workflows/conveyor-auto-integrate.yml` — event-driven workflow-run listener.
- `scripts/uji/conveyor-model.mts`
- `scripts/uji/conveyor-reservation.mts`
- `scripts/uji/conveyor-integration-decision.mts`
- `scripts/uji/conveyor-workflow-policy.mts`
- `scripts/uji/conveyor-metrics.mts`

Modify:
- `package.json` — add conveyor commands only; do not change existing scripts.
- `AGENTS.md` — short operational contract for two-lane conveyor use.
- `CLAUDE.md` — same model-agnostic usage contract for Claude Code.

---

### Task 1: Pure conveyor model and metadata contract

**Files:**
- Create: `scripts/conveyor/model.mjs`
- Create: `scripts/uji/conveyor-model.mts`

**Interfaces:**
- Produces:
  - `REQUIRED_WORKFLOWS: readonly string[]`
  - `normalizeScope(paths: string[]): string[]`
  - `scopesOverlap(a: string[], b: string[]): boolean`
  - `formatMetadata(meta): string`
  - `parseMetadata(body: string): ConveyorMetadata | null`
  - `latestWorkflowStates(runs, headSha): Map<string,string>`
  - `decideIntegration(input): { action, reason }`
- Consumes: none.

- [ ] **Step 1: Write failing model tests**

Create `scripts/uji/conveyor-model.mts` with direct assertions:

```ts
import assert from 'node:assert/strict'
import {
  REQUIRED_WORKFLOWS,
  normalizeScope,
  scopesOverlap,
  formatMetadata,
  parseMetadata,
  latestWorkflowStates,
  decideIntegration,
} from '../conveyor/model.mjs'

assert.deepEqual(normalizeScope(['./src/x.ts', 'src/x.ts', 'server/../server/a.ts']), [
  'server/a.ts',
  'src/x.ts',
])
assert.equal(scopesOverlap(['src/lib/a.ts'], ['src/lib/a.ts']), true)
assert.equal(scopesOverlap(['src/lib/a.ts'], ['src/lib/b.ts']), false)

const body = formatMetadata({
  version: 1,
  lane: 'A',
  task: 'lung-boundary',
  base_sha: 'base1',
  reserved_at: '2026-09-24T00:00:00.000Z',
  local_green_at: '2026-09-24T00:10:00.000Z',
  scope: ['src/lib/a.ts'],
})
assert.equal(parseMetadata(body)?.base_sha, 'base1')

const runs = REQUIRED_WORKFLOWS.flatMap((name, i) => [
  { name, head_sha: 'old', conclusion: 'success', created_at: `2026-09-24T00:0${i}:00Z` },
  { name, head_sha: 'head1', conclusion: 'success', created_at: `2026-09-24T01:0${i}:00Z` },
])
assert.equal(latestWorkflowStates(runs, 'head1').size, REQUIRED_WORKFLOWS.length)

assert.equal(decideIntegration({
  trusted: true,
  draft: false,
  branch: 'conveyor/a/test',
  metadata: parseMetadata(body),
  headSha: 'head1',
  currentMainSha: 'base1',
  workflowRuns: runs,
  prFiles: ['src/lib/a.ts'],
  mainFilesSinceBase: [],
}).action, 'MERGE')
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
node --experimental-transform-types scripts/uji/conveyor-model.mts
```

Expected: fail with module-not-found for `scripts/conveyor/model.mjs`.

- [ ] **Step 3: Implement the minimal pure model**

Create `scripts/conveyor/model.mjs` with these exact rules:

```js
import path from 'node:path'

export const REQUIRED_WORKFLOWS = Object.freeze([
  'Validate changes',
  'Stabilization Acceptance',
  'Body 3D Render Acceptance',
  'Security Baseline Inventory',
  'Security Baseline Enforcement',
])

export function normalizeScope(paths) {
  return [...new Set(paths.map((p) => path.posix.normalize(p.replaceAll('\\', '/')).replace(/^\.\//, '')))]
    .filter(Boolean)
    .sort()
}

export function scopesOverlap(a, b) {
  const left = new Set(normalizeScope(a))
  return normalizeScope(b).some((p) => left.has(p))
}

const START = '<!-- panacea-conveyor:v1'
const END = 'panacea-conveyor:end -->'

export function formatMetadata(meta) {
  const payload = JSON.stringify({ ...meta, scope: normalizeScope(meta.scope ?? []) })
  return `${START}\n${payload}\n${END}`
}

export function parseMetadata(body = '') {
  const start = body.indexOf(START)
  const end = body.indexOf(END)
  if (start < 0 || end < 0 || end <= start) return null
  const json = body.slice(start + START.length, end).trim()
  try { return JSON.parse(json) } catch { return null }
}

export function latestWorkflowStates(runs, headSha) {
  const latest = new Map()
  for (const run of runs.filter((r) => r.head_sha === headSha)) {
    const previous = latest.get(run.name)
    if (!previous || Date.parse(run.created_at) > Date.parse(previous.created_at)) {
      latest.set(run.name, run)
    }
  }
  return new Map([...latest].map(([name, run]) => [name, run.conclusion]))
}

export function decideIntegration({
  trusted, draft, branch, metadata, headSha, currentMainSha,
  workflowRuns, prFiles, mainFilesSinceBase,
}) {
  if (!trusted) return { action: 'BLOCK_UNTRUSTED', reason: 'untrusted PR source or author' }
  if (draft) return { action: 'WAIT', reason: 'draft PR' }
  if (!/^conveyor\/[ab]\//.test(branch)) return { action: 'BLOCK_UNTRUSTED', reason: 'non-conveyor branch' }
  if (!metadata) return { action: 'BLOCK_METADATA', reason: 'missing conveyor metadata' }

  if (metadata.base_sha !== currentMainSha) {
    if (scopesOverlap(prFiles, mainFilesSinceBase)) {
      return { action: 'BLOCK_OVERLAP', reason: 'main changed overlapping files' }
    }
    return { action: 'SYNC_MAIN', reason: 'main advanced without file overlap' }
  }

  const states = latestWorkflowStates(workflowRuns, headSha)
  const missing = REQUIRED_WORKFLOWS.filter((name) => states.get(name) !== 'success')
  if (missing.length) return { action: 'WAIT', reason: `required workflows not green: ${missing.join(', ')}` }
  return { action: 'MERGE', reason: 'exact head and required workflows green' }
}
```

- [ ] **Step 4: Run model tests**

Run:

```bash
node --experimental-transform-types scripts/uji/conveyor-model.mts
```

Expected: exit 0.

- [ ] **Step 5: Verify repository-wide deterministic tests still discover the new test**

Run:

```bash
npm run uji
```

Expected: `conveyor-model.mts` appears in the runner and all files pass.

- [ ] **Step 6: Commit**

```bash
git add scripts/conveyor/model.mjs scripts/uji/conveyor-model.mts
git commit -m "feat(ci): add conveyor decision model"
```

---

### Task 2: Atomic task/file reservations with temporary Git refs

**Files:**
- Create: `scripts/conveyor/github-api.mjs`
- Create: `scripts/conveyor/reserve.mjs`
- Create: `scripts/uji/conveyor-reservation.mts`

**Interfaces:**
- Consumes: `normalizeScope()` from Task 1.
- Produces:
  - `lockKeys(task, scope): string[]`
  - `lockRefForKey(key): string`
  - `acquireReservation(adapter, input)`
  - `releaseReservation(adapter, reservation)`
  - REST methods `getMainSha()`, `createRef()`, `deleteRef()`, `listRefs()`.

- [ ] **Step 1: Write failing reservation tests**

Use an in-memory fake adapter and assert atomic rollback:

```ts
import assert from 'node:assert/strict'
import {
  lockKeys,
  lockRefForKey,
  acquireReservation,
  releaseReservation,
} from '../conveyor/reserve.mjs'

const refs = new Map()
const adapter = {
  async createRef(ref, sha) {
    if (refs.has(ref)) {
      const e = new Error('ref exists')
      ;(e as any).status = 422
      throw e
    }
    refs.set(ref, sha)
  },
  async deleteRef(ref) { refs.delete(ref) },
}

const keys = lockKeys('lung-boundary', ['src/lib/lung.ts', 'scripts/uji/lung.mts'])
assert.equal(keys.length, 3)
assert.match(lockRefForKey(keys[0]), /^refs\/heads\/conveyor-lock\//)

const first = await acquireReservation(adapter, {
  lane: 'A',
  task: 'lung-boundary',
  scope: ['src/lib/lung.ts'],
  baseSha: 'abc',
  now: () => '2026-09-24T00:00:00.000Z',
})
await assert.rejects(
  acquireReservation(adapter, {
    lane: 'B', task: 'lung-boundary', scope: ['src/lib/lung.ts'],
    baseSha: 'abc', now: () => '2026-09-24T00:01:00.000Z',
  }),
  /reservation conflict/,
)
await releaseReservation(adapter, first)
assert.equal(refs.size, 0)
```

- [ ] **Step 2: Run and confirm failure**

```bash
node --experimental-transform-types scripts/uji/conveyor-reservation.mts
```

Expected: module-not-found.

- [ ] **Step 3: Implement deterministic lock keys**

In `reserve.mjs`:
- task key: `task:<normalized-task>`
- exact file key: `path:<normalized-path>`
- SHA-256 each key and use first 24 hex chars.
- fixed ref name `refs/heads/conveyor-lock/<hash>`.
- acquire sorted refs sequentially; if any create returns 422, delete only refs acquired in this attempt and throw `reservation conflict`.
- return reservation object with `lane`, `task`, `scope`, `base_sha`, `reserved_at`, and `lock_refs`.
- release deletes only listed lock refs; ignore 404, surface other errors.

Core implementation:

```js
import { createHash } from 'node:crypto'
import { normalizeScope } from './model.mjs'

export function lockKeys(task, scope) {
  const normalizedTask = task.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-')
  return [`task:${normalizedTask}`, ...normalizeScope(scope).map((p) => `path:${p}`)].sort()
}

export function lockRefForKey(key) {
  const hash = createHash('sha256').update(key).digest('hex').slice(0, 24)
  return `refs/heads/conveyor-lock/${hash}`
}
```

- [ ] **Step 4: Implement GitHub REST adapter**

`github-api.mjs` must:
- require `GITHUB_TOKEN` or `GH_TOKEN`;
- require `GITHUB_REPOSITORY` or explicit `--repo owner/name`;
- send `Accept: application/vnd.github+json`;
- expose status code on errors;
- never log tokens.

- [ ] **Step 5: Add CLI modes without hidden writes**

`reserve.mjs` CLI:
- `reserve --lane A --task <slug> --scope path1,path2`
- `release --state <json-file>`
- `inspect`

`reserve` writes local state only to `.git/panacea-conveyor/<task>.json` after all remote refs are acquired. It must not modify tracked repository files.

- [ ] **Step 6: Run tests**

```bash
node --experimental-transform-types scripts/uji/conveyor-reservation.mts
npm run uji
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add scripts/conveyor/github-api.mjs scripts/conveyor/reserve.mjs scripts/uji/conveyor-reservation.mts
git commit -m "feat(ci): add conveyor scope reservations"
```

---

### Task 3: Preflight gate and PR metadata creation

**Files:**
- Create: `scripts/conveyor/preflight.mjs`
- Create: `scripts/conveyor/open-pr.mjs`
- Create: `scripts/uji/conveyor-preflight.mts`
- Modify: `package.json`

**Interfaces:**
- Consumes: reservation state from Task 2; `formatMetadata()` from Task 1.
- Produces:
  - `preflightCommands(paths, targetedCommands): CommandSpec[]`
  - `runPreflight(...): { local_green_at, commands }`
  - opt-in PR branch/body convention.

- [ ] **Step 1: Write failing preflight tests**

Test command selection:
- root-only scope => root build + root deterministic tests;
- `server/**` scope => add server install/typecheck/build/tests;
- explicit targeted command is appended;
- duplicate commands are removed while preserving order.

Example:

```ts
import assert from 'node:assert/strict'
import { preflightCommands } from '../conveyor/preflight.mjs'

assert.deepEqual(
  preflightCommands(['src/lib/x.ts'], []),
  [
    ['npm', ['run', 'build']],
    ['npm', ['run', 'uji']],
  ],
)

assert.equal(
  preflightCommands(['server/src/x.ts'], []).some(([cmd, args]) =>
    cmd === 'npm' && args.join(' ') === 'run typecheck --prefix server'
  ),
  true,
)
```

- [ ] **Step 2: Run and verify failure**

```bash
node --experimental-transform-types scripts/uji/conveyor-preflight.mts
```

- [ ] **Step 3: Implement preflight**

Rules:
- assume dependency installation already exists in active worktree; do not run `npm ci` on every cycle unless `package-lock.json` or `server/package-lock.json` changed.
- always run root `npm run build` and `npm run uji`.
- if root lockfile changed, prepend `npm ci`.
- if any `server/**` path changed, add server typecheck/build/uji; prepend server `npm ci` only when server lockfile changed.
- execute with `spawnSync`, `stdio: inherit`, stop on first non-zero result.
- no PR creation when preflight is red.

- [ ] **Step 4: Implement `open-pr.mjs`**

Require:
- reservation state file;
- current branch matches `conveyor/a/*` or `conveyor/b/*`;
- `local_green_at` exists;
- current `main` SHA equals reservation `base_sha` before opening PR. If not equal, exit with `main advanced; sync and rerun preflight`.
- PR body appends `formatMetadata(reservation + local_green_at)`.
- use `gh pr create --base main --head <branch> --title ... --body-file ...`.
- never create a draft automatically; readiness requires an explicit ready PR.

- [ ] **Step 5: Add package scripts**

Add only:

```json
"conveyor:reserve": "node scripts/conveyor/reserve.mjs reserve",
"conveyor:release": "node scripts/conveyor/reserve.mjs release",
"conveyor:preflight": "node scripts/conveyor/preflight.mjs",
"conveyor:open-pr": "node scripts/conveyor/open-pr.mjs",
"conveyor:metrics": "node scripts/conveyor/metrics.mjs"
```

Do not reorder or remove existing scripts.

- [ ] **Step 6: Run targeted and repository tests**

```bash
node --experimental-transform-types scripts/uji/conveyor-preflight.mts
npm run build
npm run uji
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add scripts/conveyor/preflight.mjs scripts/conveyor/open-pr.mjs scripts/uji/conveyor-preflight.mts package.json
git commit -m "feat(ci): add conveyor preflight and PR metadata"
```

---

### Task 4: Exact-head readiness and stale-main decision engine

**Files:**
- Create: `scripts/conveyor/auto-integrate.mjs`
- Create: `scripts/uji/conveyor-integration-decision.mts`

**Interfaces:**
- Consumes: `decideIntegration()`, `parseMetadata()`, REST adapter.
- Produces:
  - `loadCandidate(prNumber)`
  - `mainFilesSince(baseSha, currentMainSha)`
  - `syncMainWithoutRewrite(candidate)`
  - `mergeExpectedHead(candidate)`.

- [ ] **Step 1: Extend pure decision tests before side effects**

Cover all required branches:

```ts
assert.equal(decideIntegration({ ...base, trusted: false }).action, 'BLOCK_UNTRUSTED')
assert.equal(decideIntegration({ ...base, draft: true }).action, 'WAIT')
assert.equal(decideIntegration({
  ...base,
  metadata: { ...base.metadata, base_sha: 'old' },
  currentMainSha: 'new',
  prFiles: ['src/a.ts'],
  mainFilesSinceBase: ['src/b.ts'],
}).action, 'SYNC_MAIN')
assert.equal(decideIntegration({
  ...base,
  metadata: { ...base.metadata, base_sha: 'old' },
  currentMainSha: 'new',
  prFiles: ['src/a.ts'],
  mainFilesSinceBase: ['src/a.ts'],
}).action, 'BLOCK_OVERLAP')
assert.equal(decideIntegration({
  ...base,
  workflowRuns: [],
}).action, 'WAIT')
```

- [ ] **Step 2: Implement trusted-candidate rules**

`trusted === true` only when all hold:
- `pr.head.repo.full_name === GITHUB_REPOSITORY`;
- `pr.author_association === 'OWNER'`;
- branch matches `^conveyor/[ab]/`;
- metadata parses successfully;
- metadata lane matches branch lane.

Forks, bots, collaborators, members, drafts, and ordinary branches do not get write side effects in v1.

- [ ] **Step 3: Implement exact workflow-run gathering**

Fetch:
`GET /repos/{repo}/actions/runs?head_sha={exact-head}&event=pull_request&per_page=100`

Use `latestWorkflowStates()`; do not accept a success belonging to another SHA.

- [ ] **Step 4: Implement stale-main overlap audit**

When metadata `base_sha != current main`:
- fetch `GET /repos/{repo}/compare/{base_sha}...{currentMainSha}`;
- collect changed filenames from `files[].filename`;
- fetch PR files;
- if any exact filename intersects, stop with `BLOCK_OVERLAP`;
- otherwise `SYNC_MAIN`.

This first version is intentionally conservative: same-file changes serialize even when hunks might technically merge.

- [ ] **Step 5: Implement non-force sync**

For `SYNC_MAIN`:
1. `git fetch origin main`
2. verify `git rev-parse origin/main` equals the API `currentMainSha`;
3. `git merge --no-edit origin/main`;
4. `git push origin HEAD:<pr.head.ref>` without `--force`;
5. update only the conveyor metadata block in PR body so `base_sha=currentMainSha`;
6. exit successfully without merging; new head CI must run again.

If push is rejected because the remote head changed, exit blocked and let the next run re-evaluate; never force.

- [ ] **Step 6: Implement expected-head merge**

For `MERGE`:
- re-fetch PR immediately;
- require current PR head SHA still equals the evaluated head;
- re-fetch `main`; if it changed after decision, restart decision rather than merge;
- run:

```bash
gh pr merge "$PR_NUMBER" --merge --match-head-commit "$HEAD_SHA"
```

No admin bypass, no force, no deletion of another worker's branch.

- [ ] **Step 7: Run tests**

```bash
node --experimental-transform-types scripts/uji/conveyor-integration-decision.mts
npm run uji
```

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add scripts/conveyor/auto-integrate.mjs scripts/uji/conveyor-integration-decision.mts scripts/conveyor/model.mjs
git commit -m "feat(ci): add exact-head conveyor integration engine"
```

---

### Task 5: Event-driven GitHub Actions integration

**Files:**
- Create: `.github/workflows/conveyor-auto-integrate.yml`
- Create: `scripts/uji/conveyor-workflow-policy.mts`

**Interfaces:**
- Consumes: `scripts/conveyor/auto-integrate.mjs`.
- Produces: automatic reevaluation whenever one of the five required workflows completes.

- [ ] **Step 1: Write workflow policy test first**

The test reads the YAML as text and asserts:
- trigger is `workflow_run`;
- all five required workflow names appear;
- `types: [completed]` appears;
- permissions include `contents: write` and `pull-requests: write`;
- workflow calls `node scripts/conveyor/auto-integrate.mjs`;
- no `--force`, `--admin`, `git push -f`, or `--delete-branch` appears;
- job has a same-repository pull-request guard.

- [ ] **Step 2: Run and verify failure**

```bash
node --experimental-transform-types scripts/uji/conveyor-workflow-policy.mts
```

- [ ] **Step 3: Create workflow**

Use:

```yaml
name: Conveyor Auto Integrate

on:
  workflow_run:
    workflows:
      - Validate changes
      - Stabilization Acceptance
      - Body 3D Render Acceptance
      - Security Baseline Inventory
      - Security Baseline Enforcement
    types: [completed]

permissions:
  contents: write
  pull-requests: write
  actions: read

concurrency:
  group: conveyor-pr-${{ github.event.workflow_run.pull_requests[0].number || github.run_id }}
  cancel-in-progress: true

jobs:
  evaluate:
    if: >
      github.event.workflow_run.event == 'pull_request' &&
      github.event.workflow_run.pull_requests[0].number != null &&
      github.event.workflow_run.head_repository.full_name == github.repository
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          ref: ${{ github.event.workflow_run.pull_requests[0].head.ref }}
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - name: Configure sync identity
        run: |
          git config user.name "panacea-conveyor"
          git config user.email "panacea-conveyor@users.noreply.github.com"
      - name: Evaluate exact-head integration
        env:
          GH_TOKEN: ${{ github.token }}
          GITHUB_TOKEN: ${{ github.token }}
          PR_NUMBER: ${{ github.event.workflow_run.pull_requests[0].number }}
        run: node scripts/conveyor/auto-integrate.mjs
```

- [ ] **Step 4: Run policy + full deterministic tests**

```bash
node --experimental-transform-types scripts/uji/conveyor-workflow-policy.mts
npm run uji
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/conveyor-auto-integrate.yml scripts/uji/conveyor-workflow-policy.mts
git commit -m "ci: add event-driven conveyor integration"
```

---

### Task 6: Throughput and waste telemetry

**Files:**
- Create: `scripts/conveyor/metrics.mjs`
- Create: `scripts/uji/conveyor-metrics.mts`

**Interfaces:**
- Consumes: conveyor metadata and required workflow list.
- Produces:
  - `computeMetrics(records)`
  - CLI JSON report over a requested time window.

- [ ] **Step 1: Write deterministic metrics test**

Use four synthetic integrations:

```ts
import assert from 'node:assert/strict'
import { computeMetrics } from '../conveyor/metrics.mjs'

const m = computeMetrics([
  { reserved_at:'2026-09-24T00:00:00Z', ci_green_at:'2026-09-24T00:20:00Z', integrated_at:'2026-09-24T00:24:00Z' },
  { reserved_at:'2026-09-24T00:20:00Z', ci_green_at:'2026-09-24T00:42:00Z', integrated_at:'2026-09-24T00:45:00Z' },
  { reserved_at:'2026-09-24T00:40:00Z', ci_green_at:'2026-09-24T01:05:00Z', integrated_at:'2026-09-24T01:09:00Z' },
  { reserved_at:'2026-09-24T01:00:00Z', aborted_at:'2026-09-24T01:02:00Z' },
])
assert.equal(m.validated_integrations, 3)
assert.equal(m.aborted_or_superseded, 1)
assert.equal(m.waste_rate, 0.25)
assert.ok(m.median_green_to_integration_minutes <= 4)
```

- [ ] **Step 2: Implement metrics functions**

Formulae:

```text
LeadTime = integrated_at - reserved_at
GreenToMerge = integrated_at - ci_green_at
WasteRate = (aborted + superseded) / started
IntegrationThroughput = validated_integrations / elapsed_hours
```

Median must be true numeric median, not average.

- [ ] **Step 3: Implement GitHub-backed CLI**

`metrics.mjs --since <ISO> --until <ISO>`:
- list closed PRs in time window;
- keep branches matching `conveyor/[ab]/`;
- parse metadata;
- for merged PRs fetch exact-head workflow runs and set `ci_green_at` to the latest completion time among the five required successful workflows;
- use `merged_at` as `integrated_at`;
- closed-unmerged conveyor PR => `aborted_at=closed_at`;
- output JSON and a compact text summary.

No write permissions.

- [ ] **Step 4: Run tests**

```bash
node --experimental-transform-types scripts/uji/conveyor-metrics.mts
npm run uji
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/conveyor/metrics.mjs scripts/uji/conveyor-metrics.mts
git commit -m "feat(ci): add conveyor throughput metrics"
```

---

### Task 7: Operational contract and controlled acceptance run

**Files:**
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: all prior conveyor commands.
- Produces: one shared model-agnostic execution contract.

- [ ] **Step 1: Add a concise “Dual-lane conveyor” section to both agent contracts**

Required content:
- lane A and B may run only independent scopes;
- reserve before implementation;
- use branch `conveyor/a/<task>` or `conveyor/b/<task>`;
- local preflight must be green before PR;
- event integrator may sync `main` without force and will rerun CI;
- same-file main overlap blocks automatic integration;
- release reservation on merge or abort;
- target median integration interval <=30 min is a performance objective, never a safety override.

Do not duplicate the full design spec.

- [ ] **Step 2: Run static safety scan**

```bash
grep -R --line-number -E 'git push -f|git push --force|gh pr merge .*--admin|--force-with-lease' scripts/conveyor .github/workflows/conveyor-auto-integrate.yml
```

Expected: no matches.

- [ ] **Step 3: Run complete validation**

```bash
npm run build
npm run uji
npm run conveyor:metrics -- --since "2026-09-24T00:00:00Z" --until "2026-09-24T23:59:59Z"
```

The historical metrics command may report zero conveyor integrations before rollout; it must still exit 0 and produce valid JSON.

- [ ] **Step 4: Controlled dual-lane acceptance**

Create four independent, documentation/test-only no-op-safe tasks on two lanes, each touching disjoint files under `docs/superpowers/acceptance/conveyor/`.

For each task:
1. reserve task + file scope;
2. create `conveyor/a/... ` or `conveyor/b/...` branch;
3. add one unique acceptance marker file;
4. run preflight;
5. open PR with conveyor metadata;
6. allow existing five gates + Conveyor Auto Integrate to run;
7. verify expected-head merge;
8. release reservation.

Acceptance result must satisfy:
- all four merge without force or gate bypass;
- median green-to-integration <=5 minutes;
- median integration interval <=30 minutes during the controlled ready-queue run;
- zero overlapping-file integrations;
- zero stale-green merge.

If GitHub Actions capacity or an external outage prevents the timing target, record the external blocker separately; do not weaken gates.

- [ ] **Step 5: Verify final main**

After all controlled PRs are integrated:

```bash
git fetch origin main
git checkout main
git reset --hard origin/main
npm run build
npm run uji
```

Expected: green.

- [ ] **Step 6: Commit agent-contract documentation if not already part of a controlled PR**

```bash
git add AGENTS.md CLAUDE.md
git commit -m "docs(ci): adopt dual-lane conveyor contract"
```

---

## Self-review

### Spec coverage
- Two independent lanes: Tasks 2, 5, 7.
- Early duplicate/overlap reservation: Task 2.
- Local preflight before remote CI: Task 3.
- Existing gates preserved: Tasks 1, 4, 5.
- Event-driven integration: Tasks 4–5.
- Stale-main replay without force: Task 4.
- Material overlap blocking: Tasks 1 and 4.
- Timing telemetry: Task 6.
- Zero force/history rewrite: Tasks 4, 5, 7.
- Controlled four-task throughput demonstration: Task 7.

No spec requirement is intentionally omitted.

### Placeholder scan
No unresolved placeholder markers or deferred implementation language are permitted in this plan.

### Type/interface consistency
- `formatMetadata()/parseMetadata()` own the single PR metadata contract.
- `decideIntegration()` is pure and is the only policy decision function used by the side-effect runner.
- `REQUIRED_WORKFLOWS` is defined once in `model.mjs` and imported by readiness + metrics code.
- reservation scope paths use the same `normalizeScope()` function as overlap evaluation.

### Review Focus coverage
- concurrent reservation race → Task 2 fake-adapter collision test;
- main moves after green → Task 4 stale-main tests + controlled run;
- privilege boundary → Task 4 trusted-candidate rules + Task 5 workflow policy test;
- stale workflow results → Task 1 exact-head workflow-state test;
- stale reservation → Task 2 explicit inspect/release behavior, with no automatic destructive cleanup.

## Execution approach

For this repository change, **Native execution is the appropriate available approach in this ChatGPT session**: the plan has seven tightly defined tasks with explicit interfaces, but this harness does not expose a general-purpose subagent dispatcher. Execution should therefore use `superpowers:executing-plans`, task-by-task, with verification before each completion claim.
