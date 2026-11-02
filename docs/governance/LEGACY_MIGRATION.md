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

---

## Detailed Evidence Mapping for the Six Legacy Technical Workstreams

The legacy Alpha ledger (`governance/ALPHA_ACCEPTANCE_LEDGER.json`) remains permanently preserved as the historical archive (38 VERIFIED, 6 REPORTED, 1 DEFERRED; 38/44 active). To prevent reopening completed engineering tasks, the table below documents the exact mapping from each legacy REPORTED criterion to its canonical Acceptance V2 engineering completion, exact commit SHA, test evidence, verified automation result, and cleanly isolated H3 external human gate.

### Legacy D7 — Gait Contact & Biomechanical Foot Articulation
- **Legacy Status**: REPORTED (Archival baseline in `ALPHA_ACCEPTANCE_LEDGER.json`)
- **Associated V2 Criteria**:
  - `ENG-D7-01` (PASS at `96cbeacec78305a3d0512ce7a1ba88d8d62e0172`) — Verdict separation PASS / FAIL / UNMEASURABLE.
  - `ENG-D7-02` (PASS at `1d276d215f421e98e882c0da4742a06adc3e99f3`) — MTP-capable articulation, 4/4 fixtures measurable across male/female WALK/RUN.
  - `ENG-D7-03` (PASS at `b7410bef22bf896c9bc6779f10dc52b0402e1f4f`) — Rig landmark nodes `FOOT_LANDMARK_HEEL/BALL_<side>`.
