import assert from 'node:assert/strict'
import { parseFieldNumber, deadSpacePanel, shuntPanel } from '../../src/domains/physiology/engine/gasIdentityPanel.ts'

// parseFieldNumber — kosong BUKAN nol; hanya angka desimal biasa
assert.deepEqual(parseFieldNumber(''), { state: 'missing' })
assert.deepEqual(parseFieldNumber('   '), { state: 'missing' })
assert.deepEqual(parseFieldNumber('0'), { state: 'ok', value: 0 })          // nol yang diketik adalah nilai; kosong bukan
assert.deepEqual(parseFieldNumber('40'), { state: 'ok', value: 40 })
assert.deepEqual(parseFieldNumber(' 5,3 '), { state: 'ok', value: 5.3 })    // koma desimal Indonesia
assert.deepEqual(parseFieldNumber('5.3'), { state: 'ok', value: 5.3 })
assert.deepEqual(parseFieldNumber('-1'), { state: 'ok', value: -1 })        // diteruskan ke mesin, yang menolaknya dengan alasan
for (const bad of ['abc', '1e3', '1 000', '5,3,1', '4.', '.5', 'NaN', 'Infinity', '--1', '0x10', '1,000.5']) assert.deepEqual(parseFieldNumber(bad), { state: 'invalid' }, bad)

// dead space — positif tepat, kosong tidak dihitung, tak sah tidak dihitung, ditolak mesin tanpa jepit
const ok = deadSpacePanel('40', '28'); assert.equal(ok.status, 'ok')
if (ok.status === 'ok') {
  assert.equal(ok.fraction, 0.3); assert.equal(ok.result.truthClass, 'derived')
  assert.equal(ok.segments[0].fraction + ok.segments[1].fraction, 1)
  assert.deepEqual(ok.segments.map((s) => s.label), ['Dead space (VD)', 'Alveolar share (VT − VD)'])
}
assert.deepEqual(deadSpacePanel('', '28'), { status: 'incomplete', missing: ['PaCO₂'] })
assert.deepEqual(deadSpacePanel('40', ''), { status: 'incomplete', missing: ['Mixed expired PCO₂'] })
assert.deepEqual(deadSpacePanel('', ''), { status: 'incomplete', missing: ['PaCO₂', 'Mixed expired PCO₂'] })
assert.deepEqual(deadSpacePanel('4o', '28'), { status: 'invalid-field', fields: ['PaCO₂'] })   // tak sah mengalahkan kosong: pesan jujur soal kolom yang salah ketik
assert.equal(deadSpacePanel('40', '40').status, 'ok')                                           // batas: sama persis
assert.equal((deadSpacePanel('40', '40') as { fraction: number }).fraction, 0)
const above = deadSpacePanel('40', '40.01'); assert.equal(above.status, 'rejected')
if (above.status === 'rejected') assert.equal(above.reason, 'impossible-combination')
const zero = deadSpacePanel('0', '0'); assert.equal(zero.status, 'rejected')
if (zero.status === 'rejected') assert.equal(zero.reason, 'invalid-input')
assert.equal((deadSpacePanel('5,3', '3,71') as { fraction: number }).fraction, (5.3 - 3.71) / 5.3)    // kPa dengan koma
assert.equal((deadSpacePanel('40', '0') as { fraction: number }).fraction, 1)                            // PēCO₂ 0 yang DIKETIK dihitung (bukan dianggap kosong)

// shunt
const sh = shuntPanel('20', '18', '14'); assert.equal(sh.status, 'ok')
if (sh.status === 'ok') { assert.ok(Math.abs(sh.fraction - 1 / 3) < 1e-12); assert.deepEqual(sh.result.sourcePmids, ['8599295', '964271']) }
assert.deepEqual(shuntPanel('20', '', '14'), { status: 'incomplete', missing: ['CaO₂'] })
assert.deepEqual(shuntPanel('', '', ''), { status: 'incomplete', missing: ['CcO₂', 'CaO₂', 'CvO₂'] })
assert.deepEqual(shuntPanel('20', 'x', 'y'), { status: 'invalid-field', fields: ['CaO₂', 'CvO₂'] })
for (const [c, a, v] of [['20', '20.01', '14'], ['20', '13.99', '14'], ['14', '14', '14']] as const) assert.equal(shuntPanel(c, a, v).status, 'rejected', `${c},${a},${v}`)
assert.equal((shuntPanel('20', '20', '14') as { fraction: number }).fraction, 0)
assert.equal((shuntPanel('20', '14', '14') as { fraction: number }).fraction, 1)

// kemurnian dan tanpa angka klinis tersembunyi
import { readFileSync } from 'node:fs'
const sumber = readFileSync(new URL('../../src/domains/physiology/engine/gasIdentityPanel.ts', import.meta.url), 'utf8')
for (const terlarang of ['Date.now(', 'Math.random(', 'fetch(', 'document.', 'window.', 'localStorage', 'sessionStorage']) assert.ok(!sumber.includes(terlarang), terlarang)
// determinisme: dua kali jalan, hasil identik
assert.deepEqual(deadSpacePanel('40', '28'), deadSpacePanel('40', '28'))
console.log('gas-identity-panel: kolom kosong tidak pernah menjadi nol, masukan tak sah dan mustahil ditolak dengan alasan, hasil tepat')
