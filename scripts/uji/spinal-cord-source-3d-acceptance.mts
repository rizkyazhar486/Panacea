import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const atlasGenerator = await readFile(new URL('../atlasSystem.mjs', import.meta.url), 'utf8')

const moduleId = 'medula-spinalis'
const info = ATLAS_MODULE_INFO[moduleId]
const parts = partsForModule(moduleId)
const sources = [...new Set(parts.map((part) => part.source))]
const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)

assert.ok(info, 'spinal-cord atlas module must be generated')
assert.ok(parts.length > 0, 'spinal-cord module must expose source-backed reference geometry')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every spinal-cord structure must have positive indexed source geometry')
assert.ok(triangles > 0, 'spinal-cord module must expose positive indexed geometry')
assert.deepEqual(sources, ['hra-female'], 'spinal-cord geometry must retain HuBMAP HRA female-reference provenance')
assert.match(atlasGenerator, /'medula-spinalis':\s*\{[\s\S]*?asal: 'hra-female'/, 'spinal-cord generator must keep its HRA female-reference source boundary explicit')
assert.match(atlasGenerator, /VH_F_Spinal_Cord\.glb/, 'spinal-cord generator must retain the registered HRA spinal-cord source asset')

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'Body Exposure must keep the specialty atlas reachable')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'Body Exposure must keep specialty navigation reachable')
assert.match(specialty, /Neuro & senses.*\['neurologi', 'medula-spinalis', 'mata', 'tht', 'telinga'\]/, 'spinal-cord module must remain reachable from Neuro & senses')
assert.match(specialty, /'medula-spinalis':\s*\n?\s*'Every cord segment from C1 to S4/, 'spinal-cord module must state its bounded source-resolution scope')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'specialty atlas must load the shipped module GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'specialty atlas must use generated source metadata')
assert.match(specialty, /SUMBER\[asal\]/, 'specialty atlas must visibly expose provenance')
assert.match(specialty, /'hra-female': 'HuBMAP Human Reference Atlas, female reference body \(CC BY 4\.0\)'/, 'visible provenance must identify the HRA female reference and license')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'spinal-cord acceptance must not depend on synthetic primitive anatomy')

// Resolution boundary: this contract verifies registered gross reference geometry,
// reachability and provenance only. It does not assert microscopic tracts, lesion
// localization, imaging interpretation, diagnosis, treatment, patient-specific
// anatomy, procedural targets, or qualified human review.
console.log(`spinal-cord source 3D acceptance passed: ${parts.length} structures, ${triangles} triangles, source=${sources.join(',')}`)
