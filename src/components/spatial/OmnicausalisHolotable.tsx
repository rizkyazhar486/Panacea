import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  buildKnowledgeConstellationGraph,
  solveHolotableCounterfactualTrajectories,
  type CommandOperatingMode,
  type ConstellationNode3D,
  type HolotableProtocolLever,
} from '../../domains/spatial-os/index.ts'
import type { Vitals } from '../../lib/healthVitals'
import { readHolotableSnapshots, recordHolotableSnapshot, type StoredHolotableSnapshot } from './spatialStorage'
import '../../styles/panaceaSpatialHud.css'

export interface OmnicausalisHolotableProps {
  readonly initialTab?: 'holotable' | 'constellation'
  readonly mode: CommandOperatingMode
  readonly profileKey: string
  readonly vitals: Vitals
  readonly onOutboxUpdated?: (count: number) => void
}

const LEVER_OPTIONS: readonly { readonly id: HolotableProtocolLever; readonly label: string }[] = [
  { id: 'sleep_lock', label: '8h Circadian Sleep Lock' },
  { id: 'zone2_cardio', label: 'Zone-2 + Strength' },
  { id: 'fascia_decompression', label: 'Fascia Kinetic Decompression' },
  { id: 'anti_inflammatory_nutrition', label: 'Anti-Inflammatory Nutrition' },
]

const CATEGORY_COLORS: Readonly<Record<ConstellationNode3D['category'], string>> = {
  vital: '#22d3ee',
  organ: '#ff2d46',
  fascia: '#10b981',
  skdi: '#f59e0b',
  pharmacology: '#a78bfa',
}

function project3D(x: number, y: number, z: number, yaw: number, pitch: number, cx: number, cy: number, scale: number) {
  const cosY = Math.cos(yaw)
  const sinY = Math.sin(yaw)
  const x1 = x * cosY - z * sinY
  const z1 = x * sinY + z * cosY

  const cosP = Math.cos(pitch)
  const sinP = Math.sin(pitch)
  const y2 = y * cosP - z1 * sinP
  const z2 = y * sinP + z1 * cosP

  const perspective = 2.6 / (2.6 - z2 * 0.85)
  return {
    sx: cx + x1 * scale * perspective,
    sy: cy - y2 * scale * perspective,
    depth: z2,
    perspective,
  }
}

