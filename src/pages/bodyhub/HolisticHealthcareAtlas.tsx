import { useMemo, useState } from 'react'
import { WHOLE_BODY_REGIONS, type AtlasLayerKey, type AtlasRegionKey } from '../../lib/wholeBodyAtlasBlueprint'

type EvidenceState = 'reference' | 'measured' | 'simulated' | 'derived' | 'review-required'
type HolisticFilter = 'all' | EvidenceState

interface Props {
  onHighlight?: (nodeHints: string[]) => void
  onFocusRegion?: (nodeHints: string[]) => void
  onEnableLayer?: (layer: AtlasLayerKey) => void
  onOpenBreathAtlas?: () => void
  onOpenZAnatomy?: () => void
}

const STATE_STYLE: Record<EvidenceState, string> = {
  reference: 'border-blue-400/30 bg-blue-500/10 text-blue-200',
  measured: 'border-brand/30 bg-brand/10 text-brand',
  simulated: 'border-violet-400/30 bg-violet-500/10 text-violet-200',
  derived: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
  'review-required': 'border-red-400/30 bg-red-500/10 text-red-200',
}

const CARE_CONTINUUM = [
  { id: 'structure', label: 'Anatomy', state: 'reference' as const, detail: 'Region, organ, tissue and represented 3D structure. Generic atlas geometry remains separate from patient anatomy.' },
  { id: 'function', label: 'Physiology', state: 'reference' as const, detail: 'System function belongs to separately sourced teaching content, not to geometry itself.' },
  { id: 'breath', label: 'Breathing', state: 'reference' as const, detail: 'Breathing links thoracic structure, respiratory motion and physiology while retaining source and review boundaries.' },
  { id: 'circulation', label: 'Circulation', state: 'reference' as const, detail: 'Cardiovascular structure, teaching flow models and measured vital signs remain distinguishable.' },
  { id: 'measurement', label: 'Measurements', state: 'measured' as const, detail: 'Wearable, imaging and user-entered observations retain source identity, unit and measurement timestamp.' },
  { id: 'cellular', label: 'Cell & metabolism', state: 'reference' as const, detail: 'Macro anatomy may hand off to cellular and metabolic teaching without implying literal scale continuity.' },
  { id: 'imaging', label: 'Imaging', state: 'reference' as const, detail: 'CT, MRI, X-ray and other modalities remain labelled and separate from generic atlas geometry.' },
  { id: 'disease', label: 'Disease context', state: 'review-required' as const, detail: 'Disease and phenotype context requires evidence and never turns body selection into diagnosis.' },
  { id: 'therapy', label: 'Therapeutics & surgery', state: 'review-required' as const, detail: 'Drug and surgical education stays gated from patient-specific treatment or procedural navigation.' },
  { id: 'movement', label: 'Movement & recovery', state: 'simulated' as const, detail: 'Biomechanics, training and recovery can reuse body context while models and recorded data stay explicit.' },
] as const

const REQUIRED_REFERENCES = [
  {
    name: 'thebuggeddev/anatomy',
    url: 'https://github.com/thebuggeddev/anatomy',
    role: 'Mandatory UX/architecture reference for searchable organ libraries, progressive 3D inspection and compact anatomy learning flows.',
    boundary: 'Reference-only until exact code/asset licensing and provenance are verified. Public repository visibility is not reuse permission.',
  },
  {
    name: 'Breath Atlas',
    url: 'https://breath-atlas.thebuggeddev.chatgpt.site/',
    role: 'Mandatory respiratory interaction/storytelling reference. Panacea reuses its own Breath Atlas implementation and separately reviewed sources.',
    boundary: 'Do not embed, scrape or copy hosted content. Respiratory claims require their own authoritative source and Academic Accuracy review.',
  },
] as const

const FILTERS: HolisticFilter[] = ['all', 'reference', 'measured', 'simulated', 'derived', 'review-required']

