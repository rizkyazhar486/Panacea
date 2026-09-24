# Dual-Lane Continuous Integration Conveyor — Design Specification

**Date:** 2026-09-24  
**Status:** Chat design approved; written specification pending owner review  
**Owner objective:** Increase Panacea integration throughput toward **2 validated merges/integrations per hour** without weakening correctness, clinical safety, security, provenance, or non-destructive collaboration rules.

## 1. Problem statement

Panacea's current repository policy already allows concurrent independent lanes and direct-to-main development, but recent execution behaved serially: one task was prepared, opened as a PR, waited on CI, repaired if needed, waited again, then merged before the next useful integration advanced.

Observed evidence from 2026-09-24:
- 9 PRs merged between 00:00 and 23:16 WIB.
- PRs #1993, #1994 and #1995 were closed after overlap was discovered only after branch/PR creation.
- PR #2000 was superseded by #2002 after main advanced.
- PR #1998 and #1999 each burned an extra CI cycle because a frontend/build dependency problem was discovered by remote CI rather than by preflight.
- For #2002, all required workflows were green roughly 12 minutes after launch, but merge occurred materially later, showing orchestration idle time beyond the CI critical path.

Measured throughput:

[
T_{actual} = \frac{9\ merges}{23.27\ hours} \approx 0.387\ merges/hour
]

Target throughput:

[
T_{target} = 2\ validated\ integrations/hour
]

Required improvement factor:

[
I = \frac{T_{target}}{T_{actual}} \approx 5.17
]

This design treats the bottleneck as orchestration rather than raw CI runtime.

## 2. Governing repository rules

This design is subordinate to and must preserve:
- `AGENTS.md`: main-first continuous development, simultaneous product lanes, preservation of landed work, no force-push, no weakening of biomedical/security gates.
- `CLAUDE.md`: direct-to-main is allowed, main is source of truth, concurrent agents may work, useful prior work must be integrated rather than overwritten.
- `PANACEA_CONSTITUTION.md`: scientific truth, provenance, safety, reproducibility, external validation, and human authority remain hard constraints.

Speed never overrides these rules.

## 3. Design objective

Create a **Dual-Lane Continuous Integration Conveyor** with two independent work lanes that continuously prepare validated, non-overlapping changes while CI for prior changes is already running.

Primary success criterion:

[
Median\ validated\ integration\ interval \le 30\ minutes
]

which corresponds to:

[
Throughput \ge \frac{60}{30} = 2\ integrations/hour
]

This is a throughput target, not a requirement to manufacture trivial PRs. A coherent direct-main commit that passes the same validation is an integration and may count toward the engineering KPI even when no PR exists.

## 4. Core architecture

### 4.1 Conveyor coordinator

A lightweight coordinator owns only orchestration state, not product logic. It maintains:
- current `main` SHA;
- lane A state;
- lane B state;
- reserved file/path scope for each lane;
- task identity and acceptance checks;
- CI/check state;
- integration readiness;
- retry/replay reason;
- timestamps for throughput metrics.

The coordinator must never rewrite shared history or force merge.

### 4.2 Two independent lanes

Each lane follows the same state machine:

[
READY \rightarrow RESERVED \rightarrow PREFLIGHT \rightarrow IMPLEMENTING \rightarrow LOCAL\_GREEN \rightarrow CI \rightarrow INTEGRATE \rightarrow READY
]

Failure/recovery states:
- `OVERLAP_ABORT`
- `LOCAL_FAIL`
- `CI_FAIL`
- `STALE_MAIN_REPLAY`
- `BLOCKED`

The second lane continues whenever the first lane is in CI, review, replay, or external wait, provided scopes are independent.

### 4.3 Scope reservation before implementation

Before a lane writes code:
1. Fetch latest `main`.
2. Inspect whether the requested capability already exists.
3. Inspect recent landed commits/open work for likely overlap.
4. Reserve the smallest practical file/path scope.
5. Reject or re-scope duplicate work before branch/PR creation.

Reservation is advisory coordination metadata, not permanent file ownership. It expires when the lane completes or aborts.

Goal: prevent repeats of #1993, #1994 and #1995, where overlap was identified only after work had already entered the PR pipeline.