- **Engineering Implementation**:
  - Blender MTP articulation: `bodyexposure/pipeline/build_rig_lower_limb.py`, `bodyexposure/pipeline/mtp_plane.py` (heuristic with 15 unit tests and pinned sensitivity in PR #2953).
  - Male rig: `ADULT_MALE` with articulated `TOE.L` / `TOE.R` at MT I-V head centre (GLB `b2c7cb609a7cc52064de4b5526ddfd2d9e15b6b261dcf44652aa5e1e3c887dc9`).
  - Female rig: `VHF_DENVER_CT` with derived MTP plane and split forefoot mesh (GLB `246118cb9d5bc0c8411d3826df16e257ca49fa982a52dfdbd294867d3077e682`).
  - Biomechanical metrics engine: `src/domains/body-exposure/engine/gaitFootMetrics.ts`, `scripts/qa/foot-contact-math.mjs`.
  - Machine-readable reports: `bodyexposure/qa_reports/gait_measurability.json`, `bodyexposure/qa_reports/gait_contact_probe.json`, `bodyexposure/qa_reports/gait_foot_contact_reproduction.{adult_male,vhf_denver_ct_adult_female}.json`.
- **Automated Test Evidence**:
  - `node --import=./scripts/uji/typescript-resolver.mjs scripts/uji/body-gait-measurability.mts` (4/4 fixtures measurable, byte-identical reproduction).
  - `node --import=./scripts/uji/typescript-resolver.mjs scripts/uji/body-gait-foot-metrics.mts` (Negative control UNMEASURABLE, zero-stance guard).
  - `node --import=./scripts/uji/typescript-resolver.mjs scripts/uji/body-gait-foot-contact-reproduction.mts` (Deterministic rerun matches committed JSON).
  - `node scripts/qa/glb-gait-seam-reproduce.mjs` (0-gap loop seams for quat and pos across both rigs).
  - `python3 -m unittest discover -s bodyexposure/pipeline -p test_mtp_plane.py` (15/15 unit & sensitivity tests OK).
- **Remaining H3 External Gate**: `EXT-D7-A` — Scientific/clinical threshold justification (Dr. Rizky / Prof. Mega clinical review; separate in `externalGates`).

---

### Legacy D8 — Public Asset Provenance & Licensing Integrity
- **Legacy Status**: REPORTED (Archival baseline in `ALPHA_ACCEPTANCE_LEDGER.json`)
- **Associated V2 Criteria**:
  - `ENG-D8-01` (PASS at `2dd319189b1149f0fd4b6a6d920451d617ff2e1a`) — SHA-256 asset inventory, zero untracked outside allowlist.
  - `ENG-D8-02` (PASS at `b7410bef22bf896c9bc6779f10dc52b0402e1f4f`) — In-app visible attribution page with all licence classes.
  - `ENG-D8-03` (PASS at `b7410bef22bf896c9bc6779f10dc52b0402e1f4f`) — Primary licence check URLs, dates, and SHA-256 hashes.
- **Engineering Implementation**:
  - Provenance inventory scanner: `scripts/qa/public-asset-inventory.mjs`, `governance/PUBLIC_ASSET_PROVENANCE_BASELINE.json`.
  - In-app attribution system: `public/bodyexposure/provenance.html`, `src/domains/body-exposure/engine/attributionCoverage.ts`, `bodyexposure/PROVENANCE.md`.
  - Primary licence verifier: `scripts/qa/glb-provenance-audit.mjs`, `governance/LICENCE_PRIMARY_SOURCES.json`.
- **Automated Test Evidence**:
  - `node --import=./scripts/uji/typescript-resolver.mjs scripts/uji/public-asset-provenance.mts` (644 public assets audited, fail-closed on untracked binary).
  - `node --import=./scripts/uji/typescript-resolver.mjs scripts/uji/body-attribution-coverage.mts` (506 GLBs, 14 licence classes, 463 sources checked).
  - `node scripts/qa/glb-provenance-audit.mjs` (7 licence classes verified against primary-source URLs and hashes).
- **Remaining H3 External Gates**:
  - `EXT-D8-A` — Logo authorship statement (`public/logo-mark.png`, Product Owner).
  - `EXT-D8-B` — Tutorial video media rights (`public/media/tutorial-video.mp4`, Product Owner).
  - `EXT-D8-C` — ICRP 145/156 legal counsel redistribution clearance (Legal Counsel).

---

### Legacy E4 — Runtime Privacy, PHI Redaction & Retention Controls
- **Legacy Status**: REPORTED (Archival baseline in `ALPHA_ACCEPTANCE_LEDGER.json`)
- **Associated V2 Criteria**:
  - `ENG-E4-01` (PASS at `8ed1065f4b5610ca03b08e2cd142dae985d7ac66`) — Fail-closed repository-wide PHI scanner.
  - `ENG-E4-02` (PASS at `bc0b8b840d64bd00a4033ec1a89301f5944e1989`) — Server logs carry 0 PHI across 74 routes / 124 markers.
  - `ENG-E4-03` (PASS at `b7329cb47ede927614b1367dece8082ab1178384`) — Automated retention and deletion sweep harness.
- **Engineering Implementation**:
  - Repository PHI scanner: `scripts/qa/phi-repo-scan.mjs`, `governance/PHI_SCAN_ALLOWLIST.json`.
  - Server log redaction & request guard: `server/uji/support/consoleRequestGuard.ts`, `server/src/modules/audit/`.
  - Retention & deletion sweep harness: `server/src/modules/retention/domain/retentionPolicy.ts`, `server/uji/retention.uji.ts`.
- **Automated Test Evidence**:
  - `node --test scripts/qa/phi-repo-scan.test.mjs` (31/31 tests pass, NIK/phone/email/filename detection and fail-closed redact).
  - `cd server && npx tsx uji/logPrivacyHttp.uji.ts` (74 routes in RBAC matrix driven with 124 markers; 0 PHI leakage in logs).
  - `cd server && npx tsx uji/retention.uji.ts` (Parameterized retention policy sweep, audit retention, negative expired retrieval).
- **Remaining H3 External Gates**:
  - `EXT-E4-A` — Legal counsel approval of UU PDP / Permenkes 24 retention periods and consent terms (Legal Counsel).
  - `EXT-E4-B` — Cloud provider infrastructure log retention audit on Render/Vercel (Infra Owner).

---

### Legacy E7 — Deterministic Deployment Automation & Staging-as-Code
- **Legacy Status**: REPORTED (Archival baseline in `ALPHA_ACCEPTANCE_LEDGER.json`)
- **Associated V2 Criteria**:
  - `ENG-E7-01` (PASS at `f6dd71855b0555be10ba8d74f7aa05aa0d1fbbdb`) — Deployed SHA verification and classification vs main.
  - `ENG-E7-02` (PASS at `f6dd71855b0555be10ba8d74f7aa05aa0d1fbbdb`) — Browser smoke check at 390x844 and 1440x900 against deployed artifact.
  - `ENG-E7-03` (PASS at `641c1eafa7eb656c8d1038fe571655f7e94a125d`) — Scripted rollback plan resolving target SHA to deployment URL.
  - `ENG-E7-04` (PASS at `da442f22d862d9dcc9c212e097b31ff07a59a8f1`) — Staging environment defined as code with fail-closed missing secrets check.
- **Engineering Implementation**:
  - Build marker stamping: `scripts/vite/buildMarker.mjs`, `scripts/qa/verify-deployed-sha.mjs`.
  - Production browser smoke: `scripts/qa/production-browser-check.mjs`, `.github/workflows/production-browser-check.yml`.
  - Automated rollback planner: `scripts/qa/rollback-plan.mjs`, `docs/governance/ROLLBACK.md`.
  - Staging workflow as code: `.github/workflows/staging-gate.yml`, `docs/governance/staging.env.example`.
- **Automated Test Evidence**:
  - `node --test scripts/qa/rollback-plan.test.mjs` (14/14 tests pass, ancestor resolution, side-branch rejection).
  - `node --test scripts/qa/staging-credentials.test.mjs` (9/9 tests pass, named secret missing validation, URL bounds).
- **Remaining H3 External Gates**:
  - `EXT-E7-A` — Formal production release SHA policy definition (Product Owner).
  - `EXT-E7-B` — Staging infrastructure provisioning and credential secrets injection (Infra Owner).
  - `EXT-E7-C` — Formal production release sign-off (Product Owner).

---

### Legacy F1 — Real Application User-Journey & RBAC Matrix Automation
- **Legacy Status**: REPORTED (Archival baseline in `ALPHA_ACCEPTANCE_LEDGER.json`)
- **Associated V2 Criteria**:
  - `ENG-F1-01` (PASS at `81999e3a7b28ace6625634b8edc7b4cfe4aa0a34`) — Browser journeys across patient, doctor, nurse, lab, owner roles at 390x844 and 1440x900.
  - `ENG-F1-02` (PASS at `7e19ddcabb8dff56cbc2ff43982c3fc29bcd6f41`) — HTTP RBAC matrix: positive and negative per role, tenant isolation.
  - `ENG-F1-03` (PASS at `81999e3a7b28ace6625634b8edc7b4cfe4aa0a34`) — Slow API, API 500, render-crash, and recovery coverage across 100% of critical inventory pages.
- **Engineering Implementation**:
  - Browser E2E journeys: `scripts/qa/user-journey-e2e.mjs`, `scripts/qa/user-journey-staff.mjs`.
  - Server HTTP RBAC controllers: `server/src/modules/auth/`, `server/src/modules/labResults/`, `server/src/modules/care/`.
  - Route error boundary & recovery: `src/components/RouteErrorBoundary.tsx`, `scripts/qa/user-journey-resilience.mjs`.
  - Critical page inventory: `governance/F1_CRITICAL_PAGES.json`, `scripts/qa/f1-critical-pages.mjs`.
- **Automated Test Evidence**:
  - `node --test scripts/qa/user-journey-resilience.test.mjs scripts/qa/f1-critical-pages.test.mjs` (14/14 tests pass).
  - `cd server && npx tsx uji/staffRbacHttp.uji.ts && npx tsx uji/careHttpRbac.uji.ts && npx tsx uji/labShareHttpRbac.uji.ts` (All 3 suites pass).
- **Remaining H3 External Gates**:
  - `EXT-F1-A` — Clinician tenant-wide vs assigned patient read scope policy (Product Owner).
  - `EXT-F1-B` — Dedicated staging/CI Google OAuth test client credentials (Infra Owner).
  - `EXT-F1-C` — Real-user usability study sessions per role (Product Owner).

---

### Legacy F2 — UX Automation, Axe-Core & WCAG 2.2 AA Accessibility
- **Legacy Status**: REPORTED (Archival baseline in `ALPHA_ACCEPTANCE_LEDGER.json`)
- **Associated V2 Criteria**:
  - `ENG-F2-01` (PASS at `f6dd71855b0555be10ba8d74f7aa05aa0d1fbbdb`) — WCAG 2.2 AA color contrast on critical pages, ratchet at 0 failures.
  - `ENG-F2-02` (PASS at `f6dd71855b0555be10ba8d74f7aa05aa0d1fbbdb`) — axe-core audit: 0 serious/critical, ratchet at 0.
  - `ENG-F2-03` (PASS at `f6dd71855b0555be10ba8d74f7aa05aa0d1fbbdb`) — Keyboard tab order reaches every primary action, 0 traps.
  - `ENG-F2-04` (PASS at `f6dd71855b0555be10ba8d74f7aa05aa0d1fbbdb`) — Screenshot regression luminance grid baselines per page x viewport x theme.
  - `ENG-F2-05` (PASS at `f6dd71855b0555be10ba8d74f7aa05aa0d1fbbdb`) — Performance budget gating (LCP/TBT median of N runs).
- **Engineering Implementation**:
  - Contrast auditor: `scripts/qa/kontras-wcag.mjs`, `governance/KONTRAS_BASELINE.json`.
  - Axe ratchet: `scripts/qa/axe-audit.mjs`, `scripts/qa/axe-ratchet.mjs`, `governance/AXE_BASELINE.json`.
  - Keyboard navigation analyzer: `scripts/qa/keyboard-audit.mjs`, `governance/KEYBOARD_BASELINE.json`.
  - Screenshot regression engine: `scripts/qa/screenshot-grid.mjs`, `governance/SCREENSHOT_GRID_BASELINE.json`.
  - Performance budgets: `scripts/qa/perf-audit.mjs`, `scripts/qa/perf-stats.mjs`.
- **Automated Test Evidence**:
  - `node --test scripts/qa/axe-ratchet.test.mjs` (11/11 tests pass, fail-closed on new critical/serious violation).
  - `node --test scripts/qa/keyboard-analisis.test.mjs` (9/9 tests pass, focus visibility & trap checks).
  - `node --test scripts/qa/screenshot-grid.test.mjs` (11/11 tests pass, luminance grid shift tolerance).
  - `node --test scripts/qa/perf-audit.test.mjs scripts/qa/perf-stats.test.mjs` (9/9 tests pass, Web Vitals budgets).
- **Remaining H3 External Gate**: `EXT-F2-A` — Manual assistive-technology and screen-reader usability pass (Manual QA).
