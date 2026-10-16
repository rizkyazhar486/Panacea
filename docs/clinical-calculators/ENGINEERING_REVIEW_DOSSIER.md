# Clinical calculators — automated engineering-review dossier (tranches 1–10)

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

Baseline: `origin/main` at `6a093511`. Suites (all run inside `npm run uji`): `scripts/uji/calculator-independent-reference.mts` (tranche 1), `scripts/uji/calculator-independent-reference-2.mts` (tranche 2), `scripts/uji/calculator-independent-reference-3.mts` (tranche 3) and `scripts/uji/calculator-independent-reference-4.mts` (tranche 4), `scripts/uji/calculator-independent-reference-5.mts` (tranche 5), `scripts/uji/calculator-independent-reference-6.mts` (tranche 6), `scripts/uji/calculator-independent-reference-7.mts` (tranche 7), `scripts/uji/calculator-independent-reference-8.mts` (tranche 8), `scripts/uji/calculator-independent-reference-9.mts` (tranche 9), `scripts/uji/calculator-independent-reference-10.mts` (tranche 10); shared helpers in `scripts/uji/support/calculatorHarness.mts`.

> **Status update, 2026-10-17 (owner decision):** formal clinical review is out of scope for Alpha and moved to the Clinical Validation phase (`docs/alpha/CLINICAL_REVIEW_DEFERRAL.md`). Everything below is preserved as written: it remains engineering evidence, not clinical approval, and the reviewer-only items stay open for that phase.

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

## Tranche 4 — comorbidity, criteria, screening, acid-base, fluids and paediatric DKA (suite: `scripts/uji/calculator-independent-reference-4.mts`)

Six engines compared with independently written references: all 2,000 Paradise combinations, every Charlson condition alone and every exclusive pair, FINDRISC at every point boundary, 1,200 seeded blood-gas
cases, fluid-balance sums, and 800 seeded paediatric-DKA cases, plus exact boundaries and hostile inputs. About 95 source mutants fail by name; four survivors were analysed and are equivalent
(two Charlson tone cut-offs that no integer score can hit exactly; a FINDRISC sex branch that only differs for values rejected earlier; a `Math.max(0, …)` in the DKA net volume that the allowed ranges make
unreachable, since the bolus is at most 20 mL/kg while the 48 h requirement is at least about 68 mL/kg). Result: **no discrepancy**.

| Calculator (engine) | Form checked | Citation recorded in the engine | Items only a qualified reviewer can settle |
| --- | --- | --- | --- |
| Charlson index (`charlsonIndex`) | 19 weighted conditions (1/2/3/6), exclusive pairs (plain vs organ-damage diabetes, mild vs severe liver disease, non-metastatic vs metastatic tumour), age points 50–59: 1, 60–69: 2, 70–79: 3, ≥ 80: 4, 10-year survival 0.983^exp(0.9 × score) | Charlson et al. 1987 | The age points come from a later publication than the one cited in the engine (as I recall; not verified here). The survival formula is population-level and its tone cut-offs (90 % / 50 %) are unsourced. |
| Paradise criteria (`paradiseCriteria`) | ≥ 7 episodes in 1 year, or ≥ 5 a year for 2 years, or ≥ 3 a year for 3 years, with every episode documented | Paradise et al. 1984 | The engine takes a single yes/no for "every episode documented"; as I recall, the published criteria also specify clinical features of each episode, which are not checked here. It states whether criteria are met, not a surgical indication. |
| FINDRISC (`findrisc`) | Age, BMI, waist (by sex), activity, vegetables/fruit, antihypertensive use, high glucose history, family history; total 0–26; risk bands < 7 / 7–11 / 12–14 / 15–20 / > 20 | Lindström & Tuomilehto 2003 | Non-integer ages are accepted, so 54.5 years falls in the 55–64 band (the published table uses whole years). |
| Blood-gas interpretation (`interpretAbg`) | pH 7.35–7.45, PaCO₂ 35–45, HCO₃ 22–26; Winter's expected PaCO₂ = 1.5 × HCO₃ + 8 ± 2; anion gap = Na − (Cl + HCO₃) with +2.5 per g/dL albumin below 4; delta ratio = (gap − 12) / (24 − HCO₃) | none recorded | The anion-gap upper limit (> 12) and the delta-ratio bands vary between teaching sources; the engine treats 0.4–2 as "pure high-gap", while many sources separate 0.4–0.8 and 0.8–2. Compensation is assessed only for metabolic acidosis. The engine states it does not check pH/PaCO₂/HCO₃ consistency. |
| Fluid balance (`fluidBalance`) | total in − total out over seven components, each 0–20,000 mL | none (arithmetic) | **A blank component is read as 0 mL by design**, so an unmeasured urine output counts as zero output and the balance looks more positive. Whether blank should instead block the result is a clinical-design decision (and relates to C2). |
| Paediatric DKA worksheet (`pediatricDka`) | Bolus 10 mL/kg (20 with shock); deficit = % × kg × 1000; maintenance = Holliday-Segar × 2 (48 h); rate = (deficit + maintenance − bolus) / 48; insulin = U/kg/h × kg; potassium bands at 3.5 and 5.5 mEq/L | none recorded | The fluid protocol, the potassium-band advice text and the insulin range (0.01–0.1 U/kg/h) are protocol content with no citation; the engine itself calls the tool educational and not a validated protocol. Each part is computed only from its own valid inputs. |

