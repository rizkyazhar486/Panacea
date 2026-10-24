# Calculator adversarial input matrix (ENG-C6-02)

`scripts/uji/calculator-adversarial-matrix.mts` attacks every engine in `governance/CALCULATOR_REVIEW_REGISTRY.json` (47 engines, 57 adapters, because several engines export more than one calculator and call signatures differ) and runs as part of `npm run uji`.

## What is attacked

For every numeric input of every adapter, using the range table the engine itself declares:

| Class | Value sent |
|---|---|
| nan | `NaN` (what a blank field becomes through `parseNumberField`) |
| blank-undefined | `undefined` |
| blank-empty-string | `''` |
| infinity / -infinity | `±Infinity` |
| negative | `-1` (skipped where negatives are valid, e.g. Fletcher threshold −10 dB HL) |
| below-min / above-max | one step outside the declared bound |
| unit-text | `"70 mg/dL"` (value with a unit attached) |
| numeric-text | `"70"` (right number, wrong type) |

Categorical fields (sex, formula, intensity, Killip, drop factor) are probed with `undefined`, `null`, `''`, an unknown string, a number and `NaN`; yes/no fields with `'yes'`, `1` and `null`.

## What must hold

1. The call is rejected, by `ok:false`, a non-empty `missing`/`invalid` list, a `problems` map or a thrown error.
2. The rejection carries a non-empty, named reason.
3. The rejected result carries no finite number, except paths the adapter declares as intentionally partial (SOFA per-organ points of valid components, Cockcroft-Gault `ibwKg` from height and sex, DKA fluids when only insulin rate is bad). For those, the path that depends on the attacked field must be empty.
4. Pairing: the exact declared minimum and maximum, and real booleans, are **accepted**, so the range or type rule is what rejects. Cross-field rules (HDL below total cholesterol, systolic above diastolic) use an explicit `edgeBase`.
5. Rejection reasons differ between fields of one engine (the reason names the field, not "invalid input").

Optional fields are declared per adapter (`optionalBlank`: caffeine custom mg, DKA potassium) and are not hidden: they are the only places where a blank is accepted by design. `bloodDonationScreen.lastDonation = ''` means "never donated" and is declared the same way.

## Result at this change

2026 adversarial runs, 0 gaps after the fixes below. Before the fixes the matrix found these real fail-open paths:

| Engine | Input | Before | After |
|---|---|---|---|
| `stopBang` | `snoring`/`tired`/`observed`/`pressure` as `null`, `1`, `'yes'` | accepted by truthiness: `'yes'`/`1` counted as yes and `null` (an unanswered question) as "no", under-scoring the screen | rejected: `<field> must be yes or no` |
| `news2` | `onOxygen`, `alert` non-boolean | accepted; anything but `true` was silently read as "no oxygen" / "not alert" (the AVPU 3 points) | rejected |
| `sofaScore` | `supported` non-boolean | accepted; anything but `true` was silently read as "no respiratory support", skipping the 3 and 4 point branches | rejected |
| `meldNa` | `dialysis` non-boolean | accepted; read as "no dialysis", so creatinine was required and used | rejected |
| `hydrationTarget` | `hotClimate`, `pregnant`, `breastfeeding` non-boolean | accepted by truthiness: `'yes'`/`1` added the allowance, `null` silently dropped it | rejected |
| `sleepDebt` | a night with `hours` `NaN`/`undefined`/`''` | `ok:true`, verdict "Significant sleep debt", debt `NaN` | `ok:false` with the allowed range |

All page callers pass real booleans (checkbox state; `SleepApneaScreen` coerces with `!!`) and pass nights through `sanitizeNights`, so no existing screen changes behaviour; the engines now refuse bad input themselves.

## Negative controls

Sabotage on the real engines, each reverted afterwards:

- `meanArterialPressure` systolic range check removed: the matrix reports `systolic` accepted for NaN, undefined and Infinity.
- `isFiniteNumber` made to coerce numeric text: the matrix reports `numeric-text` accepted across the engines that use `inRange`.
- the new `stopBang` boolean guard reverted: the matrix reports `snoring` accepted for `'yes'`, `1`, `null`.
- the new `sleepDebt` night check reverted: the matrix reports the night-hours field accepted for NaN, undefined and `''`.
- built-in self-tests: an engine that returns an object for NaN counts as accepted; an empty reason, a thrown error, a `missing` list and a number-carrying rejection are each classified correctly.

## Limits

- The matrix attacks the fields listed in each adapter. A new input field that is not added to an adapter is not attacked; a new engine without an adapter fails the coverage assertion.
- It proves that bad input is refused with a reason. It does not prove that any accepted value, range or cut-off is clinically right. `clinically_reviewed` stays `false` for every engine.
- `sleepDebt`'s calendar-impossible dates (`2026-02-30`) are still accepted; that finding is unchanged (see `CALCULATOR_MUTATION_SWEEP.md`).
