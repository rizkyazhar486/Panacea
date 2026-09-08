import { useMemo, useState } from 'react'
import { BODY_MANDATORY_EXTERNAL_REFERENCES } from '../../lib/bodyMandatoryExternalReferences'
import { WHOLE_BODY_REGIONS, type AtlasLayerKey } from '../../lib/wholeBodyAtlasBlueprint'

interface Props {
  onHighlight?: (nodeHints: string[]) => void
  onFocusRegion?: (nodeHints: string[]) => void
  onEnableLayer?: (layer: AtlasLayerKey) => void
}

type BreathView = 'airway-lungs' | 'chest-wall' | 'mechanics-boundary'

const VIEWS: ReadonlyArray<{
  id: BreathView
  label: string
  description: string
}> = [
  {
    id: 'airway-lungs',
    label: 'Airway + lungs',
    description: 'Focus the existing provenance-bearing lungs and central-airway target in the shared Panacea Body3D viewer.',
  },
  {
    id: 'chest-wall',
    label: 'Thoracic cage',
    description: 'Show the existing rib, sternum and thoracic-vertebra source target as structural context for breathing education.',
  },
  {
    id: 'mechanics-boundary',
    label: 'Breathing mechanics boundary',
    description: 'Explain what the current atlas can and cannot represent without inventing tissue motion, pressure, volume or patient-specific physiology.',
  },
]

export function BreathAtlasReferencePanel({ onHighlight, onFocusRegion, onEnableLayer }: Props) {
  const [view, setView] = useState<BreathView>('airway-lungs')
  const thorax = useMemo(() => WHOLE_BODY_REGIONS.find((region) => region.key === 'thorax'), [])
  const lungs = thorax?.structures.find((structure) => structure.id === 'lungs-airway')
  const cage = thorax?.structures.find((structure) => structure.id === 'thoracic-cage')

  function inspect(target: typeof lungs) {
    if (!target) return
    setView(target.id === 'lungs-airway' ? 'airway-lungs' : 'chest-wall')
    onEnableLayer?.(target.layer)
    onHighlight?.([])
    onFocusRegion?.(target.nodeHints)
  }

  return (
    <section aria-labelledby="breath-atlas-reference-title" className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,0.12),transparent_38%),radial-gradient(circle_at_85%_15%,rgba(0,191,99,0.10),transparent_36%)] p-4 dark:bg-neutral-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">Breath Atlas · mandatory reference track</div>
          <h4 id="breath-atlas-reference-title" className="mt-1 text-xl font-black text-ink dark:text-white">Respiratory exploration, rebuilt on Panacea source geometry</h4>
          <p className="mt-2 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">The external references below are required design and interaction references. They are not scientific authorities. Panacea keeps anatomy truth on its own Z-Anatomy / BodyParts3D provenance path and does not remotely embed or copy unverified geometry.</p>
        </div>
        <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-3 py-2 text-[9px] font-bold leading-relaxed text-amber-800 dark:text-amber-100">Human academic review: not recorded · external asset import: blocked</div>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={view === item.id}
            onClick={() => {
              setView(item.id)
              if (item.id === 'airway-lungs') inspect(lungs)
              if (item.id === 'chest-wall') inspect(cage)
              if (item.id === 'mechanics-boundary') {
                onHighlight?.([])
                onFocusRegion?.(lungs?.nodeHints ?? [])
              }
            }}
            className={`min-h-24 rounded-2xl border p-3 text-left transition ${view === item.id ? 'border-cyan-400 bg-cyan-400/[0.08]' : 'border-neutral-200 bg-white/70 hover:border-cyan-300 dark:border-white/10 dark:bg-white/[0.02]'}`}
          >
            <div className="text-[10px] font-black text-ink dark:text-white">{item.label}</div>
            <p className="mt-1 text-[9px] leading-relaxed text-neutral-500">{item.description}</p>
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-2xl border border-neutral-200 bg-white/75 p-3 dark:border-white/10 dark:bg-white/[0.02]">
        {view === 'airway-lungs' && (
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-300">Current evidence-bearing target</div>
            <div className="mt-1 text-sm font-black text-ink dark:text-white">{lungs?.label ?? 'Lungs & central airway'}</div>
            <p className="mt-1 text-[9px] leading-relaxed text-neutral-500">Lookup hints: {(lungs?.nodeHints ?? ['lung', 'trachea', 'bronch']).join(' · ')}. These hints locate existing source geometry; they do not create bronchioles, alveoli, pleura or motion that are not represented by the shipped atlas.</p>
          </div>
        )}
        {view === 'chest-wall' && (
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-300">Structural context</div>
            <div className="mt-1 text-sm font-black text-ink dark:text-white">{cage?.label ?? 'Thoracic cage'}</div>
            <p className="mt-1 text-[9px] leading-relaxed text-neutral-500">This view uses existing skeletal source targets only. It does not infer respiratory excursion, compliance, work of breathing, or patient-specific mechanics.</p>
          </div>
        )}
        {view === 'mechanics-boundary' && (
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-600 dark:text-amber-300">Fail-closed physiology boundary</div>
            <p className="mt-1 text-[9px] leading-relaxed text-neutral-500">Breathing phases may later be represented as evidence-backed conceptual overlays, but the current generic mesh must not be deformed to imply measured diaphragm excursion, lung volume, pleural pressure, airway resistance, gas exchange or disease-specific physiology. Those require separate source data, units, provenance and review.</p>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {BODY_MANDATORY_EXTERNAL_REFERENCES.map((reference) => (
          <a key={reference.id} href={reference.url} target="_blank" rel="noreferrer" className="rounded-2xl border border-neutral-200 bg-white/70 p-3 transition hover:border-brand dark:border-white/10 dark:bg-white/[0.02]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-black text-ink dark:text-white">{reference.label}</span>
              <span className="rounded-full border border-neutral-200 px-2 py-1 text-[8px] font-black text-neutral-500 dark:border-white/10">{reference.role}</span>
            </div>
            <p className="mt-2 text-[9px] leading-relaxed text-neutral-500">{reference.note}</p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[8px] font-bold">
              <span className="rounded-full bg-amber-400/10 px-2 py-1 text-amber-700 dark:text-amber-200">not a scientific source</span>
              <span className="rounded-full bg-rose-400/10 px-2 py-1 text-rose-700 dark:text-rose-200">license verification required</span>
              <span className="rounded-full bg-blue-400/10 px-2 py-1 text-blue-700 dark:text-blue-200">{reference.verification}</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

export default BreathAtlasReferencePanel
