import { lazy, Suspense, useMemo, useState } from 'react'
import {
  getBodyMultisystemReferenceBoundary,
  getBodyMultisystemScaleView,
  listBodyMultisystemDomains,
  listBodyMultisystemScaleViews,
} from '../../lib/bodyMultisystemScaleAdapter'
import type { KnowledgeScale } from '../../lib/multisystemKnowledgeGraph'
import {
  EYE_ORBIT_ADNEXA_WAVE13,
  EYE_ORBIT_ADNEXA_WAVE13_BOUNDARY,
  type EyeOrbitAdnexaDomain,
} from '../../lib/anatomy/eyeOrbitAdnexaWave13'

const Ocular4DAtlas = lazy(() => import('../../components/digital-twin/Ocular4DAtlas'))

const SCALE_GROUPS: readonly { label: string; scales: readonly KnowledgeScale[] }[] = [
  { label: 'Body', scales: ['whole-body', 'system', 'organ'] },
  { label: 'Micro', scales: ['tissue', 'cell', 'organelle'] },
  { label: 'Molecular', scales: ['molecular-pathway', 'protein', 'rna', 'dna-epigenome'] },
  { label: 'Control', scales: ['neural-circuit', 'endocrine-signal', 'cognition-behavior'] },
  { label: 'Life course', scales: ['development-regeneration', 'aging-longevity'] },
]

const REPRESENTATION_LABEL = {
  'spatial-3d': 'Spatial 3D',
  'microanatomy-reference': 'Microanatomy',
  'cellular-diagram': 'Cellular view',
  'molecular-network': 'Molecular network',
  'neural-network': 'Neural network',
  'endocrine-network': 'Endocrine network',
  'cognition-network-model': 'Distributed cognition model',
  'regeneration-timeline': 'Lineage / timeline',
  'longevity-research-map': 'Longevity research map',
} as const

const EYE_DOMAIN_LABEL: Record<EyeOrbitAdnexaDomain, string> = {
  orbit: 'Orbit',
  'extraocular-muscle': 'Extraocular muscles',
  eyelid: 'Eyelid / levator',
  lacrimal: 'Lacrimal system',
  neurovascular: 'Neurovascular',
}

