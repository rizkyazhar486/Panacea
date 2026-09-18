import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'

type ScopeProcedureId = 'colonoscopy' | 'upper-gi' | 'bronchoscopy'

type RoutePoint = {
  label: string
  x: number
  y: number
}

type ScopeProcedure = {
  id: ScopeProcedureId
  label: string
  shortLabel: string
  systemId: BodySystemId
  routeLabel: string
  path: string
  points: RoutePoint[]
  lumen: string
}

const PROCEDURES: readonly ScopeProcedure[] = [
  {
    id: 'colonoscopy',
    label: 'Colonoscopy',
    shortLabel: 'Colon',
    systemId: 'digestive',
    routeLabel: 'Lower GI · schematic route',
    path: 'M50 88 C38 92 28 88 22 77 C17 68 18 54 18 42 C18 25 29 16 44 16 H62 C75 16 82 25 82 39 V66 C82 75 79 80 74 83',
    points: [
      { label: 'Rectum', x: 50, y: 88 },
      { label: 'Sigmoid', x: 24, y: 76 },
      { label: 'Descending', x: 18, y: 44 },
      { label: 'Transverse', x: 48, y: 16 },
      { label: 'Ascending', x: 82, y: 42 },
      { label: 'Cecum', x: 76, y: 82 },
    ],
    lumen: 'radial-gradient(circle at 50% 52%, #1b070b 0 6%, #4f161d 7% 14%, #8c3c44 15% 23%, #bd6a68 24% 34%, #d98f82 35% 47%, #a74b4d 48% 58%, #5d1b24 72%, #16060a 100%)',
  },
  {
    id: 'upper-gi',
    label: 'Upper GI endoscopy',
    shortLabel: 'Upper GI',
    systemId: 'digestive',
    routeLabel: 'Upper GI · schematic route',
    path: 'M48 10 C48 25 49 36 50 46 C51 56 43 61 38 68 C30 79 39 91 56 88 C73 85 76 71 66 64 C59 59 57 55 58 50',
    points: [
      { label: 'Esophagus', x: 48, y: 18 },
      { label: 'GE junction', x: 50, y: 48 },
      { label: 'Stomach', x: 38, y: 70 },
      { label: 'Pylorus', x: 58, y: 86 },
      { label: 'Duodenum', x: 69, y: 67 },
    ],
    lumen: 'radial-gradient(circle at 53% 48%, #1d0806 0 7%, #572019 8% 15%, #a04b36 16% 25%, #d38a64 26% 38%, #edb28a 39% 48%, #b86549 49% 60%, #64251d 73%, #160704 100%)',
  },
  {
    id: 'bronchoscopy',
    label: 'Bronchoscopy',
    shortLabel: 'Airway',
    systemId: 'respiratory',
    routeLabel: 'Airway · schematic route',
    path: 'M50 10 V48 M50 48 C42 56 34 64 27 79 M50 48 C58 56 66 64 74 79 M37 61 L24 68 M63 61 L77 68',
    points: [
      { label: 'Trachea', x: 50, y: 18 },
      { label: 'Carina', x: 50, y: 48 },
      { label: 'Right main bronchus', x: 69, y: 66 },
      { label: 'Left main bronchus', x: 32, y: 66 },
    ],
    lumen: 'radial-gradient(circle at 50% 50%, #071114 0 8%, #18383a 9% 17%, #3f6e6a 18% 27%, #7aa69a 28% 39%, #b9cab9 40% 49%, #69867d 50% 60%, #294844 73%, #071012 100%)',
  },
] as const

