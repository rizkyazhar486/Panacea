import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')

const moduleId = 'tht'
const info = ATLAS_MODULE_INFO[moduleId]
const parts = partsForModule(moduleId)
const names = parts.map((part) => part.name.toLowerCase())
const sources = [...new Set(parts.map((part) => part.source))]
const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)

assert.ok(info, 'upper ENT atlas module must be generated')
assert.ok(parts.length >= 25, 'upper ENT module must preserve broad source-backed nose, pharynx and larynx context')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every upper ENT source structure must have positive indexed geometry')
assert.ok(triangles > 0, 'upper ENT module must expose positive indexed source geometry')
assert.deepEqual(sources, ['bodyparts3d'], 'upper ENT geometry must retain BodyParts3D provenance')

for (const structure of [
  'trachea', 'tongue', 'epiglottis', 'cricoid cartilage', 'thyroid cartilage',
  'septal nasal cartilage', 'left inferior nasal concha', 'right inferior nasal concha',
  'left nasal bone', 'right nasal bone', 'vomer', 'mandible', 'left sublingual gland',
  'right sublingual gland', 'left submandibular gland', 'right submandibular gland', 'external ear',
]) {
  assert.ok(names.includes(structure), `upper ENT atlas must expose ${structure}`)
}
assert.ok(names.some((name) => name.includes('pharyngeal constrictor')), 'upper ENT atlas must preserve source-backed pharyngeal constrictor geometry')
assert.ok(names.some((name) => name.includes('vocal ligament')), 'upper ENT atlas must preserve source-backed vocal-ligament context')

assert.match(specialty, /Neuro & senses.*\['neurologi', 'medula-spinalis', 'mata', 'tht', 'telinga'\]/, 'upper ENT module must remain reachable from Neuro & senses')
assert.match(specialty, /The nose, pharynx and larynx/, 'UI must preserve bounded upper-ENT scope disclosure')
assert.match(specialty, /middle and inner ear are in their own module/, 'UI must not fabricate middle/inner-ear structures inside the upper ENT source space')
assert.match(specialty, /partsForModule\(modul\)/, 'specialty atlas must use generated source metadata')
assert.match(specialty, /SUMBER\[asal\]/, 'specialty atlas must visibly expose source provenance')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'upper ENT acceptance must not depend on synthetic primitive anatomy')

console.log(`upper ENT source 3D acceptance passed: ${parts.length} structures, ${triangles} triangles, source=${sources.join(',')}`)
