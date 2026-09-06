# Astra / Codex / Ultracode Handoff — Panacea Gap Navigator

## Do not restart the architecture

The production scaffold is already implemented in:

- `src/lib/healthGapNavigator.ts`
- `src/components/HealthGapNavigator.tsx`
- `src/pages/ClinicalHub.tsx`
- `server/uji/healthGapNavigator.uji.ts`

Continue from these contracts. The product goal is to reduce the information, access and continuity gap between a patient and the clinical team — not to create another symptom checker.

## Product thesis

Most health software asks: **what disease might this be?**

Gap Navigator asks a different question:

> **What must still become clear, feasible, sourced or owned before this care plan can actually work?**

This makes Panacea useful before, during and after a consultation, including when no new diagnosis is required.

## Existing deterministic engine

The engine currently evaluates these domains:

1. understanding
2. safety-net clarity
3. medication reconciliation
4. continuity / ownership
5. access and feasibility
6. evidence provenance + uncertainty
7. patient preferences
8. source-record preservation

The Bridge Score is an execution/readiness index only. It MUST NOT be presented as disease severity, prognosis, triage probability or clinical risk.

The Care Friction Index combines normalized implementation burdens:

`friction = 0.18(wait) + 0.14(travel) + 0.26(cost) + 0.16(steps) + 0.14(work) + 0.12(digital)`

Every component is clamped to 0–100 before weighting. It is intentionally auditable and should remain so.

## Astra visual execution

Turn the current practical UI into a premium Panacea experience while preserving the deterministic engine underneath.

### 1. Care Gap Radar

Create an interactive radial / constellation visualization with eight domains around the patient. Use restrained motion and strong labels. A gap should visually mean **missing context**, not pathology.

Possible visual grammar:

- clear = connected / complete
- partial = incomplete arc
- missing = empty node
- blocked = visible barrier between patient and next care node

Do not use red anatomy or alarm-style visuals for ordinary knowledge gaps.

### 2. Patient ↔ Clinician Bridge View

Add a two-sided view:

`what the patient understands ↔ source clinical statement`

Every simplified statement must retain a link to the original source note/report/result. Never let an AI paraphrase replace provenance.

### 3. Appointment Question Budget

Visualize the top three questions as scarce appointment-time allocation. Show why each question was selected and which unresolved domain triggered it. Do not rank questions using opaque LLM confidence.

### 4. Unknowns Ledger

Make uncertainty a first-class object. Unknowns should be visible and persistent until resolved by a source or clinician. Never silently infer an answer to make the UI look complete.

### 5. Care Friction Map

Visualize practical barriers across:

- cost
- travel
- wait
- number of handoffs/steps
- missed work
- digital barrier

Connect future real availability and price feeds only when sourced and timestamped.

### 6. One-Minute Handoff

Next production iteration should allow users to export a compact, provenance-preserving visit packet containing:

- reason for visit
- current plan
- reconciled medicines/allergies
- top three unresolved questions
- open safety-net item
- next owner/date
- source documents

This should integrate with existing Second Opinion, EMR, Care Episode, Translator and Knowledge Bridge rather than duplicating them.

## Unique extensions worth executing next

### A. Diagnostic Journey Replay

Animate how the clinical story changed as evidence arrived. The timeline must distinguish actual historical documentation from reconstructed educational explanation.

### B. Decision Receipt

Every meaningful care decision can generate a receipt:

`known facts → uncertainties → options → patient priorities → decision → owner → review date`

This is a provenance record, not a liability score.

### C. Care Handoff Checksum

Before a handoff to another clinician/facility, compare the source packet against required fields and flag missing medication, allergy, imaging, pathology, genomics or pending-test context. Never invent missing fields.

### D. Access Alternative Explorer

When a barrier is marked blocked, show medically compatible alternatives only when the alternative comes from an explicit care-pathway rule or clinician-authored option. Compare wait/cost/travel transparently.

### E. Teach-Back Memory

Track which concepts a patient previously demonstrated understanding of and which repeatedly require re-explanation. This is a learning state, not a cognitive diagnosis.

### F. Evidence-to-Body Deep Link

From a claim or unresolved question, deep-link into the existing Body Explorer / Cell Lab / Genomics / Radiology / Surgical Lab at the relevant educational layer when available.

## Codex tasks

- integrate real Knowledge Bridge records with Gap Navigator state
- persist gap state per care episode
- attach provenance IDs to each resolved gap
- add export/import schema for Second Opinion and EMR
- add accessibility labels and keyboard navigation
- add unit tests for every scoring edge case
- keep scoring deterministic and side-effect free

## Astra tasks

- premium radial visualization
- micro-interactions for gap resolution
- patient/clinician mirrored language view
- smooth Body Explorer deep links
- care friction map
- mobile layout with no information hidden behind hover

## Ultracode tasks

- audit bundle size and lazy loading
- ensure no unnecessary 3D package enters the Clinical Hub initial chunk
- performance-test on mid-range mobile hardware
- add analytics events that contain no PHI by default

## Safety / truth boundaries

1. Gap Navigator does not diagnose.
2. Gap Navigator does not replace triage.
3. A bridge/friction score is not a health score.
4. Safety-net wording must originate from a validated workflow or clinician.
5. Missing data remains unknown.
6. Original medical sources stay accessible beside simplifications.
7. Availability and price need source, geography and timestamp.
8. Clinical decisions still require the responsible healthcare professional when appropriate.

## Acceptance criteria

- user can change each gap state and the bridge score updates deterministically
- top three questions change based on priority
- all-clear state produces bridge score 100
- all-blocked state produces bridge score 0
- care friction stays within 0–100
- build passes TypeScript
- production deployment uses the existing Vercel prebuilt workflow
- no TURN or other sensitive credential is printed as an ordinary GitHub variable
- deployment receives a post-deploy HTTP smoke test
