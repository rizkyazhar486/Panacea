// Pasien dari server dengan field array hilang pernah menjatuhkan seluruh Shell
// (activePatient.riskFlags.map). Batas masuk menormalisasi tanpa mengarang nilai klinis.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { normalisasiDaftarPasien, normalisasiPasien } from '../../src/lib/normalisasiPasien.ts'
const p = normalisasiPasien({ id: 'pt-1', name: 'Siti' })!
assert.deepEqual([p.riskFlags, p.allergies, p.chronicConditions], [[], [], []], 'field array yang hilang tidak dinormalisasi (Shell jatuh)')
assert.equal(normalisasiPasien({ id: 'pt-2', allergies: ['penicillin', 7] })!.allergies.join(), 'penicillin', 'nilai non-teks lolos ke daftar alergi')
assert.equal(normalisasiPasien({ id: 'pt-3', dob: '1970-01-01', weightKg: 70 })!.weightKg, 70, 'data klinis yang ada hilang saat dinormalisasi')
assert.equal(normalisasiPasien({ name: 'tanpa id' }), null)
assert.deepEqual(normalisasiDaftarPasien([{ id: 'a' }, null, 'x', { id: '' }]).map((x) => x.id), ['a'])
assert.match(readFileSync('src/lib/store.tsx', 'utf8'), /patients: normalisasiDaftarPasien\(data\.patients\)/, 'pasien server tidak dinormalisasi saat hidrasi')
console.log('normalisasi-pasien: pasien server tidak lengkap tidak lagi menjatuhkan Shell; tidak ada nilai klinis dikarang')
