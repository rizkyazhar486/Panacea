import assert from 'node:assert/strict'
import { bolehAksesPasien, saringKlinis, idPasienDiri, idPasienDiriLegacy } from '../src/aksesKlinis.js'

const pasien = { id: 'u1', email: 'budi.santoso@example.com', role: 'pasien' }
const lain = { id: 'u2', email: 'ani@example.com', role: 'pasien' }
const dokter = { id: 'd1', email: 'dr@example.com', role: 'dokter' }
const diri = idPasienDiri(pasien.id)
const diriLegacy = idPasienDiriLegacy(pasien.email)
const lainId = idPasienDiri(lain.id)
const lainLegacy = idPasienDiriLegacy(lain.email)
const pemilikRekam = (pid: string) =>
  pid === diri || pid === diriLegacy ? { id: 'u1' }
  : pid === lainId || pid === lainLegacy ? { id: 'u2' }
  : undefined

assert.equal(bolehAksesPasien(pasien, diri, false, pemilikRekam), true)
assert.equal(bolehAksesPasien(pasien, diriLegacy, false, pemilikRekam), true, 'rekam legacy milik sendiri harus tetap dapat dibaca saat migrasi')
assert.equal(bolehAksesPasien(pasien, lainId, false, pemilikRekam), false, 'pasien dapat mengakses rekam stabil pasien lain')
assert.equal(bolehAksesPasien(pasien, lainLegacy, false, pemilikRekam), false, 'pasien dapat mengakses rekam legacy pasien lain')
assert.equal(bolehAksesPasien(pasien, 'p-clinic-001', false, pemilikRekam), false, 'pasien dapat mengakses pasien praktik')
assert.equal(bolehAksesPasien(dokter, 'p-clinic-001', false, pemilikRekam), true)
assert.equal(bolehAksesPasien({ ...lain, id: 'u9' }, lainLegacy, false, pemilikRekam), false, 'tabrakan id rekam diri legacy tidak gagal tertutup')
assert.equal(bolehAksesPasien({ ...pasien, email: 'alamat-baru@example.com' }, diri, false, pemilikRekam), true, 'id stabil putus saat email berubah')
assert.equal(bolehAksesPasien({ ...pasien, email: 'alamat-baru@example.com' }, diriLegacy, false, pemilikRekam), false, 'alias email lama tidak boleh menjadi identitas primer setelah email berubah')
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
console.log('aksesKlinis: id rekam diri stabil terhadap perubahan email, legacy kompatibel, tabrakan gagal tertutup')
