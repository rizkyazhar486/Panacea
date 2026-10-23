# Task Board

Single queue for all agents. One row = one small PR. Update the row in the same PR that does the
work (status, PR, SHA). Do not create parallel task lists or checkpoint essays.

**WIP:** integrator 1 · each lane ≤ 2 open PRs · no file overlap between open PRs.
**Status:** READY · IN_PROGRESS · IN_REVIEW · DONE · DEFERRED_FINAL_STAGE (→ EXTERNAL_GATES id; not asked now).

Snapshot main `256a22de`, 2026-10-23.

## Now (H0)

| ID | Task | Criterion | Lane | Status | PR / evidence |
|---|---|---|---|---|---|
| T-H0-01 | Pin runners to Ubuntu 24.04 (all 27 workflows; `ubuntu-latest` became 26.04 and broke Playwright and Mongo) | ENG-CI-02 | integrator | DONE | #2691 (supersedes #2686), merged `c57e22fc` |
| T-H0-02 | Bump MCP SDK + follow-redirects; audit gate OK | ENG-SEC-01 | claude | DONE | #2687 merged; #2688 closed as duplicate |
| T-H0-02b | Stabilize Home daily-quote layout so the mobile screenshot grid matches its baseline | ENG-F2-04 | claude | DONE | #2682, merged `7877a493` |
| T-H0-03 | Record run IDs of every required workflow on the current main SHA (main `c57e22fc`: 23 checks, 0 failing after one infra rerun; `944a9baf`: 16 checks, 0 failing) | ENG-CI-01 | integrator | READY | — |
| T-HR-01 | Optional human review issue form + terms (`.github/ISSUE_TEMPLATE/human-review.yml`) | — | any-ai | IN_REVIEW | this PR |
| T-HR-02 | In-product optional review page `#/review/<taskId>` per HUMAN_VERIFICATION_OPTIONAL §5 (append-only, no AI writes, positive + negative tests) | — | any-ai | READY | — |
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
