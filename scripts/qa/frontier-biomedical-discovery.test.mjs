import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  FRONTIER_RESEARCH_REGISTRY,
  getFrontierStudyByTClinId,
  getFrontierStudiesByTrack,
  getAllAllocatedFrontierTClinIds,
} from '../../src/lib/discovery/frontierResearchRegistry.ts'
import {
  CANONICAL_ATLAS_REFERENCE_NODES,
  getHierarchicalAtlasLineage,
  queryCellAtlasByOrgan,
  queryCellAtlasByMarker,
  verifyDatasetAccessRule,
  TOTAL_HECA_V2_CELL_COUNT,
  TOTAL_HECA_V2_ORGANS_COUNT,
  TOTAL_CIMA_2026_CELL_COUNT,
} from '../../src/lib/discovery/humanEnsembleCellAtlasAdapter.ts'
import {
  simulateBciSignalDecoding,
  calculateReviveHeartOutcomes,
  calculateFerroAgingKinetics,
  calculateBiologicalAgingClock,
} from '../../src/lib/discovery/frontierComputationalEngines.ts'
import {
  calculateQuantumProtonTunneling,
  calculateRadicalPairSpinDynamics,
} from '../../src/lib/discovery/quantumBiologyBiophysicsEngine.ts'
import {
  EURASIAN_CELL_ATLAS_CATALOG,
  buildEurasianLineageGraph,
} from '../../src/lib/discovery/eurasianCellAtlasFederation.ts'
import {
  GAME_MISSIONS,
  evaluateGameSimulationStep,
} from '../../src/lib/discovery/immersiveLifeScienceSandboxEngine.ts'
import {
  NEUROETHICAL_CANONICAL_PRINCIPLES,
  screenDualUseAndNeuroethics,
} from '../../src/lib/discovery/dualUseNeuroethicsKernel.ts'

function read(relPath) {
  return readFileSync(relPath, 'utf8')
}

test('Frontier Biomedical Discovery Registry: validates T-CLIN-65..75 identifiers & schema integrity', () => {
  const ids = getAllAllocatedFrontierTClinIds()
  assert.equal(ids.length, 11)
  assert.deepEqual(ids, [
    'T-CLIN-65',
    'T-CLIN-66',
    'T-CLIN-67',
    'T-CLIN-68',
    'T-CLIN-69',
    'T-CLIN-70',
    'T-CLIN-71',
    'T-CLIN-72',
    'T-CLIN-73',
    'T-CLIN-74',
    'T-CLIN-75',
  ])

  // Verify unique T-CLIN identifiers (zero collisions)
  const uniqueIds = new Set(ids)
  assert.equal(uniqueIds.size, 11)

  // Verify all studies have truth class and clinical boundary invariants
  for (const study of FRONTIER_RESEARCH_REGISTRY) {
    assert.equal(study.truthClass, 'frontier_biomedical_research_proxy')
    assert.equal(study.clinically_reviewed, false)
    assert.equal(study.patientTruthUncompromised, true)
    assert.equal(study.neverManufacturesBiomarkers, true)
    assert.equal(study.epistemicHumilityPreserved, true)
    if (study.tClinId !== 'T-CLIN-75') {
      assert.equal(study.clinicalUseEligibility, false)
    }
    assert.ok(study.scientificQuestion.length > 20)
    assert.ok(study.falsifiableHypothesis.length > 20)
    assert.ok(study.endpointDefinitions.length >= 3)
    assert.ok(study.knownLimitations.length >= 2)
    assert.ok(study.safetyBoundaries.length >= 2)
  }

  // Verify lookup helpers
  const t65 = getFrontierStudyByTClinId('T-CLIN-65')
  assert.ok(t65)
  assert.equal(t65.conceptId, 'FRONTIER-BCI-NEO-2026')

  const t72 = getFrontierStudyByTClinId('T-CLIN-72')
  assert.ok(t72)
  assert.equal(t72.trackId, 'track_h_quantum_biology_biophysics')

  const trackAStudies = getFrontierStudiesByTrack('track_a_neurotechnology_bci')
  assert.equal(trackAStudies.length, 1)
  assert.equal(trackAStudies[0].tClinId, 'T-CLIN-65')
})

