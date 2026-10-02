import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../../src/components/AtlasViewer3D.tsx', import.meta.url), 'utf8')

const moduleId = 'endokrin'
const info = ATLAS_MODULE_INFO[moduleId]
const parts = partsForModule(moduleId)
const names = parts.map((part) => part.name.toLowerCase())
const sources = [...new Set(parts.map((part) => part.source))]
const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)

assert.ok(info, 'general endocrine specialty module must be shipped')
assert.ok(parts.length >= 10, 'general endocrine module must preserve broad generated source anatomy')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every endocrine-module structure must carry positive indexed triangles')
assert.ok(triangles > 0, 'endocrine module must contain indexed source geometry')
assert.deepEqual(sources, ['bodyparts3d'], 'general endocrine geometry must retain BodyParts3D source identity')

for (const required of [
  'hypothalamus',
  'pineal body',
  'pituitary gland',
  'pancreas',
  'left adrenal gland',
  'right adrenal gland',
  'left testis',
  'right testis',
  'left lobe of thymus',
  'right lobe of thymus',
]) {
  assert.ok(names.includes(required), `${required} source geometry must be present`)
}

assert.ok(names.includes('left kidney') && names.includes('right kidney'), 'renal meshes present in this source module must remain explicit anatomical context')
assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'specialty atlas must remain reachable from Body Exposure')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'specialty atlas tab must remain user-reachable')
assert.match(specialty, /Endocrine.*\['endokrin', 'tiroid'\]/, 'general endocrine module must remain reachable from Endocrine selector alongside the separate thyroid module')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'selected specialty module must load its shipped GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'viewer metadata must come from generated shipped-atlas metadata')
assert.match(specialty, /SUMBER\[asal\]/, 'source provenance must remain visible beside the rendered module')
assert.match(viewer, /body3dPixelRatio/, 'shared specialty renderer must bound mobile pixel ratio')
assert.match(viewer, /IntersectionObserver/, 'shared specialty renderer must pause offscreen')
assert.match(viewer, /visibilitychange/, 'shared specialty renderer must pause in background tabs')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'picking must remain restricted to verified source metadata')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'specialty atlas must not synthesize substitute endocrine geometry')

console.log(`Endocrine source 3D gate: ${parts.length} exact structures, ${triangles.toLocaleString()} indexed triangles, source=${sources.join(',')}; hypothalamic/pituitary/pineal, pancreatic, adrenal, gonadal and thymic structures are source-backed. Thyroid remains separately sourced by the dedicated tiroid module.`)
