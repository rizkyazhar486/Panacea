import type { BodySystemId } from '../../lib/bodySystemSourceWave'

interface MolecularChemistryStageProps {
  selectedSystemId: BodySystemId
}

const METABOLITES = [
  { id: 'glucose', label: 'Glucose', formula: 'C₆H₁₂O₆', lane: 'carbon', pubchemCid: 5793 },
  { id: 'pyruvate', label: 'Pyruvate', formula: 'C₃H₃O₃⁻', lane: 'carbon' },
  { id: 'acetyl-coa', label: 'Acetyl-CoA', formula: '2-C acetyl carrier', lane: 'carbon' },
  { id: 'nad-plus', label: 'NAD⁺', formula: 'C₂₁H₂₈N₇O₁₄P₂⁺', lane: 'redox', pubchemCid: 5893 },
  { id: 'nadh', label: 'NADH', formula: 'C₂₁H₂₉N₇O₁₄P₂', lane: 'redox', pubchemCid: 439153 },
  { id: 'fad', label: 'FAD', formula: 'oxidized carrier', lane: 'redox' },
  { id: 'fadh2', label: 'FADH₂', formula: 'reduced carrier', lane: 'redox' },
  { id: 'adp', label: 'ADP', formula: 'phosphate acceptor', lane: 'energy' },
  { id: 'atp', label: 'ATP', formula: 'C₁₀H₁₆N₅O₁₃P₃', lane: 'energy', pubchemCid: 5957 },
  { id: 'oxygen', label: 'O₂', formula: 'terminal electron acceptor', lane: 'gas' },
  { id: 'co2', label: 'CO₂', formula: 'carbon product', lane: 'gas' },
] as const

const GLYCOLYSIS_NET =
  'Glucose + 2 NAD⁺ + 2 ADP + 2 Pi → 2 pyruvate + 2 NADH + 2 H⁺ + 2 ATP + 2 H₂O'

const SYSTEM_CUE: Partial<Record<BodySystemId, string>> = {
  cardiovascular: 'ATP demand · substrate delivery · redox balance',
  nervous: 'glucose use · mitochondrial ATP · ion-gradient maintenance',
  respiratory: 'O₂ delivery · CO₂ handling · mitochondrial respiration',
  digestive: 'substrate absorption · hepatic processing · ATP production',
  urinary: 'tubular transport · ATP demand · acid-base chemistry',
  endocrine: 'hormone synthesis · receptor signaling · metabolic control',
  reproductive: 'steroidogenesis · gamete energy · redox biology',
  'lymphatic-immune': 'immune-cell activation · biosynthesis · redox metabolism',
  musculoskeletal: 'ATP turnover · phosphagen/glycolytic/oxidative metabolism',
  'sensory-ent': 'photoreceptor/hair-cell energetics · ion gradients',
  'integumentary-surface': 'barrier synthesis · keratinocyte metabolism · redox chemistry',
}

function laneClass(lane: string) {
  if (lane === 'carbon') return 'border-emerald-300/20 bg-emerald-300/[.06]'
  if (lane === 'redox') return 'border-cyan-300/20 bg-cyan-300/[.06]'
  if (lane === 'energy') return 'border-amber-300/20 bg-amber-300/[.06]'
  return 'border-violet-300/20 bg-violet-300/[.06]'
}

export default function MolecularChemistryStage({ selectedSystemId }: MolecularChemistryStageProps) {
  return (
    <section
      data-molecular-chemistry-stage="v1"
      className="overflow-hidden rounded-[24px] border border-white/[.08] bg-black/35"
      aria-label="Molecular chemistry reference"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/[.07] px-3 py-2.5">
        <div className="min-w-0">
          <div className="truncate text-[9px] font-black uppercase tracking-[.16em] text-cyan-200/65">
            Chemistry reference
          </div>
          <div className="truncate text-[10px] font-bold text-white/52">
            {SYSTEM_CUE[selectedSystemId] ?? 'metabolite · redox · ATP · molecular context'}
          </div>
        </div>

        <details className="relative shrink-0">
          <summary
            aria-label="Chemistry reference details"
            className="grid h-8 w-8 cursor-pointer list-none place-items-center rounded-full border border-white/[.10] text-[9px] font-black text-white/45"
          >
            i
          </summary>
          <div className="absolute right-0 top-10 z-30 w-[min(420px,84vw)] rounded-2xl border border-white/[.12] bg-[#080c10] p-3 shadow-2xl">
            <p className="m-0 text-[9px] leading-relaxed text-white/58">
              {GLYCOLYSIS_NET}. This is a reference biochemical reaction, not a measured patient flux; future molecular structures must bind to verified chemical/protein identifiers before they are rendered as source-backed 3D.
            </p>
          </div>
        </details>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto p-3">
        {METABOLITES.map((item, index) => (
          <article
            key={item.id}
            className={
              'relative min-h-[94px] min-w-[116px] shrink-0 overflow-hidden rounded-[18px] border p-3 ' +
              laneClass(item.lane)
            }
          >
            <span className="absolute right-2 top-2 flex h-8 items-end gap-[2px]" aria-hidden="true">
              {Array.from({ length: 7 }).map((_, bar) => (
                <i
                  key={bar}
                  className="w-[2px] rounded-full bg-white/25"
                  style={{ height: `${5 + ((bar + index) % 5) * 3}px` }}
                />
              ))}
            </span>
            <div className="pr-7 text-[13px] font-black tracking-[-.02em] text-white/92">{item.label}</div>
            <div className="mt-1 max-w-[96px] text-[8px] font-bold leading-tight text-white/38">{item.formula}</div>
            {'pubchemCid' in item ? (
              <a
                href={`https://pubchem.ncbi.nlm.nih.gov/compound/${item.pubchemCid}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex min-h-7 items-center rounded-full border border-white/[.08] px-2 text-[7px] font-black text-white/34 hover:text-white/70"
              >
                CID {item.pubchemCid}
              </a>
            ) : null}
            <div className="absolute bottom-2.5 left-3 h-1.5 w-1.5 rounded-full bg-current opacity-45" aria-hidden />
          </article>
        ))}
      </div>

      <div className="border-t border-white/[.07] px-3 py-2 text-[8px] font-bold text-white/28">
        Reference pathway context only · compound/protein 3D waits for verified identifiers and provenance
      </div>
    </section>
  )
}
