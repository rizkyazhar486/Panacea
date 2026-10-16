# Clinical calculators — automated engineering-review dossier (tranche 1)

Status: **ENGINEERING EVIDENCE ONLY**. Criterion C6 stays **PENDING_CLINICAL_REVIEW**; every registry entry keeps `clinically_reviewed=false`.
This dossier records reproducible software behavior. It does not approve any calculator for patient-care use, and agreement between an
AI-assisted review and the code is not clinical proof. No reviewer identity, date, signature or approval is recorded here, and none may be
added by engineering tests.

| Qualified review field | Current value |
| --- | --- |
| Reviewer name / professional identifier | Unassigned |
| Review date | Not reviewed |
| Approved source revision | None |
| Signed range / interpretation approval | None |

Baseline: `origin/main` at `d88867af`. Suite: `scripts/uji/calculator-independent-reference.mts` (runs inside `npm run uji`).

## What "engineering-ready" means here

For each calculator below, the suite proves, deterministically and with a fixed seed:

1. **Independent reference.** An implementation written separately from the published formula (it imports none of the engine's constants)
   agrees with the engine to 1e-9 relative on 400 seeded random valid inputs per calculator.
2. **Metamorphic invariants** that hold for the formula itself (for example Cockcroft–Gault is linear in weight, inversely proportional to
   creatinine, and exactly 0.85× for women; all four QTc corrections equal the raw QT at 60 bpm).
3. **Range boundaries.** Each input is accepted at its minimum and maximum and rejected just outside, including exact band cut-offs.
4. **Hostile input.** `NaN`, `±Infinity`, `-1`, `0` (where out of range), `±1e308`, strings, `''`, `null`, `undefined` (except documented optional
   fields), booleans, objects and arrays on any single field never produce a number and never throw. A blank field is "missing", never zero.
5. **Mutation resistance.** 55 deliberate source mutants (every formula constant, band cut-off, equality boundary and guard) each fail the suite
   by a named assertion. Two exact-boundary gaps found by this process (`LDL = 0`, `A–a = expected`) were closed with exactly representable cases.

What this does **not** establish: that the formulas suit a clinical population, that the input ranges or band cut-offs are clinically right, or
that the reference formulas themselves are the best choice. Those are the human review.

## Result: no discrepancy found

The 12 calculators in this tranche match their independently written references. Four failures occurred while building the suite; all four were
mistakes in the test fixtures (a shift that left a valid range, a wrong expected label, an optional field treated as hostile, a base value that
tripped a genuine cross-field rule). None was an engine defect.

## Per-calculator record

| Calculator (engine) | Published form as implemented | Citation recorded in the engine | Items only a qualified reviewer can settle |
| --- | --- | --- | --- |
| Cockcroft–Gault (`cockcroftGault`) | CrCl = (140 − age) × weight × (0.85 if female) / (72 × SCr); Devine IBW | Cockcroft & Gault, Nephron 1976;16:31-41 | Weight basis for obesity (the engine offers actual or ideal and flags actual > 125 % IBW; which to use is clinical). Devine is clamped to its base value below 60 in (heights 100–152 cm). Assumes steady-state creatinine and adults 18–120 y. Band cut-offs 90/60/30/15. |
| Mean arterial pressure (`meanArterialPressure`) | (SBP + 2 × DBP) / 3 | none recorded | Citation to be supplied. Bands < 60, ≤ 100, above. Ranges SBP 40–300, DBP 20–200 are plausibility limits. |
| Albumin-corrected calcium (`correctedCalcium`) | Ca + 0.8 × (4.0 − albumin g/dL) | Payne et al., BMJ 1973;4:643-6 | The engine itself notes ionized calcium is more reliable in critical illness. Bands 7.0 / 8.5 / 10.5 / 12 mg/dL. |
| Serum osmolality and gap (`serumOsmolality`) | 2·Na + glucose/18 + BUN/2.8 (+ ethanol/3.7); gap = measured − calculated | Dorwart & Chalmers 1975 | **Ethanol constant:** the page documents theoretical `/4.6` (molecular weight 46) versus the empirical `/3.7` the engine uses. The suite pins `/3.7`; the reviewer should confirm that choice. Bands 275 / 295 / 320; gap 10 / 20. |
| LDL-C Friedewald (`ldlFriedewald`) | LDL = TC − HDL − TG/5 (mg/dL); not applied at TG ≥ 400 | Friedewald et al., Clin Chem 1972;18:499-502 | NCEP ATP III bands (100/130/160/190). Calculated LDL ≤ 0 is flagged as implausible rather than banded; HDL ≥ TC is rejected. |
| QTc (`qtc`) | Bazett QT/√RR; Fridericia QT/∛RR; Framingham QT + 154(1 − RR); Hodges QT + 1.75(HR − 60) | Bazett 1920; Fridericia 1920; Sagie 1992; Hodges 1983 | The band uses Bazett, which the suite shows over-corrects at high heart rate (and under-corrects at low). **Cut-offs differ across published guidance** (the engine uses ≥ 450 men / ≥ 470 women for "prolonged", ≥ 500 high risk). Alternatives exist for women; this session did not verify any against a primary guideline, so the choice needs reviewer confirmation. |
| FENa (`fena`) | (UNa × PCr) / (PNa × UCr) × 100 | none recorded | Citation to be supplied. Bands < 1 / 1–2 / > 2 %. Whether the UI warns about diuretics is a presentation question for the reviewer. |
| A–a gradient (`aaGradient`) | PAO₂ = FiO₂ × (Patm − 47) − PaCO₂/0.8; expected = age/4 + 4 | none recorded | Simplified alveolar gas equation with a fixed R = 0.8 (no FiO₂-dependent correction). The age/4 + 4 expectation is a rule of thumb; reviewer to confirm and supply a citation. |
| Holliday–Segar (`hollidaySegar`) | 100 mL/kg to 10 kg, +50 mL/kg to 20 kg, +20 mL/kg above | none recorded | Continuous at 10 and 20 kg (tested). The engine accepts 0.3–300 kg; whether neonates and preterm infants should be excluded is a clinical decision. |
| Parkland (`parklandVolumes`) | 4 mL × kg × %TBSA over 24 h, half in the first 8 h | none recorded | Citation to be supplied. 0 % TBSA is rejected (no burn is not a zero-volume resuscitation). |
| Ideal body weight (`idealBodyWeight`, `dailyCalories`) | Broca: (H − 100) × 0.90 (M) / 0.85 (F); Lorentz: H − 100 − (H − 150)/4 (M) or /2.5 (F) | none recorded | Citations to be supplied. kcal/kg per activity level (30/35/40) is a presentation choice. |

## Reproduce

```
npm ci
node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/calculator-independent-reference.mts
```

## Next tranche (not yet covered)

`meldNa`, `childPugh`, `sofaScore`, `news2`, `glasgowBlatchford`, `graceScore`, `charlson`, `centor`, `paradise`, `findrisc`, `stopBang`,
`widmarkBac`, `naegele`, `midParentalHeight`, `waistToHeight`, `lightsCriteria`, `pediatricDka`, `bloodGas`, `fluidElectrolytes`,
`electrolyteCorrection`, `ivDrip`, `pedsDose`, and the input-contract engines. Several already have reference-style tests under `scripts/uji/`
(`child-pugh`, `meld-na`, `sofa-score`, `egfr-ckd-epi-2021`); they are not yet re-derived independently here.
