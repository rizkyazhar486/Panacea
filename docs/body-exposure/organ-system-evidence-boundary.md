# Body Exposure organ/system evidence boundary

Status: engineering/scientific authoring contract for organ/system-specific Body Exposure content.

This document does **not** define shared rendering, global UI, patient-specific inference, diagnosis, treatment advice, or validation status. Those remain outside the organ/system content lane.

## Scope

Organ/system modules may encode reviewed educational relationships across:

- anatomy and spatial/structural relationships;
- physiology and normal functional relationships;
- pathophysiology as educational mechanism relationships;
- pharmacology as mechanism/class/target relationships;
- imaging as modality/view/finding-to-structure educational relationships.

Each relationship must remain attributable to a source boundary and must not imply that a source validates Panacea itself.

## Minimum provenance contract

Every material relationship added to an organ/system module must carry or resolve to:

1. `sourceId` — stable identifier into the module's source registry;
2. `sourceType` — e.g. peer-reviewed review/article, professional guideline/consensus, authoritative textbook/reference, or official regulatory label/database;
3. `sourceLocator` — DOI, PMID, guideline/label identifier, chapter/section, or canonical URL when appropriate;
4. `accessedOrReviewedAt` — date the source was checked for this repository;
5. `claimScope` — the exact relationship supported by the source;
6. `evidenceRole` — one of `anatomy-reference`, `physiology-reference`, `mechanism-reference`, `pharmacology-reference`, `imaging-reference`, or `terminology-reference`;
7. `reviewState` — `draft`, `source-checked`, or `human-reviewed`.

`human-reviewed` must never be set without an identifiable completed human review recorded by the repository's accepted review mechanism.

## Scientific safety rules

- Do not infer patient state from an educational relationship.
- Do not convert association into causation unless the cited evidence supports a causal/mechanistic statement.
- Do not state drug indication, contraindication, dose, efficacy, or safety from an anatomy/physiology source.
- Keep regulatory labeling distinct from guideline recommendations and from mechanistic literature.
- Imaging relationships must distinguish normal anatomy, acquisition/view context, and pathological findings.
- Disease relationships must distinguish established mechanism, common association, and hypothesis/uncertain mechanism.
- Missing evidence is represented as missing/unknown, never filled by model-generated citation or certainty.
- A citation proves only the bounded claim it supports; it is not product validation.

## Authoring pattern

Prefer small organ/system-owned data files and tests. A module should expose educational nodes/edges through existing shared contracts rather than changing the shared renderer. If a required relationship cannot be represented without a shared-renderer change, record the dependency for Body Core rather than editing renderer code from this lane.

For behavior changes, add/adjust tests before implementation. At minimum, tests should reject unresolved `sourceId`, empty `claimScope`, unsupported `evidenceRole`, and falsely asserted `human-reviewed` state.

## Merge boundary

Before merge, compare the branch against the latest `main` and active PR changed paths. If another active lane has begun editing the same organ/system file, stop or re-scope rather than overwrite it. Run fresh exact-head repository validation and the applicable Stabilization and Body 3D gates; do not rely on checks from an earlier head SHA.
