import assert from 'node:assert/strict'
import {
  BODY_EXPOSURE_CORE_SCALE_PATH,
  BODY_EXPOSURE_REQUIRED_REFERENCES,
  auditBodyExposureMaturation,
  listBodyExposureScaleGaps,
} from '../../src/lib/bodyExposureMaturationAudit.ts'

assert.deepEqual(BODY_EXPOSURE_CORE_SCALE_PATH, ['whole-body','system','organ','tissue','cell','organelle','molecular-pathway','protein','rna','dna-epigenome'])
assert.ok(BODY_EXPOSURE_REQUIRED_REFERENCES.some((reference) => reference.id === 'thebuggeddev-anatomy'))
assert.ok(BODY_EXPOSURE_REQUIRED_REFERENCES.some((reference) => reference.id === 'breath-atlas-thebuggeddev'))
const neuro = BODY_EXPOSURE_REQUIRED_REFERENCES.find((reference) => reference.id === 'aycibatuhan-nervous-system-atlas')
assert.ok(neuro)
assert.match(neuro.reusePolicy, /apache-2\.0/i)
assert.match(neuro.reusePolicy, /cc-by-sa-4\.0/i)

const audit = auditBodyExposureMaturation()
assert.equal(audit.boundary.coverageIsImplementationMaturityOnly, true)
assert.equal(audit.boundary.anatomicalAccuracyClaim, false)
assert.ok(audit.coverageFraction >= 0 && audit.coverageFraction <= 1)
const cardiovascular = audit.domains.find((domain) => domain.domainId === 'cardiovascular')
assert.ok(cardiovascular)
assert.equal(cardiovascular.coverageFraction, 1)
assert.equal(cardiovascular.molecularToDnaReady, true)
const sensory = audit.domains.find((domain) => domain.domainId === 'sensory')
assert.ok(sensory)
assert.ok(sensory.missingScales.includes('whole-body'))
assert.ok(sensory.missingScales.includes('organelle'))
assert.ok(listBodyExposureScaleGaps().some((gap) => gap.domainId === 'sensory' && gap.scale === 'whole-body'))

console.log('Body Exposure maturation audit verified: canonical whole-body→DNA scale path, deterministic coverage formula, explicit gaps, and mandatory reference/license boundaries.')
