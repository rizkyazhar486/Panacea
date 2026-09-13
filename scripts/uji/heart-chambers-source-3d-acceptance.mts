import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../../src/components/AtlasViewer3D.tsx', import.meta.url), 'utf8')

const moduleId = 'jantung-ruang'
const info = ATLAS_MODULE_INFO[moduleId]
const parts = partsForModule(moduleId)
const names = parts.map((part) => part.name.toLowerCase())
const sources = [...new Set(parts.map((part) => part.source))]
const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)

assert.ok(info, 'heart chamber specialty module must remain shipped')
assert.ok(parts.length >= 10, 'heart chamber module must preserve source-backed chamber/valve breadth')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every rendered heart structure must carry positive indexed triangles')
assert.ok(triangles > 0, 'heart chamber module must contain indexed source geometry')
assert.deepEqual(sources, ['hra-female'], 'heart chamber geometry must retain HuBMAP HRA female source identity')

for (const [label, pattern] of [
  ['right atrium', /right atri/], ['left atrium', /left atri/],
  ['right ventricle', /right ventr/], ['left ventricle', /left ventr/],
  ['interventricular septum', /interventricular sept/],
  ['tricuspid valve', /tricuspid/], ['mitral valve', /mitral|bicuspid/],
  ['pulmonary valve', /pulmonary.*valve/], ['aortic valve', /aortic.*valve/],
  ['papillary muscle', /papillary/],
] as const) {
  assert.ok(names.some((name) => pattern.test(name)), `${label} source geometry must remain present`)
}

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'specialty atlas must remain reachable from Body Exposure')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'specialty atlas tab must remain user-reachable')
assert.match(specialty, /Chest.*\['jantung-ruang', 'respirasi', 'paru'\]/, 'heart chamber module must remain reachable from Chest selector')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'selected specialty module must load its shipped GLB')
assert.match(specialty, /SUMBER\[asal\]/, 'source provenance must remain visible beside rendered anatomy')
assert.match(viewer, /body3dPixelRatio/, 'shared renderer must bound mobile pixel ratio')
assert.match(viewer, /IntersectionObserver/, 'shared renderer must suspend offscreen work')
assert.match(viewer, /visibilitychange/, 'shared renderer must suspend background work')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'picking must remain source-metadata constrained')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'specialty atlas must not synthesize substitute heart anatomy')

console.log(`Heart chamber source 3D gate: ${parts.length} structures, ${triangles.toLocaleString()} indexed triangles, source=${sources.join(',')}; four chambers, septum, valves and papillary muscles locked.`)
