# Task Board

Single queue for all agents. One row = one small PR. Update the row in the same PR that does the
work (status, PR, SHA). Do not create parallel task lists or checkpoint essays.

**WIP:** integrator 1 · each lane ≤ 2 open PRs · no file overlap between open PRs.
**Status:** READY · IN_PROGRESS · IN_REVIEW · DONE · DEFERRED_FINAL_STAGE (→ EXTERNAL_GATES id; not asked now).

Snapshot main `256a22de`, 2026-10-23.

## Now (H0)

| ID | Task | Criterion | Lane | Status | PR / evidence |
|---|---|---|---|---|---|
| T-H0-01 | Pin Playwright browser jobs to Ubuntu 24.04 | ENG-CI-02 | integrator | IN_REVIEW | #2686 (other agent) |
| T-H0-02 | Bump MCP SDK + follow-redirects; audit gate OK | ENG-SEC-01 | claude | IN_REVIEW | #2687, head 7af12661 |
| T-H0-03 | After 01+02 merge: record run IDs of every required workflow on new main SHA | ENG-CI-01 | integrator | READY (after 01, 02) | — |
| T-H0-04 | Triage 65 open PRs: close superseded, rebase live ones, list owners; target ≤ 15 | — | integrator | READY | — |
| T-H0-05 | Record REG-A/B/E evidence (server suites) at one SHA | ENG-REG-A,B,E | codex | READY (after 03) | — |
| T-H0-06 | Record REG-C/D evidence (uji + Body 3D) at same SHA | ENG-REG-C,D | claude | READY (after 03) | — |
| T-H0-07 | Consolidate duplicate workflows (stabilization ×3, wake-server ×2) — proposal PR, no required check removed until replacement proven | — | integrator | READY | — |

## Next (H1) — start when H0 exit is met, or earlier if it does not touch red paths

| ID | Task | Criterion | Lane | Status |
|---|---|---|---|---|
| T-F2-01 | Fix measurable contrast failures, page by page (one page per PR) | ENG-F2-01 | claude | READY |
| T-F2-02 | Triage 8 axe incomplete results into AXE_BASELINE with reasons | ENG-F2-02 | claude | READY |
| T-F1-01 | Assert F1 critical page inventory = resilience coverage list | ENG-F1-03 | claude | READY |
| T-E4-01 | Land #2679 (CI diagnostic redaction) after rebase | ENG-E4-01 | codex | IN_REVIEW |
| T-E4-02 | Retention/deletion harness with policy file (test values only) | ENG-E4-03 | codex | READY |
| T-E7-01 | Production browser check logs tested frontend+backend SHA | ENG-E7-02 | codex | READY |
| T-E7-02 | Staging workflow that fails closed without secrets | ENG-E7-04 | codex | READY |
| T-D8-01 | Land #2685 (fetal atlas CC0 primary check) after rebase | ENG-D8-03 | claude | IN_REVIEW |
| T-D8-02 | Attribution page licence-class completeness test | ENG-D8-02 | claude | READY |
| T-C6-01 | Coverage assertion: every registry engine has an independent-reference test | ENG-C6-01 | codex | READY |
| T-C6-02 | Adversarial matrix per engine | ENG-C6-02 | codex | READY |

## Later (H2)

| ID | Task | Criterion | Lane | Status |
|---|---|---|---|---|
| R-D7-RIG | Research (time box 1 session): can the source rig get heel/toe landmarks without re-rigging? Output: yes/no + method | ENG-D7-03 | claude | READY |
| T-D7-01 | UNMEASURABLE vs FAIL vs PASS distinct in metrics output | ENG-D7-01 | claude | READY |

## Waiting on humans

Deferred to the final stage (H3), see [EXTERNAL_GATES.md](EXTERNAL_GATES.md). Agents do not ask or re-raise these; they are reviewed when the
owner answers.
