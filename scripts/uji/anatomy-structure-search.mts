import assert from 'node:assert/strict'
import { ATLAS_PARTS } from '../../src/lib/systemAtlas.gen.ts'
import { CARDIO_PARTS } from '../../src/lib/cardioAtlas.gen.ts'
import { cariStrukturAtlas, cakupanStrukturAtlas } from '../../src/lib/anatomyStructureSearch.ts'
import fs from 'node:fs'

const scope = cakupanStrukturAtlas()
assert.equal(scope.struktur, ATLAS_PARTS.length + CARDIO_PARTS.length)
assert.ok(scope.modul > 1)

const specialty = ATLAS_PARTS[0]
assert.ok(specialty, 'specialty atlas must contain at least one named structure')
const specialtyQuery = specialty.name.trim().split(/\s+/).slice(0, 2).join(' ')
const specialtyHit = cariStrukturAtlas(specialtyQuery, 100).find(
  (h) => h.module === specialty.module && h.name === specialty.name,
)
assert.ok(specialtyHit, `expected specialty structure to be searchable: ${specialty.name}`)

const cardio = CARDIO_PARTS[0]
assert.ok(cardio, 'cardio atlas must contain at least one named structure')
const cardioQuery = cardio.name.trim().split(/\s+/).slice(0, 2).join(' ')
const cardioHit = cariStrukturAtlas(cardioQuery, 100).find(
  (h) => h.module === 'cardio' && h.name === cardio.name,
)
assert.ok(cardioHit, `expected cardio structure to be searchable: ${cardio.name}`)

assert.deepEqual(cariStrukturAtlas(''), [])
assert.deepEqual(cariStrukturAtlas('x'), [])

const finder = fs.readFileSync('src/pages/bodyhub/StructureFinder.tsx', 'utf8')
assert.match(finder, /cariStrukturAtlas/)
assert.match(finder, /AtlasViewer3D/)
assert.match(finder, /CardioAtlas3D/)
assert.match(finder, /dipilih=\{atlasDipilih\.name\}/)
assert.doesNotMatch(finder, /fallback.*structure/i)

console.log('Unified whole-body + specialty structure search guards verified.')
