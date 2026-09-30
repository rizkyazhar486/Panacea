import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const atlasGenerator = await readFile(new URL('../atlasSystem.mjs', import.meta.url), 'utf8')

const moduleId = 'payudara'
const info = ATLAS_MODULE_INFO[moduleId]
const parts = partsForModule(moduleId)
const names = parts.map((part) => part.name.toLowerCase())
const sources = [...new Set(parts.map((part) => part.source))]
const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)

assert.ok(info, 'breast atlas module must be generated')
assert.ok(parts.length >= 2, 'breast module must preserve source-backed bilateral reference geometry')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every breast structure must have positive indexed source geometry')
assert.ok(triangles > 0, 'breast module must expose positive indexed geometry')
assert.deepEqual(sources, ['hra-female'], 'breast geometry must retain HuBMAP HRA female-reference provenance')
assert.match(atlasGenerator, /payudara:\s*\{[\s\S]*?asal: 'hra-female'/, 'breast generator must keep the female-reference source boundary explicit')
assert.match(atlasGenerator, /VH_F_mammary_gland_L\.glb/, 'breast generator must retain the left HRA mammary-gland source asset')
assert.match(atlasGenerator, /VH_F_mammary_gland_R\.glb/, 'breast generator must retain the right HRA mammary-gland source asset')
assert.ok(names.some((name) => name.includes('left') || name.includes('_l') || name.includes(' l')), 'breast module must retain left-sided source context')
assert.ok(names.some((name) => name.includes('right') || name.includes('_r') || name.includes(' r')), 'breast module must retain right-sided source context')

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'Body Exposure must keep the specialty atlas reachable')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'Body Exposure must keep specialty navigation reachable')
assert.match(specialty, /Women’s health.*\['obstetri', 'obgin', 'payudara'\]/, 'breast module must remain reachable from Women’s health')
assert.match(specialty, /payudara:\s*\n?\s*'Nipple, areola, mammary lobes, lactiferous ducts/, 'breast module must state its bounded source-resolution scope')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'specialty atlas must load the shipped module GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'specialty atlas must use generated source metadata')
assert.match(specialty, /SUMBER\[asal\]/, 'specialty atlas must visibly expose provenance')
assert.match(specialty, /'hra-female': 'HuBMAP Human Reference Atlas, female reference body \(CC BY 4\.0\)'/, 'visible provenance must identify the HRA female reference and license')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'breast acceptance must not depend on synthetic primitive anatomy')

// Resolution boundary: this contract covers registered gross reference geometry
// and provenance only. It does not assert histology, lesion localization,
// imaging interpretation, diagnosis, treatment, patient-specific anatomy, or
// qualified human review beyond what the source registry actually records.
console.log(`breast source 3D acceptance passed: ${parts.length} structures, ${triangles} triangles, source=${sources.join(',')}`)
