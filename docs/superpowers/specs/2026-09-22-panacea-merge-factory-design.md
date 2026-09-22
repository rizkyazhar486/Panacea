# Panacea Merge Factory — Design Specification

Date: 2026-09-22
Status: Proposed / approved concept, awaiting written-spec review
Owner: Panaceamed repository workflow

## 1. Purpose

Panacea needs to maximize the number of safe, meaningful pull requests that can be merged into `main` per wall-clock hour without weakening clinical-safety, security, deterministic-test, or rendering acceptance standards.

The current workflow is too serial. Independent work often waits for the previous PR to merge, then rebases/replays on latest `main`, reruns broad CI, and may repeat expensive checks that already ran elsewhere. This creates unnecessary cycle time and stale-ancestry churn.

The Merge Factory changes the optimization target from "one task at a time" to:

`safe_merge_throughput = meaningful_safe_merges / wall_clock_hour`

subject to the hard constraint that required safety and correctness gates remain satisfied.

A second optimization target is:

`duplicated_compute_per_merge = repeated_non_incremental_validation / safe_merge`

The goal is to minimize duplicated compute, not to minimize testing.

## 2. Success Criteria

The workflow is successful when all of the following are true:

1. Independent feature lanes can be developed concurrently without touching the same active files.
2. Shared-core areas remain serialized to avoid conflicts and accidental overwrites.
3. CI selects relevant gates from the changed paths and risk class rather than automatically running every expensive suite on every PR.
4. Comprehensive regression coverage still runs at integration checkpoints and on `main`.
5. A moving `main` does not automatically force replay of a non-overlapping PR.
6. Merge remains expected-head / non-force and does not trust stale green checks.
7. Claude Code and other active builders retain ownership of their current scopes; Merge Factory never uses throughput as justification to overwrite active work.
8. Clinical, security, provenance, and patient-safety boundaries remain stricter than ordinary product-code boundaries.
9. Throughput and cycle time become measurable from repository data.

A **meaningful merge** is one independently reviewable capability, bug fix, safety improvement, evidence-boundary improvement, test/infrastructure improvement, or documentation contract that could reasonably be reverted on its own. Mechanical fragmentation performed only to inflate merge count does not count.

## 3. Non-Goals

This design does not:

- remove clinical-safety checks;
- remove security checks;
- force-merge red or stale PRs;
- combine unrelated features into mega-PRs merely to reduce CI cost;
- allow two agents to edit the same shared-core files concurrently;
- change UI/UX ownership;
- weaken evidence/provenance requirements for Body Exposure or clinical modules;
- claim that wall-clock time equals continuous background execution by ChatGPT.

## 4. Core Architecture

The Merge Factory has five stages:

`Backlog -> Router -> Parallel Lanes -> Risk-Aware CI -> Integration Queue -> main`

### 4.1 Backlog Router

Every candidate task is classified before implementation into one lane and one risk class.

Primary lanes:

- `body-organ/*` — isolated organ/system educational graphs, bounded physiology, pathophysiology, pharmacology, provenance.
- `body-core/*` — shared renderer, shared state, camera/orbit, shared models, common 3D runtime.
- `clinical/*` — CDSS, clinical planning, medication, diagnostic logic, safety rules.
- `devices/*` — device ingestion, waveform/event envelopes, interoperability.
- `server/*` — backend/API/adapters.
- `security/*` — auth, access control, secrets boundaries, privacy enforcement.
- `infra/*` — CI, deployment, build tooling.
- `docs/*` — documentation and evidence contracts.

### 4.2 Parallel Lanes

Parallel-by-default applies only when tasks are independent.

A lane is independent when:

- changed-file sets do not overlap;
- neither task changes a shared interface consumed by the other;
- neither task changes a shared renderer/core runtime;
- neither task depends on the other's output;
- active Claude Code scope is not touched.

Examples safe to parallelize:

- digestive education graph vs reproductive education graph;
- endocrine evidence relationships vs isolated renal model;
- unrelated backend adapter vs isolated documentation.

Examples that stay serialized:

- two changes to `src/lib/bodyRenderScheduler.ts`;
- renderer refactor plus organ work that depends on the renderer contract changing;
- two changes to central route/state registries;
- overlapping package-lock or dependency changes.

### 4.3 Shared-Core Serialization

Shared-core paths are treated as a mutex lane. Only one active writer may modify them at a time.

Initial shared-core candidates include:

- shared Body Exposure renderer/runtime files;
- global routing and application shell;
- root dependency manifests and lockfiles;
- CI workflow definitions;
- cross-domain schema/contracts used by multiple lanes.

This list must be explicit and versioned rather than inferred informally.

## 5. Risk Classes

Each PR receives a deterministic risk class based on changed paths and declared intent. If classification is uncertain, choose the higher risk class.

### R0 — Documentation / metadata only

Examples: docs, non-executable provenance notes.

Required pre-merge gates:

- syntax/format checks where applicable;
- lightweight repository policy validation.

### R1 — Isolated deterministic logic

