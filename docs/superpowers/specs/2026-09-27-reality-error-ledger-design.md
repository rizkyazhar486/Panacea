# Reality Error Ledger v1 — Design Specification

**Date:** 2026-09-27  
**Status:** Owner-approved in-chat design; written-spec review required before implementation planning.  
**Parent specification:** docs/superpowers/specs/2026-09-27-reality-engine-compounding-human-model-design.md

## 1. Purpose

Reality Error Ledger v1 is the first executable scientific-memory primitive of the Panacea Reality Engine.

Its job is to preserve an immutable, auditable relationship between model prediction, later admissible real observation, and prediction-vs-reality comparison evidence.

The ledger must make model error visible rather than allowing later model updates, calibration or UI projections to erase historical disagreement with reality.

Reality Error Ledger is derived scientific evidence, not Canonical Patient State and not the human clinical-validation ledger.

## 2. Existing repository primitives to reuse

### Canonical Patient State

src/lib/panaceaLongitudinalState.ts remains the source of measured/imported/clinician-entered longitudinal patient truth. Reality Error Ledger may reference accepted longitudinal events as observations. It must not duplicate or replace their authority.

### Physiological provenance

src/lib/physiology/runtime.ts already provides engine id, model id/version, parameter-set id, validation class, fidelity, provenance ids, parent provenance ids, modeled field value/unit, and model-derived vs simulated truth class.

Reality Error Ledger should preserve those identifiers rather than inventing a second model-provenance schema.

### Clinical validation ledger

server/src/validasiLedger.ts remains dedicated to clinician validation, adjudication, safety and usability study records.

Reality Error Ledger must not reuse that ledger as storage for machine prediction errors. Human clinical validation and prediction-error evidence have different semantics and governance.

### Longitudinal audit export

src/lib/longitudinalAuditExport.ts demonstrates the repository pattern of deterministic provenance-oriented audit export without raw clinical narrative or credentials. A future Reality Error Ledger export may follow the same minimization principles, but v1 remains a pure deterministic library first.

## 3. Core invariants

1. A prediction is immutable after recording.
2. An observation never rewrites the original prediction.
3. A comparison appends evidence; it does not mutate prediction history.
4. Prediction error is never silently deleted after recalibration.
5. Only explicitly admissible observed truth may serve as reality.
6. Simulated, model-derived, AI-generated or reference values may not become reality observations.
7. Unit mismatch fails closed.
8. Semantic mismatch fails closed.
9. Subject mismatch fails closed.
10. Unknown uncertainty remains unknown.
11. v1 performs no automatic model or parameter recalibration.
12. The ledger is not a signed clinical record.
13. The ledger is not itself proof of clinical validity.
14. Counterfactual predictions remain distinguishable from prospective predictions intended for later real-world comparison.

## 4. Prediction record

The v1 prediction record must preserve:

- id
- subjectId
- field
- unit
- predictedValue
- predictedSigma, nullable
- createdAt
- targetAt
- provenanceId
- engineId
- modelId
- modelVersion
- parameterSetId
- validationClass
- fidelity
- parentProvenanceIds
- predictionClass = prospective
- status = pending | matched | expired-unobserved

A prediction fails closed when required identity/provenance fields are blank, predictedValue is non-finite, sigma is invalid, timestamps are malformed, targetAt precedes createdAt, or prediction semantics are not prospective.

## 5. Observation reference

Reality Error Ledger does not own observed truth.

A comparison references a LongitudinalEvent<number> from Canonical Patient State.

Admissible v1 observation semantic states are:

- measured
- imported
- clinician-entered

It must also have a finite numeric value, explicit unit, same subject, explicit provenance, and valid timestamp.

patient-reported, derived, rule-output, ai-draft, simulated, reference, clinician-reviewed and unavailable are not v1 reality-observation classes.

A later version may widen this only through an explicit source-qualification contract.

## 6. Semantic matching

v1 must not infer semantic equivalence from strings.

A prediction field matches an observation only when canonical semantic identity matches exactly.

Example:
cardio.heart_rate equals cardio.heart_rate.

But HR, pulse, heart-rate and cardio.heart_rate must not be assumed equivalent automatically.

No fuzzy matching, aliases or NLP-based semantic promotion are allowed in v1.

## 7. Unit matching

