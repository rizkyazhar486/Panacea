import { useMemo, useState } from 'react'
import {
  BIOCHEMICAL_COMPOUNDS_DATASET,
  CHEMICAL_ELEMENTS_DATASET,
  CURATED_GENE_LOCI,
  MULTISCALE_TIER_ORDER,
  ORGANELLES_DATASET,
  QUANTUM_BIO_PROCESSES,
  SPECIALIZED_CELLS_DATASET,
  TISSUES_DATASET,
  UNIVERSAL_VISUAL_DEMOGRAPHIC_PRESETS,
  simulateFsd15DigitalTwinFrame,
  simulatePointMutationEffect,
  type MultiscaleTierId,
  type VisualDemographicId,
} from '../../engines/reality-view/universalMultiscaleBioAtlasDataset'

export default function Fsd15BioTelemetryStudio() {
  const [demographicId, setDemographicId] = useState<VisualDemographicId>('wanita')
  const [tier, setTier] = useState<MultiscaleTierId>('human_twin')
  const [exertionMet, setExertionMet] = useState<number>(1.5)
  const [spo2Pct, setSpo2Pct] = useState<number>(98)
  const [glucoseMgDl, setGlucoseMgDl] = useState<number>(92)
  const [tunnelingGap, setTunnelingGap] = useState<number>(11)
  const [geneSymbol, setGeneSymbol] = useState<string>('MYH7')
  const [mutPos, setMutPos] = useState<number>(6)
  const [mutBase, setMutBase] = useState<'A' | 'T' | 'C' | 'G'>('A')
  const [showInfo, setShowInfo] = useState<boolean>(false)

  const frame = useMemo(
    () =>
      simulateFsd15DigitalTwinFrame({
        demographicId,
        exertionMet,
        spo2Pct,
        glucoseMgDl,
        geneSymbol,
        tunnelingGapAngstrom: tunnelingGap,
      }),
    [demographicId, exertionMet, spo2Pct, glucoseMgDl, geneSymbol, tunnelingGap],
  )

  const mutation = useMemo(
    () => simulatePointMutationEffect(frame.genomicStream.gene.codingDna5to3, mutPos, mutBase),
    [frame.genomicStream.gene.codingDna5to3, mutPos, mutBase],
  )

  const calmMode = frame.sensoryFriendlyUiMode

  return (
    <section
      data-fsd15-bio-telemetry
      aria-label="FSD-15 Multiscale Demographic Digital Twin Visualizer"
      className={`dark space-y-3 rounded-2xl border p-3.5 text-white ${
        calmMode ? 'border-emerald-400/25 bg-[#060d14]' : 'border-cyan-400/25 bg-[#030711]'
      }`}
    >
      {/* Header: Minimalist FSD-15 Telemetry HUD */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
          <strong className="font-mono text-xs font-black tracking-wide text-cyan-100">
            FSD-15 BIO-TELEMETRY · QUANTUM → HUMAN TWIN
          </strong>
          {calmMode && (
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 font-mono text-[9.5px] font-bold text-emerald-200">
              CALM SENSORY / HIGH-CLARITY
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full border border-amber-400/35 bg-amber-500/10 px-2 py-0.5 font-mono text-[9.5px] text-amber-200">
            EDUCATIONAL SIMULATION
          </span>
          <button
            type="button"
            onClick={() => setShowInfo((v) => !v)}
            aria-label="FSD-15 model epistemic note"
            className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/5 font-mono text-xs font-black text-white/80"
          >
            i
          </button>
        </div>
      </div>

      {showInfo && (
        <div className="rounded-xl border border-cyan-400/20 bg-slate-950/90 px-3 py-2 text-[11px] text-slate-300">
          Educational multiscale digital-twin visualizer (non-diagnostic). Quantum entries use established Marcus/WKB biophysics approximations. Autism preset activates calm low-glare sensory telemetry with dignity.
        </div>
      )}

      {/* 10 Inclusive Human Demographic Selector Pills */}
      <div className="flex flex-wrap gap-1" role="group" aria-label="Human demographic presets">
        {UNIVERSAL_VISUAL_DEMOGRAPHIC_PRESETS.map((p) => {
          const active = p.id === demographicId
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setDemographicId(p.id)
                setSpo2Pct(p.normalSpo2Pct)
              }}
              aria-pressed={active}
              className={`min-h-[34px] rounded-xl border px-2.5 font-mono text-[10px] font-black transition ${
                active
                  ? 'border-cyan-300/70 bg-cyan-500/25 text-white'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25'
              }`}
            >
              {p.labelId}
            </button>
          )
        })}
      </div>

      {/* 11-Tier Multiscale Ribbon (Quantum -> Element -> Compound -> DNA -> RNA -> Organelle -> Cell -> Tissue -> Organ -> Twin) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar" role="tablist" aria-label="Multiscale biological depth">
        {MULTISCALE_TIER_ORDER.map((t) => {
          const active = t.id === tier
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTier(t.id)}
              className={`min-h-[34px] shrink-0 rounded-lg border px-2 font-mono text-[10px] font-bold ${
                active
                  ? 'border-amber-300/70 bg-amber-500/20 text-amber-100'
                  : 'border-white/10 bg-slate-950/80 text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* FSD-15 Live Vector Flow Stage + Synchronized Controls */}
      <div className="grid gap-3 lg:grid-cols-12">
        {/* Left: Calm FSD-15 Demographic Silhouette & Live Vector Telemetry Lanes */}
        <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-950/90 p-3 lg:col-span-5">
          <div className="flex items-center justify-between font-mono text-[10px]">
            <span className="font-black text-cyan-200">{frame.preset.labelId}</span>
            <span className="text-slate-400">{frame.manifold.heightCm} cm · {frame.manifold.weightKg} kg</span>
          </div>

          <svg viewBox="0 0 160 110" className="my-2 h-36 w-full" role="img" aria-label={`FSD-15 vector twin ${frame.preset.labelEn}`}>
            <path d="M12 96 L46 20 M148 96 L114 20" stroke="rgba(56,189,248,0.2)" strokeWidth="1" strokeDasharray="3 3" />
            <ellipse cx="80" cy="96" rx="44" ry="7" fill="rgba(34,211,238,0.12)" stroke="rgba(56,189,248,0.4)" strokeWidth="0.8" />
            {frame.preset.silhouetteProfile === 'twin_infants' ? (
              <>
                <circle cx="64" cy="36" r="10" fill="rgba(56,189,248,0.22)" stroke="#38bdf8" strokeWidth="1.2" />
                <rect x="55" y="48" width="18" height="34" rx="7" fill="rgba(56,189,248,0.18)" stroke="#38bdf8" strokeWidth="1.2" />
                <circle cx="96" cy="36" r="10" fill="rgba(52,211,153,0.22)" stroke="#34d399" strokeWidth="1.2" />
                <rect x="87" y="48" width="18" height="34" rx="7" fill="rgba(52,211,153,0.18)" stroke="#34d399" strokeWidth="1.2" />
              </>
            ) : (
              <>
                <circle cx="80" cy={frame.preset.silhouetteProfile === 'infant' ? 30 : 22} r={frame.preset.silhouetteProfile === 'infant' ? 12 : 9} fill="rgba(56,189,248,0.22)" stroke="#67e8f9" strokeWidth="1.2" />
                <path
                  d={
                    frame.preset.silhouetteProfile === 'pregnant'
                      ? 'M68 34 L92 34 L98 62 C98 76 62 76 62 62 Z'
                      : frame.preset.silhouetteProfile === 'senior_kyphotic'
                        ? 'M70 33 Q88 45 86 68 L68 68 Q66 50 70 33 Z'
                        : 'M68 33 L92 33 L95 72 L65 72 Z'
                  }
                  fill="rgba(34,211,238,0.16)"
                  stroke="#67e8f9"
                  strokeWidth="1.2"
                />
                <circle cx="82" cy="48" r="4" fill="#fb7185" />
                <circle cx="74" cy="47" r="3.5" fill="#38bdf8" />
                <circle cx="80" cy="60" r="3" fill="#34d399" />
              </>
            )}
          </svg>

          {/* 4 Live Synchronized Vector Bars */}
          <div className="space-y-1.5 font-mono text-[10px]">
            {frame.vectorLanes.map((lane) => (
              <div key={lane.id} className="space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-slate-300">{lane.label}</span>
                  <span style={{ color: lane.color }} className="font-black">{lane.unitLabel}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full" style={{ width: `${lane.flowPct}%`, backgroundColor: lane.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Scale-Specific Interactive Inspector + Physiology Sliders */}
        <div className="flex flex-col justify-between gap-2.5 lg:col-span-7">
          {/* Live Simulation Sliders */}
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 font-mono text-[10px]">
            <label className="flex flex-col gap-0.5 rounded-xl border border-white/10 bg-slate-950/80 p-2 text-emerald-200">
              <span>Exertion {exertionMet} MET</span>
              <input type="range" min={1} max={10} step={0.5} value={exertionMet} onChange={(e) => setExertionMet(Number(e.target.value))} className="accent-emerald-400" />
            </label>
            <label className="flex flex-col gap-0.5 rounded-xl border border-white/10 bg-slate-950/80 p-2 text-cyan-200">
              <span>SpO2 {spo2Pct}%</span>
              <input type="range" min={78} max={100} value={spo2Pct} onChange={(e) => setSpo2Pct(Number(e.target.value))} className="accent-cyan-400" />
            </label>
            <label className="flex flex-col gap-0.5 rounded-xl border border-white/10 bg-slate-950/80 p-2 text-amber-200">
              <span>Glucose {glucoseMgDl}</span>
              <input type="range" min={55} max={280} step={5} value={glucoseMgDl} onChange={(e) => setGlucoseMgDl(Number(e.target.value))} className="accent-amber-400" />
            </label>
            <label className="flex flex-col gap-0.5 rounded-xl border border-white/10 bg-slate-950/80 p-2 text-violet-200">
              <span>e⁻ Gap {tunnelingGap} Å</span>
              <input type="range" min={5} max={18} step={0.5} value={tunnelingGap} onChange={(e) => setTunnelingGap(Number(e.target.value))} className="accent-violet-400" />
            </label>
          </div>

          {/* Active Tier Dynamic Data Surface */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/90 p-3">
            {tier === 'quantum' && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between font-mono text-[10px] text-violet-200">
                  <span>ELECTRON TUNNELING FACTOR ({tunnelingGap} Å)</span>
                  <span className="font-black">{frame.organelleQuantumLevel.electronTunnelingAttenuation}</span>
                </div>
                {QUANTUM_BIO_PROCESSES.map((q) => (
                  <div key={q.id} className="rounded-xl border border-violet-400/20 bg-violet-950/20 p-2">
                    <div className="font-mono text-[10px] font-black text-violet-200">{q.name}</div>
                    <div className="font-mono text-[10px] text-cyan-300">{q.equationLabel}</div>
                    <div className="text-[11px] text-slate-300">{q.physiologicalLink}</div>
                  </div>
                ))}
              </div>
            )}

            {tier === 'element' && (
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 font-mono text-[10px]">
                {CHEMICAL_ELEMENTS_DATASET.map((el) => (
                  <div key={el.symbol} className="rounded-xl border border-cyan-400/20 bg-slate-900/90 p-1.5">
                    <div className="flex items-center justify-between text-cyan-300">
                      <span>Z={el.atomicNumber}</span>
                      <span className="text-slate-400">{el.humanBodyMassPct}%</span>
                    </div>
                    <div className="text-sm font-black text-white">{el.symbol}</div>
                    <div className="truncate text-[9px] text-slate-400">{el.name}</div>
                  </div>
                ))}
              </div>
            )}

            {tier === 'compound' && (
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 font-mono text-[10px]">
                {BIOCHEMICAL_COMPOUNDS_DATASET.map((c) => (
                  <div key={c.id} className="rounded-xl border border-emerald-400/20 bg-slate-900/90 p-2">
                    <div className="font-black text-emerald-200">{c.formula} · {c.name}</div>
                    <div className="text-[9.5px] text-cyan-300">{c.chebiId} · {c.normalRange}</div>
                    <div className="truncate text-[9.5px] text-slate-400">{c.organCoupling}</div>
                  </div>
                ))}
              </div>
            )}

            {(tier === 'dna_strand' || tier === 'rna') && (
              <div className="space-y-2 font-mono text-[10px]">
                <div className="flex flex-wrap items-center gap-1">
                  {CURATED_GENE_LOCI.map((g) => (
                    <button
                      key={g.symbol}
                      type="button"
                      onClick={() => setGeneSymbol(g.symbol)}
                      className={`min-h-[30px] rounded-lg border px-2 font-black ${
                        geneSymbol === g.symbol ? 'border-cyan-300 bg-cyan-500/25 text-white' : 'border-white/10 bg-white/5 text-slate-400'
                      }`}
                    >
                      {g.symbol} ({g.chromosome})
                    </button>
                  ))}
                </div>
                <div className="space-y-1 rounded-xl border border-white/10 bg-black/50 p-2">
                  <div><span className="text-cyan-300">5&apos;→3&apos; DNA:</span> {mutation.original.codingStrand5to3}</div>
                  <div><span className="text-violet-300">3&apos;→5&apos; CMP:</span> {mutation.original.templateStrand3to5}</div>
                  <div><span className="text-emerald-300">mRNA:     </span> {mutation.original.mrna5to3}</div>
                  <div><span className="text-amber-300">Protein:  </span> {mutation.original.aminoAcids.join('-')}</div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 px-2.5 py-1.5">
                  <span>Point Mutation idx {mutPos} → {mutBase}: <strong className="text-amber-200">{mutation.classification}</strong></span>
                  <div className="flex items-center gap-1">
                    <input type="range" min={0} max={24} value={mutPos} onChange={(e) => setMutPos(Number(e.target.value))} className="w-16 accent-amber-400" />
                    {(['A', 'T', 'C', 'G'] as const).map((b) => (
                      <button key={b} type="button" onClick={() => setMutBase(b)} className={`h-6 w-6 rounded border font-black ${mutBase === b ? 'border-amber-300 bg-amber-500/30 text-white' : 'border-white/15 text-slate-400'}`}>{b}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tier === 'organelle' && (
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 text-[11px]">
                {ORGANELLES_DATASET.map((o) => (
                  <div key={o.id} className="rounded-xl border border-white/10 bg-slate-900/90 p-2">
                    <div className="font-mono text-[10px] font-black text-emerald-200">{o.name}</div>
                    <div className="text-[10px] text-slate-300">{o.role}</div>
                  </div>
                ))}
              </div>
            )}

            {tier === 'cell' && (
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 text-[10px]">
                {SPECIALIZED_CELLS_DATASET.map((c) => (
                  <div key={c.id} className="rounded-xl border border-white/10 bg-slate-900/90 p-2">
                    <div className="font-mono font-black text-cyan-200">{c.name}</div>
                    <div className="text-[9.5px] text-amber-200">{c.organ}</div>
                    <div className="text-[9.5px] text-slate-400">{c.specialty}</div>
                  </div>
                ))}
              </div>
            )}

            {tier === 'tissue' && (
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 text-[10px]">
                {TISSUES_DATASET.map((t) => (
                  <div key={t.id} className="rounded-xl border border-white/10 bg-slate-900/90 p-2">
                    <div className="font-mono font-black text-violet-200">{t.name}</div>
                    <div className="text-[9.5px] text-slate-400">{t.organ} · {t.cellLink}</div>
                  </div>
                ))}
              </div>
            )}

            {(tier === 'organ' || tier === 'organ_system' || tier === 'human_twin') && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 font-mono text-[10px]">
                  <div className="rounded-xl border border-white/10 bg-slate-900/90 p-2">
                    <div className="text-slate-400">HR / CO</div>
                    <div className="font-black text-rose-200">{frame.organLevel.heartRateBpm} bpm · {frame.organLevel.cardiacOutputLMin} L/m</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-900/90 p-2">
                    <div className="text-slate-400">DO₂ / VA</div>
                    <div className="font-black text-cyan-200">{frame.organLevel.oxygenDeliveryMlMin} · {frame.organLevel.alveolarVentilationLMin} L/m</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-900/90 p-2">
                    <div className="text-slate-400">ATP / ΔΨm</div>
                    <div className="font-black text-emerald-200">{frame.cellularLevel.estimatedAtpTurnoverMmolMin} · {frame.organelleQuantumLevel.protonGradientMv}mV</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-900/90 p-2">
                    <div className="text-slate-400">GLUCOSE STATE</div>
                    <div className="font-black text-amber-200">{frame.cellularLevel.glucoseUtilizationState}</div>
                  </div>
                </div>
                {frame.twinDualTelemetry && (
                  <div className="rounded-xl border border-emerald-400/30 bg-emerald-950/30 px-2.5 py-1.5 font-mono text-[10px] text-emerald-200">
                    Twin-A HR: {frame.twinDualTelemetry.twinAHrBpm} bpm · Twin-B HR: {frame.twinDualTelemetry.twinBHrBpm} bpm · Growth Symmetry: {frame.twinDualTelemetry.twinWeightSymmetryPct}%
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  {frame.preset.anatomyHighlights.map((h) => (
                    <span key={h} className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[9.5px] text-cyan-200">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