export default function MultisystemScaleNavigator() {
  const [scale, setScale] = useState<KnowledgeScale>('whole-body')
  const [eyeOpen, setEyeOpen] = useState(false)
  const selected = getBodyMultisystemScaleView(scale)
  const domains = useMemo(() => listBodyMultisystemDomains(scale), [scale])
  const boundary = getBodyMultisystemReferenceBoundary()
  const views = listBodyMultisystemScaleViews()
  const eyeReferenceGroups = useMemo(() => {
    const groups = new Map<EyeOrbitAdnexaDomain, typeof EYE_ORBIT_ADNEXA_WAVE13>()
    for (const item of EYE_ORBIT_ADNEXA_WAVE13) {
      const current = groups.get(item.domain) ?? []
      groups.set(item.domain, [...current, item])
    }
    return [...groups.entries()]
  }, [])

  return (
    <section data-body-multisystem-scale-navigator="v1" data-selected-scale={selected.scale} className="rounded-2xl border border-neutral-200 bg-white/80 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-brand">Body → RNA → brain → longevity</div>
          <h4 className="mt-1 text-sm font-black text-ink dark:text-white">Multisystem scale navigator</h4>
          <p className="mt-1 max-w-2xl text-[10px] leading-relaxed text-neutral-500">Move across biological scales while changing representation when 3D gross anatomy is no longer scientifically appropriate.</p>
        </div>
        <div className="rounded-full border border-neutral-200 px-2 py-1 text-[9px] font-bold text-neutral-500 dark:border-white/10">{views.length} scales</div>
      </div>

      <div className="mt-3 rounded-2xl border border-sky-200 bg-sky-50/70 p-3 dark:border-sky-300/20 dark:bg-sky-300/[.06]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">Current organ benchmark</div>
            <div className="mt-1 text-sm font-black text-neutral-950 dark:text-white">Eye 4D Gold Standard</div>
            <p className="mt-1 max-w-2xl text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">Open the ocular atlas directly inside Body Exposure to inspect the globe, optical media, retina, visual pathway, orbit, extraocular muscles, lacrimal system and source-backed neurovascular reference coverage without leaving the whole-body learning flow.</p>
          </div>
          <button
            type="button"
            aria-expanded={eyeOpen}
            onClick={() => setEyeOpen((value) => !value)}
            className="min-h-11 shrink-0 rounded-xl border border-sky-300 bg-white px-4 text-[10px] font-black text-sky-800 shadow-sm transition hover:bg-sky-100 dark:border-sky-300/30 dark:bg-white/5 dark:text-sky-200 dark:hover:bg-white/10"
          >
            {eyeOpen ? 'Close Eye 4D' : 'Open Eye 4D'}
          </button>
        </div>
      </div>

      {eyeOpen && (
        <div className="mt-3 space-y-3">
          <div className="overflow-hidden rounded-2xl border border-sky-200 bg-white p-2 dark:border-sky-300/20 dark:bg-[#080c10] sm:p-3">
            <Suspense fallback={<div role="status" className="flex min-h-40 items-center justify-center text-xs font-bold text-neutral-500">Loading Eye 4D atlas…</div>}>
              <Ocular4DAtlas />
            </Suspense>
          </div>

          <section className="rounded-2xl border border-violet-200 bg-violet-50/70 p-3 dark:border-violet-300/20 dark:bg-violet-300/[.05]" aria-label="Eye orbit and adnexa reference map">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">Orbit & adnexa reference map</div>
                <h5 className="mt-1 text-sm font-black text-neutral-950 dark:text-white">Orbit → muscles → lacrimal → vessels</h5>
                <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">These structures are exposed as educational reference coverage now. They are not promoted to verified 3D geometry until exact compatible source geometry, asset-level provenance and qualified academic review exist.</p>
              </div>
              <div className="rounded-full border border-violet-200 bg-white px-2.5 py-1 text-[9px] font-black text-violet-700 dark:border-violet-300/20 dark:bg-white/5 dark:text-violet-200">{EYE_ORBIT_ADNEXA_WAVE13.length} mapped structures</div>
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {eyeReferenceGroups.map(([domain, items]) => (
                <article key={domain} className="rounded-xl border border-violet-100 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[.035]">
                  <div className="text-[9px] font-black uppercase tracking-wide text-violet-600 dark:text-violet-300">{EYE_DOMAIN_LABEL[domain]}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {items.map((item) => (
                      <span key={item.id} title={`${item.evidenceAnchor} · academic review pending`} className="rounded-full border border-neutral-200 bg-white px-2 py-1 text-[9px] font-bold text-neutral-700 dark:border-white/10 dark:bg-black/20 dark:text-neutral-200">{item.label}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <p className="mt-3 text-[9px] leading-relaxed text-neutral-500">{EYE_ORBIT_ADNEXA_WAVE13_BOUNDARY}</p>
          </section>
        </div>
      )}

      <div className="mt-3 space-y-2">
        {SCALE_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="mb-1 text-[8px] font-black uppercase tracking-[0.16em] text-neutral-400">{group.label}</div>
            <div role="group" aria-label={`${group.label} biological scales`} className="flex flex-wrap gap-1.5">
              {group.scales.map((item) => {
                const view = getBodyMultisystemScaleView(item)
                const active = item === scale
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setScale(item)}
                    className={`min-h-9 rounded-full border px-3 text-[10px] font-bold transition ${active ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-500 hover:border-brand/50 dark:border-white/10'}`}
                  >
                    {view.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-xl border border-neutral-200 p-3 dark:border-white/10">
          <div className="text-[9px] font-black uppercase tracking-wide text-brand">Representation</div>
          <div className="mt-1 text-sm font-black text-ink dark:text-white">{REPRESENTATION_LABEL[selected.representation]}</div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[9px] font-bold">
            <span className="rounded-full border border-neutral-200 px-2 py-1 text-neutral-500 dark:border-white/10">Geometry {selected.geometryRequired ? 'required' : 'not required'}</span>
            <span className="rounded-full border border-neutral-200 px-2 py-1 text-neutral-500 dark:border-white/10">Evidence {selected.evidenceBoundary}</span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">{selected.note}</p>
        </div>

        <div className="rounded-xl border border-neutral-200 p-3 dark:border-white/10">
          <div className="text-[9px] font-black uppercase tracking-wide text-brand">Available systems at this scale</div>
          <div className="mt-2 flex max-h-32 flex-wrap gap-1.5 overflow-auto pr-1">
            {domains.map((domain) => (
              <span key={domain.id} title={domain.note} className="rounded-full border border-neutral-200 px-2 py-1 text-[9px] font-bold text-neutral-600 dark:border-white/10 dark:text-neutral-300">{domain.label}</span>
            ))}
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-neutral-500">Selection is educational context only. It never creates patient anatomy, measured RNA/genomic data, diagnosis, treatment, personality inference, or an immortality claim.</p>
        </div>
      </div>

      <details className="mt-3 rounded-xl border border-neutral-200 p-3 dark:border-white/10">
        <summary className="cursor-pointer text-[10px] font-black text-ink dark:text-white">Evidence & mandatory references</summary>
        <div className="mt-2 grid gap-2 text-[9px] leading-relaxed text-neutral-500 md:grid-cols-2">
          <div>
            <div className="font-black text-neutral-700 dark:text-neutral-300">Reference-only UX</div>
            {boundary.externalUxReferences.map((item) => <div key={item.id}>{item.id} · {item.evidenceStatus}</div>)}
          </div>
          <div>
            <div className="font-black text-neutral-700 dark:text-neutral-300">Scientific anchors</div>
            {boundary.scientificEvidence.map((item) => <div key={item.id}>PMID {item.pmid} · {item.evidenceStatus}</div>)}
          </div>
        </div>
      </details>
    </section>
  )
}
