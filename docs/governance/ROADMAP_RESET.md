# ROADMAP RESET

Principle: engineering that AI can close comes first; human decisions are requested once, in writing, and never block other work. Priorities: **P0** blocks the product or safety; **P1** safety/reliability; **P2** usability; **P3** advanced 3D/research. Not everything must finish before the alpha.

## Horizons and exit criteria
| Horizon | Goal | Exit criteria (all machine-checked) |
|---|---|---|
| **H0 Stabilize** | Main is green and cheap to keep green | Required checks green on one main SHA; no unaccepted high/critical advisory; flaky-infra failures classified; ENG-G-1 PASS; every P0/P1 ENG criterion PASS on the same SHA |
| **H1 Usable alpha** | Secure end-to-end workflows | ENG-F1-*, ENG-E4-*, ENG-E7-*, ENG-D8-* PASS; external gates EXT-F1-1, EXT-E7-1, EXT-D8-* decided or explicitly accepted as open risk by the owner |
| **H2 Depth** | Body Exposure fidelity, clinical intelligence | ENG-D7-*, ENG-C6-* PASS; EXT-D7-1 and EXT-C6-1 decided; research items separated from blockers |

## Workstreams (WIP limit: 1 integration-critical item; max 2 open PRs per workstream)
| # | Task (atomic, one small PR) | Prio | Horizon | Test that proves it | Rollback |
|---|---|---|---|---|---|
| 1 | Patch server high advisories (#2688) | P0 | H0 | dependency-audit-gate exit 0 | revert commit |
| 2 | Classify `Install browser` failure in User Journey Acceptance; add bounded retry or cached browser install | P0 | H0 | two consecutive green runs; negative: forced install failure fails by step name | revert workflow edit |
| 3 | Diagnose Stabilization Acceptance + Body 3D failures on main (first genuine failing step) | P0 | H0 | targeted repro + exact-head green | per fix |
| 4 | Decide cancel-in-progress policy for main (needs owner, task #12) | P1 | H0 | run history shows no cancelled-as-failure | revert |
| 5 | Merge F2 checklist (#2636) and F1 audit (#2638) after green exact heads | P1 | H0 | existing tests in PRs | revert |
| 6 | Staging environment definition (engineering part: workflow + smoke), blocked on EXT-E7-1 for acceptance rule | P1 | H1 | smoke against deployed SHA | remove workflow |
| 7 | Remaining contrast failures and unmeasurable gradient/image elements | P2 | H1 | kontras ratchet decreases | revert |
| 8 | Gait RUN/female rig landmarks | P3 | H2 | ENG-D7-2 | revert |

## Cutline
Out of scope until H1 exits: new top-level pages, new 3D organ sets, new wearable integrations. Body Exposure is preserved (not removed); fidelity research is tracked in H2 so it cannot block P0/P1.

## Not on this roadmap on purpose
C6 clinical validation (deferred by owner decision 2026-10-17; reported as EXT-C6-1, not hidden), E4 legal policy, D8 authorship statements.
