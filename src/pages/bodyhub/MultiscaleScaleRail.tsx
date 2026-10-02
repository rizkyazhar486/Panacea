import { useMemo, useState } from 'react'
import {
  canRenderInGrossBody3D,
  type BiologicalScale,
  type MultiscaleBridge,
  type MultiscaleNode,
} from '../../lib/bodyMultiscaleBridge'

const SCALE_LABELS: Record<BiologicalScale, string> = {
  'whole-body': 'Whole body',
  system: 'System',
  organ: 'Organ',
  tissue: 'Tissue',
  cell: 'Cell',
  organelle: 'Organelle',
  molecule: 'Molecule',
  protein: 'Protein',
  pathway: 'Pathway',
  gene: 'Gene',
}

const SCALE_ORDER: BiologicalScale[] = [
  'whole-body', 'system', 'organ', 'tissue', 'cell', 'organelle', 'molecule', 'protein', 'pathway', 'gene',
]

interface Props {
  bridge: MultiscaleBridge
  initialNodeId?: string
  onOpenDestination?: (node: MultiscaleNode) => void
}

function evidenceLabel(node: MultiscaleNode) {
  if (node.representation === 'not-represented') return 'Not represented'
  if (!node.evidence.length) return 'Evidence required'
  return node.academicReview.status === 'recorded' ? 'Reviewed reference' : 'Reference · review pending'
}

