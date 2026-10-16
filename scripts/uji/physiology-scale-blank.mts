// C2: penjelajah fisiologi tidak menghitung dari kolom kosong dan tidak mengisi bawaan diam-diam.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const { parseScaleInput: ps, scaleResult: sr, SCALE_KEYS } = await import('../../src/components/digital-twin/physiologyScaleInputs.ts')
const base = { hb: '15', saO2: '98', paO2: '95', svO2: '75', pvO2: '40', cardiacOutput: '5', potassiumOutside: '4', potassiumInside: '140', bicarbonate: '24', paCO2: '40' } as any
const r = sr(base)
for (const [k, v] of Object.entries(r)) assert.ok(typeof v === 'number' && Number.isFinite(v), `${k} dihitung dari nilai bawaan`)
assert.ok(Math.abs(r.pH! - 7.4) < 0.05, 'pH ≈ 7,4 dari 24/40')
assert.equal(ps('hb', '0'), 0, 'nol diketik = nol sungguhan')
for (const k of SCALE_KEYS) for (const bad of ['', ' ', 'abc', 'NaN', 'Infinity', '-1', '1e9', undefined, 3]) assert.equal(ps(k, bad as any), undefined, `${k} ${JSON.stringify(bad)}`)
assert.equal(ps('bicarbonate', '0'), undefined, 'pembagi tidak boleh 0'); assert.equal(ps('paCO2', '0'), undefined)
// Tiap keluaran hanya bergantung pada masukannya sendiri.
let x = sr({ ...base, bicarbonate: '' }); assert.equal(x.pH, null); assert.notEqual(x.caO2, null); assert.notEqual(x.kNernst, null)
x = sr({ ...base, paCO2: '' }); assert.equal(x.pH, null)
x = sr({ ...base, potassiumInside: '' }); assert.equal(x.kNernst, null); assert.notEqual(x.pH, null)
x = sr({ ...base, potassiumOutside: '' }); assert.equal(x.kNernst, null)
x = sr({ ...base, hb: '' }); assert.deepEqual([x.caO2, x.cvO2, x.vo2, x.extraction], [null, null, null, null])
x = sr({ ...base, saO2: '' }); assert.equal(x.caO2, null); assert.notEqual(x.cvO2, null); assert.equal(x.vo2, null); assert.equal(x.extraction, null)
x = sr({ ...base, svO2: '' }); assert.equal(x.cvO2, null); assert.notEqual(x.caO2, null); assert.equal(x.extraction, null)
x = sr({ ...base, pvO2: '' }); assert.equal(x.cvO2, null)
x = sr({ ...base, paO2: '' }); assert.equal(x.caO2, null)
x = sr({ ...base, cardiacOutput: '' }); assert.equal(x.vo2, null); assert.notEqual(x.extraction, null)
const page = readFileSync('src/components/digital-twin/PhysiologyScaleExplorer.tsx', 'utf8')
assert.doesNotMatch(page, /onChange\(Number\(event\.target\.value\)\)/); assert.match(page, /scaleResult\(inputs\)/); assert.match(page, /v === null \? '—'/)
console.log('physiology-scale-blank: ok')
