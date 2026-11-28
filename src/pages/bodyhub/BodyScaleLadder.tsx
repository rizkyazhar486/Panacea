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
      { id: 'you', label: 'You', domain: 'personal-avatar' },
      { id: 'body', label: 'Body', domain: 'anatomy', scale: 'whole-body' },
      { id: 'organ', label: 'Organ', domain: 'anatomy', scale: 'organ' },
      { id: 'tissue', label: 'Histology', domain: 'anatomy', scale: 'tissue' },
      { id: 'cell', label: 'Cell', domain: 'cell', scale: 'cell' },
      { id: 'dna-rna', label: 'DNA/PDB', domain: 'genome', scale: 'genome' },
      { id: 'compound', label: 'Molecules', domain: 'anatomy', scale: 'molecule' },
      { id: 'element', label: 'Elements', domain: 'quantum-element' },
      { id: 'quantum', label: 'Quantum', domain: 'quantum-element' },
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
      { id: 'localize', label: 'Localize', domain: 'localization' },
      { id: 'imaging', label: 'Imaging', domain: 'imaging' },
    ],
  },
  {
    id: 'intervention',
    label: 'Intervention',
    rungs: [
      { id: 'surgery', label: 'Surgery', domain: 'surgery' },
      { id: 'endoscopy', label: 'Endoscopy', domain: 'endoscopy' },
      { id: 'robotics-anesthesia', label: 'Robotics', domain: 'robotics-anesthesia' },
      { id: 'pharmacology', label: 'Drugs', domain: 'pharmacology' },
    ],
  },
] as const

function resolveActiveGroup(activeDomain: SimulationDomain): BodyScaleGroup {
  return (
    BODY_SCALE_GROUPS.find((group) => group.rungs.some((rung) => rung.domain === activeDomain)) ??
    BODY_SCALE_GROUPS[0]!
  )
}

export function BodyScaleLadder({
  activeDomain,
  activeScale,
  onSelectRung,
}: {
  activeDomain: SimulationDomain
  activeScale: BodySemanticScale
  onSelectRung: (rung: BodyScaleRung) => void
}) {
  const activeGroup = resolveActiveGroup(activeDomain)

  return (
    <nav
      data-body-scale-ladder="v2"
      aria-label="Structure, Function, Disease, and Intervention scale ladder"
      className="space-y-2 border-b border-white/[.07] bg-black/25 px-3 py-2.5"
    >
      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto" role="tablist" aria-label="Body exploration mode">
        {BODY_SCALE_GROUPS.map((group) => {
          const selected = group.id === activeGroup.id
          return (
            <button
              key={group.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => {
                const primary = group.id === 'structure' ? group.rungs[1]! : group.rungs[0]!
                onSelectRung(primary)
              }}
              className={`min-h-[36px] shrink-0 rounded-full border px-3 text-sm font-bold transition ${
                selected
                  ? 'border-cyan-300/70 bg-cyan-400/20 text-white'
                  : 'border-white/15 bg-white/[.04] text-white/75 hover:border-white/30 hover:text-white'
              }`}
            >
              {group.label}
            </button>
          )
        })}
      </div>

      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto" aria-label={`${activeGroup.label} scales`}>
        {activeGroup.rungs.map((rung) => {
          const active = rung.scale
            ? activeDomain === rung.domain && activeScale === rung.scale
            : activeDomain === rung.domain
          return (
            <button
              key={rung.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelectRung(rung)}
              className={`min-h-[34px] shrink-0 rounded-full border px-3 text-sm font-semibold transition ${
                active
                  ? 'border-cyan-300/65 bg-cyan-400/18 text-white'
                  : 'border-white/10 bg-white/[.03] text-white/75 hover:border-white/25 hover:text-white'
              }`}
            >
              {rung.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
