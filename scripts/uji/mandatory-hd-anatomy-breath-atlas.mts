import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { BODY_PROJECTION_TARGETS } from '../../src/lib/bodyProjectionContract.ts'
import { evaluateProjectionReadiness } from '../../src/lib/bodyProjectionReadiness.ts'
import {
  HD_ANATOMY_RENDER_PROFILES,
  MANDATORY_ANATOMY_REFERENCES,
  evaluateHdAnatomyAsset,
  selectHdAnatomyRenderProfile,
} from '../../src/lib/anatomy/hdAnatomyContract.ts'
import {
  RESPIRATORY_ATLAS_STRUCTURES,
  RESPIRATORY_CYCLE_STATES,
  RESPIRATORY_OVERLAY_POLICIES,
  getRespiratoryChildren,
  isRespiratoryStructureVerifiedByContract,
} from '../../src/lib/anatomy/respiratoryAtlasContract.ts'

assert.deepEqual(
  MANDATORY_ANATOMY_REFERENCES.map((reference) => reference.url).sort(),
  [
    'https://breath-atlas.thebuggeddev.chatgpt.site/',
    'https://github.com/thebuggeddev/anatomy',
  ].sort(),
  'Both user-mandated anatomy references must remain in the product contract.',
)

for (const reference of MANDATORY_ANATOMY_REFERENCES) {
  assert.equal(reference.required, true)
  assert.equal(reference.use, 'capability-reference-only')
  assert.equal(reference.licenseStatus, 'unverified')
  assert.equal(reference.directCopyAllowed, false, `${reference.id} must not become a blanket copy source without verified licensing.`)
}

const breathAtlasUi = readFileSync(new URL('../../src/pages/bodyhub/BreathAtlasLab.tsx', import.meta.url), 'utf8')
for (const reference of MANDATORY_ANATOMY_REFERENCES) {
  assert.ok(
    breathAtlasUi.includes(reference.url),
    `BreathAtlasLab must retain the mandatory visible reference ${reference.url}`,
  )
}
assert.match(breathAtlasUi, /independently implemented Panacea teaching layer/i)
assert.match(breathAtlasUi, /does not embed or copy third-party viewer code or assets/i)
assert.match(breathAtlasUi, /Scientific boundary/i)
assert.match(breathAtlasUi, /not deformed to fake breathing/i)
assert.match(breathAtlasUi, /no patient-specific ventilation map/i)
assert.match(breathAtlasUi, /Microscopic alveolar geometry is disclosed as unavailable/i)

const mobile = selectHdAnatomyRenderProfile({ viewportWidth: 390, devicePixelRatio: 3 })
assert.equal(mobile.id, 'mobile-safe')
assert.ok(mobile.maxDevicePixelRatio <= 1.5, 'Mobile HD rendering must keep DPR bounded for WebGL stability.')
assert.equal(mobile.progressiveLoadingRequired, true)
assert.equal(mobile.requireGracefulFallback, true)

const desktop = selectHdAnatomyRenderProfile({ viewportWidth: 1920, devicePixelRatio: 2 })
assert.equal(desktop.id, 'desktop-hd')
assert.equal(desktop.preferredLod, 'detail')
assert.ok(desktop.maxConcurrentDetailLayers > mobile.maxConcurrentDetailLayers)

for (const profile of HD_ANATOMY_RENDER_PROFILES) {
  assert.equal(profile.progressiveLoadingRequired, true)
  assert.equal(profile.requireGracefulFallback, true)
  assert.ok(profile.maxDevicePixelRatio > 0 && profile.maxDevicePixelRatio <= 2.5)
}

const referenceHdGate = evaluateHdAnatomyAsset({
  assetId: 'synthetic-lung-detail',
  targetId: 'pulmonary-core',
  lod: 'detail',
  namedStructures: ['Right lung', 'Left lung'],
  sourceLicenseVerified: true,
  textureLicenseVerified: true,
  hasExplicitLeftRightOrientation: true,
  hasExplicitAnatomicalAxes: true,
  closeZoomApproved: true,
})
assert.equal(referenceHdGate.usableForReferenceRendering, true)
assert.equal(referenceHdGate.usableForVerifiedRendering, false)
assert.ok(referenceHdGate.reasons.some((reason) => /provenance/i.test(reason)))

