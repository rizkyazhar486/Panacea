/**
 * Panacea Scientific Sport Graph Renderer
 *
 * Consumes `SCIENTIFIC_SPORT_GRAPHS` contracts (src/lib/universalSportOS.ts) and
 * `PerformanceTelemetryEnvelope` streams (src/lib/performanceTelemetryEnvelope.ts)
 * and produces a render-ready, provenance-preserving series set.
 *
 * This module never fabricates, interpolates or unit-converts a value. It only
 * validates, sorts and passes through source-backed samples. Every output
 * series keeps its own timestamps/provenance rather than being merged onto a
 * shared sample grid, so no cross-metric interpolation is ever introduced.
 *
 * Fail-closed by design: an unknown metric, a unit mismatch, missing data for a
 * required metric, invalid telemetry, or an unsynchronized multi-stream overlay
 * all reject the graph with an explicit reason instead of guessing.
 */

import {
  SCIENTIFIC_SPORT_GRAPHS,
  UNIVERSAL_SPORT_METRICS,
  SPECIALIZED_SPORT_METRICS,
  type ScientificGraphDefinition,
  type ScientificGraphKind,
} from './universalSportOS.ts'
import {
  canSynchronizeTelemetry,
  sortAndDedupeTelemetry,
  validatePerformanceTelemetry,
  type PerformanceTelemetryEnvelope,
  type TelemetryTruthClass,
  type TimestampQuality,
} from './performanceTelemetryEnvelope.ts'

export type TelemetryByMetric = Readonly<Record<string, readonly PerformanceTelemetryEnvelope[]>>

export interface RenderedGraphPoint {
  tSeconds: number
  value: number
  capturedAt: string
  sourceId: string
  truthClass: TelemetryTruthClass
  confidence: number
  timestampQuality: TimestampQuality
}

export interface RenderedGraphSeries {
  metricId: string
  unit: string
  points: readonly RenderedGraphPoint[]
}

export interface RenderedScientificGraph {
  ok: true
  graphId: string
  title: string
  kind: ScientificGraphKind
  interpretation: string
  safetyBoundary?: string
  xAxis: {
    metricId: string
    unit: string
    isDerivedTime: boolean
  }
  series: readonly RenderedGraphSeries[]
  warnings: readonly string[]
  maxSkewMs: number | null
}

export interface RejectedScientificGraph {
  ok: false
  graphId: string
  errors: readonly string[]
}

export type ScientificGraphResolution = RenderedScientificGraph | RejectedScientificGraph

/** Pseudo axes are derived from telemetry timestamps, never a registered metric. */
const DERIVED_TIME_AXES: Readonly<Record<string, string>> = Object.freeze({
  'elapsed-time': 's',
  'duration-min': 'min',
})

function findMetricUnit(metricId: string): string | null {
  const base = UNIVERSAL_SPORT_METRICS.find((m) => m.id === metricId)
  if (base) return base.unit
  const specialized = SPECIALIZED_SPORT_METRICS.find((m) => m.id === metricId)
  if (specialized) return specialized.unit
  return null
}

function findGraph(graphId: string): ScientificGraphDefinition | null {
  return SCIENTIFIC_SPORT_GRAPHS.find((g) => g.id === graphId) ?? null
}

function buildSeries(metricId: string, unit: string, items: readonly PerformanceTelemetryEnvelope[], originMs: number): RenderedGraphSeries {
  const sorted = sortAndDedupeTelemetry(items)
  return Object.freeze({
    metricId,
    unit,
    points: Object.freeze(
      sorted.map((item) =>
        Object.freeze({
          tSeconds: (Date.parse(item.capturedAt) - originMs) / 1000,
          value: item.value,
          capturedAt: item.capturedAt,
          sourceId: item.sourceId,
          truthClass: item.truthClass,
          confidence: item.confidence,
          timestampQuality: item.timestampQuality,
        }),
      ),
    ),
  })
}

/**
 * Resolves one scientific graph definition into render-ready series.
 *
 * `telemetryByMetric` supplies the raw, source-backed streams keyed by the
 * exact metric id from `UNIVERSAL_SPORT_METRICS` / `SPECIALIZED_SPORT_METRICS`.
 * A `distance` stream is optional context for the `distance-or-time` pseudo
 * axis; when absent, that axis falls back to derived elapsed time.
 */