test('Track A (T-CLIN-65): NEO Epidural BCI signal decoding & non-actuation boundaries', () => {
  // 1. High SNR intentional motor decoding
  const graspResult = simulateBciSignalDecoding({
    samplingRateHz: 1000,
    durationSec: 1.0,
    rawElectrodeChannels: 8,
    snrDb: 15.0,
    intendedMotorDirection: 'hand_grasp',
  })
  assert.equal(graspResult.decodedIntention, 'hand_grasp')
  assert.ok(graspResult.confidenceScore >= 0.70)
  assert.ok(graspResult.uncertaintyEstimate <= 0.30)
  assert.deepEqual(graspResult.simulatedAssistiveActuatorVector, [0.85, 0.0, 0.0])
  assert.equal(graspResult.hardNonActuationInvariant, true)
  assert.equal(graspResult.neuralPrivacyProtected, true)
  assert.equal(graspResult.truthClass, 'bci_constrained_decoding_simulation_proxy')
  assert.equal(graspResult.clinically_reviewed, false)

  // 2. Low SNR fail-closed handling
  const lowSnrResult = simulateBciSignalDecoding({
    samplingRateHz: 1000,
    durationSec: 1.0,
    rawElectrodeChannels: 2, // Below min 4 channels
    snrDb: 3.5, // Below 6.0 dB cutoff
    intendedMotorDirection: 'hand_grasp',
  })
  assert.equal(lowSnrResult.decodedIntention, 'signal_degraded_low_snr')
  assert.ok(lowSnrResult.uncertaintyEstimate >= 0.50)
  assert.deepEqual(lowSnrResult.simulatedAssistiveActuatorVector, [0.0, 0.0, 0.0])
})

test('Track B (T-CLIN-66): REVIVE-HEART HiCM-188 Phase III outcomes & arrhythmogenic surveillance', () => {
  const result = calculateReviveHeartOutcomes({
    baseline6MwdMeters: 310.0,
    month126MwdMeters: 385.0,
    group: 'intervention_cabg_plus_hicm188',
    lvefPercentBaseline: 29.0,
    lvefPercent12Month: 36.5,
    reportedAdverseEventsCount: 0,
    hasVentricularArrhythmia: false,
  })

  assert.equal(result.delta6MwdMeters, 75)
  assert.ok(result.treatmentContrastEstimatedMeters >= 40)
  assert.equal(result.arrhythmiaSafetyStatus, 'clean_non_arrhythmogenic')
  assert.equal(result.trialPhase, 'Phase_III_investigational')
  assert.equal(result.regulatoryApprovalClaim, false)
  assert.equal(result.truthClass, 'cardiac_regeneration_trial_simulation_proxy')
  assert.equal(result.clinically_reviewed, false)

  // Ventricular arrhythmia surveillance positive detection
  const arrhythmiaResult = calculateReviveHeartOutcomes({
    baseline6MwdMeters: 310.0,
    month126MwdMeters: 330.0,
    group: 'intervention_cabg_plus_hicm188',
    lvefPercentBaseline: 29.0,
    lvefPercent12Month: 30.0,
    reportedAdverseEventsCount: 1,
    hasVentricularArrhythmia: true,
  })
  assert.equal(arrhythmiaResult.arrhythmiaSafetyStatus, 'safety_signal_detected')
})

test('Track C (T-CLIN-67): Lei et al. 2025 FOXO3-engineered hMPCs in aged macaques', () => {
  const study = getFrontierStudyByTClinId('T-CLIN-67')
  assert.ok(study)
  assert.ok(study.primaryPrecedent.includes('Cell 2025'))
  assert.equal(study.pmid, '40516525')
  assert.equal(study.evidenceStage, 'G4_preclinical_human_research')
  assert.equal(study.knownLimitations.some((lim) => lim.includes('macaques')), true)
  assert.equal(study.safetyBoundaries.some((bnd) => bnd.includes('epigenetic clock reductions in monkeys')), true)
})