## Tranche 5 — hydration target, sleep debt and pack-year screening (suite: `scripts/uji/calculator-independent-reference-5.mts`)

Method as above: independently written oracles, seeded sampling (2 × 400 + 800 cases), every switch combination, exact boundaries, hostile-input matrices, range tables re-asserted as literals, and source mutants on every constant, boundary and branch of the three engines (each fails by name; four first-run survivors were closed by hard-coding the range literals and adding a coercing-date case; one, `&& cigsPerDay > 0` in `packYearScreen`, is equivalent because 0 cigarettes can never reach 20 pack-years). Result: **no discrepancy**; no engine defect found.

| Calculator (engine) | Form checked | Citation recorded in the engine | Items only a qualified reviewer can settle |
| --- | --- | --- | --- |
| Daily fluid target (`hydrationTarget`) | 33 mL/kg + (minutes/60) × {400, 600, 800} + hot climate 500 + pregnancy 300 + breastfeeding 700; glasses = round(total/250) | none (population averages) | The per-kg figure, exercise rates and add-ons are unsourced population averages; pregnancy and breastfeeding stack (the page does not treat them as exclusive); organ-limited fluid restriction is a clinician matter. |
| 14-night sleep debt (`sleepDebt`, `sanitizeNights`) | Σ(need − slept) over the first 14 nights; ≤ 2 h well-rested, ≤ 8 h mild, else significant | none | The 2 h and 8 h cut-offs are unsourced. Oversleeping yields negative debt (formula does not clamp at 0). **No recorded nights reads as "no debt", not "unknown".** `sanitizeNights` checks only the date shape, so `2026-02-31` is accepted. |
| Pack-years and lung-screening eligibility (`packYearScreen`) | (cigarettes/day ÷ 20) × years; USPSTF 2021: age 50–80, ≥ 20 pack-years, quit ≤ 15 years, 0 cigarettes never eligible | USPSTF 2021 (as recorded in the engine) | Fractional ages: 49.5 and 80.5 are ineligible (inclusive integer cut-offs). Whether `quitYearsAgo = 0` (still smoking) should be entered explicitly is a UX decision already made in the engine. |

## Tranche 6 — fluids & electrolytes and the glycogen-timing heuristic (suite: `scripts/uji/calculator-independent-reference-6.mts`)

Method as above (400 seeded cases per formula, worked cases, breakpoints at 10/20 kg, exact boundaries, hostile matrices, range tables re-asserted as literals, source mutants on every constant, branch and range). Every mutant fails by name; one, `w <= 10` → `w < 10` in the sodium maintenance formula, is equivalent because the piecewise formula is continuous at 10 kg. Result: **no discrepancy** between the engines and the independently written references; no engine change.

