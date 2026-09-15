import assert from 'node:assert/strict'
import {
  BODY_LESION_LOCALIZATION_BOUNDARY,
  BODY_LESION_LOCALIZATION_LEVELS,
  BODY_LESION_LOCALIZATION_REFERENCES,
  getNeuroLocalizationLevel,
  listNeuroLocalizationLevelsForAtlasSystem,
  localizationSignalDomainCount,
} from '../../src/lib/bodyLesionLocalization.ts'
import { getWholeBodySystem } from '../../src/lib/wholeBodyPhysiologyOS.ts'

assert.equal(BODY_LESION_LOCALIZATION_LEVELS.length, 6, 'initial lesion-localization wave must expose six anatomical levels')
assert.equal(new Set(BODY_LESION_LOCALIZATION_LEVELS.map((level) => level.id)).size, 6, 'localization level ids must be unique')

for (const level of BODY_LESION_LOCALIZATION_LEVELS) {
  assert.ok(level.levelSummary.length >= 100, `${level.id} needs a meaningful level summary`)
  assert.ok(level.anatomyAnchors.length >= 3, `${level.id} needs multiple anatomy anchors`)
  assert.ok(level.pathwayAnchors.length >= 2, `${level.id} needs pathway anchors`)
  assert.ok(level.highSpecificityPattern.length >= 80, `${level.id} needs a high-specificity teaching pattern`)
  assert.ok(level.signals.length >= 3, `${level.id} needs at least three examination signals`)
  assert.ok(level.sideLogic.length >= 1, `${level.id} needs side/crossing logic`)
  assert.ok(level.imagingHandoff.length >= 80, `${level.id} needs an imaging/test handoff`)
  assert.ok(level.commonPitfall.length >= 70, `${level.id} needs a localization pitfall`)
  assert.ok(localizationSignalDomainCount(level.id) >= 1, `${level.id} must expose at least one examination domain`)

  for (const systemId of level.physiologySystemIds) getWholeBodySystem(systemId)

  for (const signal of level.signals) {
    assert.ok(signal.label.length >= 8, `${level.id}/${signal.id} needs a descriptive label`)
    assert.ok(signal.localizingValue.length >= 70, `${level.id}/${signal.id} needs explicit localizing value`)
    assert.ok(signal.caution.length >= 60, `${level.id}/${signal.id} needs a caution against over-localization`)
  }
}

const cortex = getNeuroLocalizationLevel('cortical-network')
assert.ok(cortex.signals.some((signal) => signal.domain === 'cognition-language'), 'cortical level must include higher cortical signal domain')
assert.match(cortex.highSpecificityPattern, /cortical sign|aphasia|neglect/i)

const deep = getNeuroLocalizationLevel('deep-subcortical')
assert.match(deep.highSpecificityPattern, /face-arm-leg/i, 'deep level must preserve compact face-arm-leg pathway pattern')
assert.match(deep.highSpecificityPattern, /absence|without/i, 'deep level must contrast higher cortical signs')

const brainstem = getNeuroLocalizationLevel('brainstem')
assert.match(brainstem.highSpecificityPattern, /crossed/i, 'brainstem level must preserve crossed-sign logic')
assert.ok(brainstem.sideLogic.some((item) => /cranial-nerve/i.test(item)), 'brainstem must preserve ipsilateral cranial-nerve framing')

const cerebellum = getNeuroLocalizationLevel('cerebellar')
assert.match(cerebellum.highSpecificityPattern, /ipsilateral/i, 'cerebellar level must preserve ipsilateral coordination framing')
assert.ok(cerebellum.signals.some((signal) => signal.domain === 'coordination-gait'))

const cord = getNeuroLocalizationLevel('spinal-cord')
assert.match(cord.highSpecificityPattern, /sensory level/i, 'cord level must preserve sensory-level framing')
assert.ok(cord.sideLogic.some((item) => /spinothalamic|anterolateral/i.test(item)), 'cord level must preserve tract-crossing logic')

const peripheral = getNeuroLocalizationLevel('peripheral-motor-sensory')
assert.match(peripheral.highSpecificityPattern, /lower-motor-neuron/i, 'peripheral level must preserve LMN pattern')
assert.ok(peripheral.signals.some((signal) => /reflex/i.test(signal.label)), 'peripheral level must include reflex localization')

assert.equal(listNeuroLocalizationLevelsForAtlasSystem('nervous').length, 6, 'nervous atlas system should expose the full localization ladder')
assert.ok(listNeuroLocalizationLevelsForAtlasSystem('sensory-ent').some((level) => level.id === 'brainstem'), 'sensory/ENT should expose brainstem cranial-nerve localization context')
assert.ok(listNeuroLocalizationLevelsForAtlasSystem('musculoskeletal').some((level) => level.id === 'spinal-cord'), 'musculoskeletal context should expose cord localization context')
assert.ok(listNeuroLocalizationLevelsForAtlasSystem('musculoskeletal').some((level) => level.id === 'peripheral-motor-sensory'), 'musculoskeletal context should expose peripheral motor-unit localization')
assert.equal(listNeuroLocalizationLevelsForAtlasSystem('cardiovascular').length, 0, 'cardiovascular system must not receive an invented direct neuro-localization mapping')

assert.equal(BODY_LESION_LOCALIZATION_REFERENCES.length, 1)
const reference = BODY_LESION_LOCALIZATION_REFERENCES[0]
assert.equal(reference.repository, 'aycibatuhan/nervous-system-atlas')
assert.equal(reference.pinnedCommit, '3a5fc2c1f2251d852769004446140d1842f58afe')
assert.match(reference.license, /Apache-2\.0/i)
assert.match(reference.license, /CC BY-SA 4\.0/i)
assert.match(reference.note, /independently authored/i, 'Panacea must explicitly preserve the reference/content license boundary')

assert.match(BODY_LESION_LOCALIZATION_BOUNDARY, /educational neuroanatomical localization workspace/i)
assert.match(BODY_LESION_LOCALIZATION_BOUNDARY, /does not diagnose/i)
assert.match(BODY_LESION_LOCALIZATION_BOUNDARY, /stroke treatment eligibility/i)
assert.match(BODY_LESION_LOCALIZATION_BOUNDARY, /qualified clinician/i)

console.log('body lesion localization: six-level exam-first localization model validated with crossing logic, mandatory reference provenance and diagnostic boundaries')
