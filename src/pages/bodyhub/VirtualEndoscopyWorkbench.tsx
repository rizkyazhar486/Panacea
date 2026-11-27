import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
import type { EndoluminalRoute, EndoluminalSegment } from '../../components/bodyhub/EndoluminalView3D'

// Three.js and the 3.7 MB atlas load only when the scope is opened.
const EndoluminalView3D = lazy(() => import('../../components/bodyhub/EndoluminalView3D'))

type ScopeProcedureId = 'colonoscopy' | 'upper-gi' | 'bronchoscopy'

type ScopeProcedure = {
  id: ScopeProcedureId
  label: string
  shortLabel: string
  systemId: BodySystemId
  /** Insertion order. Only segments that exist as meshes in the reference atlas; no rectum/caecum mesh, so none shown. */
  segments: readonly EndoluminalSegment[]
  /** Which end the scope enters from (metres, atlas space). */
  startNear: { x: number; y: number; z: number }
  tint: string
}

const PROCEDURES: readonly ScopeProcedure[] = [
  {
    id: 'colonoscopy',
    label: 'Colonoscopy',
    shortLabel: 'Colon',
    systemId: 'digestive',
    segments: [
      { node: 'Sigmoid_colon', label: 'Sigmoid colon', take: 'all' },
      { node: 'Descending_colon', label: 'Descending colon', take: 'all' },
      { node: 'Transverse_colon', label: 'Transverse colon', take: 'all' },
      { node: 'Ascending_colon', label: 'Ascending colon', take: 'all' },
    ],
    startNear: { x: 0, y: 0.8, z: -0.05 },
    tint: '#c9614f',
  },
  {
    id: 'upper-gi',
    label: 'Upper GI endoscopy',
    shortLabel: 'Upper GI',
    systemId: 'digestive',
    segments: [
      { node: 'Oesophagus', label: 'Oesophagus', take: 'all' },
      { node: 'Mucosa_of_stomach', label: 'Stomach', take: 'all' },
      { node: 'Duodenum', label: 'Duodenum', take: 'all' },
    ],
    startNear: { x: 0, y: 1.6, z: 0 },
    tint: '#c8634a',
  },
  {
    id: 'bronchoscopy',
    label: 'Bronchoscopy',
    shortLabel: 'Airway',
    systemId: 'respiratory',
    segments: [
      { node: 'Trachea', label: 'Trachea', take: 'own' },
      { node: 'Right_main_bronchus', label: 'Right main bronchus', take: 'own' },
      { node: 'Intermediate_bronchusr', label: 'Intermediate bronchus', take: 'own' },
      { node: 'Right_inferior_lobar_bronchus', label: 'Right lower lobe bronchus', take: 'own' },
      { node: 'Posterior_basal_segmental_bronchus_of_right_lung_(BX)', label: 'Posterior basal segment', take: 'own' },
    ],
    startNear: { x: 0, y: 1.6, z: 0 },
    tint: '#d99a8c',
  },
] as const

interface VirtualEndoscopyWorkbenchProps {
  selectedSystemId: BodySystemId
  selectedSourceStructureName?: string | null
  onSystemChange: (systemId: BodySystemId) => void
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))
const PILL = 'min-h-[44px] shrink-0 rounded-full px-4 text-[12px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/60'

