import { useMemo, useState } from 'react'
import {
  getBodyMultisystemScaleView,
  listBodyMultisystemDomains,
  listBodyMultisystemScaleViews,
} from '../../lib/bodyMultisystemScaleAdapter'
import type { KnowledgeScale } from '../../lib/multisystemKnowledgeGraph'

const GROUPS: readonly { label: string; scales: readonly KnowledgeScale[] }[] = [
  { label: 'Anatomy', scales: ['whole-body', 'system', 'organ', 'tissue'] },
  { label: 'Cell', scales: ['cell', 'organelle'] },
  { label: 'Molecular', scales: ['molecular-pathway', 'protein', 'rna', 'dna-epigenome'] },
  { label: 'Networks', scales: ['neural-circuit', 'endocrine-signal', 'cognition-behavior'] },
  { label: 'Life course', scales: ['development-regeneration', 'aging-longevity'] },
]

const REPRESENTATION_LABEL = {
  'spatial-3d': 'Shared 3D atlas',
  'microanatomy-reference': 'Microanatomy reference',
  'cellular-diagram': 'Cellular diagram',
  'molecular-network': 'Molecular network',
  'neural-network': 'Neural network',
  'endocrine-network': 'Endocrine network',
  'cognition-network-model': 'Distributed cognition model',
  'regeneration-timeline': 'Regeneration timeline',
  'longevity-research-map': 'Research map',
} as const

export default function BodyMultisystemScaleNavigator() {
  const scales = useMemo(() => listBodyMultisystemScaleViews(), [])
  const [activeScale, setActiveScale] = useState<KnowledgeScale>('whole-body')
  const [expanded, setExpanded] = useState(false)

  const active = getBodyMultisystemScaleView(activeScale)
  const domains = useMemo(() => listBodyMultisystemDomains(activeScale), [activeScale])

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white/80 p-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.03]" aria-label="Biological scale navigator">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-brand">Biological scale navigator</div>
          <h4 className="mt-1 text-sm font-black text-ink dark:text-white">Whole body → molecular → networks → life course</h4>
          <p className="mt-1 max-w-2xl text-[10px] leading-relaxed text-neutral-500">One compact navigator reuses the current Body Exposure viewer for spatial anatomy and switches to lightweight reference/network modes when gross 3D would be scientifically inappropriate.</p>
        </div>
        <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} className="min-h-9 rounded-full border border-neutral-200 px-3 text-[10px] font-black text-ink transition hover:border-brand/50 dark:border-white/10 dark:text-white">
          {expanded ? 'Compact' : 'Explore 15 scales'}
        </button>
      </div>

      <div className="mt-3 flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Biological scales">
        {scales.map((item) => (
          <button
            key={item.scale}
            type="button"
            role="tab"
            aria-selected={item.scale === activeScale}
            onClick={() => setActiveScale(item.scale)}
            className={`min-h-9 shrink-0 rounded-full border px-3 text-[10px] font-bold transition ${item.scale === activeScale ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-500 hover:border-brand/40 dark:border-white/10'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-xl border border-neutral-200 p-3 dark:border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[9px] font-black uppercase tracking-wide text-brand">{active.label}</div>
              <div className="mt-1 text-xs font-black text-ink dark:text-white">{REPRESENTATION_LABEL[active.representation]}</div>
            </div>
            <span className={`rounded-full border px-2 py-1 text-[9px] font-bold ${active.evidenceBoundary === 'research-frontier' ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300' : 'border-neutral-200 text-neutral-500 dark:border-white/10'}`}>{active.evidenceBoundary}</span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">{active.note}</p>
          <div className="mt-2 text-[9px] font-bold uppercase tracking-wide text-neutral-400">{active.geometryRequired ? 'Uses existing shared spatial geometry' : 'Lazy non-3D representation; no extra renderer loaded'}</div>
        </div>

        <div className="rounded-xl border border-neutral-200 p-3 dark:border-white/10">
          <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">Relevant domains · {domains.length}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {domains.slice(0, expanded ? domains.length : 6).map((domain) => (
              <span key={domain.id} title={domain.note} className="rounded-full border border-neutral-200 px-2.5 py-1 text-[9px] font-bold text-neutral-600 dark:border-white/10 dark:text-neutral-300">{domain.label}</span>
            ))}
            {!expanded && domains.length > 6 && <span className="rounded-full border border-dashed border-neutral-300 px-2.5 py-1 text-[9px] font-bold text-neutral-400 dark:border-white/10">+{domains.length - 6}</span>}
          </div>
          <p className="mt-3 text-[9px] leading-relaxed text-neutral-500">Atlas selection stays educational and non-patient-specific. It does not imply diagnosis/treatment, measured RNA expression, individual genotype/phenotype, deterministic thought/personality, or proven longevity reversal.</p>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {GROUPS.map((group) => (
            <div key={group.label} className="rounded-xl bg-neutral-50 p-2 dark:bg-white/[0.03]">
              <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">{group.label}</div>
              <div className="mt-1 space-y-1">
                {group.scales.map((scale) => {
                  const view = getBodyMultisystemScaleView(scale)
                  return <button key={scale} type="button" onClick={() => setActiveScale(scale)} className="block w-full rounded-lg px-2 py-1.5 text-left text-[9px] font-bold text-neutral-600 hover:bg-white hover:text-brand dark:text-neutral-300 dark:hover:bg-white/5">{view.label}</button>
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
