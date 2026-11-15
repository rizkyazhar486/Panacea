// A thin line through a short series: the last minute of heart rate, or the beat intervals of an HRV recording.
import { tracePoints } from '../engine/traceGeometry.ts'

export function LiveTrace({ values, label, height = 48, width = 320 }: {
  values: readonly number[]
  /** Accessible description of what the line shows. */
  label: string
  height?: number
  width?: number
}) {
  const points = tracePoints(values, width, height)
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={label}
      className="block h-12 w-full text-brand-dark dark:text-emerald-300" data-points={points.length}>
      <line x1="0" x2={width} y1={height - 0.5} y2={height - 0.5} stroke="currentColor" strokeOpacity="0.15" />
      {points.length > 1 && (
        <polyline points={points.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke="currentColor"
          strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      )}
      {points.length === 1 && <circle cx={points[0]![0]} cy={points[0]![1]} r="2.5" fill="currentColor" />}
    </svg>
  )
}
