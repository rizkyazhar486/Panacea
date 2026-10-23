# Calculator mutation sweep (ENG-C6-01 evidence)

**What this is.** For every numeric literal in each of the 47 registry engines under `src/domains/clinical-calculators/engine/`, the sweep replaces the literal with `value + 1` (an off-by-one coefficient) and runs the independent-reference suites that invoke that engine (`scripts/uji/calculator-independent-reference*.mts`). A mutant is **killed** only when a suite fails with an `AssertionError`. A failure of any other kind (syntax error, thrown `TypeError`, timeout) is counted as **crashed** and is *not* credited as detection. A **survivor** is a literal the reference suites cannot see.

**Reproduce** (from the repository root, after `npm ci`):

```
OUT=sweep.json node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/qa/calculator-mutation-sweep.mts
```

`ENGINES=a,b` limits the engines. The tool restores every engine file on exit; a clean `git status` afterwards is the check. It is deliberately **not** part of `npm run build` or CI (about ten minutes).

## Result on main `e5d3c9f1` (git tree `94f692bf2d67ce20abb730042f0552fffd2993d2`)

| Engines | Mutants | Killed (assertion) | Crashed | Survived |
|---|---|---|---|---|
| 47 | 1054 | 909 (86%) | 17 | 128 (12%) |

Every one of the 47 engines is invoked by at least one reference suite (CI line `calculator-reference-coverage: 47/47 engines invoked by 11 independent reference suites`, validate job 120549725081).

### What the 128 survivors are

| Kind | Survivors | Engines | Meaning |
|---|---|---|---|
| Input-range limit (`min: 40, max: 300`) | 94 | 27 | The references do not pin the exact accepted limit. This is the out-of-range class of **ENG-C6-02**. |
| Type-level literal (`type CpLevel = 1 \| 2 \| 3`) | 11 | 3 | Erased at compile time: equivalent mutants, harmless. |
| Display rounding (`toFixed(2)`) | 3 | 1 | Output formatting only. |
| Other (interpretation cut-offs, clamps, guards) | 20 | 14 | Includes real boundary gaps listed below; a few are equivalent (`+ 0`, `?? 0`). Read one by one. |

### Boundary gaps worth fixing first (survivors that change a clinical label or score)

- `graceScore`: risk-band cut-offs `score <= 108` and `score <= 140` are not pinned (a score of 109 could be labelled Low risk and no suite fails).
- `meldNa`: the score is clamped with `Math.min(Math.max(raw, 6), 40)`; the 6 and 40 are not pinned.
- `news2`: the `total >= 1` Low-medium risk band edge is not pinned.
- `meanArterialPressure`: the interpretation cut-offs `map < 60` and `map <= 100` are not pinned.
- `pediatricDka`: the `Math.max(0, ...)` floor on net fluid after bolus is not pinned.
- `meldNa`: the sodium correction is applied only when `meld > 11`; the 11 is a formula condition, not a coefficient, and it is not pinned.
- `graceScore`: the upper bound `killip <= 3` of input validation is not pinned.
- `sleepDebt`: the date pattern `(0[1-9]|1[0-2])` for months is not pinned; mutating the `1` of `1[0-2]` survives, so months 10 to 12 are not exercised by any reference case.
- `charlson`: the tone threshold `survival10y >= 50` (display tone, not the score) is not pinned.

## What this does and does not show

- **Shows:** the arithmetic coefficients of the formulas are guarded: the survivors were read one by one and none is a multiplicative or additive coefficient (for example MELD-Na `1.32`, `0.033` and `137` were all killed). One formula *condition* survives (`meldNa` `meld > 11`, listed above), so formula structure is not fully pinned.
- **Does not show:** that the references pin validation limits, interpretation cut-offs or clamps (the survivors above), or that any engine is clinically correct. `clinically_reviewed` stays `false` for every engine and nothing here is a clinical validation.
- **Limits of the method:** one mutation per literal (`+1`), no mutation of operators or control flow; a survivor may be an equivalent mutant; the 17 crashed mutants fail a suite but not with an assertion, so they are reported, not credited.

## Per-engine results

| Engine | Suites | Mutants | Killed | Crashed | Survived |
|---|---|---|---|---|---|
| aaGradient | 1 | 16 | 6 | 3 | 7 |
| autophagyTiming | 1 | 12 | 12 | 0 | 0 |
| bloodDonationScreen | 1 | 19 | 18 | 0 | 1 |
| bloodGas | 1 | 33 | 27 | 0 | 6 |
| caffeineSleep | 1 | 38 | 36 | 1 | 1 |
| centor | 1 | 11 | 10 | 1 | 0 |
| charlson | 1 | 36 | 35 | 0 | 1 |
| childPugh | 1 | 30 | 24 | 0 | 6 |
| cockcroftGault | 1 | 25 | 21 | 0 | 4 |
| correctedCalcium | 1 | 12 | 10 | 0 | 2 |
| denverAge | 1 | 2 | 2 | 0 | 0 |
| electrolyteCorrection | 2 | 22 | 22 | 0 | 0 |
| fena | 1 | 13 | 8 | 0 | 5 |
| findrisc | 1 | 48 | 42 | 0 | 6 |
| fletcher | 1 | 9 | 9 | 0 | 0 |
| fluidBalance | 1 | 2 | 2 | 0 | 0 |
| fluidElectrolytes | 2 | 54 | 53 | 0 | 1 |
| framinghamInputs | 1 | 9 | 8 | 1 | 0 |
| glasgowBlatchford | 1 | 46 | 43 | 0 | 3 |
| graceScore | 1 | 78 | 70 | 0 | 8 |
| hollidaySegar | 1 | 12 | 10 | 0 | 2 |
| hydrationTarget | 1 | 19 | 18 | 0 | 1 |
| idealBodyWeight | 1 | 14 | 12 | 1 | 1 |
| ivDrip | 1 | 8 | 6 | 0 | 2 |
| ldlFriedewald | 1 | 17 | 12 | 0 | 5 |
| lightsCriteria | 1 | 18 | 5 | 3 | 10 |
| maddreyScore | 1 | 10 | 10 | 0 | 0 |
| mcdonaldRule | 1 | 2 | 2 | 0 | 0 |
| meanArterialPressure | 1 | 8 | 2 | 0 | 6 |
| meldNa | 1 | 34 | 27 | 0 | 7 |
| midParentalHeight | 1 | 7 | 6 | 0 | 1 |
| naegele | 1 | 21 | 20 | 0 | 1 |
| news2 | 1 | 66 | 59 | 0 | 7 |
| packYearScreen | 1 | 16 | 15 | 0 | 1 |
| paradise | 1 | 8 | 8 | 0 | 0 |
| parkland | 1 | 9 | 6 | 2 | 1 |
| pediatricDka | 1 | 26 | 21 | 1 | 4 |
| pedsDose | 1 | 6 | 6 | 0 | 0 |
| qtc | 1 | 20 | 17 | 0 | 3 |
| riskScreens | 1 | 30 | 29 | 0 | 1 |
| serumOsmolality | 1 | 22 | 12 | 4 | 6 |
| sirirajStrokeScore | 1 | 19 | 19 | 0 | 0 |
| sleepDebt | 1 | 25 | 24 | 0 | 1 |
| sofaScore | 1 | 67 | 58 | 0 | 9 |
| stopBang | 1 | 21 | 18 | 0 | 3 |
| waistToHeight | 1 | 6 | 4 | 0 | 2 |
| widmarkBac | 1 | 28 | 25 | 0 | 3 |
