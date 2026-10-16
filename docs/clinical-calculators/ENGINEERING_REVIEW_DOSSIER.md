# Clinical calculators — automated engineering-review dossier (tranches 1–6)

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

Baseline: `origin/main` at `6a093511`. Suites (all run inside `npm run uji`): `scripts/uji/calculator-independent-reference.mts` (tranche 1), `scripts/uji/calculator-independent-reference-2.mts` (tranche 2), `scripts/uji/calculator-independent-reference-3.mts` (tranche 3) and `scripts/uji/calculator-independent-reference-4.mts` (tranche 4), `scripts/uji/calculator-independent-reference-5.mts` (tranche 5), `scripts/uji/calculator-independent-reference-6.mts` (tranche 6); shared helpers in `scripts/uji/support/calculatorHarness.mts`.

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

## Next tranche (not yet covered)

`graceScore` (points table too large to transcribe without the primary source), `framinghamInputs`, `growthInputs`, `ballardInputs`, `denverAge`, `fletcher`,
`maddreyScore`, `sirirajStrokeScore`, `riskScreens`, `bloodDonationScreen`, `caffeineSleep`, and the input-contract engines. `egfr-ckd-epi-2021` has a point-wise test only.
