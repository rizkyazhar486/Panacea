import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { searchStructures } from '../../src/domains/body-exposure/engine/structureSearch.ts'

const rows = [
  ['B.KIDNEY.L', 'kidney', 'left', 'urinary'],
  ['B.KIDNEY.R', 'kidney', 'right', 'urinary'],
  ['B.FAT.L', 'mammary fat', 'left', 'reproductive'],
  ['B.CORD', 'spinal cord', 'unpaired', 'nervous'],
]
const ontology = { 'B.FAT.L': { id: 'FMA:73166', label: 'Interlobar adipose tissue of left mammary gland' } }

test('existing name and semantic ID search retain structure identity', () => {
  assert.deepEqual(searchStructures(rows, ' kidney '), [
    { id: 'B.KIDNEY.L', name: 'kidney (left)', system: 'urinary' },
    { id: 'B.KIDNEY.R', name: 'kidney (right)', system: 'urinary' },
  ])
  assert.deepEqual(searchStructures(rows, 'b.cord').map(r => r.id), ['B.CORD'])
})

test('word order and laterality constrain a multi-term search', () => {
  for (const query of ['left kidney', 'kidney LEFT', ' kidney   left ']) assert.deepEqual(searchStructures(rows, query).map(r => r.id), ['B.KIDNEY.L'])
  assert.deepEqual(searchStructures(rows, 'right kidney').map(r => r.id), ['B.KIDNEY.R'])
  assert.deepEqual(searchStructures(rows, 'right mammary'), [])
})

test('ontology identifiers and source labels resolve only mapped structures', () => {
  for (const query of ['fma:73166', 'INTERLOBAR adipose', 'left adipose']) assert.deepEqual(searchStructures(rows, query, ontology).map(r => r.id), ['B.FAT.L'])
  assert.deepEqual(searchStructures(rows, 'FMA:73166'), [])
  assert.deepEqual(searchStructures(rows, 'UBERON:9999999', ontology), [])
})

test('exact identifiers rank above partial identifiers regardless of source order', () => {
  const index = [['B.PART', 'other', 'unpaired', 'x'], ['B.EXACT', 'organ', 'unpaired', 'x']]
  const mapping = { 'B.PART': { id: 'FMA:731660', label: 'other' }, 'B.EXACT': { id: 'FMA:73166', label: 'organ' } }
  assert.deepEqual(searchStructures(index, 'FMA:73166', mapping, 1).map(r => r.id), ['B.EXACT'])
})

test('empty, short, oversized queries and invalid limits return no matches', () => {
  for (const q of ['', ' ', 'k', 'k'.repeat(257)]) assert.deepEqual(searchStructures(rows, q, ontology), [])
  for (const limit of [0, -1, 51, 1.5, NaN, Infinity]) assert.deepEqual(searchStructures(rows, 'kidney', ontology, limit), [])
  assert.equal(searchStructures(rows, 'kidney', ontology, 1).length, 1)
  assert.equal(searchStructures(rows, 'kidney', ontology, 50).length, 2)
})

test('diacritics are searchable and no source objects are mutated', () => {
  const index = [['B.OVARY', 'ovário', 'left', 'reproductive']]
  const before = JSON.stringify({ index, ontology })
  assert.deepEqual(searchStructures(index, 'ovario LEFT', ontology).map(r => r.id), ['B.OVARY'])
  assert.equal(JSON.stringify({ index, ontology }), before)
})

test('actual female crosswalk identifiers select their existing anatomical structures', () => {
  const index = JSON.parse(readFileSync('public/bodyexposure/adult_female.index.json'))
  const source = JSON.parse(readFileSync('public/bodyexposure/ontology.adult_female.json'))
  for (const [id, entry] of Object.entries(source.map)) {
    const matches = searchStructures(index, entry.id, source.map, 50)
    assert.ok(matches.some(match => match.id === id), `${entry.id}: ${id}`)
  }
})