interface VirtualEndoscopyWorkbenchProps {
  selectedSystemId: BodySystemId
  selectedSourceStructureName?: string | null
  onSystemChange: (systemId: BodySystemId) => void
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

export default function VirtualEndoscopyWorkbench({
  selectedSystemId,
  selectedSourceStructureName,
  onSystemChange,
}: VirtualEndoscopyWorkbenchProps) {
  const reducedMotion = useReducedMotion()
  const initialProcedure = selectedSystemId === 'respiratory' ? 'bronchoscopy' : 'colonoscopy'
  const [procedureId, setProcedureId] = useState<ScopeProcedureId>(initialProcedure)
  const [progress, setProgress] = useState(0.18)
  const [playing, setPlaying] = useState(false)
  const procedure = useMemo(
    () => PROCEDURES.find((item) => item.id === procedureId) ?? PROCEDURES[0],
    [procedureId],
  )
  const pointIndex = Math.min(procedure.points.length - 1, Math.round(progress * (procedure.points.length - 1)))
  const point = procedure.points[pointIndex]
  const progressPercent = Math.round(progress * 100)

  useEffect(() => {
    onSystemChange(procedure.systemId)
  }, [onSystemChange, procedure.systemId])

  useEffect(() => {
    if (!playing || reducedMotion) return
    const id = window.setInterval(() => {
      setProgress((current) => {
        const next = clamp01(current + 0.004)
        if (next >= 1) setPlaying(false)
        return next
      })
    }, 80)
    return () => window.clearInterval(id)
  }, [playing, reducedMotion])

  function chooseProcedure(next: ScopeProcedureId) {
    setProcedureId(next)
    setProgress(0.12)
    setPlaying(false)
  }

  function jumpTo(index: number) {
    const denominator = Math.max(1, procedure.points.length - 1)
    setProgress(index / denominator)
    setPlaying(false)
  }

  return (
    <section
      data-virtual-endoscopy="v1"
      data-selected-source-structure={selectedSourceStructureName ?? undefined}
      data-structure-route-inference="not-inferred"
      data-patient-specific-scope-navigation="not-generated"
      className="overflow-hidden rounded-[24px] border border-white/[.08] bg-[#030405] text-white"
      aria-labelledby="virtual-endoscopy-title"
    >
      <header className="flex flex-col gap-3 border-b border-white/[.07] p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="text-[9px] font-black uppercase tracking-[.2em] text-rose-200/65">Virtual scope · educational simulation</div>
          <h4 id="virtual-endoscopy-title" className="mt-1 text-base font-black tracking-[-.02em] sm:text-lg">Navigate the lumen, keep the anatomy map visible.</h4>
          <p className="mt-1 truncate text-[10px] font-bold text-white/38">Simulated reference view · not patient anatomy or procedural navigation</p>
        </div>

        <div className="no-scrollbar flex max-w-full gap-1.5 overflow-x-auto" role="tablist" aria-label="Virtual endoscopy procedure">
          {PROCEDURES.map((item) => {
            const active = item.id === procedure.id
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => chooseProcedure(item.id)}
                className={`min-h-[42px] shrink-0 rounded-full border px-3 text-[10px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/55 ${active ? 'border-rose-300/30 bg-rose-300/[.12] text-white' : 'border-white/[.08] bg-white/[.025] text-white/45 hover:bg-white/[.055] hover:text-white/80'}`}
              >
                {item.shortLabel}
              </button>
            )
          })}
        </div>
      </header>

