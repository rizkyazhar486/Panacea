# PANACEA INDEPENDENT REVIEW DOSSIER

## Purpose

This file is the neutral entry point for a skeptical human or AI reviewer who has no prior conversation context.

Do **not** assume Panacea is worth building because the owner or another model says so. Evaluate the current evidence.

## Compact thesis

**Problem:** healthcare data, people, diagnostics, workflows and payment are fragmented.

**Product:** one permissioned longitudinal patient state plus a compact orchestration layer.

**Current wedge:** one outpatient/primary-care clinical episode from pre-visit context through clinician-controlled encounter, diagnostic/referral continuity, patient explanation, reimbursement evidence and follow-up.

**Differentiation thesis:** not generic health chat or a wearable clone; governed clinical orchestration with provenance, continuity, workflow execution and reusable jurisdiction/device boundaries.

**Proof obligation:** demonstrate care that is faster, more complete, more trustworthy and easier to understand without safety regression.

**Expansion rule:** prove one workflow deeply, reuse the foundation, then expand.

## Read these first

1. `PANACEA_CURRENT_WEDGE.md`
2. `PANACEA_ONE_OS_LONGITUDINAL_CARE_DOCTRINE.md`
3. `PANACEA_SYSTEM_10_STANDARD.md`
4. `PANACEA_WORTHINESS_EVIDENCE_STANDARD.md`
5. `PANACEA_UNIVERSAL_HUMAN_ACCEPTANCE_STANDARD.md`
6. `governance/WORTHINESS_EVIDENCE.json`
7. `governance/UNIVERSAL_HUMAN_ACCEPTANCE.json`

## Executable evidence already present

- Poli workflow model: `src/domains/clinical-operations/model/poliPatientFlow.ts`
- Poli workflow UI: `src/domains/clinical-operations/ui/PoliPatientFlowBoard.tsx`
- One OS proof harness: `src/domains/clinical-operations/model/oneOsCareProof.ts`
- Rural diagnostics + reimbursement orchestration: `src/domains/clinical-operations/model/careAccessOrchestrator.ts`
- Longitudinal patient state: `src/lib/panaceaLongitudinalState.ts`
- Shared longitudinal projection: `src/lib/longitudinalSnapshot.ts`
- Deterministic tests: `scripts/qa/one-os-care-proof.test.mjs`, `scripts/qa/care-access-orchestrator.test.mjs`, `scripts/qa/current-wedge-lock.test.mjs`, `scripts/qa/compact-product-law.test.mjs`

The universal-human acceptance matrix is tracked in `governance/UNIVERSAL_HUMAN_ACCEPTANCE.json`; subgroup scores remain null until measured.

These artifacts show implementation intent and repository-level behavior. They do **not** by themselves prove clinical outcome, market demand, buyer ROI or global deployment readiness.

## Current evidence boundary

The machine-readable source of current worthiness evidence is:

`governance/WORTHINESS_EVIDENCE.json`

Important: numeric scores are intentionally `null` until measured. This prevents aspiration from being mistaken for evidence.

## Neutral reviewer prompt

> Evaluate whether Panacea is worth continued investment and deployment effort. Use only the supplied repository evidence and explicitly cited external evidence. Score each worthiness dimension only when evidence is sufficient; otherwise mark it unknown. Identify the strongest argument, weakest argument, disconfirming evidence, missing evidence, and the single next experiment most likely to change your conclusion. Do not infer maturity from ambition, feature count, branding, or another model's opinion.

## Minimum output expected from a reviewer

For each dimension:
- current evidence level E0-E4;
- score `0..10` or `unknown`;
- confidence;
- supporting artifact/source;
- strongest objection;
- next experiment.

Then provide:
- **continue / continue conditionally / pause / stop** recommendation;
- the weakest critical dimension;
- what evidence would change the recommendation.

## Why this is stricter than a pitch deck

A pitch deck tries to persuade.

This dossier tries to make the conclusion **reproducible**.

A strong Panacea repository should become more convincing when reviewers are allowed to be skeptical.
