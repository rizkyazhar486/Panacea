# Outcome-first PanaceaMed OS — initial encounter slice

## Origin and intent

Owner-provided 19 October 2026 screen recording contrasts selling isolated AI tools with completing an actual job through AI agents and autopilot. The business examples shown involve bookkeeping, recruiting and contract drafting. These concepts are translated, not copied, into a healthcare workflow.

PanaceaMed delivers continuity of one trusted outpatient care episode rather than new, disconnected AI widgets. Its promise is reducing handoffs and missed administrative work while retaining clinician control of medical decisions.

## Implemented in this branch

- A read-only outcome projection in src/domains/clinical-operations/model/encounterOutcomeJob.ts.
- A compact next-action call to action and collapsible evidence detail on existing Visit OS.
- Eight regression tests in scripts/qa/encounter-outcome-job.test.mjs.
- No new patient database, no background worker, no autonomous prescription, clinical signing, claim submission or inference of patient benefit from workflow flags.
- Stages: encounter context, clinician sign-off, care handoff, and follow-up outcome. Only current, clinician-signed record evidence receives the label verified. Operational progress is tracked or recorded, not clinical proof.

## Agentic evolution (future engineering, not implemented)

1. Intake reconciler: consented, patient-matched source ingestion with conflict/staleness/provenance review.
2. Drafting copilot: prepares evidence-linked SOAP and care suggestions that a clinician must review and sign.
3. Permissioned care coordinator: independently idempotent referral/diagnostics/scheduling requests with authorized actions, durable acknowledgements and exceptions.
4. Follow-up coordinator: result return and missed follow-up escalation with explicit patient linkage and human authority.
5. Claim preparer: draft evidence packets only from signed clinical truth; payer adapter and explicit authorized submission required.

A future runtime should represent distinct proposed, reviewed, authorized, dispatched, acknowledged, failed and evidence-closed states; use episode IDs, actor IDs, provenance, consent and append-only audit records. No automatic clinical actions are introduced here.

## Measurement formulas

- Encounter time reduction (%) = (baseline median time - One OS median time) / baseline median time x 100.
- Clean chart completion (%) = complete clinician-signed charts / eligible visits x 100.
- Referral return (%) = tests with results returned to the original encounter / eligible referred studies x 100.
- Clinician intervention rate (%) = changed or rejected agent proposals / reviewed agent proposals x 100.
- Cost per confirmed episode = direct attributed delivery costs / verified completed episodes.

Zero or unobserved denominators mean unmeasured, not zero or success. Never advertise real-world gains before comparative observations.

## Release conditions

This slice must not change the existing Alpha acceptance ledger or declare any of the six unfinished tasks verified. No merge or production claim without exact-head Validate, Stabilization and applicable clinical/security/F1/F2/production checks, ancestry/overlap review and responsible human authorization. This branch is an implementation proposal, not a deployed agent workforce.

Repository references: governance/doctrine/PANACEA_CURRENT_WEDGE.md; governance/doctrine/PANACEA_SYSTEM_10_STANDARD.md; src/domains/clinical-operations/model/poliPatientFlow.ts. Concept source: owner-provided video.
