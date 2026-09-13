import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { idTurKelenjar, langkahTurKelenjar, posisiTurKelenjar } from '../../src/lib/anatomy/kelenjarSaluranTour.ts'
import { STRUKTUR_KELENJAR } from '../../src/lib/anatomy/kelenjarSaluran.ts'

const urinary = idTurKelenjar('urinary')
const endocrine = idTurKelenjar('endocrine')

assert.deepEqual(urinary, ['kidney', 'renal-pelvis', 'ureter', 'bladder', 'urethra'])
assert.ok(endocrine.length > 0)

const canonicalIds = new Set(STRUKTUR_KELENJAR.map((struktur) => struktur.id))
for (const id of [...urinary, ...endocrine]) assert.ok(canonicalIds.has(id), `unknown guided-tour id: ${id}`)

assert.equal(langkahTurKelenjar('urinary', null, 1), 'kidney')
assert.equal(langkahTurKelenjar('urinary', null, -1), 'urethra')
assert.equal(langkahTurKelenjar('urinary', 'kidney', -1), 'urethra')
assert.equal(langkahTurKelenjar('urinary', 'urethra', 1), 'kidney')
assert.equal(langkahTurKelenjar('urinary', 'not-a-structure', 1), 'kidney')
assert.equal(langkahTurKelenjar('endocrine', 'not-a-structure', -1), endocrine[endocrine.length - 1])

assert.deepEqual(posisiTurKelenjar('urinary', 'kidney'), { indeks: 1, jumlah: 5 })
assert.deepEqual(posisiTurKelenjar('urinary', null), { indeks: 0, jumlah: 5 })

const panelSource = readFileSync(new URL('../../src/pages/bodyhub/KelenjarSaluranPanel.tsx', import.meta.url), 'utf8')
assert.match(panelSource, /Guided 3D tour/)
assert.match(panelSource, /Urinary path/)
assert.match(panelSource, /Endocrine glands/)
assert.match(panelSource, />\s*Previous\s*</)
assert.match(panelSource, />\s*Next\s*</)
assert.match(panelSource, /Navigation only/)
assert.match(panelSource, /does not encode urine transit time/)
assert.match(panelSource, /KelenjarSaluran3D terpilih=\{terpilih\}/)

console.log('gland / urinary guided 3D navigation: ok')
