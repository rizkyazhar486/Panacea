import { useEffect, useMemo, useState } from 'react'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
import type { SdfChemistrySummary } from '../../lib/kimia/sdfV2000'
import { Molecule3DViewer, type MoleculeRenderMode } from './Molecule3DViewer'

interface MolecularChemistryStageProps {
  selectedSystemId: BodySystemId
}

type CompoundCategory = 'all' | 'energy' | 'neuro' | 'hormone'

interface CompoundItem {
  readonly id: string
  readonly label: string
  readonly formula: string
  readonly lane: 'carbon' | 'redox' | 'energy' | 'gas' | 'neuro' | 'hormone'
  readonly category: Exclude<CompoundCategory, 'all'>
  readonly role: string
  readonly pubchemCid?: number
}

const METABOLITES: readonly CompoundItem[] = [
  // Bioenergetics & Core Metabolism
  { id: 'atp', label: 'ATP', formula: 'C₁₀H₁₆N₅O₁₃P₃', lane: 'energy', category: 'energy', role: 'Cellular energy currency', pubchemCid: 5957 },
  { id: 'adp', label: 'ADP', formula: 'C₁₀H₁₅N₅O₁₀P₂', lane: 'energy', category: 'energy', role: 'Phosphate acceptor' },
  { id: 'glucose', label: 'Glucose', formula: 'C₆H₁₂O₆', lane: 'carbon', category: 'energy', role: 'Primary glycolytic fuel', pubchemCid: 5793 },
  { id: 'pyruvate', label: 'Pyruvate', formula: 'C₃H₃O₃⁻', lane: 'carbon', category: 'energy', role: 'Glycolysis → TCA hub' },
  { id: 'lactate', label: 'L-Lactate', formula: 'C₃H₆O₃', lane: 'carbon', category: 'energy', role: 'Anaerobic / Cori cycle', pubchemCid: 107689 },
  { id: 'citrate', label: 'Citrate', formula: 'C₆H₈O₇', lane: 'carbon', category: 'energy', role: 'Krebs / TCA cycle entry', pubchemCid: 311 },
  { id: 'nad-plus', label: 'NAD⁺', formula: 'C₂₁H₂₈N₇O₁₄P₂⁺', lane: 'redox', category: 'energy', role: 'Oxidized electron carrier', pubchemCid: 5893 },
  { id: 'nadh', label: 'NADH', formula: 'C₂₁H₂₉N₇O₁₄P₂', lane: 'redox', category: 'energy', role: 'Complex I electron donor', pubchemCid: 439153 },
  { id: 'oxygen', label: 'O₂', formula: 'O₂', lane: 'gas', category: 'energy', role: 'Terminal electron acceptor' },
  { id: 'co2', label: 'CO₂', formula: 'CO₂', lane: 'gas', category: 'energy', role: 'Oxidative decarboxylation product' },
  { id: 'acetyl-coa', label: 'Acetyl-CoA', formula: '2-C acetyl carrier', lane: 'carbon', category: 'energy', role: 'TCA acetyl donor' },
  { id: 'fad', label: 'FAD', formula: 'oxidized carrier', lane: 'redox', category: 'energy', role: 'Flavin electron acceptor' },
  { id: 'fadh2', label: 'FADH₂', formula: 'reduced carrier', lane: 'redox', category: 'energy', role: 'Complex II electron donor' },
  // Neurotransmitters & Synaptic Autacoids
  { id: 'dopamine', label: 'Dopamine', formula: 'C₈H₁₁NO₂', lane: 'neuro', category: 'neuro', role: 'Reward & motor catecholamine', pubchemCid: 681 },
  { id: 'serotonin', label: 'Serotonin', formula: 'C₁₀H₁₂N₂O', lane: 'neuro', category: 'neuro', role: '5-HT mood & gut signaling', pubchemCid: 5202 },
  { id: 'acetylcholine', label: 'Acetylcholine', formula: 'C₇H₁₆NO₂⁺', lane: 'neuro', category: 'neuro', role: 'NMJ & parasympathetic transmitter', pubchemCid: 187 },
  { id: 'epinephrine', label: 'Epinephrine', formula: 'C₉H₁₃NO₃', lane: 'neuro', category: 'neuro', role: 'Sympathetic adrenergic agonist', pubchemCid: 5816 },
  { id: 'norepinephrine', label: 'Norepinephrine', formula: 'C₈H₁₁NO₃', lane: 'neuro', category: 'neuro', role: 'Vasoconstrictor & arousal amine', pubchemCid: 439260 },
  { id: 'gaba', label: 'GABA', formula: 'C₄H₉NO₂', lane: 'neuro', category: 'neuro', role: 'Primary CNS inhibitory signal', pubchemCid: 119 },
  { id: 'glutamate', label: 'L-Glutamate', formula: 'C₅H₉NO₄', lane: 'neuro', category: 'neuro', role: 'Primary CNS excitatory signal', pubchemCid: 33032 },
  { id: 'histamine', label: 'Histamine', formula: 'C₅H₉N₃', lane: 'neuro', category: 'neuro', role: 'Mast-cell & wakefulness mediator', pubchemCid: 774 },
  // Hormones & Membrane Sterols
  { id: 'cortisol', label: 'Cortisol', formula: 'C₂₁H₃₀O₅', lane: 'hormone', category: 'hormone', role: 'HPA-axis glucocorticoid steroid', pubchemCid: 5754 },
  { id: 'estradiol', label: 'Estradiol', formula: 'C₁₈H₂₄O₂', lane: 'hormone', category: 'hormone', role: 'Endocrine & vascular estrogen', pubchemCid: 5757 },
  { id: 'melatonin', label: 'Melatonin', formula: 'C₁₃H₁₆N₂O₂', lane: 'hormone', category: 'hormone', role: 'Pineal circadian indoleamine', pubchemCid: 896 },
  { id: 'cholesterol', label: 'Cholesterol', formula: 'C₂₇H₄₆O', lane: 'hormone', category: 'hormone', role: 'Bilayer fluidity & steroid precursor', pubchemCid: 5997 },
] as const

