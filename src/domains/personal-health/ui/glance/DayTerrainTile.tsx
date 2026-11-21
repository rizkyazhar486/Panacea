// The imported file's recorded days as a 3D landscape the reader can turn: hours left to right, newest day in front,
// bar height = the value. Plain SVG from the pure dayTerrain projection — no WebGL, so it renders on every phone and
// in tests. Drag (or the slider, or arrow keys on it) turns it; it opens with one short turn unless motion is reduced.

import { useEffect, useMemo, useRef, useState } from 'react'
import type { DayHourGrid } from '../../engine/glance/deviceSeries.ts'
import { dayTerrain } from '../../engine/glance/dayTerrain.ts'
import type { GlanceMetric } from '../../engine/glance/glanceMetrics.ts'

const REST_YAW = -35
const YAW_MIN = -80
const YAW_MAX = 80

/** The tone scaled towards black by `k` (0..1); a non-hex tone is returned as is. */
function shadeOf(hex: string, k: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!m) return hex
  const n = parseInt(m[1]!, 16)
  const c = (v: number) => Math.round(v * (1 - k)).toString(16).padStart(2, '0')
  return `#${c((n >> 16) & 255)}${c((n >> 8) & 255)}${c(n & 255)}`
}

export function DayTerrainTile({ metric, grid, tone, source }: { metric: GlanceMetric; grid: DayHourGrid; tone: string; source: string }) {
  const [yaw, setYaw] = useState(REST_YAW)
  const drag = useRef<{ x: number; yaw: number } | null>(null)

  // One short opening turn, so the reader sees at once that it is a solid they can rotate.
  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 1100)
      const ease = 1 - (1 - t) ** 3
      setYaw(-75 + (REST_YAW + 75) * ease)
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [])

  const scene = useMemo(() => dayTerrain(metric, grid, yaw), [metric, grid, yaw])
  if (!scene) return null
  const colours = [tone, shadeOf(tone, 0.32), shadeOf(tone, 0.52)] as const

  return (
    <figure className="ha-tile ha-tile-wide ha-terrain">
      <figcaption>Your days in 3D · {source}</figcaption>
      <svg
        viewBox={scene.viewBox}
        role="img"
        aria-label={`${metric.label}, each recorded hour of each day as a bar. ${scene.sentence}`}
        onPointerDown={(e) => { drag.current = { x: e.clientX, yaw }; e.currentTarget.setPointerCapture(e.pointerId) }}
        onPointerMove={(e) => {
          if (!drag.current) return
          setYaw(Math.max(YAW_MIN, Math.min(YAW_MAX, drag.current.yaw + (e.clientX - drag.current.x) * 0.4)))
        }}
        onPointerUp={() => { drag.current = null }}
        onPointerCancel={() => { drag.current = null }}
      >
        {scene.gaps.map((g, i) => <circle key={`g${i}`} cx={g.x} cy={g.y} r={1.4} className="ha-terrain-gap" />)}
        {scene.faces.map((f, i) => (
          <polygon
            key={i}
            points={f.points}
            fill={colours[f.shade]}
            fillOpacity={0.45 + 0.55 * f.level}
            className={f.peak && f.shade === 0 ? 'is-peak' : undefined}
          />
        ))}
        {scene.labels.map((l, i) => <text key={`l${i}`} x={l.x} y={l.y + 3} textAnchor={l.anchor}>{l.text}</text>)}
      </svg>
      <div className="ha-terrain-foot">
        <p>{scene.sentence}</p>
        <label className="ha-terrain-turn">
          <span>Turn</span>
          <input type="range" min={YAW_MIN} max={YAW_MAX} step={1} value={Math.round(yaw)} onChange={(e) => setYaw(Number(e.target.value))} aria-label="Turn the 3D landscape" />
        </label>
        {scene.gaps.length > 0 && <span className="ha-day-key"><i aria-hidden /> no reading that hour — not a zero</span>}
      </div>
    </figure>
  )
}