export function HolisticHealthcareAtlas({ onHighlight, onFocusRegion, onEnableLayer, onOpenBreathAtlas, onOpenZAnatomy }: Props) {
  const [regionKey, setRegionKey] = useState<AtlasRegionKey>('thorax')
  const [filter, setFilter] = useState<HolisticFilter>('all')
  const [query, setQuery] = useState('')
  const region = WHOLE_BODY_REGIONS.find((item) => item.key === regionKey) ?? WHOLE_BODY_REGIONS[0]
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const visibleContinuum = useMemo(() => CARE_CONTINUUM.filter((item) =>
    (filter === 'all' || item.state === filter) &&
    (!normalizedQuery || `${item.label} ${item.detail} ${item.state}`.toLocaleLowerCase().includes(normalizedQuery)),
  ), [filter, normalizedQuery])

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
        <h4 className="mt-2 max-w-3xl text-2xl font-black tracking-tight">One body context from anatomy and breathing to measurements, evidence, treatment education, movement and recovery.</h4>
        <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-neutral-400">Holistic means connected context, not one opaque score. Reference anatomy, measured observations, simulations, derived software outputs and review-required clinical material remain visibly distinct.</p>
        <div className="mt-4 grid gap-2 md:grid-cols-5">
          {(['reference', 'measured', 'simulated', 'derived', 'review-required'] as EvidenceState[]).map((state) => <div key={state} className={`rounded-xl border px-3 py-2 text-[9px] font-black uppercase tracking-wide ${STATE_STYLE[state]}`}>{state.replace('-', ' ')}</div>)}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="space-y-3">
          <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">Whole-body context</div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {WHOLE_BODY_REGIONS.map((item) => <button key={item.key} type="button" aria-pressed={regionKey === item.key} onClick={() => inspectRegion(item.key)} className={`min-h-11 rounded-xl border px-2 py-2 text-left text-[9px] font-black transition ${regionKey === item.key ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-500 dark:border-white/10 dark:text-neutral-400'}`}>{item.label}</button>)}
            </div>
            <div className="mt-3 rounded-xl border border-brand/20 bg-brand/[0.04] p-3">
              <div className="text-[9px] font-black uppercase tracking-wide text-brand">Current region</div>
              <div className="mt-1 text-sm font-black text-ink dark:text-white">{region.label}</div>
              <div className="mt-1 text-[9px] text-neutral-500">{region.landmark}</div>
              <p className="mt-2 text-[9px] leading-relaxed text-neutral-500">Region selection changes shared 3D focus/layers only. It does not infer disease, treatment need, physiology or patient-specific anatomy.</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={onOpenZAnatomy} className="min-h-11 rounded-xl border border-blue-300 px-3 text-[10px] font-black text-blue-600 dark:border-blue-500/30 dark:text-blue-300">Open anatomy atlas</button>
              <button type="button" onClick={onOpenBreathAtlas} className="min-h-11 rounded-xl border border-brand px-3 text-[10px] font-black text-brand">Open Breath Atlas</button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
            <label htmlFor="holistic-domain-search" className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">Find a healthcare layer</label>
            <input id="holistic-domain-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search anatomy, breathing, imaging, recovery…" className="mt-2 min-h-11 w-full rounded-xl border border-neutral-200 bg-transparent px-3 text-xs text-ink outline-none focus:border-brand dark:border-white/10 dark:text-white" />
            <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Evidence state filter">
              {FILTERS.map((item) => <button key={item} type="button" aria-pressed={filter === item} onClick={() => setFilter(item)} className={`rounded-full border px-2.5 py-1 text-[9px] font-bold ${filter === item ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-500 dark:border-white/10'}`}>{item.replace('-', ' ')}</button>)}
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3" aria-live="polite">
            {visibleContinuum.map((item, index) => <article key={item.id} className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10"><div className="flex items-start justify-between gap-2"><span className="text-[9px] font-black text-neutral-400">{String(index + 1).padStart(2, '0')}</span><span className={`rounded-full border px-2 py-0.5 text-[8px] font-black ${STATE_STYLE[item.state]}`}>{item.state}</span></div><h5 className="mt-2 text-sm font-black text-ink dark:text-white">{item.label}</h5><p className="mt-1 text-[9px] leading-relaxed text-neutral-500">{item.detail}</p></article>)}
            {!visibleContinuum.length && <div className="rounded-2xl border border-dashed border-neutral-200 p-4 text-[10px] text-neutral-500 dark:border-white/10">No healthcare layer matches this local filter. No content was synthesized.</div>}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
        <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">Mandatory references · provenance before reuse</div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {REQUIRED_REFERENCES.map((reference) => <article key={reference.url} className="rounded-xl border border-neutral-200 p-3 dark:border-white/10"><div className="text-xs font-black text-ink dark:text-white">{reference.name}</div><a href={reference.url} target="_blank" rel="noreferrer" className="mt-1 block break-all font-mono text-[8px] text-brand underline">{reference.url}</a><p className="mt-2 text-[9px] leading-relaxed text-neutral-500">{reference.role}</p><div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-[8.5px] leading-relaxed text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">{reference.boundary}</div></article>)}
        </div>
      </section>
    </div>
  )
}

export default HolisticHealthcareAtlas