const pulmonaryTarget = BODY_PROJECTION_TARGETS.find((target) => target.id === 'pulmonary-core')
assert.ok(pulmonaryTarget, 'Pulmonary projection target must exist.')
assert.equal(pulmonaryTarget.system, 'pulmonary')
assert.equal(pulmonaryTarget.academicReview, 'pending')
assert.equal(pulmonaryTarget.patientSpecificAllowed, false)
assert.ok(pulmonaryTarget.kinds.includes('physiology'))

const pulmonaryReadiness = evaluateProjectionReadiness(pulmonaryTarget, {
  targetId: pulmonaryTarget.id,
  sourceId: pulmonaryTarget.preferredSourceIds[0],
  assetId: 'synthetic-pulmonary-reference',
  sourceRevision: 'synthetic-revision',
  license: 'synthetic-license-for-regression-only',
  attribution: 'synthetic attribution for deterministic regression only',
  transformationHistory: ['synthetic deterministic transform'],
  geometryStatus: 'verified-native',
  evidenceStatus: 'source-checked',
  academicReview: 'pending',
})
assert.equal(pulmonaryReadiness.renderAsVerifiedAnatomy, false)
assert.equal(pulmonaryReadiness.readiness, 'verification-required')

const requiredRespiratoryIds = [
  'trachea',
  'right-main-bronchus',
  'left-main-bronchus',
  'right-upper-lobe',
  'right-middle-lobe',
  'right-lower-lobe',
  'left-upper-lobe',
  'left-lower-lobe',
  'right-horizontal-fissure',
  'right-oblique-fissure',
  'left-oblique-fissure',
  'visceral-pleura',
  'parietal-pleura',
  'diaphragm',
  'thoracic-wall',
]
for (const id of requiredRespiratoryIds) {
  assert.ok(RESPIRATORY_ATLAS_STRUCTURES.some((structure) => structure.id === id), `Missing mandatory Breath Atlas structure: ${id}`)
  assert.equal(isRespiratoryStructureVerifiedByContract(id), false, `${id} must not self-promote to verified anatomy.`)
}

for (const structure of RESPIRATORY_ATLAS_STRUCTURES) {
  assert.equal(structure.sourceRequired, true)
  assert.equal(structure.patientSpecificAllowed, false)
  assert.equal(structure.academicReview, 'pending')
}

assert.deepEqual(
  getRespiratoryChildren('trachea').map((structure) => structure.id).sort(),
  ['left-main-bronchus', 'right-main-bronchus'],
)

for (const id of ['bronchiolar-reference', 'alveolar-reference']) {
  const structure = RESPIRATORY_ATLAS_STRUCTURES.find((candidate) => candidate.id === id)
  assert.ok(structure)
  assert.equal(structure.geometryStatus, 'reference-only')
}

assert.deepEqual(
  RESPIRATORY_CYCLE_STATES.map((state) => state.phase),
  ['inspiration', 'end-inspiration', 'expiration', 'end-expiration'],
)
for (const state of RESPIRATORY_CYCLE_STATES) {
  assert.equal(state.modelStatus, 'qualitative-reference')
  const keys = Object.keys(state)
  for (const forbidden of ['pressure', 'volumeMl', 'flowRate', 'diaphragmExcursionMm', 'patientValue']) {
    assert.equal(keys.includes(forbidden), false, `Qualitative respiratory contract must not fabricate ${forbidden}.`)
  }
}

for (const overlay of RESPIRATORY_OVERLAY_POLICIES) {
  assert.equal(overlay.displayStatus, 'conceptual-unless-validated')
  assert.equal(overlay.requiresExplicitSourceForQuantification, true)
}

console.log('Mandatory HD Anatomy + Breath Atlas capability, UI references, provenance, LOD, and physiology boundaries verified.')