export function resolveScientificGraph(
  graphId: string,
  sportId: string,
  telemetryByMetric: TelemetryByMetric,
  options: { maxAllowedSkewMs?: number } = {},
): ScientificGraphResolution {
  const graph = findGraph(graphId)
  if (!graph) return Object.freeze({ ok: false, graphId, errors: Object.freeze(['unknown-graph']) })

  if (!(graph.appliesTo.includes('*') || graph.appliesTo.includes(sportId))) {
    return Object.freeze({ ok: false, graphId, errors: Object.freeze(['graph-not-applicable-to-sport']) })
  }

  const maxAllowedSkewMs = options.maxAllowedSkewMs ?? 1000
  const errors: string[] = []
  const warnings: string[] = []

  let xMetricId = graph.xMetric
  let xUnit: string | null = null
  let xIsDerivedTime = false

  if (graph.xMetric === 'distance-or-time') {
    if (telemetryByMetric['distance']?.length) {
      xMetricId = 'distance'
      xUnit = findMetricUnit('distance')
    } else {
      xMetricId = 'elapsed-time'
      xUnit = DERIVED_TIME_AXES['elapsed-time']
      xIsDerivedTime = true
      warnings.push('distance-or-time fell back to elapsed-time: no distance stream supplied')
    }
  } else if (DERIVED_TIME_AXES[graph.xMetric]) {
    xUnit = DERIVED_TIME_AXES[graph.xMetric]
    xIsDerivedTime = true
  } else {
    xUnit = findMetricUnit(graph.xMetric)
    if (!xUnit) errors.push(`unknown-metric:${graph.xMetric}`)
  }

  const requiredMetricIds = xIsDerivedTime ? [...graph.yMetrics] : [...graph.yMetrics, xMetricId]
  const validatedItemsByMetric = new Map<string, readonly PerformanceTelemetryEnvelope[]>()

  for (const metricId of new Set(requiredMetricIds)) {
    const unit = findMetricUnit(metricId)
    if (!unit) {
      errors.push(`unknown-metric:${metricId}`)
      continue
    }
    const items = telemetryByMetric[metricId]
    if (!items || !items.length) {
      errors.push(`missing-metric:${metricId}`)
      continue
    }
    if (items.some((item) => !validatePerformanceTelemetry(item).valid)) {
      errors.push(`invalid-telemetry:${metricId}`)
      continue
    }
    if (items.some((item) => item.unit !== unit)) {
      errors.push(`unit-mismatch:${metricId}`)
      continue
    }
    validatedItemsByMetric.set(metricId, items)
  }

  if (errors.length) {
    return Object.freeze({ ok: false, graphId, errors: Object.freeze(errors) })
  }

  const allItems = [...validatedItemsByMetric.values()].flat()
  const distinctStreams = new Set(allItems.map((item) => item.streamId))
  let maxSkewMs: number | null = null

  if (distinctStreams.size > 1) {
    const alignment = canSynchronizeTelemetry(allItems, maxAllowedSkewMs)
    maxSkewMs = alignment.maxSkewMs
    if (!alignment.aligned) {
      return Object.freeze({ ok: false, graphId, errors: Object.freeze([`unsynchronized:${alignment.reason}`]) })
    }
  }

  const originMs = Math.min(...allItems.map((item) => Date.parse(item.capturedAt)))
  const series = graph.yMetrics.map((metricId) =>
    buildSeries(metricId, findMetricUnit(metricId) as string, validatedItemsByMetric.get(metricId) as readonly PerformanceTelemetryEnvelope[], originMs),
  )

  return Object.freeze({
    ok: true,
    graphId,
    title: graph.title,
    kind: graph.kind,
    interpretation: graph.interpretation,
    safetyBoundary: graph.safetyBoundary,
    xAxis: Object.freeze({ metricId: xMetricId, unit: xUnit as string, isDerivedTime: xIsDerivedTime }),
    series: Object.freeze(series),
    warnings: Object.freeze(warnings),
    maxSkewMs,
  })
}

export const SCIENTIFIC_GRAPH_RENDERER_POLICY = Object.freeze({
  neverInterpolatesAcrossMetrics: true as const,
  neverConvertsUnits: true as const,
  unknownMetricFailsClosed: true as const,
  unitMismatchFailsClosed: true as const,
  missingMetricFailsClosed: true as const,
  multiStreamOverlayRequiresClockSync: true as const,
  safetyBoundaryAlwaysPreserved: true as const,
})
