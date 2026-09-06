import { useMemo, useState } from 'react'
import {
  BIOMEDICAL_DATA_CONTRACTS,
  BIOMEDICAL_TRACKS,
  VALIDATION_GATES,
  type BiomedicalDomain,
} from '../../lib/biomedicalEngineBlueprint'
import {
  n50,
  phredErrorProbability,
  variantAlleleFraction,
} from '../../lib/biomedicalEvidence'

type View = 'engine' | 'data' | 'evidence' | 'validation'

const VIEWS: Array<{ key: View; label: string }> = [
  { key: 'engine', label: 'Engine map' },
  { key: 'data', label: 'Data contracts' },
  { key: 'evidence', label: 'Evidence lab' },
  { key: 'validation', label: 'Validation gates' },
]

const DOMAIN_ICON: Record<BiomedicalDomain, string> = {
  genomics: 'DNA',
  'hematology-oncology': 'HEME',
  'single-cell-multiomics': 'CELL',
  'radiology-3d': '3D',
  'neuro-pathway-bioelectric': 'NEURO',
  'longevity-wellness': 'LONG',
  'translational-rnd': 'R&D',
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-neutral-200 px-2 py-0.5 text-[10px] font-semibold text-neutral-500 dark:border-white/10 dark:text-neutral-300">{children}</span>
}

