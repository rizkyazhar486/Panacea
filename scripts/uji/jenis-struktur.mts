import assert from 'node:assert/strict'
import { jenisDariNamaStruktur } from '../../src/domains/body-exposure/engine/jenisStruktur.ts'

assert.equal(
  jenisDariNamaStruktur('Middle lobe of right lung'),
  'part of the respiratory tract — it conducts air or forms a gas-exchange surface',
)
assert.equal(jenisDariNamaStruktur('Pulmonary vein'), 'a vein — it returns blood towards the heart, at low pressure, and usually has valves')
assert.equal(jenisDariNamaStruktur(''), '')
assert.equal(jenisDariNamaStruktur('   '), '')
assert.equal(jenisDariNamaStruktur('unknown mesh'), 'an anatomical structure in the human body')
assert.equal(jenisDariNamaStruktur('Femur.r').startsWith('a bone'), true)

console.log('jenis-struktur: atlas names keep their tissue class, and a blank name stays blank')
