import assert from 'node:assert/strict'
import { namaBagianAtlas } from '../../src/domains/body-exposure/engine/namaBagianAtlas.ts'

assert.equal(namaBagianAtlas('Middle lobe of right lung'), 'Middle lobe of right lung')
assert.equal(namaBagianAtlas('Femur.r'), 'Femur (right)')
assert.equal(namaBagianAtlas('femur.l'), 'Femur (left)')
assert.equal(namaBagianAtlas(''), '')
assert.equal(namaBagianAtlas('   '), '')
assert.equal(namaBagianAtlas('tripo_node_abc'), '')
assert.equal(namaBagianAtlas('tripo node abc'), '')
assert.equal(namaBagianAtlas('a'), 'A', 'a one-letter mesh name is kept, not invented into an organ')

console.log('nama-bagian-atlas: a named mesh is shown; an AI mesh name is refused')
