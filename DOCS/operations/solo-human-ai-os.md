# PanaceaMed.id OS — Solo-Human + Autonomous AI Fleet Operating Manual

**Sole Human Commander:** `dr. Rizky Muhammad Azrissal` (`@rizkyazhar486`)
**Operating Ratio:** `1 Human Commander : 8 Autonomous AI Agent Roles (0 Employees)`
**Production Stack:** Cloudflare Static Assets (`wrangler.toml`) + Neon Serverless PostgreSQL (`sql/001_panaceamed_neon_os.sql`) + Local-First Browser Vault (`pmd_neon_sync_outbox_v1`)

---

## 1. Commander-Only Authority (4 Exclusive Human Responsibilities)

1. **Product Vision & Aesthetic Taste:** Final direction on simplicity, visual craft, and user ergonomics ("Health, Made Visible").
2. **Clinical & Ethical Boundary Approval:** Human-in-the-loop sign-off on safety gates, truth-class honesty, and regulatory posture (*Siddiq, Amanah, Tabligh, Fatanah, Shifa*).
3. **Priority Directives:** Sequencing execution waves without expanding simultaneous surface complexity.
4. **Final Production Merge & Release Sign-Off:** Approving verified changes after automated CI/QA proof gates pass.

---

## 2. Eight Autonomous AI Fleet Roles

| # | Autonomous AI Role | Automated Execution Surface | Hard Proof Gate |
|---|---|---|---|
| 1 | **Chief Architect & Refactor Agent** | Pure domain isolation (`src/domains/`), Clean Architecture boundaries, compact PR sizing | `npm run lint:ratchet`, `npm run lint:arsitektur` |
| 2 | **QA, Purity & Security Sentinel Agent** | Unit/contract tests (`scripts/qa/*.test.mjs`, `scripts/uji/*.mts`), PHI & claim scanning | `node scripts/qa/claim-guard.mjs`, `phi-repo-scan.mjs`, `security-baseline-enforcement.mjs` |
| 3 | **Zero-Ops Edge & Neon DevOps Agent** | Cloudflare SPA build (`wrangler.toml`, zero `_redirects` loop), idempotent Neon DDL & seed | `node scripts/db/push-neon.mjs --dry-run` / live push, `home-css-build-contract.mjs` |
| 4 | **3D Spatial & Blender MCP Agent** | Z-Anatomy `.glb` validation (`MeshoptDecoder`), dielectric `PAN_*` shading, landmark parity | `scripts/uji/pemuat-glb-meshopt.mts`, Blender landmark parity checks |
| 5 | **Biomedical R&D & Literature Verification Agent** | Deterministic physiology, longevity, fascia, & PGx engines tied to PMID/DOI ledgers | `validate-source-registry.mjs`, `validate-academic-review.mjs` |
| 6 | **Clinical Interoperability & Governance Agent** | FHIR R4 / SATUSEHAT mappers, LOINC/UCUM, SKDI 732-disease index, WHO ICD-11 Ch. 26 | `scripts/medstudy/gen-note-index.mjs --check`, `acceptance-v2.mjs` |
| 7 | **Product UX & Ruthless Simplicity Agent** | Dark-glass astronomical minimalism, WCAG AA contrast, >=44px touch targets, gzip budgets | `bundle-budget.mjs`, `lapisan-tambal-dilarang.mts`, Playwright `390×844` audit |
| 8 | **Self-Serve Onboarding & Documentation Agent** | Bilingual plain-language guides (`ID`/`EN`), in-app tooltips, executive release briefs | Zero human support tickets required for standard onboarding |

---

## 3. Self-Healing Autonomous Loops (Zero Babysitting)

- **Zero-Downtime Local-First Sovereign Runtime:** If an external backend spins down (`503`/suspended), times out, or Google OAuth origin validation fails, the client seamlessly serves `/#/login`, `/#/profile`, `/#/tubuh`, and `/#/clinical-hub` from scoped browser storage and enqueues idempotent mutations in `pmd_neon_sync_outbox_v1` for reconciliation into `panacea_sync_outbox`.
- **Single-Command Cloud Database Sync:**
  - Offline validation: `node scripts/db/push-neon.mjs --dry-run`
  - Live Neon push: `DATABASE_URL="postgres://<user>:<pass>@<neon-host>/<db>?sslmode=require" node scripts/db/push-neon.mjs`
- **Cloudflare SPA Integrity Rule:** `wrangler.toml` enforces `not_found_handling = "single-page-application"` against `./dist`. Always confirm `dist/_redirects` does not exist prior to deployment so Cloudflare rule `[code: 100324]` cannot recur.
- **Commander Executive Digest:** Every automated cycle reports a 1-page **Green / Amber / Red** status listing exact gate names, gzip metrics, and copy-paste remediation commands, capping weekly solo-founder oversight under 15 minutes.
