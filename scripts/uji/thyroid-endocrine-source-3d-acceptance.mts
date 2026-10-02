import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../../src/components/AtlasViewer3D.tsx', import.meta.url), 'utf8')

const moduleId = 'tiroid'
const info = ATLAS_MODULE_INFO[moduleId]
const parts = partsForModule(moduleId)
const names = parts.map((part) => part.name.toLowerCase())
const sources = [...new Set(parts.map((part) => part.source))]
const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)

assert.ok(info, 'thyroid/parathyroid module must be shipped')
assert.ok(parts.length >= 7, 'thyroid module must expose thyroid, parathyroid and regional source anatomy')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every rendered thyroid-module structure must carry positive indexed triangles')
assert.ok(triangles > 0, 'thyroid module must contain source-backed indexed geometry')
assert.deepEqual(sources, ['z-anatomy'], 'thyroid specialty geometry must retain its Z-Anatomy source identity')

assert.ok(names.some((name) => name.includes('thyroid gland')), 'thyroid gland source geometry must be present')
assert.ok(names.filter((name) => name.includes('parathyroid')).length >= 4, 'all four parathyroid source structures must be represented')
assert.ok(names.some((name) => name.includes('trachea')), 'regional tracheal source geometry must remain available for orientation')
assert.ok(names.some((name) => name.includes('oesophagus') || name.includes('esophagus')), 'regional oesophageal source geometry must remain available for orientation')

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'specialty atlas must remain reachable from Body Exposure')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'specialty atlas tab must remain user-reachable')
assert.match(specialty, /Endocrine.*\['endokrin', 'tiroid'\]/, 'thyroid module must remain reachable from the Endocrine selector')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'selected specialty module must load its shipped GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'viewer metadata must come from generated shipped-atlas metadata')
assert.match(specialty, /SUMBER\[asal\]/, 'source provenance must remain visible beside the module')
assert.match(specialty, /Thyroid gland, all four parathyroids/, 'UI must retain the explicit thyroid/parathyroid anatomy disclosure')
assert.match(viewer, /body3dPixelRatio/, 'shared specialty renderer must bound mobile pixel ratio')
assert.match(viewer, /IntersectionObserver/, 'shared specialty renderer must pause when offscreen')
assert.match(viewer, /visibilitychange/, 'shared specialty renderer must pause in background tabs')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'picking must remain restricted to verified source metadata')

assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'specialty atlas must not synthesize replacement thyroid geometry')

console.log(`Thyroid/endocrine source 3D gate: ${parts.length} exact structures, ${triangles.toLocaleString()} indexed triangles, source=${sources.join(',')}, reachable shipped GLB WebGL and mobile lifecycle locked.`)
