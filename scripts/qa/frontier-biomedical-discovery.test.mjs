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

function read(relPath) {
  return readFileSync(relPath, 'utf8')
}

test('Frontier Biomedical Discovery Registry: validates T-CLIN-65..71 identifiers & schema integrity', () => {
  const ids = getAllAllocatedFrontierTClinIds()
  assert.equal(ids.length, 7)
  assert.deepEqual(ids, [
    'T-CLIN-65',
    'T-CLIN-66',
    'T-CLIN-67',
    'T-CLIN-68',
    'T-CLIN-69',
    'T-CLIN-70',
    'T-CLIN-71',
  ])

  // Verify unique T-CLIN identifiers (zero collisions)
  const uniqueIds = new Set(ids)
  assert.equal(uniqueIds.size, 7)

  // Verify all studies have truth class and clinical boundary invariants
  for (const study of FRONTIER_RESEARCH_REGISTRY) {
    assert.equal(study.truthClass, 'frontier_biomedical_research_proxy')
    assert.equal(study.clinically_reviewed, false)
    assert.equal(study.patientTruthUncompromised, true)
    assert.equal(study.neverManufacturesBiomarkers, true)
    assert.equal(study.epistemicHumilityPreserved, true)
    assert.equal(study.clinicalUseEligibility, false)
    assert.ok(study.scientificQuestion.length > 20)
    assert.ok(study.falsifiableHypothesis.length > 20)
    assert.ok(study.endpointDefinitions.length >= 3)
    assert.ok(study.knownLimitations.length >= 2)
    assert.ok(study.safetyBoundaries.length >= 2)
  }
})

test('Track A (T-CLIN-65): NEO Epidural BCI signal decoding & non-actuation boundaries', () => {
  const study = getFrontierStudyByTClinId('T-CLIN-65')
  assert.ok(study)
  assert.equal(study.trackId, 'track_a_neurotechnology_bci')
  assert.equal(study.primaryDoi, '10.1038/s41587-026-03101-8')
  assert.equal(study.claimLedgerStage, 'REGULATORILY_AUTHORIZED') // approved for defined hand-motor cervical SCI indication
  assert.equal(study.evidenceStage, 'G5_clinical_deployment')

  // Positive control: high SNR hand grasp intention
  const graspSim = simulateBciSignalDecoding({
    samplingRateHz: 1000,
    durationSec: 1.0,
    rawElectrodeChannels: 8,
    snrDb: 14.5,
    intendedMotorDirection: 'hand_grasp',
  })
  assert.equal(graspSim.signalQualityPass, true)
  assert.equal(graspSim.decodedIntention, 'hand_grasp')
  assert.ok(graspSim.confidenceScore >= 0.70)
  assert.ok(graspSim.uncertaintyEstimate <= 0.30)
  assert.deepEqual(graspSim.simulatedAssistiveActuatorVector, [0.85, 0.0, 0.0])
  assert.equal(graspSim.hardNonActuationInvariant, true)
  assert.equal(graspSim.neuralPrivacyProtected, true)
  assert.equal(graspSim.truthClass, 'bci_constrained_decoding_simulation_proxy')

  // Negative control: degraded SNR signal fail-closed
  const lowSnrSim = simulateBciSignalDecoding({
    samplingRateHz: 1000,
    durationSec: 1.0,
    rawElectrodeChannels: 2, // below min 4 channels
    snrDb: 3.2, // below min 6.0 dB
    intendedMotorDirection: 'hand_grasp',
  })
  assert.equal(lowSnrSim.signalQualityPass, false)
  assert.equal(lowSnrSim.decodedIntention, 'signal_degraded_low_snr')
  assert.equal(lowSnrSim.confidenceScore, 0.20)
  assert.deepEqual(lowSnrSim.simulatedAssistiveActuatorVector, [0.0, 0.0, 0.0])
})