test('Track D (T-CLIN-68): ACSL4 Ferro-Aging model with mandatory 2026 published erratum accounting', () => {
  const study = getFrontierStudyByTClinId('T-CLIN-68')
  assert.ok(study)
  assert.equal(study.hasErratum, true)
  assert.ok(study.errata && study.errata.length > 0)
  assert.equal(study.errata[0].doi, '10.1016/j.cmet.2026.08.011')
  assert.equal(study.errata[0].verified, true)
  assert.ok(study.errata[0].parameterImpact.includes('k_ACSL4'))

  // Model calculation verifies corrected rate kinetics
  const kinetics = calculateFerroAgingKinetics({
    labileIronPoolMicromolar: 8.5,
    acsl4ExpressionRelative: 1.8,
    polyunsaturatedFattyAcidSubstratePePercent: 32.0,
    redoxAntioxidantReservePercent: 65.0,
    vitaminCPlasmaConcentrationMicromolar: 60.0,
  })

  assert.equal(kinetics.erratumCorrectionApplied, true)
  assert.equal(kinetics.erratumDoi, '10.1016/j.cmet.2026.08.011')
  assert.equal(kinetics.correctedPUFASubstrateSpecificity, 'PE-18:0/20:4 (PE-AA) and PE-18:0/22:4 (PE-AdA)')
  assert.equal(kinetics.speciesTranslationalBoundary, 'non_human_primate_preclinical_only')
  assert.equal(kinetics.humanDosingExtrapolationPermitted, false)
  assert.equal(kinetics.truthClass, 'ferro_aging_kinetics_simulation_proxy')
})

test('Track E (T-CLIN-69): Biological Aging Clocks & NCT06794255 trial validation', () => {
  const clock = calculateBiologicalAgingClock({
    chronologicalAgeYears: 60.0,
    clockModel: 'GrimAge_2019',
    cpgMethylationBetaValuesCount: 1030,
    cellTypeCompositionNormalized: true,
    estimatedBiologicalAgeYears: 55.4,
    dunedinPaceYearsPerYear: 0.86,
  })

  assert.equal(clock.chronologicalAgeYears, 60.0)
  assert.equal(clock.estimatedBiologicalAgeYears, 55.4)
  assert.equal(clock.biologicalAgeGapYears, -4.6)
  assert.equal(clock.clockModel, 'GrimAge_2019')
  assert.equal(clock.clockVersion, 'GrimAge_v2_2022')
  assert.equal(clock.registryNctId, 'NCT06794255')
  assert.equal(clock.modelOutputNotLifespanProof, true)
  assert.equal(clock.truthClass, 'biological_aging_clock_validation_proxy')
  assert.equal(clock.clinically_reviewed, false)
})

test('Track F & G (T-CLIN-70 & 71): CIMA 2026 & hECA v2.0 multiscale cell atlas adapter & data access policies', () => {
  // 1. Total counts
  assert.equal(TOTAL_HECA_V2_CELL_COUNT, 10830000)
  assert.equal(TOTAL_HECA_V2_ORGANS_COUNT, 42)
  assert.equal(TOTAL_CIMA_2026_CELL_COUNT, 10000000)

  // 2. Data access rules
  const hecaAccess = verifyDatasetAccessRule('hECA_v2')
  assert.equal(hecaAccess.requiresDacApproval, false)

  const cimaAccess = verifyDatasetAccessRule('CIMA_2026')
  assert.equal(cimaAccess.requiresDacApproval, true)

  // 3. Organ search
  const heartQuery = queryCellAtlasByOrgan('Heart')
  assert.ok(heartQuery.matchedNodes.length > 0)
  assert.equal(heartQuery.matchedNodes[0].cellOntologyId, 'CL:0000746')
  assert.equal(heartQuery.clusterSimilarityIsNotLineageDescent, true)

  // 4. Marker search
  const acsl4Query = queryCellAtlasByMarker('ACSL4')
  assert.ok(acsl4Query.matchedNodes.length > 0)
  assert.equal(acsl4Query.matchedNodes[0].organName, 'Liver')

  // 5. Hierarchical scale lineage
  const lineage = getHierarchicalAtlasLineage('Heart', 'Cardiomyocyte')
  assert.equal(lineage[0].scale, 'body')
  assert.equal(lineage[1].scale, 'system')
  assert.equal(lineage[2].scale, 'organ')
  assert.equal(lineage[3].scale, 'tissue')
  assert.equal(lineage[4].scale, 'cell_type')
  assert.equal(lineage[5].scale, 'pathway')
  assert.equal(lineage[6].scale, 'genome')
  assert.equal(lineage[4].identifier, 'CL:0000746')
})