| Calculator (engine) | Form checked | Citation recorded in the engine | Items only a qualified reviewer can settle |
| --- | --- | --- | --- |
| Maintenance fluid (`maintenanceFluid`) | Holliday-Segar 100/50/20 mL/kg/day; Na 3/2/1 and K 2/1/0.5 mEq/kg by weight band | Holliday-Segar (as recorded) | The electrolyte per-kg tiers are unsourced in the engine. |
| Resuscitation (`resuscitation`) | Adult sepsis 30 mL/kg, paediatric shock 20 mL/kg, burns 4 × kg × %TBSA with half in the first 8 h; TBSA is ignored outside burns | none beyond the formula names | Fixed volumes are population defaults, not prescriptions; Parkland vs other burn formulas; adult-sepsis 30 mL/kg guidance changes over time. |
| Corrected sodium (`correctedSodium`) | Na + 1.6 × (glucose − 100)/100 (Katz) | Katz (as recorded) | The 1.6 factor vs 2.4 (Hillier) is a choice; low glucose lowers the corrected value (no clamp). |
| Sodium correction rate (`naCorrectionRate`) | TBW = kg × 0.6 (M) / 0.5 (F); ΔNa/L = (140 − Na)/(TBW + 1); litres for +10 mEq/L | simplified Adrogué-Madias | **Behaviour findings, unchanged:** current Na = 140 reports "0 litres"; Na > 140 reports a negative litre figure (the formula assumes a 140 infusate, which the page text contradicts for 0.9 % NaCl = 154). Only M/F are accepted. The 10 mEq/L figure is a goal, not a safe-rate limit. |
| Potassium deficit (`potassiumDeficit`) | (4.0 − K) × kg × 0.3 to 0.6, never negative | none | The 0.3–0.6 factors and the 4.0 target are unsourced; serum K poorly predicts total deficit. |
| Glycogen-depletion timing (`autophagyTiming`) | remaining = max(0, 14 − (1 − fat%/100) × 2 − hours since meal); started when ≤ 0 | none (illustrative heuristic) | The whole heuristic is unsourced and is not a measurement of autophagy; it must stay labelled illustrative. |

## Tranche 7 — Maddrey, Siriraj, Fletcher and Denver age (suite: `scripts/uji/calculator-independent-reference-7.mts`)

