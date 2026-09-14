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
assert.ok(info, 'systemic endocrine atlas module must be generated')
assert.ok(parts.length >= 10, 'systemic endocrine module must preserve broad source-backed endocrine context')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every systemic endocrine structure must have positive indexed source geometry')
assert.ok(triangles > 0, 'systemic endocrine module must expose positive triangle geometry')
assert.deepEqual(sources, ['bodyparts3d'], 'systemic endocrine geometry must retain BodyParts3D provenance')
for (const structure of ['hypothalamus','pineal body','pituitary gland','left adrenal gland','right adrenal gland','left kidney','right kidney','left testis','right testis']) assert.ok(names.includes(structure), `systemic endocrine atlas must expose ${structure}`)
assert.ok(names.some((name) => name.includes('pancreas')), 'systemic endocrine atlas must preserve pancreatic endocrine-organ context')
assert.ok(names.some((name) => name.includes('thymus')), 'systemic endocrine atlas must preserve thymic context without claiming a complete immune atlas')
assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'Body Exposure must keep the specialty atlas reachable')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'Body Exposure must keep specialty navigation reachable')
assert.match(specialty, /Endocrine.*\['endokrin', 'tiroid'\]/, 'systemic endocrine module must stay reachable from Endocrine')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'specialty atlas must load shipped module GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'specialty atlas must use generated source metadata')
assert.match(specialty, /SUMBER\[asal\]/, 'specialty atlas must visibly expose provenance')
assert.match(viewer, /body3dPixelRatio/, 'viewer must keep bounded mobile pixel-ratio behavior')
assert.match(viewer, /IntersectionObserver/, 'viewer must suspend rendering when offscreen')
assert.match(viewer, /visibilitychange/, 'viewer must suspend rendering while hidden')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'viewer must limit picking to verified metadata-backed meshes')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'endocrine acceptance must not depend on synthetic primitive anatomy')
console.log(`systemic endocrine source 3D acceptance passed: ${parts.length} structures, ${triangles} triangles, source=${sources.join(',')}`)
