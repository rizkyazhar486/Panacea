import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
import type { EndoluminalLandmark, EndoluminalSegment } from '../../components/bodyhub/endoscopy/EndoluminalSim'

// Three.js, post-processing and the 3.7 MB atlas load only when the scope is opened.
const EndoluminalSim = lazy(() => import('../../components/bodyhub/endoscopy/EndoluminalSim'))
// The airway branches, so it has its own simulator: the whole tree to segmental level, entered by aiming the tip.
const BronchoscopySim = lazy(() => import('../../components/bodyhub/endoscopy/BronchoscopySim'))

type ScopeProcedureId = 'colonoscopy' | 'upper-gi' | 'bronchoscopy'

type ScopeProcedure = {
  id: ScopeProcedureId
  label: string
  shortLabel: string
  systemId: BodySystemId
  /** Insertion order. Only segments that exist as meshes in the reference atlas (it has no rectum or caecum mesh). */
  segments: readonly EndoluminalSegment[]
  /** Which end the scope enters from (metres, atlas space). */
  startNear: { x: number; y: number; z: number }
  tint: string
  vesselTone: string
  peristalsis: number
  breathing: number
}

const PROCEDURES: readonly ScopeProcedure[] = [
  {
    id: 'colonoscopy',
    label: 'Colonoscopy',
    shortLabel: 'Colon',
    systemId: 'digestive',
    segments: [
      { node: 'Sigmoid_colon', label: 'Sigmoid colon', take: 'all', wall: 'colon' },
      { node: 'Descending_colon', label: 'Descending colon', take: 'all', wall: 'colon' },
      { node: 'Transverse_colon', label: 'Transverse colon', take: 'all', wall: 'colon' },
      { node: 'Ascending_colon', label: 'Ascending colon', take: 'all', wall: 'colon' },
    ],
    startNear: { x: 0, y: 0.8, z: -0.05 },
    tint: '#f2a084',
    vesselTone: '#7a1426',
    peristalsis: 0.07,
    breathing: 0,
  },
  {
    id: 'upper-gi',
    label: 'Upper GI endoscopy',
    shortLabel: 'Upper GI',
    systemId: 'digestive',
    segments: [
      { node: 'Oesophagus', label: 'Oesophagus', take: 'all', wall: 'oesophagus' },
      { node: 'Mucosa_of_stomach', label: 'Stomach', take: 'all', wall: 'stomach' },
      { node: 'Duodenum', label: 'Duodenum', take: 'all', wall: 'duodenum' },
    ],
    startNear: { x: 0, y: 1.6, z: 0 },
    tint: '#ee9470',
    vesselTone: '#6e1020',
    peristalsis: 0.09,
    breathing: 0,
  },
  {
    id: 'bronchoscopy',
    label: 'Bronchoscopy',
    shortLabel: 'Airway',
    systemId: 'respiratory',
    segments: [
      { node: 'Trachea', label: 'Trachea', take: 'own', wall: 'trachea' },
      { node: 'Right_main_bronchus', label: 'Right main bronchus', take: 'own', wall: 'bronchus' },
      { node: 'Intermediate_bronchusr', label: 'Intermediate bronchus', take: 'own', wall: 'bronchus' },
      { node: 'Right_inferior_lobar_bronchus', label: 'Right lower lobe bronchus', take: 'own', wall: 'bronchus' },
      { node: 'Posterior_basal_segmental_bronchus_of_right_lung_(BX)', label: 'Posterior basal segment', take: 'own', wall: 'bronchus' },
    ],
    startNear: { x: 0, y: 1.6, z: 0 },
    tint: '#f3b8aa',
    vesselTone: '#8a1c2c',
    peristalsis: 0,
    breathing: 0.05,
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
  const initialProcedure = selectedSystemId === 'respiratory' ? 'bronchoscopy' : 'colonoscopy'
  const [procedureId, setProcedureId] = useState<ScopeProcedureId>(initialProcedure)
  const [progress, setProgress] = useState(0)
  const [landmarks, setLandmarks] = useState<EndoluminalLandmark[] | null>(null)
  const [jump, setJump] = useState<{ t: number; n: number } | null>(null)
  const procedure = useMemo(
    () => PROCEDURES.find((item) => item.id === procedureId) ?? PROCEDURES[0],
    [procedureId],
  )
  const stops = landmarks ?? procedure.segments.map((s) => ({ label: s.label, t: Number.NaN }))
  let pointIndex = 0
  for (let i = 0; i < stops.length; i++) if (progress >= stops[i].t) pointIndex = i

  useEffect(() => {
    onSystemChange(procedure.systemId)
  }, [onSystemChange, procedure.systemId])

  const onLandmarks = useCallback((lm: EndoluminalLandmark[]) => setLandmarks(lm), [])
  const onProgress = useCallback((t: number) => setProgress(t), [])

  function chooseProcedure(next: ScopeProcedureId) {
    setProcedureId(next)
    setLandmarks(null)
    setProgress(0)
    setJump(null)
  }

  // Training shortcut: restart the scope at the start of a segment. Before the route is computed the stops are spaced
  // evenly so the call is still well defined.
  function jumpTo(index: number) {
    const denominator = Math.max(1, stops.length - 1)
    const t = landmarks ? landmarks[index].t : index / denominator
    setJump((j) => ({ t: clamp01(t), n: (j?.n ?? 0) + 1 }))
  }

  return (
    <section
      data-virtual-endoscopy="v3-simulator"
      data-selected-source-structure={selectedSourceStructureName ?? undefined}
      data-structure-route-inference="not-inferred"
      data-patient-specific-scope-navigation="not-generated"
      className="dark flex flex-col gap-3 rounded-[24px] bg-black p-2 text-white sm:p-3"
      aria-labelledby="virtual-endoscopy-title"
      data-pmd-unclamped="true"
    >
      <div className="flex items-center justify-between gap-2 px-1 pt-1">
        <h4 id="virtual-endoscopy-title" className="text-[15px] font-black tracking-[-.01em]">{procedure.label}</h4>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto" role="tablist" aria-label="Virtual endoscopy procedure">
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
                style={active ? { background: '#fff', color: '#000', borderRadius: 9999 } : { background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.75)', borderRadius: 9999 }}
                className="min-h-[44px] shrink-0 px-3.5 text-[12px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/60"
              >
                {item.shortLabel}
              </button>
            )
          })}
        </div>
      </div>

      <Suspense fallback={<div className="grid aspect-square place-items-center rounded-[22px] bg-black text-[12px] font-bold text-white/50 sm:aspect-[16/10]">Preparing the simulator…</div>}>
        {procedure.id === 'bronchoscopy' ? (
          <BronchoscopySim key="airway" />
        ) : (
          <EndoluminalSim
            key={procedure.id}
            segments={procedure.segments}
            startNear={procedure.startNear}
            tint={procedure.tint}
            vesselTone={procedure.vesselTone}
            peristalsis={procedure.peristalsis}
            breathing={procedure.breathing}
            jump={jump}
            onLandmarks={onLandmarks}
            onProgress={onProgress}
          />
        )}
      </Suspense>

      <nav hidden={procedure.id === 'bronchoscopy'} className="no-scrollbar flex gap-2 overflow-x-auto" aria-label={`${procedure.label}: restart at a segment`}>
        {stops.map((item, index) => {
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

      <details className="px-1 text-[11px] text-white/55">
        <summary className="flex min-h-[44px] cursor-pointer items-center font-bold text-white/70">About this simulator</summary>
        <p className="pb-2 leading-relaxed">Simulated reference view · not patient anatomy or procedural navigation. Route and calibre come from Z-Anatomy / BodyParts3D reference meshes (CC BY-SA 4.0); wall motion, folds, vessels, colour and optics are simulated for teaching. Keyboard: ↑/↓ push and pull, W A S D angle the tip, Space air, Q suction. Bronchoscopy covers the whole tracheobronchial tree to the 19 segmental bronchi: aim the tip at a labelled opening and advance to enter it; withdraw past a branch origin to return. These simulations do not estimate patient geometry, lesion position, insertion distance, force, device settings, or a safe procedural trajectory.</p>
      </details>
    </section>
  )
}