export function OmnicausalisHolotable({
  initialTab = 'holotable',
  mode,
  profileKey,
  vitals,
  onOutboxUpdated,
}: OmnicausalisHolotableProps) {
  const [tab, setTab] = useState<'holotable' | 'constellation'>(initialTab)
  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  const [paused, setPaused] = useState(false)
  const [truthLock, setTruthLock] = useState(true)
  const [horizonMonths, setHorizonMonths] = useState<number>(36)
  const [activeLevers, setActiveLevers] = useState<HolotableProtocolLever[]>([
    'sleep_lock',
    'zone2_cardio',
    'fascia_decompression',
  ])
  const [snapshots, setSnapshots] = useState<StoredHolotableSnapshot[]>(() => readHolotableSnapshots())
  const [snapshotBanner, setSnapshotBanner] = useState<string | null>(null)

  const [selectedNodeId, setSelectedNodeId] = useState<string>('organ-heart')
  const yawRef = useRef<number>(0.45)
  const pitchRef = useRef<number>(0.24)
  const draggingRef = useRef<{ active: boolean; lastX: number; lastY: number }>({ active: false, lastX: 0, lastY: 0 })
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const projectedNodesRef = useRef<Array<{ id: string; sx: number; sy: number; r: number }>>([])

  const trajectory = useMemo(
    () =>
      solveHolotableCounterfactualTrajectories({
        chronologicalAgeYears: 32,
        baselineBiologicalAgeYears: 33.4,
        baselineCardiovascularRiskPct: 6.2,
        baselineMetabolicRiskPct: 9.8,
        baselineFasciaAlignmentPct: 62,
        baselineHrvMs: vitals.hrvMs ?? 56,
        baselineGaitRecoilPct: 65,
        baselineHsCrpMgL: 1.45,
        activeLevers,
        horizonMonths,
      }),
    [vitals.hrvMs, activeLevers, horizonMonths],
  )

  const constellation = useMemo(
    () =>
      buildKnowledgeConstellationGraph({
        restingHrBpm: vitals.restingHr ?? vitals.heartRate ?? null,
        hrvMs: vitals.hrvMs ?? null,
        sleepHours: vitals.sleepH ?? null,
        vo2max: vitals.vo2max ?? null,
        fasciaAlignmentPct: 72,
      }),
    [vitals],
  )

  const selectedNode = useMemo(
    () => constellation.nodes.find((n) => n.id === selectedNodeId) ?? constellation.nodes[0],
    [constellation.nodes, selectedNodeId],
  )

  const toggleLever = (id: HolotableProtocolLever) => {
    setActiveLevers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleRecordSnapshot = () => {
    if (!trajectory.ok) return
    const { snapshot, outboxCount } = recordHolotableSnapshot({
      profileKey,
      mode,
      horizonMonths: trajectory.horizonMonths,
      activeLevers: trajectory.activeLevers,
      deltas: trajectory.deltas,
    })
    setSnapshots((prev) => [snapshot, ...prev].slice(0, 24))
    setSnapshotBanner(`Snapshot ${snapshot.id} saved locally & queued to Neon panacea_digital_twin_snapshots (${outboxCount} in outbox).`)
    onOutboxUpdated?.(outboxCount)
  }

  const handleReset = () => {
    yawRef.current = 0.45
    pitchRef.current = 0.24
    setHorizonMonths(36)
    setActiveLevers(['sleep_lock', 'zone2_cardio', 'fascia_decompression'])
    setSelectedNodeId('organ-heart')
    setSnapshotBanner(null)
  }

  // Interactive 3D Canvas Renderer (supports both Constellation & Counterfactual Holotable without WebGL context contention)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId = 0
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const renderFrame = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(280, Math.round(rect.width))
      const height = Math.max(240, Math.round(rect.height))
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr
        canvas.height = height * dpr
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)

      if (!paused && !draggingRef.current.active && !reducedMotion) {
        yawRef.current += 0.0045
      }

      const cx = width / 2
      const cy = height / 2 + 8
      const scale = Math.min(width, height) * 0.36

      // Base holotable elliptical grid
      const ringColor = tab === 'holotable' ? 'rgba(245, 158, 11, 0.24)' : 'rgba(56, 189, 248, 0.22)'
      for (const rMul of [0.45, 0.78, 1.08]) {
        ctx.beginPath()
        ctx.ellipse(cx, cy + scale * 0.56, scale * rMul * 1.15, scale * rMul * 0.28, 0, 0, Math.PI * 2)
        ctx.strokeStyle = ringColor
        ctx.lineWidth = 1
        ctx.stroke()
      }

      if (tab === 'constellation') {
        const projectedMap = new Map<string, { sx: number; sy: number; depth: number; perspective: number }>()
        for (const node of constellation.nodes) {
          projectedMap.set(node.id, project3D(node.x, node.y, node.z, yawRef.current, pitchRef.current, cx, cy, scale))
        }

        // Beams
        for (const edge of constellation.edges) {
          const a = projectedMap.get(edge.from)
          const b = projectedMap.get(edge.to)
          if (!a || !b) continue
          const isLinked = edge.from === selectedNodeId || edge.to === selectedNodeId
          ctx.beginPath()
          ctx.moveTo(a.sx, a.sy)
          ctx.lineTo(b.sx, b.sy)
          ctx.strokeStyle = isLinked ? 'rgba(34, 211, 238, 0.85)' : 'rgba(56, 189, 248, 0.24)'
          ctx.lineWidth = isLinked ? 1.8 : 1
          ctx.stroke()
        }

        // Depth-sorted nodes
        const sorted = [...constellation.nodes]
          .map((node) => ({ node, p: projectedMap.get(node.id)! }))
          .sort((a, b) => a.p.depth - b.p.depth)

        const hitTargets: Array<{ id: string; sx: number; sy: number; r: number }> = []

        for (const { node, p } of sorted) {
          const isSelected = node.id === selectedNodeId
          const radius = (isSelected ? 8.5 : 5.5) * p.perspective
          const color = CATEGORY_COLORS[node.category]

          if (isSelected) {
            ctx.beginPath()
            ctx.arc(p.sx, p.sy, radius + 6, 0, Math.PI * 2)
            ctx.strokeStyle = color
            ctx.lineWidth = 1.2
            ctx.stroke()
          }

          ctx.beginPath()
          ctx.arc(p.sx, p.sy, radius, 0, Math.PI * 2)
          ctx.fillStyle = color
          ctx.fill()

          ctx.font = '700 10px ui-monospace, SFMono-Regular, Menlo, monospace'
          ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(226, 232, 240, 0.82)'
          ctx.fillText(node.label, p.sx + radius + 5, p.sy + 3)

          hitTargets.push({ id: node.id, sx: p.sx, sy: p.sy, r: Math.max(radius + 10, 18) })
        }
        projectedNodesRef.current = hitTargets
      } else if (trajectory.ok) {
        projectedNodesRef.current = []
        const basePts = trajectory.curve.map((pt) =>
          project3D(pt.baselineX, pt.baselineY, pt.baselineZ, yawRef.current, pitchRef.current, cx, cy, scale),
        )
        const optPts = trajectory.curve.map((pt) =>
          project3D(pt.optimizedX, pt.optimizedY, pt.optimizedZ, yawRef.current, pitchRef.current, cx, cy, scale),
        )

        // Vertical counterfactual divergence ribs
        for (let i = 0; i < basePts.length; i++) {
          ctx.beginPath()
          ctx.moveTo(basePts[i].sx, basePts[i].sy)
          ctx.lineTo(optPts[i].sx, optPts[i].sy)
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.24)'
          ctx.lineWidth = 1
          ctx.stroke()
        }

        // Baseline (Now) trajectory curve
        ctx.beginPath()
        basePts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy)))
        ctx.strokeStyle = 'rgba(255, 45, 70, 0.78)'
        ctx.lineWidth = 2
        ctx.setLineDash([4, 4])
        ctx.stroke()
        ctx.setLineDash([])

        // Aligned / Optimized amber-gold orbital trajectory curve
        ctx.beginPath()
        optPts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy)))
        ctx.strokeStyle = '#f59e0b'
        ctx.lineWidth = 2.8
        ctx.stroke()

        // Horizon milestone nodes
        optPts.forEach((p, idx) => {
          if (idx % 3 !== 0 && idx !== optPts.length - 1) return
          ctx.beginPath()
          ctx.arc(p.sx, p.sy, idx === optPts.length - 1 ? 6.5 : 4, 0, Math.PI * 2)
          ctx.fillStyle = idx === optPts.length - 1 ? '#10b981' : '#f59e0b'
          ctx.fill()

          const month = trajectory.curve[idx].month
          ctx.font = '700 10px ui-monospace, SFMono-Regular, Menlo, monospace'
          ctx.fillStyle = '#fef3c7'
          ctx.fillText(`M+${month}`, p.sx + 8, p.sy - 4)
        })
      }

      if (!paused && !reducedMotion) {
        rafId = window.requestAnimationFrame(renderFrame)
      }
    }

    renderFrame()
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId)
    }
  }, [tab, paused, constellation, selectedNodeId, trajectory])

  const onCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    if (tab === 'constellation') {
      const hit = projectedNodesRef.current.find((n) => Math.hypot(n.sx - x, n.sy - y) <= n.r)
      if (hit) {
        setSelectedNodeId(hit.id)
        return
      }
    }
    draggingRef.current = { active: true, lastX: e.clientX, lastY: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current.active) return
    const dx = e.clientX - draggingRef.current.lastX
    const dy = e.clientY - draggingRef.current.lastY
    draggingRef.current.lastX = e.clientX
    draggingRef.current.lastY = e.clientY
    yawRef.current += dx * 0.01
    pitchRef.current = Math.max(-0.9, Math.min(0.9, pitchRef.current + dy * 0.008))
  }

  const onCanvasPointerUp = () => {
    draggingRef.current.active = false
  }

  return (
    <section aria-label="Omnicausalis 3D Constellation and Counterfactual Holotable" className="panacea-spatial-hud p-4 sm:p-5">
      {/* Header + Visualizer Switcher */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <div className="hud-micro-header text-amber-300">
            OMNICAUSALIS SPATIAL ENGINE · {tab === 'holotable' ? 'COUNTERFACTUAL HOLOTABLE' : '3D KNOWLEDGE CONSTELLATION'}
          </div>
          <h2 className="mt-0.5 text-base font-black text-white">
            {tab === 'holotable'
              ? 'Parametric Orbital Trajectory: Now vs. Optimized Protocol'
              : '3D Biomedical Knowledge Constellation (Vitals · Organs · Fascia · SKDI)'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Holotable visualizers">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'holotable'}
            onClick={() => setTab('holotable')}
            className={`hud-btn text-[10px] ${tab === 'holotable' ? 'hud-btn-amber' : ''}`}
          >
            COUNTERFACTUAL HOLOTABLE
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'constellation'}
            onClick={() => setTab('constellation')}
            className={`hud-btn text-[10px] ${tab === 'constellation' ? 'hud-btn-cyan' : ''}`}
          >
            3D CONSTELLATION
          </button>
        </div>
      </header>

      {/* Main Split Stage */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_1fr]">
        {/* Interactive 3D Canvas Stage */}
        <div className={`${tab === 'holotable' ? 'hud-amber-stage' : 'hud-holo-stage'} flex flex-col justify-between p-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="hud-pill border-amber-400/45 text-amber-200">
              {truthLock ? 'TRUTH-CLASS LOCK: SIMULATED / NON-CLINICAL' : 'TRUTH-CLASS AUDIT VISIBLE'}
            </span>
            <span className="font-mono text-[10px] text-slate-300">
              DRAG TO ORBIT · {paused ? 'PAUSED' : 'LIVE ORBIT'}
            </span>
          </div>

          <div className="relative my-2 h-[290px] w-full sm:h-[320px]">
            <canvas
              ref={canvasRef}
              onPointerDown={onCanvasPointerDown}
              onPointerMove={onCanvasPointerMove}
              onPointerUp={onCanvasPointerUp}
              onPointerCancel={onCanvasPointerUp}
              className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
              aria-label={
                tab === 'holotable'
                  ? 'Interactive 3D counterfactual trajectory holotable canvas'
                  : 'Interactive 3D biomedical knowledge constellation canvas'
              }
            />
          </div>

          {/* Physical-Style Foreground Control Dock */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-black/75 p-2">
            <button
              type="button"
              onClick={() => setPaused((v) => !v)}
              className={`hud-btn min-h-[44px] px-3 text-[10px] ${paused ? 'hud-btn-active' : 'hud-btn-cyan'}`}
            >
              {paused ? 'RESUME' : 'PAUSE'}
            </button>
            <button
              type="button"
              onClick={handleRecordSnapshot}
              className="hud-btn hud-btn-amber min-h-[44px] px-3 text-[10px]"
            >
              RECORD SNAPSHOT
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="hud-btn min-h-[44px] px-3 text-[10px]"
            >
              RESET
            </button>
            <button
              type="button"
              onClick={() => setTruthLock((v) => !v)}
              aria-pressed={truthLock}
              className={`hud-btn min-h-[44px] px-3 text-[10px] ${truthLock ? 'hud-btn-emerald' : ''}`}
            >
              TRUTH-CLASS LOCK
            </button>
          </div>
        </div>

        {/* Right Side Inspector / Counterfactual Readouts */}
        {tab === 'holotable' && trajectory.ok ? (
          <div className="hud-frame hud-frame-amber flex flex-col justify-between p-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="hud-micro-header text-amber-300">
                  COUNTERFACTUAL LEVERS · {trajectory.horizonMonths}M HORIZON
                </span>
                <span className="font-mono text-[10px] text-slate-300">
                  CONF {Math.round(trajectory.convergenceConfidence01 * 100)}%
                </span>
              </div>

              {/* Horizon Selector */}
              <div className="grid grid-cols-3 gap-1.5">
                {[12, 24, 36].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setHorizonMonths(m)}
                    aria-pressed={horizonMonths === m}
                    className={`hud-btn min-h-[44px] px-2 text-[10px] ${horizonMonths === m ? 'hud-btn-amber' : ''}`}
                  >
                    {m} MONTHS
                  </button>
                ))}
              </div>

              {/* Protocol Levers */}
              <div className="flex flex-wrap gap-1.5">
                {LEVER_OPTIONS.map((opt) => {
                  const active = activeLevers.includes(opt.id)
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleLever(opt.id)}
                      className={`hud-btn min-h-[44px] px-2.5 text-[10px] ${active ? 'hud-btn-emerald' : ''}`}
                    >
                      {active ? '✓ ' : '+ '}
                      {opt.label}
                    </button>
                  )
                })}
              </div>

              {/* Tabular Counterfactual Comparison */}
              <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/50">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-white/10 text-[9px] uppercase text-slate-400">
                      <th className="px-2.5 py-2">Metric (Simulated)</th>
                      <th className="px-2 py-2 text-right">Baseline</th>
                      <th className="px-2 py-2 text-right text-amber-300">Aligned</th>
                      <th className="px-2 py-2 text-right">95% Band</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trajectory.deltas.map((row) => (
                      <tr key={row.id} className="border-b border-white/5 last:border-b-0">
                        <td className="px-2.5 py-1.5 font-sans text-xs text-slate-100">{row.label}</td>
                        <td className="hud-tabular px-2 py-1.5 text-right text-rose-300">
                          {row.nowValue} {row.unit}
                        </td>
                        <td className="hud-tabular px-2 py-1.5 text-right font-bold text-emerald-300">
                          {row.optimizedValue} {row.unit}
                        </td>
                        <td className="hud-tabular px-2 py-1.5 text-right text-[10px] text-slate-400">
                          {row.confidenceLow}–{row.confidenceHigh}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {snapshotBanner && (
                <p role="status" className="rounded-lg border border-emerald-400/35 bg-emerald-950/35 p-2 font-mono text-[10px] text-emerald-200">
                  {snapshotBanner}
                </p>
              )}

              {snapshots.length > 0 && (
                <div className="font-mono text-[10px] text-slate-400">
                  Stored local holotable snapshots: <strong className="text-amber-200">{snapshots.length}</strong> (latest {snapshots[0].id})
                </div>
              )}
            </div>

            <div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/10 p-2.5 font-mono text-[10px] leading-snug text-amber-200">
              {trajectory.epistemicNotice}
            </div>
          </div>
        ) : (
          <div className="hud-frame flex flex-col justify-between p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="hud-micro-header text-cyan-300">CONSTELLATION NODE INSPECTOR</span>
                <span className="font-mono text-[9px] uppercase text-amber-300">{selectedNode.truthClass}</span>
              </div>

              {/* Accessible Node Selector Chips */}
              <div className="flex flex-wrap gap-1.5">
                {constellation.nodes.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    aria-pressed={node.id === selectedNode.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`hud-btn min-h-[38px] px-2.5 text-[10px] ${
                      node.id === selectedNode.id ? 'hud-btn-cyan' : ''
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[node.category] }}
                      aria-hidden="true"
                    />
                    <span>{node.label}</span>
                  </button>
                ))}
              </div>

              {/* Selected Node Detail */}
              <div className="rounded-xl border border-cyan-400/25 bg-black/55 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase text-cyan-300">
                    {selectedNode.category} · {selectedNode.status}
                  </span>
                  <span className="hud-kpi-value text-xs font-black text-white">
                    {selectedNode.valueLabel}
                  </span>
                </div>
                <h3 className="mt-1 text-sm font-black text-white">{selectedNode.label}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-200">{selectedNode.summary}</p>
                <div className="mt-2 font-mono text-[10px] text-slate-400">
                  Provenance: {selectedNode.provenance}
                </div>
                <Link
                  to={selectedNode.route}
                  className="hud-btn hud-btn-cyan mt-3 w-full text-[10px]"
                >
                  OPEN {selectedNode.label.toUpperCase()} STUDIO →
                </Link>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-cyan-400/25 bg-cyan-950/25 p-2.5 font-mono text-[10px] leading-snug text-cyan-100">
              {constellation.epistemicNotice}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
