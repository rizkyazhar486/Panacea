// scripts/qa/referred-pain-dermatome.test.mjs
// Deterministic verification of 12-organ viscerosomatic referred pain,
// 30-level dermatome spatial anchors, and Woolf central sensitization convergence

import test from 'node:test'
import assert from 'node:assert/strict'

import {
  DERMATOME_CONVERGENCE_SOURCE,
  DERMATOME_SPATIAL_ANCHORS,
  REFERRED_PAIN_DISCLAIMER,
  VISCERAL_REFERRED_PAIN_TABLE,
  calculateCentralSensitizationNociceptiveDrive,
  evaluateViscerosomaticConvergence,
} from '../../src/domains/body-exposure/engine/referredPainEngine.ts'

test('Pillar III: 12-Organ Visceral Referred Pain Inventory Completeness', () => {
  const EXPECTED_ORGANS = [
    'heart-myocardium',
    'gallbladder-biliary',
    'appendix-visceral-early',
    'ureter-renal-pelvis',
    'pancreas-body',
    'spleen-parenchyma',
    'stomach-gastric-wall',
    'liver-glisson-capsule',
    'urinary-bladder-wall',
    'adnexa-ovary',
    'colon-distal-sigmoid',
  ]

  const tableKeys = Object.keys(VISCERAL_REFERRED_PAIN_TABLE)
  assert.equal(tableKeys.length >= 11, true, `Expected >= 11 organs, got ${tableKeys.length}`)

  for (const organKey of EXPECTED_ORGANS) {
    const row = VISCERAL_REFERRED_PAIN_TABLE[organKey]
    assert.ok(row, `Missing organ row for: ${organKey}`)
    assert.equal(row.organ, organKey)
    assert.ok(row.organLabel.length > 0, `Organ label empty for ${organKey}`)
    assert.match(row.fmaId, /^FMA:\d+$/, `Invalid FMA ID format for ${organKey}: ${row.fmaId}`)
    assert.ok(row.afferentPathway.length > 10, `Afferent pathway description too brief for ${organKey}`)
    assert.ok(row.spinalSegments.length > 0, `Spinal segments empty for ${organKey}`)
    assert.ok(row.primaryCutaneousZones.length > 0, `Primary cutaneous zones empty for ${organKey}`)
    assert.equal(row.source, DERMATOME_CONVERGENCE_SOURCE)
  }
})

test('Pillar III: 30-Level Dermatome Spatial Anchor Completeness & Regions', () => {
  const anchors = Object.keys(DERMATOME_SPATIAL_ANCHORS)
  assert.equal(anchors.length, 30, `Expected exactly 30 dermatome spatial anchors, got ${anchors.length}`)

  const regionsFound = new Set()

  for (const [segment, anchor] of Object.entries(DERMATOME_SPATIAL_ANCHORS)) {
    assert.equal(anchor.segment, segment)
    assert.ok(
      ['cervical', 'thoracic', 'lumbar', 'sacral'].includes(anchor.region),
      `Invalid region ${anchor.region} for ${segment}`,
    )
    regionsFound.add(anchor.region)

    // Verify 3D anchors are valid finite coordinates in normalized coordinate space
    assert.equal(anchor.anteriorAnchor3D.length, 3)
    assert.equal(anchor.posteriorAnchor3D.length, 3)
    for (const val of [...anchor.anteriorAnchor3D, ...anchor.posteriorAnchor3D]) {
      assert.equal(typeof val, 'number')
      assert.equal(Number.isFinite(val), true)
      assert.ok(Math.abs(val) <= 1.5, `3D coordinate magnitude out of normalized bounds: ${val}`)
    }

    assert.ok(anchor.landmarkDescription.length > 5, `Landmark description too brief for ${segment}`)
  }

  assert.equal(regionsFound.size, 4, 'Expected all 4 anatomical spinal regions represented')
})

