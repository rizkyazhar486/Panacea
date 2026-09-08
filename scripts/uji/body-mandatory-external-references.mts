import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  BODY_MANDATORY_EXTERNAL_REFERENCES,
  canImportMandatoryBodyReferenceAssets,
} from '../../src/lib/bodyMandatoryExternalReferences.ts'

assert.deepEqual(
  BODY_MANDATORY_EXTERNAL_REFERENCES.map((reference) => reference.url),
  [
    'https://github.com/thebuggeddev/anatomy',
    'https://breath-atlas.thebuggeddev.chatgpt.site/',
  ],
  'both user-required anatomy references must remain registered',
)

for (const reference of BODY_MANDATORY_EXTERNAL_REFERENCES) {
  assert.equal(reference.required, true)
  assert.equal(reference.scientificAuthority, false, `${reference.id} must not be promoted to a scientific authority`)
  assert.equal(reference.licenseStatus, 'verification-required')
  assert.equal(reference.assetImportPolicy, 'blocked-until-license-and-provenance-verified')
  assert.equal(reference.academicReviewStatus, 'not-recorded')
  assert.equal(canImportMandatoryBodyReferenceAssets(reference), false, `${reference.id} assets must fail closed until independently verified`)
}

const panelSource = readFileSync(new URL('../../src/pages/bodyhub/BreathAtlasReferencePanel.tsx', import.meta.url), 'utf8')
assert.match(panelSource, /Z-Anatomy \/ BodyParts3D provenance path/)
assert.match(panelSource, /not a scientific source/)
assert.match(panelSource, /Human academic review: not recorded/)
assert.match(panelSource, /external asset import: blocked/)
assert.match(panelSource, /lungs-airway/)
assert.match(panelSource, /thoracic-cage/)
assert.match(panelSource, /Fail-closed physiology boundary/)
assert.doesNotMatch(panelSource, /<iframe\b/i, 'Breath Atlas reference must not be embedded as an iframe')
assert.doesNotMatch(panelSource, /\bfetch\s*\(/, 'Breath Atlas reference panel must stay local-first with no remote runtime fetch')
assert.doesNotMatch(panelSource, /three|GLTFLoader|useGLTF/, 'reference panel must reuse the shared renderer rather than shipping a second 3D runtime')

console.log('Mandatory anatomy/Breath Atlas references remain visible as design references while scientific, license, provenance and runtime-import boundaries fail closed.')
