import type { SimulationDomain } from './UnifiedHumanSimulationProjector'
import type { BodySemanticScale } from '../../lib/bodySemanticZoom'

// One strip for every scale and lens the Body page covers. A rung opens the
// projector domain that already renders it; a rung with no renderer yet stays
// visible but disabled, so the page never implies a view it cannot show.

export interface BodyScaleRung {
  id: string
  label: string
  /** Projector domain that renders this rung, or null when nothing ships yet. */
  domain: SimulationDomain | null
  /** Semantic zoom stop the projector jumps to, so scale rungs on one domain differ. */
  scale?: BodySemanticScale
}

export interface BodyScaleGroup {
  id: string
  label: string
  rungs: readonly BodyScaleRung[]
}

export const BODY_SCALE_GROUPS: readonly BodyScaleGroup[] = [
  { id: 'structure', label: 'Structure', rungs: [
    { id: 'you', label: 'My Body', domain: 'personal-avatar' },
    { id: 'body', label: 'Body · System', domain: 'anatomy', scale: 'whole-body' },
    { id: 'organ', label: 'Organ', domain: 'anatomy', scale: 'organ' },
    { id: 'tissue', label: 'Tissue · Histology', domain: 'anatomy', scale: 'tissue' },
    { id: 'cell', label: 'Cell · Organelle', domain: 'cell', scale: 'cell' },
    { id: 'dna-rna', label: 'DNA · RNA', domain: 'genome', scale: 'genome' },
    { id: 'compound', label: 'Compound', domain: 'anatomy', scale: 'molecule' },
    { id: 'element', label: 'Element', domain: null },
    { id: 'quantum', label: 'Quantum', domain: null },
  ] },
  { id: 'function', label: 'Function', rungs: [
    { id: 'physiology', label: 'Physiology', domain: 'physiology' },
    { id: 'biomechanics', label: 'Biomechanics', domain: 'biomechanics' },
  ] },
  { id: 'disease', label: 'Disease', rungs: [
    { id: 'pathophysiology', label: 'Pathophysiology', domain: 'pathophysiology' },
    { id: 'localize', label: 'Localize lesion', domain: 'localization' },
    { id: 'imaging', label: 'Imaging', domain: 'imaging' },
  ] },
  { id: 'intervention', label: 'Intervention', rungs: [
    { id: 'surgery', label: 'Surgery', domain: 'surgery' },
    { id: 'endoscopy', label: 'Endoscopy', domain: 'endoscopy' },
    { id: 'drugs', label: 'Drugs · Anesthesia', domain: 'pharmacology' },
    { id: 'robotic', label: 'Robotic · Remote', domain: null },
  ] },
]

const RUNGS = BODY_SCALE_GROUPS.flatMap((group) => group.rungs)

/** Keeps the chosen rung when it already shows `domain`; otherwise the first rung that does. */
export function rungForDomain(domain: SimulationDomain, currentId?: string): string {
  const current = RUNGS.find((rung) => rung.id === currentId)
  if (current?.domain === domain) return current.id
  return RUNGS.find((rung) => rung.domain === domain)?.id ?? 'body'
}

export function BodyScaleLadder({ activeRungId, onSelect }: {
  activeRungId: string
  onSelect: (rung: BodyScaleRung & { domain: SimulationDomain }) => void
}) {
  return (
    <nav
      aria-label="Body scales and lenses"
      data-body-scale-ladder="v1"
      data-body-exposure-mode-rail="v1"
      className="no-scrollbar relative z-[3] mt-1.5 overflow-x-auto rounded-[16px] border border-white/10 bg-black/60 p-1"
    >
      <div className="flex min-w-max items-stretch gap-2">
        {BODY_SCALE_GROUPS.map((group) => (
          <div key={group.id} role="group" aria-label={group.label} className="flex items-center gap-1">
            <span className="px-1 text-[9px] font-black uppercase tracking-[.14em] text-slate-400">{group.label}</span>
            {group.rungs.map((rung) => {
              const active = rung.id === activeRungId
              return (
                <button
                  key={rung.id}
                  type="button"
                  data-pmd-native="true"
                  disabled={rung.domain === null}
                  aria-pressed={rung.domain === null ? undefined : active}
                  data-body-exposure-mode-active={String(active)}
                  title={rung.domain === null ? `${rung.label}: not built yet` : undefined}
                  onClick={() => { if (rung.domain) onSelect({ ...rung, domain: rung.domain }) }}
                  className={`min-h-[44px] whitespace-nowrap rounded-[12px] border px-2.5 text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 ${
                    rung.domain === null
                      ? 'cursor-not-allowed border-dashed border-white/15 bg-transparent text-slate-400'
                      : active
                        ? 'border-cyan-200 bg-cyan-300 text-black'
                        : 'border-white/10 bg-white/[.05] text-slate-200 hover:bg-white/[.12] hover:text-white'
                  }`}
                >
                  {rung.label}
                  {rung.domain === null && <span className="sr-only"> (not built yet)</span>}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </nav>
  )
}
