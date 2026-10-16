# C2 semantic audit — "unknown is not zero" beyond the regex ratchet

Status: **C2 remains REPORTED.** This document does not change the ledger, the baseline file or the original detector. It records what the
independent scan found, what was fixed, and what is still open, so the count of zero from the regex ratchet is not mistaken for coverage.

Baseline: `origin/main` at `4305008e`; 1,854 source files under `src/` (`.ts` and `.tsx`, tests and declarations excluded).

## Why the regex count is not enough

`scripts/uji/angka-kosong-ratchet.mts` (unchanged) counts `(Number|parseFloat|parseInt)([^()]*) || 0` in `src/**/*.tsx` only. It therefore cannot see:

| Blind spot | Example that was live on `main` |
| --- | --- |
| `.ts` files (not scanned) | `src/lib/ringkasan.ts`: `kkal += Number(f.kcal) \|\| 0`, `protein += …`, `menit += Number(s.menit) \|\| 0` |
| Nested parentheses (`[^()]*`) | `UbinPangan.tsx`: `Number(gram.replace(',', '.')) \|\| 0` |
| The fallback inside the call | `MovementToolkit.tsx`: `Number(localStorage.getItem(K) \|\| 0)` shown as "Best: 0s" |
| Unary plus | `FitnessTest.tsx`: `+e.target.value \|\| 0`; `Nutrition.tsx`: `+i.kcal \|\| 0` on AI output |

## What was added

`scripts/uji/angka-kosong-semantik.mts` (runs in `npm run uji`) scans every `.ts`/`.tsx` under `src/` with a small lexer that ignores comments, strings,
template text and regex literals but still reads code inside `${}`. It understands nested parentheses and flags `Number|parseFloat|parseInt(...) || 0`,
`Number|parseFloat|parseInt(... || 0)` / `(... ?? 0)` and unary `+x || 0`. It proves itself with 13 positive and 21 negative control fixtures, requires more than 1,500 files
to be read, and gates at **zero** except:

- **`DAFTAR_IZIN`** — six reasoned sentinels or counters (last-sent timestamp, sit start time, share counter ×2, optional timezone regex groups, scripture metadata count). Each entry must still match, or the test fails.
- **`UTANG`** — recorded debt that may only fall. It is now empty.

The original detector was not touched; this scanner only adds coverage.

## Findings and disposition (13)

| Site | Classification | Disposition |
| --- | --- | --- |
| `src/lib/ringkasan.ts` calories, protein | Defect: missing value counted as 0, then sent to the server as a complete daily total (notification rules such as "protein only 40 g at 5 pm" read it) | **Fixed**: `dailyIntakeTotals` sends a total only when every record has a valid value; an explicit 0 stays 0 |
| `src/lib/ringkasan.ts` focus minutes | Same class | **Fixed**: `focusMinutesOn` |
| `src/lib/ringkasan.ts` last-sent timestamp | Sentinel (0 = never sent) | Allowed |
| `src/components/tiles/UbinPangan.tsx` grams | Defect: blank grams silently became a **1 g** food, contradicting the tile's own "never guesses a serving size" | **Fixed**: `parsePortionGrams`; Log is disabled with a hint; out-of-range is rejected, not clamped |
| `UbinPangan.tsx` calories per 100 g | Defect: a product with no calorie data was logged as 0 kcal and listed as "0 kkal/100 g" | **Fixed**: logging is blocked and the list shows "—" |
| `src/pages/bodyhub/Nutrition.tsx` (AI photo, ×4 fields) | Defect: missing kcal/macros became 0 and a missing portion was **invented as 100 g** | **Fixed**: `parseDetectedFoods` skips incomplete items and reports how many |
| `src/pages/fitness/FitnessTest.tsx` | Defect: state started at 0 and showed "Total 0/100 — Needs Improvement" before anything was entered; untested items dragged the total | **Fixed**: `ringkasTes`; no total or verdict until all four items are entered; a typed 0 is a real 0 |
| `src/pages/fitness/MovementToolkit.tsx` balance best | Defect: never-recorded best displayed as "Best: 0s" beside the "under ~10 s … mention to a clinician" text | **Fixed** (null = unknown, shown "—") |
| `src/pages/mental/MindToolkit.tsx` reaction best | Same pattern (display was guarded; sentinel removed) | **Fixed** |
| `src/components/tiles/UbinLanjutan.tsx` sit start time | Sentinel with fallback | Allowed |
| `src/components/dashboard/PanaceaGrowthWidgets.tsx` share counter | True counter (0 shares is a real 0) | Allowed |
| `src/domains/clinical-operations/model/poliPatientFlow.ts` | Optional regex groups used only for a range check; the time comes from `Date.parse` of a zone-required timestamp | Allowed |
| `src/lib/hadis.ts` | Scripture metadata count with a `list.length` fallback; not a user measurement | Allowed |
| `src/pages/finance/MoneyHub.tsx` ×4 | Debt form: a blank interest rate became **0 % a year** and a blank minimum payment became 0, silently reshaping the payoff plan (defect, non-clinical). Emergency-fund and risk tabs already hid their results unless both values were above 0, so a blank gave no false verdict, but an entered 0 savings gave no verdict either (a real zero was indistinguishable from blank). An earlier version of this note wrongly said blanks produced "No buffer yet". | **Fixed**: `parseMoney` / `parseRatePct`; the debt form refuses a blank rate or minimum payment (a typed 0 is accepted); an entered 0 in savings now shows "No buffer yet" |

