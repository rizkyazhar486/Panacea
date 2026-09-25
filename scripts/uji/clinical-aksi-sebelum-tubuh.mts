import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Diukur pada 390x844: permukaan tubuh di Clinical setinggi ~4.400px. Saat
// dipasang sebelum aksi, "Ask Panacea", aksi klinis utama dan kalkulator
// jatuh ke y~5.000 — enam layar gulir sebelum pemakai bisa bertindak.
// Aksi dan alat harus datang lebih dulu; tubuh tetap ada, di bawahnya.
const src = readFileSync(new URL('../../src/pages/ClinicalHub.tsx', import.meta.url), 'utf8')
const tanya = src.indexOf('aria-label="Ask and record"')
const alat = src.indexOf('aria-label="Clinical quick tools"')
const tubuh = src.indexOf('<PersonalBodyUnifiedSurface')
assert.ok(tanya > 0 && alat > 0, 'bagian Ask and record / Clinical quick tools hilang dari Clinical')
assert.ok(tubuh > 0, 'permukaan tubuh hilang dari Clinical — kapabilitas tidak boleh dihapus demi ringkas')
assert.ok(tanya < tubuh, 'Ask Panacea kembali ditaruh di bawah permukaan tubuh setinggi ~4.400px')
assert.ok(alat < tubuh, 'kalkulator/alat cepat kembali ditaruh di bawah permukaan tubuh')

const ctx = readFileSync(new URL('../../src/components/ClinicalPatientContext.tsx', import.meta.url), 'utf8')
assert.doesNotMatch(ctx, /className="truncate[^"]*">No /, 'pesan konteks pasien kosong kembali dipotong dengan elipsis')
console.log('clinical-aksi-sebelum-tubuh: tanya, aksi dan alat Clinical berada di atas permukaan tubuh; pesan konteks tidak terpotong')
