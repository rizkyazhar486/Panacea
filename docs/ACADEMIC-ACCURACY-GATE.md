# Academic Accuracy Gate

Panacea must not equate polished presentation, 3D realism, citations, or AI fluency with scientific correctness.

## Publication rule

Before a medical, biomedical, anatomical, physiological, pharmacological, surgical, genomic, longevity, or health claim is merged for production, the batch must identify material claims and record an `academicReview` decision in the Feature Factory ledger when Feature Factory work is involved.

Allowed review states:

- `not-applicable-no-material-claim`: the candidate changes mechanics, accessibility, provenance handling, or another surface without introducing a material medical/scientific claim.
- `source-checked`: relevant factual or methodological claims were checked against appropriate authoritative standards, peer-reviewed literature, guidelines/consensus, or primary source material. Source identities must be listed.
- `human-reviewed`: a qualified human academic/clinical reviewer completed review. Reviewer identity, credentials, date, and source basis must be recorded. Never invent or infer a reviewer.

High-risk and clinical Feature Factory candidates may not be `done` unless `academicReview.status` is `human-reviewed`. If qualified review has not happened, keep the candidate blocked rather than weakening the gate.

## Claim discipline

For every material claim touched by a batch:

1. State what kind of claim it is: measured, source/reference data, simulated, derived, educational, uncertain, or unsupported.
2. Preserve source identity, version/publication date, population/context, units, and relevant limitations.
3. Prefer systematic reviews/guidelines for broad clinical recommendations and primary methodological/anatomical sources for morphology, geometry, histology, or reconstruction claims.
4. Do not turn associations into causation, educational models into measurements, simulations into patient facts, or source availability into validation.
5. Verify formulas, thresholds, denominators, contraindications, version currency, and uncertainty where relevant.
6. Fail closed on unsupported claims. Downgrade or remove the claim instead of inventing support.

## Anatomy, histology, and 3D

Visual quality is not evidence of anatomical correctness. Academic teaching surfaces must preserve geometry/data provenance, anatomical naming, source/license identity, transformations, and known reconstruction limitations. AI-assisted segmentation or reconstruction must remain distinguishable from manually reviewed anatomy.

If qualified human anatomical review has not been recorded, Panacea must not describe the material as "academically reviewed", "expert validated", or equivalent.

## AI disclosure

Record whether scientific/educational material used AI assistance. Materially AI-generated or AI-transformed scientific content requires human review before Panacea may present it as academically reviewed. AI-assisted software development by itself does not prove or disprove a scientific claim; the claim still needs the appropriate evidence gate.

## Statistical language

Descriptive statistics from one user's observations are not population reference intervals. Personal summaries must be labelled as observed/descriptive and must not be given normative or clinical meaning unless a validated method and applicable population evidence support that interpretation.

## Build enforcement

`npm run build` executes `scripts/validate-academic-review.mjs`. Completed Feature Factory candidates without valid academic-review metadata fail the production build. High/clinical candidates marked `done` without qualified human review also fail the build.