      <div className="grid gap-2 p-2 sm:p-3 lg:grid-cols-[180px_minmax(0,1fr)_230px]">
        <nav className="order-2 rounded-[20px] border border-white/[.07] bg-white/[.025] p-2 lg:order-1" aria-label={`${procedure.label} landmarks`}>
          <div className="px-1 text-[8px] font-black uppercase tracking-[.16em] text-white/28">Anatomy navigator</div>
          <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto lg:block lg:space-y-1.5 lg:overflow-visible">
            {procedure.points.map((item, index) => {
              const active = index === pointIndex
              return (
                <button
                  key={item.label}
                  type="button"
                  aria-current={active ? 'step' : undefined}
                  onClick={() => jumpTo(index)}
                  className={`min-h-[42px] shrink-0 rounded-[14px] border px-3 text-left text-[10px] font-bold transition lg:w-full ${active ? 'border-rose-300/25 bg-rose-300/[.1] text-rose-50' : 'border-transparent bg-transparent text-white/42 hover:border-white/[.07] hover:bg-white/[.04] hover:text-white/75'}`}
                >
                  <span className="block truncate">{item.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        <div className="order-1 min-w-0 overflow-hidden rounded-[22px] border border-white/[.08] bg-black lg:order-2">
          <div className="relative aspect-[4/3] min-h-[280px] overflow-hidden sm:aspect-[16/10]">
            <motion.div
              key={procedure.id}
              className="absolute inset-0"
              style={{ background: procedure.lumen }}
              initial={reducedMotion ? false : { opacity: 0.45, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 + progress * 0.045 }}
              transition={{ type: 'spring', stiffness: 72, damping: 18 }}
              aria-hidden
            />

            {[0, 1, 2, 3].map((ring) => (
              <motion.div
                key={ring}
                aria-hidden
                className="absolute left-1/2 top-1/2 rounded-[46%] border border-white/[.13] shadow-[0_0_24px_rgba(255,210,200,.06)]"
                style={{
                  width: `${38 + ring * 16}%`,
                  height: `${28 + ring * 15}%`,
                  marginLeft: `${-(19 + ring * 8)}%`,
                  marginTop: `${-(14 + ring * 7.5)}%`,
                }}
                animate={reducedMotion ? undefined : {
                  rotate: playing ? [ring * 5, ring * 5 + 5, ring * 5] : ring * 5,
                  scale: playing ? [1, 1.025, 1] : 1,
                  opacity: [0.32, 0.58, 0.32],
                }}
                transition={{ duration: 2.8 + ring * 0.4, repeat: playing ? Infinity : 0, ease: 'easeInOut' }}
              />
            ))}

            <motion.div
              aria-hidden
              className="absolute left-1/2 top-1/2 h-[18%] w-[15%] -translate-x-1/2 -translate-y-1/2 rounded-[48%] bg-black/88 shadow-[0_0_36px_rgba(0,0,0,.9)]"
              animate={reducedMotion ? undefined : playing ? { scale: [0.92, 1.06, 0.92] } : { scale: 1 }}
              transition={{ duration: 2.1, repeat: playing ? Infinity : 0, ease: 'easeInOut' }}
            />

            <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2 text-[9px] font-black uppercase tracking-[.13em]">
              <span className="rounded-full border border-white/[.08] bg-black/45 px-2.5 py-1 text-white/68 backdrop-blur-md">{procedure.label}</span>
              <span className="rounded-full border border-rose-300/20 bg-rose-300/[.08] px-2.5 py-1 text-rose-100/75 backdrop-blur-md">SIM · {progressPercent}%</span>
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
              <div className="min-w-0 rounded-[16px] border border-white/[.08] bg-black/48 px-3 py-2 backdrop-blur-md">
                <div className="text-[8px] font-black uppercase tracking-[.15em] text-white/30">Current landmark</div>
                <div className="mt-0.5 truncate text-sm font-black text-white/88">{point.label}</div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  aria-label="Restart simulated scope"
                  onClick={() => { setProgress(0); setPlaying(false) }}
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/[.1] bg-black/48 text-sm font-black text-white/72 backdrop-blur-md transition hover:bg-white/[.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/55"
                >
                  ↺
                </button>
                <button
                  type="button"
                  aria-label={playing ? 'Pause simulated scope' : 'Play simulated scope'}
                  onClick={() => setPlaying((value) => !value)}
                  className="grid h-11 min-w-11 place-items-center rounded-full border border-rose-300/25 bg-rose-300/[.12] px-3 text-sm font-black text-rose-50 transition hover:bg-rose-300/[.18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/55"
                >
                  {playing ? 'Ⅱ' : '▶'}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-white/[.07] px-3 py-3">
            <div className="flex items-center gap-3">
              <span className="w-10 text-[9px] font-black tabular-nums text-white/38">0%</span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={progressPercent}
                onChange={(event) => { setProgress(Number(event.target.value) / 100); setPlaying(false) }}
                aria-label="Simulated route progress"
                className="h-11 min-w-0 flex-1 cursor-pointer accent-rose-300"
              />
              <span className="w-10 text-right text-[9px] font-black tabular-nums text-white/38">100%</span>
            </div>
          </div>
        </div>

        <aside className="order-3 rounded-[20px] border border-white/[.07] bg-white/[.025] p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[8px] font-black uppercase tracking-[.16em] text-white/28">Route map</div>
              <div className="mt-0.5 text-[10px] font-black text-white/66">{procedure.routeLabel}</div>
            </div>
            <span className="text-[10px] font-black tabular-nums text-rose-100/70">{progressPercent}%</span>
          </div>

          <div className="mt-3 grid place-items-center rounded-[18px] border border-white/[.06] bg-black/28 p-2">
            <svg viewBox="0 0 100 100" className="aspect-square w-full max-w-[190px]" role="img" aria-label={`${procedure.label} schematic route`}>
              <path d={procedure.path} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              <path d={procedure.path} fill="none" stroke="rgba(251,113,133,.55)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              {procedure.points.map((item, index) => {
                const active = index === pointIndex
                const passed = index <= pointIndex
                return (
                  <g key={item.label}>
                    <circle cx={item.x} cy={item.y} r={active ? 4 : 2.6} fill={active ? '#fecdd3' : passed ? '#fb7185' : '#52525b'} />
                    {active && <circle cx={item.x} cy={item.y} r="7" fill="none" stroke="rgba(254,205,211,.45)" strokeWidth="1" />}
                  </g>
                )
              })}
            </svg>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-1.5">
            <div className="rounded-[14px] border border-white/[.06] bg-black/20 px-2.5 py-2">
              <div className="text-[8px] font-black uppercase tracking-[.13em] text-white/25">System</div>
              <div className="mt-0.5 truncate text-[10px] font-black text-white/68">{procedure.systemId === 'digestive' ? 'Digestive' : 'Respiratory'}</div>
            </div>
            <div className="rounded-[14px] border border-white/[.06] bg-black/20 px-2.5 py-2">
              <div className="text-[8px] font-black uppercase tracking-[.13em] text-white/25">Position</div>
              <div className="mt-0.5 truncate text-[10px] font-black text-white/68">{point.label}</div>
            </div>
          </div>

          <details className="mt-3 rounded-[14px] border border-white/[.06] bg-black/20 px-3 py-2 text-[9px] text-white/42">
            <summary className="min-h-7 cursor-pointer font-black text-white/66">How to use</summary>
            <p className="mt-1 leading-relaxed">Tap a landmark, drag the route slider, or play the teaching path. The route and lumen are schematic simulations only; they do not estimate patient geometry, lesion position, insertion distance, force, device settings, or a safe procedural trajectory.</p>
          </details>
        </aside>
      </div>
    </section>
  )
}