export function BiomedicalEngineLab() {
  const [view, setView] = useState<View>('engine')
  const [selected, setSelected] = useState<BiomedicalDomain>('genomics')
  const [qScore, setQScore] = useState(20)
  const [referenceReads, setReferenceReads] = useState(70)
  const [alternateReads, setAlternateReads] = useState(30)
  const [readLengths, setReadLengths] = useState('1200, 850, 2100, 500, 1800, 3200')

  const track = BIOMEDICAL_TRACKS.find((item) => item.id === selected) ?? BIOMEDICAL_TRACKS[0]
  const evidence = useMemo(() => {
    const lengths = readLengths.split(',').map((item) => Number(item.trim())).filter(Number.isFinite)
    return {
      error: phredErrorProbability(qScore),
      vaf: variantAlleleFraction(referenceReads, alternateReads),
      n50: n50(lengths),
    }
  }, [qScore, referenceReads, alternateReads, readLengths])

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-brand/[0.04] p-4 dark:border-white/10 dark:from-white/[0.04] dark:to-brand/[0.04]">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">Panacea Biomedical Technology Engine</div>
        <h2 className="mt-1 text-lg font-black text-ink dark:text-white">From measured data → evidence → 3D mechanism → reviewed decision support</h2>
        <p className="mt-1 max-w-4xl text-[11px] leading-relaxed text-neutral-500">
          A production scaffold for genomic sequencing, precision hematology/oncology, single-cell multi-omics, radiology-to-3D, neuro/pathway/bioelectric visualization and longitudinal health. It organizes evidence and simulations; it does not autonomously manufacture therapies or promote research output into a clinical fact.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-white/5">
        {VIEWS.map((item) => (
          <button key={item.key} type="button" aria-pressed={view === item.key} onClick={() => setView(item.key)} className={`rounded-lg px-2 py-2 text-[10px] font-bold transition ${view === item.key ? 'bg-white text-ink shadow-sm dark:bg-white/10 dark:text-white' : 'text-neutral-500'}`}>
            {item.label}
          </button>
        ))}
      </div>

      {view === 'engine' && (
        <div className="space-y-3">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {BIOMEDICAL_TRACKS.map((item) => (
              <button key={item.id} type="button" onClick={() => setSelected(item.id)} className={`rounded-2xl border p-3 text-left transition ${selected === item.id ? 'border-brand bg-brand/[0.05]' : 'border-neutral-200 dark:border-white/10'}`}>
                <div className="flex items-center justify-between gap-2"><span className="text-[9px] font-black tracking-[0.12em] text-brand">{DOMAIN_ICON[item.id]}</span><Pill>{item.evidenceLevel}</Pill></div>
                <div className="mt-1 text-sm font-black text-ink dark:text-white">{item.label}</div>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{item.mission}</p>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><div className="text-[10px] font-bold uppercase tracking-wide text-brand">Selected pipeline</div><div className="text-base font-black text-ink dark:text-white">{track.label}</div></div><Pill>{track.evidenceLevel}</Pill></div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div><div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Inputs</div><div className="mt-1 flex flex-wrap gap-1">{track.inputs.map((x) => <Pill key={x}>{x}</Pill>)}</div></div>
              <div><div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Outputs</div><div className="mt-1 flex flex-wrap gap-1">{track.outputs.map((x) => <Pill key={x}>{x}</Pill>)}</div></div>
              <div><div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">3D / visual layers</div><div className="mt-1 flex flex-wrap gap-1">{track.visualLayers.map((x) => <Pill key={x}>{x}</Pill>)}</div></div>
            </div>
            <div className="mt-3 rounded-xl border-l-4 border-amber-400 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">{track.clinicalBoundary}</div>
          </div>

          <div className="grid gap-2 md:grid-cols-5">
            {['Measured data', 'QC + provenance', 'Evidence graph', '3D mechanism', 'Human-reviewed output'].map((item, index) => (
              <div key={item} className="relative rounded-xl border border-neutral-200 p-3 text-center dark:border-white/10">
                <div className="text-[9px] font-black text-brand">0{index + 1}</div><div className="mt-1 text-[11px] font-bold text-ink dark:text-white">{item}</div>{index < 4 && <span className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-neutral-300 md:block">→</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'data' && (
        <div className="space-y-2">
          {BIOMEDICAL_DATA_CONTRACTS.map((item) => (
            <div key={item.id} className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-2"><div className="text-sm font-black text-ink dark:text-white">{item.label}</div><Pill>{item.status}</Pill></div>
              <div className="mt-1 flex flex-wrap gap-1">{item.formats.map((format) => <Pill key={format}>{format}</Pill>)}</div>
              <p className="mt-2 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{item.purpose}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-neutral-400">Provenance rule: {item.provenance}</p>
            </div>
          ))}
        </div>
      )}

      {view === 'evidence' && (
        <div className="space-y-4">
          <p className="text-[11px] leading-relaxed text-neutral-500">Small transparent calculations for sequencing and evidence QA. These are mathematical utilities, not a disease classifier.</p>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="rounded-xl border border-neutral-200 p-3 text-xs font-bold text-ink dark:border-white/10 dark:text-white">Phred Q: {qScore}<input className="mt-2 w-full accent-brand" type="range" min="0" max="50" step="1" value={qScore} onChange={(e) => setQScore(Number(e.target.value))} /><span className="mt-2 block text-[10px] font-normal text-neutral-500">p(error) = 10<sup>−Q/10</sup> = {evidence.error.toExponential(2)}</span></label>
            <div className="rounded-xl border border-neutral-200 p-3 dark:border-white/10"><div className="text-xs font-bold text-ink dark:text-white">Variant allele fraction</div><div className="mt-2 grid grid-cols-2 gap-2"><input type="number" min="0" value={referenceReads} onChange={(e) => setReferenceReads(Number(e.target.value))} className="rounded-lg border border-neutral-200 bg-transparent p-2 text-xs dark:border-white/10" aria-label="Reference reads"/><input type="number" min="0" value={alternateReads} onChange={(e) => setAlternateReads(Number(e.target.value))} className="rounded-lg border border-neutral-200 bg-transparent p-2 text-xs dark:border-white/10" aria-label="Alternate reads"/></div><div className="mt-2 text-[10px] text-neutral-500">VAF = alt/(ref+alt) = {(evidence.vaf * 100).toFixed(1)}%</div></div>
            <label className="rounded-xl border border-neutral-200 p-3 text-xs font-bold text-ink dark:border-white/10 dark:text-white">Read lengths<input value={readLengths} onChange={(e) => setReadLengths(e.target.value)} className="mt-2 w-full rounded-lg border border-neutral-200 bg-transparent p-2 font-mono text-[10px] font-normal dark:border-white/10"/><span className="mt-2 block text-[10px] font-normal text-neutral-500">N50 = {evidence.n50.toLocaleString()} bp</span></label>
          </div>
          <div className="rounded-2xl bg-neutral-950 p-4 font-mono text-[11px] leading-relaxed text-neutral-100"><div className="text-brand">Transparent formulas</div><div className="mt-2">p(error) = 10^(−Q/10)</div><div>VAF = n_alt / (n_ref + n_alt)</div><div>N50 = length L where ≥50% of total sequence length lies in reads/contigs of length ≥ L</div><div>posterior odds = prior odds × ∏ LRᵢ (only when validated likelihood ratios exist)</div></div>
        </div>
      )}

      {view === 'validation' && (
        <div className="space-y-2">
          {VALIDATION_GATES.map((gate) => (
            <div key={gate.id} className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-2"><div className="text-sm font-black text-ink dark:text-white">{gate.label}</div>{gate.blocksAutonomy && <Pill>blocks autonomous promotion</Pill>}</div>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{gate.requirement}</p>
              <div className="mt-2 flex flex-wrap gap-1">{gate.appliesTo.map((domain) => <Pill key={domain}>{domain}</Pill>)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-neutral-100 pt-3 text-[10px] leading-relaxed text-neutral-400 dark:border-white/5">
        Architecture rule: raw measurements, algorithmic outputs, published evidence, educational simulation and clinician-validated conclusions must remain separate data classes with visible provenance. The future engine may become more capable; it must not become less auditable.
      </div>
    </div>
  )
}

export default BiomedicalEngineLab
