import { PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  BIOLOGICAL_FORMULA_LEDGER,
  BIOLOGICAL_SCALE_ORDER,
  biologicalDomainLabel,
  biologicalScaleConcept,
  closureFromPinchY,
  deriveBiologicalUniverseTrio,
  type BiologicalWorld,
} from '../../lib/biologicalUniverse'
import type { CausalDomain, CausalScale } from '../../lib/causalTimeMachine'

const DOMAIN_OPTIONS: Array<{ id: CausalDomain; label: string; action: string }> = [
  { id: 'coronary', label: 'Coronary', action: 'Pinch an authored coronary corridor' },
  { id: 'airway', label: 'Airway', action: 'Pinch an authored airway corridor' },
  { id: 'neural', label: 'Neural', action: 'Compress an authored conduction corridor' },
]

const SCALE_LABELS: Record<CausalScale, string> = {
  person: 'Person',
  organ: 'Organ',
  tissue: 'Tissue',
  cell: 'Cell',
  molecule: 'Molecule',
}

function pct(value: number) {
  return `${Math.round(value * 100)}%`
}

function channelPath(closure: number) {
  const openHalf = 54
  const closedHalf = 18
  const throat = openHalf - (openHalf - closedHalf) * closure
  const top = 130 - throat
  const bottom = 130 + throat
  return [
    `M24 ${130 - openHalf}`,
    `C150 ${130 - openHalf} 215 ${top} 292 ${top}`,
    `C330 ${top} 350 ${top} 388 ${top}`,
    `C465 ${top} 530 ${130 - openHalf} 616 ${130 - openHalf}`,
    `L616 ${130 + openHalf}`,
    `C530 ${130 + openHalf} 465 ${bottom} 388 ${bottom}`,
    `C350 ${bottom} 330 ${bottom} 292 ${bottom}`,
    `C215 ${bottom} 150 ${130 + openHalf} 24 ${130 + openHalf}`,
    'Z',
  ].join(' ')
}