Examples: isolated Body organ education graphs, pure deterministic models, bounded utilities.

Required pre-merge gates:

- production build/typecheck relevant to touched code;
- deterministic relevant tests;
- evidence/provenance checks when biomedical.

### R2 — Shared frontend/runtime

Examples: shared renderer, application state, routing, shared component infrastructure.

Required pre-merge gates:

- frontend build/typecheck;
- deterministic test suite;
- relevant browser/render smoke tests;
- specialized Body 3D acceptance if Body runtime changed.

### R3 — Backend/API/device integration

Required pre-merge gates:

- server typecheck/build;
- relevant server deterministic tests;
- integration-specific tests;
- security checks when trust boundaries change.

### R4 — Clinical/security critical

Examples: clinical decision logic, medication rules, auth/access, patient-data handling.

Required pre-merge gates:

- all relevant deterministic clinical/security tests;
- general build/typecheck;
- explicit fail-closed boundary checks;
- specialized safety acceptance;
- no path-based optimization may skip a directly relevant safety test.

R4 changes are never grouped into a low-risk merge cohort without an immediate comprehensive checkpoint after merge.

## 6. CI Routing Design

The current repository repeats broad validation in multiple workflows. Merge Factory introduces a change classifier and routes only required pre-merge jobs.

### 6.1 Change Classifier

A first-stage job computes booleans such as:

- `frontend_changed`
- `server_changed`
- `body_core_changed`
- `body_content_changed`
- `clinical_changed`
- `security_changed`
- `workflow_changed`
- `dependencies_changed`

The classifier emits machine-readable outputs used by downstream jobs.

### 6.2 Fast Gate

Every executable-code PR receives a fast deterministic gate early:

- dependency cache;
- typecheck/build relevant to touched code;
- targeted deterministic tests.

Failure stops downstream expensive work.

### 6.3 Specialized Gates

Body 3D browser/WebGL acceptance runs pre-merge only when the PR changes Body runtime/rendering/assets/interaction paths that can affect rendered behavior.

Server acceptance runs pre-merge when server paths or shared contracts imported by server tests change.

The existing lightweight security baseline remains always-on for executable-code PRs. Additional security suites are selected when trust-boundary paths change.

Clinical safety gates run whenever clinical decision/safety paths change.

### 6.4 Comprehensive Integration Gates

Full regression remains mandatory at integration checkpoints:

- latest `main` after each merge cohort;
- immediately after every R4 clinical/security-critical merge;
- shared-core / dependency / CI changes;
- explicit stabilization runs before releases or major integration milestones;
- scheduled full-regression runs as an additional safety net.

Therefore path-aware PR optimization does not eliminate comprehensive testing; it moves broad duplicate work from every isolated PR to the places where it provides the highest marginal safety value.

## 7. Stale-Main Policy

A changed `main` does not automatically invalidate an otherwise green PR.

Before merge, compare the PR base-to-head changed-file set with the set of files changed on `main` since the PR base.

### Safe non-overlap path

If:

- file sets do not overlap;
- shared interfaces have not changed;
- required CI is green on the PR head;
- no risk-class rule requires exact-latest-main execution;

then the PR may enter the integration queue without rebuilding the work from scratch.

### Replay / sync required

Replay or sync is required when:

- changed files overlap;
- shared dependencies/interfaces moved;
- package lock or workflow behavior changed materially;
- required safety logic changed on `main`;
- GitHub reports conflict/unsafe ancestry;
- a specialized gate explicitly depends on latest-main state.

Replay should preserve commits where possible; destructive recreation is the last resort.

## 8. Integration Queue and Merge Cohorts

Mature PRs enter a single integration queue.

Queue entry requires:

- scope complete;
- required risk-aware checks green;
- no unresolved review blocker;
- overlap audit complete;
- head SHA recorded.

Merge procedure for each PR:

1. Read latest `main` SHA.
2. Recheck overlap against changes since PR base.
3. Recheck required statuses for the exact PR head SHA.
4. Merge using expected-head SHA; never force merge.
5. Verify resulting commit is present on `main`.
6. Move immediately to the next independent mature PR if the cohort remains open.

### 8.1 Low-Risk Merge Cohort

R0/R1 independent PRs may be merged in a bounded cohort before waiting for one comprehensive `main` regression run. This prevents every rapid `main` push from canceling an expensive previous `main` workflow while still ensuring the latest `main` is comprehensively tested.

Initial conservative cohort boundary:

- maximum 5 R0/R1 merges, or
- maximum 30 minutes from the first merge in the cohort,

whichever occurs first.

At the boundary, the queue pauses new cohort merges until the comprehensive regression on the latest `main` SHA is green.

The cohort size is a tunable operational parameter, not a permanent product invariant. It may increase only after measured evidence shows stable post-merge regression performance.

### 8.2 Immediate Checkpoint Cases

Do not wait for a cohort boundary after:

- any R4 merge;
- shared-core runtime change;
- root dependency/lockfile change;
- CI classifier/workflow change;
- any merge whose overlap audit had elevated uncertainty.