### 4.4 Preflight-before-remote-CI

Before opening a PR or directly integrating a coherent change, run the relevant local checks whenever the execution environment supports them.

Minimum preflight for ordinary frontend/shared changes:
- dependency install state consistent with lockfile;
- `npm run build`;
- `npm run uji`;
- targeted test for the changed subsystem.

Backend-touching changes additionally require:
- server dependency install;
- server typecheck;
- server build;
- server deterministic tests.

Body Exposure / WebGL changes additionally require the relevant deterministic QA that can run locally, while full browser/WebGL acceptance remains preserved in CI.

A lane must not intentionally open a PR whose known local build/test state is red.

Goal: prevent repeats of #1998 and #1999 where the first remote cycle failed on a problem that could be caught before CI.

### 4.5 CI remains authoritative for required remote gates

Required existing CI gates remain intact. The conveyor optimizes around them rather than bypassing them.

Relevant current gates include:
- Validate changes;
- Stabilization Acceptance;
- Body 3D Render Acceptance;
- Security Baseline Inventory;
- Security Baseline Enforcement.

Clinical, academic, security, provenance, and other specialized gates remain mandatory when applicable.

### 4.6 Event-driven integration

The coordinator must react to state transitions instead of coarse polling intervals.

When all required checks for a candidate are green:
1. Fetch latest `main` immediately.
2. Verify expected head.
3. Verify candidate ancestry / replay requirement.
4. Re-run overlap audit against changes that landed while CI ran.
5. If safe, integrate immediately.
6. If `main` moved but the delta is independent, replay on latest `main` and revalidate.
7. If overlap became material, stop and reconcile rather than overwrite.

There must be no intentional hour-scale idle period after green CI.

### 4.7 Direct-main versus PR mode

Repository policy currently permits direct-main changes. Therefore the coordinator supports two modes:

**Direct-main mode**
- preferred for small, coherent, independently validated, low-conflict changes;
- fetch latest main immediately before write;
- validate before commit when practical;
- commit without rewriting history;
- inspect post-commit CI and repair forward if needed.

**PR mode**
- used when independent review, protected checks, high-risk scope, or collaboration visibility makes a PR preferable;
- candidate must still pass preflight before PR;
- merge immediately after required gates are green and expected-head checks succeed.

The KPI is **validated integration throughput**, not artificial PR count.

## 5. Parallelism rules

Two lanes may run concurrently only when:
- their reserved scopes do not materially overlap;
- neither depends on the other's unmerged interface;
- both can be validated independently;
- integrating either first will not invalidate the other's meaning.

Examples of good parallelism:
- Body Exposure organ-data boundary test in lane A and unrelated backend observability repair in lane B.
- Documentation/tooling change in lane A and isolated frontend feature in lane B.

Examples requiring serialization:
- two changes editing the same canonical shared state contract;
- schema migration plus consumer changes that require the migration;
- two approaches replacing the same subsystem.

If independence is uncertain, default to serialization for that pair rather than risking destructive reconciliation.

## 6. Queue discipline

The coordinator maintains a ready queue of independent tasks.

Selection order:
1. stabilization / broken-main / security / clinical-safety blocker;
2. high-value unfinished work with clear acceptance criteria;
3. independent functionality expansion;
4. polish and low-impact cleanup.

The next task must be prepared while another lane is in CI when safe to do so.

A lane must not remain idle merely because the other lane has an active PR.

## 7. Failure handling

### Local failure
Do not create remote CI churn. Fix locally, rerun targeted checks, then continue.

### CI failure
Classify the failure:
- candidate defect;
- flaky/external infrastructure;
- main regression unrelated to candidate;
- stale candidate after main movement.

Fix the root cause. Do not weaken gates.

### Main advanced
If no material overlap:
- replay candidate onto latest `main`;
- rerun required validation;
- integrate when green.

If material overlap:
- reconcile intentionally;
- preserve stronger landed behavior;
- do not force merge.

### Duplicate work found
Abort before implementation where possible. Return task to queue as completed-by-existing-work or re-scope to a missing delta.

## 8. Throughput telemetry

