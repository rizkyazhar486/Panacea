# Reality Error Ledger v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Build a deterministic, append-only scientific ledger that records prospective model predictions, matches them to later admissible Canonical Patient State observations, and preserves immutable prediction-vs-reality error evidence without calibration or clinical publication.

**Architecture:** Implement one pure TypeScript module under \`src/lib/physiology/\` that reuses physiological provenance types and \`LongitudinalEvent\` observed truth. Prediction payloads are immutable; lifecycle status is held separately so \`pending → matched/expired-unobserved\` never rewrites the original prediction evidence. Matching is exact on subject/semantic field/unit, caller-bounded in time, deterministic, and fail-closed.

**Tech Stack:** TypeScript 5.5+, Node 24 native TypeScript transform used by \`scripts/uji/jalankan.mjs\`, Node strict assertions, existing Panacea physiology runtime and longitudinal-state types.

**Spec:** \`docs/superpowers/specs/2026-09-27-reality-error-ledger-design.md\`

## Global Constraints

- Canonical Patient State remains the authority for measured/imported/clinician-entered observations.
- Reality Error Ledger is derived scientific evidence, not a second patient-state authority and not the clinical-validation ledger.
- Prediction payload is immutable after insertion; lifecycle status is stored separately in \`statusByPredictionId\`.
- v1 accepts only prospective predictions.
- Reality observation semantic state is limited to \`measured | imported | clinician-entered\`.
- Semantic field and unit matching are exact; no fuzzy aliases or implicit unit conversion.
- Unknown uncertainty remains \`null\`; \`confidence\` must never be converted into sigma.
- Observation sigma may be supplied only as explicit evidence with its own provenance id.
- v1 performs no calibration, parameter update, AI-EMR write, persistence/database work, active sensing, UI, or counterfactual scoring.
- The first cardio/O2 integration fixture is software evidence only and must not be described as clinically predictive.
- No new dependency and no \`package.json\` script is required; \`npm run uji\` auto-discovers the new \`.mts\` test.

### Design ruling: immutable prediction versus lifecycle status

The approved spec requires both immutable predictions and lifecycle states. To avoid rewriting prediction evidence, implement:

\`\`\`ts
interface RealityErrorLedger {
  subjectId: string
  revision: number
  predictionsById: Readonly<Record<string, RealityPredictionRecord>>
  statusByPredictionId: Readonly<Record<string, RealityPredictionStatus>>
  comparisonsById: Readonly<Record<string, RealityComparisonRecord>>
  comparisonIdByPredictionId: Readonly<Record<string, string>>
}
\`\`\`

\`RealityPredictionRecord\` contains only immutable prediction evidence. \`statusByPredictionId\` owns \`pending | matched | expired-unobserved\`.

## Review Focus

- A candidate list containing a closer wrong-field/wrong-unit/inadmissible observation must never beat a farther admissible observation; Task 3 tests this.
- \`matchToleranceMs\` must be finite and non-negative, including support for exact-time \`0\`; Task 2 tests this.
- \`comparisonCreatedAt\` before the selected observation time must fail rather than create impossible audit chronology; Task 2 tests this.
- Combined sigma equal to zero must keep \`standardizedResidual = null\`; Task 2 tests this.
- An observation with missing \`semanticState\` must not silently become reality; Task 2 tests this.

---

### Task 1: Immutable Prediction Ledger and Lifecycle

**Files:**
- Create: \`src/lib/physiology/realityErrorLedger.ts\`
- Create: \`scripts/uji/reality-error-ledger.mts\`

**Interfaces:**
- Consumes: \`PhysiologicalValidationClass\`, \`PhysiologicalFidelity\` from \`src/lib/physiology/runtime.ts\`.
- Produces:
  - \`RealityPredictionStatus = 'pending' | 'matched' | 'expired-unobserved'\`
  - \`RealityPredictionRecord\`
  - \`RealityErrorLedger\`
  - \`RealityPredictionInsertResult\`
  - \`createRealityErrorLedger(subjectId: string): RealityErrorLedger\`
  - \`recordRealityPrediction(ledger: RealityErrorLedger, prediction: RealityPredictionRecord): RealityPredictionInsertResult\`
  - \`markPredictionExpiredUnobserved(ledger: RealityErrorLedger, predictionId: string, at: string): RealityErrorLedger\`

\`RealityPredictionRecord\` exact fields:

\`\`\`ts
interface RealityPredictionRecord {
  id: string
  subjectId: string
  field: string
  unit: string
  predictedValue: number
  predictedSigma: number | null
  createdAt: string
  targetAt: string
  predictionClass: 'prospective'
  provenance: {
    provenanceId: string
    engineId: string
    modelId: string
    modelVersion: string
    parameterSetId: string
    validationClass: PhysiologicalValidationClass
    fidelity: PhysiologicalFidelity
    parentProvenanceIds: readonly string[]
  }
}
\`\`\`

- [ ] **Step 1: Write failing prediction-lifecycle tests**

In \`scripts/uji/reality-error-ledger.mts\`, import the not-yet-created API and assert:
- \`createRealityErrorLedger('subject-1')\` yields revision 0 with all maps empty.
- valid prediction insertion returns \`status: 'inserted'\`, revision 1, lifecycle \`pending\`.
- exact duplicate insertion returns \`status: 'duplicate'\` and the same revision/content.
- same normalized id with conflicting content throws \`/conflicting prediction id/\`.
- blank identity/provenance strings throw deterministic validation errors.
- non-finite predicted value and negative/non-finite sigma throw.
- malformed timestamps and \`targetAt < createdAt\` throw.
- \`predictionClass: 'counterfactual' as never\` throws \`/prospective/\`.
- subject mismatch with ledger throws.
- expiration of unknown id throws.
- expiration before \`targetAt\` throws \`/before target/\`.
- expiration at/after target updates only \`statusByPredictionId\`, increments revision, creates no comparison, and leaves \`predictionsById[predictionId]\` deep-equal to its pre-expiration snapshot.
- expiring an already expired prediction is idempotent without another revision increment.

- [ ] **Step 2: Run the targeted test and verify RED**

Run:

\`\`\`bash
node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/reality-error-ledger.mts
\`\`\`

Expected: FAIL because \`src/lib/physiology/realityErrorLedger.ts\` does not exist or requested exports are absent.

- [ ] **Step 3: Implement prediction lifecycle**

Create \`src/lib/physiology/realityErrorLedger.ts\` with the interfaces and three functions above.

Implementation decisions:
- normalize required string identifiers with \`.trim()\` at insertion;
- clone parent-provenance arrays;
- compare duplicate predictions field-by-field after normalization;
- return new ledger objects/maps rather than mutating input;
- require expiration timestamp to be valid and \`>= targetAt\`;
- reject expiration of \`matched\`;
- keep prediction evidence unchanged when lifecycle changes.

- [ ] **Step 4: Run targeted test and verify GREEN**

Run the same targeted command.

Expected: PASS through all Task 1 assertions and print a Task 1 diagnostic line.

- [ ] **Step 5: Commit**

\`\`\`bash
git add src/lib/physiology/realityErrorLedger.ts scripts/uji/reality-error-ledger.mts
git commit -m "feat(physiology): add immutable reality prediction ledger"
\`\`\`

### Task 2: Direct Prediction-to-Observation Comparison

**Files:**
- Modify: \`src/lib/physiology/realityErrorLedger.ts\`
- Modify: \`scripts/uji/reality-error-ledger.mts\`

**Interfaces:**
- Consumes: Task 1 prediction ledger plus \`LongitudinalEvent<number>\` and \`validateLongitudinalEvent\` from \`src/lib/panaceaLongitudinalState.ts\`.
- Produces:
  - \`ObservationSigmaEvidence\`
  - \`RealityComparisonOptions\`
  - \`RealityComparisonRecord\`
  - \`RealityComparisonResult\`
  - \`comparePredictionToObservation(...): RealityComparisonResult\`

Exact option types:

\`\`\`ts
interface ObservationSigmaEvidence {
  sigma: number
  provenanceId: string
}

interface RealityComparisonOptions {
  matchToleranceMs: number
  comparisonCreatedAt: string
  observationSigma?: ObservationSigmaEvidence | null
}
\`\`\`

\`RealityComparisonRecord\` must include the spec fields plus:
- \`observationSigmaProvenanceId: string | null\`.

Use \`observation.recordedAt\` as v1 effective observation time. Preserve \`observation.provenance.sourceId\` separately.

- [ ] **Step 1: Extend tests with direct comparison RED cases**

Add assertions for:
- valid measured observation creates one comparison, marks prediction \`matched\`, increments revision by one, and does not change immutable prediction payload;
- exact signed error and absolute error;
- known sigmas compute \`Math.hypot(predictedSigma, observedSigma)\` and standardized residual;
- either sigma unknown yields \`combinedSigma = null\` and residual \`null\`;
- both sigmas zero yield \`combinedSigma = 0\` and residual \`null\`;
- observation sigma evidence requires finite non-negative sigma and nonblank provenance id;
- observation \`confidence\` is ignored for sigma;
- \`measured\`, \`imported\`, and \`clinician-entered\` are accepted;
- missing semanticState plus each disallowed semantic state fails;
- subject, field, or unit mismatch fails with specific error;
- nonnumeric/nonfinite observation fails;
- invalid \`matchToleranceMs\`, observation outside tolerance, invalid comparisonCreatedAt, and comparisonCreatedAt earlier than observation fail;
- second comparison for a matched prediction fails;
- expired prediction cannot be compared;
- comparison keeps prediction provenance id plus observation event/source ids.

- [ ] **Step 2: Run targeted test and verify RED**

Expected: FAIL because comparison types/function are absent.

- [ ] **Step 3: Implement direct comparison**

Implement:

\`\`\`ts
comparePredictionToObservation(
  ledger: RealityErrorLedger,
  predictionId: string,
  observation: LongitudinalEvent<number>,
  options: RealityComparisonOptions,
): RealityComparisonResult
\`\`\`

Rules:
- call \`validateLongitudinalEvent\` first, then apply stricter v1 admissibility;
- require exact subject/field/unit equality after prediction normalization; do not rewrite observation semantics;
- validate \`matchToleranceMs >= 0\` and finite;
- enforce \`abs(recordedAt - targetAt) <= matchToleranceMs\`;
- create deterministic comparison id from URL-encoded prediction id and observation event id;
- reject id collision with different comparison content;
- use explicit sigma evidence only; never derive sigma from confidence;
- create new maps, set status to matched, preserve prediction record byte/structural equality.

- [ ] **Step 4: Run targeted test and verify GREEN**

Expected: all Task 1–2 assertions pass.

- [ ] **Step 5: Commit**

\`\`\`bash
git add src/lib/physiology/realityErrorLedger.ts scripts/uji/reality-error-ledger.mts
git commit -m "feat(physiology): compare predictions with observed reality"
\`\`\`

### Task 3: Deterministic Candidate Matching and Replay

**Files:**
- Modify: \`src/lib/physiology/realityErrorLedger.ts\`
- Modify: \`scripts/uji/reality-error-ledger.mts\`

**Interfaces:**
- Consumes: Task 2 direct comparison.
- Produces:
  - \`matchPredictionToObservations(...): RealityComparisonResult\`

Signature:

\`\`\`ts
matchPredictionToObservations(
  ledger: RealityErrorLedger,
  predictionId: string,
  observations: readonly LongitudinalEvent<number>[],
  options: RealityComparisonOptions & {
    observationSigmaByEventId?: Readonly<Record<string, ObservationSigmaEvidence>>
  },
): RealityComparisonResult
\`\`\`

Candidate semantics:
- validate prediction/lifecycle/options first;
- consider only observations with exact subject, exact field, exact unit, admissible semantic state, finite numeric value, valid longitudinal shape, and time inside tolerance;
- irrelevant/invalid candidates are never selected;
- if no admissible candidate exists, fail with \`/no admissible observation within tolerance/\`;
- deterministic sort: absolute target-time distance, then earlier \`recordedAt\`, then lexical event id.

- [ ] **Step 1: Extend tests with candidate-selection RED cases**

Add:
- nearest admissible observation wins;
- equal-distance tie picks earlier timestamp;
- same timestamp tie picks lexical event id;
- a closer wrong-field, wrong-unit, different-subject, or simulated candidate never beats a farther admissible one;
- empty/no-admissible set fails;
- exact-time tolerance \`0\` accepts exact target and rejects non-exact observations;
- event-specific observation sigma evidence is forwarded to the chosen comparison only;
- two independent ledgers given identical inputs produce deep-equal comparison record, status maps and revision.

- [ ] **Step 2: Run targeted test and verify RED**

Expected: FAIL because \`matchPredictionToObservations\` is absent.

- [ ] **Step 3: Implement deterministic matching**

Implement the signature above. Candidate filtering must not perform aliasing/unit conversion. Delegate final write/math to \`comparePredictionToObservation\` so direct and list matching cannot diverge.

- [ ] **Step 4: Run targeted test and verify GREEN**

Expected: all assertions pass, including deterministic replay.

- [ ] **Step 5: Commit**

\`\`\`bash
git add src/lib/physiology/realityErrorLedger.ts scripts/uji/reality-error-ledger.mts
git commit -m "feat(physiology): add deterministic reality matching"
\`\`\`

### Task 4: Existing Physiology Integration Fixture and Documentation

**Files:**
- Modify: \`scripts/uji/reality-error-ledger.mts\`
- Create: \`DOCS/REALITY-ERROR-LEDGER.md\`
- Modify: \`DOCS/PHYSIOLOGICAL-RUNTIME.md\`
- Modify: \`PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md\`

**Interfaces:**
- Consumes: Tasks 1–3 plus existing \`cardiovascularIdentityEngine\`, oxygen transport engines and runtime provenance.
- Produces: one repository-visible implemented-status boundary and an end-to-end software fixture.

- [ ] **Step 1: Write the integration assertion before wiring it**

In the existing Reality Error Ledger test:
- run the existing cardiovascular/oxygen chain with measured fixtures;
- take a model-derived output such as \`systemic.oxygen_delivery\`;
- construct a prospective prediction using its actual engine/model/version/parameter/validation/fidelity/provenance lineage;
- construct a later \`measured\` longitudinal fixture with the same canonical field/unit and a deliberately different finite value;
- compare it through the ledger;
- assert nonzero signed error and exact preservation of model provenance.

The fixture text must explicitly state it is infrastructure/software evidence, not a validated prospective patient model.

- [ ] **Step 2: Run targeted test and verify RED**

Expected: FAIL until the fixture wiring/provenance mapping is complete.

- [ ] **Step 3: Complete the integration fixture and write implementation documentation**

Create \`DOCS/REALITY-ERROR-LEDGER.md\` documenting:
- implemented API;
- truth/admissibility rules;
- error equations;
- deterministic matching;
- uncertainty-null behavior;
- immutable evidence/lifecycle separation;
- explicit non-goals: calibration, persistence, AI-EMR publication, clinical validity.

Update \`DOCS/PHYSIOLOGICAL-RUNTIME.md\` to link the ledger as downstream prediction-evidence infrastructure.

Update the Reality Engine section of \`PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md\` so it says specifically:
- Reality Error Ledger v1 is implemented once verified;
- broader Reality Engine, parameter calibration, Biological Git, Reality Gap, Active Sensing, counterfactual runtime and Human Model SDK remain unimplemented unless separately evidenced.

- [ ] **Step 4: Run targeted test and full repository \`uji\` gate**

Run:

\`\`\`bash
node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/reality-error-ledger.mts
npm run uji
\`\`\`

Expected: targeted ledger test PASS; full \`uji\` exits 0. If pre-existing unrelated failures appear, report them by name and do not weaken tests.

- [ ] **Step 5: Run TypeScript/build verification**

Run:

\`\`\`bash
npx tsc -b --pretty false
npm run build
\`\`\`

Expected: exit 0 for each before claiming repository-wide build health. If the environment lacks the required Node/npm dependency state, report that limitation rather than claiming success.

- [ ] **Step 6: Commit**

\`\`\`bash
git add scripts/uji/reality-error-ledger.mts src/lib/physiology/realityErrorLedger.ts DOCS/REALITY-ERROR-LEDGER.md DOCS/PHYSIOLOGICAL-RUNTIME.md PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md
git commit -m "feat(physiology): land reality error ledger v1"
\`\`\`

### Task 5: Exact-Head Verification and Execution Record

**Files:**
- Modify: \`docs/superpowers/plans/2026-09-27-reality-error-ledger-v1.md\` only for the execution record after all verification.

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: durable evidence of exact commits, test commands/results, rulings, and exact-head CI status.

- [ ] Read back \`realityErrorLedger.ts\`, its test, and documentation from exact HEAD.
- [ ] Verify no code path imports or writes AI-EMR, modifies Canonical Patient State, performs parameter calibration, or uses \`server/src/validasiLedger.ts\`.
- [ ] Verify prediction evidence remains structurally unchanged across match/expire tests.
- [ ] Verify every spec-required deterministic test is represented.
- [ ] Inspect exact-head combined status and workflow runs; never reuse stale green CI.
- [ ] Append an execution record with commit SHAs and actual verification outcomes.
- [ ] Commit the execution record only after fresh verification.

## Self-review notes

- **Spec coverage:** prediction lifecycle, admissible observed truth, exact semantics/units, time matching, comparison math, null uncertainty, deterministic replay, counterfactual exclusion, no calibration/AI-EMR/persistence, and cardio/O2 software fixture all map to Tasks 1–4.
- **Type consistency:** all comparison paths use one \`RealityComparisonOptions\`; candidate matching delegates to direct comparison; prediction lifecycle status is separate from immutable prediction evidence.
- **Review Focus:** all five listed conditions have explicit assertions in Tasks 2–3.
- **Scope:** one production module, one test file, one focused doc plus two status links; no database/UI/API expansion.
- **TDD:** every behavior task begins with a failing assertion and targeted RED run before implementation.