export function MultiscaleScaleRail({ bridge, initialNodeId, onOpenDestination }: Props) {
  const initial = bridge.nodes.find((node) => node.id === initialNodeId) ?? bridge.nodes[0] ?? null
  const [activeId, setActiveId] = useState(initial?.id ?? '')

  const active = bridge.nodes.find((node) => node.id === activeId) ?? initial
  const neighbors = useMemo(() => {
    if (!active) return []
    const ids = new Set<string>()
    for (const edge of bridge.edges) {
      if (edge.from === active.id) ids.add(edge.to)
      if (edge.to === active.id) ids.add(edge.from)
    }
    return bridge.nodes
      .filter((node) => ids.has(node.id))
      .sort((a, b) => SCALE_ORDER.indexOf(a.scale) - SCALE_ORDER.indexOf(b.scale))
  }, [active, bridge])

  if (!active) {
    return (
      <section className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10" role="status">
        <div className="text-sm font-black text-ink dark:text-white">Multiscale bridge unavailable</div>
        <p className="mt-1 text-[10.5px] leading-relaxed text-neutral-500">
          No provenance-bearing biological node is available. Panacea does not invent a tissue, cell, molecule or gene link to fill this state.
        </p>
      </section>
    )
  }

  return (
    <section aria-labelledby="multiscale-rail-title" className="space-y-3 rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
      <div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-brand">Multiscale biology</span>
          <span className="rounded-full border border-neutral-200 px-2 py-0.5 text-[9px] font-bold text-neutral-500 dark:border-white/10">Reference navigation · no inferred localization</span>
        </div>
        <h3 id="multiscale-rail-title" className="mt-2 text-base font-black text-ink dark:text-white">Body → cell → molecule → pathway → gene</h3>
        <p className="mt-1 text-[10.5px] leading-relaxed text-neutral-500">
          Cross-scale links are evidence relationships, not proof that a molecular structure occupies a rendered gross-anatomy coordinate. Missing links remain explicitly unavailable.
        </p>
      </div>

      <div role="group" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" aria-label="Biological scales">
        {SCALE_ORDER.map((scale) => {
          const nodes = bridge.nodes.filter((node) => node.scale === scale)
          const selectable = nodes[0]
          const pressed = active.scale === scale
          return (
            <button
              key={scale}
              type="button"
              disabled={!selectable}
              aria-pressed={pressed}
              onClick={() => selectable && setActiveId(selectable.id)}
              className={`min-h-11 shrink-0 rounded-full border px-3 text-[10px] font-bold transition ${
                pressed
                  ? 'border-brand bg-brand text-white'
                  : selectable
                    ? 'border-neutral-200 text-neutral-600 hover:border-brand/40 dark:border-white/10 dark:text-neutral-300'
                    : 'cursor-not-allowed border-neutral-100 text-neutral-300 opacity-60 dark:border-white/5 dark:text-neutral-600'
              }`}
            >
              {SCALE_LABELS[scale]}
            </button>
          )
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.55fr)]">
        <div className="rounded-xl border border-neutral-200 p-3 dark:border-white/10">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.16em] text-brand">{SCALE_LABELS[active.scale]}</div>
              <h4 className="mt-0.5 text-lg font-black text-ink dark:text-white">{active.label}</h4>
            </div>
            <span className="rounded-full border border-neutral-200 px-2 py-1 text-[9px] font-bold text-neutral-500 dark:border-white/10">{evidenceLabel(active)}</span>
          </div>

          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg bg-neutral-50 p-2.5 dark:bg-white/[0.04]">
              <dt className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">Representation</dt>
              <dd className="mt-0.5 text-[10.5px] font-bold text-ink dark:text-white">{active.representation.replaceAll('-', ' ')}</dd>
            </div>
            <div className="rounded-lg bg-neutral-50 p-2.5 dark:bg-white/[0.04]">
              <dt className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">Gross Body3D</dt>
              <dd className="mt-0.5 text-[10.5px] font-bold text-ink dark:text-white">{canRenderInGrossBody3D(active) ? 'Eligible when geometry provenance is verified' : 'No — separate scale representation'}</dd>
            </div>
          </dl>

          <div className="mt-3">
            <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-500">Provenance</div>
            {active.evidence.length ? (
              <ul className="mt-1.5 space-y-1.5">
                {active.evidence.map((ref, index) => (
                  <li key={`${ref.sourceId}-${ref.locator}-${index}`} className="rounded-lg bg-neutral-50 p-2 text-[9.5px] leading-relaxed text-neutral-600 dark:bg-white/[0.04] dark:text-neutral-300">
                    <strong className="font-black text-ink dark:text-white">{ref.sourceId}</strong> · {ref.sourceVersion} · {ref.locator}
                    <div className="mt-0.5 text-neutral-500">{ref.citation}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-[10px] text-amber-700 dark:text-amber-300">Evidence required before this scale may be represented.</p>
            )}
          </div>

          {active.destination && onOpenDestination && (
            <button
              type="button"
              onClick={() => onOpenDestination(active)}
              className="mt-3 min-h-11 rounded-full border border-brand px-3 text-[10px] font-black text-brand transition hover:bg-brand hover:text-white"
            >
              Open {active.destination.replaceAll('-', ' ')} →
            </button>
          )}
        </div>

        <aside className="space-y-2">
          <div className="rounded-xl border border-neutral-200 p-3 dark:border-white/10">
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-500">Evidence-linked neighbors</div>
            {neighbors.length ? (
              <div className="mt-2 space-y-1.5">
                {neighbors.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setActiveId(node.id)}
                    className="min-h-11 w-full rounded-lg border border-neutral-200 px-2.5 py-2 text-left transition hover:border-brand/40 dark:border-white/10"
                  >
                    <span className="block text-[9px] font-bold uppercase tracking-wide text-brand">{SCALE_LABELS[node.scale]}</span>
                    <span className="mt-0.5 block text-[10.5px] font-black text-ink dark:text-white">{node.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">No validated cross-scale edge is recorded from this node. No relationship is inferred from its name.</p>
            )}
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">Interpretation boundary</div>
            <p className="mt-1 text-[10px] leading-relaxed text-amber-900 dark:text-amber-200">
              Reference biology is not a patient measurement. Molecular, protein, pathway and gene nodes cannot be projected into gross anatomy unless a separate spatially valid evidence chain explicitly supports that representation.
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default MultiscaleScaleRail