The conveyor records these timestamps per candidate:
- `reserved_at`
- `implementation_started_at`
- `local_green_at`
- `ci_started_at`
- `ci_green_at`
- `integrated_at`
- `aborted_at`

Derived metrics:

[
LeadTime = integrated\_at - reserved\_at
]

[
GreenToMerge = integrated\_at - ci\_green\_at
]

[
WasteRate = \frac{aborted\ candidates + superseded\ candidates}{all\ started\ candidates}
]

[
IntegrationThroughput = \frac{validated\ integrations}{elapsed\ hours}
]

Operational targets:
- median `GreenToMerge` <= 5 minutes for PR-mode candidates when no blocker exists;
- median validated integration interval <= 30 minutes during sustained ready-queue periods;
- overlap/supersession waste rate < 10%;
- no increase in escaped CI failures caused by bypassed validation;
- zero force merges / shared-history rewrites.

## 9. Safety and quality invariants

The following may never be traded for throughput:
- biomedical provenance and claim boundaries;
- security baselines;
- deterministic tests;
- Academic Accuracy Gate;
- patient-specific versus reference/simulated distinctions;
- qualified human-review requirements for high-risk clinical publication;
- no force-push;
- no overwrite of newer `main`;
- no fabricated test/CI success.

The conveyor may make validation faster by removing duplicate work, caching, or running independent jobs concurrently, but must not remove meaningful coverage merely to hit the rate target.

## 10. Implementation boundaries

Initial implementation should be deliberately small:
- orchestration scripts/configuration;
- queue/lane metadata;
- overlap reservation/preflight logic;
- event-driven integration checks;
- metrics logging;
- tests for the state machine and failure paths;
- minimal changes to existing workflow files only where required.

Do not refactor unrelated product code as part of this project.

## 11. Acceptance criteria

The implementation is accepted when all of the following are demonstrated:

1. Two independent synthetic or real tasks can enter lane A and lane B concurrently without shared-state corruption.
2. A duplicate task is rejected before meaningful implementation/PR churn.
3. A local build/test failure blocks remote submission.
4. A green PR is detected and advanced to integration without hour-scale polling delay.
5. A candidate whose base becomes stale is replayed safely on current `main` rather than force-merged.
6. A materially overlapping candidate stops for reconciliation.
7. Existing required CI gates remain present and green.
8. The coordinator records timing metrics sufficient to calculate lead time, green-to-merge time, waste rate, and integration throughput.
9. No force-push or history rewrite path exists.
10. In a controlled sustained run with at least four independent ready tasks, the median validated integration interval is <=30 minutes, median green-to-integration time is <=5 minutes when no blocker exists, and no required validation gate is bypassed.

## 12. Non-goals

This project does not:
- guarantee exactly 2 merges every clock hour when no worthwhile independent work exists;
- split coherent features into meaningless micro-PRs to inflate counts;
- bypass review for clinically risky work;
- weaken CI, security, or scientific validation;
- create permanent file ownership between agents;
- replace Panacea product prioritization.

## 13. Rollout strategy

Phase 1: instrument and observe current cycle timings.  
Phase 2: add early overlap reservation and local preflight.  
Phase 3: enable dual independent lanes.  
Phase 4: add event-driven green-to-integration handling.  
Phase 5: measure throughput and waste; tune only after evidence.

If the conveyor increases regression rate, destructive overlap, or safety-gate failures, revert the orchestration change while preserving collected telemetry.

## 14. References

Repository authority:
- `AGENTS.md`
- `CLAUDE.md`
- `PANACEA_CONSTITUTION.md`

Observed examples motivating the design:
- PR #1993 — gallbladder overlap, closed without merge.
- PR #1994 — spleen overlap, closed without merge.
- PR #1995 — pancreas overlap, closed without merge.
- PR #1998 — lung boundary work required a second commit after initial remote validation failed.
- PR #1999 — kidney boundary work required a second commit after initial remote validation failed.
- PR #2000 / #2002 — stale-main candidate superseded by a fresh replay.

The design follows the Superpowers principles of root-cause-first debugging, explicit task isolation, parallel execution only for independent domains, and verification before completion.
