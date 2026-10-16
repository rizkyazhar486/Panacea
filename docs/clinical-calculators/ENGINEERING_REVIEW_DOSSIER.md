# Clinical calculators — automated engineering-review dossier (tranches 1–3)

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

Baseline: `origin/main` at `5322f7e5`. Suites (all run inside `npm run uji`): `scripts/uji/calculator-independent-reference.mts` (tranche 1), `scripts/uji/calculator-independent-reference-2.mts` (tranche 2) and `scripts/uji/calculator-independent-reference-3.mts` (tranche 3); shared helpers in `scripts/uji/support/calculatorHarness.mts`.

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

## Tranche 2 — table-based scoring systems (suite: `scripts/uji/calculator-independent-reference-2.mts`)

The five engines below were compared with references **transcribed separately as range tables** (not copies of the engine functions), over **every** integer value
(or tenth, for creatinine, bilirubin, temperature, haemoglobin and BUN) across each parameter's accepted range, plus 400–800 seeded random cases, total/class/band
logic, monotonicity, range boundaries and hostile inputs. 111 source mutants (each threshold, constant, clamp, flag weight and band cut-off) fail by name with no survivor.
Result: **no discrepancy** between the engines and the published tables as transcribed; no engine defect was found in this tranche.

| Calculator (engine) | Published form checked | Citation recorded in the engine | Items only a qualified reviewer can settle |
| --- | --- | --- | --- |
| Child-Pugh (`childPugh`) | Bilirubin < 2 / 2–3 / > 3; albumin > 3.5 / 2.8–3.5 / < 2.8; INR < 1.7 / 1.7–2.3 / > 2.3; ascites and encephalopathy 1–3; classes A 5–6, B 7–9, C 10–15 | Pugh et al. 1973 | The survival percentages shown per class carry no citation in the engine. Ascites and encephalopathy are user-chosen levels, not derived. |
| MELD-Na (`meldNa`) | MELD = 3.78 ln(bili) + 11.2 ln(INR) + 9.57 ln(Cr) + 6.43 with lower floors of 1.0, Cr capped at 4.0 and pinned at 4.0 on dialysis; MELD-Na only if MELD > 11 using Na bounded to 125–137; result bounded to 6–40 | Kamath 2001; Kim 2008; OPTN/UNOS 2016 policy | Whether intermediate rounding per OPTN policy is required is not established here (the engine returns unrounded values). OPTN has since adopted a newer allocation model (MELD 3.0, 2023); whether this calculator should present the 2016 model as current is a reviewer decision, not verified in this session. Priority bands and the 3-month mortality figures carry no citation. |
| NEWS2, SpO₂ scale 1 (`news2`) | RR, SpO₂, air/oxygen, SBP, pulse, consciousness, temperature tables; ≥ 7 high, ≥ 5 or any single 3 medium, ≥ 1 low-medium | Royal College of Physicians 2017 | SpO₂ scale 2 (hypercapnic respiratory failure) is **not implemented** (the engine says so): a patient who should be scored on scale 2 gets a wrong SpO₂ contribution. Consciousness is a yes/no (any non-alert state scores 3). The escalation text is an institutional protocol choice. |
| SOFA (`sofaScore`) | Respiratory (PaO₂/FiO₂ with support), platelets, bilirubin, creatinine, GCS tables; cardiovascular level chosen by the user | Vincent et al. 1996 | **The mortality bands (< 10 %, ~10–20 %, ~20–40 %, ~50–60 %, > 80 %) have no citation and do not match the SOFA mortality tables I recall; I could not verify either here, so this is flagged, not asserted.** The renal subscore uses creatinine only (no urine-output criteria). The published table's "> 12.0" and "> 5.0" leave exactly 12.0 / 5.0 undefined; the engine scores them as the higher band. |
| Glasgow-Blatchford (`glasgowBlatchford`) | Urea 6.5/8/10/25 mmol/L (× 2.8 = BUN 18.2/22.4/28/70 mg/dL); haemoglobin by sex; SBP; pulse, melaena, syncope, hepatic disease, cardiac failure | Blatchford et al., Lancet 2000;356:1318 | "Very low" is a score of exactly 0 and "low-moderate" is ≤ 5; guideline thresholds for outpatient management differ (0 versus ≤ 1) and were not verified here. Pulse ≥ 100 and the other flags are user-ticked. |

