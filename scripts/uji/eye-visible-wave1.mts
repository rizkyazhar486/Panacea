import assert from 'node:assert/strict'
import {
  EYE_DEEPER_WAVES,
  EYE_VISIBLE_WAVE1,
  EYE_VISIBLE_WAVE1_REQUIRED_IDS,
  validateEyeVisibleWave1,
} from '../../src/lib/anatomy/eyeVisibleWave1.ts'

assert.deepEqual(validateEyeVisibleWave1(), [])
assert.ok(EYE_VISIBLE_WAVE1.length >= 110, `gross-visible Wave 1 is still too shallow: ${EYE_VISIBLE_WAVE1.length}`)

const byId = new Map(EYE_VISIBLE_WAVE1.map((item) => [item.id, item]))
for (const id of EYE_VISIBLE_WAVE1_REQUIRED_IDS) assert.ok(byId.has(id), `missing required gross-visible eye structure: ${id}`)

const requiredGroups = ['orbit','eyelid-adnexa','ocular-surface','globe','anterior-segment','posterior-segment','extraocular','lacrimal','neurovascular','visual-pathway']
for (const group of requiredGroups) assert.ok(EYE_VISIBLE_WAVE1.some((item) => item.group === group), `empty visible group: ${group}`)

for (const item of EYE_VISIBLE_WAVE1) {
  assert.equal(item.reviewStatus, 'academic-review-pending')
  assert.ok(item.evidenceAnchor.startsWith('NCBI:') || item.evidenceAnchor.startsWith('NEI:'), `unscoped evidence: ${item.id}`)
  assert.ok(['source-geometry-required', 'reference-only'].includes(item.geometryStatus), `invalid geometry state: ${item.id}`)
}

for (const id of [
  'upper-tarsal-plate','lower-tarsal-plate','upper-meibomian-glands','lower-meibomian-glands','glands-of-zeis','glands-of-moll',
  'palpebral-conjunctiva','bulbar-conjunctiva','superior-conjunctival-fornix','inferior-conjunctival-fornix',
  'common-tendinous-ring','tenon-capsule','lockwood-ligament','whitnall-ligament',
  'trabecular-meshwork','schlemm-canal','scleral-spur','macula','fovea','foveola','optic-disc','vitreous-base','hyaloid-canal',
  'central-retinal-artery','central-retinal-vein','short-posterior-ciliary-arteries','long-posterior-ciliary-arteries','vortex-veins',
  'ciliary-ganglion','long-ciliary-nerves','short-ciliary-nerves','lateral-geniculate-nucleus','optic-radiations','meyer-loop','primary-visual-cortex',
]) assert.equal(byId.get(id)?.geometryStatus, 'reference-only', `${id} must remain fail-closed until exact geometry provenance exists`)

assert.equal(byId.get('pupil')?.notes, 'Aperture only; never create a tissue mesh for the pupil.')
assert.equal(byId.get('visual-axis')?.mustBeSelectable, false)
assert.match(EYE_DEEPER_WAVES.wave2, /after Wave 1/i)
assert.match(EYE_DEEPER_WAVES.wave3, /after Wave 2/i)

const broken = EYE_VISIBLE_WAVE1.map((item) => ({ ...item }))
broken[0] = { ...broken[0], evidenceAnchor: '' }
assert.ok(validateEyeVisibleWave1(broken).includes(`evidence:${broken[0].id}`))

console.log(`eye-visible-wave1: ok (${EYE_VISIBLE_WAVE1.length} gross-visible structures)`)
