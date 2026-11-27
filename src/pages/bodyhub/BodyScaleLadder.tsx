import type { SimulationDomain } from './UnifiedHumanSimulationProjector'
import type { BodySemanticScale } from '../../lib/bodySemanticZoom'

export interface BodyScaleRung {
  readonly id: string
  readonly label: string
  readonly domain: SimulationDomain
  readonly scale?: BodySemanticScale
}

export interface BodyScaleGroup {
  readonly id: 'structure' | 'function' | 'disease' | 'intervention'
  readonly label: string
  readonly rungs: readonly BodyScaleRung[]
}

export const BODY_SCALE_GROUPS: readonly BodyScaleGroup[] = [
  {
    id: 'structure',
    label: 'Structure',
    rungs: [
      { id: 'you', label: 'My Body (1:1)', domain: 'personal-avatar' },
      { id: 'body', label: 'Body · System', domain: 'anatomy', scale: 'whole-body' },
      { id: 'organ', label: 'Organ', domain: 'anatomy', scale: 'organ' },
      { id: 'tissue', label: 'Histology', domain: 'anatomy', scale: 'tissue' },
      { id: 'cell', label: 'Cell · Organelle', domain: 'cell', scale: 'cell' },
      { id: 'dna-rna', label: 'DNA · RNA · PDB', domain: 'genome', scale: 'genome' },
      { id: 'compound', label: 'Compound 3D', domain: 'anatomy', scale: 'molecule' },
      { id: 'element', label: 'Element', domain: 'quantum-element' },
      { id: 'quantum', label: 'Quantum |ψ|²', domain: 'quantum-element' },
    ],
  },
  {
    id: 'function',
    label: 'Function',
    rungs: [
      { id: 'physiology', label: 'Physiology', domain: 'physiology' },
      { id: 'biomechanics', label: 'Biomechanics', domain: 'biomechanics' },
    ],
  },
  {
    id: 'disease',
    label: 'Disease',
    rungs: [
      { id: 'pathophysiology', label: 'Pathophysiology', domain: 'pathophysiology' },
      { id: 'localize', label: 'Localize Lesion', domain: 'localization' },
      { id: 'imaging', label: 'Imaging', domain: 'imaging' },
    ],
  },
  {
    id: 'intervention',
    label: 'Intervention',
    rungs: [
      { id: 'surgery', label: 'Surgery', domain: 'surgery' },
      { id: 'endoscopy', label: 'Endoscopy', domain: 'endoscopy' },
      { id: 'robotics-anesthesia', label: 'Robotics & Anesthesia', domain: 'robotics-anesthesia' },
      { id: 'pharmacology', label: 'Pharmacology', domain: 'pharmacology' },
    ],
  },
] as const

export function BodyScaleLadder({
  activeDomain,
  activeScale,
  onSelectRung,
}: {
  activeDomain: SimulationDomain
  activeScale: BodySemanticScale
  onSelectRung: (rung: BodyScaleRung) => void
}) {
  return (
    <nav
      data-body-scale-ladder="v2"
      aria-label="Structure, Function, Disease, and Intervention scale ladder"
      className="flex flex-wrap items-center gap-2 border-b border-white/[.07] bg-black/25 px-3 py-2"
    >
      {BODY_SCALE_GROUPS.map((group) => (
        <div key={group.id} className="flex flex-wrap items-center gap-1">
          <span className="mr-0.5 font-mono text-[8.5px] font-black uppercase tracking-[.14em] text-cyan-200/60">
            {group.label}
          </span>
          {group.rungs.map((rung) => {
            const active = rung.scale
              ? activeDomain === rung.domain && activeScale === rung.scale
              : activeDomain === rung.domain
            return (
              <button
                key={rung.id}
                type="button"
                aria-pressed={active}
                onClick={() => onSelectRung(rung)}
                className={`min-h-8 rounded-full border px-2.5 font-mono text-[9.5px] font-bold transition ${
                  active
                    ? 'border-cyan-300/70 bg-cyan-400/20 text-white'
                    : 'border-white/[.08] bg-white/[.03] text-white/60 hover:border-white/25 hover:text-white'
                }`}
              >
                {rung.label}
              </button>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
