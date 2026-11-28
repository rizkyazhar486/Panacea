import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
const MultiscaleSocialTwinPanel = lazy(() => import('./MultiscaleSocialTwinPanel'))
const AureumLifetimeMemoryPanel = lazy(() => import('./AureumLifetimeMemoryPanel'))
const Fsd15BioTelemetryStudio = lazy(() => import('./Fsd15BioTelemetryStudio'))
const BodyScienceCaeCompassPanel = lazy(() => import('./BodyScienceCaeCompassPanel'))
const EtCausalisExplorerPanel = lazy(() => import('./EtCausalisExplorerPanel'))
import { Link } from 'react-router-dom'
import { ANATOMICAL_SYSTEM_IDS, type AnatomicalSystemId, type RealityViewMode } from '../../types/realityView'
import { buildRealityViewState } from '../../engines/reality-view/realityViewStateEngine'
import { runCounterfactualIntervention } from '../../engines/reality-view/counterfactualSimulator'
import { OverrideMemoryStore } from '../../engines/reality-view/overrideMemoryStore'
import { selectQuietModeSummary } from '../../engines/reality-view/quietModeSelector'
import {
  listBindingsBySystem,
  projectTm1DualCodingMetadata,
  resolveMeshOntology,
} from '../../engines/reality-view/anatomyOntologyRegistry'
import {
  DEMOGRAPHIC_COHORT_IDS,
  DEMOGRAPHIC_COHORTS,
  parseNaturalDemographicIntake,
  synthesizeAnthropometryManifold,
  type DemographicCohortId,
} from '../../engines/reality-view/demographicManifold'
import {
  RealityViewLodResourcePool,
  detectPerformanceTier,
  resolveActiveLodBundlePlan,
} from './performanceTierManager'
import { sanitizeClinicalText } from '../../engines/reality-view/realityViewVaultSync'
import { createPurposeConsentLedger } from '../../lib/purposeConsentLedger'

const TIME_STOPS = [
  { offsetDays: -365, label: '-1Y' },
  { offsetDays: -30, label: '-30D' },
  { offsetDays: 0, label: 'LIVE' },
  { offsetDays: 90, label: '+90D' },
  { offsetDays: 365, label: '+1Y' },
  { offsetDays: 1825, label: '+5Y' },
] as const

const CAD_PLANES = ['axial', 'sagittal', 'coronal'] as const

/**
 * Unified Reality View Interactive Cockpit:
 * Wires the real clinical state engine, 1:1 ontology registry, 3-tier hardware
 * budget manager (including <150MB 2.5D fallback), 22-cohort universal human
 * lifespan manifold, 4D time-axis scrubber, CAD slicing + SDF corridor readout,
 * and strict solid-vs-translucent epistemic evidence separation.
 */
