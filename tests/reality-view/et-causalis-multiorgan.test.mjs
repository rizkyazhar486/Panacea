import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { TWENTY_FIVE_COUPLED_PHYSIOLOGICAL_SCENARIOS } from '../../src/domains/body-exposure/engine/physiology/multiscaleCoupledOrganPhysiologyAndMathSolverEngine.ts'
import { MESH_TO_ONTOLOGY_MAP } from '../../src/engines/reality-view/anatomyOntologyRegistry.ts'
import {
  resolveCohortAssetBundle,
  resolveMultiscaleVerticalChain,
  resolveOrganConvergenceBundle,
} from '../../src/engines/reality-view/capabilityConvergenceGraph.ts'
import { DEMOGRAPHIC_COHORT_IDS } from '../../src/engines/reality-view/demographicManifold.ts'
import {
  evaluateEducationalPkPdSnapshot,
  MULTIORGAN_SCENARIO_SPECS,
  simulateMultiorganCausalTrajectory,
} from '../../src/engines/reality-view/etCausalisMultiorganEngine.ts'
import {
  ALL_20_CAUSAL_RELATIONS,
  computeReceptorOccupancy,
  simulateFirstOrderPharmacokinetics,
} from '../../src/engines/reality-view/multiscaleRealityGraph.ts'
import { FEATURE_MAP } from '../../src/lib/navigation/featureMap.ts'
import { SUPER_PAGES } from '../../src/lib/superPages.ts'
import { QUIET_MODE_MAX_BYTES } from '../../src/components/reality-view/performanceTierManager.ts'

const REPO_ROOT = process.cwd()

test('all 25 coupled physiological scenarios run deterministically within finite physiological bounds', () => {
  assert.equal(MULTIORGAN_SCENARIO_SPECS.length, 25)
  for (const id of TWENTY_FIVE_COUPLED_PHYSIOLOGICAL_SCENARIOS) {
    const res1 = simulateMultiorganCausalTrajectory({ scenarioId: id })
    const res2 = simulateMultiorganCausalTrajectory({ scenarioId: id })
    assert.deepEqual(res1, res2)
    assert.equal(res1.truthClass, 'SIMULATED_EDUCATIONAL')
    assert.equal(res1.clinicallyReviewed, false)
    assert.equal(Object.isFrozen(res1), true)
    assert.equal(res1.timeline.length, 7)

    for (const pt of res1.timeline) {
      for (const val of Object.values(pt)) {
        assert.equal(Number.isFinite(val), true, `non-finite metric in ${id} at t=${pt.minute}`)
      }
      assert.ok(pt.hrBpm >= 30 && pt.hrBpm <= 220)
      assert.ok(pt.arterialPh >= 6.8 && pt.arterialPh <= 7.8)
      assert.ok(pt.spo2Pct >= 30 && pt.spo2Pct <= 100)
    }
  }
})

test('acute hemorrhage drops MAP & RBF, recruits sympathetic/RAAS, and responds to 1000 mL fluid bolus', () => {
  const rest = simulateMultiorganCausalTrajectory({ scenarioId: '1_RESTING_HOMEOSTASIS' })
  const bleed = simulateMultiorganCausalTrajectory({ scenarioId: '6_ACUTE_HEMORRHAGE_CLASS_II' })
  const resuscitated = simulateMultiorganCausalTrajectory({
    scenarioId: '6_ACUTE_HEMORRHAGE_CLASS_II',
    interventions: { fluidBolusMl: 1000 },
  })

  assert.ok(bleed.finalState.mapMmHg < rest.finalState.mapMmHg)
  assert.ok(bleed.finalState.renalBloodFlowMlMin < rest.finalState.renalBloodFlowMlMin)
  assert.ok(bleed.finalState.sympatheticTone0to1 > rest.finalState.sympatheticTone0to1)
  assert.ok(bleed.finalState.raasActivation0to1 > rest.finalState.raasActivation0to1)
  assert.ok(resuscitated.finalState.coLMin > bleed.finalState.coLMin)
  assert.ok(resuscitated.finalState.mapMmHg > bleed.finalState.mapMmHg)
})

