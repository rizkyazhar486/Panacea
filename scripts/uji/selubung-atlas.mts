import assert from 'node:assert/strict'
import { selubungAtlas } from '../../src/domains/body-exposure/engine/selubungAtlas.ts'

assert.equal(selubungAtlas('Pleura'), true)
assert.equal(selubungAtlas('visceral pleura'), true)
assert.equal(selubungAtlas('Superior lobe of left lung'), false)
assert.equal(selubungAtlas('Pleural cavity'), false, 'a pleural space is not the covering mesh')
assert.equal(selubungAtlas(''), false)
assert.equal(selubungAtlas('   '), false)
assert.equal(selubungAtlas('pleura'), true)

console.log('selubung-atlas: pleura is a covering shell; a lung lobe is not')
