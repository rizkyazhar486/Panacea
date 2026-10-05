# PANACEA AUTONOMOUS CONTINUATION STATE

Updated 2026-10-03 (autonomous Final Convergence session; autopilot handoff section added at the end). Sequencing per `docs/CLAUDE_CODE_BALANCED_GAP_CLOSURE_DIRECTIVE.md` (weakest important system first); gap sources `governance/MATURITY_REGISTRY.yaml`, `governance/RISK_REGISTRY.yaml`, `governance/RND_BACKLOG.yaml`. Every number below was measured in this session; re-measure before relying on it.

main_sha: cd4313961 (the #2227 merge). Its Stabilization and Body 3D acceptance runs were still in progress when this was written; the last head with all six workflows completed green was a090b6ac0 (#2225). Commits since 8606bade8: calculator input validation (#2217-#2224, #2227), the Body3D smoke failure log (#2225) and docs.
working_branch: docs/continuation-state-calculators (docs only)

completed_this_session:
- UI at 390x844 (one hero + one-word closed folds, content stays in the DOM): Health Data, League, Longevity, VitaPulse (#2194, #2195, #2196, #2197) and Body Exposure (#2201, #2204, #2208). Committed baseline, words visible: health-data 209, ranked 173, longevity 154, vitapulse 164, body-exposure 460 (was 593 before #2201). Body Exposure's remaining words sit inside the unified 3D projector. Its two modality selectors (mode rail and domain tabs) are intentionally untouched: flattening them changes behaviour browser tests rely on and needs an owner decision.
- Dependency security: server production highs 2 -> 0 by lockfile-only patches (#2210: axios 1.20.0, ip-address 10.7.3, body-parser, qs, express), react-router-dom 6.30.6 (#2211), and a fail-closed audit gate with expiring, reasoned acceptances (#2212: `scripts/qa/dependency-audit-gate.mjs`, `governance/dependency-audit-policy.json`, `.github/workflows/dependency-audit.yml`, `risk.dependency_supply_chain`). After the #2210 merge the live Render service reported revision 437c08a about 80 s later and passed the capability and auth-boundary smoke.
- CI observability (#2213): `body3d-canvas-artifact.mjs` now writes `artifacts/body3d-mobile-canvas-failure.json` when it fails. There is deliberately no screenshot (legacy guard `scripts/uji/body3d-visual-artifact.mts` forbids it).
- Oxygen-content coefficients now have one source (#2215): `advancedPhysiology`, `microphysiology`, `bodySim` and `ClinicalPhysiologyMechanisms` read `src/lib/physiology/oxygenContentConventions.ts` instead of repeating `1.34` and `0.003`. Outputs are byte-identical over 933 cases (`simulate()` grid, 9 scenarios, advanced and micro cases with invalid inputs), and a guard in `scripts/uji/oxygen-content-conventions.mts` stops new copies. ECMO keeps its own ELSO convention (`ecmo/oksigen.ts`, 1.39 / 0.0034) and was not touched.
- Clinical-calculator input validation (`risk.clinical_calculator_input_validation`): CKD-EPI, Parkland and Burn, pediatric dose, Holliday-Segar, IV drip, fluid balance, sodium/potassium, blood gas, MAP, Broca and Broca-Lorentz, mid-parental height and McDonald now call pure functions in `src/domains/clinical-calculators` that return a reason and no numbers on invalid input (#2217, #2218, #2219, #2220, #2222, #2223, #2224, #2227). Formulas and thresholds were moved unchanged, each with a regression grid against the old page arithmetic, sabotage-checked tests and a 390x844 browser check. Measured recount on 2026-10-03: 59 `+e.target.value` reads over 23 calculators.
- Body3D smoke failures are now readable from the job log (#2225): `body3d-mobile-smoke-v2.mjs` prints one `BODY3D_SMOKE_FAILURE {json}` line (failure, elapsed, hash, folds, page errors) and a 3 s page-responsiveness probe (`responsive:false` only on a real timeout; other probe errors give `responsive:null` plus `probeError`).
- Correction of earlier claims in this session's reports: #2193 is an anatomy asset-schema fix, not Training folding. No Training/Move folding was ever merged or pending; the remote branch `feat/health-training-folds` only holds the pre-squash League commit already merged as #2195.

current_blocker:
- none in code.

failing_checks:
- none known at a090b6ac0. Known intermittent, cause still unknown: Stabilization Acceptance on main 3a49127 failed in `body3d-mobile-smoke-v2` with `canvas health timed out after 10000ms` (31 s into the smoke, page `#/body-explorer?folds=open`); it passed on rerun (attempt 2) with no code change, and the commit changed only calculator code. Earlier instances (2026-10-02): `placeCanvasOnscreen` `locator.evaluate: Timeout 20000ms exceeded` on PR #2194, PR #2211 and main@1091ab3. The next failure of the smoke prints `BODY3D_SMOKE_FAILURE` in the job log: read `responsive` first (false = stalled main thread, null = see `probeError`, true = the page was alive and the canvas itself is the problem). The canvas-artifact script still writes `body3d-mobile-canvas-failure.json` to the `body3d-mobile-qa` artifact, which cannot be downloaded from the agent sandbox.
- Process finding, confirmed from `.github/workflows/stabilization-acceptance.yml`: `concurrency: group: stabilization-acceptance-${{ github.ref }}` with `cancel-in-progress: true`. On main `github.ref` is the same for every push and for a rerun of an older run, so each merge or rerun cancels the acceptance run in flight (a rerun of 3a49127 cancelled a090b6a's run, and merging #2224 cancelled its replacement). Per-PR exact-head gates are unaffected; only post-merge per-commit evidence is lost when merges are back to back. Merge one PR at a time and let main's run finish. Changing `cancel-in-progress` to `${{ github.event_name == 'pull_request' }}` would keep main's runs; that is a CI-config decision for the owner and was not made.

open_work_of_other_lanes:
- PR #2209 (Render live provenance should expect the latest `server/**` commit): a push that changes only `render-live-smoke.yml` currently false-fails because Render does not redeploy. Root cause independently confirmed from the live log. Leave it to its lane.

held_for_owner:
- PR #2226 (Naegele): CI is 8/8 green, but it corrects a gestational-age sign (the old page gave 294 days on the EDD day for a 35-day cycle and 266 for a 21-day cycle instead of 280) and so changes a clinical output for non-28-day cycles. It needs the owner's or a clinician's decision before merge; it was deliberately not merged.
- Every numeric clinical calculator now goes through a domain function except NaegeleCalc (open PR #2226, held). A scan of every `type="number"` input found 24; my earlier counts searched only `+e.target.value` and missed SirirajCalc (`Number(e.target.value) || 0`), which is now fixed too. WhoGrowth, WhoNeonate and CdcAnthropometry were moved with their tables and clinical rules untouched (results render only for valid input; measured identical on 13 valid input sets). Centor, Paradise and Fletcher were moved with their thresholds unchanged and pinned at the boundary; BallardSoap and Denver got input validation only, with their tables and the auto-drafted SOAP text untouched (that text contains a templated plan, "Vitamin K1 prophylaxis & eye ointment per protocol" and a NICU-referral sentence, which a clinician should review). Move the rest the same way and say so.
- The Broca-Lorentz page text says "25 kcal/kg basal" while the factors applied are 30/35/40 (not changed; needs clinical-nutrition review).

verification_queue (items that need a human or clinician; none can be closed by an agent):
- PR #2226 (Naegele): decide on the gestational-age sign correction (see held_for_owner).
- Lab reference ranges added in dc0d1eed5 (`src/lib/lab.ts`): homocysteine 5-15 umol/L, INR 0.8-1.2, cortisol 6-23 ug/dL. Their `sumber` text says only "usual range; varies by laboratory" with no citation. CLAUDE.md section 8 requires clinical constants from verified sources: a clinician or lab specialist should verify them and add a citable source, or replace them with the user's own laboratory range.
- PR #2230 (cron secret): merging touches `server/**`, so Render redeploys and an agent cannot reach it. After the deploy confirm the daily-briefing scheduler still works (`?key=` is unchanged for a correct secret; `Authorization: Bearer` is new), then rotate `CRON_SECRET` and update the scheduler, because a secret that has been in URLs should be treated as exposed.
- `posisiFisikVoxel` (`src/lib/dicomMpr.ts`, #2181): verified by running it that a finite index outside the volume (-50, 500) is clamped to the edge voxel and still reports millimetres (-4.5 / 4.5) as if valid, while a non-finite index correctly gives `mm: null`. Checked afterwards in `src/pages/Radiology.tsx`: the cursor comes from bounded sliders and an effect that clamps it to the image size, so the only exposure is one render when the series dimensions shrink (the effect runs after render). Low priority; returning `mm: null` for a finite out-of-range index would close it. Needs the module owner's decision.
- Broca-Lorentz text vs factors (see held_for_owner).

owner_verification (cannot be checked from the agent sandbox: outbound traffic to Render is blocked):
- Production `/api/health` must report `modePenyimpanan: "mongo"`. File mode loses every account on each Render redeploy, and any merge touching `server/**` redeploys.
- Decide whether Body Exposure's two modality selectors should become one.

residual_risks (accepted, tracked in `risk.dependency_supply_chain`): `gaxios -> uuid` (fix needs google-auth-library 9 -> 10) and `react-router < 7.18` (fix needs the v7 migration; client-only HashRouter, no SSR). P3, unfixed: `/api/cron/daily-briefing` takes its secret in the query string and compares with `!==`; `/api/posts/:id/like` is anonymous.

next_exact_action: re-scan the registries and pick the weakest core lane. At this head the only software-addressable gaps in `MATURITY_REGISTRY.yaml` are on `physiology.canonical_to_model_to_reality` (`limited_domain_coupling_coverage`, `limited_projection_wiring`, `no_patient_specific_parameter_identifiability_contract`); every other listed gap needs external validation, live infrastructure or human review. Prefer vertical depth on one of those over new breadth (`PANACEA_VERTICAL_COMPUTATIONAL_HUMAN_DOCTRINE.md`).
- `limited_projection_wiring`, measured by import trace on 2026-10-02: no module outside `src/lib/physiology/` imports the oxygen-transport, Fick, cerebral-perfusion, baroreflex, acid-base, Reality Error/Gap or longitudinal-boundary modules directly. `physiology/runtime.ts` is imported only by `humanStateProjection.ts` and `lib/biology/physiologyVerticalProjection.ts`; the first is imported only by `cognitiveTranslationKernel.ts`, the second by nothing, and nothing in `src/` imports the kernel. Only tests reach this chain, so no screen shows these outputs.
- The kernel is a contract-first planner (audience, intent and depth in, visible and recoverable truth lanes out), so it is not mistaken code. Connecting it to a screen is a product-design decision and the owner wants the UI simple and professional: propose the surface (what is shown, where, behind which disclosure) and get a yes before building it. New physiology couplings need verified sources for every constant; do not add one without them.

do_not_touch:
- open PRs of other agents unless integrating; re-check `git log --oneline -20 origin/main` for concurrent work before starting, since main moves between sessions.

verification_commands:
- `npm ci` in both `/` and `/server` on a fresh worktree. The server suite imports root modules, so a missing root `node_modules` false-fails with `Cannot find package 'react'`.
- `npm run uji` (638 files; 638/638 on the #2226 and #2227 branches) and `node --test scripts/qa/*.test.mjs` (403/403 after #2225; `npm run build` runs this glob). When merging through the API, pass the full head SHA read from the PR, never a hand-typed one.
- `cd server && npm run typecheck && npm run build && npm run uji` (exit 0 at #2210).
- Dependency gate: `npm audit --omit=dev --json > audit.json; node scripts/qa/dependency-audit-gate.mjs --workspace web --file audit.json`; for the server run it from `server/` with `--workspace server --policy ../governance/dependency-audit-policy.json`.
- Local browser QA in the agent sandbox: `node_modules/@playwright/test` there is a `0.0.0` shim. Install `@playwright/test@1.55.1` outside the repo, symlink it into `scripts/qa/node_modules/@playwright/test` (untracked), and preload a module that gives `chromium.launch` the sandbox Chromium `executablePath`. Commit nothing from that setup.

autopilot_handoff (2026-10-03 evening; owner asleep, routine "Panacea — autonomous engineering loop" fires about every 2 h):
- State at handoff: main was green at e8d20af29's parent 679570615; merged today: #2236 AaGradient, #2237 Lights, #2238 Charlson, #2239 nav catalogue (main was red), #2240 Widmark, #2241 Body3D failure log, #2242 Hydration, #2243 SleepDebt, #2244 ratchet, #2245 Body3D action timeout 60 s, #2246 SerumOsmolality, #2247 slider dots.
- Merge protocol (learned, keep): copy the FULL head SHA from the API into the merge call (the `sha` argument is not an enforced guard here — a wrong value was accepted once; the merged content was verified afterwards); merge only with 8 green checks at the exact head, `mergeable_state` clean, and the main run for the current main head finished (a merge cancels the in-flight Stabilization run via concurrency); one PR at a time.
- Main red first: read the job log with `get_job_logs`; a Body3D canvas-artifact timeout that passes on `rerun-failed-jobs` of the same commit is the known flake (the `BODY3D_CANVAS_ARTIFACT_FAILURE` line now shows page state). Never weaken a gate; never edit a test to go green.
- Empty-field ratchet: `scripts/uji/angka-kosong-ratchet.mts` + `governance/EMPTY_FIELD_ZERO_BASELINE.json` (152 occurrences in 47 files at handoff). Fixing a page requires `UPDATE_BASELINE=1 node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/angka-kosong-ratchet.mts`; the baseline never goes up. Next clinical pages: SofaScore, GraceScore, ChildPughScore, MaddreyScore, GlasgowBlatchfordScore, PediatricDkaCalculator, FluidCalculators, LdlCalculator, CorrectedCalcium, QTcCalculator. Pattern: domain function in `src/domains/clinical-calculators/engine/`, raw-text state + `parseNumberField`, test with hand values + boundaries + negatives + old-page regression grid, mutants must fail by name and the baseline test must pass before mutating (a vacuous run once passed because the baseline was failing).
- Do NOT, without the owner: merge #2226 (Naegele), act on tasks #5-#14, change the Body Exposure pages or gates, spend credits (Tripo credits are exhausted; Higgsfield about 2026-10-15, Tripo about 2026-11-15), or create new scheduled routines.
- Avatar spike (read-only, no code): `public/bodyexposure` holds 10 fixed-shape body sets (adult male/female, ICRP adult, ICRP paediatric neonate to 15 y); no morph targets and no skins. Size-driven personalisation would need scaling per region marked as an estimate; sets of different ages cannot be blended (different topology). Needs an owner design decision.
- Measured UX baseline: 114 routes at 390x844 on a production build: 0 horizontal overflow, 0 load failures, 0 page errors; the Home slider dots were the one confirmed small-target defect (fixed in #2247).



## Live reconciliation — 2026-10-05 Asia/Jakarta

This checkpoint supersedes stale status/next-action claims above, not their historical evidence.
No `.agents/` control plane exists; this canonical continuation record plus the existing registries
are retained as the durable state rather than creating duplicate governance.

- Canonical main inspected: `e40955fc1b7d9c4fd2d90b67bcbb886a1ecc301c` (#2261).
- #2260 and #2258 are merged (merge commits `7ac9231b` and `1a28f9c0` respectively).
- Highest-yield candidate: #2262 `fix/poli-patient-observation-scope`. Its old head
  `85f731b8c5ae50382490fc2aaad0d3d6f309bd0e` is NOT accepted: Stabilization run
  `37229459775`, job `111515874729` failed at Body3D Vessels click (20-second stability/visibility
  wait, responsive=true, no page errors). Do not label this a confirmed flake or bypass it.
- Independent review identified two additional gaps: account-global wearable cache could cross
  account identity; Date.parse accepted nonexistent dates. Follow-up closes both with explicit
  snapshot ownership and strict real-calendar timestamps. Regressions failed before the fix.
- Local evidence on the follow-up tree: 13 focused tests, production build (510 QA tests),
  657/657 deterministic files, architecture lint and ratchet (725 baseline entries) passed.
  Real Chromium headless-shell 390x844 Visit smoke passed future exclusion, current observation,
  foreign/missing owner rejection, valid own wearable, critical flag reconciliation and consent
  reset without overflow/page errors. Local evidence does not substitute for new-head GitHub CI.
- Review: independent code/security inspection found no important follow-up blocker. No clinical
  equation, clinical validation, deployment or external wearable-adapter validation is claimed.
- Next exact action: inspect #2262 current head and latest main; require fresh Validate changes,
  complete Stabilization, Body3D, Clinical Evidence and security gates. Investigate any red job.
  Merge with expected head only after accepted; verify merged content on main, then reassess.
- Completion accounting: no weighted accepted denominator exists here. Overall percentage and
  efficiency are unmeasured. This candidate is not counted complete until accepted and merged.
- Residual follow-up: audit other legacy personal caches/history for cross-account ownership;
  do not infer that this Visit-specific boundary fixes every browser health projection.

## Verified integration checkpoint — 2026-10-05 Asia/Jakarta

- #2262 merged at canonical main `921f3f4bd0b02a356602013128ef521b1a1ecd86`.
  Its tree exactly equals accepted head `cd34881ced06d986e87fe879518d3843c343df65`.
- Exact-head GitHub gates passed: Validate 37230447466; Stabilization 37230447504;
  Body3D 37230447533; Clinical 37230447444; Security Enforcement 37230447467;
  Security Inventory 37230447458. No valid gate was weakened.
- Visit evidence now rejects foreign/unbound account wearable snapshots and unavailable or
  malformed observations; consent resets across patient selection. Review fixes are merged.
- Next candidate: Visit kernel replay boundary. Retained samples must match session subject/visit
  and satisfy capturedAt <= receivedAt <= evaluation/review time. Strict calendar timestamps
  reuse the unchanged medical-device envelope validator in a shared kernel.
- Five adversarial regressions failed before fixes; independent review found no important blocker.
  Pre-sync production build, 657/657 deterministic files, architecture and ratchet passed.
  Candidate remains uncompleted pending synchronized checks, exact-head CI, merge/main evidence.
- Deployment evidence: Vercel latest READY production metadata references `103bd6008356b2770a92c3b316d364d898809742`;
  repository push-policy success is not proof these changes are deployed. No PostHog telemetry observed.
- Overall previous/current percentage, weighted delta and efficiency remain unmeasured: no
  authoritative weighted completion denominator. Count accepted functionality, never invent a percentage.

## Stabilization repair checkpoint — 2026-10-05 Asia/Jakarta

- NOT_READY: PR #2263 still requires fresh exact-head GitHub gates, accepted merge and canonical-main proof.
- Live main `641123ef5a7bcd9898fe677bbd8ccd921c79e3aa` is an ancestor of the synchronized candidate.
  Main advancement through #2269 was incorporated without rewriting shared PR history.
- Prior head `b487aeebaf100d9a0b9e957853791ab70ae0db38` failed Stabilization run `37296787213`
  at mobile canvas size 325x420 (minimum 480px), and Body3D run `37296787205` because a global
  organ canvas locator matched two legitimate viewers. Both failures were reproduced locally.
- Minimal repairs retain a 480px stage minimum and scope the organ smoke to the labelled reference
  viewer, selecting the canonical Heart, Liver & biliary and Kidney & urinary tract close-ups.
  Mesh, WebGL, download failure, page error and horizontal overflow checks remain enforced.
- Synchronized local tree passed production build (515 QA tests), 663/663 deterministic files,
  architecture lint (19 existing ignored violations) and ratchet (725 baseline entries).
- Browser 390x844: canvas 325x480, bounded DPR 1.49846, healthy WebGL, unobstructed center,
  orbit/progressive loading/biomechanics checks passed. Three organ sources loaded with HTTP 200
  and positive meshes, no page errors or horizontal overflow. Independent engineering review
  found no important blocker; Visit replay 5/5 and envelope/adapters/FHIR 29/29 passed separately.
- No geometry/assets, clinical equations or clinical-release claims changed. Engineering review
  is not qualified human clinical validation. Deployment, patient-specific avatar accuracy and
  overall completion percentage remain unmeasured.
- Next exact action: publish the synchronized candidate; inspect all new-head gates and causal
  logs, recheck live main/head/overlap, merge with expected head only when fully accepted, then
  verify canonical ancestry/content and post-merge acceptance before selecting the next task.

## Remaining acceptance repair — 2026-10-05

- Head `998e1022862531c3dfc38f1349ab386de8b589f7` passed Validate `37307441995`,
  full/server Stabilization `37307442040`, Clinical `37307442069`, Security Enforcement
  `37307442032` and Inventory `37307441979`. Body3D `37307441916` passed the organ,
  abdomen, ventilation and arterial gates, then failed on duplicate global Spleen buttons.
- Scope Spleen to the existing Lymph node stations group; retain all 65-station/159-mesh,
  selection, deselection, source-limit, hit-testing, overflow and error assertions.
- Local remaining gates passed lymphatic, hepatobiliary, skeletal, lesion, gland, moving
  panels and controls. Topbar reproduced a clipped training breadcrumb (188px in 172px);
  wrap semantic hierarchy headings within two lines at <=430px without shrinking controls.
  Training hierarchy fits 320/390/430px; existing overlap and share export smokes passed.
  Share-font provider requests failed locally: font fidelity remains unverified there.
- Independent engineering review found no important blocker. Long-title/enlarged-text
  accessibility is not fully proven. New-head CI, merge and canonical proof remain required.
- Next bounded candidate: draft #2268 OCR audit. Reproduced false-perfect numeric scores
  for superscript exponent/Unicode-minus errors and unbounded synchronous edit-distance work.
  Local fixes preserve numeric glyphs and reject empty/oversized comparisons without partial
  scores; deterministic and 390x844 fixture-based UI rejection/recovery checks passed.
  Provider OCR accuracy and original-photo benchmark remain unmeasured; keep draft until accepted.

### Canonical stabilization verification and cache isolation lane — 2026-10-05

- Canonical main `9aaea0b9ad020b9c99174d4c98bf71a66a454ba1` contains the expected
  squash of #2263. Its tree `b73a0250739185adbfa84148f585e29e62be80b9` is identical
  to accepted PR head `546f612a73769ebc60cdef17035c13542a3df6e9`.
- All six post-merge workflows succeeded on that exact main SHA: Stabilization
  37311143383, Body 3D 37311143407, Clinical Evidence 37311143321, Security
  Enforcement 37311143450, Pages 37311143348, Vercel Prebuilt 37311143341.
  Workflow success is not proof of a separately observed production deployment.
- #2268 OCR audit advanced to `dbe500e589b6ee8fa7363c99d62d6374f53485d7`, with
  current main as a parent and unchanged clinical confirmation. Local build,
  664/664 uji files, architecture, ratchet, and 390x844 rejection/recovery checks
  passed; independent engineering review found no important blocker. Exact-head
  acceptance is running. Provider/dataset accuracy remains unmeasured.
- New P0 reproduction: unowned lab cache and foreign wearable snapshots survived
  session replacement and could become the next patient's longitudinal evidence
  or lab upload. Real-browser two-tab tests additionally reproduced stale UI writes
  into the new session. No real patient data or live server mutations were used.
- Repair under validation: account+patient-scoped envelopes, ownership-checked reads,
  preserved legacy/anonymous copies, invalid-session rejection, and mounted UI identity
  checks at shared read/write boundaries. Expected-account projection reads no longer
  infer ownership from the current React label. Targeted regressions are passing;
  full validation, independent final review, exact-head CI and merge remain required.
- Existing owner-test and Nutrition hydration fixture now target the active envelope;
  their original behavioral assertions remain intact. No safety gate was disabled.
- Next audit: other legacy personal stores, especially health-profile hydration,
  asynchronous imports and vital-history ownership. This cache repair does not claim
  every personal-data store or all One OS integration is verified complete.


### OCR merge + personal-cache acceptance repair — 2026-10-05

- Canonical main is `8f2d1ab8890a6bc2482dfa0c347872e985cc1ee4`, the verified squash merge of #2268.
  #2268 entered main only after its synchronized head `dbe500e589b6ee8fa7363c99d62d6374f53485d7`
  passed Validate, Stabilization, Body 3D, Clinical Evidence, Security Enforcement and Security Inventory.
- #2270 remains the active P0 safety candidate. Its first exact-head Shared Longitudinal Snapshot run
  failed in the real-browser consumer smoke while deterministic longitudinal snapshot coverage passed.
- Root cause was acceptance-fixture identity drift: the remembered QA account omitted stable `account.id`,
  while the new ownership boundary intentionally requires exact `account.id + patientId` before personal
  lab/vital cache reads or writes. Production fail-closed behavior was retained unchanged.
- The fixture now carries a stable QA account id; branch ancestry was then synchronized with current main
  by merge commit `6acfd00a1b385b49199fa4734df453ce6984012a` without force-push. The main advance and #2270
  changed-file sets were disjoint; current ancestry was verified `behind_by=0` before this checkpoint update.
- Do not count #2270 complete from local or prior-head evidence. Fresh exact-head Shared Longitudinal Snapshot,
  Validate, Stabilization, Body 3D, Clinical Evidence and Security gates must all pass on the final candidate,
  followed by expected-head merge and canonical-main verification.
