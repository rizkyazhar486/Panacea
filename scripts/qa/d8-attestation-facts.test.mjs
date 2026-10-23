import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// Permintaan atestasi D8 mengikat pernyataan pemilik pada berkas TERTENTU. Bila berkas berubah, pernyataan lama tidak lagi menjelaskannya.
export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')
const DOK = readFileSync(new URL('../../docs/alpha/D8_OWNER_ATTESTATION_REQUESTS.md', import.meta.url), 'utf8')
const ASET = ['public/logo-mark.png', 'public/media/tutorial-video.mp4']
const baca = (p) => readFileSync(new URL(`../../${p}`, import.meta.url))

// Setiap aset di baseline D8 harus punya permintaan atestasi; dokumen tidak boleh memuat aset yang sudah tertutup tanpa kita sadari.
const BASELINE = JSON.parse(readFileSync(new URL('../../governance/PUBLIC_ASSET_PROVENANCE_BASELINE.json', import.meta.url), 'utf8'))

test('dokumen_memuat_sha256_dan_ukuran_terkini_tiap_aset', () => {
  for (const p of ASET) {
    const b = baca(p)
    assert.ok(DOK.includes(sha256(b)), `${p}: sha256 di dokumen tidak cocok dengan berkas`)
    assert.ok(DOK.includes(b.length.toLocaleString('id-ID')), `${p}: ukuran ${b.length} B tidak tercantum`)
  }
})

test('aset_tanpa_jejak_di_baseline_sama_persis_dengan_aset_yang_dimintakan_atestasi', () => {
  assert.deepEqual([...BASELINE.tanpaJejak].sort(), [...ASET].sort())
})

test('menolak_berkas_yang_berubah_satu_byte', () => {
  for (const p of ASET) {
    const b = Buffer.from(baca(p)); b[b.length - 1] ^= 0xff
    assert.ok(!DOK.includes(sha256(b)), `${p}: sha256 berkas yang diubah seharusnya tidak ada di dokumen`)
  }
})

test('sha256_deterministik_dan_berbeda_antar_aset', () => {
  const [a, b] = ASET.map((p) => sha256(baca(p)))
  assert.equal(a, sha256(baca(ASET[0])))
  assert.notEqual(a, b)
})

test('kolom_jawaban_pemilik_sengaja_kosong_dan_tidak_ada_pernyataan_kepemilikan_oleh_ai', () => {
  assert.ok((DOK.match(/_{10,}/g) || []).length >= 10, 'kolom jawaban pemilik harus tetap garis kosong')
  assert.ok(!/karya (?:asli|sendiri) pemilik\b(?!\s*,)/i.test(DOK.replace(/\(karya sendiri[^)]*\)/g, '')), 'dokumen tidak boleh menyatakan kepemilikan atas nama pemilik')
  assert.match(DOK, /D8 tetap REPORTED/)
})