test('Track H (T-CLIN-72): Quantum Proton Tunneling & Cryptochrome Spin Dynamics Engine', () => {
  // 1. Quantum proton tunneling in enzyme active site
  const protonResult = calculateQuantumProtonTunneling({
    barrierWidthAngstroms: 0.55,
    barrierHeightElectronVolts: 0.42,
    temperatureKelvin: 310.15,
    isotope: 'H',
    activeSite: 'mitochondrial_complex_I',
  })

  assert.ok(protonResult.transmissionProbability > 0)
  assert.ok(protonResult.kineticIsotopeEffect >= 2.0, 'KIE must exceed classical limit')
  assert.ok(protonResult.enzymaticRateAccelerationFactor > 1.0)
  assert.equal(protonResult.truthClass, 'quantum_biophysics_proxy')
  assert.equal(protonResult.clinically_reviewed, false)
  assert.equal(protonResult.patientTruthUncompromised, true)

  // 2. Deuterium substitution lowers transmission
  const deuteronResult = calculateQuantumProtonTunneling({
    barrierWidthAngstroms: 0.55,
    barrierHeightElectronVolts: 0.42,
    temperatureKelvin: 310.15,
    isotope: 'D',
    activeSite: 'mitochondrial_complex_I',
  })
  assert.ok(protonResult.transmissionProbability > deuteronResult.transmissionProbability)

  // 3. Radical pair spin dynamics
  const radicalResult = calculateRadicalPairSpinDynamics({
    geomagneticFieldMicroTesla: 50.0,
    hyperfineCouplingMegahertz: 2.5,
    radicalLifespanNanoseconds: 500.0,
  })
  assert.ok(radicalResult.singletYield > 0 && radicalResult.singletYield < 1)
  assert.equal(radicalResult.tripletYield, Number((1 - radicalResult.singletYield).toFixed(4)))
  assert.equal(radicalResult.nonEquilibriumThermalStateConfirmed, true)
})

test('Track I (T-CLIN-73): Eurasian & International Cell Atlas Lineage Federation', () => {
  assert.ok(EURASIAN_CELL_ATLAS_CATALOG.length >= 6)
  assert.ok(EURASIAN_CELL_ATLAS_CATALOG.some((r) => r.repositoryId === 'CellLine_RU'))
  assert.ok(EURASIAN_CELL_ATLAS_CATALOG.some((r) => r.repositoryId === 'CIMA_China'))
  assert.ok(EURASIAN_CELL_ATLAS_CATALOG.some((r) => r.repositoryId === 'hECA_China'))

  const lineage = buildEurasianLineageGraph()
  assert.equal(lineage.clusterSimilarityIsNotLineageDescentEnforced, true)
  assert.ok(lineage.nodes.length >= 6)

  // Empirical lineage barcode must be true for experimental lineage models and false for observational snapshots
  const hescNode = lineage.nodes.find((n) => n.id === 'CL:0002322')
  assert.ok(hescNode)
  assert.equal(hescNode.empiricalLineageTracingEvidence, true)

  const cimaNode = lineage.nodes.find((n) => n.id === 'CL:0000909')
  assert.ok(cimaNode)
  assert.equal(cimaNode.isHypotheticalClusterSimilarityOnly, true)
})

test('Track J (T-CLIN-74): Immersive Life-Science Simulation Lab & Gamified Sandbox', () => {
  assert.equal(GAME_MISSIONS.length, 4)

  // Test Cardiac Syncytium Mission
  const cardiacStep = evaluateGameSimulationStep('mission_cardiac_syncytium', {
    graftDoseMillions: 50,
    connexin43Coupling: 0.85,
    actionPotentialDuration: 310,
  }, 1)
  assert.equal(cardiacStep.missionId, 'mission_cardiac_syncytium')
  assert.ok(cardiacStep.score >= 70)
  assert.ok(cardiacStep.realityCheckReminder.includes('NCT07496372'))
  assert.equal(cardiacStep.truthClass, 'gamified_life_science_simulation_proxy')

  // Test BCI Closed-Loop Mission
  const bciStep = evaluateGameSimulationStep('mission_bci_closed_loop', {
    snrDb: 18,
    highGammaFilterWeight: 1.0,
    latencyThresholdMs: 30,
  }, 1)
  assert.equal(bciStep.targetAchieved, true)
  assert.ok(bciStep.realityCheckReminder.includes('NEO was approved by China NMPA'))

  // Test Senescence Reversal Mission
  const senescenceStep = evaluateGameSimulationStep('mission_senescence_reversal', {
    foxo3ExpressionLevel: 65,
    acsl4InhibitionFraction: 0.60,
    antioxidantDose: 80,
  }, 1)
  assert.ok(senescenceStep.score > 0)
  assert.ok(senescenceStep.realityCheckReminder.includes('Cell 2025'))

  // Test Quantum Tunneling Mission
  const quantumStep = evaluateGameSimulationStep('mission_quantum_tunneling', {
    barrierWidthAngstroms: 0.45,
    barrierHeightEv: 0.35,
    tempKelvin: 310,
  }, 1)
  assert.ok(quantumStep.stabilityIndex > 0)
  assert.ok(quantumStep.realityCheckReminder.includes('Quantum proton tunneling'))
})

