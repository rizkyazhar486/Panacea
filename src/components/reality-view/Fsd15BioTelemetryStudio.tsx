import { useMemo, useState } from 'react'
import { useVitals } from '../../lib/useVitals'
import {
  BIOCHEMICAL_COMPOUNDS_DATASET,
  CHEMICAL_ELEMENTS_DATASET,
  CURATED_GENE_LOCI,
  FSD15_EDUCATIONAL_SCENARIOS,
  MULTISCALE_TIER_ORDER,
  ORGANELLES_DATASET,
  QUANTUM_BIO_PROCESSES,
  SPECIALIZED_CELLS_DATASET,
  TISSUES_DATASET,
  UNIVERSAL_VISUAL_DEMOGRAPHIC_PRESETS,
  computeLiveOrganSystemTelemetry,
  computeLiveOrganTelemetry,
  simulateFsd15DigitalTwinFrame,
  simulatePointMutationEffect,
  traceCrossScaleCausalChain,
  type MultiscaleTierId,
  type VisualDemographicId,
} from '../../engines/reality-view/universalMultiscaleBioAtlasDataset'

const HOTSPOT_ORGAN_IDS = ['brain', 'lungs', 'heart', 'liver', 'kidneys'] as const

export default function Fsd15BioTelemetryStudio() {
  const liveVitals = useVitals()
  const rawHr = typeof liveVitals.heartRate === 'number' ? liveVitals.heartRate : liveVitals.restingHr
  const liveHr = typeof rawHr === 'number' && Number.isFinite(rawHr) ? Math.round(rawHr) : undefined
  const liveSpo2 = typeof liveVitals.spo2Pct === 'number' && Number.isFinite(liveVitals.spo2Pct) ? Math.round(liveVitals.spo2Pct) : undefined
  const hasLiveVitals = typeof liveHr === 'number' || typeof liveSpo2 === 'number'

  const [syncLiveTwin, setSyncLiveTwin] = useState<boolean>(false)
  const [demographicId, setDemographicId] = useState<VisualDemographicId>('wanita')
  const [tier, setTier] = useState<MultiscaleTierId>('human_twin')
  const [exertionMet, setExertionMet] = useState<number>(1.5)
  const [spo2Pct, setSpo2Pct] = useState<number>(98)
  const [glucoseMgDl, setGlucoseMgDl] = useState<number>(92)
  const [tunnelingGap, setTunnelingGap] = useState<number>(11)
  const [geneSymbol, setGeneSymbol] = useState<string>('MYH7')
  const [mutPos, setMutPos] = useState<number>(6)
  const [mutBase, setMutBase] = useState<'A' | 'T' | 'C' | 'G'>('A')
  const [selectedOrganId, setSelectedOrganId] = useState<string>('heart')
  const [selectedElementSym, setSelectedElementSym] = useState<string>('O')
  const [selectedCompoundId, setSelectedCompoundId] = useState<string>('atp')
  const [showInfo, setShowInfo] = useState<boolean>(false)

  const frame = useMemo(
    () =>
      simulateFsd15DigitalTwinFrame({
        demographicId,
        heartRateBpm: syncLiveTwin && liveHr ? liveHr : undefined,
        spo2Pct: syncLiveTwin && liveSpo2 ? liveSpo2 : spo2Pct,
        exertionMet,
        glucoseMgDl,
        geneSymbol,
        tunnelingGapAngstrom: tunnelingGap,
      }),
    [demographicId, syncLiveTwin, liveHr, liveSpo2, exertionMet, spo2Pct, glucoseMgDl, geneSymbol, tunnelingGap],
  )

  const organTelemetry = useMemo(() => computeLiveOrganTelemetry(frame), [frame])
  const systemTelemetry = useMemo(() => computeLiveOrganSystemTelemetry(frame), [frame])
  const causalChain = useMemo(() => traceCrossScaleCausalChain(selectedOrganId, frame), [selectedOrganId, frame])
  const activeOrgan = useMemo(
    () => organTelemetry.find((item) => item.organ.id === selectedOrganId) ?? organTelemetry[1],
    [organTelemetry, selectedOrganId],
  )
  const activeElement = useMemo(
    () => CHEMICAL_ELEMENTS_DATASET.find((el) => el.symbol === selectedElementSym) ?? CHEMICAL_ELEMENTS_DATASET[0],
    [selectedElementSym],
  )
  const activeCompound = useMemo(
    () => BIOCHEMICAL_COMPOUNDS_DATASET.find((c) => c.id === selectedCompoundId) ?? BIOCHEMICAL_COMPOUNDS_DATASET[4],
    [selectedCompoundId],
  )
  const mutation = useMemo(
    () => simulatePointMutationEffect(frame.genomicStream.gene.codingDna5to3, mutPos, mutBase),
    [frame.genomicStream.gene.codingDna5to3, mutPos, mutBase],
  )

  const calmMode = frame.sensoryFriendlyUiMode
  const hotspotOrgans = useMemo(() => {
    const ids = demographicId === 'ibu_hamil'
      ? (['brain', 'lungs', 'heart', 'liver', 'uterus_placenta'] as const)
      : HOTSPOT_ORGAN_IDS
    return ids.map((id) => organTelemetry.find((o) => o.organ.id === id)).filter((x): x is NonNullable<typeof x> => Boolean(x))
  }, [demographicId, organTelemetry])

  const applyScenario = (scenarioId: (typeof FSD15_EDUCATIONAL_SCENARIOS)[number]['id']) => {
    const sc = FSD15_EDUCATIONAL_SCENARIOS.find((s) => s.id === scenarioId)
    if (!sc) return
    setSyncLiveTwin(false)
    setExertionMet(sc.exertionMet)
    setSpo2Pct(sc.spo2Pct)
    setGlucoseMgDl(sc.glucoseMgDl)
    setTunnelingGap(sc.tunnelingGapAngstrom)
    setSelectedOrganId(sc.focusOrganId)
  }

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
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            data-fsd15-live-twin-toggle
            onClick={() => setSyncLiveTwin((v) => !v)}
            disabled={!hasLiveVitals}
            aria-pressed={syncLiveTwin}
            className={`min-h-[32px] rounded-full border px-2.5 font-mono text-[9.5px] font-black transition ${
              syncLiveTwin
                ? 'border-emerald-300/70 bg-emerald-500/25 text-emerald-100'
                : hasLiveVitals
                  ? 'border-cyan-400/35 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20'
                  : 'border-white/10 bg-white/5 text-slate-500'
            }`}
          >
            {syncLiveTwin ? `LIVE TWIN (${liveHr ?? '—'} bpm)` : hasLiveVitals ? 'SYNC LIVE TWIN' : 'NO LIVE SENSOR'}
          </button>
          <span className="rounded-full border border-amber-400/35 bg-amber-500/10 px-2 py-0.5 font-mono text-[9.5px] text-amber-200">
            {syncLiveTwin ? 'LIVE INPUT → EDU MODEL' : 'EDUCATIONAL SIMULATION'}
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
                if (p.id === 'ibu_hamil') setSelectedOrganId('uterus_placenta')
                else if (p.id === 'autism') setSelectedOrganId('brain')
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

      {/* 4 One-Tap "What's Working Inside Now" Scenario Chips + 11-Tier Scale Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="FSD-15 educational physiology scenarios">
          {FSD15_EDUCATIONAL_SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => applyScenario(sc.id)}
              className="min-h-[30px] rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-2 font-mono text-[9.5px] font-bold text-emerald-200 hover:bg-emerald-500/20"
            >
              ▶ {sc.labelId}
            </button>
          ))}
        </div>
        <span className="font-mono text-[9.5px] text-slate-400">
          Focus: <strong className="text-cyan-200">{activeOrgan.organ.nameId}</strong> · {activeOrgan.perfusionMlMin} mL/m ({activeOrgan.statusTag})
        </span>
      </div>

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
        {/* Left: Calm FSD-15 Demographic Silhouette, Interactive Hotspots & Vector Telemetry Lanes */}
        <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-950/90 p-3 lg:col-span-5">
          <div className="flex items-center justify-between font-mono text-[10px]">
            <span className="font-black text-cyan-200">{frame.preset.labelId}</span>
            <span className="text-slate-400">{frame.manifold.heightCm} cm · {frame.manifold.weightKg} kg</span>
          </div>

          <svg viewBox="0 0 160 112" className="my-2 h-40 w-full" role="img" aria-label={`FSD-15 vector twin ${frame.preset.labelEn}`}>
            {/* Perspective FSD-15 spatial lanes */}
            <path d="M10 100 L44 18 M150 100 L116 18" stroke="rgba(56,189,248,0.18)" strokeWidth="1" strokeDasharray="3 3" />
            <ellipse cx="80" cy="99" rx="46" ry="7" fill="rgba(34,211,238,0.10)" stroke="rgba(56,189,248,0.38)" strokeWidth="0.8" />

            {/* Calm Sensory-Gating Cortical Aura for Autism Profile (dignified neuro-telemetry) */}
            {frame.preset.isSensoryFriendlyNeuro && (
              <>
                <circle cx="80" cy="21" r="16" fill="none" stroke="rgba(52,211,153,0.35)" strokeWidth="0.9" strokeDasharray="2 2" />
                <circle cx="80" cy="21" r="22" fill="none" stroke="rgba(52,211,153,0.18)" strokeWidth="0.7" />
              </>
            )}

            {frame.preset.silhouetteProfile === 'twin_infants' ? (
              <>
                <circle cx="62" cy="34" r="10" fill="rgba(56,189,248,0.22)" stroke="#38bdf8" strokeWidth="1.2" />
                <path d="M52 46 Q62 43 72 46 L74 78 Q62 84 50 78 Z" fill="rgba(56,189,248,0.16)" stroke="#38bdf8" strokeWidth="1.2" />
                <circle cx="64" cy="56" r="3.2" fill="#fb7185" />
                <text x="62" y="92" textAnchor="middle" fill="#7dd3fc" fontSize="6.5" fontFamily="monospace">A {frame.twinDualTelemetry?.twinAHrBpm}bpm</text>

                <circle cx="98" cy="34" r="10" fill="rgba(52,211,153,0.22)" stroke="#34d399" strokeWidth="1.2" />
                <path d="M88 46 Q98 43 108 46 L110 78 Q98 84 86 78 Z" fill="rgba(52,211,153,0.16)" stroke="#34d399" strokeWidth="1.2" />
                <circle cx="100" cy="56" r="3.2" fill="#34d399" />
                <text x="98" y="92" textAnchor="middle" fill="#6ee7b7" fontSize="6.5" fontFamily="monospace">B {frame.twinDualTelemetry?.twinBHrBpm}bpm</text>
              </>
            ) : (
              <>
                {/* Head + Spine Axis */}
                <circle
                  cx="80"
                  cy={frame.preset.silhouetteProfile === 'infant' ? 28 : 20}
                  r={frame.preset.silhouetteProfile === 'infant' ? 12 : frame.preset.silhouetteProfile === 'child' ? 10 : 8.5}
                  fill="rgba(56,189,248,0.2)"
                  stroke="#67e8f9"
                  strokeWidth="1.2"
                />
                <line x1="80" y1="30" x2="80" y2="76" stroke="rgba(103,232,249,0.28)" strokeWidth="1" strokeDasharray="2 2" />

                {/* Distinct Dignified Demographic Torso & Limb Geometry */}
                <path
                  d={
                    frame.preset.silhouetteProfile === 'pregnant'
                      ? 'M68 33 L92 33 L97 56 C102 72 92 80 80 80 C68 80 58 72 63 56 Z'
                      : frame.preset.silhouetteProfile === 'senior_kyphotic'
                        ? 'M71 32 Q89 43 87 68 L85 92 M71 32 Q65 50 69 72 L72 92'
                        : frame.preset.silhouetteProfile === 'infant'
                          ? 'M66 42 Q80 39 94 42 L95 74 Q80 80 65 74 Z'
                          : frame.preset.silhouetteProfile === 'child'
                            ? 'M70 32 L90 32 L91 70 L69 70 Z'
                            : 'M66 32 L94 32 L91 54 L96 76 L64 76 L69 54 Z'
                  }
                  fill="rgba(34,211,238,0.14)"
                  stroke="#67e8f9"
                  strokeWidth="1.2"
                />

                {/* Arterial / Venous Vector Conduits */}
                <path d="M84 48 L80 22 M84 48 L71 46 M84 48 L73 59 M84 48 L88 63" stroke="rgba(251,113,133,0.45)" strokeWidth="1" />

                {/* Interactive Clickable Organ Hotspots */}
                {hotspotOrgans.map(({ organ }) => {
                  const [cx, cy] = organ.hotspotXY
                  const isSelected = organ.id === selectedOrganId
                  return (
                    <g
                      key={organ.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Inspect ${organ.nameEn}`}
                      onClick={() => {
                        setSelectedOrganId(organ.id)
                        setTier('organ')
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedOrganId(organ.id)
                          setTier('organ')
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {isSelected && <circle cx={cx} cy={cy} r="7.5" fill="none" stroke="#fde047" strokeWidth="1.1" />}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isSelected ? '4.5' : '3.5'}
                        fill={organ.id === 'heart' ? '#fb7185' : organ.id === 'lungs' ? '#38bdf8' : organ.id === 'brain' ? '#a78bfa' : '#34d399'}
                      />
                    </g>
                  )
                })}
              </>
            )}
          </svg>

          {/* 4 Live Synchronized Vector Bars */}
          <div className="space-y-1.5 font-mono text-[10px]">
            {frame.vectorLanes.map((lane) => (
              <div key={lane.id}>
                <div className="flex justify-between text-slate-300">
                  <span>{lane.label}</span>
                  <span style={{ color: lane.color }}>{lane.unitLabel}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full transition-all" style={{ width: `${lane.flowPct}%`, backgroundColor: lane.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live Physics Sliders + Active Multiscale Tier Surface */}
        <div className="space-y-2.5 lg:col-span-7">
          {/* Live Simulation Sliders */}
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 font-mono text-[10px]">
            <label className="flex flex-col gap-0.5 rounded-xl border border-white/10 bg-slate-950/80 p-2 text-emerald-200">
              <span>Exertion {exertionMet} MET</span>
              <input type="range" min={1} max={10} step={0.5} value={exertionMet} onChange={(e) => setExertionMet(Number(e.target.value))} className="accent-emerald-400" />
            </label>
            <label className="flex flex-col gap-0.5 rounded-xl border border-white/10 bg-slate-950/80 p-2 text-cyan-200">
              <span>SpO2 {frame.organLevel.spo2Pct}%</span>
              <input type="range" min={78} max={100} value={spo2Pct} onChange={(e) => { setSyncLiveTwin(false); setSpo2Pct(Number(e.target.value)) }} className="accent-cyan-400" />
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
              <div className="space-y-2 font-mono text-[10px]">
                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                  {CHEMICAL_ELEMENTS_DATASET.map((el) => {
                    const active = el.symbol === activeElement.symbol
                    return (
                      <button
                        key={el.symbol}
                        type="button"
                        onClick={() => setSelectedElementSym(el.symbol)}
                        className={`rounded-xl border p-1.5 text-left transition ${
                          active ? 'border-cyan-300 bg-cyan-500/20' : 'border-cyan-400/20 bg-slate-900/90 hover:border-cyan-300/50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-cyan-300">
                          <span>Z={el.atomicNumber}</span>
                          <span className="text-slate-400">{el.humanBodyMassPct}%</span>
                        </div>
                        <div className="text-sm font-black text-white">{el.symbol}</div>
                        <div className="truncate text-[9px] text-slate-400">{el.name}</div>
                      </button>
                    )
                  })}
                </div>
                <div className="rounded-xl border border-cyan-400/25 bg-cyan-950/25 px-2.5 py-1.5 text-[10px] text-cyan-100">
                  <strong>{activeElement.symbol} · {activeElement.name}</strong> ({activeElement.atomicMassDa} Da · {activeElement.referenceRange}) — {activeElement.biologicalRole}
                </div>
              </div>
            )}

            {tier === 'compound' && (
              <div className="space-y-2 font-mono text-[10px]">
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {BIOCHEMICAL_COMPOUNDS_DATASET.map((c) => {
                    const active = c.id === activeCompound.id
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCompoundId(c.id)}
                        className={`rounded-xl border p-2 text-left transition ${
                          active ? 'border-emerald-300 bg-emerald-500/20' : 'border-emerald-400/20 bg-slate-900/90 hover:border-emerald-300/50'
                        }`}
                      >
                        <div className="font-black text-emerald-200">{c.formula} · {c.name}</div>
                        <div className="text-[9.5px] text-cyan-300">{c.chebiId} · {c.normalRange}</div>
                        <div className="truncate text-[9.5px] text-slate-400">{c.organCoupling}</div>
                      </button>
                    )
                  })}
                </div>
                <div className="rounded-xl border border-emerald-400/25 bg-emerald-950/25 px-2.5 py-1.5 text-[10px] text-emerald-100">
                  <strong>{activeCompound.formula} ({activeCompound.molarMassGmol} g/mol)</strong> · {activeCompound.chebiId} — {activeCompound.organCoupling}
                </div>
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
                      className={`rounded-lg border px-2 py-1 font-black ${
                        frame.genomicStream.gene.symbol === g.symbol
                          ? 'border-cyan-300 bg-cyan-500/25 text-white'
                          : 'border-white/10 bg-white/5 text-slate-400'
                      }`}
                    >
                      {g.symbol}
                    </button>
                  ))}
                  <span className="text-slate-400">
                    {frame.genomicStream.gene.chromosome} · GC {frame.genomicStream.translation.gcContentPct}% · {frame.genomicStream.translation.hydrogenBondsCount} H-bonds
                  </span>
                </div>
                <div className="space-y-1 rounded-xl border border-white/10 bg-black/50 p-2 text-[10px] overflow-x-auto">
                  <div className="text-cyan-300">5&apos;-DNA: {frame.genomicStream.translation.codingStrand5to3}</div>
                  <div className="text-violet-300">3&apos;-DNA: {frame.genomicStream.translation.templateStrand3to5}</div>
                  <div className="text-emerald-300">5&apos;-RNA: {frame.genomicStream.translation.mrna5to3}</div>
                  <div className="text-amber-200">Peptide: {frame.genomicStream.translation.aminoAcids.join('-')}</div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/25 bg-amber-950/20 px-2.5 py-1.5">
                  <span className="text-amber-100">Point Mutation Lab (pos {mutPos} → {mutBase}): <strong className="text-amber-200">{mutation.classification}</strong></span>
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

            {tier === 'organ' && (
              <div className="space-y-2 font-mono text-[10px]" data-fsd15-organ-atlas>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {organTelemetry.map(({ organ, perfusionMlMin, activityPct, statusTag }) => {
                    const active = organ.id === selectedOrganId
                    return (
                      <button
                        key={organ.id}
                        type="button"
                        onClick={() => {
                          setSelectedOrganId(organ.id)
                          setGeneSymbol(organ.geneSymbol)
                        }}
                        className={`rounded-xl border p-2 text-left transition ${
                          active ? 'border-cyan-300 bg-cyan-500/20' : 'border-white/10 bg-slate-900/90 hover:border-white/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-cyan-100">{organ.nameId}</span>
                          <span className="text-[9px] text-slate-400">{organ.fmaId}</span>
                        </div>
                        <div className="mt-0.5 text-emerald-300">{perfusionMlMin} mL/m · {activityPct}%</div>
                        <div className="truncate text-[9px] text-amber-200">{statusTag}</div>
                      </button>
                    )
                  })}
                </div>
                <div className="rounded-xl border border-cyan-400/25 bg-cyan-950/20 px-2.5 py-1.5 text-[10px] text-slate-200">
                  <strong className="text-cyan-200">{activeOrgan.organ.nameId} ({activeOrgan.organ.fmaId})</strong>: {activeOrgan.organ.mechanismNote}
                </div>
              </div>
            )}

            {tier === 'organ_system' && (
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-2 font-mono text-[10px]" data-fsd15-system-atlas>
                {systemTelemetry.map(({ system, loadPct, liveReadout }) => (
                  <button
                    key={system.id}
                    type="button"
                    onClick={() => {
                      setSelectedOrganId(system.primaryOrganId)
                      setTier('organ')
                    }}
                    className="rounded-xl border border-white/10 bg-slate-900/90 p-2 text-left hover:border-cyan-400/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-cyan-200">{system.labelId}</span>
                      <span className="text-emerald-300">{loadPct}%</span>
                    </div>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-cyan-400" style={{ width: `${loadPct}%` }} />
                    </div>
                    <div className="mt-1 truncate text-[9.5px] text-amber-200">{liveReadout}</div>
                  </button>
                ))}
              </div>
            )}

            {tier === 'human_twin' && (
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

          {/* 7-Hop Cross-Scale Causal Chain Strip (Click Any Hop to Jump Scale) */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/80 px-2.5 py-1.5 font-mono text-[9.5px] no-scrollbar" data-fsd15-causal-chain>
            {causalChain.map((hop, idx) => (
              <button
                key={hop.tier}
                type="button"
                onClick={() => setTier(hop.tier)}
                className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-left hover:bg-white/10"
              >
                <span className="text-slate-400">{hop.label}:</span>
                <span className="font-bold text-cyan-200">{hop.value}</span>
                {idx < causalChain.length - 1 && <span className="text-slate-600">→</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
