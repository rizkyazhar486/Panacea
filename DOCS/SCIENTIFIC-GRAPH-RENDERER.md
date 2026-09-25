# Scientific Graph Renderer

`src/lib/scientificGraphRenderer.ts` is the first canonical consumer of
`SCIENTIFIC_SPORT_GRAPHS` (`src/lib/universalSportOS.ts`). It resolves one graph
definition plus a set of `PerformanceTelemetryEnvelope` streams
(`src/lib/performanceTelemetryEnvelope.ts`) into render-ready series, and
supersedes the earlier unfinished instruction to build this renderer.

## What it guarantees

- **No fabrication.** Every output sample is a pass-through of a validated,
  source-backed telemetry item — no interpolation, no cross-metric merge onto
  a shared grid, no unit conversion.
- **Fail closed on an unknown metric.** A graph that references a metric id
  absent from `UNIVERSAL_SPORT_METRICS`/`SPECIALIZED_SPORT_METRICS` is
  rejected with `unknown-metric:<id>` rather than guessing a unit. (This is
  how the pre-existing `vertical-speed` gap in `dive-motion-control` was
  found; it is now a registered metric.)
- **Fail closed on a unit mismatch.** If a supplied stream's `unit` does not
  match the registry-declared unit for that metric, the graph is rejected
  with `unit-mismatch:<id>`.
- **Fail closed on missing data.** Every metric the graph declares is
  required; a missing stream rejects with `missing-metric:<id>`.
- **Fail closed on unsynchronized overlays.** When a graph combines more than
  one distinct telemetry stream, `canSynchronizeTelemetry` must confirm a
  shared sync group and bounded clock skew before the overlay is produced —
  otherwise the result is `unsynchronized:<reason>`.
- **Safety boundaries are never dropped.** A graph's `safetyBoundary` string
  (e.g. "not a decompression schedule") always passes through unchanged when
  the graph resolves.

## Pseudo time axes

`elapsed-time` and `duration-min` are derived directly from telemetry
timestamps, not registered metrics. `distance-or-time` prefers an actual
`distance` stream when supplied and otherwise falls back to elapsed time,
recording the fallback as a warning rather than hiding it.

## Non-goals

This module does not render pixels/charts and does not pick colors or chart
libraries — it produces the validated data contract a chart component
consumes. It also does not add new sport-science claims: every metric still
requires a real source per `UNIVERSAL_SPORT_OS_POLICY`.

## Next steps

1. wire a chart component (respecting the `dataviz` design guidance already
   used elsewhere in this repo) to `resolveScientificGraph()` output for the
   Universal Sport OS / Tactical Athlete OS / Performance Orchestrator
   surfaces;
2. extend the renderer to accept the `performanceResilienceProfile.ts`
   derived series once a UI consumer exists, without duplicating this
   validation contract;
3. add real device/vendor adapters that emit `PerformanceTelemetryEnvelope`
   items directly, so the renderer's fail-closed paths are exercised against
   live data rather than only fixtures.
