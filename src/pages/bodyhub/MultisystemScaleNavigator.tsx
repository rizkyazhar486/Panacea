import { useMemo, useState } from 'react'
import {
  getBodyMultisystemReferenceBoundary,
  getBodyMultisystemScaleView,
  listBodyMultisystemDomains,
  listBodyMultisystemScaleViews,
} from '../../lib/bodyMultisystemScaleAdapter'
import type { KnowledgeScale } from '../../lib/multisystemKnowledgeGraph'

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

export default function MultisystemScaleNavigator() {
  const [scale, setScale] = useState<KnowledgeScale>('whole-body')
  const selected = getBodyMultisystemScaleView(scale)
  const domains = useMemo(() => listBodyMultisystemDomains(scale), [scale])
  const boundary = getBodyMultisystemReferenceBoundary()
  const views = listBodyMultisystemScaleViews()

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