## Still open (not claimed fixed)

1. **Macronutrients in `FoodEntry`**: `carbs`, `protein` and `fat` are required numbers, so a product lacking one of them is still stored as 0 (`UbinPangan` keeps `?? 0` for these, with a comment). Representing "unknown" needs a type change and migration.
2. **Measurement sums written with `??`**, not flagged by the gate: 433 `?? 0` and 53 `|| 0` in code, of which 65 sit in `reduce`/`+=` and 79 touch measurement-named fields (`kcal`, `protein`, `durasi`, `jarakKm`, `menit`, `maxHr`, `avgHr`). Many are legitimate Map counters (`(m.get(k) ?? 0) + 1`). **Fixed so far**: today's calories, protein, carbohydrate and fat in the home intake tile, the seven-day calorie chart and its "usually" median, and the clinical card's "Calories in" / "Energy balance" (these now use complete-only totals, and the card also stops comparing local food dates with a UTC day). **Still to classify**: workout-duration, distance and heart-rate sums in `ActivityAchievementWidget`, `UbinLangsung`, `analisisLari`, `athlytic`, and `AdvancedPerformanceCockpit`, using `loggedSubtotal` as the established primitive.
2a. **Training duration sums (partly fixed)**: `analisisLari.volumeMingguan` (`menit`) and the 7-day training tile (`UbinLatihan` minutes, pace and per-day bars) use `workoutDurationSeconds`; unknown duration is `null`, a real zero stays 0 (`weeklyTraining.ts`, `qa/training-duration-check.mjs`). `ActivityAchievementWidget` milestones keep `?? 0`: they only count toward unlocking, so an unknown duration can understate progress but never unlock a milestone. The Training Physiology page now excludes sessions with unknown duration from load/recovery maths and reports the count (`trainingPhysiologySessions.ts`, `qa/physiology-duration-check.mjs`). `analisisPro.ts` (`durasiDetik: w.durasi`) is left to #2551; `AdvancedPerformanceCockpit` only filters on `> 0` (exclusion, not summation) and `athlytic` consumes `analisisPro` sessions, so it inherits that fix.
3. **43 NaN/non-finite ternaries to 0** (`Number.isFinite(x) ? x : 0`), not yet classified.
4. Replay, dashboard performance deck, training-session cockpit and `analisisPro` are covered by other in-flight work (#2548–#2551) and were deliberately not touched here.
5. Persisted historical data written by older versions cannot be re-labelled: values stored as 0 before these fixes are indistinguishable from real zeros.

`docs/clinical-calculators/C2_REMAINING_INPUT_DEBT.md` is an older snapshot (12 patterns at `0315d859`) and is superseded by this record for the items above.

## Reproduce

```
node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/angka-kosong-semantik.mts
node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/angka-kosong-perbaikan.mts
npx vite build && npx vite preview --port 5199 &
PLAYWRIGHT_MODULE=<path to playwright> QA_URL=http://localhost:5199/ node qa/missing-values-check.mjs
```
