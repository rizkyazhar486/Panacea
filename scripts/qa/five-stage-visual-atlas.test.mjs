import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { BODY_SYSTEM_SOURCE_WAVE } from '../../src/lib/bodySystemSourceWave.ts'
import {
  ATLAS_LITERATURE_SOURCES,
  depth01ForStageId,
  evaluateFiveStagePhysiology,
  FIVE_STAGE_DEFAULTS,
  resolveStageFromScrollDepth,
  stageIdForSemanticScale,
  SYSTEM_FIVE_STAGE_PROFILES,
  VISUAL_ATLAS_STAGES,
} from '../../src/domains/body-exposure/engine/fiveStageVisualAtlas.ts'

test('positif: defines all 5 sequential visual atlas stages from Whole Body (1.7 m) to Subcellular/Molecular (2 nm)', () => {
  assert.deepEqual(
    VISUAL_ATLAS_STAGES.map((stage) => stage.id),
    [
      'macro-body',
      'organ-conduit',
      'tissue-microvasculature',
      'cellular-architecture',
      'subcellular-molecular',
    ],
  )
  assert.deepEqual(
    VISUAL_ATLAS_STAGES.map((stage) => stage.index),
    [1, 2, 3, 4, 5],
  )
  for (let i = 1; i < VISUAL_ATLAS_STAGES.length; i += 1) {
    assert.ok(
      VISUAL_ATLAS_STAGES[i].characteristicLengthM < VISUAL_ATLAS_STAGES[i - 1].characteristicLengthM,
      'characteristic physical length must strictly descend across the 5 stages',
    )
    assert.ok(
      VISUAL_ATLAS_STAGES[i].relativeZoomStop > VISUAL_ATLAS_STAGES[i - 1].relativeZoomStop,
      'semantic relative zoom stop must strictly ascend across the 5 stages',
    )
  }
})

test('positif: every one of the 11 canonical body systems owns a complete 5-stage profile and textbook/journal citations', () => {
  assert.ok(ATLAS_LITERATURE_SOURCES.length >= 7)
  for (const system of BODY_SYSTEM_SOURCE_WAVE) {
    const profile = SYSTEM_FIVE_STAGE_PROFILES[system.id]
    assert.ok(profile, `missing 5-stage profile for ${system.id}`)
    for (const stage of VISUAL_ATLAS_STAGES) {
      assert.ok(
        profile.stageNarratives[stage.id].length > 40,
        `${system.id} missing narrative for ${stage.id}`,
      )
      assert.ok(
        profile.stageLandmarks[stage.id].length >= 3,
        `${system.id} must provide at least 3 landmarks at ${stage.id}`,
      )
    }
    const evalResult = evaluateFiveStagePhysiology(system.id, FIVE_STAGE_DEFAULTS)
    assert.equal(evalResult.ok, true)
    if (evalResult.ok) {
      assert.ok(evalResult.metrics.stage1Macro.cardiacOutputLMin > 0)
      assert.ok(evalResult.metrics.stage3Tissue.kroghArterialPo2MmHg > evalResult.metrics.stage3Tissue.kroghVenousPo2MmHg)
      assert.ok(evalResult.metrics.stage5Molecular.protonMotiveForceMv > 100)
      assert.ok(evalResult.activeSources.length >= 1)
    }
  }
})

test('positif & batas: doom-scroll depth resolver maps [0..1] continuously across all 5 stages and semantic scales', () => {
  const s0 = resolveStageFromScrollDepth(0)
  const s1 = resolveStageFromScrollDepth(0.3)
  const s2 = resolveStageFromScrollDepth(0.5)
  const s3 = resolveStageFromScrollDepth(0.7)
  const s4 = resolveStageFromScrollDepth(0.95)
  const sEnd = resolveStageFromScrollDepth(1.0)

  assert.equal(s0.activeStageId, 'macro-body')
  assert.equal(s1.activeStageId, 'organ-conduit')
  assert.equal(s2.activeStageId, 'tissue-microvasculature')
  assert.equal(s3.activeStageId, 'cellular-architecture')
  assert.equal(s4.activeStageId, 'subcellular-molecular')
  assert.equal(sEnd.activeStageId, 'subcellular-molecular')
  assert.equal(stageIdForSemanticScale('whole-body'), 'macro-body')
  assert.equal(stageIdForSemanticScale('organ'), 'organ-conduit')
  assert.equal(stageIdForSemanticScale('tissue'), 'tissue-microvasculature')
  assert.equal(stageIdForSemanticScale('cell'), 'cellular-architecture')
  assert.equal(stageIdForSemanticScale('genome'), 'subcellular-molecular')
  assert.equal(depth01ForStageId('tissue-microvasculature'), 0.5)
})

