# Autophagy timing: engineering handoff for human review

Status: `PENDING_CLINICAL_REVIEW`; `clinically_reviewed=false`.
This package documents an existing educational heuristic. It does not establish an individual's glycogen concentration, autophagy activity, fasting safety, or a treatment recommendation.

## Source and formula

The formula was already present in `src/pages/PredictiveModelsToolkit.tsx`; PR #2392 moves it into `src/domains/clinical-calculators/engine/autophagyTiming.ts` without changing its constants or rounding. No identified scientific source validates these particular coefficients. The surrounding UI explicitly says the constants were chosen by the author. A qualified reviewer must assess the scientific claim and source applicability independently.

For body fat `b` in percent and elapsed meal time `t` in hours:

```
leanFactor = 1 - b / 100
thresholdHours = 14 - 2 * leanFactor
remainingHours = max(0, thresholdHours - t)
```

The output is a simulation of the declared formula. Reaching zero means the model threshold is reached, not that autophagy has been measured or proven to have started. The UI displays that distinction.

## Inputs and provisional guards

| Input | Unit | Engineering range | Empty / invalid behavior |
| --- | --- | --- | --- |
| Body fat | % | 3–70 inclusive | No estimate; explicit reason |
| Time since last meal | h | 0–72 inclusive | No estimate; explicit reason |

These ranges are provisional technical plausibility guards, not clinician-approved cutoffs or recommendations to fast. Both inputs start empty. Explicit `0` hours is distinct from a missing value. Non-numeric runtime values, NaN, infinities, and out-of-range inputs produce null output and null model state. An unused body-weight field removed on main remains absent.

## Reproducible engineering checks

`node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/autophagy-timing.mts`

| Body fat % | Meal time h | Expected remaining h | Expected model threshold state |
| --- | --- | --- | --- |
| 20 | 2 | 10.4 | Not reached |
| 20 | 0 | 12.4 | Not reached |
| 3 | 0 | 12.06 | Not reached |
| 70 | 0 | 13.4 | Not reached |
| 20 | 12.3 | 0.1 | Not reached |
| 20 | 12.4 | 0 | Reached |
| 20 | 72 | 0 | Reached |

Tests cover paired min/max and just-outside limits, both fields missing, each field independently invalid at runtime, deterministic behavior, and pending review metadata. These expected values verify arithmetic only.

`scripts/qa/autophagy-input-smoke.mjs` exercises actual Chromium input at 390×844: empty initial state, filling both values, explicit zero hours, clearing either input, out-of-range rejection, model-state suppression, and recovery. The mandatory Stabilization Acceptance job retains JSON and screenshot evidence. Browser and unit results are engineering evidence, not clinical review.

## Limitations for the reviewer

No individual glycogen, activity, meal composition, glucose, medication, pregnancy, age, disease, or laboratory data enter the formula. No pediatric, pregnancy, diabetic, or other clinical population validation is supplied. The heuristic cannot authorize fasting, medication changes, diagnosis, orders, or treatment. The model and provisional ranges require qualified human review before any clinical-use claim.

## Reserved human review record

| Field | Current value |
| --- | --- |
| Qualified reviewer name / credentials | Unassigned |
| Authorized reviewer identifier | Unassigned |
| Review date | Unassigned |
| Reviewed source revision | Unassigned |
| Approved ranges / intended population | Unassigned |
| Signed evidence / reference assessment | Unassigned |
| Clinically reviewed | false |

Populate these fields only from a real authorized review of the specific version. This document supplies no approval.
