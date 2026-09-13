import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../../src/components/AtlasViewer3D.tsx', import.meta.url), 'utf8')

const moduleId = 'prostat'
const info = ATLAS_MODULE_INFO[moduleId]
const parts = partsForModule(moduleId)
const names = parts.map((part) => part.name.toLowerCase())
const sources = [...new Set(parts.map((part) => part.source))]
const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)

assert.ok(info, 'prostate module must be shipped')
assert.ok(parts.length >= 7, 'prostate module must expose zonal and outlet anatomy breadth')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every prostate-module structure must carry positive indexed triangles')
assert.ok(triangles > 0, 'prostate module must contain indexed source geometry')
assert.deepEqual(sources, ['bodyparts3d'], 'prostate geometry must retain BodyParts3D source identity')

for (const required of ['transition', 'central', 'peripheral']) {
  assert.ok(names.some((name) => name.includes(required)), `${required} prostate zone source geometry must be present`)
}
assert.ok(names.some((name) => name.includes('anterior') && name.includes('fibromuscular')), 'anterior fibromuscular stroma must be present')
assert.ok(names.some((name) => name.includes('prostatic') && name.includes('urethra')), 'prostatic urethra must be present')
assert.ok(names.some((name) => name.includes('trigone')), 'bladder trigone context geometry must be present')
assert.ok(names.some((name) => name.includes('ureter') && name.includes('orifice')), 'ureteric orifice context geometry must be present')

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'specialty atlas must remain reachable from Body Exposure')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'specialty atlas tab must remain user-reachable')
assert.match(specialty, /Urogenital.*\['urogenital', 'prostat'\]/, 'prostate module must remain reachable from Urogenital selector')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'selected specialty module must load its shipped GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'viewer metadata must come from generated shipped-atlas metadata')
assert.match(specialty, /SUMBER\[asal\]/, 'source provenance must remain visible beside the rendered module')
assert.match(specialty, /The prostate by ZONE/, 'UI must retain explicit prostate zonal disclosure')
assert.match(viewer, /body3dPixelRatio/, 'shared specialty renderer must bound mobile pixel ratio')
assert.match(viewer, /IntersectionObserver/, 'shared specialty renderer must pause offscreen')
assert.match(viewer, /visibilitychange/, 'shared specialty renderer must pause in background tabs')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'picking must remain restricted to verified source metadata')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'specialty atlas must not synthesize substitute prostate geometry')

console.log(`Prostate source 3D gate: ${parts.length} exact structures, ${triangles.toLocaleString()} indexed triangles, source=${sources.join(',')}, zonal anatomy + outlet context, reachable GLB WebGL and mobile lifecycle locked.`)
