# Calculator mutation sweep (ENG-C6-01 and ENG-C6-02 evidence)

**What this is.** For every numeric literal in each of the 47 registry engines under `src/domains/clinical-calculators/engine/`, the sweep replaces the literal with `value + 1` (an off-by-one coefficient) and runs the independent-reference suites that exercise that engine (`scripts/uji/calculator-independent-reference*.mts`). A mutant is **killed** only when a suite fails with an `AssertionError`. A failure of any other kind (syntax error, thrown `TypeError`, timeout) is counted as **crashed** and is *not* credited as detection. A **survivor** is a literal the reference suites cannot see.

A suite counts for an engine when it calls one of that engine's exported functions, or when it declares `sweep:all-engines` in its first 25 lines (suite 13, which pins every exported range table by importing the package index).

**Reproduce** (from the repository root, after `npm ci`):

```
OUT=sweep.json node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/qa/calculator-mutation-sweep.mts
```

`ENGINES=a,b` limits the engines. The tool restores every engine file on exit; a clean `git status` afterwards is the check. It is deliberately **not** part of `npm run build` or CI (about ten minutes).

## Two runs on the same 1054 mutants

| Run | Killed (assertion) | Crashed | Survived |
|---|---|---|---|
| 1. before suites 12 to 14 (main `e5d3c9f1`, tree `94f692bf…`) | 909 (86%) | 17 | 128 (12%) |
| 2. after suites 12 to 14 | 1028 (98%) | 2 | 24 (2%) |

| Kind of survivor | Run 1 | Run 2 |
|---|---|---|
| Input-range limit (`min: 40, max: 300`) | 94 | 0 |
| Type-level literal (`type CpLevel = 1 \| 2 \| 3`), erased at compile time | 11 | 11 |
| Display rounding (`toFixed(2)`) | 3 | 3 |
| Other (cut-offs, clamps, guards) | 20 | 10 |

What closed them:

- **Suite 12** pins the cut-offs that change a label or a score: GRACE risk bands (every integer 0 to 400; 108 and 140), the Killip upper bound and the "exactly one blank field" guard; NEWS2 bands for every total 0 to 20 with and without a single red parameter; MAP interpretation cut-offs 60 and 100 and its input ranges; MELD-Na against a separately written reference (the `meld > 11` condition on both sides, the floor value 6.43 and the 40 clamp).
- **Suite 13** pins all 66 exported input-range tables as literals. A new table without a pin, or a stale pin, fails the suite.
- **Suite 14** pins the `cvdRisk` blank-field guard (four fields) and the `sleepDebt` date pattern (months 01 to 12, days 01 to 31, shapes).

Each was sabotaged on the real engines before being trusted (GRACE 108→109, Killip 3→4, blank-field guard, NEWS2 `>= 1`→`>= 2`, MAP 60→61, MELD `> 11`→`> 12`, MELD floor 6→7, `SYSTOLIC max 300`→301, a new unpinned range table, `sleepDebt` month and day patterns); each failed by test name.

## What is left after run 2 (24 survivors)

Type-level literals (11) and display rounding (3, `lightsCriteria`) are not behaviour. The 10 others:

| Survivor | Disposition |
|---|---|
| `bloodDonationScreen` L71 (`0`→`1`) | Equivalent: `+ 0` changes nothing. |
| `caffeineSleep` L84 (`0`→`1`) | Edge: the `totalDoseMg > 0` guard only matters for a total dose between 0 and 1 mg; not pinned. |
| `charlson` L58 (`50`→`51`) | Unreachable: survival is a function of an integer total (4 -> 53.4%, 5 -> 21.4%), so no value falls in 50 to 51. |
| `fluidElectrolytes` L61 (`1`→`2`) | Equivalent: the non-burn placeholder `1` only feeds a range check and any in-range value gives the same result. |
| `hydrationTarget` L46 (`0`→`1`) | Edge: the `r.ml > 0` row filter would only differ for a row with 0 < ml <= 1; not pinned. |
| `meldNa` L63 (`40`→`41`) | Equivalent: at MELD 40 the sodium term `(1.32 - 0.033 x 40)` is exactly zero, so the final clamp can differ only by floating-point noise (about 1e-15). |
| `packYearScreen` L47 (`0`→`1`) | Equivalent: 0 cigarettes per day gives 0 pack-years, already below the minimum, so `cigsPerDay > 0` is redundant. |
| `pediatricDka` L77 (`0`→`1`) | Likely unreachable: the bolus (10 or 20 mL/kg) cannot exceed deficit plus 48 h maintenance for a valid weight; not proven for every input. |
| `riskScreens` L53 (`0`→`1`) | Equivalent: with the guard loosened, `framinghamCVD` returns null for a missing age anyway (defence in depth); checked directly. |
| `widmarkBac` L43 (`0`→`1`) | Edge: the `?? 0` default for a drink label absent from `counts` is not pinned. |

Of the 10: six are equivalent or unreachable (`bloodDonationScreen`, `charlson`, `fluidElectrolytes`, `meldNa`, `packYearScreen`, `riskScreens`); three are small edge guards that remain unpinned (`caffeineSleep`, `hydrationTarget`, `widmarkBac`); `pediatricDka` is likely unreachable but not proven.