export function RealityViewCockpit() {
  const [mode, setMode] = useState<RealityViewMode>('quiet')
  const [timeOffsetDays, setTimeOffsetDays] = useState<number>(0)
  const [selectedSystem, setSelectedSystem] = useState<AnatomicalSystemId>('cardiovascular')
  const [selectedMeshId, setSelectedMeshId] = useState<string>('Left ventricle')
  const [dualCodingTm1, setDualCodingTm1] = useState<boolean>(false)
  const [cohortId, setCohortId] = useState<DemographicCohortId>('YAD_M')
  const [gestationalWeek, setGestationalWeek] = useState<number>(28)
  const [voiceInput, setVoiceInput] = useState<string>('')
  const [cadPlane, setCadPlane] = useState<typeof CAD_PLANES[number]>('axial')
  const [safetyMarginMm, setSafetyMarginMm] = useState<2 | 5 | 10>(5)
  const [counterfactualActive, setCounterfactualActive] = useState<boolean>(false)
  const [extensionTab, setExtensionTab] = useState<'none' | 'multiscale' | 'century' | 'fsd15' | 'compass' | 'etcausalis'>(() => {
    if (typeof window === 'undefined') return 'none'
    const raw = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : window.location.search.slice(1)
    const panel = new URLSearchParams(raw).get('panel')
    return panel === 'fsd15' || panel === 'multiscale' || panel === 'century' || panel === 'compass' ? panel : 'none'
  })
  const [overrideStore] = useState(() => new OverrideMemoryStore())
  const [lodPool] = useState(() => new RealityViewLodResourcePool())

  const hardwareTier = useMemo(() => {
    const nav = typeof navigator !== 'undefined' ? navigator : undefined
    const hasWebGPU = typeof nav !== 'undefined' && 'gpu' in nav
    const deviceMemoryGb = (nav as { deviceMemory?: number } | undefined)?.deviceMemory
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false
    return detectPerformanceTier({ hasWebGPU, hasWebGL2: true, isMobile, deviceMemoryGb })
  }, [])

  useEffect(() => () => { lodPool.disposeAll() }, [lodPool])

  useEffect(() => {
    if (mode !== 'fullscreen') lodPool.evictFullscreenResources()
  }, [mode, lodPool])

  const cohortSpec = DEMOGRAPHIC_COHORTS[cohortId]
  const manifold = useMemo(() => {
    if (voiceInput.trim().length >= 5) return parseNaturalDemographicIntake(voiceInput)
    const midAge = cohortSpec.minAgeYears + (cohortSpec.maxAgeYears - cohortSpec.minAgeYears) * 0.45
    return synthesizeAnthropometryManifold({
      ageYears: Number(midAge.toFixed(1)),
      biologicalSex: cohortSpec.biologicalSex,
      heightCm: midAge < 1 ? 60 : midAge < 12 ? 128 : cohortSpec.biologicalSex === 'male' ? 171 : 160,
      weightKg: midAge < 1 ? 6 : midAge < 12 ? 27 : cohortSpec.biologicalSex === 'male' ? 69 : 57,
      gestationalWeek: cohortId === 'MAT_PREG' ? gestationalWeek : undefined,
      postpartumWeek: cohortId === 'MAT_POST' ? 6 : undefined,
      preterm: cohortId === 'NEO_PRE_M' || cohortId === 'NEO_PRE_F',
    })
  }, [cohortId, cohortSpec, gestationalWeek, voiceInput])

  const nowIso = '2026-11-24T08:00:00Z'
  const cursorIso = useMemo(() => new Date(Date.parse(nowIso) + timeOffsetDays * 86_400_000).toISOString(), [timeOffsetDays])

  const rvState = useMemo(() => buildRealityViewState({
    patientId: 'panacea-active-twin',
    mode,
    nowIso,
    timeAxisCursorIso: cursorIso,
    dualCodingTm1Enabled: dualCodingTm1,
    selectedMeshId,
    consentLedger: createPurposeConsentLedger(),
    readings: [],
  }), [mode, cursorIso, dualCodingTm1, selectedMeshId])

  const projection = useMemo(() => {
    if (!counterfactualActive) return undefined
    return runCounterfactualIntervention(rvState, {
      type: 'sleep_hrv_recovery',
      counterfactualId: '11111111-1111-4111-8111-111111111111',
      targetMeshId: selectedMeshId,
    })
  }, [counterfactualActive, rvState])

  const quietSummary = useMemo(() => selectQuietModeSummary(rvState, projection), [rvState, projection])
  const lodPlan = useMemo(() => resolveActiveLodBundlePlan({
    tier: hardwareTier.tier,
    mode,
    requestedSystems: [selectedSystem],
  }), [hardwareTier.tier, mode, selectedSystem])

  const systemMeshes = useMemo(() => listBindingsBySystem(selectedSystem), [selectedSystem])
  const resolvedMesh = useMemo(() => resolveMeshOntology(selectedMeshId), [selectedMeshId])
  const tm1Overlay = useMemo(() => projectTm1DualCodingMetadata(selectedMeshId, dualCodingTm1), [selectedMeshId, dualCodingTm1])
  const nudgeStatus = overrideStore.shouldSuppressAlert('sleep_hrv_advisory', false)

  return (
    <section
      className="dark rounded-3xl border border-cyan-400/25 bg-[#04070e] p-3.5 text-slate-100 shadow-2xl"
      data-reality-view-cockpit
      data-rv-tier={hardwareTier.tier}
      data-rv-mode={mode}
      aria-label="PanaceaMed Reality View Digital Twin Cockpit"
    >
      {/* Top Bar: Hardware Tier + Evidence Mode + Mode Switcher */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-cyan-400/35 bg-cyan-500/15 px-2.5 py-1 font-mono text-[10px] font-black uppercase text-cyan-200">
            {hardwareTier.tier} · {hardwareTier.rendererBackend}
          </span>
          <span
            className="rounded-full border px-2.5 py-1 font-mono text-[10px] font-black uppercase"
            style={{
              borderColor: rvState.isFutureProjection || counterfactualActive ? 'rgba(251,191,36,0.5)' : 'rgba(52,211,153,0.45)',
              background: rvState.isFutureProjection || counterfactualActive ? 'rgba(251,191,36,0.12)' : 'rgba(52,211,153,0.12)',
              color: rvState.isFutureProjection || counterfactualActive ? '#fde68a' : '#6ee7b7',
            }}
          >
            {rvState.isFutureProjection || counterfactualActive ? 'TRANSLUCENT · SIMULATED' : 'SOLID · OBSERVED'}
          </span>
          <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[10px] font-bold text-slate-300">
            LOD: {lodPlan.lodLevel}
          </span>
        </div>

        <div className="flex items-center gap-1" role="group" aria-label="Reality View mode">
          {(['quiet', 'split', 'fullscreen', 'timeline_inset'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className="min-h-[44px] rounded-xl border px-2.5 text-[10px] font-black uppercase transition"
              style={{
                borderColor: mode === m ? '#fde68a' : 'rgba(255,255,255,0.14)',
                background: mode === m ? 'rgba(253,230,138,0.16)' : 'rgba(15,23,42,0.85)',
                color: mode === m ? '#fef3c7' : '#cbd5e1',
              }}
            >
              {m === 'timeline_inset' ? '4D' : m}
            </button>
          ))}
        </div>
      </div>

      {/* Quiet Mode Calm Headline + Single Primary Action */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${quietSummary.escalated ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'}`} />
          <strong className="text-xs font-extrabold text-white">{sanitizeClinicalText(quietSummary.headline)}</strong>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/body-exposure"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3 text-[11px] font-black text-cyan-100"
          >
            {quietSummary.primaryAction.label} ↗
          </Link>
          <details className="relative">
            <summary
              aria-label="Clinical provenance & epistemic boundary info"
              className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-full border border-white/15 bg-white/5 font-mono text-xs font-black text-cyan-200"
            >
              i
            </summary>
            <div className="absolute right-0 top-12 z-40 w-64 rounded-2xl border border-white/15 bg-[#060b16] p-3 text-[11px] text-slate-300 shadow-2xl">
              <div className="font-mono text-[10px] font-black text-cyan-300">EPISTEMIC BOUNDARY</div>
              <p className="mt-1 leading-snug">
                Observed FHIR/wearable telemetry stays immutable. Future trajectories and counterfactuals render as simulated projections only.
              </p>
            </div>
          </details>
        </div>
      </div>

      {/* Universal Human Lifespan Demographic Manifold (22 Cohorts 0-115+ yrs + Obstetric + Voice Intake) */}
      <div className="mb-3 grid grid-cols-1 gap-2 rounded-2xl border border-white/10 bg-[#070e1c] p-2.5 md:grid-cols-12">
        <div className="flex flex-col gap-2 md:col-span-7">
          <div className="flex flex-wrap items-center gap-1.5">
            <select
              aria-label="Universal human demographic cohort"
              value={cohortId}
              onChange={(e) => { setVoiceInput(''); setCohortId(e.target.value as DemographicCohortId) }}
              className="min-h-[44px] rounded-xl border border-cyan-400/30 bg-slate-950 px-2.5 text-xs font-bold text-cyan-100"
            >
              {DEMOGRAPHIC_COHORT_IDS.map((id) => (
                <option key={id} value={id}>{DEMOGRAPHIC_COHORTS[id].label}</option>
              ))}
            </select>
            <input
              type="text"
              value={voiceInput}
              onChange={(e) => setVoiceInput(e.target.value)}
              placeholder="Voice/text morph: e.g. Ibu hamil 32 minggu / Laki-laki 76 tahun"
              aria-label="Natural demographic intake"
              className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-white/15 bg-slate-950 px-3 text-xs text-white placeholder:text-slate-500"
            />
          </div>

          {manifold.cohortId === 'MAT_PREG' && (
            <label className="flex items-center gap-2 text-[11px] font-bold text-pink-200">
              <span>Gestasi Wk {manifold.obstetricHemodynamics?.gestationalWeek ?? gestationalWeek}</span>
              <input
                type="range"
                min={1}
                max={42}
                value={gestationalWeek}
                onChange={(e) => setGestationalWeek(Number(e.target.value))}
                aria-label="Gestational week 1 to 42"
                className="flex-1 accent-pink-400"
              />
              <span className="font-mono text-[10px]">CO +{manifold.obstetricHemodynamics?.cardiacOutputGainPct}%</span>
            </label>
          )}
        </div>

        {/* Live Synthesized Tensor KPIs */}
        <div className="grid grid-cols-3 gap-1.5 md:col-span-5">
          <div className="rounded-xl border border-white/10 bg-slate-950/80 p-2 text-center">
            <div className="font-mono text-[9px] uppercase text-slate-300">Cohort</div>
            <div className="font-mono text-xs font-black text-cyan-200">{manifold.cohortId}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/80 p-2 text-center">
            <div className="font-mono text-[9px] uppercase text-slate-300">Kyphosis / BMD</div>
            <div className="font-mono text-xs font-black text-amber-200">
              {manifold.senescenceVector.thoracicKyphosisDeg}° / {manifold.composition.boneMineralDensityTScore}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/80 p-2 text-center">
            <div className="font-mono text-[9px] uppercase text-slate-300">VAT / SMM</div>
            <div className="font-mono text-xs font-black text-emerald-300">
              {manifold.composition.visceralFatIndex} / {manifold.composition.skeletalMusclePct}%
            </div>
          </div>
        </div>
      </div>

      {/* 10-System 1:1 Ontology Explorer + 2.5D Fallback Silhouette + CAD SDF Safety Corridor */}
      <div className="mb-3 grid grid-cols-1 gap-2.5 lg:grid-cols-12">
        <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#060c18] p-2.5 lg:col-span-7">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar" role="tablist" aria-label="10 anatomical systems">
            {ANATOMICAL_SYSTEM_IDS.map((sys) => (
              <button
                key={sys}
                type="button"
                role="tab"
                aria-selected={selectedSystem === sys}
                onClick={() => {
                  setSelectedSystem(sys)
                  const first = listBindingsBySystem(sys)[0]
                  if (first) setSelectedMeshId(first.meshId)
                }}
                className="min-h-[44px] shrink-0 rounded-xl border px-2.5 text-[10px] font-black uppercase"
                style={{
                  borderColor: selectedSystem === sys ? '#22d3ee' : 'rgba(255,255,255,0.12)',
                  background: selectedSystem === sys ? 'rgba(34,211,238,0.16)' : 'rgba(15,23,42,0.85)',
                  color: selectedSystem === sys ? '#ecfeff' : '#94a3b8',
                }}
              >
                {sys.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {systemMeshes.map((m) => (
              <button
                key={m.meshId}
                type="button"
                onClick={() => setSelectedMeshId(m.meshId)}
                aria-pressed={selectedMeshId === m.meshId}
                className="min-h-[44px] rounded-xl border px-2.5 text-left text-[11px] font-bold"
                style={{
                  borderColor: selectedMeshId === m.meshId ? '#fde68a' : 'rgba(255,255,255,0.12)',
                  background: selectedMeshId === m.meshId ? 'rgba(253,230,138,0.14)' : 'rgba(15,23,42,0.75)',
                  color: '#f8feff',
                }}
              >
                <div>{m.indonesianLabel}</div>
                {/* Terpilih: .pmd-liquid-selected menimpa latar jadi hijau di tema terang; cyan-300 hanya 3.72:1 di atasnya (<4.5 AA). */}
                <div className={`font-mono text-[9px] ${selectedMeshId === m.meshId ? 'text-white' : 'text-cyan-300'}`}>{m.canonicalOntologyId} · {m.snomedCtId}</div>
              </button>
            ))}
          </div>

          {resolvedMesh.selectable && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-400/20 bg-slate-950/90 px-3 py-2 text-[11px]">
              <div>
                <span className="font-black text-white">{resolvedMesh.binding.englishLabel}</span>
                <span className="ml-2 font-mono text-[10px] text-cyan-300">{resolvedMesh.binding.canonicalOntologyId}</span>
                {tm1Overlay.icd11Tm1Code && (
                  <span className="ml-2 rounded-full border border-violet-400/40 bg-violet-500/15 px-2 py-0.5 font-mono text-[9px] text-violet-200">
                    ICD-11 TM1: {tm1Overlay.icd11Tm1Code}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDualCodingTm1((v) => !v)}
                aria-pressed={dualCodingTm1}
                className="min-h-[44px] rounded-xl border border-violet-400/35 bg-violet-500/10 px-2.5 font-mono text-[10px] font-black text-violet-200"
              >
                TM1 {dualCodingTm1 ? 'ON' : 'OFF'}
              </button>
            </div>
          )}
        </div>

        {/* Right: CAD Multi-Planar Slicing + SDF Safety Corridor + Counterfactual Toggle */}
        <div className="flex flex-col justify-between gap-2 rounded-2xl border border-white/10 bg-[#060c18] p-2.5 lg:col-span-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-black uppercase text-amber-200">CAD Slice &amp; SDF Corridor</span>
            <span className="font-mono text-[10px] text-emerald-300">Clearance ≥ {safetyMarginMm}mm</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {CAD_PLANES.map((pl) => (
              <button
                key={pl}
                type="button"
                onClick={() => setCadPlane(pl)}
                aria-pressed={cadPlane === pl}
                className="min-h-[44px] rounded-xl border px-2.5 font-mono text-[10px] font-black uppercase"
                style={{
                  borderColor: cadPlane === pl ? '#34d399' : 'rgba(255,255,255,0.12)',
                  background: cadPlane === pl ? 'rgba(52,211,153,0.16)' : 'rgba(15,23,42,0.85)',
                  color: '#f8feff',
                }}
              >
                {pl}
              </button>
            ))}
            {([2, 5, 10] as const).map((mm) => (
              <button
                key={mm}
                type="button"
                onClick={() => setSafetyMarginMm(mm)}
                aria-pressed={safetyMarginMm === mm}
                className="min-h-[44px] rounded-xl border px-2 font-mono text-[10px] font-black"
                style={{
                  borderColor: safetyMarginMm === mm ? '#fb7185' : 'rgba(255,255,255,0.12)',
                  color: safetyMarginMm === mm ? '#fecdd3' : '#94a3b8',
                }}
              >
                {mm}mm
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2">
            <button
              type="button"
              onClick={() => setCounterfactualActive((v) => !v)}
              aria-pressed={counterfactualActive}
              className="min-h-[44px] flex-1 rounded-xl border border-amber-300/40 bg-amber-400/15 px-3 text-[11px] font-black text-amber-100"
            >
              {counterfactualActive ? 'Simulation Active (+45m Sleep)' : 'Tap-to-Simulate (+45m Sleep)'}
            </button>
            {!nudgeStatus.suppressed && (
              <button
                type="button"
                onClick={() => overrideStore.recordOverride('sleep_hrv_advisory', 'lifestyle', false, 'user_dismiss')}
                className="min-h-[44px] rounded-xl border border-white/15 bg-white/5 px-2.5 text-[10px] font-bold text-slate-300"
              >
                Mute Nudge
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4D Spatial Time-Axis Scrubber (Past <- LIVE -> Future) */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 rounded-2xl border border-white/10 bg-slate-950/90 p-2" role="group" aria-label="4D time axis scrubber">
        <span className="px-2 font-mono text-[10px] font-black uppercase text-cyan-300">4D Time Axis</span>
        <div className="flex flex-wrap items-center gap-1">
          {TIME_STOPS.map((stop) => (
            <button
              key={stop.label}
              type="button"
              onClick={() => setTimeOffsetDays(stop.offsetDays)}
              aria-pressed={timeOffsetDays === stop.offsetDays}
              className="min-h-[44px] rounded-xl border px-3 font-mono text-[10px] font-black"
              style={{
                borderColor: timeOffsetDays === stop.offsetDays ? '#fde68a' : 'rgba(255,255,255,0.12)',
                background: timeOffsetDays === stop.offsetDays ? 'rgba(253,230,138,0.18)' : 'transparent',
                color: timeOffsetDays === stop.offsetDays ? '#fef3c7' : '#cbd5e1',
              }}
            >
              {stop.label}
            </button>
          ))}
        </div>
      </div>

      {/* On-Demand Multiscale Zoom / Cloud Social Twin & Aureum Century Memory Drawers */}
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Multiscale and century extensions">
        <button
          type="button"
          onClick={() => setExtensionTab((t) => (t === 'multiscale' ? 'none' : 'multiscale'))}
          aria-pressed={extensionTab === 'multiscale'}
          data-rv-multiscale-toggle
          className="min-h-[40px] rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-3 font-mono text-[10px] font-black uppercase text-cyan-100 hover:bg-cyan-500/20"
        >
          {extensionTab === 'multiscale' ? 'Hide' : 'Open'} 11-Scale Zoom · Twin Barcode
        </button>
        <button
          type="button"
          onClick={() => setExtensionTab((t) => (t === 'century' ? 'none' : 'century'))}
          aria-pressed={extensionTab === 'century'}
          data-rv-century-toggle
          className="min-h-[40px] rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 font-mono text-[10px] font-black uppercase text-amber-100 hover:bg-amber-500/20"
        >
          {extensionTab === 'century' ? 'Hide' : 'Open'} Century Timeline · Health Memory
        </button>
        <button
          type="button"
          onClick={() => setExtensionTab((t) => (t === 'fsd15' ? 'none' : 'fsd15'))}
          aria-pressed={extensionTab === 'fsd15'}
          data-rv-fsd15-toggle
          className="min-h-[40px] rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3 font-mono text-[10px] font-black uppercase text-emerald-100 hover:bg-emerald-500/25"
        >
          {extensionTab === 'fsd15' ? 'Hide' : 'Open'} FSD-15 Quantum→Twin
        </button>
        <button
          type="button"
          onClick={() => setExtensionTab((t) => (t === 'compass' ? 'none' : 'compass'))}
          aria-pressed={extensionTab === 'compass'}
          data-rv-compass-cae-toggle
          className="min-h-[40px] rounded-xl border border-violet-400/40 bg-violet-500/15 px-3 font-mono text-[10px] font-black uppercase text-violet-100 hover:bg-violet-500/25"
        >
          {extensionTab === 'compass' ? 'Hide' : 'Open'} Golden Compass · Physics CAE · 100-Lvl
        </button>
        <button
          type="button"
          onClick={() => setExtensionTab((t) => (t === 'etcausalis' ? 'none' : 'etcausalis'))}
          aria-pressed={extensionTab === 'etcausalis'}
          data-rv-etcausalis-toggle
          className="min-h-[40px] rounded-xl border border-rose-400/40 bg-rose-500/15 px-3 font-mono text-[10px] font-black uppercase text-rose-100 hover:bg-rose-500/25"
        >
          {extensionTab === 'etcausalis' ? 'Hide' : 'Open'} Et Causalis · 25 Scenarios
        </button>
      </div>

      {extensionTab === 'multiscale' && (
        <Suspense fallback={<div className="rounded-2xl border border-white/10 bg-slate-950/80 p-3 font-mono text-xs text-cyan-200">Loading 11-Scale Reality Graph &amp; Social Twin…</div>}>
          <MultiscaleSocialTwinPanel />
        </Suspense>
      )}
      {extensionTab === 'century' && (
        <Suspense fallback={<div className="rounded-2xl border border-white/10 bg-slate-950/80 p-3 font-mono text-xs text-amber-200">Loading Aureum Century Timeline &amp; Memory…</div>}>
          <AureumLifetimeMemoryPanel />
        </Suspense>
      )}
      {extensionTab === 'fsd15' && (
        <Suspense fallback={<div className="rounded-2xl border border-white/10 bg-slate-950/80 p-3 font-mono text-xs text-emerald-200">Loading FSD-15 Quantum→Human Bio-Telemetry…</div>}>
          <Fsd15BioTelemetryStudio />
        </Suspense>
      )}
      {extensionTab === 'compass' && (
        <Suspense fallback={<div className="rounded-2xl border border-white/10 bg-slate-950/80 p-3 font-mono text-xs text-violet-200">Loading Golden Compass &amp; Biomedical Physics CAE…</div>}>
          <BodyScienceCaeCompassPanel />
        </Suspense>
      )}
      {extensionTab === 'etcausalis' && (
        <Suspense fallback={<div className="rounded-2xl border border-white/10 bg-slate-950/80 p-3 font-mono text-xs text-rose-200">Loading Et Causalis 25-Scenario Systemic Solver…</div>}>
          <EtCausalisExplorerPanel
            selectedMeshId={selectedMeshId}
            selectedSystem={selectedSystem}
            onSelectMesh={(meshId) => setSelectedMeshId(meshId)}
          />
        </Suspense>
      )}
    </section>
  )
}

export default RealityViewCockpit
