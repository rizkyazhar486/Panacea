// F1: kapabilitas langkah hasil lab per peran (cermin tampilan dari matriks server; server tetap otoritas).
import assert from 'node:assert/strict'
import { peranMeja, bolehLangkah, RESULT_STATUSES } from '../../src/domains/lab-results/index.ts'

// peranMeja: positif
assert.equal(peranMeja('dokter', false), 'dokter'); assert.equal(peranMeja('perawat', false), 'perawat'); assert.equal(peranMeja('lab', false), 'lab')
assert.equal(peranMeja('pasien', true), 'dokter', 'owner dipetakan ke dokter hanya untuk tampilan')
// peranMeja: negatif (fail-closed untuk peran lain, tipe salah, kosong)
for (const r of ['pasien', 'kontributor', 'verifikator', 'admin', 'owner', '', 'Perawat', 'LAB', null, undefined, 3, {}]) assert.equal(peranMeja(r, false), null, String(r))

// matriks: lab hanya pending_review
const boleh = (p: Parameters<typeof bolehLangkah>[0]) => RESULT_STATUSES.filter((s) => bolehLangkah(p, s))
assert.deepEqual(boleh('lab'), ['pending_review'])
assert.deepEqual(boleh('perawat'), ['pending_review', 'communicated', 'closed'])
assert.deepEqual(boleh('dokter'), ['pending_review', 'reviewed', 'communicated', 'closed'])
// berpasangan: hanya dokter yang boleh 'reviewed'; received tidak pernah menjadi tujuan
for (const p of ['lab', 'perawat'] as const) assert.equal(bolehLangkah(p, 'reviewed'), false, `${p} tidak meninjau`)
assert.equal(bolehLangkah('dokter', 'reviewed'), true)
for (const p of ['lab', 'perawat', 'dokter'] as const) assert.equal(bolehLangkah(p, 'received'), false)
// negatif: tanpa peran atau tanpa langkah berikutnya
assert.equal(bolehLangkah(null, 'pending_review'), false); assert.equal(bolehLangkah('dokter', null), false)
console.log('lab-staff-capability: ok')
