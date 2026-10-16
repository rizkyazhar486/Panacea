// F1: penugasan staf — logika murni (positif, negatif, batas, determinisme).
import assert from 'node:assert/strict'
import { validasiPenugasan, pasienDitugaskan, kunciPenugasan, MAKS_ID_PENUGASAN } from '../src/modules/labResults/domain/penugasanStaf.ts'

const ok = { role: 'perawat', verified: true }
// positif
assert.deepEqual(validasiPenugasan({ staffId: 'u1', patientId: 'p1' }, ok), { ok: true, staffId: 'u1', patientId: 'p1' })
assert.equal(validasiPenugasan({ staffId: 'u1', patientId: 'p1' }, { role: 'lab', verified: true }).ok, true)
// negatif berpasangan: hanya satu kondisi yang berbeda dari kasus positif
const tolak = (m: any, s: any) => { const r = validasiPenugasan(m, s); assert.equal(r.ok, false); return (r as any).alasan }
assert.equal(tolak({ staffId: 'u1', patientId: 'p1' }, undefined), 'staff-not-found')
assert.equal(tolak({ staffId: 'u1', patientId: 'p1' }, { role: 'perawat', verified: false }), 'staff-not-verified')
for (const peran of ['pasien', 'dokter', 'kontributor', 'verifikator', 'admin', 'owner', '']) assert.equal(tolak({ staffId: 'u1', patientId: 'p1' }, { role: peran, verified: true }), 'staff-role-invalid', peran)
for (const bad of [undefined, null, '', ' ', 'a|b', ' p1', 'p1 ', 12, {}, [], 'x'.repeat(MAKS_ID_PENUGASAN + 1)]) {
  assert.equal(tolak({ staffId: bad, patientId: 'p1' }, ok), 'invalid-input', `staffId ${String(bad)}`)
  assert.equal(tolak({ staffId: 'u1', patientId: bad }, ok), 'invalid-input', `patientId ${String(bad)}`)
}
// batas panjang id
assert.equal(validasiPenugasan({ staffId: 'x'.repeat(MAKS_ID_PENUGASAN), patientId: 'p1' }, ok).ok, true)
// kunci tidak bertabrakan karena '|' ditolak pada id
assert.notEqual(kunciPenugasan('a', 'b'), kunciPenugasan('a|b', ''))
// pasienDitugaskan: hanya milik staf itu, terurut, kosong bila tidak ada
const peta = {
  [kunciPenugasan('u1', 'p2')]: { staffId: 'u1', patientId: 'p2', oleh: 'd', pada: 't' },
  [kunciPenugasan('u1', 'p1')]: { staffId: 'u1', patientId: 'p1', oleh: 'd', pada: 't' },
  [kunciPenugasan('u2', 'p3')]: { staffId: 'u2', patientId: 'p3', oleh: 'd', pada: 't' },
}
assert.deepEqual(pasienDitugaskan(peta, 'u1'), ['p1', 'p2'])
assert.deepEqual(pasienDitugaskan(peta, 'u2'), ['p3'])
assert.deepEqual(pasienDitugaskan(peta, 'u3'), [])
assert.deepEqual(pasienDitugaskan({}, 'u1'), [])
assert.deepEqual(pasienDitugaskan(peta, 'u1'), pasienDitugaskan(peta, 'u1'))
console.log('penugasanStaf: ok')
