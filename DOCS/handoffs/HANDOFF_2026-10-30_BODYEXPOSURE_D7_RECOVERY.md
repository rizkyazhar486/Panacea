# Handoff — updated 2026-10-31 (Claude Opus 5.5 integrator session)

Written from repository evidence only. States are labelled: IMPLEMENTED / LOCALLY TESTED / CI VERIFIED / MERGED / INDEPENDENTLY REVIEWED. Nothing here is clinically validated. Several Claude sessions work in parallel and pick tasks from this file: before starting a task, re-check `git log origin/main` and open PRs for it (two sessions built the same Mongo fix on 2026-10-31; #2948 was closed as a duplicate of #2944).

## Main
`origin/main` = `7f4e8e90` (#2947) when this update was written.

## Merged 2026-10-30 / 31 (exact-head CI green before each merge)
| PR | Commit | What |
|---|---|---|
| #2911 | — | revert main to last green tree `3e3f9471` (owner decision) |
| #2913, #2914 | — | WP-1 claim guard, WP-2 PR-shape guard |
| #2882 | — | WP-6 Node 26 uji runner (Node 24.15 and 26.12.1 both 784/784 at the time) |
| #2933 | — | name a suspended Render backend instead of looping on 503 |
| #2938 | `ba8fa0f1` | wake-server test spawn guard 2 s -> 20 s (failed under load average ~10) |
| #2937 | `07fd64ad` | BX-2 coronary territories, AHA 17-segment per-branch table read from PMC full text |
| #2915 | `8b7ce2f5` | WP-3 re-land triage by diff content; test status is honest `not-run` / `no-tests-in-commit` (the script never runs a reverted commit's tests) |
| #2939 | `b38f2f78` | BX-6 imaging plane correlator on the repo atlas frame (axial = Y, sagittal = X, coronal = Z, per `cameraViews.ts`) |
| #2918 | `9187d8cc` | T-D7-05 MTP toe joint, male + female. Independent review asked for changes; the female BALL landmark fix landed before merge. ENG-D7-02 stays FAIL. Corrected claims: see the T-D7-05 row in `docs/governance/TASK_BOARD.md` |
| #2944 | `5385acd8` | (other session) Mongo saves send only changed documents |
| #2946 | `e3117284` | (other session) dead-space and shunt identities panel in the respiratory workspace |
| #2947 | `7f4e8e90` | (other session) egress per route and per vendor host in `/api/health` |

## Production
- The Render workspace is **suspended for the Hobby outbound bandwidth quota**. The dashboard banner the owner sent reads: "You've used the 5 GB of free bandwidth in your Hobby workspace." Render docs: without a payment method Render "suspends all of your Free services for the remainder of the month" (render.com/docs/free). The owner chose to wait for the November reset and not add a card.
- Owner-reported breakdown (not verified by an agent): about 5.59 GB used, about 5.41 GB service-initiated, about 187 MB HTTP responses. Render bills traffic *sent* from services to outside Render; inbound is not billed (render.com/docs/outbound-bandwidth).
- Verified write amplification (fixed by #2944): every save re-sent every slice document (each heart-rate/sleep sample is its own document) plus the core document. Whether that is the dominant source is **UNVERIFIED**: it applies only if production has `MONGODB_URI` set (owner check, yes/no only).
- Logs show one `POST /api/health-webhook/:token` refused with 413 after 8.9 s on 2026-10-29. The token is checked before the 12 MB body parser, so the sender likely held a valid token and that upload was lost. Raising the limit or chunking is an owner decision.

## Open PRs that matter
| PR | State | Notes |
|---|---|---|
| #2949 | docs | T-D7-05 row corrections and this handoff |
| #2950 | CI running | `egress.mongo` in `/api/health`: slice and core write counters, numbers only (server uji exit 0, root uji 788/788 locally) |
| #2941 | Gemini, green | duplicate of merged #2937; should be closed |
| #2942 | Gemini, green | BX-8 canonical record overlay; needs review against existing `labLongitudinalBridge` |
| #2909, #2886–#2894, #2901, #2919–#2931 | red | built on the pre-revert tip; `validate` fails on an architecture violation in `bodyExposureEnterpriseEngine.ts`, a file that exists only in the reverted tree. #2909 also conflicts with main and its engine imports `node:fs`. Close or re-land one by one; agents were refused permission to close other agents' PRs |

## Known unresolved defects
1. Playwright flake `locator.waitFor: Timeout 30000ms` (calorie smoke, user-journeys). #2935 keeps failure evidence for the next occurrence; do not raise timeouts.
2. T-D7-05 follow-ups: toe-constraint jump gating (TOE.R 417.5 deg/s, reproduced, unbounded), unit test + sensitivity for the female MTP-plane heuristic (selection code is pure numpy in `build_rig_lower_limb.py:127-136`; any refactor must rerun the Blender build step and show an identical rig report), keep the pre-landmark GLB hash in `rig_chain_female.sh`.
3. The first save after every process start still rewrites all Mongo documents once (noted in `risk.render_outbound_bandwidth_quota`).

## Do not redo / overwrite
- Female forefoot MTP plane method, `rig_chain_female.sh`, and the FOOT-bound BALL landmark source (#2918).
- `scripts/qa/theme-parity.mjs` (real audit). `docs/governance/TASK_BOARD.md` (never delete rows).
- Never force-push; never delete tests; never replace an audit with a constant.

## Next three executable tasks
1. After Render resumes: confirm `/api/health` 200 and the deployed SHA (`node scripts/qa/verify-deployed-sha.mjs "$(git rev-parse origin/main)"`), then read `egress.rute`, `egress.vendor` and `egress.mongo` at fixed intervals and compare with the Render Metrics bandwidth graph before any further optimization.
2. T-D7-05 follow-up 2 above (MTP heuristic unit test with a Blender-verified identical rig report).
3. Seed the Mongo write fingerprints from the documents read at boot so a restart does not resend everything; coordinate with the session that wrote #2944 first.