const GLYCOLYSIS_NET =
  'Glucose + 2 NAD⁺ + 2 ADP + 2 Pi → 2 pyruvate + 2 NADH + 2 H⁺ + 2 ATP + 2 H₂O'

const SYSTEM_CUE: Partial<Record<BodySystemId, string>> = {
  cardiovascular: 'ATP demand · adrenergic tone · cholesterol · redox balance',
  nervous: 'dopamine · acetylcholine · GABA · glutamate · mitochondrial ATP',
  respiratory: 'O₂ delivery · CO₂ handling · histamine · mitochondrial respiration',
  digestive: 'serotonin · glucose · citrate · hepatic Cori-cycle lactate',
  urinary: 'tubular ATP transport · citrate · acid-base chemistry',
  endocrine: 'cortisol · estradiol · melatonin · epinephrine receptor signaling',
  reproductive: 'estradiol steroidogenesis · cholesterol precursor · gamete ATP',
  'lymphatic-immune': 'histamine mediator · immune biosynthesis · redox metabolism',
  musculoskeletal: 'ATP turnover · L-lactate · acetylcholine neuromuscular junction',
  'sensory-ent': 'photoreceptor/hair-cell energetics · melatonin circadian input',
  'integumentary-surface': 'cholesterol lipid barrier · keratinocyte redox chemistry',
}

const SYSTEM_DEFAULT_COMPOUND: Partial<Record<BodySystemId, string>> = {
  nervous: 'dopamine',
  endocrine: 'cortisol',
  reproductive: 'estradiol',
  cardiovascular: 'epinephrine',
  'lymphatic-immune': 'histamine',
  'integumentary-surface': 'cholesterol',
}

type ConformerEntry = { cid: number | null; title?: string; conformer: string | null; sourceUrl?: string; reason?: string }
type ConformerManifest = { compounds: Record<string, ConformerEntry> }

const MOLECULE_BASE = `${import.meta.env.BASE_URL}molecules/`

function laneClass(lane: CompoundItem['lane']) {
  if (lane === 'carbon') return 'border-emerald-300/20 bg-emerald-300/[.06]'
  if (lane === 'redox') return 'border-cyan-300/20 bg-cyan-300/[.06]'
  if (lane === 'energy') return 'border-amber-300/20 bg-amber-300/[.06]'
  if (lane === 'neuro') return 'border-sky-300/25 bg-sky-400/[.08]'
  if (lane === 'hormone') return 'border-rose-300/25 bg-rose-400/[.08]'
  return 'border-violet-300/20 bg-violet-300/[.06]'
}

