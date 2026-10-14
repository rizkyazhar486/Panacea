# PanaceaMed 2020–2026 Health Innovation Gap Pack — Execution Handoff

Do not restart architecture discovery. Extend the existing contracts in:

- `src/lib/recentHealthInnovations.ts`
- `src/pages/RecentInnovationLab.tsx`
- `src/pages/ClinicalHub.tsx`
- `server/uji/recentHealthInnovations.uji.ts`

Also integrate rather than duplicate existing Panacea systems:

- Frontier Health OS
- Knowledge Bridge
- Health Gap Navigator
- Biomedical Engine
- Genomics Lab / SNP Profiler
- EMR / Data Lab
- Connect / wearables
- Planning / Notifications / Marketplace / Hospitals
- Pharmacy / Orders / Medication Reminders
- Body Explorer / Surgical Lab / Radiology

## Mission

Build the missing layer between Panacea's existing broad health OS and modern 2020–2026 clinical research / precision-health workflows.

The target loop is:

`question → validate data → design observation/research → collect → analyze → review → act only through appropriate human gate → preserve outcome for future learning`

Every module must preserve:

1. source provenance
2. version/date
3. missingness
4. uncertainty
5. consent
6. accountable human owner
7. distinction between measured, reported, inferred and educational data

## Priority 1 — N-of-1 Personal Experiment Studio

### Product target

A user should be able to ask a low-risk question such as:

- Does afternoon caffeine worsen my sleep latency?
- Does morning sunlight improve sleep timing?
- Does an earlier dinner change nocturnal heart rate?
- Which recovery routine is associated with better next-day readiness?

### Required state model

- hypothesis/question
- outcome
- baseline window
- period A / period B
- randomized or counterbalanced sequence when appropriate
- washout/carryover note
- adherence
- confounders
- missing data
- result
- uncertainty
- personal-only conclusion

### Safety

Do not create autonomous medication experiments, dangerous fasting, supplement megadosing, treatment withdrawal or changes to prescribed clinical care.

## Priority 2 — Digital Biomarker Validation Lab

Before Panacea interprets wearable or home-sensor data, show whether the stream is fit for the intended use.

Required metrics:

- expected samples
- observed samples
- completeness = observed / expected
- longest missing interval
- wear-time estimate
- signal-quality flags
- device model
- firmware/software version
- sensor/source changes
- reference comparison when available
- Bland–Altman / agreement tooling only when technically appropriate
- calibration drift where reference observations exist

Never convert continuous consumer data into a diagnostic measurement solely because sampling is frequent.

## Priority 3 — Clinical AI Lifecycle Observatory

Every AI model used clinically should have an internal passport:

- model ID + version
- owner
- intended use
- excluded uses
- training-data summary
- validation population
- metrics with confidence intervals where available
- calibration
- subgroup metrics
- deployment date
- prompt/config version when LLM-based
- incident history
- dataset/input drift
- outcome/performance drift
- approved changes
- rollback target

### Astra visual target

Build a model timeline with:

- version nodes
- validation badges
- calibration curve
- subgroup performance matrix
- live drift bands
- incident markers
- before/after change comparison

Do not use decorative green/red alone; every state must have a textual explanation.

## Priority 4 — Pharmacogenomics Actionability Passport

Pipeline:

`validated lab genotype/diplotype → phenotype assignment → affected medication → current guideline version → clinician review`

Required provenance:

- laboratory
- assay/report date
- gene
- genotype/diplotype
- phenotype source
- guideline source/version
- recommendation strength when available
- medication status
- clinician review state

Do not infer a clinical genotype from raw consumer SNP data.

## Priority 5 — Genomic Reanalysis Watch

Preserve the original report permanently and add a separate versioned reinterpretation layer.

Required events:

- original classification
- source/date
- updated knowledge event
- change candidate
- updated phenotype/family history
- laboratory/clinical review requested
- reviewed result
- recontact status

Never silently overwrite a VUS/pathogenic/benign classification in a historical report.

## Priority 6 — Decentralized Trial Participant Passport

Extend existing trial matching into trial participation support.

Required lanes:

- study-site visits
- telehealth
- home visits
- local labs/imaging
- device/data collection
- questionnaires/ePRO
- investigational-product logistics metadata
- safety contacts

Every task needs:

- protocol source
- due window
- status
- owner
- consent state
- completion evidence

Panacea does not determine eligibility or modify the protocol.

## Priority 7 — Adaptive ePRO + EMA Outcomes Hub

Use validated questionnaires when claiming a validated score.

Support:

- scheduled PROs
- event-triggered EMA
- short-form burden checks
- medication-side-effect prompts
- symptom/function/mood/fatigue/pain domains
- missingness and prompt-fatigue controls
- urgent-response escalation configuration

The system should learn when *not* to ask another question.

## Priority 8 — Target Trial Emulation Workbench

This is a research tool, not bedside CDS.

Force specification of:

1. eligibility criteria
2. treatment strategies
3. assignment procedure
4. time zero
5. follow-up
6. outcome
7. causal contrast
8. analysis plan

Then map each item to real EHR/registry data and mark:

- available
- proxy
- missing
- post-baseline leakage risk
- selective-observation risk
- unmeasured-confounding risk

Do not estimate causal effects if the design cannot be operationalized credibly.

## Shared 3D / visual language for Astra

Use 3D only when spatial structure adds information.

Recommended non-3D primary views:

- N-of-1: alternating-period timeline
- DHT validation: signal-quality + provenance timeline
- AI lifecycle: model evolution graph
- PGx: gene → phenotype → drug evidence graph
- genomic reanalysis: variant history ribbon
- DCT passport: multi-lane protocol timeline
- ePRO/EMA: synchronized symptom-context timeline
- TTE: protocol ↔ EHR realizability matrix + causal DAG

If using 3D, connect to Body Explorer only when the feature has an anatomical target and do not imply patient-specific anatomy without patient imaging/segmentation.

## Required application states

Every feature must implement:

- empty
- loading
- available
- stale
- incomplete
- unsupported
- external adapter not connected
- permission/consent required
- error with retry

## Acceptance criteria

A feature is not complete because a card exists.

Each production-ready feature requires:

1. typed state/data contracts
2. functional Panacea entry point
3. provenance and versioning
4. missingness/uncertainty
5. human/consent gate
6. mobile-safe UI
7. at least one existing-module integration
8. tests
9. no fabricated patient measurements
10. visible unsupported/not-connected state
11. audit trail for any state-changing external action
12. explicit safety boundary visible in the UI
