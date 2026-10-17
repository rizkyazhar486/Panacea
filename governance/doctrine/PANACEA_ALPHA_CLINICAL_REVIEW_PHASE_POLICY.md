# Panacea — Alpha Clinical Review Phase Boundary (Owner Directive)

**Scope:** All Alpha criteria and agents working on clinical calculators, clinical AI, anatomy, physiology, clinical safety labels, and acceptance reporting.  
**Owner decision:** 2026-10-17 — formal independent clinical review/sign-off is deferred from **Alpha engineering acceptance** to the subsequent **Clinical Validation** phase.  
**Authority:** Specific owner scope decision; read together with `CLAUDE.md` §8 and `AGENTS.md`. This directive **does not override clinical safety, security, provenance, privacy, or patient-level authorisation**.

## 1. Universal Alpha phase rule

1. **Do not require formal external/independent clinician approval** of model/calculator output, reference ranges, coefficients, anatomical accuracy, or prospective clinical performance **as a condition of completing the Alpha engineering milestone**. Such approval belongs to the later Clinical Validation phase.
2. **Do not cancel, fabricate, or silently mark completed any clinical validation.** Preserve review packages, unresolved clinical discrepancies, primary references, risks, reviewer ownership, and historical evidence as explicit deferred work.
3. Clinical engineering quality still applies across every module: input contracts; reproducible, independent reference checks where available; positive, negative, boundary and mutation tests; provenance and uncertainty labels; fail-closed behaviour; and current-head CI/required code review. No shortcuts to make tests green.
4. This is a **milestone scope change**, not a release authorisation. Unvalidated medical functions must not be represented or exposed as validated clinical decision-making in patient care. Production/clinical deployment gates remain in force where applicable.

## 2. C6 treatment — defer, never whitewash

- **C6** ("Rentang masukan ditinjau klinisi"; acceptance: authorised reviewer signs off calculator ranges) is an explicitly **deferred Clinical Validation criterion**, not an engineering failure and **not VERIFIED** in Alpha.
- Target explicit ledger status: `DEFERRED_TO_CLINICAL_VALIDATION` (or an equivalent machine-defined deferral with the same semantics). **Never** set C6 to `VERIFIED`, set `clinically_reviewed=true`, fabricate a reviewer/signature/date, or delete its review dossier.
- Preserve the existing `C5` machine-verifiable review-label gate, and preserve all engineering/safety tests for calculators. C6's deferred review must retain its own named record/owner in the next phase.
- **C6 must not block closing Alpha engineering** solely because a formal clinician reviewer has not signed. This instruction does not remove clinical oversight from real-patient care workflows.
- Engineering discrepancies (e.g. inconsistent corrected-sodium or potassium-deficit implementations) remain documented and safety-gated; do not choose or modify clinical formulas without sufficient source justification and review appropriate to the change.

## 3. Active Alpha denominator and reporting

Maintain **both** a historical record and an explicit active-scope report:

- Historical inventory: **45 originally defined criteria**, including C6, retained for traceability.
- Owner-authorised *target* active Alpha scope: **44 criteria** (45 less 1 formally deferred C6).
- Count `VERIFIED` only when each *active* criterion has passed its actual engineering acceptance criteria. `DEFERRED_TO_CLINICAL_VALIDATION` receives **zero VERIFIED credit** and is excluded only from the **active-scope denominator**; it remains visible as a deferred obligation.
- Report separately: `verified_active / active_total`, `deferred_clinical`, and `historical_total`. If the ledger currently reports 38/45, continue describing that as the **current machine-ledger state** until the canonical data/schema, renderer, automated acceptance checks, and documentation are updated and validated. Do **not** silently claim 38/44 or 100% before that migration is actually integrated.
- The owner has authorised *rephasing* the formal review criterion, not editing test history, retroactive approvals, or removing other engineering acceptance requirements. Changes to the machine ledger must be explicit, reviewed, generated through its normal workflow, and exact-head CI-validated.

## 4. Safety boundaries that remain mandatory

This deferral **does not** waive:

- Actual clinician review/signature and RBAC required for individual clinical records, treatment orders, care plans, or patient-facing medical decisions.
- AI output remains draft, with visible uncertainty and `clinically_reviewed=false`, until a genuinely authorised reviewer completes any required validation. No autonomous diagnosis, dosing, prescribing, procedural or emergency decisions.
- Input validation, missing-vs-zero semantics, fail-closed handling, audit, security, consent, data provenance, and numerical correctness.
- Legal/privacy/asset-licence owner decisions, production readiness, independent release checks, or deployment verification.
- The ability of qualified clinicians, legal advisers, or regulators to require stronger gates before clinical deployment; milestone completion is not clinical authorisation.

## 5. Agent execution directive

When working on Alpha:
1. Finish independently actionable engineering tasks and acceptance evidence; do not stall unrelated work awaiting formal clinical sign-off.
2. Keep formal clinical review packages ready for the later phase, with reviewers listed as **unassigned** unless genuinely designated.
3. Keep C6 explicitly **deferred** until the scoped canonical ledger migration is validated; never force a status by editing generated Markdown.
4. Continue E4, E7, D7, D8, F1, and F2 under their *unchanged* evidence/authorisation boundaries.
5. Report the real status, remaining engineering blockers, deferred clinical obligations, and clinical-use limitations distinctly.

**Source of truth for current numerical status:** `governance/ALPHA_ACCEPTANCE_LEDGER.json` and generated `docs/alpha/ALPHA_ACCEPTANCE_LEDGER.md`. This directive governs the planned phase boundary; it is **not evidence that the ledger migration or clinical validation has already happened**.