function WorldCard({ world, active }: { world: BiologicalWorld; active?: boolean }) {
  return (
    <motion.div
      className={`rounded-3xl border p-3 ${active ? 'border-cyan-300/35 bg-cyan-300/[0.055]' : 'border-white/10 bg-white/[0.025]'}`}
      animate={{ opacity: active ? 1 : 0.78, scale: active ? 1 : 0.985 }}
      transition={{ type: 'spring', stiffness: 170, damping: 24 }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[9px] font-black uppercase tracking-[.14em] text-white/55">{world.label}</div>
        <span className={`h-2 w-2 rounded-full ${active ? 'bg-cyan-300 shadow-[0_0_18px_rgba(77,231,255,.9)]' : 'bg-white/25'}`} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div><div className="text-[8px] uppercase tracking-wide text-white/28">geometry</div><div className="mt-1 text-sm font-black text-white">{pct(world.geometry)}</div></div>
        <div><div className="text-[8px] uppercase tracking-wide text-white/28">transport</div><div className="mt-1 text-sm font-black text-cyan-100">{pct(world.transport)}</div></div>
        <div><div className="text-[8px] uppercase tracking-wide text-white/28">stress</div><div className="mt-1 text-sm font-black text-fuchsia-100">{pct(world.stress)}</div></div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-violet-400 to-fuchsia-300" style={{ width: `${world.transport * 100}%` }} />
      </div>
    </motion.div>
  )
}

function CausalWave({ world }: { world: BiologicalWorld }) {
  return (
    <div className="grid grid-cols-5 gap-1">
      {world.stages.map((stage, index) => (
        <div key={stage.id} className="relative min-w-0 text-center">
          <motion.div
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/40 text-[10px] font-black"
            animate={{
              borderColor: stage.activation > 0.2 ? 'rgba(77,231,255,.65)' : 'rgba(255,255,255,.10)',
              boxShadow: stage.activation > 0.2 ? `0 0 ${10 + stage.activation * 24}px rgba(77,231,255,.22)` : '0 0 0 rgba(0,0,0,0)',
              scale: 1 + stage.activation * 0.08,
            }}
          >
            {index + 1}
          </motion.div>
          {index < world.stages.length - 1 && <div className="absolute left-[61%] top-5 h-px w-[78%] bg-gradient-to-r from-cyan-300/50 to-violet-400/15" />}
          <div className="mt-2 truncate text-[7px] font-black uppercase tracking-wide text-white/35">{stage.label}</div>
        </div>
      ))}
    </div>
  )
}

export function PanaceaBiologicalUniverse() {
  const reduceMotion = useReducedMotion()
  const [domain, setDomain] = useState<CausalDomain>('coronary')
  const [closure, setClosure] = useState(0.58)
  const [reserve, setReserve] = useState(0.68)
  const [demand, setDemand] = useState(0.72)
  const [time, setTime] = useState(72)
  const [scale, setScale] = useState<CausalScale>('organ')
  const [dragging, setDragging] = useState(false)
  const pulseTimers = useRef<Array<ReturnType<typeof setTimeout>>>([])

  const universes = useMemo(
    () => deriveBiologicalUniverseTrio(domain, { closure, reserve, demand, time }),
    [domain, closure, reserve, demand, time],
  )

  useEffect(() => () => pulseTimers.current.forEach(clearTimeout), [])

  const updateFromPointer = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!dragging && event.type === 'pointermove') return
    const rect = event.currentTarget.getBoundingClientRect()
    if (!rect.height) return
    const localY = ((event.clientY - rect.top) / rect.height) * 260
    setClosure(closureFromPinchY(localY, 260))
  }

  const startDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    updateFromPointer(event)
  }

  const stopDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const releaseWave = () => {
    pulseTimers.current.forEach(clearTimeout)
    pulseTimers.current = []
    setTime(0)
    for (let step = 1; step <= 20; step += 1) {
      pulseTimers.current.push(setTimeout(() => setTime(step * 5), step * 70))
    }
  }

  const reset = () => {
    pulseTimers.current.forEach(clearTimeout)
    setClosure(0)
    setReserve(0.72)
    setDemand(0.5)
    setTime(0)
    setScale('person')
  }

  const halfGap = 54 - (54 - 18) * closure
  const handleTop = 130 - halfGap
  const handleBottom = 130 + halfGap
  const label = domain === 'neural' ? 'conduction corridor' : domain === 'airway' ? 'airway corridor' : 'coronary corridor'

  return (
    <div className="border-t border-white/10 bg-[#010204] p-4 sm:p-6">
      <div className="overflow-hidden rounded-[34px] border border-cyan-300/15 bg-[#03050a]" style={{ backgroundImage: 'radial-gradient(circle at 18% 0%,rgba(77,231,255,.11),transparent 28%),radial-gradient(circle at 86% 8%,rgba(255,99,216,.10),transparent 24%),linear-gradient(160deg,#020307,#080613 62%,#020307)' }}>
        <div className="border-b border-white/10 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-200">Reality Engine III · Biological Universe</div>
              <h3 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Grab the mechanism. Change the world.</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/48">
                Directly pinch an authored biological corridor, release a causal wave, compare three synthetic universes, then descend from person → organ → tissue → cell → molecule. The interaction is executable teaching geometry, not patient anatomy or prediction.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={releaseWave} className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-cyan-100">Release causal wave</button>
              <button type="button" onClick={reset} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-wide text-white/55">Restore universe</button>
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {DOMAIN_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setDomain(option.id)}
                className={`shrink-0 rounded-2xl border px-3 py-2 text-left ${domain === option.id ? 'border-cyan-300/35 bg-cyan-300/10' : 'border-white/10 bg-black/20'}`}
              >
                <div className={`text-[10px] font-black uppercase tracking-wide ${domain === option.id ? 'text-cyan-100' : 'text-white/45'}`}>{option.label}</div>
                <div className="mt-0.5 text-[8px] text-white/30">{option.action}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[1.35fr_.65fr]">
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-black/35 p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-2">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[.17em] text-white/38">Direct manipulation field</div>
                  <div className="mt-1 text-sm font-black text-white">Drag either luminous wall of the {label}</div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[9px] text-cyan-100">perturbation {pct(closure)}</div>
              </div>

              <svg
                viewBox="0 0 640 260"
                className="h-[280px] w-full select-none touch-none"
                role="img"
                aria-label={`Interactive synthetic ${label}. Drag vertically to change authored perturbation.`}
                onPointerDown={startDrag}
                onPointerMove={updateFromPointer}
                onPointerUp={stopDrag}
                onPointerCancel={stopDrag}
              >
                <defs>
                  <linearGradient id="bioUniverseWall" x1="0" x2="1">
                    <stop offset="0" stopColor="#4de7ff" stopOpacity=".24" />
                    <stop offset=".52" stopColor="#9c7cff" stopOpacity=".38" />
                    <stop offset="1" stopColor="#ff63d8" stopOpacity=".22" />
                  </linearGradient>
                  <filter id="bioUniverseGlow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                </defs>
                <path d={channelPath(closure)} fill="url(#bioUniverseWall)" stroke="rgba(180,244,255,.48)" strokeWidth="2" />
                <path d="M34 130 H606" stroke="rgba(255,255,255,.08)" strokeDasharray="3 8" />

                {[0, 1, 2, 3, 4].map((particle) => (
                  <motion.circle
                    key={particle}
                    cy={130 + (particle % 2 ? 8 : -8)}
                    r={4 - particle * 0.35}
                    fill={domain === 'neural' ? '#cdbfff' : '#dffcff'}
                    filter="url(#bioUniverseGlow)"
                    initial={{ cx: 50, opacity: 0.15 }}
                    animate={reduceMotion ? { cx: 80 + particle * 90, opacity: 0.5 } : { cx: [48, 592], opacity: [0, 0.95, 0] }}
                    transition={reduceMotion ? undefined : { duration: Math.max(1.2, 3.5 / Math.max(universes.primary.transport, 0.18)), repeat: Infinity, delay: particle * 0.46, ease: 'linear' }}
                  />
                ))}

                <motion.g animate={{ y: handleTop }} transition={{ type: 'spring', stiffness: 240, damping: 26 }}>
                  <rect x="282" y="-9" width="76" height="18" rx="9" fill="rgba(77,231,255,.18)" stroke="#4de7ff" />
                  <circle cx="320" cy="0" r="5" fill="#e9fdff" />
                </motion.g>
                <motion.g animate={{ y: handleBottom }} transition={{ type: 'spring', stiffness: 240, damping: 26 }}>
                  <rect x="282" y="-9" width="76" height="18" rx="9" fill="rgba(255,99,216,.16)" stroke="#ff63d8" />
                  <circle cx="320" cy="0" r="5" fill="#fff0fb" />
                </motion.g>

                <text x="32" y="32" fill="rgba(255,255,255,.30)" fontSize="10" fontWeight="700">OPEN WORLD</text>
                <text x="500" y="32" fill="rgba(255,255,255,.30)" fontSize="10" fontWeight="700">DOWNSTREAM</text>
              </svg>

              <div className="rounded-2xl border border-cyan-300/12 bg-cyan-300/[0.035] p-3">
                <div className="flex items-center justify-between gap-3 text-[9px] font-black uppercase tracking-[.14em] text-white/40"><span>Causal wave propagation</span><span>{Math.round(time)} / 100</span></div>
                <div className="mt-3"><CausalWave world={universes.primary} /></div>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-3">
              <WorldCard world={universes.baseline} />
              <WorldCard world={universes.primary} active />
              <WorldCard world={universes.alternate} />
            </div>

            <div className="rounded-3xl border border-violet-300/15 bg-violet-300/[0.035] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[.18em] text-violet-200/75">Scale tunnel</div>
                  <div className="mt-1 text-sm font-black text-white">Fall through the same authored mechanism</div>
                </div>
                <div className="flex gap-1 overflow-x-auto rounded-xl bg-black/30 p-1">
                  {BIOLOGICAL_SCALE_ORDER.map((item) => (
                    <button key={item} type="button" onClick={() => setScale(item)} className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[9px] font-black ${scale === item ? 'bg-violet-400/20 text-violet-100 ring-1 ring-violet-300/25' : 'text-white/32'}`}>{SCALE_LABELS[item]}</button>
                  ))}
                </div>
              </div>
              <motion.div key={`${domain}-${scale}`} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mt-3 grid gap-3 md:grid-cols-[.25fr_.75fr]">
                <div className="flex aspect-square items-center justify-center rounded-3xl border border-violet-300/15 bg-black/30">
                  <motion.div animate={reduceMotion ? undefined : { rotate: [0, 360] }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} className="flex h-20 w-20 items-center justify-center rounded-full border border-violet-300/35 bg-violet-300/10 shadow-[0_0_45px_rgba(156,124,255,.12)]">
                    <span className="text-[9px] font-black uppercase tracking-wide text-violet-100">{SCALE_LABELS[scale]}</span>
                  </motion.div>
                </div>
                <div className="rounded-3xl border border-white/8 bg-black/25 p-4">
                  <div className="text-[9px] font-black uppercase tracking-[.16em] text-white/35">{biologicalDomainLabel(domain)}</div>
                  <p className="mt-2 text-xs leading-relaxed text-white/52">{biologicalScaleConcept(domain, scale)}</p>
                  <div className="mt-3 text-[9px] leading-relaxed text-white/28">The scale transition changes the teaching representation, not the certainty or biological resolution of the source data.</div>
                </div>
              </motion.div>
            </div>
          </div>

          <aside className="space-y-3">
            <label className="block rounded-3xl border border-white/10 bg-black/25 p-4">
              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[.14em] text-white/45"><span>World time</span><span className="font-mono text-fuchsia-100">{Math.round(time)}</span></div>
              <input className="mt-3 w-full accent-fuchsia-300" type="range" min="0" max="100" value={time} onChange={(event) => setTime(Number(event.target.value))} />
              <div className="mt-1 text-[8px] text-white/28">Animation time only; not biological kinetics.</div>
            </label>

            <label className="block rounded-3xl border border-white/10 bg-black/25 p-4">
              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[.14em] text-white/45"><span>System reserve</span><span className="font-mono text-cyan-100">{Math.round(reserve * 100)}</span></div>
              <input className="mt-3 w-full accent-cyan-300" type="range" min="0" max="100" value={Math.round(reserve * 100)} onChange={(event) => setReserve(Number(event.target.value) / 100)} />
            </label>

            <label className="block rounded-3xl border border-white/10 bg-black/25 p-4">
              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[.14em] text-white/45"><span>Demand context</span><span className="font-mono text-amber-100">{Math.round(demand * 100)}</span></div>
              <input className="mt-3 w-full accent-amber-300" type="range" min="0" max="100" value={Math.round(demand * 100)} onChange={(event) => setDemand(Number(event.target.value) / 100)} />
            </label>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
              <div className="text-[9px] font-black uppercase tracking-[.17em] text-amber-200/80">Executable formula ledger</div>
              <div className="mt-3 space-y-2">
                {BIOLOGICAL_FORMULA_LEDGER.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/8 bg-white/[0.025] p-3">
                    <code className="text-[9px] font-bold text-cyan-100">{item.formula}</code>
                    <p className="mt-1 text-[8px] leading-relaxed text-white/32">{item.boundary}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-amber-300/18 bg-amber-300/[0.055] p-4">
              <div className="text-[9px] font-black uppercase tracking-[.18em] text-amber-200">Reality contract</div>
              <p className="mt-2 text-[10px] leading-relaxed text-amber-50/65">
                Baseline, manipulated, and alternate universes are authored synthetic teaching states. They do not infer anatomy, stenosis, obstruction, nerve injury, physiology, treatment response, prognosis, or patient-specific outcomes. Direct manipulation changes only the simulation world.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default PanaceaBiologicalUniverse
