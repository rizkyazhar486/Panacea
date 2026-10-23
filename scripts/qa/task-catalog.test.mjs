import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { validasi } from './task-catalog.mjs'

const katalog = () => JSON.parse(readFileSync('governance/TASK_CATALOG.json', 'utf8'))
const gateIds = () => new Set(JSON.parse(readFileSync('governance/ACCEPTANCE_V2.json', 'utf8')).externalGates.map((g) => g.id))
const opsi = { ada: (p) => existsSync(p), gateIds: gateIds() }
const semua = { ada: () => true, gateIds: gateIds() }
const salin = () => structuredClone(katalog())
const cari = (d, id) => d.classes.find((c) => c.id === id)

test('menerima_katalog_nyata', () => {
  assert.deepEqual(validasi(katalog(), opsi), [])
})

test('deterministik_dua_kali_sama', () => {
  assert.deepEqual(validasi(katalog(), opsi), validasi(katalog(), opsi))
})

test('tidak_ada_kelas_yang_mewajibkan_manusia_untuk_engineering', () => {
  for (const c of katalog().classes) assert.ok(['none', 'optional'].includes(c.humanReview.mode), c.id)
})

test('menolak_mode_review_manusia_wajib', () => {
  const d = salin(); cari(d, 'ci-failure').humanReview.mode = 'required'
  assert.match(validasi(d, semua).join('\n'), /kelas ci-failure: humanReview\.mode required tidak diizinkan/)
})

test('menolak_mode_wajib_ditambahkan_ke_daftar_mode', () => {
  const d = salin(); d.humanReviewModes.push('required')
  assert.match(validasi(d, semua).join('\n'), /humanReviewModes harus persis none,optional/)
})

test('menolak_kapabilitas_tidak_dikenal', () => {
  const d = salin(); cari(d, 'ux-accessibility').capabilities.push('telepati')
  assert.match(validasi(d, semua).join('\n'), /ux-accessibility: kapabilitas telepati tidak dikenal/)
})

test('menolak_gerbang_tertunda_yang_tidak_ada', () => {
  const d = salin(); cari(d, 'rbac-privacy').humanReview.deferredGate = 'EXT-ZZZ-Z'
  assert.match(validasi(d, semua).join('\n'), /rbac-privacy: deferredGate EXT-ZZZ-Z tidak ada/)
})

test('menolak_prosedur_yang_tidak_ada', () => {
  const d = salin(); cari(d, 'ci-failure').procedure = 'docs/governance/HANTU.md'
  assert.match(validasi(d, opsi).join('\n'), /ci-failure: prosedur tidak ada: docs\/governance\/HANTU\.md/)
})

test('menolak_kelas_tanpa_larangan', () => {
  const d = salin(); cari(d, 'asset-provenance').never = []
  assert.match(validasi(d, semua).join('\n'), /asset-provenance: field never harus daftar teks tidak kosong/)
})

test('menolak_kelas_klinis_di_tier_rendah', () => {
  const d = salin(); cari(d, 'clinical-calculator').minTier = 'S1'
  assert.match(validasi(d, semua).join('\n'), /clinical-calculator: harus minTier S3/)
})

test('menolak_id_ganda', () => {
  const d = salin(); d.classes[1].id = d.classes[0].id
  assert.match(validasi(d, semua).join('\n'), /id ganda/)
})

test('menolak_tier_tidak_dikenal', () => {
  const d = salin(); cari(d, 'governance-process').minTier = 'S9'
  assert.match(validasi(d, semua).join('\n'), /governance-process: minTier S9 tidak dikenal/)
})

// Regresi review Codex: validator dulu menerima katalog kosong dan kosakata mode yang diperluas.
test('menolak_katalog_kosong', () => {
  const e = validasi({}, { ada: () => true, gateIds: new Set() }).join('\n')
  assert.match(e, /version harus 1/)
  assert.match(e, /classes harus array tidak kosong/)
})

test('menolak_root_bukan_objek', () => {
  for (const x of [null, [], 'x', 7]) assert.deepEqual(validasi(x, semua), ['katalog bukan objek'])
})

test('menolak_kosakata_mode_diperluas_waived', () => {
  const d = salin(); d.humanReviewModes = ['none', 'optional', 'waived']; cari(d, 'ci-failure').humanReview.mode = 'waived'
  const e = validasi(d, semua).join('\n')
  assert.match(e, /humanReviewModes harus persis none,optional/)
  assert.match(e, /ci-failure: humanReview\.mode waived tidak diizinkan/)
})

test('menolak_kosakata_kapabilitas_diperluas_oleh_katalog', () => {
  const d = salin(); d.capabilities.push('telepati'); cari(d, 'ux-accessibility').capabilities.push('telepati')
  const e = validasi(d, semua).join('\n')
  assert.match(e, /capabilities harus persis kosakata tertutup/)
  assert.match(e, /ux-accessibility: kapabilitas telepati tidak dikenal/)
})

test('menolak_classes_kosong_dan_kelas_wajib_hilang', () => {
  const d = salin(); d.classes = []
  assert.match(validasi(d, semua).join('\n'), /classes harus array tidak kosong/)
  const d2 = salin(); d2.classes = d2.classes.filter((c) => c.id !== 'clinical-calculator')
  assert.match(validasi(d2, semua).join('\n'), /kelas wajib tidak ada: clinical-calculator/)
})

test('menolak_tipe_field_salah', () => {
  const d = salin(); cari(d, 'ci-failure').mustLeave = 'bukan daftar'; cari(d, 'ci-failure').minTier = 3
  const e = validasi(d, semua).join('\n')
  assert.match(e, /ci-failure: field mustLeave harus daftar teks tidak kosong/)
  assert.match(e, /ci-failure: field minTier kosong atau bukan teks/)
})

test('menolak_humanreview_hilang_dan_gerbang_bukan_teks', () => {
  const d = salin(); delete cari(d, 'ci-failure').humanReview
  assert.match(validasi(d, semua).join('\n'), /ci-failure: field humanReview kosong atau bukan objek/)
  const d2 = salin(); cari(d2, 'ci-failure').humanReview.deferredGate = 42
  assert.match(validasi(d2, semua).join('\n'), /ci-failure: deferredGate 42 tidak ada/)
})