test('Track B (T-CLIN-66): REVIVE-HEART HiCM-188 Phase III outcomes & arrhythmogenic surveillance', () => {
  const study = getFrontierStudyByTClinId('T-CLIN-66')
  assert.ok(study)
  assert.equal(study.clinicalTrialId, 'NCT07496372')
  assert.equal(study.claimLedgerStage, 'HUMAN_FEASIBILITY')
  assert.equal(study.evidenceStage, 'G4_preclinical_human_research')

  // Positive exercise improvement with clean telemetry
  const outcomes = calculateReviveHeartOutcomes({
    baseline6MwdMeters: 310,
    month126MwdMeters: 385,
    group: 'intervention_cabg_plus_hicm188',
    lvefPercentBaseline: 26.5,
    lvefPercent12Month: 34.0,
    reportedAdverseEventsCount: 0,
    hasVentricularArrhythmia: false,
  })
  assert.equal(outcomes.delta6MwdMeters, 75)
  assert.equal(outcomes.deltaLvefPercent, 7.5)
  assert.equal(outcomes.treatmentContrastEstimatedMeters, 53) // 75 - 22.5 benchmark
  assert.equal(outcomes.arrhythmiaSafetyStatus, 'clean_non_arrhythmogenic')
  assert.equal(outcomes.tumorigenicitySafetyPass, true)
  assert.equal(outcomes.trialPhase, 'Phase_III_investigational')
  assert.equal(outcomes.regulatoryApprovalClaim, false)
  assert.equal(outcomes.truthClass, 'cardiac_regeneration_trial_simulation_proxy')

  // Safety trigger: ventricular tachycardia detected
  const arrhythmicOutcomes = calculateReviveHeartOutcomes({
    baseline6MwdMeters: 310,
    month126MwdMeters: 330,
    group: 'intervention_cabg_plus_hicm188',
    lvefPercentBaseline: 26.5,
    lvefPercent12Month: 28.0,
    reportedAdverseEventsCount: 1,
    hasVentricularArrhythmia: true,
  })
  assert.equal(arrhythmicOutcomes.arrhythmiaSafetyStatus, 'safety_signal_detected')
})

test('Track C (T-CLIN-67): Lei et al. 2025 FOXO3-engineered hMPCs in aged macaques', () => {
  const study = getFrontierStudyByTClinId('T-CLIN-67')
  assert.ok(study)
  assert.equal(study.primaryDoi, '10.1016/j.cell.2025.05.021')
  assert.equal(study.pmid, '40516525')
  assert.equal(study.speciesOrPopulation, 'Aged Cynomolgus Macaques (Macaca fascicularis, ~18-22 years old, equivalent to human 60-70 years)')
  assert.equal(study.claimLedgerStage, 'PRECLINICAL')
  assert.equal(study.evidenceStage, 'G4_preclinical_human_research')
  assert.ok(study.safetyBoundaries.some((b) => b.includes('Must never translate reported epigenetic clock reductions in monkeys into claims of added human lifespan years')))
})

test('Track D (T-CLIN-68): ACSL4 Ferro-Aging model with mandatory 2026 published erratum accounting', () => {
  const study = getFrontierStudyByTClinId('T-CLIN-68')
  assert.ok(study)
  assert.equal(study.primaryDoi, '10.1016/j.cmet.2026.02.010')
  assert.equal(study.hasErratum, true)
  assert.ok(study.errata && study.errata.length > 0)
  assert.equal(study.errata[0].doi, '10.1016/j.cmet.2026.08.011')
  assert.equal(study.errata[0].verified, true)

  // Test kinetics engine with August 2026 erratum parameter set
  const kinetics = calculateFerroAgingKinetics({
    labileIronPoolMicromolar: 9.4, // erratum baseline
    acsl4ExpressionRelative: 1.5,
    polyunsaturatedFattyAcidSubstratePePercent: 30.0,
    redoxAntioxidantReservePercent: 60.0,
    vitaminCPlasmaConcentrationMicromolar: 60.0,
  })

  assert.equal(kinetics.erratumCorrectionApplied, true)
  assert.equal(kinetics.erratumDoi, '10.1016/j.cmet.2026.08.011')
  assert.equal(kinetics.correctedPUFASubstrateSpecificity, 'PE-18:0/20:4 (PE-AA) and PE-18:0/22:4 (PE-AdA)')
  assert.equal(kinetics.speciesTranslationalBoundary, 'non_human_primate_preclinical_only')
  assert.equal(kinetics.humanDosingExtrapolationPermitted, false)
  assert.ok(kinetics.lipidPeroxidationRateNominal > 0.1 && kinetics.lipidPeroxidationRateNominal < 1.0)
  assert.ok(kinetics.mitochondrialCristaePreservationScore >= 50)
  assert.equal(kinetics.truthClass, 'ferro_aging_kinetics_simulation_proxy')
})

