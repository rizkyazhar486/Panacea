# Framingham simulator — technical evidence for qualified review

Status: **PENDING_CLINICAL_REVIEW**. `clinically_reviewed=false`.
This package records reproducible software behavior; it does not authorize patient-care use.

| Qualified review field | Current value |
| --- | --- |
| Reviewer name / professional identifier | Unassigned |
| Review date | Not reviewed |
| Approved source revision | None |
| Signed range / interpretation approval | None |

The pending `framinghamInputs` registry entry remains unsigned. A reviewer must identify the specific source version being approved; engineering tests cannot populate those approval fields.

## Declared equation and reference

Existing source reference: D'Agostino RB Sr et al., *General Cardiovascular Risk Profile for Use in Primary Care*, Circulation (2008), DOI [10.1161/CIRCULATIONAHA.107.699579](https://doi.org/10.1161/CIRCULATIONAHA.107.699579).
The reference is recorded for qualified review; this session has not independently evaluated the paper's clinical validity or the implementation's suitability for a clinical population.

`src/lib/riskModels.ts` calculates a 10-year **general CVD** model estimate:

`risk_percent = 100 × (1 − S0 ^ exp(L − mean))`

`L = β_age ln(age) + β_TC ln(total cholesterol) + β_HDL ln(HDL) + β_SBP ln(SBP) + β_smoking I(smoker) + β_diabetes I(diabetic)`

The software retains the existing one-decimal rounding and 0–100% bounds.

| Existing coefficient | Male model | Female model |
| --- | ---: | ---: |
| ln(age) | 3.06117 | 2.32888 |
| ln(total cholesterol) | 1.12370 | 1.20904 |
| ln(HDL) | −0.93263 | −0.70833 |
| ln(SBP), untreated | 1.93303 | 2.76157 |
| ln(SBP), treated | 1.99881 | 2.82263 |
| Smoker indicator | 0.65451 | 0.52873 |
| Diabetes indicator | 0.57367 | 0.69154 |
| Baseline survival S0 | 0.88936 | 0.95012 |
| Mean | 23.9802 | 26.1931 |

## Input contract and limits

| UI input | Unit | Current accepted range | Basis / review requirement |
| --- | --- | --- | --- |
| Age | Years | 30–74 inclusive | Declared derivation population; confirm applicability |
| Total cholesterol | mg/dL | 100–500 inclusive | Provisional technical plausibility guard; not a clinical cutoff |
| HDL | mg/dL | 10–150 inclusive | Provisional technical plausibility guard; not a clinical cutoff |
| Systolic BP | mmHg | 70–300 inclusive | Provisional technical plausibility guard; not a clinical cutoff |

Blank numeric fields are missing, not zero. Nonfinite or out-of-range UI input yields per-field problems and no estimate. Age may be prefilled only from stored profile information; lipid/BP fields are not invented. The shared equation also rejects nonfinite or coercible non-number fields when called without the UI validator. Direct equation callers remain responsible for the published population's applicability; a positive finite value alone does not establish clinical eligibility.

The model uses binary sex-specific coefficient sets and explicit smoking, diabetes and treatment controls. The software does not establish which coefficient set is appropriate for other populations or circumstances. These controls describe model assumptions, not independently verified patient observations.

## Numerical and negative regression evidence

Synthetic values: age 50 years, total cholesterol 200 mg/dL, HDL 50 mg/dL, SBP 130 mmHg. Expected numbers were independently evaluated from the declared coefficients with 50-digit Decimal arithmetic and one-decimal rounding; they are not patient outcomes or clinical validation data.

| Model | Treated BP | Smoker | Diabetes | Expected % |
| --- | --- | --- | --- | ---: |
| Male | No | No | No | 8.4 |
| Male | Yes | No | No | 11.4 |
| Male | No | Yes | Yes | 25.9 |
| Male | Yes | Yes | Yes | 33.8 |
| Female | No | No | No | 5.0 |
| Female | Yes | No | No | 6.6 |
| Female | No | Yes | Yes | 15.8 |
| Female | Yes | Yes | Yes | 20.7 |

`scripts/uji/health-simulator-inputs.mts` covers exact numeric preservation, every inclusive UI boundary and adjacent rejection, blanks, NaN/Infinity, wrong types, combined problems, and 28 invalid raw shared-equation cases. Before the shared guard correction, an infinite age produced 100%; the corrected result is `null`.

`scripts/qa/health-simulator-input-smoke.mjs` exercises the real built page at 390×844 with native interactions: initially empty fields/no estimate, male 8.4%, clearing HDL removes the estimate, age 29 is rejected, then valid female input restores 5.0%. This is a mandatory fail-closed Stabilization Acceptance step, with synthetic JSON/screenshot evidence. Browser proof does not substitute for human interpretation review.

## Interpretation and unresolved clinical questions

Preserve the existing `cvdBand` labels (<7.5%, <20%, and ≥20%) without claiming their clinical approval. A qualified reviewer must confirm that those bands and labels suit the **general CVD** outcome and intended population; different risk models or endpoints must not be conflated.

The what-if controls change covariates in the same equation. The resulting differences do not establish causal treatment efficacy. Future-age charts hold the entered measurements constant, cap age at 74, and do not predict the patient's actual future measurements.

Use restrictions, contraindications, excluded populations, acute-care applicability, and any proposed treatment interpretation require qualified assessment. This software must not be used as an independent diagnosis, acute triage, prescription, or treatment authority. No pregnancy, pediatric, individual-prognosis or real-patient validation is established by these tests. Existing clinical disclaimers and clinician authority remain intact.

## Source fingerprints for version-specific review

| File | SHA-256 of proposed source |
| --- | --- |
| `src/lib/riskModels.ts` | `d8248667e3bf97f707e9e088bbbe6bcd7b8613ca498a48173dba3f639d3235d8` |
| `src/domains/clinical-calculators/engine/framinghamInputs.ts` | `1252cde5f0cf2ee53c0134558658c7aa8a6bf5d49f9fb27cc3b2176a1df95cc1` |
| `src/pages/HealthSimulator.tsx` | `2805cd9310365fe5bbde3c23985a3825fb567a54c800f450818eab035360fa3d` |

Approval must refer to the actual integrated revision and these specific behaviors. Any later changes need a new version-specific assessment.
