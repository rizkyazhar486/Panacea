import { useEffect, useMemo, useState } from 'react'
import {
  CENTRAL_DOGMA_REFERENCES,
  codingDnaToMrna,
  replicationFrame,
  simulateEvolution,
  transcriptionFrame,
  translationFrame,
} from '../lib/centralDogmaEvolution'

type Mode = 'replication' | 'transcription' | 'translation' | 'evolution'

const MODES: Array<{ id: Mode; label: string }> = [
  { id: 'replication', label: 'Replication' },
  { id: 'transcription', label: 'Transcription' },
  { id: 'translation', label: 'Translation' },
  { id: 'evolution', label: 'Evolution' },
]

function Strand({
  label,
  sequence,
  tone = 'neutral',
}: {
  label: string
  sequence: string
  tone?: 'neutral' | 'green' | 'orange'
}) {
  const toneClass = tone === 'green'
    ? 'text-brand-dark dark:text-brand'
    : tone === 'orange'
      ? 'text-[#FF5A1F]'
      : 'text-ink dark:text-white'
  return (
    <div className="min-w-0">
      <div className="text-[9px] font-black uppercase tracking-[0.14em] text-neutral-500">{label}</div>
      <div className={`mt-1 overflow-x-auto whitespace-nowrap font-[var(--font-angka)] text-[12px] tracking-[0.16em] ${toneClass}`}>
        {sequence || '—'}
      </div>
    </div>
  )
}

function ProcessControls({
  value,
  max,
  playing,
  onPlaying,
  onChange,
}: {
  value: number
  max: number
  playing: boolean
  onPlaying: (value: boolean) => void
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onPlaying(!playing)}
        disabled={max <= 0}
        className="min-h-[36px] min-w-[74px] rounded-full bg-brand px-3 text-[11px] font-black text-white disabled:opacity-40"
      >
        {playing ? 'Pause' : value >= max && max > 0 ? 'Replay' : 'Play'}
      </button>
      <input
        type="range"
        min={0}
        max={Math.max(0, max)}
        value={Math.min(value, max)}
        onChange={(e) => { onPlaying(false); onChange(Number(e.target.value)) }}
        className="w-full accent-brand"
        aria-label="Simulation progress"
      />
      <span className="w-[54px] shrink-0 text-right font-[var(--font-angka)] text-[10px] font-bold text-neutral-500">
        {Math.min(value, max)}/{max}
      </span>
    </div>
  )
}