References use integer arithmetic (tenths/hundredths) so exact boundaries do not depend on float rounding; exhaustive boundary grids (793 exact-DF-32 combinations; every Siriraj feature combination × 361 half-step diastolic pressures; 2.2 M Fletcher grid points in a one-off probe), seeded sampling, hostile matrices, range tables re-asserted as literals, and ~40 source mutants (each fails by name; one, the `typeof` guard in Siriraj's `oneOf`, is equivalent because `includes` is strict).

**One engine defect found and fixed (`maddreyScore`).** A discriminant function of exactly 32 was reported "not severe" whenever float arithmetic landed just below it: PT 15.5 s vs control 10 s with bilirubin 6.7 mg/dL gives 4.6 × 5.5 + 6.7 = 32 but computes as 31.999999999999996. 129 of the 793 exact-boundary combinations with a positive PT difference were misclassified, understating severity at the published threshold (DF ≥ 32). The fix rounds DF to 1e-6 before comparing; the displayed `df` is unchanged. The regression test fails on the unfixed engine.

| Calculator (engine) | Form checked | Citation recorded in the engine | Items only a qualified reviewer can settle |
| --- | --- | --- | --- |
| Maddrey discriminant function (`maddreyScore`) | DF = 4.6 × (patient PT − control PT) + total bilirubin; severe when DF ≥ 32 | Maddrey 1978 | A patient PT shorter than control is accepted (negative difference), as before; range limits are input-sanity bounds. Corticosteroid decisions stay with the clinician. |
| Siriraj stroke score (`sirirajStrokeScore`) | 2.5 × consciousness + 2 × vomiting + 2 × headache + 0.1 × diastolic − 3 × atheroma − 12; > +1 haemorrhagic, < −1 ischaemic, else indeterminate | Poungvarin et al., BMJ 1991 | Not a substitute for imaging (labelled so). Exactly ±1 is indeterminate (rule is strict). |
| Fletcher index (`fletcherIndex`) | Mean of 500/1000/2000 Hz (basic) or + 3000 Hz (complete); cut-offs < 26 / 41 / 56 / 71 / 91 dB | AAO-HNS-style bands as recorded | The mean is classified unrounded (25.67 dB is "Normal"); some references round to whole dB first. In basic mode the 3000 Hz field is ignored. |
| Denver II age check (`validateDenverAge`) | 0–72 months | none | Only the age range is validated here; the milestone list is not part of this engine. |

## Tranche 8 — caffeine at bedtime and blood-donation pre-screening (suite: `scripts/uji/calculator-independent-reference-8.mts`)

Integer-arithmetic references for the caffeine bands (minutes × 10 against half-life × 10 tenths) and for the 12-week interval (checked to the millisecond), seeded sampling, hostile matrices, tables re-asserted as literals, and ~50 source mutants (each fails by name; three first-run survivors were closed by tests for a donation dated exactly "now", for a passed 12-week mark at 10:00 never reporting −0 days, and for the hour regex).

**One engine defect found and fixed (`caffeineBand`).** At exactly two or three half-lives to bedtime the remaining fraction is 25 % or 12.5 % by definition, but `0.5^(h / half-life)` can land just above (e.g. 25.000000000000007 or 12.500000000000004) and was classified into the next-worse band: 1,224 of 6,318 exact-boundary cases (e.g. half-life 1.6 h, 3.2 h to bed). The fix rounds the percentage to 1e-9 before comparing; reported values are unchanged. The regression test fails on the unfixed engine.

| Calculator (engine) | Form checked | Citation recorded in the engine | Items only a qualified reviewer can settle |
| --- | --- | --- | --- |
| Caffeine at bedtime (`caffeineAtBedtime`, `caffeineBand`) | remaining = dose × 0.5^(hours / half-life); bands > 25 % high, > 12.5 % near, else low; 3 half-lives to ~12.5 %; drink table 95/63/47/28/80/34 mg | none beyond the table | The drink contents, the 25 % / 12.5 % bands and the 1.5–9.5 h half-life range are unsourced; **consumed time equal to bedtime reads as 0 h (full dose), not 24 h**; `hoursTo12pct` is 12.5 %, not 12 %; blank servings or custom mg read as 0 mg by documented design ("did not drink"); this is not a safe-intake limit. |
| Blood-donation pre-screening (`bloodDonationScreen`) | age 17–65, weight ≥ 50 kg, 12 weeks since last donation, four deferral flags; last-donation date validated (calendar-real, not in the future) | generic national/WHO/PMI criteria as recorded | The age/weight limits and the 12-week interval vary by service and sex; this is not on-site screening (haemoglobin and interview remain with the blood bank). A donation dated today is accepted and not eligible. |

## Tranche 9 — FIB-4, OST, risk-screen gates and the newborn/growth/Framingham input validators (suite: `scripts/uji/calculator-independent-reference-9.mts`)

References: FIB-4 against the formula and band table (400 seeded cases plus exact band boundaries); OST against an integer reference (tenths of kg, 20,000 cases; a 391,503-point one-off probe found 0 mismatches); every validator under hostile-input matrices with range tables re-asserted as literals; 50 source mutants, each fails by name. Result: **no discrepancy and no engine change.**

**Not verified here:** the Framingham General CVD model itself. `cvdRisk` delegates to `framinghamCVD` in `lib/riskModels` (D'Agostino 2008 coefficients); this tranche tests only its input gates, the HDL < total-cholesterol rule, band wiring and monotone sanity (age, risk factors, HDL). Re-deriving the coefficients needs the primary source, as for `graceScore`.

| Calculator (engine) | Form checked | Citation recorded in the engine | Items only a qualified reviewer can settle |
| --- | --- | --- | --- |
| FIB-4 (`fib4`, `fib4Band`) | age × AST / (platelets × √ALT), rounded to 2 dp; < 1.3 (age ≥ 65: < 2.0) low, ≤ 2.67 indeterminate, else high | Sterling 2006; age-adjusted cut-off as recorded | **The value is rounded to 2 dp before banding**, so an unrounded 1.2997 is shown as 1.30 and banded "Indeterminate" (the band follows the displayed value). The 65-year cut-over and the 2.0 cut-off are as recorded; the algorithm is not for general-population screening. |
| OST (`ostIndex`, `ostBand`) | trunc(0.2 × (kg − age)); > −1 lower, −1…−4 moderate, < −4 higher | Koh 2001 | A small negative difference truncates to −0 (equal to 0; prints "0"). Applicability by sex and ethnicity is a clinical matter. |
| Framingham CVD gates (`cvdRisk`) | age 18–120 gate, sex M/F, three yes/no flags, HDL < total cholesterol | D'Agostino 2008 | **Model coefficients not re-derived** (see above); the page's 30–74 validation population remains a page note while `cvdRisk` accepts 18–120. |
| Newborn inputs (`validateBallardInputs`) | birth weight 200–8000 g; Apgar 1 and 5 min whole numbers 0–10 (0 is legitimate) | scale definition | The Ballard→gestational-age table and Lubchenco percentiles are not in this engine. |
| Growth inputs (`validateWhoGrowthInputs`, `validateNeonateInputs`, `validateCdcInputs`, `parseWhoVisit`) | age/weight/length ranges for WHO 0–60 months, neonate 0–30 days, CDC 2–20 years | as recorded | Weight/height ranges are input-sanity bounds. `parseWhoVisit` uses `Number()`, so a typed `0x10` reads as 16 (not typeable in a number input). Reference tables and z-scores are not in this engine. |
| Framingham what-if inputs (`validateFraminghamInput`) | age 30–74, total cholesterol 100–500, HDL 10–150, SBP 70–300; NaN = "required" | D'Agostino 2008 derivation range | The 30–74 age range follows the derivation population; the ranges for cholesterol/HDL/SBP are input-sanity bounds. |

## Tranche 10 — Katz sodium, potassium assessment, McDonald rule, zone-2 heart rate, grip validation, parseNumberField (suite: `scripts/uji/calculator-independent-reference-10.mts`)

Independent references (zone-2 rounding against integer arithmetic in tenths of a year, 901 ages; potassium severity over every 0.1 mEq/L from 1.0 to 10.0 plus exact boundaries), hostile matrices, range tables re-asserted as literals, 33 source mutants each failing by name. Result: **no engine discrepancy and no engine change.**

**Two cross-engine inconsistencies recorded for the reviewer (characterized in the test, deliberately not changed):**

1. *Corrected sodium exists twice.* `correctedSodiumKatz` (`electrolyteCorrection`) clamps the glucose term at 0 (glucose < 100 mg/dL gives no correction; Na range 80–200), while `fluidElectrolytes.correctedSodium` applies it unclamped (Na 140, glucose 20 → 138.72; Na range 90–200).
2. *Potassium deficit exists twice.* `potassiumAssessment` reports a fixed 200–400 mEq per 1 mEq/L below 4.0 (K 3.0 → 200–400 mEq), while `fluidElectrolytes.potassiumDeficit` is weight-based 0.3–0.6 mEq/kg per mEq/L (K 3.0, 70 kg → 21–42 mEq). They differ by an order of magnitude; which is intended is a clinical decision.

| Calculator (engine) | Form checked | Citation recorded in the engine | Items only a qualified reviewer can settle |
| --- | --- | --- | --- |
| Katz corrected sodium (`correctedSodiumKatz`) | Na + 1.6 × max(0, (glucose − 100)/100) | Katz 1973 | The two cross-engine differences above; 1.6 vs 2.4 factor. |
| Potassium assessment (`potassiumAssessment`) | severity < 2.5 or > 6.5 severe, < 3.0 or > 6.0 moderate, < 3.5 or > 5.5 mild; deficit 200–400 mEq per mEq/L below 4.0 | Sterns rule of thumb as recorded | Band cut-offs and the deficit rule are unsourced here; the second deficit estimate above. |
| McDonald rule (`mcdonaldGestationalAge`) | fundal height (cm) ≈ weeks, 20–36 cm only | page text | Single-fetus, normal-growth assumption; no estimate outside 20–36 cm. |
| Zone-2 heart rate (`zone2HeartRate`) | Tanaka HRmax = 208 − 0.7 × age; zone 60–70 % rounded | Tanaka 2001; ACSM | 60–70 % as zone 2 is a training convention, not a physiological measurement. |
| Grip strength gate (`validateGripKg`) | 1–100 kg, must be typed | none | Range is input sanity only. |
| `parseNumberField` | blank/whitespace/non-string → NaN; otherwise `Number()` | — | `Number()` accepts hex text (`0x10` = 16), infinities pass to the range gate. |

## Next tranche (not yet covered)

`graceScore` (points table too large to transcribe without the primary source), and `reviewRegistry` (a registry, not a formula). `egfr-ckd-epi-2021` has a point-wise test only.