## Tranche 3 — dating, dosing arithmetic and screening (suite: `scripts/uji/calculator-independent-reference-3.mts`)

Ten engines compared with independently written references (Naegele uses its own civil-calendar day arithmetic, not `Date`), 400–800 seeded cases each, exact-boundary
cases, range corners and hostile inputs. 70 source mutants (every constant, threshold, comparison and branch) fail by name, no survivor. Result: **no discrepancy**.
One suspicion was checked and **ruled out**: Light's "pleural LDH > ⅔ of the upper limit" has no floating-point error at the exact boundary for any integer limit from 3 to 2000
(brute force), so no change was made.

| Calculator (engine) | Form checked | Citation recorded in the engine | Items only a qualified reviewer can settle |
| --- | --- | --- | --- |
| Naegele (`naegele`) | EDD = LMP + 280 + (cycle − 28) days; gestational age = days since LMP − (cycle − 28), hidden when negative or beyond 45w0d; due date is exactly 40w0d for any cycle length; all in UTC calendar days | none recorded | Whether and how ultrasound dating should supersede the LMP estimate is a clinical decision (the engine only says confirmation is advised). The 45-week display limit is a presentation choice. |
| Widmark BAC (`widmarkBac`) | BAC‰ = grams / (r × kg) − 0.15 × hours, r = 0.68 (M) / 0.55 (F), ethanol density 0.789 g/mL, UK unit 8 g, US standard drink 14 g, floored at 0 | none recorded | The constants are population averages and absorption is ignored; whether an "estimated BAC" should be shown at all, and with what wording, is a reviewer/legal decision. A drink count that is absent is read as 0 drinks (documented behaviour); `NaN`, negative or non-numeric counts are refused. |
| Mid-parental height (`midParentalHeight`) | (father + mother ± 13) / 2, range ± 8.5 cm | none recorded | Citation and the meaning of the ± 8.5 cm range to be supplied. |
| Waist-to-height (`waistToHeight`) | ratio < 0.5 / < 0.6 / ≥ 0.6 | none recorded | Citation for the cut-offs to be supplied; age and ethnicity applicability not established. |
| IV drip rate (`ivDrip`) | mL/h = V / h; drops/min = V × factor / (h × 60); factors 15, 20, 60 | none (arithmetic) | The engine states the set's drop factor must be confirmed by the clinician. |
| Katz sodium correction (`correctedSodiumKatz`) | + 1.6 mEq/L per 100 mg/dL glucose above 100 (never negative) | Katz 1973 | Other correction factors exist in the literature; which one to present is a clinical choice. |
| Potassium assessment (`potassiumAssessment`) | deficit range (4.0 − K) × 200 to × 400 mEq below 4.0; severity bands at 2.5 / 3.0 / 3.5 and 5.5 / 6.0 / 6.5 | rule of thumb attributed in the engine header; bands unsourced | Both the deficit rule and the severity bands need a source and sign-off. |
| Light's criteria (`lightsCriteria`) | exudate if protein ratio > 0.5, LDH ratio > 0.6, or pleural LDH > ⅔ of the serum upper limit | Light et al. 1972 | The input ranges and the inclusion of the third criterion's reference range per laboratory are the reviewer's. |
| STOP-Bang (`stopBang`) | eight items, 1 point each; BMI > 35, age > 50, neck > 40 cm, male; 0–2 low, 3–4 intermediate, 5–8 high | Chung et al. 2008 | A single neck cut-off is used for both sexes (variants exist; not verified here). Intermediate-risk refinements are not modelled. |
| Centor/McIsaac (`centorMcIsaac`) | four criteria + age (< 15: +1; 15–44: 0; ≥ 45: −1); five risk labels | Centor 1981; McIsaac 1998 | The "< 15" rule also gives +1 to ages 0–2; as I recall the published adjustment targets children from 3 years (not verified here). The percentage ranges in the labels carry no citation. |

## Next tranche (not yet covered)

`graceScore`, `charlson`, `findrisc`, `paradise`, `bloodGas`, `fluidElectrolytes`, `fluidBalance`, `pediatricDka`, `pedsDose` (arithmetic; its overflow fix is a separate PR), `hydrationTarget`,
`autophagyTiming`, and the input-contract engines. `egfr-ckd-epi-2021` has a point-wise test only; `child-pugh`, `meld-na`, `sofa-score` are re-derived independently in tranche 2.
