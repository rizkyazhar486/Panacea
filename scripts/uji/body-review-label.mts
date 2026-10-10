// Label tinjauan klinis struktur: gagal-tertutup, hanya `=== true` eksplisit yang dihitung ditinjau.
import assert from 'node:assert/strict'
import { reviewLabel } from '../../src/domains/body-exposure/engine/reviewLabel.ts'

const NOT = { reviewed: false, text: 'Not clinically reviewed' }
// positif: ditinjau hanya bila eksplisit true dan status bukan review_required
assert.deepEqual(reviewLabel({ panacea_clinically_reviewed: true, panacea_review_status: 'reviewed' }), { reviewed: true, text: 'Clinically reviewed' }, 'menerima_tinjauan_eksplisit')
assert.deepEqual(reviewLabel({ panacea_clinically_reviewed: true }), { reviewed: true, text: 'Clinically reviewed' }, 'menerima_true_tanpa_status')
// negatif berpasangan: hanya satu kondisi berbeda dari kasus positif
assert.deepEqual(reviewLabel({ panacea_clinically_reviewed: false, panacea_review_status: 'reviewed' }), NOT, 'menolak_false_eksplisit')
assert.deepEqual(reviewLabel({ panacea_review_status: 'reviewed' }), NOT, 'menolak_flag_hilang_walau_status_reviewed')
assert.deepEqual(reviewLabel({ panacea_clinically_reviewed: true, panacea_review_status: 'review_required' }), NOT, 'menolak_true_yang_bertentangan_dengan_review_required')
// bentuk kotor dari data luar: tidak ada yang dihitung ditinjau
for (const v of ['true', 1, 'yes', null, undefined, {}, [], 0, NaN]) assert.deepEqual(reviewLabel({ panacea_clinically_reviewed: v }), NOT, `menolak_nilai_${String(v)}`)
// userData kosong/tidak ada
assert.deepEqual(reviewLabel({}), NOT, 'menolak_kosong')
assert.deepEqual(reviewLabel(null), NOT, 'menolak_null')
assert.deepEqual(reviewLabel(undefined), NOT, 'menolak_undefined')
// data nyata yang dikirim: semua struktur publik review_required (736 dengan false eksplisit, sisanya tanpa flag)
assert.deepEqual(reviewLabel({ panacea_review_status: 'review_required', panacea_clinically_reviewed: false }), NOT)
assert.deepEqual(reviewLabel({ panacea_review_status: 'review_required' }), NOT)
// determinisme dan tanpa efek samping
const input = { panacea_clinically_reviewed: true, panacea_review_status: 'reviewed' }
const snap = JSON.stringify(input)
assert.deepEqual(reviewLabel(input), reviewLabel(input)); assert.equal(JSON.stringify(input), snap)
console.log('body-review-label: hanya true eksplisit yang ditinjau; flag hilang/false/bertipe lain/review_required = belum ditinjau')