export default function VirtualEndoscopyWorkbench({
  selectedSystemId,
  selectedSourceStructureName,
  onSystemChange,
}: VirtualEndoscopyWorkbenchProps) {
  const reducedMotion = useReducedMotion()
  const initialProcedure = selectedSystemId === 'respiratory' ? 'bronchoscopy' : 'colonoscopy'
  const [procedureId, setProcedureId] = useState<ScopeProcedureId>(initialProcedure)
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [route, setRoute] = useState<EndoluminalRoute | null>(null)
  const procedure = useMemo(
    () => PROCEDURES.find((item) => item.id === procedureId) ?? PROCEDURES[0],
    [procedureId],
  )
  const landmarks = route?.landmarks ?? procedure.segments.map((s, i, all) => ({ label: s.label, t: i / Math.max(1, all.length - 1) }))
  let pointIndex = 0
  for (let i = 0; i < landmarks.length; i++) if (progress >= landmarks[i].t) pointIndex = i
  const point = landmarks[pointIndex]

  useEffect(() => {
    onSystemChange(procedure.systemId)
  }, [onSystemChange, procedure.systemId])

  useEffect(() => {
    if (!playing || reducedMotion) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      let selesai = false
      setProgress((current) => {
        const next = clamp01(current + dt * 0.022)
        if (next >= 1) selesai = true
        return next
      })
      if (selesai) setPlaying(false)
      else raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, reducedMotion])

  const onRoute = useCallback((r: EndoluminalRoute | null) => setRoute(r), [])

  function chooseProcedure(next: ScopeProcedureId) {
    setProcedureId(next)
    setRoute(null)
    setProgress(0)
    setPlaying(false)
  }

  function jumpTo(index: number) {
    const denominator = Math.max(1, landmarks.length - 1)
    setProgress(route ? landmarks[index].t : index / denominator)
    setPlaying(false)
  }

  // Position on the route map: last centre-line point at or before the scope.
  const mapPath = route?.map.length ? route.map.map((m, i) => `${i ? 'L' : 'M'}${m.x.toFixed(1)} ${m.y.toFixed(1)}`).join(' ') : ''
  const here = route?.map.length ? route.map.reduce((best, m) => (m.t <= progress ? m : best), route.map[0]) : null
  const cm = route ? Math.round(progress * route.lengthCm) : null

  return (
    <section
      data-virtual-endoscopy="v2"
      data-selected-source-structure={selectedSourceStructureName ?? undefined}
      data-structure-route-inference="not-inferred"
      data-patient-specific-scope-navigation="not-generated"
      className="dark overflow-hidden rounded-[24px] bg-black text-white"
      aria-labelledby="virtual-endoscopy-title"
      data-pmd-unclamped="true"
    >
      <div className="relative aspect-[4/5] w-full sm:aspect-[16/9]">
        <Suspense fallback={<div className="absolute inset-0 grid place-items-center text-[11px] font-bold text-white/50">Loading 3D scope…</div>}>
          <EndoluminalView3D
            key={procedure.id}
            segments={procedure.segments}
            startNear={procedure.startNear}
            tint={procedure.tint}
            t={progress}
            onRoute={onRoute}
          />
        </Suspense>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 bg-gradient-to-b from-black/70 to-transparent p-4">
          <div className="min-w-0">
            <h4 id="virtual-endoscopy-title" className="text-[15px] font-black tracking-[-.01em] text-white">{procedure.label}</h4>
            <p className="mt-0.5 text-[11px] font-semibold text-white/60">{point.label}{cm !== null ? ` · ${cm} cm` : ''}</p>
          </div>
          {mapPath && here && (
            <svg viewBox="0 0 100 100" className="h-[86px] w-[86px] shrink-0 rounded-[14px] bg-black/45 backdrop-blur-md" role="img" aria-label={`${procedure.label} route seen from the front`}>
              <path d={mapPath} fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              <path d={mapPath} fill="none" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={here.x} cy={here.y} r="5" fill="#fff" />
              <text x="5" y="96" fontSize="10" fontWeight="800" fill="rgba(255,255,255,.55)">R</text>
              <text x="88" y="96" fontSize="10" fontWeight="800" fill="rgba(255,255,255,.55)">L</text>
            </svg>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-10">
          <button
            type="button"
            aria-label={playing ? 'Pause simulated scope' : 'Play simulated scope'}
            onClick={() => { if (progress >= 1) setProgress(0); setPlaying((value) => !value) }}
            style={{ background: '#fff', color: '#000', borderRadius: 9999 }}
            data-pmd-native="true"
            className="grid h-12 w-12 shrink-0 place-items-center text-base font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/70"
          >
            {playing ? 'Ⅱ' : '▶'}
          </button>
          <input
            type="range"
            min={0}
            max={1000}
            step={1}
            value={Math.round(progress * 1000)}
            onChange={(event) => { setProgress(clamp01(Number(event.target.value) / 1000)); setPlaying(false) }}
            aria-label="Simulated route progress"
            className="h-11 min-w-0 flex-1 cursor-pointer accent-rose-300"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 p-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto" role="tablist" aria-label="Virtual endoscopy procedure">
          {PROCEDURES.map((item) => {
            const active = item.id === procedure.id
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => chooseProcedure(item.id)}
                data-pmd-native="true"
                style={active ? { background: '#fff', color: '#000' } : { background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.75)' }}
                className={PILL}
              >
                {item.shortLabel}
              </button>
            )
          })}
        </div>

        <nav className="no-scrollbar flex gap-2 overflow-x-auto" aria-label={`${procedure.label} landmarks`}>
          {landmarks.map((item, index) => {
            const active = index === pointIndex
            return (
              <button
                key={item.label}
                type="button"
                aria-current={active ? 'step' : undefined}
                onClick={() => jumpTo(index)}
                data-pmd-native="true"
                style={{ background: 'transparent', border: `1px solid ${active ? 'rgba(253,164,175,.7)' : 'rgba(255,255,255,.14)'}`, color: active ? '#fff' : 'rgba(255,255,255,.62)', borderRadius: 9999 }}
                className="min-h-[44px] shrink-0 px-4 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/60"
              >
                {item.label}
              </button>
            )
          })}
        </nav>

        <details className="rounded-[14px] px-1 text-[11px] text-white/55">
          <summary className="flex min-h-[44px] cursor-pointer items-center font-bold text-white/70">About this view</summary>
          <p className="pb-2 leading-relaxed">Simulated reference view · not patient anatomy or procedural navigation. The camera travels inside Z-Anatomy / BodyParts3D reference meshes (CC BY-SA 4.0) along a centre line computed from them; drag to look at the wall. Colour and lighting are illustrative. These views do not estimate patient geometry, lesion position, insertion distance, force, device settings, or a safe procedural trajectory.</p>
        </details>
      </div>
    </section>
  )
}