test('Track E (T-CLIN-69): Biological Aging Clocks & NCT06794255 trial validation', () => {
  const study = getFrontierStudyByTClinId('T-CLIN-69')
  assert.ok(study)
  assert.equal(study.clinicalTrialId, 'NCT06794255')
  assert.equal(study.claimLedgerStage, 'HUMAN_FEASIBILITY')

  // Biological age gap calculation
  const clockRes = calculateBiologicalAgingClock({
    chronologicalAgeYears: 60,
    clockModel: 'GrimAge_2019',
    cpgMethylationBetaValuesCount: 1030,
    cellTypeCompositionNormalized: true,
    estimatedBiologicalAgeYears: 55.2,
    dunedinPaceYearsPerYear: 0.86,
  })

  assert.equal(clockRes.chronologicalAgeYears, 60)
  assert.equal(clockRes.estimatedBiologicalAgeYears, 55.2)
  assert.equal(clockRes.biologicalAgeGapYears, -4.8) // 55.2 - 60 = -4.8 yrs
  assert.equal(clockRes.clockVersion, 'GrimAge_v2_2022')
  assert.equal(clockRes.measurementUncertaintyYears, 1.8)
  assert.equal(clockRes.dunedinPaceRate, 0.86)
  assert.equal(clockRes.registryNctId, 'NCT06794255')
  assert.equal(clockRes.modelOutputNotLifespanProof, true)
  assert.equal(clockRes.truthClass, 'biological_aging_clock_validation_proxy')
})

test('Track F & G (T-CLIN-70 & 71): CIMA 2026 & hECA v2.0 multiscale cell atlas adapter & data access policies', () => {
  // 1. Data access policy checks
  const cimaAccess = verifyDatasetAccessRule('CIMA_2026')
  assert.equal(cimaAccess.requiresDacApproval, true)
  assert.ok(cimaAccess.restrictedUses.some((r) => r.includes('FASTQ or BAM')))

  const hecaAccess = verifyDatasetAccessRule('hECA_v2')
  assert.equal(hecaAccess.requiresDacApproval, false)
  assert.ok(hecaAccess.permittedUses.some((p) => p.includes('CC BY 4.0')))

  // 2. Atlas coverage numbers
  assert.equal(TOTAL_HECA_V2_CELL_COUNT, 10830000)
  assert.equal(TOTAL_HECA_V2_ORGANS_COUNT, 42)
  assert.equal(TOTAL_CIMA_2026_CELL_COUNT, 10000000)

  // 3. Organ search
  const heartQuery = queryCellAtlasByOrgan('Heart')
  assert.ok(heartQuery.matchedNodes.length > 0)
  assert.equal(heartQuery.matchedNodes[0].cellOntologyId, 'CL:0000746')
  assert.equal(heartQuery.clusterSimilarityIsNotLineageDescent, true)
  assert.equal(heartQuery.readOnlyReferenceKnowledge, true)

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

test('Discovery Workbench UI integration: wires FrontierBiomedicalResearchPanel', () => {
  const workbenchSource = read('src/components/frontier/DiscoveryWorkbench.tsx')
  assert.ok(
    workbenchSource.includes('FrontierBiomedicalResearchPanel'),
    'DiscoveryWorkbench must import and render FrontierBiomedicalResearchPanel'
  )
  assert.ok(
    workbenchSource.includes('T-CLIN-65..71'),
    'DiscoveryWorkbench must reference T-CLIN-65..71 frontier research engine'
  )

  const panelSource = read('src/components/frontier/FrontierBiomedicalResearchPanel.tsx')
  assert.ok(
    panelSource.includes('data-frontier-research-panel="v1"'),
    'FrontierBiomedicalResearchPanel must have data-frontier-research-panel attribute'
  )
  assert.ok(
    panelSource.includes('truthClass: frontier_biomedical_research_proxy'),
    'FrontierBiomedicalResearchPanel must display simulation proxy truth class watermark'
  )
})
