import { useState } from 'react'
import { WHOLE_BODY_REGIONS, type AtlasLayerKey, type AtlasRegionKey } from '../../lib/wholeBodyAtlasBlueprint'

interface Props {
  onHighlight?: (nodeHints: string[]) => void
  onFocusRegion?: (nodeHints: string[]) => void
  onEnableLayer?: (layer: AtlasLayerKey) => void
}

type EvidenceState = 'reference' | 'measured' | 'simulated' | 'derived' | 'review-required'

const STATE_STYLE: Record<EvidenceState, string> = {
  reference: 'border-blue-400/30 bg-blue-500/10 text-blue-200',
  measured: 'border-brand/30 bg-brand/10 text-brand',
  simulated: 'border-violet-400/30 bg-violet-500/10 text-violet-200',
  derived: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
  'review-required': 'border-red-400/30 bg-red-500/10 text-red-200',
}

const CARE_CONTINUUM = [
  { id: 'structure', label: 'Anatomy', detail: 'Region, organ, tissue and represented 3D structure.', state: 'reference' as const },
  { id: 'function', label: 'Physiology', detail: 'System function is shown only from separately sourced teaching content.', state: 'reference' as const },
  { id: 'breath', label: 'Breathing', detail: 'Respiratory storytelling connects thorax, airway, movement and gas-exchange concepts without importing external claims.', state: 'reference' as const },
  { id: 'circulation', label: 'Circulation', detail: 'Cardiovascular anatomy, flow context and measured vitals remain distinguishable.', state: 'reference' as const },
  { id: 'measurement', label: 'Measurements', detail: 'Wearable, imaging or user-entered observations retain source, unit and timestamp.', state: 'measured' as const },
  { id: 'cellular', label: 'Cell & metabolism', detail: 'Macro anatomy can hand off to cell, molecular and metabolic teaching surfaces without pretending literal scale continuity.', state: 'reference' as const },
  { id: 'imaging', label: 'Imaging', detail: 'CT, MRI, X-ray and other images remain modality-labelled and separate from generic atlas geometry.', state: 'reference' as const },
  { id: 'disease', label: 'Disease context', detail: 'Disease and phenotype context must preserve source evidence and never convert atlas selection into diagnosis.', state: 'review-required' as const },
  { id: 'therapy', label: 'Therapeutics & surgery', detail: 'Drug and surgical education stay gated from patient-specific treatment, navigation or autonomous decisions.', state: 'review-required' as const },
  { id: 'movement', label: 'Movement & recovery', detail: 'Biomechanics, training and recovery surfaces can reuse the same body context while keeping models and measured data explicit.', state: 'simulated' as const },
]

const REQUIRED_REFERENCES = [
  {
    name: 'thebuggeddev/anatomy',
    url: 'https://github.com/thebuggeddev/anatomy',
    role: 'Required UX/architecture reference for organ library, 3D inspectability, progressive learning cards and multilingual anatomy navigation.',
    boundary: 'Repository has no verified root license in Panacea source review. Do not copy code, models, textures or medical labels until license/provenance is explicitly cleared.',
  },
  {
    name: 'Breath Atlas',
    url: 'https://breath-atlas.thebuggeddev.chatgpt.site/',
    role: 'Required respiratory interaction/storytelling reference for making breathing a visible whole-body process rather than a static lung card.',
    boundary: 'Presentation inspiration only. No respiratory physiology claim, code, asset or site content is imported without authoritative evidence and license review.',
  },
] as const

export function HolisticHealthcareAtlas({ onHighlight, onFocusRegion, onEnableLayer }: Props) {
  const [regionKey, setRegionKey] = useState<AtlasRegionKey>('thorax')
  const region = WHOLE_BODY_REGIONS.find((item) => item.key === regionKey) ?? WHOLE_BODY_REGIONS[0]

  function inspectRegion(key: AtlasRegionKey) {
    setRegionKey(key)
    const selected = WHOLE_BODY_REGIONS.find((item) => item.key === key)
    if (!selected) return
    const hints = [...new Set(selected.structures.flatMap((structure) => structure.nodeHints))]
    onHighlight?.([])
    onFocusRegion?.(hints)
    for (const layer of new Set(selected.structures.map((structure) => structure.layer))) onEnableLayer?.(layer)
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 p-5 text-white">
        <div className="text-[9px] font-black uppercase tracking-[0.22em] text-brand">Panacea · Holistic Healthcare Atlas</div>
        <h4 className="mt-2 max-w-3xl text-2xl font-black tracking-tight">One body context from anatomy to function, measurement, imaging, disease evidence, treatment education, movement and recovery.</h4>
        <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-neutral-400">This workspace does not collapse every domain into one score. It keeps anatomy reference, measured observations, simulations, derived software outputs and review-required clinical content visibly separated while letting them share the same body region context.</p>
        <div className="mt-4 grid gap-2 md:grid-cols-5">
          {(['reference', 'measured', 'simulated', 'derived', 'review-required'] as EvidenceState[]).map((state) => (
            <div key={state} className={`rounded-xl border px-3 py-2 text-[9px] font-black uppercase tracking-wide ${STATE_STYLE[state]}`}>{state.replace('-', ' ')}</div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">Whole-body context</div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {WHOLE_BODY_REGIONS.map((item) => (
              <button key={item.key} type="button" aria-pressed={regionKey === item.key} onClick={() => inspectRegion(item.key)} className={`min-h-11 rounded-xl border px-2 py-2 text-left text-[9px] font-black transition ${regionKey === item.key ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-500 dark:border-white/10 dark:text-neutral-400'}`}>{item.label}</button>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-brand/20 bg-brand/[0.04] p-3">
            <div className="text-[9px] font-black uppercase tracking-wide text-brand">Current region</div>
            <div className="mt-1 text-sm font-black text-ink dark:text-white">{region.label}</div>
            <div className="mt-1 text-[9px] text-neutral-500">{region.landmark}</div>
            <p className="mt-2 text-[9px] leading-relaxed text-neutral-500">Selecting a region changes shared 3D focus/layers only. It does not infer disease, physiology, treatment need or patient-specific anatomy.</p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {CARE_CONTINUUM.map((item, index) => (
            <article key={item.id} className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
              <div className="flex items-start justify-between gap-2"><span className="text-[9px] font-black text-neutral-400">{String(index + 1).padStart(2, '0')}</span><span className={`rounded-full border px-2 py-0.5 text-[8px] font-black ${STATE_STYLE[item.state]}`}>{item.state}</span></div>
              <h5 className="mt-2 text-sm font-black text-ink dark:text-white">{item.label}</h5>
              <p className="mt-1 text-[9px] leading-relaxed text-neutral-500">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
        <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">Mandatory external references · reference-only until cleared</div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {REQUIRED_REFERENCES.map((reference) => (
            <article key={reference.url} className="rounded-xl border border-neutral-200 p-3 dark:border-white/10">
              <div className="text-xs font-black text-ink dark:text-white">{reference.name}</div>
              <a href={reference.url} target="_blank" rel="noreferrer" className="mt-1 block break-all font-mono text-[8px] text-brand underline">{reference.url}</a>
              <p className="mt-2 text-[9px] leading-relaxed text-neutral-500">{reference.role}</p>
              <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-[8.5px] leading-relaxed text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">{reference.boundary}</div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default HolisticHealthcareAtlas
