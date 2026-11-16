/**
 * Points of a line through a series (oldest left) in a W×H box, for the live heart-rate trace and the beat-interval
 * tachogram. The series' own minimum and maximum span the box; a flat series runs mid-height. A series holding any
 * value that is not a finite number draws nothing rather than a line through a gap.
 */
export type TracePoint = readonly [x: number, y: number]

const round2 = (n: number) => Math.round(n * 100) / 100

export function tracePoints(values: readonly number[], W: number, H: number, pad = 2): readonly TracePoint[] {
  if (!values.length || !values.every((v) => Number.isFinite(v))) return []
  if (!(W > 2 * pad) || !(H > 2 * pad)) return []
  let min = values[0]!
  let max = values[0]!
  for (const v of values) { if (v < min) min = v; if (v > max) max = v }
  const span = max - min
  const n = values.length
  return values.map((v, i) => [
    round2(n === 1 ? W / 2 : pad + (i * (W - 2 * pad)) / (n - 1)),
    round2(span === 0 ? H / 2 : pad + ((max - v) / span) * (H - 2 * pad)),
  ] as const)
}
