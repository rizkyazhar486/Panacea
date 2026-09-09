import assert from 'node:assert/strict'
import {
  EYE_DEEPER_WAVES,
  EYE_VISIBLE_WAVE1,
  EYE_VISIBLE_WAVE1_REQUIRED_IDS,
  validateEyeVisibleWave1,
} from '../../src/lib/anatomy/eyeVisibleWave1.ts'

assert.deepEqual(validateEyeVisibleWave1(), [])
assert.ok(EYE_VISIBLE_WAVE1.length >= 60, 'Eye Wave 1 must be a real visible anatomy inventory, not a token eye card.')

const byId = new Map(EYE_VISIBLE_WAVE1.map((item) => [item.id, item]))
for (const id of EYE_VISIBLE_WAVE1_REQUIRED_IDS) assert.ok(byId.has(id), `missing required visible eye structure: ${id}`)

for (const id of [
  'upper-eyelid', 'lower-eyelid', 'upper-tarsal-plate', 'lower-tarsal-plate',
  'upper-meibomian-glands', 'lower-meibomian-glands', 'palpebral-conjunctiva', 'bulbar-conjunctiva',
  'cornea', 'sclera', 'iris', 'ciliary-body', 'lens', 'retina', 'choroid', 'vitreous-body',
  'lacrimal-gland', 'superior-lacrimal-punctum', 'inferior-lacrimal-punctum', 'lacrimal-sac', 'nasolacrimal-duct',
]) {
  assert.equal(byId.get(id)?.mustBeSelectable, true, `${id} must be selectable in visible-first eye UX`)
}

for (const id of [
  'upper-tarsal-plate', 'lower-tarsal-plate', 'upper-meibomian-glands', 'lower-meibomian-glands',
  'palpebral-conjunctiva', 'bulbar-conjunctiva', 'lacrimal-caruncle', 'plica-semilunaris',
  'superior-lacrimal-punctum', 'inferior-lacrimal-punctum', 'superior-canaliculus', 'inferior-canaliculus',
  'central-retinal-artery', 'central-retinal-vein',
]) {
  assert.equal(byId.get(id)?.geometryStatus, 'reference-only', `${id} must stay reference-only until exact source geometry is proven`)
}

assert.match(EYE_DEEPER_WAVES.wave2, /Tunics and structural layers/)
assert.match(EYE_DEEPER_WAVES.wave3, /Retinal and corneal histology/)
assert.match(EYE_DEEPER_WAVES.wave5, /Protein\/pathway\/molecule\/gene\/DNA/)

assert.equal(byId.get('pupil')?.notes, 'Aperture only; never create a tissue mesh for the pupil.')
assert.equal(byId.get('upper-meibomian-glands')?.parentId, 'upper-tarsal-plate')
assert.equal(byId.get('lower-meibomian-glands')?.parentId, 'lower-tarsal-plate')
assert.equal(byId.get('nasolacrimal-duct')?.parentId, 'lacrimal-sac')

const invalid = EYE_VISIBLE_WAVE1.map((item) => ({ ...item }))
invalid[0] = { ...invalid[0], evidenceAnchor: '' }
assert.ok(validateEyeVisibleWave1(invalid).includes(`evidence:${invalid[0].id}`))

console.log(`eye-visible-wave1: ok (${EYE_VISIBLE_WAVE1.length} visible structures; deeper waves explicitly deferred)`)
