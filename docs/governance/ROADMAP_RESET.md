# Roadmap Reset — three horizons

Priorities: **P0** product blocker / red main / security · **P1** safety & reliability ·
**P2** usability · **P3** advanced 3D and research. Body Exposure stays in the product; its
fidelity research is H2 and never blocks H0/H1.

## H0 — Stabilize what exists (target: now → main green for 5 consecutive days)

| Item | Criteria |
|---|---|
| Browser CI on a supported runner | ENG-CI-02 (PR #2686) |
| Zero unaccepted high/critical deps | ENG-SEC-01 (PR #2687) |
| All required checks green on main | ENG-CI-01 |
| Regression packs for the 38 legacy-verified items re-recorded at one SHA | ENG-REG-A..E |
| Close or rebase stale PRs (65 open → ≤ 15) | TASK_BOARD T-H0-04 |

**Exit:** ENG-CI-01, ENG-CI-02, ENG-SEC-01, ENG-REG-A..E all PASS at one main SHA; open PRs ≤ 15;
branch protection request answered (EXTERNAL_GATES §Repo).

## H1 — Usable, safe alpha (secure end-to-end journeys)

| Stream | Criteria | Human gates (parallel, non-blocking for code) |
|---|---|---|
| Journeys & RBAC | ENG-F1-01..03 | EXT-F1-A/B/C |
| UX & accessibility | ENG-F2-01..05 | EXT-F2-A |
| Privacy | ENG-E4-01..03 | EXT-E4-A/B |
| Delivery truth | ENG-E7-01..04 | EXT-E7-A/B/C |
| Asset rights | ENG-D8-01..03 | EXT-D8-A/B/C |
| Calculator safety | ENG-C6-01..03 | EXT-C6-A |

**Exit (engineering):** every H1 criterion PASS at one SHA.
**Exit (release):** engineering exit + EXT-E7-A, EXT-E7-C decided. Other open gates are listed on
the release record as known limitations (e.g. "calculators not clinically reviewed").

## H2 — Advanced Body Exposure & clinical intelligence

ENG-D7-01..03 (gait), EXT-D7-A, anatomy fidelity, rendering, Genesis/device work. Entry requires H1
engineering exit. Research items are written as `R-*` tasks (question, method, time box) before any
implementation task.

## Cutline

Not before H1 exit: new feature areas, new doctrine documents, new workflows that duplicate an
existing gate, new 3D datasets. Allowed any time: bug fixes with tests, security fixes.

## Owners

Roadmap order: Product Owner (P1/P3 in the job map). Execution: AI lanes per TASK_BOARD.
Re-plan only when a horizon exits or an EXT decision changes scope.