## Finding (not fixed, not pinned as correct)

`sleepDebt`'s date pattern checks month 01 to 12 and day 01 to 31 independently, so **calendar-impossible dates are accepted**: `2026-02-30`, `2026-02-31` and `2026-04-31` all pass `sanitizeNights`. The tests pin only the unambiguous cases. Rejecting impossible dates is a behaviour change and belongs in its own change.

## What this does and does not show

- **Shows:** the arithmetic coefficients of the formulas are guarded (MELD-Na `1.32`, `0.033` and `137` were killed in run 1 already), and now also the cut-offs, clamps and input-range limits. No survivor of run 2 is a formula coefficient.
- **Does not show:** that any limit or cut-off is clinically right. The pins freeze the values the engines declare today; `clinically_reviewed` stays `false` for every engine and nothing here is a clinical validation. The range tables are repo-defined sanity bounds, not clinical thresholds (the engine comments say so).
- **Does not cover:** whether the adversarial matrix is exhaustive; it is a separate suite, see `CALCULATOR_ADVERSARIAL_MATRIX.md` (blank, NaN, Infinity, negative, unit text, each with a named rejection, over all 47 engines).
- **Limits of the method:** one mutation per literal (`+1`), no mutation of operators or control flow; a survivor may be an equivalent mutant; crashed mutants fail a suite but not with an assertion, so they are reported, not credited.

## Per-engine results (run 2; the column "Run 1" is survivors before suites 12 to 14)

| Engine | Mutants | Run 1 survived | Killed | Crashed | Survived |
|---|---|---|---|---|---|
| aaGradient | 16 | 7 | 16 | 0 | 0 |
| autophagyTiming | 12 | 0 | 12 | 0 | 0 |
| bloodDonationScreen | 19 | 1 | 18 | 0 | 1 |
| bloodGas | 33 | 6 | 33 | 0 | 0 |
| caffeineSleep | 38 | 1 | 36 | 1 | 1 |
| centor | 11 | 0 | 11 | 0 | 0 |
| charlson | 36 | 1 | 35 | 0 | 1 |
| childPugh | 30 | 6 | 27 | 0 | 3 |
| cockcroftGault | 25 | 4 | 25 | 0 | 0 |
| correctedCalcium | 12 | 2 | 12 | 0 | 0 |
| denverAge | 2 | 0 | 2 | 0 | 0 |
| electrolyteCorrection | 22 | 0 | 22 | 0 | 0 |
| fena | 13 | 5 | 13 | 0 | 0 |
| findrisc | 48 | 6 | 45 | 0 | 3 |
| fletcher | 9 | 0 | 9 | 0 | 0 |
| fluidBalance | 2 | 0 | 2 | 0 | 0 |
| fluidElectrolytes | 54 | 1 | 53 | 0 | 1 |
| framinghamInputs | 9 | 0 | 8 | 1 | 0 |
| glasgowBlatchford | 46 | 3 | 46 | 0 | 0 |
| graceScore | 78 | 8 | 78 | 0 | 0 |
| hollidaySegar | 12 | 2 | 12 | 0 | 0 |
| hydrationTarget | 19 | 1 | 18 | 0 | 1 |
| idealBodyWeight | 14 | 1 | 14 | 0 | 0 |
| ivDrip | 8 | 2 | 8 | 0 | 0 |
| ldlFriedewald | 17 | 5 | 17 | 0 | 0 |
| lightsCriteria | 18 | 10 | 15 | 0 | 3 |
| maddreyScore | 10 | 0 | 10 | 0 | 0 |
| mcdonaldRule | 2 | 0 | 2 | 0 | 0 |
| meanArterialPressure | 8 | 6 | 8 | 0 | 0 |
| meldNa | 34 | 7 | 33 | 0 | 1 |
| midParentalHeight | 7 | 1 | 7 | 0 | 0 |
| naegele | 21 | 1 | 21 | 0 | 0 |
| news2 | 66 | 7 | 66 | 0 | 0 |
| packYearScreen | 16 | 1 | 15 | 0 | 1 |
| paradise | 8 | 0 | 8 | 0 | 0 |
| parkland | 9 | 1 | 9 | 0 | 0 |
| pediatricDka | 26 | 4 | 25 | 0 | 1 |
| pedsDose | 6 | 0 | 6 | 0 | 0 |
| qtc | 20 | 3 | 20 | 0 | 0 |
| riskScreens | 30 | 1 | 29 | 0 | 1 |
| serumOsmolality | 22 | 6 | 22 | 0 | 0 |
| sirirajStrokeScore | 19 | 0 | 19 | 0 | 0 |
| sleepDebt | 25 | 1 | 25 | 0 | 0 |
| sofaScore | 67 | 9 | 62 | 0 | 5 |
| stopBang | 21 | 3 | 21 | 0 | 0 |
| waistToHeight | 6 | 2 | 6 | 0 | 0 |
| widmarkBac | 28 | 3 | 27 | 0 | 1 |
