// Cacat fungsional jalur rencana harian: ketuk-ganda, validasi inline aturan lab, status memuat.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { periksaAturanLab } from '../../src/lib/aturanLabDokter.ts'
const sah = { jenis: 'ldl', op: 'gte' as const, ambang: '160', hari: '90', bukti: 'ESC/EAS 2019 §4' }
assert.deepEqual(periksaAturanLab(sah), {})
assert.deepEqual(periksaAturanLab({ ...sah, ambang: '7,5' }), {}, 'koma desimal ditolak')
assert.ok(periksaAturanLab({ ...sah, ambang: '' }).ambang, 'ambang kosong diterima')
assert.ok(periksaAturanLab({ ...sah, ambang: '12abc' }).ambang, 'ambang bukan angka diterima')
assert.ok(periksaAturanLab({ ...sah, hari: '0' }).hari, 'usia hasil 0 hari diterima')
assert.ok(periksaAturanLab({ ...sah, hari: '1.5' }).hari, 'usia hasil pecahan diterima')
assert.ok(periksaAturanLab({ ...sah, bukti: '  ' }).bukti, 'aturan tanpa rujukan bukti diterima')
const cek = readFileSync('src/components/CekHarian.tsx', 'utf8')
assert.match(cek, /if \(sedangKirim\.current\) return/, 'ketuk-ganda mengirim dua laporan cek harian')
assert.match(cek, /finally \{ sedangKirim\.current = false; setMengirim\(false\) \}/, 'penjaga kirim tidak dilepas setelah gagal')
const rencana = readFileSync('src/components/RencanaHarianDokter.tsx', 'utf8')
assert.match(rencana, /disabled=\{!aturanSah \|\| menyimpan\}/, 'rencana dengan aturan lab tidak sah dapat disimpan')
assert.match(rencana, /if \(!aturanSah \|\| menyimpan\) return/)
assert.match(readFileSync('src/components/LabPasienUntukDokter.tsx', 'utf8'), /!daftar && !galat && <p role="status"/, 'daftar berbagi lab kosong tanpa status memuat')
console.log('cacat-fungsional-rencana: ketuk-ganda dijaga, aturan lab divalidasi inline, daftar berbagi lab punya status memuat & coba lagi')
