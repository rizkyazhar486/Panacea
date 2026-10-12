# Adult BMI availability — engineering review package

Status: PENDING_CLINICAL_REVIEW; clinically_reviewed=false. Reviewer identity, qualifications, reviewed version, date and signature remain unassigned.

Formula: BMI = weightKg / (heightCm / 100)². Display unit: kg/m²; one decimal using the existing rounding rule. The calculation-availability flag is technical, not clinical approval. Missing, wrong-type, nonfinite, nonpositive or unrepresentable inputs/results return the existing compatibility sentinel (bmi=0, valid=false, Cannot be calculated); clients must show unavailable, not a measured zero or a patient marker.

The existing unrounded-value classification is preserved: below 18.5 Underweight; 18.5–<23 Normal; 23–<25 At risk; 25–<30 Obesity I; ≥30 Obesity II. The implementation labels these Asia-Pacific cutoffs; independent verification of the applicable population and source is pending. Rounded display values can straddle a classification boundary; no clinical cutoff was silently changed. This package does not establish universal suitability for pediatric, pregnancy, older-adult or other special populations.

Known-value check: 70 kg / 1.75² = 22.857… → 22.9. Boundary tests pair exact 18.5/23/25/30 with just-below values. Finite source values alone are insufficient: squared height, division and rounding can overflow/underflow. Derived nonfinite or impossible zero results are unavailable. A positive finite input grid retains the original formula and output rounding.

The Dashboard and adult GrowthChart hide both the numeric measurement/unit and patient marker when unavailable, with accessible availability labels. Valid 22.9 retains the original display. This does not authorize clinical diagnosis or change clinician-controlled signing.

Reproducible commands:

```sh
node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/bmi-tak-terhitung.mts
npm run uji
npm run build
BMI_QA_ORIGIN=http://127.0.0.1:4173 node scripts/qa/bmi-availability-smoke.mjs
```

The browser fixture uses synthetic selected-patient data against the actual client, covering missing height, finite overflow/underflow and valid recovery in both displayed charts. It is client-only evidence, not real-server persistence, RBAC, anatomical validation or qualified human review. The original #2459 contributor's commit is retained as ancestry; no approval is invented.