test('HFrEF reduces EF < 40% & CO and emits active cardiorenal causal edges', () => {
  const rest = simulateMultiorganCausalTrajectory({ scenarioId: '1_RESTING_HOMEOSTASIS' })
  const hfref = simulateMultiorganCausalTrajectory({ scenarioId: '10_SYSTOLIC_HEART_FAILURE_HFrEF' })

  assert.ok(hfref.finalState.efPct < 40, `expected EF < 40%, got ${hfref.finalState.efPct}`)
  assert.ok(hfref.finalState.coLMin < rest.finalState.coLMin)

  const coToRenal = hfref.causalEdges.find((e) => e.fromMeshId === 'Left ventricle' && e.toMeshId === 'Kidney.l')
  const renalToAorta = hfref.causalEdges.find((e) => e.fromMeshId === 'Kidney.l' && e.toMeshId === 'Ascending aorta')
  assert.ok(coToRenal && coToRenal.direction === 'decrease' && coToRenal.magnitudePct > 5)
  assert.ok(renalToAorta && renalToAorta.feedbackPolarity === 'negative_compensatory')
  for (const edge of hfref.causalEdges) {
    assert.equal(ALL_20_CAUSAL_RELATIONS.includes(edge.canonicalRelation), true, `invalid canonicalRelation ${edge.canonicalRelation}`)
  }
})

test('sepsis vasodilation lowers SVR & elevates lactate, and vasopressor partially restores SVR & MAP', () => {
  const rest = simulateMultiorganCausalTrajectory({ scenarioId: '1_RESTING_HOMEOSTASIS' })
  const sepsis = simulateMultiorganCausalTrajectory({ scenarioId: '13_SEPSIS_VASODILATION' })
  const norepi = simulateMultiorganCausalTrajectory({
    scenarioId: '13_SEPSIS_VASODILATION',
    interventions: { vasopressorGain: 0.8 },
  })

  assert.ok(sepsis.finalState.svrDynSecCm5 < rest.finalState.svrDynSecCm5)
  assert.ok(sepsis.finalState.lactateMmolL > rest.finalState.lactateMmolL)
  assert.ok(norepi.finalState.svrDynSecCm5 > sepsis.finalState.svrDynSecCm5)
  assert.ok(norepi.finalState.mapMmHg > sepsis.finalState.mapMmHg)
})

test('acid-base coupling & Bohr P50 shift respond accurately in alkalosis vs HAGMA acidosis', () => {
  const respAlk = simulateMultiorganCausalTrajectory({ scenarioId: '19_HYPERVENTILATION_RESPIRATORY_ALKALOSIS' })
  const hagma = simulateMultiorganCausalTrajectory({ scenarioId: '17_HIGH_ANION_GAP_METABOLIC_ACIDOSIS' })

  assert.ok(respAlk.finalState.arterialPh > 7.45, `expected pH > 7.45, got ${respAlk.finalState.arterialPh}`)
  assert.ok(hagma.finalState.arterialPh < 7.35, `expected pH < 7.35, got ${hagma.finalState.arterialPh}`)
  assert.ok(hagma.finalState.p50MmHg > 26.8, `expected Bohr rightward shift P50 > 26.8, got ${hagma.finalState.p50MmHg}`)
})

test('lifespan cohorts (MAT_PREG, NEO_TRM_M, GER_M) scale baseline hemodynamics & PK/PD remains bounded', () => {
  const yadF = simulateMultiorganCausalTrajectory({ scenarioId: '1_RESTING_HOMEOSTASIS', cohortId: 'YAD_F' })
  const matPreg = simulateMultiorganCausalTrajectory({ scenarioId: '1_RESTING_HOMEOSTASIS', cohortId: 'MAT_PREG', gestationalWeek: 28 })
  const yadM = simulateMultiorganCausalTrajectory({ scenarioId: '1_RESTING_HOMEOSTASIS', cohortId: 'YAD_M' })
  const neoM = simulateMultiorganCausalTrajectory({ scenarioId: '1_RESTING_HOMEOSTASIS', cohortId: 'NEO_TRM_M' })
  const gerM = simulateMultiorganCausalTrajectory({ scenarioId: '1_RESTING_HOMEOSTASIS', cohortId: 'GER_M' })

  assert.ok(matPreg.finalState.coLMin > yadF.finalState.coLMin)
  assert.ok(neoM.finalState.hrBpm > yadM.finalState.hrBpm)
  assert.ok(gerM.finalState.svrDynSecCm5 > yadM.finalState.svrDynSecCm5)

  const pkpd = evaluateEducationalPkPdSnapshot({
    doseMg: 40,
    volumeOfDistributionL: 32,
    clearanceLPerHour: 4.5,
    elapsedHours: 4,
    kdMgL: 0.45,
  })
  assert.equal(pkpd.truthClass, 'SIMULATED_EDUCATIONAL')
  assert.equal(pkpd.clinicallyReviewed, false)
  assert.ok(Number.isFinite(pkpd.plasmaConcentrationMgL) && pkpd.plasmaConcentrationMgL > 0)
  assert.ok(pkpd.halfLifeHours > 0)
  assert.ok(pkpd.receptorOccupancyPct >= 0 && pkpd.receptorOccupancyPct <= 100)

  const refPk = simulateFirstOrderPharmacokinetics({
    doseMg: 40,
    volumeDistributionL: 32,
    bioavailabilityF: 1,
    eliminationRateKPerHr: 4.5 / 32,
    durationHr: 4,
    stepHr: 4,
  })
  const refOcc = computeReceptorOccupancy({ ligandNm: pkpd.plasmaConcentrationMgL, kdNm: 0.45, hillCoeff: 1 })
  assert.ok(Math.abs(pkpd.halfLifeHours - refPk.halfLifeHr) <= 0.02)
  assert.ok(Math.abs(pkpd.receptorOccupancyPct - refOcc.occupancyPct) <= 0.2)
})

