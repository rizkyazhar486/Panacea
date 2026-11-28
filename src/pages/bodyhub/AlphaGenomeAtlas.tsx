import { useEffect, useMemo, useState } from 'react';
import {
  ALPHA_GENOME_ATLAS_BOUNDARY,
  ALPHA_GENOME_SEED_RECORDS,
  ALPHA_GENOME_SOURCES,
} from '../../lib/alphaGenomeAtlas';
import { StructureViewer3D, type StructureStats } from './structure/StructureViewer3D';
import type { ColourScheme } from './structure/cartoon';

// Every 3D view here is a deposited or predicted structure fetched by
// scripts/bangun/ambil-struktur-3d.mjs (AlphaFold DB, RCSB PDB); nothing is a
// stand-in shape. public/struktur/manifest.json carries source and hash.

type ManifestEntry = {
  id: string; kind: 'alphafold' | 'pdb'; gene?: string; uniprot?: string; pdbId?: string; title: string
  length?: number; meanPlddt?: number; method?: string; resolutionA?: number | null; reason?: string; sourceUrl: string; file: string
};

type ViewId = 'protein' | 'dna' | 'chromatin' | 'rna' | 'hemoglobin' | 'insulin' | 'myoglobin' | 'lysozyme' | 'ace2';
const VIEWS: { id: ViewId; label: string; entry?: string; nucleic?: boolean; caption?: string }[] = [
  { id: 'protein', label: 'Protein' },
  { id: 'dna', label: 'DNA', entry: '1bna', nucleic: true, caption: 'The B-DNA double helix: two antiparallel strands, bases paired across the core, read from X-ray diffraction of the Drew–Dickerson dodecamer.' },
  { id: 'chromatin', label: 'Chromatin', entry: '1kx5', nucleic: true, caption: 'The nucleosome, the first level of genome packing: DNA wrapped around an octamer of histone proteins.' },
  { id: 'rna', label: 'RNA', entry: '1ehz', nucleic: true, caption: 'Transfer RNA folds into an L shape; one end reads the codon, the other carries the amino acid to the ribosome.' },
  { id: 'hemoglobin', label: 'Hemoglobin', entry: '4hhb', caption: 'Human deoxyhaemoglobin tetramer (2 alpha + 2 beta globin chains with iron-haem ligands) solved by X-ray crystallography.' },
  { id: 'insulin', label: 'Insulin', entry: '4ins', caption: 'Human insulin peptide hormone (disulfide-linked A and B chains around Zn2+ coordination) regulating systemic glucose uptake.' },
  { id: 'myoglobin', label: 'Myoglobin', entry: '3rgk', caption: 'Human myoglobin monomeric oxygen-storage globin in skeletal and cardiac muscle folding 8 alpha-helices around haem.' },
  { id: 'lysozyme', label: 'Lysozyme', entry: '1rex', caption: 'Human lysozyme innate antimicrobial enzyme in tears, saliva and airway mucus that cleaves bacterial cell walls.' },
  { id: 'ace2', label: 'ACE2', entry: '1r42', caption: 'Human angiotensin-converting enzyme 2 (ACE2) carboxypeptidase ectodomain governing cardiovascular RAAS vascular tone.' },
];

type LegendItem = { label: string; range?: string; colour: string };
const PLDDT_LEGEND: LegendItem[] = [
  { label: 'Very high', range: '> 90', colour: '#0053d6' },
  { label: 'Confident', range: '70–90', colour: '#65cbf3' },
  { label: 'Low', range: '50–70', colour: '#ffdb13' },
  { label: 'Very low', range: '< 50', colour: '#ff7d45' },
];
const BASE_LEGEND: LegendItem[] = [
  { label: 'A', colour: '#f03e3e' }, { label: 'T', colour: '#1c7ed6' }, { label: 'G', colour: '#2fb344' }, { label: 'C', colour: '#f5b800' }, { label: 'U', colour: '#0fb5c9' },
];
const SECONDARY_LEGEND: LegendItem[] = [
  { label: 'α-helix', colour: '#f43f5e' },
  { label: 'β-strand', colour: '#f59e0b' },
  { label: 'Coil', colour: '#94a3b8' },
];
const HYDROPATHY_LEGEND: LegendItem[] = [
  { label: 'Hydrophilic', range: '-4.5', colour: '#0284c7' },
  { label: 'Neutral', range: '0', colour: '#e2e8f0' },
  { label: 'Hydrophobic', range: '+4.5', colour: '#ea580c' },
];

const SCHEME_OPTIONS: { id: ColourScheme; label: string; alphafoldOnly?: boolean }[] = [
  { id: 'plddt', label: 'pLDDT', alphafoldOnly: true },
  { id: 'secondary', label: 'DSSP' },
  { id: 'hydrophobicity', label: 'Hydropathy' },
  { id: 'chain', label: 'Chain' },
  { id: 'rainbow', label: 'N→C' },
];

