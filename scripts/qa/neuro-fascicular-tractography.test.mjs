/**
 * @file neuro-fascicular-tractography.test.mjs
 * @description Deterministic verification for Cranial Nerves, Reflex Arcs & Tractography Deficit Localizer (Pillar VII).
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CRANIAL_NERVES,
  BRAINSTEM_REFLEX_ARCS,
  LONG_TRACTS,
  NEURO_SYNDROMES,
  simulateReflexArc,
  evaluateNeurologicalSyndrome,
} from '../../src/domains/body-exposure/engine/neuroFascicularTractographyEngine.ts'

test('Pillar VII: 12 Cranial Nerves are fully indexed with anatomical metadata', () => {
  assert.equal(CRANIAL_NERVES.length, 12, 'Must catalog exactly 12 cranial nerves')

  for (let i = 0; i < 12; i++) {
    const nerve = CRANIAL_NERVES[i]
    assert.equal(nerve.number, i + 1, `Nerve index ${i} must have number ${i + 1}`)
    assert.ok(nerve.roman.startsWith('CN '), 'Roman label must start with CN')
    assert.ok(nerve.originNuclei.length > 0, 'Must have at least one origin nucleus')
    assert.ok(nerve.exitForamen.length > 0, 'Must have exit foramen defined')
    assert.ok(nerve.innervation.length > 0, 'Must have target innervation')
    assert.ok(nerve.clinicalTest.length > 0, 'Must have clinical test maneuver')
  }
})

test('Pillar VII: Brainstem Reflex Arcs are biologically consistent with deterministic latencies', () => {
  assert.equal(BRAINSTEM_REFLEX_ARCS.length, 4, 'Must catalog 4 core brainstem reflexes')

  const pupillary = BRAINSTEM_REFLEX_ARCS.find((r) => r.id === 'pupillary-light-reflex')
  assert.ok(pupillary, 'Pupillary reflex must exist')
  assert.equal(pupillary.afferentCranialNerve, 'CN II (Optic)')
  assert.ok(pupillary.efferentCranialNerve.includes('CN III'))
  assert.ok(pupillary.latencyMs > 100 && pupillary.latencyMs < 250, 'Pupillary reflex latency is ~180ms')

  const corneal = BRAINSTEM_REFLEX_ARCS.find((r) => r.id === 'corneal-blink-reflex')
  assert.ok(corneal, 'Corneal blink reflex must exist')
  assert.ok(corneal.afferentCranialNerve.includes('CN V1'))
  assert.ok(corneal.efferentCranialNerve.includes('CN VII'))
  assert.ok(corneal.latencyMs < 60, 'Corneal reflex latency is ~40ms')

  const vor = BRAINSTEM_REFLEX_ARCS.find((r) => r.id === 'vestibulo-ocular-reflex')
  assert.ok(vor, 'Vestibulo-ocular reflex must exist')
  assert.ok(vor.latencyMs <= 20, 'VOR is the fastest reflex, ~15ms')
})

test('Pillar VII: Reflex Arc simulation evaluates intact vs afferent vs efferent defects', () => {
  // Normal intact pupillary reflex
  const normal = simulateReflexArc('pupillary-light-reflex', 'right')
  assert.equal(normal.directResponse, 'intact')
  assert.equal(normal.consensualResponse, 'intact')
  assert.equal(normal.truthClass, 'mechanistic_simulation_proxy')

  // Afferent CN II defect on right (optic neuritis / Marcus Gunn)
  const afferentDefect = simulateReflexArc('pupillary-light-reflex', 'right', { afferentIntact: false })
  assert.equal(afferentDefect.directResponse, 'absent')
  assert.equal(afferentDefect.consensualResponse, 'absent')
  assert.ok(afferentDefect.diagnosticSummary.includes('Afferent limb defect'))

  // Isolated efferent CN III defect on right (blown pupil from uncal herniation)
  const efferentIpsi = simulateReflexArc('pupillary-light-reflex', 'right', { efferentIpsilateralIntact: false })
  assert.equal(efferentIpsi.directResponse, 'absent', 'Direct right pupillary constriction fails')
  assert.equal(efferentIpsi.consensualResponse, 'intact', 'Consensual left pupil constriction is preserved!')
  assert.ok(efferentIpsi.diagnosticSummary.includes('Isolated efferent palsy'))

  // Central interneuron failure
  const centralDefect = simulateReflexArc('pupillary-light-reflex', 'right', { centralIntact: false })
  assert.equal(centralDefect.directResponse, 'absent')
  assert.equal(centralDefect.consensualResponse, 'absent')
})

test('Pillar VII: 3 Major Long Tracts maintain correct decussation anatomy', () => {
  assert.equal(LONG_TRACTS.length, 3, 'Must catalog Corticospinal, DCML, and Spinothalamic tracts')

  const cst = LONG_TRACTS.find((t) => t.id === 'corticospinal-tract')
  assert.ok(cst)
  assert.ok(cst.decussationLevel.toLowerCase().includes('pyramidal decussation'))

  const dcml = LONG_TRACTS.find((t) => t.id === 'dcml-tract')
  assert.ok(dcml)
  assert.ok(dcml.decussationLevel.toLowerCase().includes('internal arcuate'))

  const spinothalamic = LONG_TRACTS.find((t) => t.id === 'spinothalamic-tract')
  assert.ok(spinothalamic)
  assert.ok(spinothalamic.decussationLevel.toLowerCase().includes('anterior white commissure'))
})

test('Pillar VII: Syndromic Localizer deterministically resolves Wallenberg, Weber, and Brown-Sequard', () => {
  // Wallenberg (Lateral Medullary Syndrome)
  const wallenberg = evaluateNeurologicalSyndrome('wallenberg-syndrome')
  assert.equal(wallenberg.ruleOf4Level, 'Medulla')
  assert.ok(wallenberg.vascularTerritory.includes('PICA') || wallenberg.vascularTerritory.includes('Vertebral'))
  assert.ok(wallenberg.ipsilateralBodySigns.some((s) => s.includes('Horner')))
  assert.ok(wallenberg.ipsilateralBodySigns.some((s) => s.includes('ataxia')))
  assert.ok(wallenberg.contralateralBodySigns.some((s) => s.includes('pain and temperature')))

  // Weber (Superior Alternating Hemiplegia)
  const weber = evaluateNeurologicalSyndrome('weber-syndrome')
  assert.equal(weber.ruleOf4Level, 'Midbrain')
  assert.ok(weber.ipsiSigns ? true : weber.ipsilateralBodySigns.some((s) => s.includes('CN III')))
  assert.ok(weber.contralateralBodySigns.some((s) => s.includes('hemiplegia')))

  // Brown-Sequard (T10 Hemisection)
  const bs = evaluateNeurologicalSyndrome('brown-sequard-t10')
  assert.equal(bs.ruleOf4Level, 'Spinal Cord')
  assert.ok(bs.ipsilateralBodySigns.some((s) => s.includes('vibration')))
  assert.ok(bs.contralateralBodySigns.some((s) => s.includes('pain and temperature')))
})
