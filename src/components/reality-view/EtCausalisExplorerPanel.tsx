import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { CoupledPhysiologicalScenarioId } from '../../domains/body-exposure/engine/physiology/multiscaleCoupledOrganPhysiologyAndMathSolverEngine.ts'
import {
  resolveCohortAssetBundle,
  resolveOrganConvergenceBundle,
  resolveSystemSuperPageLinks,
} from '../../engines/reality-view/capabilityConvergenceGraph.ts'
import {
  DEMOGRAPHIC_COHORT_IDS,
  DEMOGRAPHIC_COHORTS,
  type DemographicCohortId,
} from '../../engines/reality-view/demographicManifold.ts'
import {
  evaluateEducationalPkPdSnapshot,
  MULTIORGAN_SCENARIO_SPECS,
  simulateMultiorganCausalTrajectory,
  type EtCausalisEdge,
  type MultiorganTimepoint,
} from '../../engines/reality-view/etCausalisMultiorganEngine.ts'
import { sanitizeClinicalText } from '../../engines/reality-view/realityViewVaultSync.ts'
import type { AnatomicalSystemId } from '../../types/realityView.ts'

export interface EtCausalisExplorerPanelProps {
  readonly selectedMeshId: string | null
  readonly selectedSystem: AnatomicalSystemId | null
  readonly onSelectMesh: (meshId: string) => void
}

type SemanticScaleTab = 'organ' | 'ftu' | 'cell' | 'organelle' | 'drug' | 'gene'

interface CausalNodeLayout {
  readonly meshId: string
  readonly shortLabel: string
  readonly x: number
  readonly y: number
}

const CAUSAL_NODE_LAYOUTS: readonly CausalNodeLayout[] = [
  { meshId: 'Vagus nerve (X).l', shortLabel: 'CN X / Autonomic', x: 64, y: 36 },
  { meshId: 'Inferior lobe of left lung', shortLabel: 'Alveolar Lung', x: 294, y: 36 },
  { meshId: 'Left ventricle', shortLabel: 'Left Ventricle', x: 180, y: 92 },
  { meshId: 'Ascending aorta', shortLabel: 'Aorta / SVR', x: 180, y: 162 },
  { meshId: 'Kidney.l', shortLabel: 'Kidney / RAAS', x: 64, y: 152 },
  { meshId: 'Liver', shortLabel: 'Liver / Lactate', x: 294, y: 152 },
]

const CAUSAL_NODE_BY_ID = new Map(CAUSAL_NODE_LAYOUTS.map((n) => [n.meshId, n]))

const SCALE_TABS: readonly { readonly id: SemanticScaleTab; readonly label: string }[] = [
  { id: 'organ', label: 'Organ' },
  { id: 'ftu', label: 'FTU' },
  { id: 'cell', label: 'Cell' },
  { id: 'organelle', label: 'Organelle' },
  { id: 'drug', label: 'Drug/PK-PD' },
  { id: 'gene', label: 'Gene' },
]

function edgeStroke(polarity: EtCausalisEdge['feedbackPolarity']): string {
  if (polarity === 'positive_maladaptive') return '#fb7185'
  if (polarity === 'direct_feedforward') return '#34d399'
  return '#22d3ee'
}

