# Reality Error Ledger v1

**Status:** deterministic in-memory scientific-evidence primitive. It records prospective model predictions and immutable prediction-vs-reality comparison evidence. It is **not** a clinical record, calibration engine, persistence layer, or proof of clinical validity.

Canonical design: `docs/superpowers/specs/2026-09-27-reality-error-ledger-design.md`.

## Purpose

Reality Error Ledger v1 preserves what a model predicted before a later observation became available, then records the discrepancy without rewriting the original prediction.

The scientific loop is:

```text
prospective model prediction
-> later admissible real observation
-> immutable comparison evidence
```

The ledger deliberately stops before recalibration.

## Implemented API

`src/lib/physiology/realityErrorLedger.ts` implements:

- `createRealityErrorLedger(subjectId)`;
- `recordRealityPrediction(ledger, prediction)`;
- `markPredictionExpiredUnobserved(ledger, predictionId, at)`;
- `comparePredictionToObservation(ledger, predictionId, observation, options)`;
- `matchPredictionToObservations(ledger, predictionId, observations, options)`.

Prediction evidence is immutable after insertion. Lifecycle status is stored separately as:

`pending | matched | expired-unobserved`.

This separation allows lifecycle progression without rewriting the historical prediction payload.

## Reality observation boundary

Canonical Patient State remains the authority for observed patient truth.

v1 accepts only numeric `LongitudinalEvent` observations explicitly classified as:

- `measured`;
- `imported`;
- `clinician-entered`.

It rejects patient-reported, derived, rule-output, AI-draft, simulated, reference, clinician-reviewed and unavailable states as v1 reality observations.

The ledger requires exact subject, exact canonical field, exact unit and caller-bounded temporal compatibility. It performs no fuzzy semantic matching and no implicit unit conversion.

## Deterministic temporal matching

For a prediction target time and candidate observation:

[
|t_{obs}-t_{target}| leq Delta t_{match}
]

The caller supplies `matchToleranceMs`.

If several observations qualify, selection order is:

1. smallest absolute target-time distance;
2. earlier observation timestamp;
3. lexical event id.

The same prediction, candidate set, tolerance and uncertainty evidence therefore produce the same selected observation and comparison id.

## Error equations

For prediction (hat y) and observation (y):

[
e = y - hat y
]

[
AE = |y-hat y|
]

When prediction and observation sigmas are both explicitly known:

[
sigma_{combined} = sqrt{sigma_{pred}^{2}+sigma_{obs}^{2}}
]

and, only when (sigma_{combined}>0):

[
z_{residual} = rac{y-hat y}{sigma_{combined}}
]

If either required sigma is unknown, combined sigma and standardized residual remain `null`.

A longitudinal event's generic `confidence` is never converted into sigma.

## Provenance

Every prediction preserves:

- engine id;
- model id/version;
- parameter-set id;
- validation class;
- fidelity;
- prediction provenance id;
- parent provenance ids.

Every comparison preserves the prediction provenance id and the authoritative observation event/source ids. Optional numeric observation uncertainty requires its own provenance id.

## Append-only semantics

- identical duplicate prediction insertion is idempotent;
- conflicting duplicate prediction id fails closed;
- one v1 prediction may have at most one canonical matched comparison;
- comparison appends evidence and changes lifecycle status without mutating prediction payload;
- expired-unobserved predictions remain unscored;
- counterfactual predictions are not admitted into this v1 prospective ledger.

Future calibration may consume this evidence, but calibration must never rewrite the historical prediction or comparison.

## Test gate

`scripts/uji/reality-error-ledger.mts` is automatically discovered by `npm run uji`.

The gate covers prediction immutability, duplicate handling, admissible truth classes, exact semantic/unit/time matching, error math, explicit/null uncertainty, deterministic candidate selection, replay equality, expiration, counterfactual exclusion and a cardio→oxygen-delivery integration fixture.

The cardio/O2 fixture is infrastructure/software evidence only. It does **not** establish that the current algebraic physiological chain is a validated prospective patient model.

## Explicit non-goals

v1 does not implement:

- automatic parameter calibration;
- Parameter Registry / identifiability;
- Biological Git;
- Reality Gap Registry;
- Active Sensing;
- counterfactual branch scoring;
- persistence/database storage;
- distributed synchronization;
- UI;
- AI-EMR publication;
- clinical validation;
- patient-facing predictive claims.
