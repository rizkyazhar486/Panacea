import assert from 'node:assert/strict'
import {
  BODY_HIGH_FIDELITY_REFERENCE_TIER,
  BODY_MANDATORY_REFERENCE_SOURCES,
  BODY_REFERENCE_INTERACTION_REQUIREMENTS,
  validateBodyMandatoryReferenceSources,
} from '../../src/lib/bodyMandatoryReferenceSources.ts'

const validation = validateBodyMandatoryReferenceSources()
assert.equal(validation.valid, true, validation.reasons.join('\n'))

const anatomy = BODY_MANDATORY_REFERENCE_SOURCES.find((source) => source.id === 'thebuggeddev_anatomy')
const breath = BODY_MANDATORY_REFERENCE_SOURCES.find((source) => source.id === 'thebuggeddev_breath_atlas')
assert.ok(anatomy)
assert.ok(breath)

assert.equal(anatomy.url, 'https://github.com/thebuggeddev/anatomy')
assert.equal(anatomy.pinnedRevision, '8c0e6f321a47f895ae58ce098028b92774733ee9')
assert.equal(anatomy.requiredForDesignReview, true)
assert.equal(anatomy.runtimeAssetImportAllowed, false)
assert.equal(anatomy.verifiedAnatomyAllowed, false)

assert.equal(breath.url, 'https://breath-atlas.thebuggeddev.chatgpt.site/')
assert.equal(breath.requiredForDesignReview, true)
assert.equal(breath.runtimeAssetImportAllowed, false)
assert.equal(breath.verifiedAnatomyAllowed, false)

assert.deepEqual([...BODY_REFERENCE_INTERACTION_REQUIREMENTS], [
  'rotate',
  'zoom',
  'isolate',
  'cross-section',
  'layers',
  'compare',
  'hotspot-selection',
  'label-quiz',
])

assert.equal(BODY_HIGH_FIDELITY_REFERENCE_TIER.id, '5k-reference')
assert.equal(BODY_HIGH_FIDELITY_REFERENCE_TIER.longEdgePx, 5120)
assert.equal(BODY_HIGH_FIDELITY_REFERENCE_TIER.runtimePolicy, 'adaptive')
assert.equal(BODY_MANDATORY_REFERENCE_SOURCES.every((source) => source.licenseStatus === 'pending'), true)

console.log('Body mandatory references: thebuggeddev anatomy + Breath Atlas pinned with 5K reference and interaction contracts, fail-closed licensing.')
