import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { TARGET_IMAGING_KLINIS } from '../../src/lib/targetImagingKlinis.ts'

// Registri target tidak boleh mengaku: 'ada'/'sebagian' harus menunjuk berkas nyata,
// 'sebagian'/'belum' harus menyebut celahnya (kecuali 'belum' yang memang kosong).
const ids = new Set<string>()
for (const t of TARGET_IMAGING_KLINIS) {
  assert.ok(!ids.has(t.id), `id ganda ${t.id}`); ids.add(t.id)
  if (t.status !== 'belum') {
    assert.ok(t.bukti.length > 0, `${t.id}: status ${t.status} tanpa bukti berkas`)
    for (const b of t.bukti) assert.ok(existsSync(b), `${t.id}: bukti ${b} tidak ada — kemampuan diklaim tanpa kode`)
  }
  if (t.status === 'sebagian') assert.ok(t.celah && t.celah.length > 10, `${t.id}: 'sebagian' tanpa celah yang disebut`)
}
const hitung = (s: string) => TARGET_IMAGING_KLINIS.filter((t) => t.status === s).length
console.log(`target-imaging-klinis: ${hitung('ada')} ada, ${hitung('sebagian')} sebagian, ${hitung('belum')} belum — setiap klaim menunjuk berkas nyata`)
