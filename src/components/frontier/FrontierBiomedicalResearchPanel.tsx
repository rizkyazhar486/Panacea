import React, { useState, useMemo } from 'react'
import {
  FRONTIER_RESEARCH_REGISTRY,
  getFrontierStudyByTClinId,
} from '../../lib/discovery/frontierResearchRegistry'
import {
  CANONICAL_ATLAS_REFERENCE_NODES,
  getHierarchicalAtlasLineage,
  queryCellAtlasByOrgan,
  queryCellAtlasByMarker,
  TOTAL_HECA_V2_CELL_COUNT,
  TOTAL_HECA_V2_ORGANS_COUNT,
  TOTAL_CIMA_2026_CELL_COUNT,
} from '../../lib/discovery/humanEnsembleCellAtlasAdapter'
import {
  simulateBciSignalDecoding,
  calculateReviveHeartOutcomes,
  calculateFerroAgingKinetics,
  calculateBiologicalAgingClock,
} from '../../lib/discovery/frontierComputationalEngines'
import type { FrontierResearchStudyRecord } from '../../lib/discovery/frontierBiomedicalTypes'

export function FrontierBiomedicalResearchPanel() {
  const [activeTClinId, setActiveTClinId] = useState<string>('T-CLIN-65')
  const [organQuery, setOrganQuery] = useState<string>('Heart')
  const [markerQuery, setMarkerQuery] = useState<string>('ACSL4')

  // Simulator states
  const [bciIntention, setBciIntention] = useState<'rest' | 'hand_grasp' | 'hand_open'>('hand_grasp')
  const [bciSnr, setBciSnr] = useState<number>(12.0)

  const [reviveBaseline, setReviveBaseline] = useState<number>(310)
  const [revive12Mo, setRevive12Mo] = useState<number>(375)
  const [reviveArrhythmia, setReviveArrhythmia] = useState<boolean>(false)

  const [ferroLip, setFerroLip] = useState<number>(8.5)
  const [ferroVitC, setFerroVitC] = useState<number>(55.0)

  const [clockChrono, setClockChrono] = useState<number>(58)
  const [clockBio, setClockBio] = useState<number>(53.4)

  const activeStudy: FrontierResearchStudyRecord = useMemo(() => {
    return getFrontierStudyByTClinId(activeTClinId) || FRONTIER_RESEARCH_REGISTRY[0]
  }, [activeTClinId])

  const organSearchResult = useMemo(() => {
    return queryCellAtlasByOrgan(organQuery)
  }, [organQuery])

  const markerSearchResult = useMemo(() => {
    return queryCellAtlasByMarker(markerQuery)
  }, [markerQuery])

  const bciSimResult = useMemo(() => {
    return simulateBciSignalDecoding({
      samplingRateHz: 1000,
      durationSec: 1.0,
      rawElectrodeChannels: 8,
      snrDb: bciSnr,
      intendedMotorDirection: bciIntention,
    })
  }, [bciIntention, bciSnr])

  const reviveSimResult = useMemo(() => {
    return calculateReviveHeartOutcomes({
      baseline6MwdMeters: reviveBaseline,
      month126MwdMeters: revive12Mo,
      group: 'intervention_cabg_plus_hicm188',
      lvefPercentBaseline: 28.0,
      lvefPercent12Month: 35.5,
      reportedAdverseEventsCount: 0,
      hasVentricularArrhythmia: reviveArrhythmia,
    })
  }, [reviveBaseline, revive12Mo, reviveArrhythmia])

  const ferroSimResult = useMemo(() => {
    return calculateFerroAgingKinetics({
      labileIronPoolMicromolar: ferroLip,
      acsl4ExpressionRelative: 1.8,
      polyunsaturatedFattyAcidSubstratePePercent: 32.0,
      redoxAntioxidantReservePercent: 65.0,
      vitaminCPlasmaConcentrationMicromolar: ferroVitC,
    })
  }, [ferroLip, ferroVitC])

  const clockSimResult = useMemo(() => {
    return calculateBiologicalAgingClock({
      chronologicalAgeYears: clockChrono,
      clockModel: 'GrimAge_2019',
      cpgMethylationBetaValuesCount: 1030,
      cellTypeCompositionNormalized: true,
      estimatedBiologicalAgeYears: clockBio,
      dunedinPaceYearsPerYear: 0.88,
    })
  }, [clockChrono, clockBio])

  const sampleLineage = useMemo(() => {
    return getHierarchicalAtlasLineage('Heart', 'Cardiomyocyte')
  }, [])

  return (
    <div
      className="space-y-6 rounded-2xl border border-white/10 bg-slate-950/80 p-4 sm:p-6 text-white"
      data-frontier-research-panel="v1"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-bold text-cyan-400">
              INVICTUS OMEGA · T-CLIN-65 → T-CLIN-71
            </span>
            <span className="text-xs text-white/50">Scientific Cutoff: 27 October 2026</span>
          </div>
          <h2 className="mt-1 text-lg sm:text-xl font-black text-white">
            Frontier Biomedical Discovery & Multiscale Simulation Engine
          </h2>
          <p className="text-xs text-white/60">
            Integrating Chinese and international translational research into PanaceaMed’s computational human platform.
          </p>
        </div>
        <div className="text-right text-[11px] text-white/50 space-y-0.5">
          <div>hECA v2.0: {(TOTAL_HECA_V2_CELL_COUNT / 1e6).toFixed(2)}M cells ({TOTAL_HECA_V2_ORGANS_COUNT} organs)</div>
          <div>CIMA 2026: {(TOTAL_CIMA_2026_CELL_COUNT / 1e6).toFixed(0)}M immune profiles (428 adults)</div>
        </div>
      </div>

      {/* Track Selector Ribbon */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {FRONTIER_RESEARCH_REGISTRY.map((study) => {
          const isSelected = study.tClinId === activeTClinId
          return (
            <button
              key={study.tClinId}
              type="button"
              onClick={() => setActiveTClinId(study.tClinId)}
              className={`flex-shrink-0 rounded-xl px-3 py-2 text-left transition-all ${
                isSelected
                  ? 'border border-cyan-400 bg-cyan-950/60 text-white shadow-lg shadow-cyan-950/50'
                  : 'border border-white/5 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-cyan-300">
                  {study.tClinId}
                </span>
                <span className="rounded bg-white/10 px-1 py-0.2 text-[9px] text-white/70">
                  {study.evidenceStage}
                </span>
              </div>
              <div className="text-xs font-semibold truncate max-w-[190px]">
                {study.shortLabel}
              </div>
            </button>
          )
        })}
      </div>

      {/* Active Study Dossier Card */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white">{activeStudy.title}</span>
              <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                Stage: {activeStudy.claimLedgerStage}
              </span>
              <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                Policy: {activeStudy.datasetAccessPolicy}
              </span>
            </div>
            <div className="mt-1 text-xs text-white/70">
              <b>Primary Precedent:</b> {activeStudy.primaryPrecedent} ({activeStudy.publicationYear})
              {activeStudy.primaryDoi && <span className="ml-2 text-cyan-300">DOI: {activeStudy.primaryDoi}</span>}
              {activeStudy.clinicalTrialId && <span className="ml-2 text-amber-300">NCT: {activeStudy.clinicalTrialId}</span>}
            </div>
          </div>
        </div>

        {/* Falsifiable Hypothesis & Question */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="rounded-lg bg-black/40 p-3 text-xs space-y-1">
            <div className="font-bold text-cyan-300 uppercase text-[10px] tracking-wider">
              Scientific Question
            </div>
            <div className="text-white/80">{activeStudy.scientificQuestion}</div>
          </div>
          <div className="rounded-lg bg-black/40 p-3 text-xs space-y-1">
            <div className="font-bold text-emerald-300 uppercase text-[10px] tracking-wider">
              Falsifiable Hypothesis
            </div>
            <div className="text-white/80">{activeStudy.falsifiableHypothesis}</div>
          </div>
        </div>

        {/* Erratum Notice if Applicable (e.g. Track D) */}
        {activeStudy.hasErratum && activeStudy.errata && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-950/30 p-3 text-xs space-y-1 text-amber-200">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <span>⚠️ Published Scientific Erratum Accounted For</span>
              <span className="text-[10px] text-white/60">DOI: {activeStudy.errata[0].doi}</span>
            </div>
            <div>{activeStudy.errata[0].description}</div>
            <div className="text-[11px] text-amber-100 font-mono mt-1">
              Impact: {activeStudy.errata[0].parameterImpact}
            </div>
          </div>
        )}

        {/* Endpoints & Limitations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <div className="font-bold text-white/50 text-[10px] uppercase mb-1">
              Key Endpoint Criteria ({activeStudy.endpointDefinitions.length})
            </div>
            <ul className="list-disc pl-4 space-y-0.5 text-white/70">
              {activeStudy.endpointDefinitions.map((ep, i) => (
                <li key={i}>{ep}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-bold text-white/50 text-[10px] uppercase mb-1">
              Safety Boundaries & Negative Limits
            </div>
            <ul className="list-disc pl-4 space-y-0.5 text-white/70">
              {activeStudy.safetyBoundaries.map((sb, i) => (
                <li key={i}>{sb}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Section 2: Multiscale Human Cellular Reference Explorer (hECA & CIMA) */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
          <div>
            <h3 className="text-sm font-bold text-white">
              Multiscale Cellular Atlas Navigator (hECA v2.0 & CIMA 2026)
            </h3>
            <p className="text-xs text-white/60">
              Hierarchical whole-body reference with Cell Ontology (CL) harmonization and dataset access governance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={organQuery}
              onChange={(e) => setOrganQuery(e.target.value)}
              placeholder="Search organ..."
              className="rounded-lg border border-white/10 bg-black/50 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
            <input
              type="text"
              value={markerQuery}
              onChange={(e) => setMarkerQuery(e.target.value)}
              placeholder="Marker (e.g. ACSL4)..."
              className="rounded-lg border border-white/10 bg-black/50 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Canonical Hierarchy Breadcrumb */}
        <div className="rounded-lg bg-black/40 p-2.5 text-xs">
          <div className="text-[10px] font-bold uppercase text-white/40 mb-1">
            Canonical Scale Hierarchy (Whole Body → Organ → Cell → Pathway → Genome)
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            {sampleLineage.map((lvl, idx) => (
              <React.Fragment key={lvl.scale}>
                <span className="rounded bg-white/5 px-2 py-0.5 text-cyan-300 font-mono">
                  {lvl.scale}: <b>{lvl.name}</b>
                </span>
                {idx < sampleLineage.length - 1 && <span className="text-white/30">→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Atlas Query Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {organSearchResult.matchedNodes.slice(0, 4).map((node) => (
            <div
              key={node.cellOntologyId}
              className="rounded-lg border border-white/5 bg-white/[0.015] p-2.5 text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{node.cellTypeName}</span>
                <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-300 font-mono">
                  {node.cellOntologyId}
                </span>
              </div>
              <div className="text-[11px] text-white/60">
                {node.organName} · {node.tissueName} ({node.sourceAtlas})
              </div>
              <div className="text-[11px] text-emerald-300 font-mono truncate">
                Markers: {node.rnaExpressionMarkers.join(', ')}
              </div>
              <div className="text-[10px] text-white/40">
                Profiles: {node.singleCellProfileCount.toLocaleString()} · Access: {node.accessPolicy}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Interactive Computational Simulators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Simulator 1: NEO BCI Decoder */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              Track A · NEO Epidural BCI Decoder
            </h4>
            <span className="rounded bg-cyan-950 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
              Non-Actuated Simulation
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="text-white/60">Intention:</label>
            <select
              value={bciIntention}
              onChange={(e) => setBciIntention(e.target.value as any)}
              className="dark rounded border border-white/10 bg-black px-2 py-1 text-xs text-white"
            >
              <option value="hand_grasp">Hand Grasp</option>
              <option value="hand_open">Hand Open</option>
              <option value="rest">Rest</option>
            </select>
            <label className="text-white/60 ml-2">SNR (dB):</label>
            <input
              type="number"
              value={bciSnr}
              onChange={(e) => setBciSnr(Number(e.target.value))}
              className="dark w-16 rounded border border-white/10 bg-black px-2 py-1 text-xs text-white"
            />
          </div>
          <div className="rounded-lg bg-black/40 p-2.5 text-xs space-y-1 font-mono">
            <div>Decoded: <b className="text-emerald-300">{bciSimResult.decodedIntention}</b></div>
            <div>Confidence: {bciSimResult.confidenceScore * 100}% (Uncertainty: {bciSimResult.uncertaintyEstimate})</div>
            <div>Simulated Vector: [{bciSimResult.simulatedAssistiveActuatorVector.join(', ')}]</div>
            <div className="text-[10px] text-white/40">Hard non-actuation verified · Neural privacy locked</div>
          </div>
        </div>

        {/* Simulator 2: REVIVE-HEART Δ6MWD Engine */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Track B · REVIVE-HEART Δ6MWD Engine
            </h4>
            <span className="rounded bg-amber-950 px-2 py-0.5 text-[10px] font-bold text-amber-300">
              Phase III Trial Protocol
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="text-white/60">Baseline 6MWD (m):</label>
            <input
              type="number"
              value={reviveBaseline}
              onChange={(e) => setReviveBaseline(Number(e.target.value))}
              className="dark w-16 rounded border border-white/10 bg-black px-2 py-1 text-xs text-white"
            />
            <label className="text-white/60 ml-2">12-Mo (m):</label>
            <input
              type="number"
              value={revive12Mo}
              onChange={(e) => setRevive12Mo(Number(e.target.value))}
              className="dark w-16 rounded border border-white/10 bg-black px-2 py-1 text-xs text-white"
            />
            <label className="flex items-center gap-1 text-white/60 ml-2 cursor-pointer">
              <input
                type="checkbox"
                checked={reviveArrhythmia}
                onChange={(e) => setReviveArrhythmia(e.target.checked)}
              />
              <span>VT Event</span>
            </label>
          </div>
          <div className="rounded-lg bg-black/40 p-2.5 text-xs space-y-1 font-mono">
            <div>Delta 6MWD: <b className="text-amber-300">{reviveSimResult.delta6MwdMeters} m</b> (95% CI: [{reviveSimResult.confidenceInterval95Percent.join(', ')}])</div>
            <div>Contrast vs Control: {reviveSimResult.treatmentContrastEstimatedMeters} m</div>
            <div>Safety Status: <span className={reviveArrhythmia ? 'text-red-400 font-bold' : 'text-emerald-300'}>{reviveSimResult.arrhythmiaSafetyStatus}</span></div>
            <div className="text-[10px] text-white/40">Phase III investigational model · Not an approved therapy</div>
          </div>
        </div>

        {/* Simulator 3: ACSL4 Ferro-Aging Kinetics */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300">
              Track D · ACSL4 Ferro-Aging (Erratum Corrected)
            </h4>
            <span className="rounded bg-rose-950 px-2 py-0.5 text-[10px] font-bold text-rose-300">
              Aug 2026 Erratum Applied
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="text-white/60">Labile Fe2+ (µM):</label>
            <input
              type="number"
              value={ferroLip}
              onChange={(e) => setFerroLip(Number(e.target.value))}
              className="dark w-16 rounded border border-white/10 bg-black px-2 py-1 text-xs text-white"
            />
            <label className="text-white/60 ml-2">Vitamin C (µM):</label>
            <input
              type="number"
              value={ferroVitC}
              onChange={(e) => setFerroVitC(Number(e.target.value))}
              className="dark w-16 rounded border border-white/10 bg-black px-2 py-1 text-xs text-white"
            />
          </div>
          <div className="rounded-lg bg-black/40 p-2.5 text-xs space-y-1 font-mono">
            <div>Peroxidation Rate: <b className="text-rose-300">{ferroSimResult.lipidPeroxidationRateNominal}</b> (uncorrected was ~2.1x)</div>
            <div>Stress Score: {ferroSimResult.ferroAgingChronicStressScore} / 100 · Cristae Score: {ferroSimResult.mitochondrialCristaePreservationScore}%</div>
            <div>Erratum DOI: {ferroSimResult.erratumDoi}</div>
            <div className="text-[10px] text-white/40">Preclinical non-human primate model · Zero human dose extrapolation</div>
          </div>
        </div>

        {/* Simulator 4: Biological Aging Clock Gap */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
              Track E · Biological Aging Clock Engine
            </h4>
            <span className="rounded bg-purple-950 px-2 py-0.5 text-[10px] font-bold text-purple-300">
              NCT06794255 Protocol
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="text-white/60">Chrono Age:</label>
            <input
              type="number"
              value={clockChrono}
              onChange={(e) => setClockChrono(Number(e.target.value))}
              className="dark w-16 rounded border border-white/10 bg-black px-2 py-1 text-xs text-white"
            />
            <label className="text-white/60 ml-2">Bio Age:</label>
            <input
              type="number"
              value={clockBio}
              onChange={(e) => setClockBio(Number(e.target.value))}
              className="dark w-16 rounded border border-white/10 bg-black px-2 py-1 text-xs text-white"
            />
          </div>
          <div className="rounded-lg bg-black/40 p-2.5 text-xs space-y-1 font-mono">
            <div>Bio-Age Gap: <b className="text-purple-300">{clockSimResult.biologicalAgeGapYears > 0 ? `+${clockSimResult.biologicalAgeGapYears}` : clockSimResult.biologicalAgeGapYears} years</b></div>
            <div>Clock: {clockSimResult.clockModel} ({clockSimResult.clockVersion})</div>
            <div>Uncertainty: ±{clockSimResult.measurementUncertaintyYears} yrs · Pace: {clockSimResult.dunedinPaceRate} yrs/yr</div>
            <div className="text-[10px] text-white/40">Statistical model output · Never substitute for lifespan evidence</div>
          </div>
        </div>
      </div>

      {/* Epistemic Footer */}
      <div className="border-t border-white/10 pt-3 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/50">
        <div>
          PANACEAMED ∞ INVICTUS OMEGA · T-CLIN-65..71 · Grounded in Chinese & International Research Precedents
        </div>
        <div className="font-mono text-cyan-400">
          truthClass: frontier_biomedical_research_proxy · patientTruthUncompromised
        </div>
      </div>
    </div>
  )
}