function buildSparklinePoints(values: readonly number[], width = 120, height = 28): string {
  if (values.length === 0) return `0,${height}`
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = Math.max(1e-6, max - min)
  return values
    .map((v, i) => {
      const x = values.length === 1 ? width / 2 : (i / (values.length - 1)) * width
      const y = height - ((v - min) / span) * (height - 6) - 3
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

function MetricSparkCard({
  label,
  unit,
  values,
  latest,
  baseline,
  stroke,
  decimals = 1,
}: {
  readonly label: string
  readonly unit: string
  readonly values: readonly number[]
  readonly latest: number
  readonly baseline: number
  readonly stroke: string
  readonly decimals?: number
}) {
  const delta = latest - baseline
  const sign = delta > 0 ? '+' : ''
  const pts = buildSparklinePoints(values)

  return (
    <div className="rounded-xl border border-white/10 bg-black/35 p-2.5">
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-[11px] font-bold text-slate-300">{label}</span>
        <span className="text-[10px] font-semibold text-slate-400">
          {sign}
          {delta.toFixed(decimals)}
        </span>
      </div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className="text-sm font-black text-white">{latest.toFixed(decimals)}</span>
        <span className="text-[10px] text-slate-400">{unit}</span>
      </div>
      <svg viewBox="0 0 120 28" className="mt-1.5 h-7 w-full overflow-visible" aria-hidden="true">
        <polyline fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
      </svg>
    </div>
  )
}

export function EtCausalisExplorerPanel({
  selectedMeshId,
  selectedSystem,
  onSelectMesh,
}: EtCausalisExplorerPanelProps) {
  const [scenarioId, setScenarioId] = useState<CoupledPhysiologicalScenarioId>('1_RESTING_HOMEOSTASIS')
  const [cohortId, setCohortId] = useState<DemographicCohortId>('YAD_M')
  const [gestationalWeek, setGestationalWeek] = useState<number>(28)
  const [fluidBolusMl, setFluidBolusMl] = useState<number>(0)
  const [vasopressorGain, setVasopressorGain] = useState<number>(0)
  const [fiO2Fraction, setFiO2Fraction] = useState<number>(0.21)
  const [inotropyGain, setInotropyGain] = useState<number>(0)
  const [scaleTab, setScaleTab] = useState<SemanticScaleTab>('organ')
  const [pkElapsedHours, setPkElapsedHours] = useState<number>(4)

  const simResult = useMemo(() => simulateMultiorganCausalTrajectory({
    scenarioId,
    cohortId,
    gestationalWeek: cohortId === 'MAT_PREG' ? gestationalWeek : undefined,
    interventions: { fluidBolusMl, vasopressorGain, fiO2Fraction, inotropyGain },
  }), [scenarioId, cohortId, gestationalWeek, fluidBolusMl, vasopressorGain, fiO2Fraction, inotropyGain])

  const assetBundle = useMemo(() => resolveCohortAssetBundle(cohortId), [cohortId])
  const effectiveMeshId = selectedMeshId ?? simResult.scenario.primaryMeshId
  const convergenceBundle = useMemo(() => resolveOrganConvergenceBundle(effectiveMeshId) ?? resolveOrganConvergenceBundle('Left ventricle'), [effectiveMeshId])
  const systemLinks = useMemo(() => convergenceBundle?.superPageLinks ?? resolveSystemSuperPageLinks(selectedSystem ?? 'cardiovascular'), [convergenceBundle, selectedSystem])

  const primaryDrug = convergenceBundle?.verticalChain.scale5_drugs_targets[0] ?? null
  const interactivePkPd = useMemo(() => {
    if (!primaryDrug) return null
    return evaluateEducationalPkPdSnapshot({
      doseMg: primaryDrug.sampleDoseMg,
      volumeOfDistributionL: 32,
      clearanceLPerHour: Math.max(1.2, 4.5 * (simResult.finalState.gfrMlMin / 110)),
      elapsedHours: pkElapsedHours,
      kdMgL: 0.45,
      hillN: 1.0,
    })
  }, [primaryDrug, pkElapsedHours, simResult.finalState.gfrMlMin])

  const seriesOf = (pick: (pt: MultiorganTimepoint) => number) => simResult.timeline.map(pick)
  const { finalState, baselineEnd } = simResult

  return (
    <section
      data-et-causalis-panel="v1"
      aria-label="Et Causalis Multiorgan Causal Explorer and Semantic Zoom"
      className="mt-4 space-y-3.5 rounded-2xl border border-cyan-400/25 bg-[#050b18] p-3.5 text-slate-100 sm:p-4"
    >
      {/* Top status strip */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-cyan-400/35 bg-cyan-500/15 px-2.5 py-1 text-[11px] font-extrabold text-cyan-200">
            Et Causalis · 25 Scenarios · 22 Cohorts
          </span>
          <span className="rounded-full border border-amber-400/35 bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-200">
            {simResult.truthClass} · clinically_reviewed=false
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setScenarioId('1_RESTING_HOMEOSTASIS')
            setFluidBolusMl(0)
            setVasopressorGain(0)
            setFiO2Fraction(0.21)
            setInotropyGain(0)
          }}
          className="min-h-[44px] rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-bold text-slate-200 hover:bg-white/10"
        >
          Reset Simulation
        </button>
      </div>

      {/* Scenario + 22-Cohort selectors */}
      <div className="grid gap-2.5 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="ec-scenario-select" className="block min-h-[44px] text-xs font-bold text-slate-300">
            <span className="mb-1 block">Physiological Scenario (25 Coupled)</span>
            <select
              id="ec-scenario-select"
              aria-label="Coupled physiological scenario"
              value={scenarioId}
              onChange={(e) => {
                const nextId = e.target.value as CoupledPhysiologicalScenarioId
                setScenarioId(nextId)
                const nextSpec = MULTIORGAN_SCENARIO_SPECS.find((s) => s.id === nextId)
                if (nextSpec) onSelectMesh(nextSpec.primaryMeshId)
              }}
              className="min-h-[44px] w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-xs font-bold text-white"
            >
              {MULTIORGAN_SCENARIO_SPECS.map((spec) => (
                <option key={spec.id} value={spec.id}>
                  {spec.label} ({spec.category})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-1">
          <label htmlFor="ec-cohort-select" className="block min-h-[44px] text-xs font-bold text-slate-300">
            <span className="mb-1 block">Lifespan Demographic Cohort (22 Cohorts)</span>
            <select
              id="ec-cohort-select"
              aria-label="Lifespan demographic cohort"
              value={cohortId}
              onChange={(e) => setCohortId(e.target.value as DemographicCohortId)}
              className="min-h-[44px] w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-xs font-bold text-white"
            >
              {DEMOGRAPHIC_COHORT_IDS.map((id) => (
                <option key={id} value={id}>
                  {DEMOGRAPHIC_COHORTS[id].label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Cohort Asset Manifold + Gestational Week slider */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-slate-200">
        <span className="rounded-lg bg-white/10 px-2 py-1 font-bold">
          BMI: {simResult.cohort.bmi}
        </span>
        {simResult.cohort.obstetricHemodynamics ? (
          <span className="rounded-lg border border-pink-400/35 bg-pink-500/15 px-2 py-1 font-bold text-pink-200">
            Wk {simResult.cohort.obstetricHemodynamics.gestationalWeek} · CO +{simResult.cohort.obstetricHemodynamics.cardiacOutputGainPct}% · Blood Vol +{simResult.cohort.obstetricHemodynamics.bloodVolumeGainPct}%
          </span>
        ) : (
          <span className="rounded-lg bg-white/10 px-2 py-1">
            Stiffness Index: {simResult.cohort.senescenceVector.arterialCalcificationIndex}
          </span>
        )}
        <span className="rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-2 py-1 text-cyan-200">
          GLB Shell: {assetBundle.shellAssetKey} ({assetBundle.spatialRegistration})
        </span>
        {assetBundle.secondaryGlbPaths.length > 0 && (
          <span className="rounded-lg border border-violet-400/25 bg-violet-500/10 px-2 py-1 text-violet-200">
            +{assetBundle.secondaryGlbPaths.length} fetal/ref asset(s)
          </span>
        )}
      </div>

      {cohortId === 'MAT_PREG' && (
        <label className="block min-h-[44px] rounded-xl border border-pink-400/25 bg-pink-500/10 px-3 py-2 text-xs font-bold text-pink-100">
          <div className="flex items-center justify-between">
            <span>Gestational Week (Obstetric Manifold)</span>
            <span>Week {gestationalWeek} / 42</span>
          </div>
          <input
            type="range"
            aria-label="Gestational week"
            min={1}
            max={42}
            step={1}
            value={gestationalWeek}
            onChange={(e) => setGestationalWeek(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>
      )}

      {/* 4 Intervention Sliders */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <label className="min-h-[44px] rounded-xl border border-white/10 bg-black/30 px-2.5 py-2 text-[11px] font-bold text-slate-200">
          <div className="flex justify-between"><span>Fluid Bolus</span><span>+{fluidBolusMl} mL</span></div>
          <input type="range" aria-label="Fluid bolus mL" min={0} max={2000} step={250} value={fluidBolusMl} onChange={(e) => setFluidBolusMl(Number(e.target.value))} className="mt-1 w-full" />
        </label>
        <label className="min-h-[44px] rounded-xl border border-white/10 bg-black/30 px-2.5 py-2 text-[11px] font-bold text-slate-200">
          <div className="flex justify-between"><span>Vasopressor</span><span>{vasopressorGain.toFixed(1)}x</span></div>
          <input type="range" aria-label="Vasopressor gain" min={0} max={1.5} step={0.1} value={vasopressorGain} onChange={(e) => setVasopressorGain(Number(e.target.value))} className="mt-1 w-full" />
        </label>
        <label className="min-h-[44px] rounded-xl border border-white/10 bg-black/30 px-2.5 py-2 text-[11px] font-bold text-slate-200">
          <div className="flex justify-between"><span>FiO2</span><span>{Math.round(fiO2Fraction * 100)}%</span></div>
          <input type="range" aria-label="Inspired oxygen fraction" min={0.21} max={1} step={0.05} value={fiO2Fraction} onChange={(e) => setFiO2Fraction(Number(e.target.value))} className="mt-1 w-full" />
        </label>
        <label className="min-h-[44px] rounded-xl border border-white/10 bg-black/30 px-2.5 py-2 text-[11px] font-bold text-slate-200">
          <div className="flex justify-between"><span>Inotropy</span><span>+{Math.round(inotropyGain * 100)}%</span></div>
          <input type="range" aria-label="Inotropy gain" min={0} max={1} step={0.1} value={inotropyGain} onChange={(e) => setInotropyGain(Number(e.target.value))} className="mt-1 w-full" />
        </label>
      </div>

      {/* Interactive Causal SVG Graph + 6 Live Telemetry Sparklines */}
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/15 bg-black/45 p-3">
          <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-slate-300">
            <span>Multiorgan Causal Loop (Click Organ to Sync 3D)</span>
            <span className="text-cyan-300">t = 120 min</span>
          </div>
          <svg viewBox="0 0 360 194" className="h-48 w-full select-none" role="img" aria-label="Interactive multiorgan causal propagation graph">
            <defs>
              <marker id="ec-arr-cyan" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#22d3ee" />
              </marker>
              <marker id="ec-arr-rose" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#fb7185" />
              </marker>
              <marker id="ec-arr-emerald" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#34d399" />
              </marker>
            </defs>

            {simResult.causalEdges.map((edge) => {
              const from = CAUSAL_NODE_BY_ID.get(edge.fromMeshId)
              const to = CAUSAL_NODE_BY_ID.get(edge.toMeshId)
              if (!from || !to) return null
              const markerId = edge.feedbackPolarity === 'positive_maladaptive'
                ? 'url(#ec-arr-rose)'
                : edge.feedbackPolarity === 'direct_feedforward'
                  ? 'url(#ec-arr-emerald)'
                  : 'url(#ec-arr-cyan)'
              const mx = (from.x + to.x) / 2
              const my = (from.y + to.y) / 2 - 5
              return (
                <g key={edge.edgeId}>
                  <title>{`${edge.canonicalRelation}: ${sanitizeClinicalText(edge.mechanism)}`}</title>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={edgeStroke(edge.feedbackPolarity)}
                    strokeWidth={edge.magnitudePct >= 10 ? 2.2 : 1.4}
                    strokeOpacity={0.8}
                    markerEnd={markerId}
                  />
                  <text
                    x={mx}
                    y={my}
                    textAnchor="middle"
                    fill="#cbd5e1"
                    fontSize="8.5"
                    fontWeight="700"
                  >
                    {edge.direction === 'decrease' ? '-' : edge.direction === 'increase' ? '+' : ''}
                    {edge.magnitudePct.toFixed(0)}%
                  </text>
                </g>
              )
            })}

            {CAUSAL_NODE_LAYOUTS.map((node) => {
              const active = effectiveMeshId === node.meshId
              return (
                <g
                  key={node.meshId}
                  data-ec-causal-node={node.meshId}
                  role="button"
                  tabIndex={0}
                  aria-label={`Inspect ${node.meshId}`}
                  onClick={() => onSelectMesh(node.meshId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectMesh(node.meshId)
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    x={node.x - 46}
                    y={node.y - 16}
                    width="92"
                    height="32"
                    rx="10"
                    fill={active ? '#0e7490' : '#0f172a'}
                    stroke={active ? '#67e8f9' : 'rgba(255,255,255,0.28)'}
                    strokeWidth={active ? 2 : 1}
                  />
                  <text
                    x={node.x}
                    y={node.y + 3}
                    textAnchor="middle"
                    fill="#f8fafc"
                    fontSize="9.5"
                    fontWeight="800"
                  >
                    {node.shortLabel}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <MetricSparkCard label="CO" unit="L/min" values={seriesOf((p) => p.coLMin)} latest={finalState.coLMin} baseline={baselineEnd.coLMin} stroke="#34d399" decimals={2} />
          <MetricSparkCard label="MAP" unit="mmHg" values={seriesOf((p) => p.mapMmHg)} latest={finalState.mapMmHg} baseline={baselineEnd.mapMmHg} stroke="#22d3ee" decimals={1} />
          <MetricSparkCard label="SpO2" unit="%" values={seriesOf((p) => p.spo2Pct)} latest={finalState.spo2Pct} baseline={baselineEnd.spo2Pct} stroke="#38bdf8" decimals={1} />
          <MetricSparkCard label="GFR" unit="mL/m" values={seriesOf((p) => p.gfrMlMin)} latest={finalState.gfrMlMin} baseline={baselineEnd.gfrMlMin} stroke="#818cf8" decimals={0} />
          <MetricSparkCard label="pH" unit="" values={seriesOf((p) => p.arterialPh)} latest={finalState.arterialPh} baseline={baselineEnd.arterialPh} stroke="#c084fc" decimals={2} />
          <MetricSparkCard label="Lactate" unit="mmol/L" values={seriesOf((p) => p.lactateMmolL)} latest={finalState.lactateMmolL} baseline={baselineEnd.lactateMmolL} stroke="#f59e0b" decimals={2} />
        </div>
      </div>

      {/* Infinite Semantic Zoom 6-Step Scale Ribbon */}
      {convergenceBundle && (
        <div className="space-y-2.5 rounded-2xl border border-white/15 bg-white/[0.03] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-white">
              Multiscale Zoom: {sanitizeClinicalText(convergenceBundle.binding.englishLabel)}
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold text-cyan-200">
              {scaleTab === 'organ' ? 'Spatial Registered GLB' : 'Conceptual Reference Scale'}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Semantic zoom biological scales">
            {SCALE_TABS.map((tab) => {
              const active = scaleTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setScaleTab(tab.id)}
                  className={`min-h-[44px] rounded-xl border px-3 text-xs font-bold transition ${
                    active
                      ? 'border-cyan-300 bg-cyan-400 text-slate-950'
                      : 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="rounded-xl border border-white/10 bg-black/35 p-3 text-xs text-slate-200">
            {scaleTab === 'organ' && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-extrabold text-white">{sanitizeClinicalText(convergenceBundle.binding.indonesianLabel)}</div>
                  <div className="text-[11px] text-slate-300">
                    {convergenceBundle.binding.canonicalOntologyId} · {convergenceBundle.binding.snomedCtId} · HR {finalState.hrBpm} bpm · EF {finalState.efPct}%
                  </div>
                </div>
                <span className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-bold">
                  P50 {finalState.p50MmHg} mmHg · DO2 {finalState.do2MlMin} mL/m
                </span>
              </div>
            )}

            {scaleTab === 'ftu' && (
              <div>
                <div className="font-extrabold text-white">{sanitizeClinicalText(convergenceBundle.verticalChain.scale2_tissue_ftu.tissueUnitLabel)}</div>
                <div className="mt-1 text-[11px] text-slate-300">{sanitizeClinicalText(convergenceBundle.verticalChain.scale2_tissue_ftu.histologyMicroarchitecture)}</div>
              </div>
            )}

            {scaleTab === 'cell' && (
              <div className="flex flex-wrap gap-2">
                {convergenceBundle.verticalChain.scale3_cell.map((cell) => (
                  <span key={cell} className="rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-200">
                    {sanitizeClinicalText(cell)}
                  </span>
                ))}
              </div>
            )}

            {scaleTab === 'organelle' && (
              <div className="grid gap-2 sm:grid-cols-3">
                {convergenceBundle.verticalChain.scale4_organelles.map((org) => (
                  <div key={org.kunci} className="rounded-lg border border-white/10 bg-white/[0.04] p-2">
                    <div className="font-extrabold text-white">{sanitizeClinicalText(org.nama)}</div>
                    <div className="mt-0.5 text-[11px] text-slate-300">{sanitizeClinicalText(org.fungsi)}</div>
                  </div>
                ))}
              </div>
            )}

            {scaleTab === 'drug' && primaryDrug && interactivePkPd && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-extrabold text-white">
                      {sanitizeClinicalText(primaryDrug.target.katalog)} → {sanitizeClinicalText(primaryDrug.target.target)}
                    </div>
                    <div className="text-[11px] text-slate-300">{sanitizeClinicalText(primaryDrug.target.aksi)}</div>
                  </div>
                  <span className="rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-200">
                    Occupancy: {interactivePkPd.receptorOccupancyPct}% · C(t) {interactivePkPd.plasmaConcentrationMgL} mg/L
                  </span>
                </div>
                <label className="block min-h-[44px] text-[11px] font-bold text-slate-300">
                  <div className="flex justify-between">
                    <span>Educational 1-Compartment PK Post-Dose Time (GFR-scaled clearance)</span>
                    <span>+{pkElapsedHours}h (t1/2 {interactivePkPd.halfLifeHours}h)</span>
                  </div>
                  <input type="range" aria-label="PK elapsed hours" min={0} max={24} step={1} value={pkElapsedHours} onChange={(e) => setPkElapsedHours(Number(e.target.value))} className="mt-1 w-full" />
                </label>
              </div>
            )}

            {scaleTab === 'gene' && (
              <div className="space-y-1.5">
                <div className="flex flex-wrap gap-2">
                  {convergenceBundle.verticalChain.scale6_genes.map((gene) => (
                    <div key={gene.id} className="rounded-lg border border-violet-400/30 bg-violet-500/15 px-2.5 py-1.5">
                      <div className="font-extrabold text-violet-100">{gene.symbol} ({gene.locus})</div>
                      <div className="text-[11px] text-slate-300">{sanitizeClinicalText(gene.role)}</div>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-slate-400">
                  {sanitizeClinicalText(convergenceBundle.verticalChain.scale6_genomicBoundary)}
                </div>
              </div>
            )}
          </div>

          {/* Canonical #3143 Ontology Bridge Chips (explicit Conceptual Scale Bridge marker) */}
          {convergenceBundle.verticalChain.realityGraphNodes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5" aria-label="Canonical multiscale ontology identifiers">
              <span className="rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                {convergenceBundle.verticalChain.realityGraphScaleBridge}
              </span>
              {convergenceBundle.verticalChain.realityGraphNodes.slice(0, 6).map((node) => (
                <span
                  key={node.id}
                  title={sanitizeClinicalText(node.labelEn)}
                  className="rounded-md border border-cyan-400/25 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-200"
                >
                  {node.canonicalIdentifier}
                </span>
              ))}
            </div>
          )}

          {/* Verified Cross-SuperPage Links */}
          <div className="flex flex-wrap gap-1.5">
            {systemLinks.map((lnk) => (
              <Link
                key={lnk.id}
                to={lnk.to}
                className="inline-flex min-h-[44px] items-center rounded-xl border border-white/15 bg-white/5 px-3 text-[11px] font-bold text-cyan-200 hover:bg-white/10"
              >
                {lnk.categoryLabel}: {lnk.label} →
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Collapsed Assumptions / Causal Proof Disclosure */}
      <details className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[11px] text-slate-300">
        <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 font-bold text-slate-200">
          <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-full border border-white/25 text-[10px]">i</span>
          <span>Causal Mechanisms, Equations &amp; Epistemic Scope ({simResult.causalEdges.length} Links)</span>
        </summary>
        <div className="space-y-1.5 pb-2 pt-1">
          {simResult.causalEdges.map((edge) => (
            <div key={edge.edgeId} className="rounded-lg bg-black/35 px-2.5 py-1.5">
              <span className="mr-1.5 rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-extrabold text-cyan-300">{edge.canonicalRelation}</span>
              <span className="font-bold text-cyan-200">{edge.fromMeshId} → {edge.toMeshId}</span>: {sanitizeClinicalText(edge.mechanism)} ({edge.evidenceCitation})
            </div>
          ))}
          <p className="text-[10px] text-slate-400">{simResult.disclaimer}</p>
        </div>
      </details>
    </section>
  )
}

export default EtCausalisExplorerPanel