function useManifest() {
  const [entries, setEntries] = useState<ManifestEntry[] | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`${import.meta.env.BASE_URL}struktur/manifest.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((m: { entries: ManifestEntry[] }) => { if (live) setEntries(m.entries); })
      .catch(() => { if (live) setEntries([]); });
    return () => { live = false; };
  }, []);
  return entries;
}

export default function AlphaGenomeAtlas() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(ALPHA_GENOME_SEED_RECORDS[0].id);
  const [view, setView] = useState<ViewId>('protein');
  const [schemePref, setSchemePref] = useState<ColourScheme>('plddt');
  const [spinning, setSpinning] = useState(true);
  const [stats, setStats] = useState<StructureStats | null>(null);
  const manifest = useManifest();
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return ALPHA_GENOME_SEED_RECORDS;
    return ALPHA_GENOME_SEED_RECORDS.filter((record) =>
      [record.symbol, record.label, record.chromosome, record.locus, ...record.bodySystems, record.role]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [query]);
  const selected = ALPHA_GENOME_SEED_RECORDS.find((record) => record.id === selectedId) ?? ALPHA_GENOME_SEED_RECORDS[0];
  const activeView = VIEWS.find((v) => v.id === view)!;
  const entry = manifest?.find((e) => e.id === (view === 'protein' ? selected.symbol.toLowerCase() : activeView.entry));
  const plddt = entry?.kind === 'alphafold';
  const activeScheme: ColourScheme = schemePref === 'plddt' && !plddt ? (activeView.nucleic ? 'chain' : 'secondary') : schemePref;

  let legend: LegendItem[] = [];
  if (activeView.nucleic && activeScheme === 'chain') legend = BASE_LEGEND;
  else if (activeScheme === 'plddt') legend = PLDDT_LEGEND;
  else if (activeScheme === 'secondary') legend = SECONDARY_LEGEND;
  else if (activeScheme === 'hydrophobicity') legend = HYDROPATHY_LEGEND;

  let caption = activeView.caption;
  if (view === 'protein') {
    const hoverHint = 'Hover the ribbon to inspect residue, DSSP secondary structure, pLDDT or Kyte–Doolittle hydropathy.';
    if (plddt) caption = `${selected.symbol} predicted by AlphaFold DB v6 (${selected.locus}). Switch colourings between pLDDT confidence, DSSP helices/strands, Kyte–Doolittle hydropathy, chains or N→C spectrum. ${hoverHint}`;
    else if (entry?.reason) caption = `${entry.reason}; showing the experimental structure instead. ${hoverHint}`;
    else caption = hoverHint;
  }

  return (
    <section className="dark space-y-3" aria-labelledby="alpha-genome-title" data-genome-structure-viewer="v3">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.2em] text-violet-300">Chromosome → locus → gene → transcript → variant → protein → pathway</p>
          <h2 id="alpha-genome-title" className="mt-1 text-2xl font-black tracking-[-.03em] text-white sm:text-3xl">Alpha Genome &amp; Proteomics Atlas</h2>
        </div>
      </header>

      <div className="relative overflow-hidden rounded-[26px] border border-white/[.08] bg-[radial-gradient(120%_90%_at_50%_35%,#16213f_0%,#070a17_55%,#020308_100%)]">
        <div className="no-scrollbar relative z-10 mx-3 mt-3 flex gap-1 overflow-x-auto rounded-full border border-white/10 bg-black/50 p-1 backdrop-blur-md" role="tablist" aria-label="Structure view">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={v.id === view}
              onClick={() => { setView(v.id); setStats(null); }}
              className={`min-h-11 shrink-0 rounded-full px-3 text-[11px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 sm:px-3.5 ${v.id === view ? 'bg-white text-black' : 'text-white/65 hover:text-white'}`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="relative aspect-square max-h-[78vh] w-full sm:aspect-[16/9]">
          {entry ? (
            <StructureViewer3D
              key={`${entry.file}:${activeScheme}`}
              url={`${import.meta.env.BASE_URL}struktur/${entry.file}`}
              label={entry.title}
              scheme={activeScheme}
              autoRotate={spinning}
              onStats={setStats}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center px-6 text-center text-[12px] font-bold text-white/45" role="status">
              {manifest === null ? 'Loading structure index…' : `No deposited or predicted structure is bundled for ${selected.symbol}.`}
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2 sm:inset-x-5 sm:top-5">
            <div className="max-w-[min(32rem,75%)]">
              <div className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-200/70">
                {view === 'protein' ? `${selected.symbol} · chr${selected.chromosome} ${selected.locus}` : activeView.label}
              </div>
              <div className="mt-1 text-lg font-black leading-tight tracking-[-.02em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,.7)] sm:text-2xl">{entry?.title ?? selected.label}</div>
              {entry && (
                <div className="mt-1 text-[11px] font-semibold text-white/60">
                  {plddt
                    ? `AlphaFold prediction · ${entry.length} aa · mean pLDDT ${entry.meanPlddt?.toFixed(1)}`
                    : `${entry.method?.toLowerCase()}${entry.resolutionA ? ` · ${entry.resolutionA} Å` : ''} · PDB ${entry.pdbId}`}
                  {stats && ` · ${[stats.protein && `${stats.protein} residues`, stats.nucleotide && `${stats.nucleotide} nucleotides`, stats.chains && `${stats.chains} chains`].filter(Boolean).join(' · ')}`}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-t border-white/[.06] bg-black/40 px-3 py-2.5 sm:px-5">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex flex-wrap gap-1" role="group" aria-label="Ribbon colouring scheme">
              {SCHEME_OPTIONS.filter((opt) => !opt.alphafoldOnly || plddt).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={activeScheme === opt.id}
                  onClick={() => setSchemePref(opt.id)}
                  className={`min-h-9 rounded-full border px-2.5 text-[10px] font-black transition ${
                    activeScheme === opt.id
                      ? 'border-cyan-300/70 bg-cyan-400/20 text-white'
                      : 'border-white/15 bg-black/40 text-white/65 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {legend.length > 0 && (
              <div className="flex flex-wrap gap-1.5 rounded-2xl border border-white/10 bg-black/45 px-2.5 py-1.5">
                {legend.map((item) => (
                  <span key={item.label} className="flex items-center gap-1 text-[10px] font-bold text-white/75">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.colour }} />
                    {item.label}{item.range && <span className="text-white/40">{item.range}</span>}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-pressed={!spinning}
              onClick={() => setSpinning((s) => !s)}
              className="min-h-9 rounded-full border border-white/15 bg-black/50 px-3 text-[10px] font-black text-white/75 hover:text-white"
            >
              {spinning ? 'Pause spin' : 'Spin 3D'}
            </button>
            {entry && (
              <a href={entry.kind === 'alphafold' ? `https://alphafold.ebi.ac.uk/entry/${entry.uniprot}` : `https://www.rcsb.org/structure/${entry.pdbId}`} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center rounded-full border border-white/15 bg-black/50 px-3 text-[10px] font-black text-white/75 hover:text-white">
                {entry.kind === 'alphafold' ? `AlphaFold DB · ${entry.uniprot}` : `RCSB PDB · ${entry.pdbId}`} ↗
              </a>
            )}
          </div>
        </div>
      </div>

      <p className="text-[12px] leading-relaxed text-slate-300">
        {caption}
      </p>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(300px,.6fr)]">
        <div className="space-y-2">
          <label className="sr-only" htmlFor="alpha-genome-search">Search atlas</label>
          <input id="alpha-genome-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search atlas: TP53, brain, chromosome 17…" className="min-h-11 w-full rounded-full border border-white/10 bg-white/[.04] px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-violet-400" />
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
            {filtered.map((record) => (
              <button key={record.id} type="button" aria-pressed={record.id === selected.id} onClick={() => { setSelectedId(record.id); setView('protein'); setStats(null); }} className="min-h-11 shrink-0 rounded-2xl border border-white/10 px-3.5 py-1.5 text-left transition hover:bg-white/[.05] aria-pressed:border-violet-300/60 aria-pressed:bg-violet-500/15">
                <span className="block text-[13px] font-black text-white">{record.symbol}</span>
                <span className="block text-[10px] font-semibold text-white/45">chr{record.chromosome} · {record.bodySystems.slice(0, 2).join(' · ')}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2 rounded-2xl border border-white/[.08] bg-white/[.03] p-3">
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-white/40">{selected.symbol} · biological role</p>
          <p className="text-[13px] leading-relaxed text-slate-200">{selected.role}</p>
          <p className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-2.5 text-[11px] text-amber-100">{selected.clinicalBoundary}</p>
        </div>
      </div>

      <details className="rounded-2xl border border-white/[.06] bg-white/[.02] px-3 py-2">
        <summary className="min-h-11 cursor-pointer content-center text-[12px] font-black text-white/70">Sources and boundary</summary>
        <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {ALPHA_GENOME_SOURCES.map((source) => (
            <article key={source.id} className="rounded-xl border border-white/[.06] p-3">
              <p className="text-sm font-medium text-white">{source.label}</p>
              <p className="mt-1 text-xs text-violet-300">{source.authority}</p>
              <p className="mt-2 text-xs text-slate-400">{source.scope}</p>
            </article>
          ))}
        </div>
        <p className="mt-2 text-xs text-amber-100/80">{ALPHA_GENOME_ATLAS_BOUNDARY} Coordinates are rendered from AlphaFold DB (CC BY 4.0) and wwPDB (CC0) files; missing coordinates or evidence stay missing rather than being synthesized.</p>
      </details>
    </section>
  );
}
