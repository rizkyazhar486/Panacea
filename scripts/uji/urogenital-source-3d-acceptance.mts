import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../../src/components/AtlasViewer3D.tsx', import.meta.url), 'utf8')

const moduleId = 'urogenital'
const info = ATLAS_MODULE_INFO[moduleId]
const parts = partsForModule(moduleId)
const names = parts.map((part) => part.name.toLowerCase())
const sources = [...new Set(parts.map((part) => part.source))]
const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)

assert.ok(info, 'urogenital atlas module must be generated')
assert.equal(info.label, 'Urogenital & andrology', 'urogenital module label must remain explicit')
assert.equal(parts.length, 18, 'urogenital module must preserve its 18 exact source-backed structures')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every urogenital structure must have positive indexed source geometry')
assert.ok(triangles > 0, 'urogenital module must expose positive indexed geometry')
assert.deepEqual(sources, ['bodyparts3d'], 'urogenital geometry must retain BodyParts3D provenance')

for (const structure of [
  'corpus cavernosum of penis', 'corpus spongiosum of penis', 'glans penis', 'left deferent duct',
  'right deferent duct', 'left epididymis', 'right epididymis', 'left seminal vesicle',
  'right seminal vesicle', 'left testis', 'right testis', 'prostate', 'left kidney', 'right kidney',
  'left ureter', 'right ureter', 'urinary bladder', 'urethra',
]) assert.ok(names.includes(structure), `urogenital atlas must expose ${structure}`)

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'Body Exposure must keep the specialty atlas reachable')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'Body Exposure must keep specialty navigation reachable')
assert.match(specialty, /Urogenital.*\['urogenital', 'prostat'\]/, 'urogenital module must remain reachable from its dedicated group')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'specialty atlas must load the shipped module GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'specialty atlas must use generated source metadata')
assert.match(specialty, /SUMBER\[asal\]/, 'specialty atlas must visibly expose source provenance')
assert.match(specialty, /BodyParts3D adalah rujukan laki-laki\s*\/\/ dewasa|BodyParts3D adalah rujukan laki-laki/, 'source boundary must retain the adult-male reference disclosure')

assert.match(viewer, /body3dPixelRatio/, 'viewer must keep bounded mobile pixel-ratio behavior')
assert.match(viewer, /IntersectionObserver/, 'viewer must suspend rendering when offscreen')
assert.match(viewer, /visibilitychange/, 'viewer must suspend rendering while hidden')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'viewer must limit picking to verified metadata-backed meshes')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'urogenital acceptance must not depend on synthetic primitive anatomy')

// Static source geometry is anatomy only. It does not prove dynamic sexual or reproductive physiology.
assert.doesNotMatch(specialty, /fertility prediction|erection score|ejaculation score|patient-specific fertility/i, 'static atlas must not claim patient-specific reproductive physiology')

console.log(`urogenital source 3D acceptance passed: ${parts.length} structures, ${triangles} triangles, source=${sources.join(',')}`)