const CATEGORY_TABS: readonly { id: CompoundCategory; label: string }[] = [
  { id: 'all', label: 'All (22 3D)' },
  { id: 'energy', label: 'Bioenergetics' },
  { id: 'neuro', label: 'Neurotransmitters' },
  { id: 'hormone', label: 'Hormones & Lipid' },
]

export default function MolecularChemistryStage({ selectedSystemId }: MolecularChemistryStageProps) {
  const [category, setCategory] = useState<CompoundCategory>('all')
  const [selectedId, setSelectedId] = useState<string>(() => SYSTEM_DEFAULT_COMPOUND[selectedSystemId] ?? 'atp')
  const [renderMode, setRenderMode] = useState<MoleculeRenderMode>('ball-and-stick')
  const [manifest, setManifest] = useState<ConformerManifest | null>(null)
  const [manifestFailed, setManifestFailed] = useState(false)
  const [inspection, setInspection] = useState<SdfChemistrySummary | null>(null)

  useEffect(() => {
    let live = true
    fetch(`${MOLECULE_BASE}manifest.json`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data: ConformerManifest) => { if (live) setManifest(data) })
      .catch(() => { if (live) setManifestFailed(true) })
    return () => { live = false }
  }, [])

  const visibleCompounds = useMemo(
    () => (category === 'all' ? METABOLITES : METABOLITES.filter((c) => c.category === category)),
    [category],
  )

  const selected = METABOLITES.find((item) => item.id === selectedId) ?? METABOLITES[0]!
  const entry = manifest?.compounds[selected.id]

  return (
    <section
      data-molecular-chemistry-stage="v3"
      className="dark overflow-hidden rounded-[24px] border border-white/[.08] bg-black/35"
      aria-label="Molecular chemistry reference"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[.07] px-3 py-2.5">
        <div className="min-w-0">
          <div className="truncate text-[9px] font-black uppercase tracking-[.16em] text-cyan-200/65">
            Compound · 22 PubChem 3D conformers
          </div>
          <div className="truncate text-[10px] font-bold text-white/55">
            {SYSTEM_CUE[selectedSystemId] ?? 'metabolite · neurotransmitter · hormone · molecular context'}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex flex-wrap gap-1" role="tablist" aria-label="Compound category">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                data-pmd-native="true"
                aria-selected={category === tab.id}
                onClick={() => setCategory(tab.id)}
                className={`min-h-8 rounded-full border px-2.5 text-[10px] font-bold transition ${
                  category === tab.id
                    ? 'border-cyan-300/60 bg-cyan-400/20 text-white'
                    : 'border-white/[.10] bg-white/[.03] text-white/60 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
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
                {GLYCOLYSIS_NET}. This is a reference biochemical reaction, not a measured patient flux. Compounds must bind to verified chemical/protein identifiers before they are rendered as source-backed 3D; each model is PubChem's computed conformer for the cited CID (low-energy shape in vacuum, not bound cellular geometry). Polarity shell highlights Pauling-electronegative O/N/P/S heteroatoms versus hydrophobic C/H regions.
              </p>
            </div>
          </details>
        </div>
      </div>

      <div className="relative h-[270px] border-b border-white/[.07] bg-[radial-gradient(circle_at_50%_45%,rgba(34,211,238,.10),transparent_62%)] sm:h-[340px]" data-molecule-selected={selected.id}>
        {entry?.conformer ? (
          <Molecule3DViewer
            sdfUrl={MOLECULE_BASE + entry.conformer}
            label={selected.label}
            mode={renderMode}
            onInspect={setInspection}
          />
        ) : (
          <div className="grid h-full place-items-center p-6 text-center">
            <p className="m-0 max-w-sm text-[11px] font-bold leading-relaxed text-white/50">
              {manifestFailed
                ? 'The conformer index could not be loaded.'
                : !manifest
                  ? 'Loading conformer index…'
                  : `PubChem publishes no computed 3D conformer for ${selected.label}${entry?.cid ? ` (CID ${entry.cid})` : ''}; large, flexible molecules are excluded from its 3D set, so none is drawn here.`}
            </p>
          </div>
        )}
        <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/[.08] bg-black/55 px-2.5 py-1 text-[10px] font-black text-white/88 backdrop-blur-md">
          {selected.label} · <span className="font-semibold text-cyan-200/80">{selected.role}</span>
        </div>
        {entry?.cid && (
          <a
            href={`https://pubchem.ncbi.nlm.nih.gov/compound/${entry.cid}`}
            target="_blank"
            rel="noreferrer"
            title={entry.title}
            className="absolute right-3 top-3 inline-flex min-h-8 items-center rounded-full border border-white/[.1] bg-black/55 px-2.5 text-[9px] font-black text-white/65 backdrop-blur-md hover:text-white"
          >
            PubChem CID {entry.cid}
          </a>
        )}
        {entry?.conformer && (
          <div className="absolute bottom-3 right-3 flex flex-wrap justify-end gap-1" role="group" aria-label="Molecular representation">
            {([
              ['ball-and-stick', 'Ball & stick'],
              ['space-filling', 'Space-filling'],
              ['polarity-shell', 'Polarity shell'],
            ] as const).map(([m, text]) => (
              <button
                key={m}
                type="button"
                data-pmd-native="true"
                aria-pressed={renderMode === m}
                onClick={() => setRenderMode(m)}
                className={`min-h-8 rounded-full border px-2.5 text-[9px] font-black backdrop-blur-md transition ${
                  renderMode === m
                    ? 'border-cyan-300/60 bg-cyan-400/20 text-white'
                    : 'border-white/[.12] bg-black/55 text-white/65 hover:text-white'
                }`}
              >
                {text}
              </button>
            ))}
          </div>
        )}
        {entry?.conformer && (
          <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-1.5 text-[8px] font-black text-white/65" aria-label="Element colours">
            {[['C', '#7c8694'], ['H', '#f1f5f9'], ['N', '#3b82f6'], ['O', '#ef4444'], ['P', '#f97316']].map(([el, color]) => (
              <span key={el} className="inline-flex items-center gap-1 rounded-full bg-black/55 px-1.5 py-0.5"><i className="h-2 w-2 rounded-full" style={{ background: color }} />{el}</span>
            ))}
          </div>
        )}
      </div>

      {entry?.conformer && inspection && (
        <div className="flex flex-wrap items-center gap-3 border-b border-white/[.07] bg-white/[.02] px-3 py-2 font-mono text-[10px] text-white/75">
          <span>Formula <strong className="text-cyan-200">{inspection.hillFormula}</strong></span>
          <span>Molar Mass <strong className="text-white">{inspection.molarMassDa} Da</strong></span>
          <span>Atoms <strong className="text-white">{inspection.atomCount}</strong> ({inspection.heavyAtomCount} heavy)</span>
          <span>Bonds <strong className="text-white">{inspection.bondCount}</strong></span>
          <span>Polar Heavy <strong className="text-rose-200">{Math.round(inspection.polarHeavyFraction * 100)}%</strong></span>
        </div>
      )}

      <div className="no-scrollbar flex gap-2 overflow-x-auto p-3" role="group" aria-label="Choose a compound">
        {visibleCompounds.map((item) => {
          const active = item.id === selected.id
          const has3d = Boolean(manifest?.compounds[item.id]?.conformer)
          return (
            <button
              key={item.id}
              type="button"
              data-pmd-native="true"
              aria-pressed={active}
              onClick={() => {
                setInspection(null)
                setSelectedId(item.id)
              }}
              className={
                'relative min-h-[76px] min-w-[122px] shrink-0 overflow-hidden rounded-[18px] border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 ' +
                laneClass(item.lane) + (active ? ' ring-2 ring-cyan-200/70' : ' hover:brightness-125')
              }
            >
              <div className="text-[13px] font-black tracking-[-.02em] text-white/92">{item.label}</div>
              <div className="mt-1 max-w-[104px] text-[9px] font-bold leading-tight text-white/55">{item.formula}</div>
              <div className="mt-1.5 text-[8px] font-black uppercase tracking-[.12em] text-white/45">{manifest ? (has3d ? '3D SDF' : 'no 3D record') : ''}</div>
            </button>
          )
        })}
      </div>

      <div className="border-t border-white/[.07] px-3 py-2 text-[9px] font-bold text-white/45">
        Geometry: NIH/NCBI PubChem computed 3D conformers via scripts/bangun/ambil-molekul-pubchem.mjs · drag to orbit
      </div>
    </section>
  )
}
