# Handoff — 2026-10-30 (Claude Opus 5.5 integrator session)

Written from repository evidence only. States are labelled: IMPLEMENTED / LOCALLY TESTED / CI VERIFIED / MERGED / INDEPENDENTLY REVIEWED. Nothing here is clinically validated.

## Main
`origin/main` = `44cd256e` (#2933). Required workflows green on `3011e74a` (Validate, Stabilization, Body 3D Render, Clinical Evidence, Security Baseline, Mongo Persistence, Pages, Vercel). The scheduled **Production browser check** is red since 2026-10-29 13:42 UTC for a non-code reason, see "Production" below.

## Merged this session (all with exact-head CI green)
| PR | What | Status |
|---|---|---|
| #2911 | revert main to last green tree `3e3f9471` (owner decision) | MERGED |
| #2912 | ENG-D7-02 reopened, owner decision Option B | MERGED |
| #2917 | pin MongoDB service to 7.0.43 (8.0.32 fails on runner kernel) | MERGED |
| #2913 | WP-1 unsupported-claim guard | MERGED (CI verified) |
| #2914 | WP-2 PR-shape guard (shallow-checkout bug fixed, pure-deletion exemption, fail-closed) | MERGED |
| #2882 | WP-6 Node 26 uji runner. Branch merged with main: Node 24.15 **784/784**, Node 26.12.1 **784/784**; main on Node 26 = **0/784** (`bad option`) | MERGED, CI verified, reviewed by evidence |
| #2933 | name a *suspended* Render backend instead of looping on 503 | MERGED |

## Production
`https://panaceamed-backend.onrender.com/api/health` → HTTP 503, `x-render-routing: suspend-by-user`, body "This service has been suspended by its owner." Frontend `www.panaceamed.id/build.json` = `04749a88` (equivalent to main). **Owner action: resume or intentionally keep suspended on Render.** No code change can fix this. The keep-alive job now stops and says so instead of pinging for hours.

## Open PRs that matter
| PR | State | Notes |
|---|---|---|
| #2918 | CI green 16/16 at `422abdc7`, **not merged on purpose** | T-D7-05 MTP re-rig, male + female. Changes `SOURCE_SHA256` pins (male `b2c7cb60`, female `ebcb2053`) → needs independent review. ENG-D7-02 stays FAIL until then. Caveat: female WALK heel flipped `exceeds→within` for a non-physical reason (floor found from every 7th vertex, `retarget_cmu_gait.py:280`; FOOT animation is bit-identical). |
| #2932 | CI running at `7d8e129b` | `deadSpaceFraction`, `shuntFraction` (pure algebra, derived). Equation forms still need a verified citation before any UI. |
| #2915 | CI green at `c6232346` | WP-3 re-land triage. Claude restored the real `theme-parity.mjs` that Argon had replaced with a hard-coded pass. Still needs the content-based classification rework. |
| #2931 | red (Playwright `locator.waitFor` 30 s flake) | Argon mega-PR; Claude restored TASK_BOARD and rewrote BX-6. Do **not** merge; split into one PR per BX engine. |
| #2909 | CONFLICTING, red | Hardens `src/domains/body-exposure-canonical/canonicalBodyExposureEngine.ts` (941 lines) which exists **only in the reverted tree** (not on main). Superseded until a re-land decision. |
| #2916, #2919, #2921–#2930 | Argon | see ARGON_DIRECTIVE_D102 (`~/Developer/panaceamed-guides`). #2916 should be closed. |
| tag `v1.0.0-closeout` | false claim | exists on origin; delete only with owner's OK. |

## Known unresolved defects
1. **Playwright flake** `locator.waitFor: Timeout 30000ms` still recurs (user-journeys on #2914, full-acceptance on #2931). Original smoke passed 20/20 locally; fold appears in 189 ms (CPU 1×) to 2.25 s (CPU 12×), so it is not runner slowness. Leading hypothesis (unproven): localStorage seeded after `domcontentloaded` gets overwritten by a boot-time writer.
2. Argon BX engines in #2921–#2930 are stubs (e.g. BX-2 returns LAD segments for any dominance, `[]` for unknown dominance). Do not treat as clinical content.
3. 74-commit-old branches and ~30 Directive/T-CLIN PRs are open; none may land without WP-3 triage.

## Do not redo / overwrite
- Female forefoot MTP plane method and `rig_chain_female.sh` (#2918).
- `scripts/qa/theme-parity.mjs` (real audit). `docs/governance/TASK_BOARD.md` (restored).
- Never force-push; never delete tests; never replace an audit with a constant.

## Next three executable tasks
1. Independent review of #2918 pins (Argon/Codex/owner), then merge via `~/Developer/panaceamed-tools/guard-merge.sh 2918`; then flip ENG-D7-02 only with the exact CI run id.
2. WP-5: find the real `waitFor` that times out (`gh api …/jobs/<id>/logs`), prove/disprove the seeding race with `context.addInitScript`, ≥ 20 consecutive passes under CPU throttle. No timeout/retry increases.
3. Look up and verify citations (PubMed) for the Bohr–Enghoff and shunt equation forms in #2932, then connect them to the existing V/Q panel.
