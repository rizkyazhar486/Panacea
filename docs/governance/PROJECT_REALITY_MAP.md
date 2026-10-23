# Project Reality Map

Snapshot: main `256a22de9687605b14297bb25b48319f257ccab7`, 2026-10-23. Re-snapshot only when main
moves *and* the change touches the area; do not repeat discovery on an unchanged SHA.

## 1. Why the old system stalled (root causes)

1. **One status mixed engineering and human decisions.** Six legacy criteria (D7, D8, E4, E7, F1, F2)
   each needed both code work and a human decision (licence attestation, legal policy, release
   policy, clinician access scope, manual QA, scientific threshold). They could never reach
   VERIFIED, so agents kept producing more evidence and status docs for the same six items.
2. **PR sprawl without WIP limits.** 65 open PRs on this snapshot, 200+ merged since 2026-10-10;
   at least four open PRs (#2552, #2634, #2641, #2662) rewrite the same governance files
   (`AGENTS.md`, `CLAUDE.md`, checkpoint docs).
3. **Instruction bloat.** `AGENTS.md` 32 KB + `CLAUDE.md` 25 KB + 17 doctrine files; the
   continuation checkpoint is a 938-line narrative. Agents spend credits re-reading and re-deriving.
4. **Main is red and nobody owns it.** On 256a22de: Stabilization, Body 3D, User Journey (F1) and
   Production browser check fail because `ubuntu-latest` moved to 26.04 (Playwright 1.55
   unsupported); Dependency Audit fails on 4 high server advisories. Branch protection is not
   enabled on `main` (API: "Branch not protected"), so red checks do not block merges.
5. **27 workflows, overlapping purposes** (three `stabilization-*`, two `bangunkan-server*`), so
   "green" is hard to read.

## 2. Product inventory

| Area | Code | State | Evidence source |
|---|---|---|---|
| Frontend app | 110 pages in `src/pages`, 17 domains in `src/domains`, React/TS/Vite | Implemented | `npm run build`, `npm run uji` (784 uji files) |
| Backend | Express/TS in `server/src`, modules `labResults`, `visits`, MCP under `server/src/mcp` | Implemented | `server/uji` (140 suites), `server-validate` |
| One OS clinical flow (identity → encounter → sign → follow-up) | server encounter + clinical store | Implemented + tested (legacy A1–A8 VERIFIED) | `encounterHttpRestart.uji.ts` |
| Lab & referral closure | `server/src/modules/labResults` | Implemented + tested (B1–B9) | `hasilLab`, `labReferral*Http*.uji.ts` |
| Auth / RBAC | Google OAuth + roles (patient, doctor, nurse, lab, owner, admin) | Implemented; **real OAuth untested in CI**; contributor role has no backend capability | `*HttpRbac.uji.ts`, F1 journeys |
| Clinical calculators | 47 engines in `CALCULATOR_REVIEW_REGISTRY.json` | Implemented + engineering-tested; **0 clinically reviewed** | independent-reference suites |
| Body Exposure 3D | `src/domains/body-exposure`, GLBs in `public/bodyexposure` | Implemented; gait slide partly measured; 2 assets rights-unknown | Body 3D Render Acceptance |
| Privacy | PHI repo scan, log privacy suite | Partial: tested paths only; no approved retention policy | `phi-repo-scan`, `logPrivacyHttp` |
| Delivery | Vercel (frontend, prebuilt workflow), Render free plan (backend), GitHub Pages | Implemented; **no staging**; release on schedule/dispatch | `verify-deployed-sha`, production browser check |
| Wearables / devices | adapters + envelopes under `scripts/qa/*device*`, `visit-device-adapters` | Mostly contract/mocked; no proven production adapter | per-adapter tests |
| AI services / MCP | `server/src/mcp` | Implemented; SDK had high advisories (fix PR #2687) | `uji/mcp*.uji.ts` |

Classification words: **Implemented** (code on main), **Tested** (deterministic test on main),
**Mocked** (contract or fake adapter only), **Untested**, **Out of scope** (H2 or research).

## 3. Dependency graph (what blocks what)

```
ENG-CI-02 runner pin ─┐
ENG-SEC-01 deps ──────┼─► ENG-CI-01 main green ─► every H0 regression pack (REG-A..E)
                      │                         └► every browser criterion (F1, F2, D, E7-02)
EXT-E7-A release policy ─► E7 "released" meaning ─► H1 exit
EXT-E7-B staging creds  ─► staging gate
EXT-F1-A clinician scope ─► RBAC change (if any) ─► F1 policy-complete
EXT-E4-A legal policy   ─► E4 "compliant" claim
EXT-D8-A/B attestation  ─► D8 rights-complete
EXT-C6-A reviewer       ─► any clinical use of calculators
```

Engineering work never waits on an EXT gate unless it would *decide* that gate's policy.

## 4. Risks (top 5)

| Risk | Severity | Control |
|---|---|---|
| Red main hides regressions; no branch protection | P0 | ENG-CI-01 + enable protection (EXT owner action, see EXTERNAL_GATES §Repo) |
| Known high advisories in backend deps | P0 | ENG-SEC-01, PR #2687 |
| Clinician reads whole tenant | P1 | EXT-F1-A decision; tests pin current behaviour |
| Calculators used clinically before review | P1 | ENG-C6-03 label gate; EXT-C6-A |
| Release SHA ambiguity | P1 | ENG-E7-01/02 evidence; EXT-E7-A policy |
