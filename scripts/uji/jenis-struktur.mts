import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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
assert.equal(jenisDariNamaStruktur('Rib').startsWith('a bone'), true)
assert.equal(jenisDariNamaStruktur('Costal cartilage').startsWith('cartilage'), true)
assert.equal(jenisDariNamaStruktur('Cartilage of eighth rib').startsWith('cartilage'), true)
const male = JSON.parse(readFileSync(new URL('../../public/bodyexposure/adult_male.index.json', import.meta.url), 'utf8')) as string[][]
const costal = male.filter(row => /cartilage/i.test(row[1]) && /rib|costa/i.test(row[1]))
assert.equal(costal.length, 20, 'the published source contains twenty costal-cartilage structures')
for (const [id, name] of costal) assert.equal(jenisDariNamaStruktur(name).startsWith('cartilage'), true, id)
const female = JSON.parse(readFileSync(new URL('../../public/bodyexposure/adult_female_main_bronchi_reference.index.json', import.meta.url), 'utf8')) as string[][]
const bronchiCartilage = female.filter(row => /cartilage/i.test(row[1]))
assert.equal(bronchiCartilage.length, 2)
for (const [id, name] of bronchiCartilage) assert.equal(jenisDariNamaStruktur(name).startsWith('cartilage'), true, id)

console.log('jenis-struktur: atlas names keep their tissue class, and a blank name stays blank')
