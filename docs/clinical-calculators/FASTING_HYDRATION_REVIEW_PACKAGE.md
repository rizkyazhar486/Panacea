# Coffee and fasting model: engineering handoff

Status: `PENDING_CLINICAL_REVIEW`; `clinically_reviewed=false`.
Reviewer name, credentials, authorized identifier, date, reviewed revision, signed evidence, and approved ranges are all **unassigned**. No clinical approval is supplied.

## Declared inputs and units

| Input | Unit | Provisional technical range | Missing / invalid behavior |
| --- | --- | --- | --- |
| Coffee cups entered | cups | Whole number 0–15 | No output, visible reason |
| Elapsed fasting time | h | 0–72, fractions allowed | No output, visible reason |

These are input guards inherited from the form, not consumption recommendations, safe fasting durations, or clinician-approved cutoffs. Inputs start unknown. Explicit zero is accepted separately from missing data. Cups do not measure an individual's actual cup volume or caffeine intake.

## Existing formula and provenance

`src/domains/personal-health/engine/fastingHydration.ts` preserves the pre-existing NutritionToolkit arithmetic:

- Coffee volume illustration: entered cups × 150 mL. The assumed 150 mL cup is not a measured volume.
- Sodium model: min(3000, round(fasting hours × 60)) mg.
- Potassium model: min(2500, round(fasting hours × 45)) mg.
- Magnesium model: min(350, round(fasting hours × 8)) mg.

The electrolyte coefficients and caps have **no identified validating scientific source**. `coefficient_evidence=UNVERIFIED` remains explicit. These are educational formula outputs, not intake targets, measured losses, biological requirements, or supplement doses. The UI says so next to the output.

The existing coffee context cites Killer, Blannin & Jeukendrup (2014), PLoS ONE 9(1):e84154. That citation does not validate this assumed cup volume, a 15-cup consumption limit, or any electrolyte coefficient. Its population and conditions require independent human assessment before generalization.

## Reproducible arithmetic and input checks

Run `node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/nutrition-puasa-kopi.mts`.

| Input | Expected formula output |
| --- | --- |
| 2 cups | 300 mL |
| Explicit 0 cups | 0 mL |
| 16 h | 960 mg sodium, 720 mg potassium, 128 mg magnesium |
| Explicit 0 h | All three model outputs 0 mg |
| 72 h | Capped outputs 3000 mg, 2500 mg, 350 mg |
| Missing, non-finite, wrong runtime type, outside range | No numeric output |

Tests distinguish empty text from explicit zero and reject fractional cups, negative input, over-limit input and overflow. Paired min/max tests and determinism preserve the original arithmetic. They verify software behavior, not clinical suitability.

`scripts/qa/nutrition-input-smoke.mjs` exercises actual Chromium 390×844 input, output suppression, visible reasons, recovery, no runtime errors, and horizontal overflow. Stabilization Acceptance retains JSON/screenshot evidence. Human review remains separate.

## Required human assessment

Assess the claims, intended population, coefficients, limits, dosing interpretation and contraindications using qualified evidence. This implementation cannot authorize fasting, supplementation, diagnosis, prescribing, orders or treatment. Renal/cardiovascular conditions and medications are not modeled. Review records must identify the specific version; metadata must remain false until a real authorized review exists.
