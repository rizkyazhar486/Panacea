# ACCEPTANCE V2 — engineering criteria (AI-solvable)

> Status: **DRAFT PROPOSAL — awaiting Product Owner approval.** Machine-readable source: [`governance/ACCEPTANCE_V2.json`](../../governance/ACCEPTANCE_V2.json). Validator: `node --test scripts/qa/acceptance-v2.test.mjs`.

## Rules

- Denominator: **22 engineering criteria**, counted separately from **11 external gates** ([EXTERNAL_GATES.md](EXTERNAL_GATES.md)). Both numbers are always reported together; neither is removed to raise a percentage.
- Allowed statuses: `PASS`, `FAIL`, `NOT_RUN`. **No v2 criterion is `VERIFIED`** — legal, clinical and production claims are not engineering results.
- `PASS` requires the command and the negative control to pass on the **exact SHA**, with evidence recorded per [VERIFICATION_V2.md](VERIFICATION_V2.md). Otherwise `FAIL` or `NOT_RUN`.
- A criterion exists only if it has an executable command and a negative control. Work without a test yet (e.g. staging environment) is a roadmap task, not a criterion.
- Thresholds may not change after a failure without a written justification and owner approval (versioned in the JSON).

## Criteria

| ID | Legacy | Capability | Prio | Horizon | Command | Negative control |
|---|---|---|---|---|---|---|
| ENG-D8-1 | D8 | Asset inventory covers every binary under public/ | P1 | H0 | `node scripts/qa/public-asset-inventory.mjs` | node --test scripts/qa/body-public-asset-inventory.test.mjs (asset without trace -> named failure) |
| ENG-D8-2 | D8 | GLB per-node source/licence/accuracy metadata | P1 | H0 | `node scripts/qa/glb-provenance-audit.mjs` | node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/body-asset-provenance.mts |
| ENG-D8-3 | D8 | Unprovenanced assets are listed for owner attestation, never deleted or self-attested | P2 | H0 | `node --test scripts/qa/d8-attestation-facts.test.mjs` | same test: changed hash -> fails by name |
| ENG-F1-1 | F1 | Role/tenant authorization over real HTTP (staff, patient, lab, share) | P0 | H0 | `cd server && PANACEA_DATA_FILE=$(mktemp -u).json npx tsx uji/staffRbacHttp.uji.ts` | cd server && PANACEA_DATA_FILE=$(mktemp -u).json npx tsx uji/logoutRevokeHttp.uji.ts (revoked token -> 401) |
| ENG-F1-2 | F1 | Synthetic-identity browser journeys at 390x844 and 1440x900 | P0 | H0 | `node scripts/qa/user-journey-e2e.mjs` | scripts/qa/f1-negative-evidence.mjs (dead-end / leaked text fail by step name) |
| ENG-F1-3 | F1 | Clinician tenant-read behaviour is characterised, not silently changed | P1 | H0 | `cd server && PANACEA_DATA_FILE=$(mktemp -u).json npx tsx uji/clinicianTenantReadHttp.uji.ts` | non-clinician and cross-tenant cases in the same file |
| ENG-E4-1 | E4 | Repo PHI pattern scan | P0 | H0 | `node scripts/qa/phi-repo-scan.mjs` | node --test scripts/qa/phi-repo-scan.test.mjs |
| ENG-E4-2 | E4 | Server log redaction on tested clinical paths | P0 | H0 | `cd server && PANACEA_DATA_FILE=$(mktemp -u).json npx tsx uji/logPrivacyHttp.uji.ts` | cd server && PANACEA_DATA_FILE=$(mktemp -u).json npx tsx uji/postsPrivacyHttp.uji.ts |
| ENG-E4-3 | E4 | Personal-data endpoints deny cross-user access | P0 | H0 | `cd server && PANACEA_DATA_FILE=$(mktemp -u).json npx tsx uji/personalDataHttpRbac.uji.ts` | negative cases in the same file |
| ENG-F2-1 | F2 | WCAG contrast does not regress and is measured honestly | P2 | H0 | `node scripts/qa/kontras-wcag.mjs` | node scripts/qa/kontras-ukur.fixture.mjs |
| ENG-F2-2 | F2 | axe serious/critical = 0 and incomplete does not grow | P2 | H0 | `node scripts/qa/axe-ratchet.mjs` | node --test scripts/qa/axe-ratchet.test.mjs |
| ENG-F2-3 | F2 | Keyboard order and visible focus | P2 | H0 | `node scripts/qa/keyboard-audit.mjs` | node --test scripts/qa/keyboard-analisis.test.mjs |
| ENG-F2-4 | F2 | Screenshot grid parity across viewport and theme | P2 | H0 | `node scripts/qa/screenshot-grid.mjs` | node --test scripts/qa/screenshot-grid.test.mjs |
| ENG-F2-5 | F2 | UX structural audit: overflow, unnamed controls, 44px targets, reduced motion | P2 | H0 | `node scripts/qa/ux-audit.mjs` | fail-closed without baseline |
| ENG-F2-6 | F2 | Bundle size budget | P2 | H0 | `node scripts/qa/bundle-budget.mjs` | exceeding a limit fails by chunk name |
| ENG-D7-1 | D7 | Gait foot-slide assessed against an explicit criterion; UNMEASURABLE distinct from PASS/FAIL | P3 | H2 | `node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/body-gait-foot-metrics.mts` | same: too few stance phases -> UNMEASURABLE, not PASS |
| ENG-D7-2 | D7 | Contact phases reproduced from raw GLB (WALK/RUN, both sexes) | P3 | H2 | `node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/body-gait-foot-contact-reproduction.mts` | node --test scripts/qa/compare-blender-gait-contact.test.mjs |
| ENG-D7-3 | D7 | Rig coordinate decode is exact | P3 | H2 | `node --test scripts/qa/gait-coordinate-decode.test.mjs` | corrupted input rejected |
| ENG-E7-1 | E7 | Deployed-SHA comparator classifies equal/ancestor/diverged | P1 | H0 | `node --test scripts/qa/deploy-equivalence.test.mjs` | diverged SHA -> not equal |
| ENG-E7-2 | E7 | Build marker equals built commit; null never fabricated | P1 | H0 | `node --test scripts/qa/frontend-build-info.test.mjs` | malformed SHA -> null |
| ENG-C6-1 | C6 | Independent-reference numerical checks for calculators | P1 | H2 | `node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/calculator-independent-reference.mts` | hostile-input matrix in scripts/uji/calculator-independent-reference-2.mts .. -10.mts |
| ENG-G-1 | governance | This criteria file is well-formed and every engineering criterion is executable | P0 | H0 | `node --test scripts/qa/acceptance-v2.test.mjs` | sabotaged copies fail by name (same test) |

Initial status of every criterion is `NOT_RUN`. The commands marked in [VERIFICATION_V2.md](VERIFICATION_V2.md) were executed once on main `256a22de9` to prove they run; that is execution proof, not a recorded PASS.
