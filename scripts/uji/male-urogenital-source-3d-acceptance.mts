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

assert.ok(info, 'male urogenital atlas module must be generated')
assert.ok(parts.length >= 18, 'male urogenital module must preserve broad source-backed reproductive and urinary coverage')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every male urogenital structure must have positive indexed source geometry')
assert.ok(triangles > 0, 'male urogenital module must expose positive triangle geometry')
assert.deepEqual(sources, ['bodyparts3d'], 'male urogenital geometry must retain BodyParts3D provenance')

for (const structure of [
  'corpus cavernosum of penis', 'corpus spongiosum of penis', 'glans penis',
  'left deferent duct', 'right deferent duct', 'left epididymis', 'right epididymis',
  'left seminal vesicle', 'right seminal vesicle', 'left testis', 'right testis',
  'left kidney', 'right kidney', 'left ureter', 'right ureter', 'urethra', 'urinary bladder',
]) {
  assert.ok(names.includes(structure), `male urogenital atlas must expose ${structure}`)
}
assert.ok(names.includes('prostate'), 'male urogenital atlas must retain source-backed prostate context without replacing the dedicated prostate-zone module')

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'Body Exposure must keep the specialty atlas reachable')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'Body Exposure must keep the specialty navigation entry reachable')
assert.match(specialty, /Urogenital.*\['urogenital', 'prostat'\]/, 'male urogenital module must stay reachable from the Urogenital group')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'specialty atlas must load the shipped module GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'specialty atlas must use generated source metadata for selectable geometry')
assert.match(specialty, /SUMBER\[asal\]/, 'specialty atlas must visibly expose source provenance')
assert.match(viewer, /body3dPixelRatio/, 'viewer must keep bounded mobile pixel-ratio behavior')
assert.match(viewer, /IntersectionObserver/, 'viewer must suspend rendering when offscreen')
assert.match(viewer, /visibilitychange/, 'viewer must suspend rendering while the document is hidden')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'viewer must limit picking to verified metadata-backed meshes')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'male urogenital acceptance must not depend on synthetic primitive anatomy')

console.log(`male urogenital source 3D acceptance passed: ${parts.length} structures, ${triangles} triangles, source=${sources.join(',')}`)