test('positif: metabolic drive and oxygen fraction dynamically couple macro perfusion, Krogh PO2, and mitochondrial ATP turnover', () => {
  const rest = evaluateFiveStagePhysiology('musculoskeletal', {
    depth01: 0.5,
    metabolicDriveFold: 1.0,
    oxygenFraction: 0.21,
  })
  const exercise = evaluateFiveStagePhysiology('musculoskeletal', {
    depth01: 0.5,
    metabolicDriveFold: 2.5,
    oxygenFraction: 0.21,
  })
  const hypoxia = evaluateFiveStagePhysiology('musculoskeletal', {
    depth01: 0.5,
    metabolicDriveFold: 1.0,
    oxygenFraction: 0.13,
  })
  assert.equal(rest.ok && exercise.ok && hypoxia.ok, true)
  if (rest.ok && exercise.ok && hypoxia.ok) {
    assert.ok(
      exercise.metrics.stage1Macro.systemPerfusionMlMin > rest.metrics.stage1Macro.systemPerfusionMlMin,
      'exercise metabolic drive must increase musculoskeletal perfusion',
    )
    assert.ok(
      exercise.metrics.stage3Tissue.effectiveDiffusionRadiusUm < rest.metrics.stage3Tissue.effectiveDiffusionRadiusUm,
      'capillary recruitment during exercise must shorten Krogh diffusion radius',
    )
    assert.ok(
      exercise.metrics.stage5Molecular.atpTurnoverMmolKgMin > rest.metrics.stage5Molecular.atpTurnoverMmolKgMin,
      'exercise metabolic drive must elevate mitochondrial ATP turnover',
    )
    assert.ok(
      hypoxia.metrics.stage3Tissue.kroghArterialPo2MmHg < rest.metrics.stage3Tissue.kroghArterialPo2MmHg,
      'reduced FiO2 must lower Krogh arterial PO2',
    )
  }
})

test('negatif: fails closed on out-of-range or non-finite physiological inputs', () => {
  assert.equal(
    evaluateFiveStagePhysiology('cardiovascular', {
      depth01: Number.NaN,
      metabolicDriveFold: 1.0,
      oxygenFraction: 0.21,
    }).ok,
    false,
  )
  const badDepth = evaluateFiveStagePhysiology('cardiovascular', {
    depth01: 1.2,
    metabolicDriveFold: 1.0,
    oxygenFraction: 0.21,
  })
  assert.equal(badDepth.ok, false)
  if (!badDepth.ok) assert.equal(badDepth.reason, 'depth-out-of-range')

  const badDrive = evaluateFiveStagePhysiology('cardiovascular', {
    depth01: 0.2,
    metabolicDriveFold: 4.5,
    oxygenFraction: 0.21,
  })
  assert.equal(badDrive.ok, false)
  if (!badDrive.ok) assert.equal(badDrive.reason, 'metabolic-drive-out-of-range')

  const badO2 = evaluateFiveStagePhysiology('cardiovascular', {
    depth01: 0.2,
    metabolicDriveFold: 1.0,
    oxygenFraction: 0.05,
  })
  assert.equal(badO2.ok, false)
  if (!badO2.ok) assert.equal(badO2.reason, 'oxygen-fraction-out-of-range')
})

test('integrasi UI: UnifiedHumanSimulationProjector mounts FiveStageVisualAtlas with doom-scroll stream and textbook/journal disclosures', () => {
  const projector = readFileSync(
    new URL('../../src/pages/bodyhub/UnifiedHumanSimulationProjector.tsx', import.meta.url),
    'utf8',
  )
  const ui = readFileSync(
    new URL('../../src/domains/body-exposure/ui/FiveStageVisualAtlas.tsx', import.meta.url),
    'utf8',
  )
  assert.match(projector, /<FiveStageVisualAtlas/)
  assert.match(ui, /data-five-stage-visual-atlas="v1"/)
  assert.match(ui, /data-atlas-doom-scroll-stream="v1"/)
  assert.match(ui, /data-five-stage-sources="v1"/)
  assert.match(ui, /Whole Body → Organ Conduit → Tissue Microvessel → Cell → Molecular Gene/)
})
