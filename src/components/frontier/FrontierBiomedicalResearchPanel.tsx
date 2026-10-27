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
import {
  calculateQuantumProtonTunneling,
  calculateRadicalPairSpinDynamics,
} from '../../lib/discovery/quantumBiologyBiophysicsEngine'
import {
  EURASIAN_CELL_ATLAS_CATALOG,
  buildEurasianLineageGraph,
} from '../../lib/discovery/eurasianCellAtlasFederation'
import {
  GAME_MISSIONS,
  evaluateGameSimulationStep,
} from '../../lib/discovery/immersiveLifeScienceSandboxEngine'
import {
  NEUROETHICAL_CANONICAL_PRINCIPLES,
  screenDualUseAndNeuroethics,
} from '../../lib/discovery/dualUseNeuroethicsKernel'
import type {
  FrontierResearchStudyRecord,
  GameMissionId,
} from '../../lib/discovery/frontierBiomedicalTypes'

export function FrontierBiomedicalResearchPanel() {
  const [activeTClinId, setActiveTClinId] = useState<string>('T-CLIN-65')
  const [organQuery, setOrganQuery] = useState<string>('Heart')
  const [markerQuery, setMarkerQuery] = useState<string>('ACSL4')

  // Simulator states (Tracks A, B, D, E)
  const [bciIntention, setBciIntention] = useState<'rest' | 'hand_grasp' | 'hand_open'>('hand_grasp')
  const [bciSnr, setBciSnr] = useState<number>(12.0)

  const [reviveBaseline, setReviveBaseline] = useState<number>(310)
  const [revive12Mo, setRevive12Mo] = useState<number>(375)
  const [reviveArrhythmia, setReviveArrhythmia] = useState<boolean>(false)

  const [ferroLip, setFerroLip] = useState<number>(8.5)
  const [ferroVitC, setFerroVitC] = useState<number>(55.0)

  const [clockChrono, setClockChrono] = useState<number>(58)
  const [clockBio, setClockBio] = useState<number>(53.4)

  // Track H: Quantum Tunneling State
  const [quantumWidth, setQuantumWidth] = useState<number>(0.55)
  const [quantumHeight, setQuantumHeight] = useState<number>(0.42)
  const [quantumIsotope, setQuantumIsotope] = useState<'H' | 'D'>('H')

  // Track J: Gamified Simulation Lab State
  const [activeMissionId, setActiveMissionId] = useState<GameMissionId>('mission_cardiac_syncytium')
  const [gameStepCount, setGameStepCount] = useState<number>(0)
  const [gameParams, setGameParams] = useState<Record<string, number>>({
    graftDoseMillions: 45,
    connexin43Coupling: 0.65,
    actionPotentialDuration: 310,
  })

  // Track K: Dual-Use Screening State
  const [durcTestDirectNeuralControl, setDurcTestDirectNeuralControl] = useState<boolean>(false)
  const [durcTestPathogenToxin, setDurcTestPathogenToxin] = useState<boolean>(false)

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

  const quantumTunnelingResult = useMemo(() => {
    return calculateQuantumProtonTunneling({
      barrierWidthAngstroms: quantumWidth,
      barrierHeightElectronVolts: quantumHeight,
      temperatureKelvin: 310.15,
      isotope: quantumIsotope,
      activeSite: 'mitochondrial_complex_I',
    })
  }, [quantumWidth, quantumHeight, quantumIsotope])

  const eurasianLineage = useMemo(() => {
    return buildEurasianLineageGraph()
  }, [])

  const currentMission = useMemo(() => {
    return GAME_MISSIONS.find((m) => m.id === activeMissionId) || GAME_MISSIONS[0]
  }, [activeMissionId])

  const gameChallengeState = useMemo(() => {
    return evaluateGameSimulationStep(activeMissionId, gameParams, gameStepCount)
  }, [activeMissionId, gameParams, gameStepCount])

  const durcScreeningReport = useMemo(() => {
    return screenDualUseAndNeuroethics({
      proposedResearchTitle: 'Multiscale Translational Neuroprosthetic & Senolytic Platform',
      domain: 'neurotechnology',
      involvesDirectNeuralRead: true,
      involvesDirectNeuralStimulationOrControl: durcTestDirectNeuralControl,
      involvesAutonomousDeviceActuation: false,
      involvesPathogenEnhancementOrToxinEngineering: durcTestPathogenToxin,
      involvesNonConsensualIntervention: false,
    })
  }, [durcTestDirectNeuralControl, durcTestPathogenToxin])

  const handleMissionSelect = (id: GameMissionId) => {
    setActiveMissionId(id)
    const m = GAME_MISSIONS.find((item) => item.id === id)
    if (m) {
      const defaults: Record<string, number> = {}
      for (const p of m.keyParameters) {
        defaults[p.id] = p.defaultValue
      }
      setGameParams(defaults)
      setGameStepCount(0)
    }
  }

  return (
    <div
      className="space-y-6 rounded-2xl border border-white/10 bg-slate-950/80 p-4 sm:p-6 text-white"
      data-frontier-research-panel="v2"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-bold text-cyan-400">
              INVICTUS OMEGA · T-CLIN-65 → T-CLIN-75
            </span>
            <span className="text-xs text-white/50">Scientific Cutoff: 27 October 2026</span>
          </div>
          <h2 className="mt-1 text-lg sm:text-xl font-black text-white">
            Frontier Biomedical Discovery & Multiscale Simulation Engine
          </h2>
          <p className="text-xs text-white/60">
            Integrating Chinese, Eurasian, and international translational research into PanaceaMed’s computational human platform.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-bold text-emerald-400">11 Active Research Tracks</div>
            <div className="text-[10px] text-white/50">32.8M+ Harmonized Cells · 42 Organs</div>
          </div>
        </div>
      </div>

      {/* Track Selection Ribbon */}
      <div className="flex flex-wrap gap-1.5 border-b border-white/5 pb-3">
        {FRONTIER_RESEARCH_REGISTRY.map((study) => {
          const isSelected = study.tClinId === activeTClinId
          return (
            <button
              key={study.tClinId}
              onClick={() => setActiveTClinId(study.tClinId)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="font-mono">{study.tClinId}</span>: {study.title.split(':')[0]}
            </button>
          )
        })}
      </div>

      {/* Section 1: Active Study Dossier */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
              {activeStudy.trackId} · Stage {activeStudy.evidenceStage}
            </span>
            <h3 className="text-sm font-bold text-white">{activeStudy.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white">
              {activeStudy.claimLedgerStage}
            </span>
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                activeStudy.datasetAccessPolicy === 'public_open_access'
                  ? 'bg-emerald-950 text-emerald-300'
                  : activeStudy.datasetAccessPolicy === 'controlled_access_dac_required'
                  ? 'bg-amber-950 text-amber-300'
                  : 'bg-neutral-800 text-neutral-300'
              }`}
            >
              {activeStudy.datasetAccessPolicy}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="font-bold text-white/50">Primary Precedent:</span>
            <p className="mt-0.5 text-white/90">{activeStudy.primaryPrecedent}</p>
            {activeStudy.primaryDoi && (
              <p className="mt-1 font-mono text-[11px] text-cyan-400">DOI: {activeStudy.primaryDoi}</p>
            )}
            {activeStudy.pmid && (
              <p className="font-mono text-[11px] text-emerald-400">PMID: {activeStudy.pmid}</p>
            )}
            {activeStudy.clinicalTrialId && (
              <p className="font-mono text-[11px] text-amber-400">ClinicalTrials.gov: {activeStudy.clinicalTrialId}</p>
            )}
          </div>
          <div>
            <span className="font-bold text-white/50">Scientific Question:</span>
            <p className="mt-0.5 text-white/90">{activeStudy.scientificQuestion}</p>
          </div>
        </div>

        <div className="rounded-lg bg-black/40 p-3 text-xs space-y-2">
          <div className="font-bold text-cyan-300">Falsifiable Hypothesis:</div>
          <p className="text-white/80">{activeStudy.falsifiableHypothesis}</p>
        </div>

        {/* Known Limitations & Safety Boundaries */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="rounded-lg border border-amber-500/20 bg-amber-950/10 p-3">
            <span className="font-bold text-amber-400">Epistemic Limitations:</span>
            <ul className="mt-1.5 list-disc list-inside space-y-1 text-white/70 text-[11px]">
              {activeStudy.knownLimitations.map((lim, idx) => (
                <li key={idx}>{lim}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-rose-500/20 bg-rose-950/10 p-3">
            <span className="font-bold text-rose-400">Safety & Governance Boundaries:</span>
            <ul className="mt-1.5 list-disc list-inside space-y-1 text-white/70 text-[11px]">
              {activeStudy.safetyBoundaries.map((bnd, idx) => (
                <li key={idx}>{bnd}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Section 2: Multiscale Human Cellular Reference Explorer (hECA, CIMA & Eurasian Federation) */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
          <div>
            <h3 className="text-sm font-bold text-white">
              Multiscale Cellular Atlas Navigator (hECA v2.0, CIMA 2026 & Eurasian Federation)
            </h3>
            <p className="text-xs text-white/60">
              Hierarchical whole-body reference with Cell Ontology (CL) harmonization, empirical lineage verification, and DAC dataset access governance.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="rounded bg-cyan-950 px-2 py-0.5 text-cyan-300">
              {TOTAL_HECA_V2_ORGANS_COUNT} Organs
            </span>
            <span className="rounded bg-emerald-950 px-2 py-0.5 text-emerald-300">
              {TOTAL_HECA_V2_CELL_COUNT} hECA
            </span>
            <span className="rounded bg-purple-950 px-2 py-0.5 text-purple-300">
              {TOTAL_CIMA_2026_CELL_COUNT} CIMA
            </span>
          </div>
        </div>

        {/* Query Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <label className="text-white/60">Search Organ:</label>
            <input
              type="text"
              value={organQuery}
              onChange={(e) => setOrganQuery(e.target.value)}
              placeholder="e.g. Heart, Brain, Immune"
              className="dark rounded-lg border border-white/10 bg-black/50 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-white/60">Search Marker:</label>
            <input
              type="text"
              value={markerQuery}
              onChange={(e) => setMarkerQuery(e.target.value)}
              placeholder="e.g. ACSL4, FOXO3, TNNT2"
              className="dark rounded-lg border border-white/10 bg-black/50 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Eurasian Lineage Graph Preview */}
        <div className="rounded-lg bg-black/30 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-cyan-400">Federated Developmental Lineage Graph (T-CLIN-73)</span>
            <span className="text-[10px] text-white/40">Cluster similarity ≠ developmental descent</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {eurasianLineage.nodes.slice(0, 6).map((node) => (
              <div key={node.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-cyan-300">{node.clId}</span>
                  <span className={`text-[9px] px-1 rounded ${node.empiricalLineageTracingEvidence ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'}`}>
                    {node.empiricalLineageTracingEvidence ? 'Barcode Verified' : 'Cluster Proxy'}
                  </span>
                </div>
                <div className="font-bold text-white text-[11px] truncate">{node.name}</div>
                <div className="text-[10px] text-white/50">{node.organ} · {node.potency}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3: Interactive Life-Science Discovery Sandbox & Gamified Mission Lab (T-CLIN-74) */}
      <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/10 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-500/20 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 uppercase">
                Gamified Life Science Lab · T-CLIN-74
              </span>
              <span className="text-[10px] text-white/50">Tactile Interactive Learning</span>
            </div>
            <h3 className="text-sm font-bold text-white mt-1">
              {currentMission.title}
            </h3>
            <p className="text-xs text-white/70">{currentMission.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded px-2.5 py-1 text-xs font-bold ${
              gameChallengeState.targetAchieved ? 'bg-emerald-900 text-emerald-200' : 'bg-cyan-900 text-cyan-200'
            }`}>
              Score: {gameChallengeState.score}/100 · Stability: {(gameChallengeState.stabilityIndex * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Mission Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {GAME_MISSIONS.map((m) => (
            <button
              key={m.id}
              onClick={() => handleMissionSelect(m.id)}
              className={`rounded px-2.5 py-1 text-xs font-bold transition-all ${
                activeMissionId === m.id
                  ? 'bg-cyan-400 text-black'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {m.title.split(':')[0]}
            </button>
          ))}
        </div>

        {/* Interactive Parameter Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-black/40 p-3 rounded-lg">
          {currentMission.keyParameters.map((param) => {
            const val = gameParams[param.id] ?? param.defaultValue
            return (
              <div key={param.id} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/70">{param.label}</span>
                  <span className="font-mono text-cyan-300">{val} {param.unit}</span>
                </div>
                <input
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={(param.max - param.min) / 100}
                  value={val}
                  onChange={(e) => {
                    const newVal = Number(e.target.value)
                    setGameParams((prev) => ({ ...prev, [param.id]: newVal }))
                    setGameStepCount((prev) => prev + 1)
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            )
          })}
        </div>

        {/* Mission State & Reality Check Reminder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg bg-black/50 p-3 space-y-1.5 border border-white/5 font-mono">
            <div className="text-cyan-300 font-bold">Simulation Step #{gameChallengeState.stepCount} · {gameChallengeState.loopState.toUpperCase()}</div>
            <div className="text-white/90">{gameChallengeState.message}</div>
            <div className="text-[11px] text-white/50">{gameChallengeState.educationalTakeaway}</div>
          </div>
          <div className="rounded-lg bg-amber-950/20 p-3 space-y-1.5 border border-amber-500/30">
            <div className="text-amber-400 font-bold flex items-center gap-1.5">
              <span>⚠️ Reality Check Reminder:</span>
            </div>
            <p className="text-[11px] text-white/80">{gameChallengeState.realityCheckReminder}</p>
          </div>
        </div>
      </div>

      {/* Section 4: Quantum Biology & Biophysical Tunneling Studio (T-CLIN-72) */}
      <div className="rounded-xl border border-purple-500/30 bg-purple-950/10 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/20 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300 uppercase">
                Quantum Biology Studio · T-CLIN-72
              </span>
              <span className="text-[10px] text-white/50">Sub-nanometer WKB Tunneling</span>
            </div>
            <h3 className="text-sm font-bold text-white mt-1">
              Quantum Proton Tunneling & Kinetic Isotope Effect (KIE)
            </h3>
            <p className="text-xs text-white/70">
              Evaluates non-Arrhenius enzymatic rate acceleration and deuterium isotope sensitivity in Complex I & DNA repair active sites.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="text-white/60">Isotope:</label>
            <button
              onClick={() => setQuantumIsotope('H')}
              className={`px-2 py-0.5 rounded text-xs font-bold ${quantumIsotope === 'H' ? 'bg-purple-500 text-black' : 'bg-white/10 text-white'}`}
            >
              1H (Proton)
            </button>
            <button
              onClick={() => setQuantumIsotope('D')}
              className={`px-2 py-0.5 rounded text-xs font-bold ${quantumIsotope === 'D' ? 'bg-purple-500 text-black' : 'bg-white/10 text-white'}`}
            >
              2H (Deuteron)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <label className="text-white/60">H-Bond Barrier Width (Å):</label>
            <input
              type="number"
              step="0.05"
              value={quantumWidth}
              onChange={(e) => setQuantumWidth(Number(e.target.value))}
              className="dark w-20 rounded border border-white/10 bg-black px-2 py-1 text-xs text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-white/60">Barrier Height (eV):</label>
            <input
              type="number"
              step="0.05"
              value={quantumHeight}
              onChange={(e) => setQuantumHeight(Number(e.target.value))}
              className="dark w-20 rounded border border-white/10 bg-black px-2 py-1 text-xs text-white"
            />
          </div>
        </div>

        <div className="rounded-lg bg-black/40 p-3 text-xs space-y-1 font-mono">
          <div>Transmission Probability: <b className="text-purple-300">{quantumTunnelingResult.transmissionProbability}</b></div>
          <div>Kinetic Isotope Effect (KIE = k_H/k_D): <b className="text-emerald-300">{quantumTunnelingResult.kineticIsotopeEffect}</b> (Classical upper bound is 1.41)</div>
          <div>Rate Acceleration Factor: {quantumTunnelingResult.enzymaticRateAccelerationFactor}x · Decoherence Time: {quantumTunnelingResult.decoherenceTimeFemtoseconds} fs</div>
          <div className="text-white/70">{quantumTunnelingResult.classicalArrheniusComparison}</div>
          <div className="text-[10px] text-white/40">Microscopic biophysics proxy · Does not support macroscopic quantum healing claims</div>
        </div>
      </div>

      {/* Section 5: Computational Simulators (Tracks A, B, D, E) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Simulator 1: NEO BCI Engine */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              Track A · NEO Epidural BCI Motor Decoder
            </h4>
            <span className="rounded bg-cyan-950 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
              NMPA Indication
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
                className="accent-rose-500"
              />
              <span className="text-[11px] text-rose-300">Arrhythmia</span>
            </label>
          </div>
          <div className="rounded-lg bg-black/40 p-2.5 text-xs space-y-1 font-mono">
            <div>Δ6MWD: <b className="text-emerald-300">+{reviveSimResult.delta6MwdMeters} m</b> (Contrast: +{reviveSimResult.treatmentContrastEstimatedMeters ?? 0} m)</div>
            <div>Safety: {reviveSimResult.arrhythmiaSafetyStatus}</div>
            <div>Phase: {reviveSimResult.trialPhase}</div>
            <div className="text-[10px] text-white/40">Investigational Phase III model · Not approved for general clinical therapy</div>
          </div>
        </div>

        {/* Simulator 3: ACSL4 Ferro-Aging Kinetics with 2026 Erratum */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300">
              Track D · ACSL4 Ferro-Aging Engine
            </h4>
            <span className="rounded bg-rose-950 px-2 py-0.5 text-[10px] font-bold text-rose-300">
              Erratum-Corrected (2026)
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

      {/* Section 6: Dual-Use Biosecurity & Neuroethical Governance Monitor (T-CLIN-75) */}
      <div className="rounded-xl border border-rose-500/30 bg-rose-950/10 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-500/20 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 uppercase">
                Governance Kernel · T-CLIN-75
              </span>
              <span className="text-[10px] text-white/50">Fail-Closed Invariants</span>
            </div>
            <h3 className="text-sm font-bold text-white mt-1">
              Dual-Use Biosecurity & Neuroethical Governance Monitor
            </h3>
            <p className="text-xs text-white/70">
              Guarantees translational therapeutic harnessing while permanently blocking coercive neuro-control and biological weaponization.
            </p>
          </div>
          <div>
            <span className={`rounded px-2.5 py-1 text-xs font-bold ${
              durcScreeningReport.isPermitted ? 'bg-emerald-900 text-emerald-200' : 'bg-rose-900 text-rose-200'
            }`}>
              {durcScreeningReport.governanceDecision}
            </span>
          </div>
        </div>

        {/* Interactive Negative Control Probe */}
        <div className="flex flex-wrap items-center gap-4 text-xs bg-black/40 p-3 rounded-lg">
          <span className="font-bold text-white/70">Test Negative Control Probes:</span>
          <label className="flex items-center gap-1.5 cursor-pointer text-white/80">
            <input
              type="checkbox"
              checked={durcTestDirectNeuralControl}
              onChange={(e) => setDurcTestDirectNeuralControl(e.target.checked)}
              className="accent-rose-500"
            />
            <span>Simulate Coercive Neural Stimulation</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-white/80">
            <input
              type="checkbox"
              checked={durcTestPathogenToxin}
              onChange={(e) => setDurcTestPathogenToxin(e.target.checked)}
              className="accent-rose-500"
            />
            <span>Simulate Pathogen/Toxin Synthesis</span>
          </label>
        </div>

        <div className="rounded-lg bg-black/50 p-3 text-xs space-y-1 font-mono">
          <div className="font-bold text-rose-300">Screening Status: {durcScreeningReport.reasons.join(' | ')}</div>
          <div className="text-[11px] text-white/80">{durcScreeningReport.realityCheckSummary}</div>
          <div className="text-[10px] text-white/40">China BCI Ethics 2024 & UNESCO Bioethics Aligned · Read-Only Assistive Interfaces Only</div>
        </div>
      </div>

      {/* Epistemic Footer */}
      <div className="border-t border-white/10 pt-3 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/50">
        <div>
          PANACEAMED ∞ INVICTUS OMEGA · T-CLIN-65..75 · Grounded in Chinese, Eurasian & International Research Precedents
        </div>
        <div className="font-mono text-cyan-400">
          truthClass: frontier_biomedical_research_proxy · patientTruthUncompromised
        </div>
      </div>
    </div>
  )
}