test('all 22 demographic cohorts resolve to real existing disk GLBs <= 1.8 MiB Quiet shell cap', () => {
  assert.equal(DEMOGRAPHIC_COHORT_IDS.length, 22)
  for (const cohortId of DEMOGRAPHIC_COHORT_IDS) {
    const bundle = resolveCohortAssetBundle(cohortId)
    const glbAbs = path.join(REPO_ROOT, bundle.primarySurfaceGlbPath)
    const idxAbs = path.join(REPO_ROOT, bundle.primaryIndexJsonPath)
    assert.equal(fs.existsSync(glbAbs), true, `Missing primary shell GLB on disk for ${cohortId}: ${bundle.primarySurfaceGlbPath}`)
    assert.equal(fs.existsSync(idxAbs), true, `Missing index JSON on disk for ${cohortId}: ${bundle.primaryIndexJsonPath}`)
    const stat = fs.statSync(glbAbs)
    assert.ok(stat.size <= QUIET_MODE_MAX_BYTES, `${bundle.primarySurfaceGlbPath} (${stat.size}) exceeds Quiet Mode 1.8 MiB cap`)

    for (const sec of bundle.secondaryGlbPaths) {
      const secAbs = path.join(REPO_ROOT, sec)
      assert.equal(fs.existsSync(secAbs), true, `Missing secondary reference GLB on disk for ${cohortId}: ${sec}`)
    }
  }

  const preg = resolveCohortAssetBundle('MAT_PREG')
  assert.equal(preg.spatialRegistration, 'conceptual_composite_not_co_registered')
  assert.ok(preg.secondaryGlbPaths.some((p) => p.includes('fetus.')))
})

test('all 33 canonical Z-Anatomy meshes resolve full 8-scale vertical chain & verified SuperPage links', () => {
  const validPaths = new Set([
    ...SUPER_PAGES.map((p) => p.to.split('?')[0]),
    ...Object.values(FEATURE_MAP).flat().map((n) => n.to.split('?')[0]),
  ])

  assert.ok(MESH_TO_ONTOLOGY_MAP.size >= 33)
  for (const meshId of MESH_TO_ONTOLOGY_MAP.keys()) {
    const chain = resolveMultiscaleVerticalChain(meshId)
    const bundle = resolveOrganConvergenceBundle(meshId)
    assert.ok(chain, `Missing multiscale chain for ${meshId}`)
    assert.ok(bundle, `Missing convergence bundle for ${meshId}`)
    assert.equal(chain.scale1_spatialRegistration, 'spatial_registered_glb')
    assert.equal(chain.scale2_tissue_ftu.spatialRegistration, 'conceptual_reference')
    assert.ok(chain.scale3_cell.length >= 2)
    assert.ok(chain.scale4_organelles.length >= 2)
    assert.ok(chain.scale5_drugs_targets.length >= 1)
    assert.ok(chain.scale6_genes.length >= 1)
    assert.ok(chain.scale8_superpage_links.length >= 3)
    for (const lnk of chain.scale8_superpage_links) {
      assert.equal(validPaths.has(lnk.to.split('?')[0]), true, `Unverified SuperPage route ${lnk.to} on ${meshId}`)
    }
  }

  const heartChain = resolveMultiscaleVerticalChain('Left ventricle')
  const lungChain = resolveMultiscaleVerticalChain('Inferior lobe of left lung')
  const kidneyChain = resolveMultiscaleVerticalChain('Kidney.l')
  assert.equal(heartChain?.realityGraphAnchorId, 'organ_heart')
  assert.equal(lungChain?.realityGraphAnchorId, 'organ_lung')
  assert.equal(kidneyChain?.realityGraphAnchorId, 'organ_kidney')
  assert.equal(heartChain?.realityGraphScaleBridge, 'CONCEPTUAL_SCALE_BRIDGE')
  assert.ok((heartChain?.realityGraphNodes.length ?? 0) >= 6 && (heartChain?.realityGraphEdges.length ?? 0) >= 5)

  assert.equal(resolveMultiscaleVerticalChain('NonExistentMesh'), null)
  assert.equal(resolveOrganConvergenceBundle('NonExistentMesh'), null)
})
