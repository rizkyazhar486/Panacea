# C2 performance duration evidence

Acceptance target: the performance deck must distinguish unavailable workout duration from recorded zero, aggregate only duration evidence, and disclose partial coverage in the seven-day chart and 28-day heatmap.

| Criterion | Gap | Dependency | Acceptance | Evidence | PR/SHA | Status |
| --- | --- | --- | --- | --- | --- | --- |
| C2 | Two dashboard aggregates read raw cached duration | Existing `workoutDurationSeconds` contract | Unknown-only time is unavailable; zero remains zero; partial totals disclose excluded sessions | Seven source-function regression tests; actual component browser fixture at 390×844 and 1440×900 | See containing commit and linked PR | IMPLEMENTED; criterion remains REPORTED |

## Reproduction and behavior

A stored workout with `durationSource: 'unknown'` and cached `durasi: 1800` previously contributed 30 minutes to both charts. Timestamp-mismatched cached duration was also accepted. An unknown workout whose raw duration was zero instead appeared as zero time.

Both imported-workout aggregates now use the existing canonical duration getter. Each day retains known and unavailable session counts. Unknown-only days and totals show an em dash; recorded zero remains available zero. Partial totals say “known min” with the number of sessions whose duration is unavailable. Unknown-only or recorded-zero history can display its heatmap without inventing positive activity. Days without sessions retain their existing zero-minute behavior.

The GPS fallback still applies only when no imported workouts exist; its existing source priority remains intact. Nonfinite or negative GPS duration cannot become measured activity. No stored data, equations, heart-rate calculations, clinical review state, backend, CI, or shared acceptance baseline changes.

## Reproducible checks

- `node --test scripts/qa/performance-duration-evidence.test.mjs`: seven tests; all failed before the correction and pass afterward. Executes actual source function bodies with a fixed clock, using the real canonical getter. Covers unknown, inconsistent timestamps, nonfinite/negative duration, recorded zero, legacy positive duration, matching timestamps, partial evidence, source nonmutation, empty state, and GPS source priority.
- `node scripts/qa/performance-duration-smoke.mjs` with installed `PLAYWRIGHT_MODULE` and native Chrome in `CHROME`: actual component, synthetic storage/vitals/history boundaries. Covers unknown, known, zero, empty, timestamp mismatch, partial totals and heatmap, no horizontal overflow or page errors at 390×844 and 1440×900. No interactive controls are added by this change.
- Full repository build pipeline, `tsc -b`, `npm run uji`, and architecture lint: results recorded in the PR. Local Node QA concurrency is capped at two to avoid subprocess resource contention; validators and test set remain unchanged. Mandatory GitHub checks remain unchanged.

These fixtures do not demonstrate authenticated persistence, live device connectivity, clinical accuracy, full C2 completion, or production shipment. Review, exact-head CI, serial integration, and deployment proof are separate gates.