export function CentralDogmaEvolutionSimulator({ codingDna }: { codingDna: string }) {
  const [mode, setMode] = useState<Mode>('replication')
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(false)

  const dna = useMemo(() => codingDna.toUpperCase().replace(/U/g, 'T').replace(/[^ACGT]/g, ''), [codingDna])
  const mrna = useMemo(() => codingDnaToMrna(dna), [dna])
  const translationAll = useMemo(() => translationFrame(mrna, Number.MAX_SAFE_INTEGER), [mrna])
  const maxProgress = mode === 'translation' ? translationAll.codons.length : dna.length

  useEffect(() => {
    setProgress(0)
    setPlaying(false)
  }, [mode, dna])

  useEffect(() => {
    if (!playing || mode === 'evolution') return
    if (progress >= maxProgress) {
      setPlaying(false)
      return
    }
    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= maxProgress) return current
        return current + 1
      })
    }, mode === 'translation' ? 650 : 120)
    return () => window.clearInterval(timer)
  }, [playing, progress, maxProgress, mode])

  useEffect(() => {
    if (playing && progress >= maxProgress) setPlaying(false)
  }, [playing, progress, maxProgress])

  return (
    <section className="mt-3 rounded-2xl border border-brand/25 bg-brand/[0.025] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-brand">Interactive mechanism simulator</div>
          <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            Scrub or play each mechanism. The sequence panels compute from the DNA above; the evolution panel is a separate
            two-allele population model so molecular change is not confused with population evolution.
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={mode === item.id}
            onClick={() => setMode(item.id)}
            className={`min-h-[34px] shrink-0 rounded-full border px-3 text-[11px] font-black transition ${
              mode === item.id
                ? 'border-brand bg-brand text-white'
                : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {mode !== 'evolution' && (
        <div className="mt-3">
          <ProcessControls
            value={progress}
            max={maxProgress}
            playing={playing}
            onPlaying={(next) => {
              if (next && progress >= maxProgress) setProgress(0)
              setPlaying(next)
            }}
            onChange={setProgress}
          />
        </div>
      )}

      {mode === 'replication' && <ReplicationPanel dna={dna} progress={progress} />}
      {mode === 'transcription' && <TranscriptionPanel dna={dna} progress={progress} />}
      {mode === 'translation' && <TranslationPanel mrna={mrna} progress={progress} />}
      {mode === 'evolution' && <EvolutionPanel />}

      <details className="mt-3 rounded-xl border border-neutral-200 px-3 py-2 dark:border-white/10">
        <summary className="cursor-pointer text-[10px] font-black uppercase tracking-[0.14em] text-neutral-500">
          Model boundaries & references
        </summary>
        <p className="mt-2 text-[10.5px] leading-relaxed text-neutral-500">
          Sequence animation is schematic: it shows information flow and base/codon bookkeeping, not molecular dynamics,
          chromatin geometry, transcription-factor kinetics, RNA processing, ribosome conformational states, or a laboratory
          protocol. The evolution model assumes one diploid locus with random mating before selection; migration, linkage,
          epistasis, spatial structure and overlapping generations are omitted.
        </p>
        <div className="mt-2 space-y-1">
          {CENTRAL_DOGMA_REFERENCES.map((ref) => (
            <a
              key={ref.url}
              href={ref.url}
              target="_blank"
              rel="noreferrer"
              className="block text-[10.5px] font-semibold text-brand-dark underline underline-offset-2 dark:text-brand"
            >
              {ref.label}
            </a>
          ))}
        </div>
      </details>
    </section>
  )
}

function ReplicationPanel({ dna, progress }: { dna: string; progress: number }) {
  const frame = useMemo(() => replicationFrame(dna, progress), [dna, progress])
  const fraction = frame.totalBases ? frame.copiedBases / frame.totalBases : 0
  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-2 rounded-xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] p-3">
        <Strand label="Parental coding · 5′→3′" sequence={frame.coding5to3} />
        <Strand label="Parental template · 3′→5′" sequence={frame.template3to5} />
        <div className="h-px bg-neutral-200 dark:bg-white/10" />
        <Strand label="New complement · displayed 3′→5′" sequence={frame.daughterAgainstCoding3to5} tone="green" />
        <Strand label="New complement · displayed 5′→3′" sequence={frame.daughterAgainstTemplate5to3} tone="green" />
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10">
        <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${fraction * 100}%` }} />
      </div>
      <p className="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
        <b>Rule:</b> A↔T and C↔G. Semiconservative replication means each daughter duplex keeps one parental strand and gains
        one newly synthesized complementary strand. Both daughter strands are synthesized 5′→3′; one is displayed 3′→5′ only to keep antiparallel base pairing aligned on screen. This base-by-base view complements the fork/Okazaki model already above.
      </p>
    </div>
  )
}

function TranscriptionPanel({ dna, progress }: { dna: string; progress: number }) {
  const frame = useMemo(() => transcriptionFrame(dna, progress), [dna, progress])
  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-2 rounded-xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] p-3">
        <Strand label="Coding DNA · 5′→3′" sequence={frame.codingDna5to3} />
        <Strand label="Template DNA read by RNA polymerase · 3′→5′" sequence={frame.templateDna3to5} />
        <Strand label="Growing RNA · 5′→3′" sequence={frame.visibleMrna5to3} tone="orange" />
      </div>
      <p className="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
        RNA polymerase reads the DNA template 3′→5′ while RNA grows 5′→3′. At this simplified coding-sequence level,
        the RNA sequence matches the coding strand except <b>U replaces T</b>. Eukaryotic capping, splicing and polyadenylation
        are deliberately outside this animation.
      </p>
    </div>
  )
}