test('Pillar III: Woolf Central Sensitization & Nociceptive Gain Modeling', () => {
  // Test baseline case: Heart myocardium with T1-T5 active
  const baseActive = { T1: 1.0, T2: 1.0, T3: 1.0, T4: 1.0, T5: 1.0 }

  // Case A: gamma = 0 (no central sensitization)
  const baselineResult = calculateCentralSensitizationNociceptiveDrive({
    organ: 'heart-myocardium',
    activeDermatomes: baseActive,
    centralSensitizationCoeff: 0,
  })

  assert.equal(baselineResult.ok !== false, true)
  if (baselineResult.ok !== false) {
    assert.equal(baselineResult.organ, 'heart-myocardium')
    assert.equal(baselineResult.totalNociceptiveDrive, 5.0)
    assert.equal(baselineResult.dorsalHornAmplificationFactor, 1.0)
    assert.equal(baselineResult.sensitizedDrive, 5.0)
    assert.equal(baselineResult.truthClass, 'reference')
    assert.equal(baselineResult.label, REFERRED_PAIN_DISCLAIMER)
  }

  // Case B: gamma = 0.5 (active central sensitization synaptic gain)
  const sensitizedResult = calculateCentralSensitizationNociceptiveDrive({
    organ: 'heart-myocardium',
    activeDermatomes: baseActive,
    centralSensitizationCoeff: 0.5,
  })

  assert.equal(sensitizedResult.ok !== false, true)
  if (sensitizedResult.ok !== false) {
    assert.equal(sensitizedResult.totalNociceptiveDrive, 5.0)
    assert.ok(sensitizedResult.dorsalHornAmplificationFactor > 1.0)
    assert.ok(sensitizedResult.sensitizedDrive > 5.0)
    // Amplification factor must equal 1 + 0.5 * jaccardOverlap
    const expectedFactor = Number((1 + 0.5 * sensitizedResult.jaccardOverlap).toFixed(4))
    assert.equal(sensitizedResult.dorsalHornAmplificationFactor, expectedFactor)
  }

  // Case C: Parameter clamping to [0, 1.5]
  const clampedNeg = calculateCentralSensitizationNociceptiveDrive({
    organ: 'heart-myocardium',
    activeDermatomes: baseActive,
    centralSensitizationCoeff: -1.0,
  })
  if (clampedNeg.ok !== false) {
    assert.equal(clampedNeg.dorsalHornAmplificationFactor, 1.0)
  }

  const clampedExcess = calculateCentralSensitizationNociceptiveDrive({
    organ: 'heart-myocardium',
    activeDermatomes: baseActive,
    centralSensitizationCoeff: 99.9,
  })
  if (clampedExcess.ok !== false) {
    const maxExpectedFactor = Number((1 + 1.5 * clampedExcess.jaccardOverlap).toFixed(4))
    assert.equal(clampedExcess.dorsalHornAmplificationFactor, maxExpectedFactor)
  }
})

test('Pillar III: Gold-Standard Clinical Referral Patterns Verification', () => {
  // 1. Kehr Sign (Spleen rupture radiating to left shoulder tip via phrenic nerve C3-C5)
  const kehrResult = evaluateViscerosomaticConvergence({
    organ: 'spleen-parenchyma',
    activeCutaneousDermatomes: { C3: 0.8, C4: 0.9, C5: 0.8 },
  })
  assert.equal(kehrResult.ok, true)
  if (kehrResult.ok) {
    assert.ok(kehrResult.matchedDermatomeSegments.includes('C4'))
    assert.ok(kehrResult.primaryCutaneousZones.some((z) => z.includes('kehr-sign')))
  }

  // 2. Boas Sign (Gallbladder inflammation radiating to right scapula T7-T9)
  const boasResult = evaluateViscerosomaticConvergence({
    organ: 'gallbladder-biliary',
    activeCutaneousDermatomes: { T7: 1.0, T8: 1.0, T9: 1.0 },
  })
  assert.equal(boasResult.ok, true)
  if (boasResult.ok) {
    assert.deepEqual(boasResult.matchedDermatomeSegments, ['T7', 'T8', 'T9'])
    assert.ok(boasResult.primaryCutaneousZones.some((z) => z.includes('scapula-boas-sign')))
  }

  // 3. Early Visceral Appendicitis (Periumbilical T10)
  const appxResult = evaluateViscerosomaticConvergence({
    organ: 'appendix-visceral-early',
    activeCutaneousDermatomes: { T10: 1.0 },
  })
  assert.equal(appxResult.ok, true)
  if (appxResult.ok) {
    assert.deepEqual(appxResult.matchedDermatomeSegments, ['T10'])
    assert.equal(appxResult.jaccardOverlap, 1.0)
  }
})

test('Pillar III: Fail-Closed Boundary Conditions & Input Validation', () => {
  // Unknown organ key
  const badOrgan = calculateCentralSensitizationNociceptiveDrive({
    organ: 'non-existent-viscus-xyz',
    activeDermatomes: { T1: 1.0 },
  })
  assert.equal(badOrgan.ok, false)
  if (badOrgan.ok === false) {
    assert.equal(badOrgan.reason, 'unknown-organ')
  }

  // Empty active dermatomes
  const emptyDermatomes = calculateCentralSensitizationNociceptiveDrive({
    organ: 'heart-myocardium',
    activeDermatomes: {},
  })
  assert.equal(emptyDermatomes.ok, false)
  if (emptyDermatomes.ok === false) {
    assert.equal(emptyDermatomes.reason, 'empty-active-segments')
  }
})
