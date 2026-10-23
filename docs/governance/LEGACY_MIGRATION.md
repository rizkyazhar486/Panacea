# Legacy Migration — 45-criterion ledger → Acceptance v2

`governance/ALPHA_ACCEPTANCE_LEDGER.json` is **kept unchanged as the historical record**
(38 VERIFIED · 6 REPORTED · 1 DEFERRED_TO_CLINICAL_VALIDATION; 38/44 active). Nothing in it is
edited, deleted or retro-promoted. Acceptance v2 has its own baseline (main `256a22de`) and its own
denominator. The validator fails if any of the 45 legacy ids is left unmapped.

## Mapping

| Legacy | Legacy status | v2 engineering | v2 external |
|---|---|---|---|
| A1–A8 | VERIFIED | ENG-REG-A | — |
| B1–B9 | VERIFIED | ENG-REG-B | — |
| C1–C5, C7 | VERIFIED | ENG-REG-C | — |
| C6 | DEFERRED | ENG-C6-01 formula/reference · ENG-C6-02 adversarial · ENG-C6-03 labels/sources | EXT-C6-A clinical validation |
| D1–D6, D9, D10 | VERIFIED | ENG-REG-D | — |
| D7 | REPORTED | ENG-D7-01 PASS/FAIL/UNMEASURABLE · ENG-D7-02 WALK/RUN × M/F measurable · ENG-D7-03 rig landmarks | EXT-D7-A scientific threshold |
| D8 | REPORTED | ENG-D8-01 inventory coverage · ENG-D8-02 visible attribution · ENG-D8-03 primary licence checks | EXT-D8-A logo · EXT-D8-B video · EXT-D8-C ICRP basis |
| E1–E3, E5, E8 | VERIFIED | ENG-REG-E | — |
| E4 | REPORTED | ENG-E4-01 scanner · ENG-E4-02 log redaction · ENG-E4-03 retention harness | EXT-E4-A legal policy · EXT-E4-B infra logs |
| E6 | VERIFIED | ENG-CI-01 main green · ENG-CI-02 runner pin | §Repo branch protection |
| E7 | REPORTED | ENG-E7-01 SHA provenance · ENG-E7-02 deployed smoke · ENG-E7-03 rollback · ENG-E7-04 staging-as-code | EXT-E7-A release policy · EXT-E7-B staging creds · EXT-E7-C sign-off |
| E9 | VERIFIED | ENG-SEC-01 | — |
| F1 | REPORTED | ENG-F1-01 browser journeys · ENG-F1-02 HTTP RBAC · ENG-F1-03 error/loading coverage | EXT-F1-A clinician scope · EXT-F1-B real OAuth · EXT-F1-C user acceptance |
| F2 | REPORTED | ENG-F2-01 contrast · 02 axe · 03 keyboard · 04 screenshots · 05 performance | EXT-F2-A manual QA |

## Why legacy VERIFIED items start NOT_RUN in v2

Their evidence was recorded on older SHAs, and main is currently red. v2 re-records them once, at a
single green SHA (TASK_BOARD T-H0-05/06). That is a re-check, not a demotion: the legacy ledger
still shows them VERIFIED as of their recorded SHAs.

## Overlapping open PRs

| PR | Topic | Disposition under v2 |
|---|---|---|
| #2552 | "AI-only Alpha execution and legal-by-AI" guidance | Superseded by JOB_DESCRIPTIONS: AI does legal research, humans grant rights/approve policy |
| #2634 | F1/F2 parallel Claude execution | Folded into TASK_BOARD lanes + WIP rules |
| #2641 | Short owner reporting | Kept as README rule 7 |
| #2662 | Seven-task checkpoint refresh | Superseded by TASK_BOARD + ACCEPTANCE_V2 status fields |

Recommendation: close these four after this PR merges (owner decision; not done automatically).
