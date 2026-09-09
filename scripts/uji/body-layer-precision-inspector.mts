import assert from 'node:assert/strict'
import fs from 'node:fs'
import { INDEKS_TUBUH } from '../../src/lib/bodySearch.ts'
import { layerPrecisionForStructure } from '../../src/lib/anatomy/layerPrecision.ts'

const source = fs.readFileSync('src/pages/bodyhub/LayerPrecisionInspector.tsx', 'utf8')

assert.match(source, /layerPrecisionForStructure/)
assert.match(source, /Reveal source layer/)
assert.match(source, /Depth stage/)
assert.match(source, /Categorical layer order, not a physical depth/)
assert.match(source, /Physical scale: not calibrated/)
assert.match(source, /coordinate-derived navigation hint, not a curated anatomical-region assertion/)
assert.match(source, /member\.exactMeshName/)
assert.match(source, /member\.normalizedHeight/)
assert.match(source, /member\.normalizedRadialDistance/)
assert.match(source, /member\.triangles/)
assert.doesNotMatch(source, /Math\.random\(/)
assert.doesNotMatch(source, /fetch\(/)

const sample = INDEKS_TUBUH.find((entry) => entry.s !== 'tengah') ?? INDEKS_TUBUH[0]
assert.ok(sample, 'source index must provide at least one inspectable mesh')
const precision = layerPrecisionForStructure(sample)
assert.equal(precision.identityPrecision, 'exact-source-mesh')
assert.equal(precision.physicallyCalibrated, false)
assert.equal(precision.physicalUnit, null)
assert.ok(precision.exactMeshNames.includes(sample.n))
assert.ok(precision.members.every((member) => member.regionMethod === 'normalized-coordinate-heuristic'))

console.log('Layer Precision Inspector keeps exact source identity visible while physical scale and derived-region boundaries remain fail-closed.')
