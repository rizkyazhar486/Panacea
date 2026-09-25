import assert from 'node:assert/strict'
import { bolehAksesPasien, saringKlinis, idPasienDiri } from '../src/aksesKlinis.js'

const pasien = { id: 'u1', email: 'budi.santoso@example.com', role: 'pasien' }
const lain = { id: 'u2', email: 'ani@example.com', role: 'pasien' }
const dokter = { id: 'd1', email: 'dr@example.com', role: 'dokter' }
const diri = idPasienDiri(pasien.email)
const pemilikRekam = (pid: string) => (pid === diri ? { id: 'u1' } : pid === idPasienDiri(lain.email) ? { id: 'u2' } : undefined)

assert.equal(bolehAksesPasien(pasien, diri, false, pemilikRekam), true)
assert.equal(bolehAksesPasien(pasien, idPasienDiri(lain.email), false, pemilikRekam), false, 'pasien dapat mengakses rekam pasien lain')
assert.equal(bolehAksesPasien(pasien, 'p-clinic-001', false, pemilikRekam), false, 'pasien dapat mengakses pasien praktik')
assert.equal(bolehAksesPasien(dokter, 'p-clinic-001', false, pemilikRekam), true)
assert.equal(bolehAksesPasien({ ...lain, id: 'u9' }, idPasienDiri(lain.email), false, pemilikRekam), false, 'tabrakan id rekam diri tidak gagal tertutup')
assert.equal(bolehAksesPasien(pasien, '', false, pemilikRekam), false)
assert.equal(bolehAksesPasien(pasien, 'p-clinic-001', true, pemilikRekam), true, 'pemilik (owner) harus melihat data praktik')

const c = {
  patients: [{ id: diri, name: 'Budi' }, { id: 'p-clinic-001', name: 'Other' }],
  vitals: { [diri]: [{ sbp: 120 }], 'p-clinic-001': [{ sbp: 150 }] },
  supportive: { 'p-clinic-001': [{}] }, records: { 'p-clinic-001': { dx: 'x' } }, education: {},
}
const s = saringKlinis(c, (pid) => bolehAksesPasien(pasien, pid, false, pemilikRekam))
assert.deepEqual(s.patients.map((p) => p.id), [diri])
assert.deepEqual(Object.keys(s.vitals), [diri]); assert.deepEqual(s.records, {}); assert.deepEqual(s.supportive, {})
console.log('aksesKlinis: pasien hanya rekam dirinya, tabrakan id gagal tertutup, klinisi/pemilik data praktik')