function TranslationPanel({ mrna, progress }: { mrna: string; progress: number }) {
  const frame = useMemo(() => translationFrame(mrna, progress), [mrna, progress])
  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] p-3">
        <Strand label="mRNA · 5′→3′" sequence={frame.mrna5to3} tone="orange" />
        {frame.startIndex < 0 ? (
          <p className="mt-3 rounded-lg bg-amber-500/10 px-2.5 py-2 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
            No AUG start codon is present, so this simplified ribosome model does not initiate translation.
          </p>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {frame.codons.map((codon, index) => {
                const done = index < frame.completedCodons.length
                const current = frame.current?.index === codon.index && !frame.stopped
                return (
                  <span
                    key={`${codon.index}-${codon.codon}`}
                    className={`rounded-lg border px-2 py-1 font-[var(--font-angka)] text-[10px] font-black ${
                      done
                        ? 'border-brand/40 bg-brand/10 text-brand-dark dark:text-brand'
                        : current
                          ? 'border-[#FF5A1F]/50 bg-[#FF5A1F]/10 text-[#FF5A1F]'
                          : 'border-neutral-200 text-neutral-500 dark:border-white/10'
                    }`}
                  >
                    {codon.codon} · {codon.isStop ? 'STOP' : codon.aminoAcid}
                  </span>
                )
              })}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-neutral-200 p-2.5 dark:border-white/10">
                <div className="text-[9px] font-black uppercase tracking-[0.14em] text-neutral-500">Peptide</div>
                <div className="mt-1 font-[var(--font-angka)] text-lg font-black tracking-[0.2em] text-ink dark:text-white">
                  {frame.peptide || '—'}
                </div>
              </div>
              <div className="rounded-xl border border-neutral-200 p-2.5 dark:border-white/10">
                <div className="text-[9px] font-black uppercase tracking-[0.14em] text-neutral-500">Current decoding</div>
                <div className="mt-1 text-[11px] font-bold text-ink dark:text-white">
                  {frame.stopped
                    ? 'Stop codon reached'
                    : frame.current
                      ? `${frame.current.codon} ↔ tRNA ${frame.current.anticodon3to5 ?? 'release factor'}`
                      : 'Complete'}
                </div>
                {frame.current?.anticodon3to5 && !frame.stopped && (
                  <div className="mt-0.5 text-[10px] text-neutral-500">anticodon shown 3′→5′</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <p className="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
        <b>Formula-like bookkeeping:</b> 3 RNA nucleotides = 1 codon; each codon maps through the standard genetic code to
        one amino acid or a stop signal. The simulator begins at the first AUG and stops at the first in-frame stop codon.
      </p>
    </div>
  )
}

function EvolutionPanel() {
  const [initialP, setInitialP] = useState(0.5)
  const [populationSize, setPopulationSize] = useState(120)
  const [generations, setGenerations] = useState(40)
  const [selection, setSelection] = useState(0.08)
  const [dominance, setDominance] = useState(0.5)
  const [mutationPermille, setMutationPermille] = useState(0.2)
  const [drift, setDrift] = useState(true)
  const [seed, setSeed] = useState(73)

  const result = useMemo(() => simulateEvolution({
    initialP,
    populationSize,
    generations,
    selectionCoefficient: selection,
    dominance,
    mutationBigAToLittleA: mutationPermille / 1000,
    mutationLittleAToBigA: 0,
    drift,
    seed,
  }), [initialP, populationSize, generations, selection, dominance, mutationPermille, drift, seed])

  const points = result.generations
  const final = points[points.length - 1]
  const path = useMemo(() => {
    if (points.length < 2) return ''
    return points.map((point, i) => {
      const x = 18 + (i / Math.max(1, points.length - 1)) * 284
      const y = 110 - point.p * 92
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    }).join(' ')
  }, [points])

  return (
    <div className="mt-3 space-y-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        <Slider label="Initial allele A (p)" value={initialP} min={0.01} max={0.99} step={0.01} format={(x) => x.toFixed(2)} onChange={setInitialP} />
        <Slider label="Population (N)" value={populationSize} min={20} max={1000} step={10} format={(x) => String(Math.round(x))} onChange={setPopulationSize} />
        <Slider label="Generations" value={generations} min={5} max={100} step={5} format={(x) => String(Math.round(x))} onChange={setGenerations} />
        <Slider label="Selection (s)" value={selection} min={-0.3} max={0.3} step={0.01} format={(x) => x.toFixed(2)} onChange={setSelection} />
        <Slider label="Dominance (h)" value={dominance} min={0} max={1} step={0.05} format={(x) => x.toFixed(2)} onChange={setDominance} />
        <Slider label="A→a mutation /1000" value={mutationPermille} min={0} max={5} step={0.1} format={(x) => x.toFixed(1)} onChange={setMutationPermille} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={drift}
          onClick={() => setDrift(!drift)}
          className={`min-h-[34px] rounded-full border px-3 text-[11px] font-black ${
            drift ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'
          }`}
        >
          Genetic drift {drift ? 'on' : 'off'}
        </button>
        <button
          type="button"
          onClick={() => setSeed((current) => current + 1)}
          disabled={!drift}
          className="min-h-[34px] rounded-full border border-neutral-200 px-3 text-[11px] font-black text-neutral-600 disabled:opacity-40 dark:border-white/10 dark:text-neutral-300"
        >
          New random replicate
        </button>
      </div>

      <div className="rounded-xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] p-3">
        <svg viewBox="0 0 320 126" className="w-full" role="img" aria-label="Allele A frequency across simulated generations">
          <line x1="18" y1="110" x2="302" y2="110" stroke="currentColor" strokeOpacity="0.2" />
          <line x1="18" y1="18" x2="18" y2="110" stroke="currentColor" strokeOpacity="0.2" />
          <line x1="18" y1="64" x2="302" y2="64" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3 3" />
          <path d={path} fill="none" stroke="#00BF63" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <text x="18" y="123" className="fill-current text-[8px]" opacity="0.6">generation 0</text>
          <text x="302" y="123" textAnchor="end" className="fill-current text-[8px]" opacity="0.6">generation {generations}</text>
          <text x="8" y="21" className="fill-current text-[8px]" opacity="0.6">1</text>
          <text x="8" y="113" className="fill-current text-[8px]" opacity="0.6">0</text>
        </svg>
        {final && (
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            <Metric label="A (p)" value={final.p.toFixed(3)} />
            <Metric label="AA" value={final.AA.toFixed(3)} />
            <Metric label="Aa" value={final.Aa.toFixed(3)} />
            <Metric label="aa" value={final.aa.toFixed(3)} />
          </div>
        )}
      </div>

      <div className="space-y-1 rounded-xl border border-neutral-200 p-3 text-[10.5px] leading-relaxed text-neutral-600 dark:border-white/10 dark:text-neutral-300">
        <div><b>Hardy–Weinberg baseline:</b> p + q = 1; p² + 2pq + q² = 1.</div>
        <div><b>Selection:</b> p′ = (p²wAA + pqwAa) / w̄, where w̄ = p²wAA + 2pqwAa + q²waa.</div>
        <div><b>Mutation:</b> p″ = p′(1−μ) + (1−p′)ν. Here ν is fixed at 0 for clarity.</div>
        <div><b>Drift:</b> when enabled, the next generation samples 2N allele copies from p″; smaller N therefore fluctuates more.</div>
      </div>

      <p className="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
        In population genetics, <b>evolution means a change in allele frequency across generations</b>. Selection is only one
        cause; mutation and random genetic drift can also move the line. Turn selection to 0 and drift off to see the
        Hardy–Weinberg baseline remain stable.
      </p>
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (value: number) => string
  onChange: (value: number) => void
}) {
  return (
    <label className="rounded-xl border border-neutral-200 p-2.5 dark:border-white/10">
      <span className="flex items-center justify-between gap-2 text-[9px] font-black uppercase tracking-[0.12em] text-neutral-500">
        <span>{label}</span>
        <span className="font-[var(--font-angka)] text-[10px] text-ink dark:text-white">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-brand"
      />
    </label>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/60 px-2 py-1.5 text-center dark:bg-black/10">
      <div className="font-[var(--font-angka)] text-[12px] font-black text-ink dark:text-white">{value}</div>
      <div className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-neutral-500">{label}</div>
    </div>
  )
}

export default CentralDogmaEvolutionSimulator