Observation and prediction units must match exactly in v1.

No implicit conversion is allowed inside Reality Error Ledger.

Examples:
- bpm equals bpm: admissible
- mmHg equals mmHg: admissible
- percent differs from fraction: fail closed
- mg/dL differs from mmol/L: fail closed

Unit normalization belongs upstream.

## 8. Temporal matching

Each prediction is made at createdAt for a future targetAt.

An observation may match only when:

|t_obs - t_target| <= matchToleranceMs

The caller must provide matchToleranceMs. The ledger must not invent one universal physiological tolerance.

If more than one admissible observation falls inside tolerance, deterministic selection is:

1. minimum absolute distance to targetAt;
2. tie-break by earlier effective timestamp;
3. final tie-break by lexical event id.

## 9. Comparison record

A v1 comparison record preserves:

- id
- predictionId
- subjectId
- field
- unit
- observationEventId
- observedValue
- observedAt
- signedError
- absoluteError
- predictedSigma
- observedSigma
- combinedSigma
- standardizedResidual
- predictionProvenanceId
- observationSourceId
- createdAt

The observed numeric value may be duplicated as immutable comparison evidence, while Canonical Patient State remains the authoritative source event.

## 10. Error calculations

For prediction y_hat and observation y:

e = y - y_hat

absoluteError = abs(y - y_hat)

If both uncertainties are known and independent under the comparison contract:

combinedSigma = sqrt(predictedSigma^2 + observedSigma^2)

When combinedSigma > 0:

standardizedResidual = (y - y_hat) / combinedSigma

Otherwise:
- combinedSigma is null when either required sigma is unknown;
- standardizedResidual is null when combined uncertainty is unknown or zero.

The ledger must never synthesize uncertainty solely to create a standardized residual.

## 11. Observation uncertainty

Canonical LongitudinalEvent currently exposes confidence, not numeric measurement sigma.

v1 must not convert confidence into sigma.

Observation sigma may only be supplied through an explicit comparison input/adaptor when its provenance supports the numeric uncertainty definition.

If no qualified observation sigma exists:
- observedSigma = null
- combinedSigma = null
- standardizedResidual = null

This is expected behavior.

## 12. Ledger state

The in-memory v1 ledger contains:

- subjectId
- revision
- predictionsById
- comparisonsById
- comparisonIdByPredictionId

v1 is deliberately not a database design.

Persistence, server storage, encryption-at-rest, synchronization and multi-device replication belong to later plans.

## 13. Append-only operations

Required logical operations:

- createRealityErrorLedger(subjectId)
- recordRealityPrediction(ledger, prediction)
- comparePredictionToObservation(ledger, predictionId, observation, options)
- matchPredictionToObservations(ledger, predictionId, observations, options)
- markPredictionExpiredUnobserved(ledger, predictionId, at)

Semantics:
- identical duplicate prediction is idempotent or explicitly duplicate-safe;
- conflicting duplicate id fails closed;
- one prediction has at most one canonical v1 comparison;
- second comparison for an already matched prediction fails closed;
- comparison id is deterministic from stable content or otherwise replayable/collision-safe;
- comparison insertion increments ledger revision;
- previous records remain unchanged.

## 14. Prediction status

pending means no matched observation yet.

matched means exactly one canonical admissible observation has been linked.

expired-unobserved means the caller explicitly declares that the observation window passed without an admissible real observation.

expired-unobserved is not correct, incorrect, zero error, missing-at-random, or calibration evidence.

## 15. Counterfactual exclusion

Reality Error Ledger v1 accepts only predictionClass = prospective.

Counterfactual branches require a later branch-aware pathway.

A simulated what-if branch cannot be scored as though it were a real prospective prediction merely because reality later resembled it. This prevents hindsight selection.

## 16. Relationship to calibration

v1 stops at:

prediction -> later observation -> immutable comparison/error

It does not perform:

error -> automatic parameter update

The future Calibration Engine may consume the ledger only after Parameter Registry, identifiability rules, parameter bounds, calibration-data partitioning, overfitting protection, held-out/future validation, and rollback/version history exist.

Calibration may append new parameter/model versions. Calibration may never rewrite prior predictions or comparisons.

## 17. Relationship to AI-EMR

Reality Error Ledger is not automatically published into AI-EMR.

