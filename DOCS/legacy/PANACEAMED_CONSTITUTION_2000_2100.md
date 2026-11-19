# PANACEAMED CONSTITUTION (2026–2100+)

**Steward & Originator:** dr. Rizky Muhammad Azrissal (`@rizkyazhar486`)
**Platform:** PanaceaMed OS (`rizkyazhar486/Panacea` · `https://panaceamed.id`)
**Operating Horizon:** Century-Scale Continuity (2000–2100+)

---

## ARTICLE I — HIPPOCRATIC & UNIVERSAL HUMANITARIAN COVENANT

Every generation of software, AI models, and clinical tools under PanaceaMed OS is permanently bound to the **Humanitarian Free-Forever Core**:

1. **Simple Voice Mode (`UniversalSimpleDeck` / `SimpleHome`)** — High-contrast, low-literacy accessible navigation with 1-tap voice read-aloud (`humanitarianFreeCore = true`).
2. **Hippocratic Dual-Lens Education (`hippocraticBridgeEngine`)** — Synchronized plain-language, patient-partner, and clinician-brief medical translation that closes understanding gaps while preserving identical clinical truth.
3. **Emergency Red-Flag Triage (`emergency_red_flag_triage`)** — Fail-closed vital, symptom, airway/SpO2, and crisis safety escalation (`Ke IGD Sekarang`) with zero paywall barriers, ever.
4. **Offline Universal Health QR (`offline_universal_health_qr`)** — User-owned, zero-internet-required emergency summary pass (`PANACEA-QR-V1`) carrying only explicitly approved critical facts (blood type, allergies, conditions, active regimen, emergency contact).
5. **Core BodyExposure Explorer (`core_body_exposure_explorer`)** — Whole-body multiscale visual anatomy from 1.7m down to cellular/molecular anchors (`truthClass`-tagged, `clinically_reviewed = false` unless authorized human review exists).

These five capabilities are enforced both in TypeScript (`HUMANITARIAN_FREE_CORE_FEATURES` / `evaluateEthicalOpenCoreEntitlement`) and in PostgreSQL DDL (`humanitarian_free_core = TRUE CHECK`).

---

## ARTICLE II — ETHICAL OPEN-CORE COMMERCIALIZATION BOUNDARIES

PanaceaMed achieves financial sustainability through transparent value creation without harming patients or trust:

- **Permitted Ethical Tiers:**
  - `pro_twin`: Enhanced multi-device cloud telemetry history, automated Neon backup sync, and extended longitudinal trend storage.
  - `clinic_saas`: SATUSEHAT / FHIR R4 clinical Visit OS, practitioner workflow tooling, and clinic scheduling infrastructure.
  - `research_api`: Explicitly consented, de-identified population validation and benchmarking workflows under IRB/ethics oversight.
- **Unconditionally Prohibited Acts (`personalDataSaleAllowed = false`, `emergencySafetyPaywallAllowed = false`):**
  - Never sell, rent, broker, or monetize raw personal health records or biometric streams.
  - Never gate emergency triage alerts, red-flag warnings, or essential doctor–patient comprehension behind paid subscriptions.
  - Never apply manipulative dark patterns, fabricated urgency, or unverified `E3`/`E4` marketing claims (`claim-guard.mjs` + `reproducibleValidationEngine.ts`).

---

## ARTICLE III — SCIENTIFIC HONESTY & EPISTEMIC LAW

1. Every computed health output MUST carry an explicit `truthClass` (`measured | estimated | simulated | curated_physiology | retrospective`).
2. Missing or corrupted observations remain `null` or `unavailable` — never coerced silently to zero (`angka-kosong-semantik`).
3. `E3` and `E4` clinical validation status cannot be asserted by AI agreement or self-label; `evaluateEvidenceMaturity()` fails closed back to `E2` unless a SHA-256-verified external validation manifest (`datasetRef`, `sampleSizeN >= 30`, `ethicsApprovalRef`, `protocolVersion`, `reproductionCommand`) passes verification.

---

## ARTICLE IV — GENERATIONAL SUCCESSION & TECHNICAL LONGEVITY (2026–2100+)

To ensure PanaceaMed survives platform churn, corporate transitions, and generational handoffs across 75+ years:

1. **Zero Vendor Lock-In Portability:**
   - Primary database schema uses standard portable SQL DDL (`sql/001_panaceamed_neon_os.sql`, `sql/002_panaceamed_legacy_governance.sql`) with Row-Level Security (`app.current_profile_key`).
   - Patient records export deterministically to open standards: RFC-4180 CSV, Canonical JSON with SHA-256 digests, HL7 FHIR R4 Bundles (`LOINC`/`UCUM`), and GLTF 3D anatomical assets.
   - Heavy reference corpora are statically sharded as plain JSON (`public/data/corpora/{skdi,osce}/`) serveable from any static HTTP host or local storage medium indefinitely.
2. **Solo-Human + AI Operating Cadence:**
   - Single-orchestrator advisory lock (`scripts/ops/orchestrator-lock.mjs`) prevents drift.
   - Deterministically reproducible build & 7-dimension continuous trust verification (`scripts/ops/neon-trust-gate.mjs`).
3. **Steward Custody Checklist (For Founder & Future Heirs):**
   - Domain DNS & Registrar custody (`panaceamed.id`)
   - GitHub Repository (`rizkyazhar486/Panacea`) & Hardware Passkeys / Recovery Codes
   - Cloudflare Account (`wrangler.toml` Pages project + `DATABASE_URL` secret binding)
   - Neon Serverless PostgreSQL Project (branch snapshots + encrypted offline SQL dumps)
   - Open License & Ethics Audit Ledger preservation (`governance/`, `docs/legacy/`)
