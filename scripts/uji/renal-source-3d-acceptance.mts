import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../../src/components/AtlasViewer3D.tsx', import.meta.url), 'utf8')

const moduleId = 'nefrologi'
const info = ATLAS_MODULE_INFO[moduleId]
const parts = partsForModule(moduleId)
const names = parts.map((part) => part.name.toLowerCase())
const sources = [...new Set(parts.map((part) => part.source))]
const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)

assert.ok(info, 'renal atlas module must be generated')
assert.ok(parts.length >= 10, 'renal module must preserve source-backed kidney, urinary and vascular context')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every renal structure must have positive indexed source geometry')
assert.ok(triangles > 0, 'renal module must expose positive indexed geometry')
assert.deepEqual(sources, ['bodyparts3d'], 'renal module must retain BodyParts3D provenance')
for (const structure of ['left kidney','right kidney','left ureter','right ureter','urinary bladder','urethra','left renal artery','right renal artery','left renal vein','right renal vein']) assert.ok(names.includes(structure), `renal atlas must expose ${structure}`)
assert.ok(names.includes('inferior vena cava'), 'renal atlas must retain IVC context')
assert.ok(names.includes('abdominal aorta'), 'renal atlas must retain abdominal aortic context')
assert.ok(names.includes('left adrenal gland') && names.includes('right adrenal gland'), 'renal atlas must retain bilateral adrenal context without claiming endocrine completeness')

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'Body Exposure must keep the specialty atlas reachable')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'Body Exposure must keep specialty navigation reachable')
assert.match(specialty, /Abdomen.*\['gastro', 'bilier', 'nefrologi'\]/, 'renal module must remain reachable from Abdomen')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'specialty atlas must load the shipped module GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'specialty atlas must use generated source metadata')
assert.match(specialty, /SUMBER\[asal\]/, 'specialty atlas must visibly expose provenance')
assert.match(viewer, /body3dPixelRatio/, 'viewer must keep bounded mobile pixel-ratio behavior')
assert.match(viewer, /IntersectionObserver/, 'viewer must suspend rendering when offscreen')
assert.match(viewer, /visibilitychange/, 'viewer must suspend rendering while hidden')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'viewer must limit picking to verified metadata-backed meshes')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'renal acceptance must not depend on synthetic primitive anatomy')

console.log(`renal source 3D acceptance passed: ${parts.length} structures, ${triangles} triangles, source=${sources.join(',')}`)
