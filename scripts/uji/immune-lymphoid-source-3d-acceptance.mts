import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../../src/components/AtlasViewer3D.tsx', import.meta.url), 'utf8')

const moduleId = 'imunologi'
const info = ATLAS_MODULE_INFO[moduleId]
const parts = partsForModule(moduleId)
const names = parts.map((part) => part.name.toLowerCase())
const sources = [...new Set(parts.map((part) => part.source))]
const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)

assert.ok(info, 'immune/lymphoid atlas module must be generated')
assert.equal(parts.length, 7, 'immune/lymphoid module must preserve its seven source-backed structures')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every immune structure must have positive indexed source geometry')
assert.ok(triangles > 0, 'immune/lymphoid module must expose positive triangle geometry')
assert.deepEqual(sources, ['bodyparts3d'], 'immune/lymphoid geometry must retain BodyParts3D provenance')

assert.ok(names.includes('spleen'), 'immune atlas must expose the source-backed spleen')
assert.ok(names.includes('left lobe of thymus'), 'immune atlas must expose the source-backed left thymic lobe')
assert.ok(names.includes('right lobe of thymus'), 'immune atlas must expose the source-backed right thymic lobe')
assert.ok(names.includes('left femur') && names.includes('right femur'), 'immune atlas must preserve bilateral femoral marrow-site context')
assert.ok(names.includes('left hip bone') && names.includes('right hip bone'), 'immune atlas must preserve bilateral pelvic marrow-site context')
assert.ok(!names.some((name) => name.includes('bone marrow') || name.includes('lymph node')), 'acceptance must not fabricate marrow or lymph-node meshes absent from source geometry')

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'Body Exposure must keep the specialty atlas reachable')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'Body Exposure must keep the specialty navigation entry reachable')
assert.match(specialty, /Systemic.*\['imunologi', 'kulit'\]/, 'immune/lymphoid module must stay reachable from the systemic atlas group')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'specialty atlas must load the shipped module GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'specialty atlas must use generated source metadata for selectable geometry')
assert.match(specialty, /SUMBER\[asal\]/, 'specialty atlas must visibly expose source provenance')
assert.match(specialty, /Bone marrow is shown at its major adult sites.*marrow itself has no separate mesh/, 'immune atlas must disclose that marrow itself has no separate mesh')

assert.match(viewer, /body3dPixelRatio/, 'viewer must keep bounded mobile pixel-ratio behavior')
assert.match(viewer, /IntersectionObserver/, 'viewer must suspend rendering when offscreen')
assert.match(viewer, /visibilitychange/, 'viewer must suspend rendering while the document is hidden')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'viewer must limit picking to verified metadata-backed meshes')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'immune acceptance must not depend on synthetic primitive anatomy')

console.log(`immune/lymphoid source 3D acceptance passed: ${parts.length} structures, ${triangles} triangles, source=${sources.join(',')}`)
