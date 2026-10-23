# PROJECT REALITY MAP

Snapshot: main `256a22de9687605b14297bb25b48319f257ccab7` (`test(f1): cover lab role in real API resilience journeys (#2684)`), 2026-10-23. Re-measure when the SHA changes; do not edit numbers by hand without a new SHA.

## 1. What PanaceaMed is (unchanged vision)
One longitudinal human/health OS: AI-EMR, Clinical, Your Body, Body Exposure (3D), sport/performance, Visit OS. Stack: React+TS+Vite (`src/`), Node+TS server (`server/`), Vercel (frontend), Render (server), GitHub Actions. Vision source: `PANACEA_ONE_OS_LONGITUDINAL_CARE_DOCTRINE.md`.

## 2. Measured size and cost surface (from `git ls-files`, workflows, API)
| Fact | Value |
|---|---|
| Tracked files `src/` / `server/` | 1931 / 243 |
| Frontend QA node tests `scripts/qa/*.test.mjs` | 148 (run inside `npm run build`) |
| Deterministic scripts `scripts/uji/` / server `server/uji/` | 784 / 140 files |
| GitHub workflows | 27 |
| Open PRs | 30 (many are other agents' drafts) |
| Required-for-merge CI (per CLAUDE.md §6.2) | `Validate changes`, Stabilization Acceptance, plus domain checks |

## 3. Path status: implemented / mocked / broken / untested
| Path | Status | Evidence |
|---|---|---|
| Auth, RBAC (patient, verified doctor, owner/admin, nurse, lab) over HTTP | **Implemented, tested** | `server/uji/staffRbacHttp.uji.ts`, `logoutRevokeHttp.uji.ts` |
| Browser journeys with synthetic identities 390x844 / 1440x900 | **Implemented, tested** | `scripts/qa/user-journey-e2e.mjs` (61 pass in prior local runs) |
| Real Google OAuth | **Untested** (synthetic sessions only) | EXT-F1-2 |
| Clinician reads whole tenant | **Implemented, policy undecided** | `docs/alpha/F1_CLINICIAN_ACCESS_AUDIT.md`, EXT-F1-1 |
| PHI in logs / repo | **Partially tested** (tested paths, known patterns) | ENG-E4-1/2/3; 3rd-party logs unreadable (EXT-E4-2) |
| Retention / consent policy | **Draft only, not approved** | `docs/alpha/E4_RETENTION_CONSENT_POLICY_DRAFT.md` |
| UI accessibility | **Partially measured**: axe serious/critical 0, contrast failures ratcheted (baseline small), 1500+ gradient/image elements unmeasurable | `governance/KONTRAS_BASELINE.json` |
| Public asset provenance | **2 assets without owner attestation**: `logo-mark.png`, `tutorial-video.mp4` | D8 docs |
| Gait (D7) | **Placeholder thresholds**; RUN/female unmeasurable | `bodyexposure/qa_reports/gait_foot_slide.json` |
| Deploy truthfulness | **Build marker + comparator exist**; no staging; release is scheduled (6 h) so main is usually ahead of the deployed SHA | `scripts/qa/verify-deployed-sha.mjs` |
| Clinical calculators (47 engines) | **Engineering-tested, `clinically_reviewed=false`** | C6 deferral |

## 4. Observed state of main (this pass)
**Root cause of most red checks: `ubuntu-latest` rolled to Ubuntu 26.04 (kernel >= 6.19).** Playwright 1.55 aborts (`does not support chromium on ubuntu26.04-x64`) in user-journeys/proof-shard/full-acceptance, and the Mongo service container cannot start (SERVER-121912). Mongo 8.0.34 did not help (#2690 closed). Fix: pin `ubuntu-24.04` (#2691); `mongo-persistence` turned green on that PR.

Main `256a22de9` push-triggered runs: **Stabilization Acceptance, Body 3D Render Acceptance, Dependency Audit Gate, User Journey Acceptance (F1) = failure**.
- Dependency Audit Gate: root-caused. 4 new **high** advisories in server prod deps (`@modelcontextprotocol/server`, `follow-redirects`). Fix: PR #2688.
- User Journey Acceptance: failed at step "Install browser" (infrastructure, not an assertion). Not yet re-run; treat as flaky-infra until a re-run proves otherwise.
- Stabilization Acceptance / Body 3D: not diagnosed in this pass. Raw job logs are not downloadable from this environment's `gh`; the MCP job-log tool returns only the tail.
- Scheduled `Production browser check` and `Vercel Prebuilt Production` failed on schedule events; they monitor production and are not merge gates.

## 5. Root causes of the loss of trust (evidence-based)
1. **One denominator mixed engineering with human decisions.** Legal, clinical and ownership questions sat inside the same 44 criteria, so AI work could not close them however many credits were spent. Human specialists are not available now; v2 defers them to a final stage.
2. **Criteria without a single runnable definition.** e.g. F2 "no critical finding", D7 "within documented limit", E7 "SHA equals main" (undefined for a scheduled release).
3. **Concurrency design wastes CI.** Stabilization Acceptance uses `cancel-in-progress: true` on main, so a newer commit cancels an older SHA's run; cancelled is neither pass nor fail (decision pending: task #12).
4. **Overlapping agent work.** 30 open PRs, several for the same lane; stale heads.
5. **Reporting churn.** Repeated status documents instead of closing a failing check.

## 6. Dependency graph (what blocks what)
```
dependency audit (P0) ─┐
CI infra stability ────┼─► green main ─► any merge ─► releases ─► E7 evidence
RBAC/PHI tests (P0) ───┘
F1 policy (EXT) ─► role changes      D8 attestation (EXT) ─► D8 complete
E4 policy (EXT) ─► retention tests   C6 specialists (EXT) ─► clinical validation
```
