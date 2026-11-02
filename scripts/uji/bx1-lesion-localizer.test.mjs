import assert from 'node:assert/strict'
import test from 'node:test'

import {
  LESION_ATLAS_DISCLAIMER,
  localizeNeurologicalLesion,
} from '../../src/domains/body-exposure/engine/lesionLocalizerEngine.ts'

test('BX-1 1. Golden case: Weber syndrome (left CN III palsy + right UMN hemiparesis) localizes to left ventral midbrain', () => {
  const res = localizeNeurologicalLesion({
    motorFindings: [
      { region: 'hemicorpus', side: 'right', tone: 'spastic', reflexes: 'hyperreflexia', babinski: true },
    ],
    cranialNerveFindings: [{ nerve: 'CN_III', side: 'left' }],
  })
  assert.strictEqual(res.ok, true)
  assert.strictEqual(res.truthClass, 'reference')
  assert.strictEqual(res.label, LESION_ATLAS_DISCLAIMER)
  assert.strictEqual(res.chosenSyndrome?.syndrome.syndromeId, 'weber-midbrain-syndrome')
  assert.strictEqual(res.chosenSyndrome?.lesionSide, 'left')
  assert.strictEqual(res.chosenSyndrome?.syndrome.fmaId, 'FMA:62395')
})

test('BX-1 2. Paired test: switching CN_III to CN_VI shifts localization from Weber midbrain to Millard-Gubler pons', () => {
  const pontine = localizeNeurologicalLesion({
    motorFindings: [
      { region: 'hemicorpus', side: 'right', tone: 'spastic', reflexes: 'hyperreflexia', babinski: true },
    ],
    cranialNerveFindings: [{ nerve: 'CN_VI', side: 'left' }],
  })
  assert.strictEqual(pontine.ok, true)
  assert.strictEqual(pontine.chosenSyndrome?.syndrome.syndromeId, 'millard-gubler-pontine-syndrome')
  assert.strictEqual(pontine.chosenSyndrome?.lesionSide, 'left')
})

test('BX-1 3. Dissociated sensory tracts: Brown-Sequard right hemisection and Wallenberg lateral medullary syndromes', () => {
  const brownSequard = localizeNeurologicalLesion({
    motorFindings: [
      { region: 'lower-limb', side: 'right', tone: 'spastic', reflexes: 'hyperreflexia', babinski: true },
    ],
    sensoryFindings: [
      { modality: 'vibration-proprioception', distribution: 'dermatomal-below-level', side: 'right' },
      { modality: 'pain-temperature', distribution: 'dermatomal-below-level', side: 'left' },
    ],
  })
  assert.strictEqual(brownSequard.ok, true)
  assert.strictEqual(brownSequard.chosenSyndrome?.syndrome.syndromeId, 'brown-sequard-spinal-hemisection')
  assert.strictEqual(brownSequard.chosenSyndrome?.lesionSide, 'right')

  const wallenberg = localizeNeurologicalLesion({
    motorFindings: [],
    sensoryFindings: [
      { modality: 'pain-temperature', distribution: 'face', side: 'left' },
      { modality: 'pain-temperature', distribution: 'hemicorpus-below-neck', side: 'right' },
    ],
  })
  assert.strictEqual(wallenberg.ok, true)
  assert.strictEqual(wallenberg.chosenSyndrome?.syndrome.syndromeId, 'wallenberg-lateral-medullary-syndrome')
  assert.strictEqual(wallenberg.chosenSyndrome?.lesionSide, 'left')
})

test('BX-1 4. Contradictory signs fail closed: simultaneous spastic + areflexia/fasciculations in the same limb is rejected', () => {
  const contradictory = localizeNeurologicalLesion({
    motorFindings: [
      {
        region: 'lower-limb',
        side: 'left',
        tone: 'spastic',
        reflexes: 'areflexia',
        babinski: true,
        fasciculations: true,
      },
    ],
  })
  assert.strictEqual(contradictory.ok, false)
  assert.strictEqual(contradictory.reason, 'contradictory-neurological-signs')
})

test('BX-1 5. Empty findings and unverified source table fail closed', () => {
  const empty = localizeNeurologicalLesion({ motorFindings: [] })
  assert.strictEqual(empty.ok, false)
  assert.strictEqual(empty.reason, 'empty-findings')

  const unverified = localizeNeurologicalLesion({
    motorFindings: [{ region: 'hemicorpus', side: 'right', tone: 'spastic', reflexes: 'hyperreflexia' }],
    sourceOverride: {
      citation: 'Draft',
      section: 'N/A',
      verifiedFrom: 'unverified',
      tableVerified: false,
    },
  })
  assert.strictEqual(unverified.ok, false)
  assert.strictEqual(unverified.reason, 'source-not-verified')
})
