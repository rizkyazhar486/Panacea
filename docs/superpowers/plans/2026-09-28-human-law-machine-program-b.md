# Human Law Machine Program B — Residual Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Turn existing prospective prediction-vs-reality comparisons into deterministic, provenance-preserving residual-series intelligence that can identify candidate structured error without confusing prediction error with biological discovery.

**Architecture:** Reuse \`RealityErrorLedger\` for prospective prediction capture and observed-outcome reconciliation. Add an isolated \`src/lib/humanLaw/residualIntelligence.ts\` layer that validates matched comparisons, groups them by exact subject/signal/model identity, classifies individual residuals and temporal series, then projects only structured residual candidates into a research-only reality-gap addendum. No automatic law creation, model recalibration, diagnosis, or causal attribution is permitted.

**Tech Stack:** TypeScript 5.5+, Node 24 native TypeScript test runner via \`scripts/uji/jalankan.mjs\`, existing \`RealityErrorLedger\` and \`RealityGapRegistry\`, no new dependencies.

**Spec:** \`docs/superpowers/specs/2026-09-28-panacea-human-law-machine-design.md\`

## Global Constraints

- Preserve: **"Hallucinate hypotheses aggressively. Hallucinate reality never."**
- Existing \`RealityErrorLedger\` remains the source of prospective prediction and observed-outcome reconciliation.
- Residual intelligence is research/epistemic infrastructure, not patient truth.
- Structured residuals are candidate unexplained structure, not evidence of unknown biology by themselves.
- Identity must include subject, field, unit, engine, model, model version, and parameter set; residuals from different identities must never be pooled.
- Missing quantified uncertainty must never be treated as a zero-sigma residual.
- No automatic diagnosis, causal attribution, law promotion, ontology generation, or model recalibration.
- All outputs are deterministic and immutable.
- TDD is mandatory.
- Final verification requires \`npm run build\`, \`npm run uji\`, and server validation through the branch CI workflow.

## File Structure

- Create: \`src/lib/humanLaw/residualIntelligence.ts\`
  - Validates matched comparison identity.
  - Builds residual samples and exact-identity residual series.
  - Detects bounded candidate structure using explicit heuristic options.
  - Produces research-only residual gap addenda.
- Create: \`scripts/uji/human-law-residual-intelligence.mts\`
  - End-to-end tests built from real \`RealityErrorLedger\` prediction/observation functions.
- Modify only if required by a failing integration test:
  - \`src/lib/physiology/realityGapRegistry.ts\`
  - Prefer composition over changing the base registry schema.

## Review Focus

1. **Cross-model pooling** — same field/unit from different model versions or parameter sets must remain separate series.
2. **Unknown sigma** — a comparison with \`standardizedResidual === null\` must remain unquantified and cannot be called noise-compatible.
3. **Corrupted ledger identity** — mismatched comparison subject/field/unit/provenance or non-matched lifecycle must fail closed.
4. **One extreme point** — a single large residual must not become a structured residual candidate.
5. **Reality-gap promotion** — structured residual gaps must preserve research-only semantics and cannot authorize recalibration, diagnosis, causality, ontology generation, or law promotion.

---

### Task 1: Residual Samples and Exact-Identity Series

**Files:**
- Create: \`src/lib/humanLaw/residualIntelligence.ts\`
- Create: \`scripts/uji/human-law-residual-intelligence.mts\`

**Interfaces:**
- Consumes:
  - \`RealityErrorLedger\`
  - \`RealityPredictionRecord\`
  - \`RealityComparisonRecord\`
  - existing \`recordRealityPrediction(...)\` and \`comparePredictionToObservation(...)\` in tests.
- Produces:
  - \`ResidualSampleClass\`
  - \`ResidualSeriesIdentity\`
  - \`ResidualSample\`
  - \`ResidualSeries\`
  - \`ResidualIntelligenceOptions\`
  - \`buildResidualSeries(ledger: RealityErrorLedger, options: ResidualIntelligenceOptions) -> readonly ResidualSeries[]\`

Define:

~~~ts
export type ResidualSampleClass =
  | 'unquantified'
  | 'within-expected-noise'
  | 'extreme-positive'
  | 'extreme-negative'

export interface ResidualIntelligenceOptions {
  standardizedResidualThreshold: number
  minQuantifiedSamples: number
}

export interface ResidualSeriesIdentity {
  subjectId: string
  field: string
  unit: string
  engineId: string
  modelId: string
  modelVersion: string
  parameterSetId: string
}

export interface ResidualSample {
  comparisonId: string
  predictionId: string
  observedAt: string
  signedError: number
  standardizedResidual: number | null
  classification: ResidualSampleClass
}

export interface ResidualSeries {
  id: string
  identity: ResidualSeriesIdentity
  samples: readonly ResidualSample[]
}
~~~

- [ ] **Step 1: Write failing end-to-end tests**

Build a ledger through the real prediction/comparison APIs, not hand-built comparison fixtures.

Use:
- threshold = \`2\`;
- minQuantifiedSamples = \`3\`.

Assert:
- \`z = 0.5\` -> \`within-expected-noise\`;
- \`z = 2.5\` -> \`extreme-positive\`;
- \`z = -2.5\` -> \`extreme-negative\`;
- missing prediction/observation sigma -> \`unquantified\`;
- samples sort by \`observedAt\`, then \`comparisonId\`;
- different model versions become different series;
- different parameter-set IDs become different series;
- different fields/units become different series;
- deterministic replay returns deep-equal output.

Fail closed for:
- threshold <= 0 or non-finite;
- \`minQuantifiedSamples < 2\` or non-integer;
- comparison references unknown prediction;
- comparison subject/field/unit/provenance differs from its prediction;
- comparison exists while prediction lifecycle is not \`matched\`;
- comparison index points to a different comparison;
- non-finite error or standardized residual.

- [ ] **Step 2: Run CI and verify RED**

Commit only the new test file to branch \`panacea-maturity/human-law-program-b\`.

Expected: \`Validate changes\` fails because \`src/lib/humanLaw/residualIntelligence.ts\` does not exist; other existing test files remain green.

- [ ] **Step 3: Implement minimal series builder**

Requirements:
- use exact identity from prediction provenance;
- series ID must be deterministic and collision-resistant at the string level by encoding every identity component;
- classify standardized residual using inclusive thresholds:
  - \`z >= threshold\` -> extreme-positive;
  - \`z <= -threshold\` -> extreme-negative;
  - otherwise within-expected-noise;
- \`null\` standardized residual -> unquantified;
- never infer standardized residual when the comparison ledger left it null.

- [ ] **Step 4: Verify GREEN in branch CI**

Expected:
- production build passes;
- new residual test passes;
- complete \`npm run uji\` passes.

- [ ] **Step 5: Commit**

Commit message:

~~~text
feat(human-law): build provenance-bound residual series
~~~

---

### Task 2: Structured Residual Detection

**Files:**
- Modify: \`src/lib/humanLaw/residualIntelligence.ts\`
- Modify: \`scripts/uji/human-law-residual-intelligence.mts\`

**Interfaces:**
- Consumes:
  - \`ResidualSeries\`
  - \`ResidualIntelligenceOptions\`
- Produces:
  - \`ResidualStructureClass\`
  - \`ResidualSeriesAnalysis\`
  - \`ResidualIntelligenceReport\`
  - \`analyzeResidualIntelligence(ledger: RealityErrorLedger, evaluatedAt: string, options: ResidualIntelligenceOptions) -> ResidualIntelligenceReport\`

Define:

~~~ts
export type ResidualStructureClass =
  | 'insufficient-evidence'
  | 'noise-compatible'
  | 'persistent-positive-bias-candidate'
  | 'persistent-negative-bias-candidate'
  | 'repeated-extreme-residuals'
  | 'mixed-residuals'

export interface ResidualSeriesAnalysis {
  seriesId: string
  identity: ResidualSeriesIdentity
  sampleCount: number
  quantifiedSampleCount: number
  unquantifiedSampleCount: number
  extremeSampleCount: number
  meanSignedError: number
  meanStandardizedResidual: number | null
  classification: ResidualStructureClass
  candidateStructure: boolean
  comparisonIds: readonly string[]
  predictionIds: readonly string[]
  latestObservedAt: string
  explanation: string
}

export interface ResidualIntelligenceReport {
  subjectId: string
  ledgerRevision: number
  evaluatedAt: string
  semantics: 'candidate-residual-structure-not-biological-discovery'
  options: ResidualIntelligenceOptions
  series: readonly ResidualSeriesAnalysis[]
  boundary: {
    diagnosisInferenceAllowed: false
    causalAttributionAllowed: false
    automaticRecalibrationAllowed: false
    automaticConceptGenerationAllowed: false
    automaticLawPromotionAllowed: false
  }
}
~~~

Classification algorithm, in order:

1. If quantified sample count < \`minQuantifiedSamples\`: \`insufficient-evidence\`.
2. Let \`tail\` be the last \`minQuantifiedSamples\` quantified samples in chronological order.
3. If every tail sample is \`extreme-positive\`: \`persistent-positive-bias-candidate\`, \`candidateStructure=true\`.
4. If every tail sample is \`extreme-negative\`: \`persistent-negative-bias-candidate\`, \`candidateStructure=true\`.
5. If all quantified samples are \`within-expected-noise\`: \`noise-compatible\`.
6. If total extreme sample count >= \`minQuantifiedSamples\`: \`repeated-extreme-residuals\`, \`candidateStructure=true\`.
7. Otherwise: \`mixed-residuals\`.

- [ ] **Step 1: Add failing structure-classification tests**

Assert:
- one or two quantified samples => insufficient evidence;
- 3 tail positive extremes => persistent-positive candidate;
- 3 tail negative extremes => persistent-negative candidate;
- at least 3 nonconsecutive/mixed-sign extremes => repeated-extreme-residuals;
- 3+ quantified samples all inside threshold => noise-compatible;
- mixture below repeated-extreme threshold => mixed-residuals;
- unquantified samples count toward sample count but not quantified or tail;
- \`evaluatedAt\` invalid -> fail;
- \`evaluatedAt\` before latest comparison creation time -> fail;
- report boundary fields are all false;
- report series are deterministically sorted by series ID.

- [ ] **Step 2: Verify RED in branch CI**

Expected: missing analysis API/export.

- [ ] **Step 3: Implement analysis exactly in the stated order**

No p-values, causal claims, diagnosis labels, adaptive thresholds, or discovery scores in Program B.

- [ ] **Step 4: Verify GREEN in branch CI**

Expected build and complete offline suite green.

- [ ] **Step 5: Commit**

Commit message:

~~~text
feat(human-law): classify structured residual candidates
~~~

---

### Task 3: Research-Only Reality-Gap Integration

**Files:**
- Modify: \`src/lib/humanLaw/residualIntelligence.ts\`
- Modify: \`scripts/uji/human-law-residual-intelligence.mts\`
- Reuse without schema mutation: \`src/lib/physiology/realityGapRegistry.ts\`

**Interfaces:**
- Consumes:
  - \`RealityGapRegistry\`
  - \`ResidualIntelligenceReport\`
- Produces:
  - \`ResidualRealityGap\`
  - \`ResidualRealityGapAddendum\`
  - \`buildResidualRealityGapAddendum(base: RealityGapRegistry, report: ResidualIntelligenceReport) -> ResidualRealityGapAddendum\`

Define:

~~~ts
export interface ResidualRealityGap {
  id: string
  seriesId: string
  kind: 'structured-residual-unexplained'
  field: string
  unit: string
  modelId: string
  modelVersion: string
  parameterSetId: string
  classification:
    | 'persistent-positive-bias-candidate'
    | 'persistent-negative-bias-candidate'
    | 'repeated-extreme-residuals'
  predictionIds: readonly string[]
  comparisonIds: readonly string[]
  explanation: string
}

export interface ResidualRealityGapAddendum {
  subjectId: string
  ledgerRevision: number
  evaluatedAt: string
  semantics: 'research-residual-gaps-not-clinical-completeness'
  baseGapCount: number
  residualGaps: readonly ResidualRealityGap[]
  boundary: {
    diagnosisInferenceAllowed: false
    causalAttributionAllowed: false
    automaticRecalibrationAllowed: false
    automaticConceptGenerationAllowed: false
    automaticLawPromotionAllowed: false
  }
}
~~~

- [ ] **Step 1: Add failing integration tests**

Build \`RealityGapRegistry\` from the same ledger and \`ResidualIntelligenceReport\`.

Assert:
- only \`candidateStructure=true\` series become residual gaps;
- insufficient/noise-compatible/mixed series do not become residual gaps;
- subject mismatch fails closed;
- ledger revision mismatch fails closed;
- base and report evaluatedAt mismatch fails closed;
- residual gap preserves exact field/unit/model/version/parameter identity;
- deterministic replay returns deep-equal addendum;
- base gap registry object remains deep-equal to a pre-call clone;
- every safety boundary remains false.

- [ ] **Step 2: Verify RED in branch CI**

Expected: missing addendum API/export.

- [ ] **Step 3: Implement immutable gap composition**

Do not modify \`RealityGapRegistry\` or its existing \`RealityGapKind\` union in Program B. The addendum exists beside the base registry so physiology infrastructure does not depend on Human Law Machine code.

- [ ] **Step 4: Final verification**

Branch CI must show:
- frontend production build success;
- server validation success;
- all \`scripts/uji/*.mts\` files pass.

- [ ] **Step 5: Whole-branch review**

Review specifically for:
- identity collisions;
- cross-model pooling;
- sigma-null coercion;
- one-point novelty hallucination;
- accidental clinical/causal semantics;
- corruption tolerance/fail-closed behavior.

Critical/Important findings require one RED->GREEN fix pass.

- [ ] **Step 6: Integrate only if latest main is an ancestor**

Resolve current \`main\` immediately before integration.

If main moved:
- compare ancestry;
- never force;
- rebase/replay on latest main and rerun CI.

If main is still an ancestor and branch CI is green:
- fast-forward \`main\` to the exact verified branch head.

Commit message for final implementation task:

~~~text
feat(human-law): expose structured residual reality gaps
~~~

---

## Program B Completion Evidence

Before claiming Program B complete, report:

- exact integrated main SHA;
- exact branch CI run ID;
- production build result;
- server validation result;
- complete deterministic test-file count;
- public interfaces added;
- classification thresholds used;
- confirmation that null uncertainty is never converted to zero uncertainty;
- confirmation that residual structure does not automatically create concepts/laws or recalibrate models;
- confirmation that base \`RealityGapRegistry\` schema remained unchanged.
