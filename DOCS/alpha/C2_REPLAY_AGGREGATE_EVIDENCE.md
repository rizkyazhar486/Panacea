# C2 Human Replay aggregate evidence — 2026-10-15 candidate

Source base: main `0f9e6a2137b08376aada4a583e0dbddacddc7ddd`. Canonical main remains35/43 VERIFIED; requested45 scope is pending #2533. C2 remains REPORTED; this candidate does not promote a criterion.

## Reproduced gap and minimum repair

Human Replay summed raw `durasi` despite the existing `workoutDurationSeconds` provenance contract. A positive1800-second compatibility value marked `durationSource: unknown` became30 active minutes; legacy missing-duration zero became an apparently observed zero. Monthly/cumulative totals, month comparisons and the share poster carried this claim. The same replay summed missing distance and energy as zero. A rounded distance comparison also overflowed to Infinity.

The candidate reuses the existing duration evidence helper. A complete aggregate requires a finite nonnegative value for every included session; incomplete totals are null and displayed as Unknown. Observed zero stays zero; valid timestamp duration and supported positive legacy duration remain usable. Missing history is unavailable rather than an observed zero. Session counts and the original workout records remain intact. Independent known fields remain usable when another field is absent. Cumulative values stay unavailable after an incomplete chapter, and comparisons require both complete values and finite rounding. UI and the actual canvas poster share the same formatting rules. No imputation, clinical range, device claim, anatomy asset or reviewer status changes.

## Behavioral regression matrix

`human-replay-duration.mts` is discovered by mandatory `npm run uji`:

| Case | Required result |
|---|---|
| Positive value with unknown duration source | null in monthly and overall time |
| All missing, mixed known/missing or legacy zero | unavailable, including cumulative time |
| Explicit source-field zero or matched zero timestamps | observed0 preserved |
| Valid timestamps / supported positive legacy value | exact30 minutes for1800 seconds |
| Timestamp mismatch, negative, NaN or Infinity | unavailable without removing the session |
| Missing/invalid distance or energy | null, never a patient-looking0 |
| Known zero distance/energy |0 preserved |
| Comparison against incomplete month | null rather than a zero difference |
| Sum or rounded-difference overflow | null, never Infinity |
| Frozen source object | unchanged |

Original main fails the named unsupported-positive-duration assertion (actual30, expectednull). An unknown→zero mutation also fails; source restoration is checked in finally. The boundary test reproduced Infinity before the finite-rounding guard. Existing `replay-duration-weights.mts` still checks known positive time weights, unknown/zero exclusion and unavailable HR overflow.

## Browser evidence contract

`human-replay-duration-smoke.mjs` bundles the actual HumanReplay, engine, reference Body3D and poster code with synthetic histories. It uses the application's built stylesheet and public anatomy assets; fixture BASE_URL is explicit. It tests390×844 and1440×900, keyboard month selection, Unknown/zero/known/invalid/mixed histories, cumulative and comparison values, canvas text and downloaded PNGs, empty history, overflow, page exceptions, console errors and failed HTTP responses. The mandatory full Stabilization step uploads `replay-duration` artifacts.

The fixture explicitly provides empty external Google Fonts CSS to exercise the system-font fallback; it does not prove font-service delivery. It is a synthetic component fixture, not authenticated product-route integration, device connectivity, clinical approval or full WebGL/geometry acceptance. Those existing required render gates remain separate. C2's broader semantic consumer audit, including other active duration PRs, must finish before promotion.

## Validation and integration gates

Focused duration/field/overflow and existing HR-weight regressions pass. Final build:945 Node QA tests plus `tsc -b` and Vite. Full frontend passes737/737; final browser passes both required viewports with real component/poster, no canvas/metric intersection, no horizontal overflow, page/console errors or failed HTTP responses. Screenshots and downloaded PNGs were visually inspected. These local results do not replace exact-head CI. Architecture lint/ratchet preserve existing baselines. No backend implementation is changed.

Active overlap: #2545 consolidates #2540–#2544 rewards/training/dashboard duration work and does not modify Human Replay. #2529, #2533 and #2546 are independent pending owner review; workflow insertion conflicts must retain all acceptance steps. Merge only through PR, with current-main/head inspection, all mandatory exact-head CI, required review and expected-head protection. No production shipment is claimed.

The final visual inspection found Body3D's default68vh/negative-margin stage extending beyond the enclosing500px viewport and covering metric cards. HumanReplay now supplies the existing full-size stageClassName prop. A browser bounding-box assertion rejects intersecting canvas/metric rectangles, covering mobile stacking and desktop side-by-side layout. Renderer logic and geometry are unchanged.


## Current-main reconciliation

Main129f5ddb integrated #2545 during this candidate's publication. The replay implementation/harness has no file overlap with its consumer changes; only the execution checkpoint conflicted. Both valid intents are preserved by a forward merge. Earlier945-QA/737-frontend/browser results describe source57454378 on base0f9e6a21. The synchronized candidate must repeat build/full frontend/browser and all exact-head CI; old-head green is not current-head proof. No criterion is promoted.
