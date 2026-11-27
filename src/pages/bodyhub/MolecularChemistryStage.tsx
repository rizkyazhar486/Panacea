import { useEffect, useState } from 'react'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
import { Molecule3DViewer } from './Molecule3DViewer'

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

type ConformerEntry = { cid: number | null; title?: string; conformer: string | null; sourceUrl?: string; reason?: string }
type ConformerManifest = { compounds: Record<string, ConformerEntry> }

const MOLECULE_BASE = `${import.meta.env.BASE_URL}molecules/`

function laneClass(lane: string) {
  if (lane === 'carbon') return 'border-emerald-300/20 bg-emerald-300/[.06]'
  if (lane === 'redox') return 'border-cyan-300/20 bg-cyan-300/[.06]'
  if (lane === 'energy') return 'border-amber-300/20 bg-amber-300/[.06]'
  return 'border-violet-300/20 bg-violet-300/[.06]'
}

export default function MolecularChemistryStage({ selectedSystemId }: MolecularChemistryStageProps) {
  const [selectedId, setSelectedId] = useState<string>('atp')
  const [manifest, setManifest] = useState<ConformerManifest | null>(null)
  const [manifestFailed, setManifestFailed] = useState(false)

  useEffect(() => {
    let live = true
    fetch(`${MOLECULE_BASE}manifest.json`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data: ConformerManifest) => { if (live) setManifest(data) })
      .catch(() => { if (live) setManifestFailed(true) })
    return () => { live = false }
  }, [])

  const selected = METABOLITES.find((item) => item.id === selectedId) ?? METABOLITES[0]
  const entry = manifest?.compounds[selected.id]

  return (
    <section
      data-molecular-chemistry-stage="v2"
      className="overflow-hidden rounded-[24px] border border-white/[.08] bg-black/35"
      aria-label="Molecular chemistry reference"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/[.07] px-3 py-2.5">
        <div className="min-w-0">
          <div className="truncate text-[9px] font-black uppercase tracking-[.16em] text-cyan-200/65">
            Compound · 3D conformer
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
              {GLYCOLYSIS_NET}. This is a reference biochemical reaction, not a measured patient flux. Each 3D model is PubChem's computed conformer for the cited CID: one low-energy shape in vacuum, not the bound or solvated geometry inside a cell.
            </p>
          </div>
        </details>
      </div>

      <div className="relative h-[260px] border-b border-white/[.07] bg-[radial-gradient(circle_at_50%_45%,rgba(34,211,238,.08),transparent_62%)] sm:h-[320px]" data-molecule-selected={selected.id}>
        {entry?.conformer ? (
          <Molecule3DViewer sdfUrl={MOLECULE_BASE + entry.conformer} label={selected.label} />
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
        <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/[.08] bg-black/50 px-2.5 py-1 text-[10px] font-black text-white/80 backdrop-blur-md">
          {selected.label}
        </div>
        {entry?.cid && (
          <a
            href={`https://pubchem.ncbi.nlm.nih.gov/compound/${entry.cid}`}
            target="_blank"
            rel="noreferrer"
            title={entry.title}
            className="absolute right-3 top-3 inline-flex min-h-8 items-center rounded-full border border-white/[.1] bg-black/50 px-2.5 text-[9px] font-black text-white/60 backdrop-blur-md hover:text-white"
          >
            PubChem CID {entry.cid}
          </a>
        )}
        {entry?.conformer && (
          <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-1.5 text-[8px] font-black text-white/55" aria-label="Element colours">
            {[['C', '#909090'], ['H', '#ffffff'], ['N', '#3050f8'], ['O', '#ff0d0d'], ['P', '#ff8000']].map(([el, color]) => (
              <span key={el} className="inline-flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5"><i className="h-2 w-2 rounded-full" style={{ background: color }} />{el}</span>
            ))}
          </div>
        )}
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto p-3" role="group" aria-label="Choose a compound">
        {METABOLITES.map((item) => {
          const active = item.id === selected.id
          const has3d = Boolean(manifest?.compounds[item.id]?.conformer)
          return (
            <button
              key={item.id}
              type="button"
              data-pmd-native="true"
              aria-pressed={active}
              onClick={() => setSelectedId(item.id)}
              className={
                'relative min-h-[76px] min-w-[116px] shrink-0 overflow-hidden rounded-[18px] border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 ' +
                laneClass(item.lane) + (active ? ' ring-2 ring-cyan-200/70' : ' hover:brightness-125')
              }
            >
              <div className="text-[13px] font-black tracking-[-.02em] text-white/92">{item.label}</div>
              <div className="mt-1 max-w-[96px] text-[8px] font-bold leading-tight text-white/45">{item.formula}</div>
              <div className="mt-1.5 text-[7px] font-black uppercase tracking-[.12em] text-white/40">{manifest ? (has3d ? '3D' : 'no 3D record') : ''}</div>
            </button>
          )
        })}
      </div>

      <div className="border-t border-white/[.07] px-3 py-2 text-[8px] font-bold text-white/40">
        Geometry: PubChem computed 3D conformers, fetched by scripts/bangun/ambil-molekul-pubchem.mjs · drag to rotate
      </div>
    </section>
  )
}
