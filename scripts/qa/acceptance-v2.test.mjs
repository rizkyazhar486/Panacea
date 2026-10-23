import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { validasi, jalurDariPerintah, LEGACY_WAJIB } from './acceptance-v2.mjs'

const baca = () => JSON.parse(readFileSync('governance/ACCEPTANCE_V2.json', 'utf8'))
const ada = (p) => existsSync(p)
const salin = () => structuredClone(baca())
const adaSemua = () => true

test('menerima_berkas_acceptance_v2_nyata', () => {
  assert.deepEqual(validasi(baca(), ada), [])
})

test('semua_legacy_tujuh_terpetakan', () => {
  const d = baca()
  const peta = new Set([...d.engineeringCriteria, ...d.externalGates].map((x) => x.legacy))
  for (const l of LEGACY_WAJIB) assert.ok(peta.has(l), l)
})

test('tidak_ada_kriteria_v2_berstatus_verified', () => {
  assert.equal(baca().engineeringCriteria.filter((k) => k.status === 'VERIFIED').length, 0)
})

test('menolak_status_verified_pada_kriteria', () => {
  const d = salin(); d.engineeringCriteria[0].status = 'VERIFIED'
  assert.match(validasi(d, adaSemua).join('\n'), /ENG-D8-1: status VERIFIED tidak diizinkan/)
})

test('menolak_bukti_yang_tidak_ada', () => {
  const d = salin(); d.engineeringCriteria[1].evidence.push('governance/TIDAK_ADA.json')
  assert.match(validasi(d, ada).join('\n'), /ENG-D8-2: bukti tidak ada: governance\/TIDAK_ADA\.json/)
})

test('menolak_perintah_ke_skrip_yang_tidak_ada', () => {
  const d = salin(); d.engineeringCriteria[2].command = 'node scripts/qa/hantu.mjs'
  assert.match(validasi(d, ada).join('\n'), /ENG-D8-3: skrip perintah tidak ada: scripts\/qa\/hantu\.mjs/)
})

test('menolak_kontrol_negatif_kosong', () => {
  const d = salin(); d.engineeringCriteria[3].negativeControl = ''
  assert.match(validasi(d, adaSemua).join('\n'), /ENG-F1-1: field negativeControl kosong/)
})

test('menolak_owner_selain_ai_pada_kriteria_engineering', () => {
  const d = salin(); d.engineeringCriteria[4].owner = 'Product Owner'
  assert.match(validasi(d, adaSemua).join('\n'), /ENG-F1-2: owner harus AI/)
})

test('menolak_id_ganda', () => {
  const d = salin(); d.engineeringCriteria[5].id = d.engineeringCriteria[0].id
  assert.match(validasi(d, adaSemua).join('\n'), /id ganda/)
})

test('menolak_legacy_yang_dikeluarkan_dari_peta', () => {
  const d = salin()
  d.engineeringCriteria = d.engineeringCriteria.filter((k) => k.legacy !== 'D7')
  d.externalGates = d.externalGates.filter((g) => g.legacy !== 'D7')
  assert.match(validasi(d, adaSemua).join('\n'), /legacy D7 tidak terpetakan/)
})

test('menolak_gerbang_eksternal_yang_menahan_engineering', () => {
  const d = salin(); d.externalGates[0].blocksEngineeringWork = true
  assert.match(validasi(d, adaSemua).join('\n'), /EXT-D8-1: tidak boleh menahan pekerjaan engineering/)
})

test('menolak_gerbang_tanpa_pertanyaan_spesifik', () => {
  const d = salin(); d.externalGates[1].question = ''
  assert.match(validasi(d, adaSemua).join('\n'), /EXT-D8-2: field question kosong/)
})

test('jalur_server_diselesaikan_relatif_ke_server', () => {
  assert.deepEqual(jalurDariPerintah('cd server && PANACEA_DATA_FILE=x npx tsx uji/a.uji.ts'), ['server/uji/a.uji.ts'])
  assert.deepEqual(jalurDariPerintah('node scripts/qa/x.mjs'), ['scripts/qa/x.mjs'])
  assert.deepEqual(jalurDariPerintah('echo halo'), [])
})

test('deterministik_dua_kali_sama', () => {
  assert.deepEqual(validasi(baca(), ada), validasi(baca(), ada))
})