test('Track K (T-CLIN-75): Dual-Use Biosecurity & Neuroethical Governance Kernel', () => {
  assert.equal(NEUROETHICAL_CANONICAL_PRINCIPLES.length, 4)

  // 1. Positive control: Therapeutic remedial neuroprosthetic request is permitted
  const approvedReport = screenDualUseAndNeuroethics({
    proposedResearchTitle: 'Non-Invasive Motor Intention Decoding for Cervical Injury',
    domain: 'neurotechnology',
    involvesDirectNeuralRead: true,
    involvesDirectNeuralStimulationOrControl: false,
    involvesAutonomousDeviceActuation: false,
    involvesPathogenEnhancementOrToxinEngineering: false,
    involvesNonConsensualIntervention: false,
  })
  assert.equal(approvedReport.isPermitted, true)
  assert.equal(approvedReport.governanceDecision, 'APPROVED_FOR_THERAPEUTIC_RESEARCH')
  assert.equal(approvedReport.neuroethicalCompliance.mentalPrivacyPreserved, true)
  assert.equal(approvedReport.neuroethicalCompliance.nonCoerciveNonActuatingConfirmed, true)

  // 2. Negative control: Coercive neural control / mind control is blocked immediately
  const coerciveReport = screenDualUseAndNeuroethics({
    proposedResearchTitle: 'Direct Cognitive Interpersonal Modulation System',
    domain: 'neurotechnology',
    involvesDirectNeuralRead: true,
    involvesDirectNeuralStimulationOrControl: true, // VIOLATION
    involvesAutonomousDeviceActuation: false,
    involvesPathogenEnhancementOrToxinEngineering: false,
    involvesNonConsensualIntervention: false,
  })
  assert.equal(coerciveReport.isPermitted, false)
  assert.equal(coerciveReport.governanceDecision, 'REJECTED_DUAL_USE_VIOLATION')
  assert.ok(coerciveReport.reasons.some((r) => r.includes('mind-control')))

  // 3. Negative control: Pathogen enhancement / weaponization is blocked immediately
  const pathogenReport = screenDualUseAndNeuroethics({
    proposedResearchTitle: 'Viral Transmission Optimization Assay',
    domain: 'synthetic_biology',
    involvesDirectNeuralRead: false,
    involvesDirectNeuralStimulationOrControl: false,
    involvesAutonomousDeviceActuation: false,
    involvesPathogenEnhancementOrToxinEngineering: true, // VIOLATION
    involvesNonConsensualIntervention: false,
  })
  assert.equal(pathogenReport.isPermitted, false)
  assert.equal(pathogenReport.governanceDecision, 'REJECTED_DUAL_USE_VIOLATION')
  assert.ok(pathogenReport.reasons.some((r) => r.includes('pathogen enhancement')))
})

test('Discovery Workbench UI integration: wires FrontierBiomedicalResearchPanel', () => {
  const workbenchSource = read('src/components/frontier/DiscoveryWorkbench.tsx')
  assert.ok(
    workbenchSource.includes('FrontierBiomedicalResearchPanel'),
    'DiscoveryWorkbench must import and render FrontierBiomedicalResearchPanel'
  )
  assert.ok(
    workbenchSource.includes('T-CLIN-65..75'),
    'DiscoveryWorkbench must reference T-CLIN-65..75 frontier research engine'
  )

  const panelSource = read('src/components/frontier/FrontierBiomedicalResearchPanel.tsx')
  assert.ok(
    panelSource.includes('data-frontier-research-panel="v2"'),
    'FrontierBiomedicalResearchPanel must have data-frontier-research-panel attribute'
  )
  assert.ok(
    panelSource.includes('truthClass: frontier_biomedical_research_proxy'),
    'FrontierBiomedicalResearchPanel must display simulation proxy truth class watermark'
  )
})
