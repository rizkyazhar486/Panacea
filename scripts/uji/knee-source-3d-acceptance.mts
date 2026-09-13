import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../../src/components/AtlasViewer3D.tsx', import.meta.url), 'utf8')

const moduleId = 'lutut'
const info = ATLAS_MODULE_INFO[moduleId]
const parts = partsForModule(moduleId)
const names = parts.map((part) => part.name.toLowerCase())
const sources = [...new Set(parts.map((part) => part.source))]
const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)

assert.ok(info, 'knee specialty module must remain shipped')
assert.ok(parts.length >= 8, 'knee module must preserve broad source-backed joint anatomy')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every displayed knee structure must retain positive indexed triangles')
assert.ok(triangles > 0, 'knee module must contain indexed source geometry')
assert.deepEqual(sources, ['hra-female'], 'knee geometry must retain HuBMAP HRA female source identity')

for (const [label, pattern] of [
  ['meniscus', /menisc/],
  ['cruciate ligament', /cruciate/],
  ['collateral ligament', /collateral/],
  ['patella', /patella/],
  ['articular cartilage', /cartilage/],
  ['patellar ligament or tendon', /patellar ligament|patellar tendon/],
  ['quadriceps tendon', /quadriceps.*tendon/],
] as const) {
  assert.ok(names.some((name) => pattern.test(name)), `${label} source geometry must remain present`)
}

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'specialty atlas must remain reachable from Body Exposure')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'specialty atlas tab must remain user-reachable')
assert.match(specialty, /Musculoskeletal.*\['ortopedi', 'lutut'\]/, 'knee module must remain reachable from Musculoskeletal selector')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'selected specialty module must load its shipped GLB')
assert.match(specialty, /SUMBER\[asal\]/, 'source provenance must remain visible beside rendered anatomy')
assert.match(viewer, /body3dPixelRatio/, 'shared renderer must bound mobile pixel ratio')
assert.match(viewer, /IntersectionObserver/, 'shared renderer must suspend offscreen work')
assert.match(viewer, /visibilitychange/, 'shared renderer must suspend background work')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'picking must remain source-metadata constrained')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'specialty atlas must not synthesize substitute knee anatomy')

console.log(`Knee source 3D gate: ${parts.length} structures, ${triangles.toLocaleString()} indexed triangles, source=${sources.join(',')}; meniscal, ligament, cartilage and extensor-mechanism breadth locked.`)
