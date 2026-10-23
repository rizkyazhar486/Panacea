# Task Board

Single queue for all agents. One row = one small PR. Update the row in the same PR that does the
work (status, PR, SHA). Do not create parallel task lists or checkpoint essays.

**WIP:** integrator 1 · each lane ≤ 2 open PRs · no file overlap between open PRs.
**Status:** READY · IN_PROGRESS · IN_REVIEW · DONE · DEFERRED_FINAL_STAGE (→ EXTERNAL_GATES id; not asked now).

Evidence snapshot `c57e22fc`, 2026-10-23 (reconciled with H3 changes in `944a9baf`).

## Now (H0)

| ID | Task | Criterion | Lane | Status | PR / evidence |
|---|---|---|---|---|---|
| T-H0-01 | Pin runners to Ubuntu 24.04 (Playwright + Mongo) | ENG-CI-02 | integrator | DONE | #2691 merged c57e22fc; #2686 closed as subset |
| T-H0-02 | Bump MCP SDK + follow-redirects; audit gate OK | ENG-SEC-01 | claude | DONE | #2687 (via #2691) on c57e22fc; Dependency Audit run 39883765825 success |
| T-H0-03 | Record run IDs of every workflow on new main SHA | ENG-CI-01 | integrator | DONE | ENG-CI-01/02, ENG-SEC-01 PASS at c57e22fc; this PR |
| T-H0-04 | Triage open PRs (61): none provably superseded by file content; recommendations in §Open PR triage | — | integrator | DONE | 14 stale closed. Of the rest: 25 updated with main directly; 16 had real conflicts → 13 resolved and pushed (#2461 #2463 #2466 #2488 #2499 #2501 #2503 #2504 #2508 #2509 #2546 #2548 #2640 incl. path fixes after main's folder moves), 3 closed as superseded by main (#2407 equivalent fix on main; #2520/#2521 clipping already fixed by Vika's portal 14577e7e); #2442/#2456 closed by others. All by Claude (merge, no force-push). |
| T-HR-01 | Optional human review issue form + terms (`.github/ISSUE_TEMPLATE/human-review.yml`) | — | any-ai | IN_REVIEW | #2697 |
| T-HR-02 | In-product optional review page `#/review/<taskId>` per HUMAN_VERIFICATION_OPTIONAL §5 (append-only, no AI writes, positive + negative tests) | — | any-ai | READY | — |
| T-H0-05 | Record REG-A/B/E evidence (server suites) at one SHA | ENG-REG-A,B,E | codex | DONE (evidence at 09003a67: validate 120440844359, server-validate 120440844663, Body 3D Render Acceptance 39961643195) | — |
| T-H0-06 | Record REG-C/D evidence (uji + Body 3D) at same SHA | ENG-REG-C,D | claude | DONE (evidence at 09003a67: validate 120440844359, server-validate 120440844663, Body 3D Render Acceptance 39961643195) | — |
| T-FLAKY-PW-APT | Stabilization `full-acceptance` timed out installing Playwright apt deps (slow Azure mirror, ~50 KB/s) on main c57e22fc run 39883766083 attempt 1; reproduce rate, then cache browser deps or raise step budget with evidence | ENG-CI-01 | claude | IN_REVIEW | run 39883766083; recurred on a0f2f0cd run 39914203220; single attempt with a 22 min budget in this PR (a timeout+retry wrapper was tried and failed on the dpkg lock) |
| T-H0-07 | Consolidate duplicate workflows (stabilization ×3, wake-server ×2) — proposal PR, no required check removed until replacement proven | — | integrator | READY | — |

## Next (H1) — start when H0 exit is met, or earlier if it does not touch red paths

| ID | Task | Criterion | Lane | Status |
|---|---|---|---|---|
| T-F2-01 | Fix measurable contrast failures, page by page (one page per PR) | ENG-F2-01 | claude | DONE | measured 0 failures; baseline ratcheted to 0 in #2706; PASS on main f6dd7185 (ux-audit run 39946759961). 1499 unmeasurable elements remain a tracked gap |
| T-F2-02 | Triage 8 axe incomplete results into AXE_BASELINE with reasons | ENG-F2-02 | claude | DONE | obsolete: incompleteTotal is 0 (the 8 counts came from 2 elements fixed earlier); PASS on main f6dd7185 |
| T-F1-01 | Assert F1 critical page inventory = resilience coverage list | ENG-F1-03 | claude | IN_REVIEW (PR pending): governance/F1_CRITICAL_PAGES.json now equals the journey coverage and every route must resolve to a real page; found and fixed dead `#/all-features` (404). ENG-F1-03 stays NOT_RUN until the browser run is recorded at an exact SHA |
| T-E4-01 | Land #2679 (CI diagnostic redaction) after rebase | ENG-E4-01 | codex | IN_REVIEW |
| T-E4-02 | Retention/deletion harness with policy file (test values only) | ENG-E4-03 | codex | READY |
| T-E7-01 | Production browser check logs tested frontend+backend SHA | ENG-E7-02 | claude | DONE | #2701; first real exercise: scheduled run 39950731324 on main f6dd7185 logged both SHAs |
| T-E7-02 | Staging workflow that fails closed without secrets | ENG-E7-04 | codex | READY |
| T-D8-01 | Land #2685 (fetal atlas CC0 primary check) after rebase | ENG-D8-03 | claude | IN_REVIEW |
| T-D8-02 | Attribution page licence-class completeness test | ENG-D8-02 | claude | IN_REVIEW (PR pending): Apache-2.0 and CC BY-SA 2.1 became required classes; per-class removal control on real data. Criterion stays NOT_RUN until ENG-D8-01 passes and the rendered page is captured at an exact SHA |
| T-C6-01 | Coverage assertion: every registry engine has an independent-reference test (pedsDose gap closed in #2702; guard hardened to call-sites after independent review) | ENG-C6-01 | claude | IN_REVIEW | this PR |
| T-C6-02 | Adversarial matrix per engine | ENG-C6-02 | codex | READY |

## Later (H2)

| ID | Task | Criterion | Lane | Status |
|---|---|---|---|---|
| R-D7-RIG | Research: can the source rig get heel/toe landmarks without re-rigging? | ENG-D7-03 | claude | DONE | **Yes.** Read-only Blender MCP inspection of `bodyexposure/bodies/PANACEA_RIG_ADULT_MALE_GAIT.blend` (2026-10-23): 41 bones, one rigid `FOOT.L/R` per side (no toe bone); actions WALK 0–26, RUN 0–18, ROM 1–793. Source bone meshes `SKELETAL.CALCANEUS.L/R` (726 verts) and `SKELETAL.FIRST_METATARSAL_BONE.L/R` are BONE-parented to `FOOT.*`, so landmarks can be derived from them: heel = lowest/posterior calcaneus vertex, ball = first-metatarsal head. Limit: no toe joint, so toe-off flexion is not representable; use the ball (MTP) as the forefoot pivot, not the toe tip. Female rig not yet inspected. |
| T-D7-02 | Derive heel (calcaneus) and ball (1st metatarsal head) landmarks from source meshes in the gait metrics, male + female; report per-landmark slip | ENG-D7-02 | claude | READY | follows R-D7-RIG |
| T-D7-01 | UNMEASURABLE vs FAIL vs PASS distinct in metrics output | ENG-D7-01 | claude | DONE: already implemented in `evaluateFootSlide`; evidence recorded at 96cbeace (validate job 120428954204), sabotage verified |

## Open PR triage snapshot (2026-10-23, main c57e22fc)

Method: for each open PR, every file it changes was compared with main; no PR had all its changes already on main, so none is closed automatically. Counts: 14 close-recommended (stale), 38 owner-decide, 9 keep. **Owner decision 2026-10-23:** close the 14 (done, branches kept) and update the other 47 with main.

| PR | Draft | Updated | Behind main | Title | Recommendation |
|---|---|---|---|---|---|
| #395 | yes | 2026-09-08 | 2756 | Register accession-pinned cellular microscopy source | Close (stale: September, >1000 commits behind) |
| #651 | yes | 2026-09-09 | 2514 | feat(body): holistic healthcare hub on latest main | Close (stale: September, >1000 commits behind) |
| #760 | yes | 2026-09-09 | 2441 | feat(surgery): rebuild holistic simulator curriculum on late | Close (stale: September, >1000 commits behind) |
| #925 | yes | 2026-09-09 | 2371 | Rebase surgical geometry and physiology precision onto lates | Close (stale: September, >1000 commits behind) |
| #1001 | yes | 2026-09-09 | 2323 | feat(body): refresh anatomy-grounded surgical simulator on l | Close (stale: September, >1000 commits behind) |
| #1681 | no | 2026-09-15 | 1770 | feat(body): add exam-first lesion localization lab | Close (stale: September, >1000 commits behind) |
| #1713 | no | 2026-09-18 | 1755 | feat(body): add evidence provenance observatory | Close (stale: September, >1000 commits behind) |
| #1745 | no | 2026-09-16 | 1707 | feat(state): add longitudinal patient context bridge | Close (stale: September, >1000 commits behind) |
| #1770 | yes | 2026-09-17 | 1706 | feat(prime): execute Wisdom Fabric + adaptive stress model | Close (stale: September, >1000 commits behind) |
| #1768 | yes | 2026-09-17 | 1706 | docs: design PANACEA PRIME human potential engine | Close (stale: September, >1000 commits behind) |
| #1767 | yes | 2026-09-17 | 1706 | docs: design PANACEA EDGE courage and aliveness engine | Close (stale: September, >1000 commits behind) |
| #1758 | yes | 2026-09-17 | 1706 | docs: define Panaceamed plugin control plane | Close (stale: September, >1000 commits behind) |
| #1827 | no | 2026-09-18 | 1633 | feat(superpages): replay Body Exposure compilation with reac | Close (stale: September, >1000 commits behind) |
| #1877 | yes | 2026-09-18 | 1484 | feat(attributes): add evidence-first explainable health attr | Close (stale: September, >1000 commits behind) |
| #2282 | yes | 2026-10-08 | 554 | docs(strategy): make Panacea a verified outcome-delivery hea | Owner decide: rebase or close (>150 behind) |
| #2408 | yes | 2026-10-11 | 438 | fix(wallet): reject NaN/fractional PNC amounts in withdraw a | Owner decide: rebase or close (>150 behind) |
| #2407 | yes | 2026-10-11 | 433 | fix(sport): acclimatisation logs reject blank/out-of-range i | Owner decide: rebase or close (>150 behind) |
| #2442 | yes | 2026-10-11 | 392 | test(alpha): A3 anamnesis provenance and versioning proven o | Owner decide: rebase or close (>150 behind) |
| #2463 | yes | 2026-10-12 | 371 | fix(data-lab): blood-panel forecaster starts blank, needs 3  | Owner decide: rebase or close (>150 behind) |
| #2461 | yes | 2026-10-12 | 371 | fix(salat): missing lead minutes fall back to 5 instead of N | Owner decide: rebase or close (>150 behind) |
| #2466 | yes | 2026-10-12 | 366 | fix(meets): reject out-of-range or non-numeric coordinates i | Owner decide: rebase or close (>150 behind) |
| #2456 | no | 2026-10-12 | 346 | docs(alpha): promote E2 (RBAC for clinical data) to VERIFIED | Closed superseded 2026-10-23: E2 VERIFIED on current main |
| #2488 | yes | 2026-10-12 | 326 | fix(notifications): bound user tz offset so a huge value can | Owner decide: rebase or close (>150 behind) |
| #2492 | no | 2026-10-12 | 324 | fix(body): preserve fetal view and region focus across viewp | Owner decide: rebase or close (>150 behind) |
| #2491 | no | 2026-10-12 | 324 | fix(body): retry failed fetal MRI source context loads | Owner decide: rebase or close (>150 behind) |
| #2499 | no | 2026-10-12 | 309 | fix(body): keep rejected fetal GLB out of the rendered scene | Owner decide: rebase or close (>150 behind) |
| #2497 | no | 2026-10-12 | 309 | fix(body): reject respiratory playback quotient overflow | Owner decide: rebase or close (>150 behind) |
| #2496 | no | 2026-10-12 | 309 | fix(body): pin fetal source attribution and coordinate metad | Owner decide: rebase or close (>150 behind) |
| #2495 | no | 2026-10-12 | 309 | fix(body): accept only completed primary taps for fetal regi | Owner decide: rebase or close (>150 behind) |
| #2501 | no | 2026-10-12 | 307 | fix(body): detect projected-label coordinate recovery from N | Owner decide: rebase or close (>150 behind) |
| #2500 | no | 2026-10-12 | 307 | fix(body): recognize existing CC0-1.0 attribution spelling | Owner decide: rebase or close (>150 behind) |
| #2505 | no | 2026-10-12 | 305 | fix(body): prevent pending or duplicate frames after render  | Owner decide: rebase or close (>150 behind) |
| #2504 | no | 2026-10-12 | 305 | fix(body): suspend organ autoplay on manual camera commands | Owner decide: rebase or close (>150 behind) |
| #2503 | no | 2026-10-12 | 305 | fix(body): correct organ close-up zoom in and out directions | Owner decide: rebase or close (>150 behind) |
| #2511 | no | 2026-10-13 | 303 | fix(body): classify explicit costal cartilage before rib/bon | Owner decide: rebase or close (>150 behind) |
| #2510 | no | 2026-10-13 | 303 | fix(body): reject nonfinite camera framing and overflow coor | Owner decide: rebase or close (>150 behind) |
| #2509 | no | 2026-10-13 | 303 | feat(device-os): establish Genesis translation for historica | Owner decide: rebase or close (>150 behind) |
| #2508 | no | 2026-10-13 | 303 | docs(strategy): adopt evidence-gated frontier biomedical dis | Owner decide: rebase or close (>150 behind) |
| #2506 | no | 2026-10-12 | 303 | fix(body): normalize OpenCell identifiers for joins and dedu | Owner decide: rebase or close (>150 behind) |
| #2514 | no | 2026-10-13 | 301 | fix(body): reject incomplete and secondary whole-body taps | Owner decide: rebase or close (>150 behind) |
| #2512 | no | 2026-10-13 | 301 | fix(body): release owned Three.js line and point resources | Owner decide: rebase or close (>150 behind) |
| #2521 | no | 2026-10-14 | 289 | fix(navigation): make logout and page menus accessible | Owner decide: rebase or close (>150 behind) |
| #2520 | yes | 2026-10-14 | 289 | fix(nav): make page navigation and account logout accessible | Owner decide: rebase or close (>150 behind) |
| #2548 | no | 2026-10-15 | 239 | fix(replay): preserve missing measurements in summaries and  | Owner decide: rebase or close (>150 behind) |
| #2551 | no | 2026-10-15 | 238 | fix(training): require time evidence for run records | Owner decide: rebase or close (>150 behind) |
| #2550 | no | 2026-10-15 | 238 | fix(training): preserve session duration evidence | Owner decide: rebase or close (>150 behind) |
| #2549 | no | 2026-10-15 | 238 | fix(dashboard): preserve unavailable performance duration | Owner decide: rebase or close (>150 behind) |
| #2546 | no | 2026-10-16 | 197 | fix(privacy): disclose actual controls before consent | Owner decide: rebase or close (>150 behind) |
| #2608 | yes | 2026-10-17 | 175 | test(e4): gate server console logs against raw identifiers | Owner decide: rebase or close (>150 behind) |
| #2638 | no | 2026-10-17 | 164 | docs(f1): audit of clinician access to patient data, with a  | Owner decide: rebase or close (>150 behind) |
| #2636 | no | 2026-10-17 | 164 | docs(f2): directed manual QA checklist with automated eviden | Owner decide: rebase or close (>150 behind) |
| #2640 | no | 2026-10-17 | 162 | docs(f2): record measured mobile TBT finding in the F2 ledge | Owner decide: rebase or close (>150 behind) |
| #2675 | yes | 2026-10-19 | 105 | feat(visit-os): outcome-first encounter workflow from AI too | Keep: rebase + rerun CI |
| #2677 | no | 2026-10-19 | 10 | feat(body-exposure): classify canonical PAN_* materials and  | Keep: rebase + rerun CI |
| #2683 | no | 2026-10-22 | 9 | docs(body): guide WebGPU upscaling and neural rendering rese | Keep: rebase + rerun CI |
| #2681 | yes | 2026-10-21 | 9 | fix(f2): measure opaque contrast failures | Keep: rebase + rerun CI |
| #2680 | no | 2026-10-22 | 9 | fix(e7): redact production asset failure diagnostics without | Keep: rebase + rerun CI |
| #2693 | no | 2026-10-23 | 8 | docs(governance): AI-first super intelligence guidance for a | Keep: rebase + rerun CI |
| #2685 | no | 2026-10-22 | 8 | fix(d8): verify fetal atlas CC0 and distinguish unresolved a | Keep: rebase + rerun CI |
| #2679 | no | 2026-10-22 | 8 | fix(e4): prevent PHI scanner from leaking findings into CI l | Keep: rebase + rerun CI |
| #2694 | no | 2026-10-23 | 6 | docs(governance): human gates become a deferred final stage  | Keep: rebase + rerun CI |

## Waiting on humans

Deferred to the final stage (H3), see [EXTERNAL_GATES.md](EXTERNAL_GATES.md). Agents do not ask or re-raise these; they are reviewed when the
owner answers.
