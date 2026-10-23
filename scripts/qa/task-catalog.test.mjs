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
  assert.match(validasi(d, semua).join('\n'), /tidak boleh memuat mode wajib/)
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
  assert.match(validasi(d, semua).join('\n'), /asset-provenance: field never kosong/)
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