Future AI-EMR projections may include model-performance audit summaries, clinician-visible provenance, or validated research/quality reports, but raw prediction-error records must not silently become signed clinical facts.

The existing AI-EMR publication boundary remains authoritative.

## 18. Privacy and minimization

Store only minimum comparison evidence:
- subject id
- semantic field
- unit
- numeric prediction
- numeric observation snapshot
- timestamps
- model/provenance identifiers
- uncertainty where known
- source event/source ids
- comparison statistics

v1 must not store raw video, raw image pixels, raw waveforms, free-text clinical narrative, authentication secrets, unnecessary geolocation, or unrelated patient data.

## 19. Determinism and replay

Given the same prediction, observation set, matching tolerance and observation uncertainty metadata, the ledger must produce the same selected observation, comparison id and numerical results.

No wall-clock-dependent selection is allowed except explicit caller-provided timestamps.

## 20. Failure behavior

Fail closed for:
- unknown prediction id
- subject mismatch
- semantic mismatch
- unit mismatch
- inadmissible observation truth class
- nonnumeric/nonfinite values
- malformed timestamps
- observation outside tolerance
- conflicting duplicate prediction id
- second comparison for already matched prediction
- negative/nonfinite uncertainty
- target before creation
- counterfactual/simulated output treated as prospective reality prediction

Errors must be deterministic and specific enough for tests.

## 21. First integration fixture

The first integration fixture should use the existing cardiovascular/oxygen chain without implying clinical validation:

boundary observations
-> cardiovascular/oxygen runtime
-> prospective model prediction
-> later synthetic/admissible measured fixture
-> Reality Error Ledger comparison

This is a software/infrastructure test only.

Do not claim that the current algebraic cardio/O2 chain predicts real future patient physiology merely because the ledger can compare numbers.

## 22. Proposed implementation surface

First implementation is narrowly scoped to:

- Create src/lib/physiology/realityErrorLedger.ts
- Create scripts/uji/reality-error-ledger.mts
- Create DOCS/REALITY-ERROR-LEDGER.md
- Modify only minimum existing runtime/doctrine docs needed to link implemented status

No database schema, UI, API route, AI-EMR write, automatic calibration, active sensing or model marketplace work belongs in v1.

## 23. Required deterministic tests

At minimum:

1. create an empty subject-scoped ledger;
2. record a valid prospective prediction;
3. idempotent duplicate prediction handling;
4. conflicting duplicate prediction fails closed;
5. subject mismatch fails closed;
6. semantic mismatch fails closed;
7. unit mismatch fails closed;
8. simulated/derived observation cannot become reality;
9. invalid timestamps fail closed;
10. target before creation fails closed;
11. nearest observation inside tolerance selected deterministically;
12. tie-breaking follows timestamp then event id;
13. outside-tolerance observation rejected;
14. signed and absolute error correct;
15. combined sigma and standardized residual correct when both sigmas known;
16. unknown observation sigma preserves null combined sigma/residual;
17. matched prediction cannot receive second canonical comparison;
18. expired-unobserved prediction remains unscored;
19. original prediction remains unchanged after comparison;
20. comparison provenance retains model/version/parameter/provenance and observation source ids;
21. identical replay inputs produce identical comparison output;
22. counterfactual prediction class fails closed.

## 24. Acceptance criteria

Reality Error Ledger v1 is complete only when:
- predictions are immutable and provenance-complete;
- admissible reality observations come from Canonical Patient State contracts;
- matching is exact, deterministic and fail-closed;
- error calculations are reproducible;
- unknown uncertainty remains null;
- historical prediction error cannot be erased by later updates;
- no calibration occurs;
- no AI-EMR publication occurs;
- no second patient-state authority is created;
- no clinical-validation claim is made;
- implementation is independently testable through the normal repository test gate.

## 25. Non-goals

v1 does not provide parameter recalibration, model selection, automatic model replacement, causal attribution for why a prediction failed, semantic terminology mapping, automatic unit conversion, counterfactual scoring, population benchmarking, clinical validation, UI, persistence/database storage, distributed synchronization, AI-EMR publication, active sensing, or patient-facing prediction claims.

The only v1 objective is to make prediction-vs-reality error immutable, explicit, replayable, provenance-preserving and scientifically honest.