These require a comprehensive latest-`main` checkpoint before continuing the queue.

Only merge execution and checkpoint barriers are serialized. Development and most validation remain parallel.

## 9. Superpowers Integration

Superpowers is the default process framework.

Use `dispatching-parallel-agents` whenever two or more tasks are truly independent and the execution environment exposes parallel-agent capability. When it does not, preserve the same lane isolation and branch structure so multiple available builders/tools can still work independently.

Each parallel task receives:

- one explicit domain;
- explicit file/scope boundaries;
- prohibition against shared-core edits unless assigned;
- expected tests;
- expected evidence/provenance requirements;
- output summary for integration review.

Use TDD for behavioral changes and bug fixes. Use systematic debugging for failures rather than repeatedly replaying branches without root-cause analysis.

## 10. Builder Coordination

Throughput must not overwrite collaborative work.

Rules:

- Active Claude Code scope is read-only to other builders unless explicitly reassigned.
- Existing contributions are preserved, extended, reconciled, or repaired rather than replaced.
- If two planned tasks overlap, one becomes queued rather than parallel.
- Shared-core ownership is explicit for each active change.
- UI/UX remains out of scope for non-UI builders unless explicitly reassigned.

## 11. PR Size and Merge Semantics

The target is many meaningful, independently reviewable merges, not artificial commit inflation.

A good Merge Factory PR should:

- implement one coherent capability or fix;
- touch the smallest practical file set;
- include its deterministic test/evidence boundary;
- avoid unrelated refactors;
- be reversible;
- produce user/product/scientific or infrastructure value.

Do not split a single inseparable behavior into meaningless PR fragments just to increase merge count.

## 12. Metrics

Track at least:

- `merged_prs_per_hour`
- median `pr_open_to_merge_minutes`
- median `first_commit_to_merge_minutes`
- `ci_minutes_per_merged_pr`
- `replay_or_rebase_count_per_merge`
- `stale_pr_abandonment_rate`
- `failed_gate_rate`
- `post_merge_regression_failure_rate`
- `merge_conflict_rate`

Primary throughput formula:

`merge_throughput = safely_merged_meaningful_prs / wall_clock_hours`

Quality counter-metric:

`escaped_regression_rate = regressions_discovered_after_merge / merged_prs`

Baseline and post-change throughput must be computed over comparable repository-activity windows, not from an assumption that ChatGPT executed continuously throughout a wall-clock period.

For the first 20 meaningful merges after Merge Factory activation, any regression attributable to a skipped required gate is a stop condition: fail closed to the broader previous gate for that risk class and investigate before further optimization.

## 13. Initial Implementation Scope

Phase 1 — Observe and classify

- add change-classification logic;
- document shared-core path ownership;
- add metrics script/reporting;
- do not yet delete existing gates.

Phase 2 — Remove duplicated PR work

- refactor `validate-pr.yml` to use path/risk outputs;
- avoid rerunning identical server suites in multiple workflows for isolated frontend/content PRs;
- avoid Body 3D browser acceptance for changes that provably cannot affect Body rendering;
- keep full acceptance at checkpoints and on shared-core changes.

Phase 3 — Integration queue discipline

- add overlap/ancestry audit tooling;
- standardize expected-head merge checks;
- standardize stale-main decision rules;
- close only truly superseded PRs;
- add cohort/checkpoint policy.

Phase 4 — Parallel execution policy

- route independent Body/system/backend tasks into parallel lanes;
- maintain explicit shared-core mutex ownership;
- integrate mature PRs one at a time through the queue.

## 14. Rollback and Safety

Every CI optimization must be reversible.

If post-merge regression rate rises, specialized gates unexpectedly stop running, or classifier uncertainty exists:

- fail closed to broader CI;
- restore the previous full pre-merge gate for the affected risk class;
- investigate classifier or dependency-boundary errors before re-enabling optimization.

The classifier must prefer false positives (running extra tests) over false negatives (skipping required tests).

## 15. Acceptance Criteria

Merge Factory v1 is complete when:

1. A deterministic classifier maps changed files to risk/gate requirements.
2. Isolated Body organ/content PRs no longer pay unrelated server + browser/WebGL cost unless shared contracts require it.
3. Server-only PRs do not pay unrelated Body 3D browser cost.
4. Shared-core/clinical/security changes still receive all relevant specialized gates.
5. Latest `main` receives comprehensive regression validation at bounded checkpoints.
6. Stale-main overlap audit distinguishes safe non-overlap from true replay-required cases.
7. Merge uses expected-head SHA and never force merge.
8. Parallel task ownership prevents overlapping edits.
9. Metrics show cycle time and throughput before/after the change.
10. Any uncertain classification fails closed to broader validation.
11. Low-risk merge cohorts are bounded and cannot starve comprehensive `main` regression indefinitely.
12. Any skipped-required-gate regression during the first 20 post-activation merges automatically rolls that risk class back to broader CI.
