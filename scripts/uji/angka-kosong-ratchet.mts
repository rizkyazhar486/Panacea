import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Ratchet: kolom kosong dibaca sebagai 0.
//
// `Number(e.target.value) || 0` mengubah kolom kosong (juga teks bukan angka) menjadi 0 yang tampak sah. Pada kalkulator
// klinis itu menghasilkan hasil palsu: PaO2 kosong → "Elevated gradient", berat kosong → "Infinity‰", rasio serum kosong →
// "Transudate", usia kosong → kesintasan lebih baik dari sebenarnya. Halaman yang sudah diperbaiki memakai teks mentah +
// parseNumberField dan fungsi domain tervalidasi. Uji ini TIDAK memperbaiki sisanya; ia mencegah jumlahnya naik dan
// memaksa baseline turun saat sebuah halaman diperbaiki, sehingga kemajuan tercatat dan tidak bisa mundur diam-diam.
//
// Menurunkan baseline setelah memperbaiki halaman:  UPDATE_BASELINE=1 npm run uji  (atau jalankan berkas ini langsung).
// Menaikkan baseline TIDAK boleh: perbaiki kode barunya (parseNumberField + fungsi domain) alih-alih mengedit angka.

export const POLA = /(?:Number|parseFloat|parseInt)\([^()]*\)\s*\|\|\s*0/g
export const hitung = (isi: string): number => (isi.match(POLA) ?? []).length

// Kontrol: pola harus mengenai yang seharusnya dan tidak mengenai yang tidak seharusnya, supaya pemindaian tidak lolos hampa.
assert.equal(hitung('setX(Number(e.target.value) || 0)'), 1)
assert.equal(hitung('setX(parseFloat(e.target.value)||0)'), 1)
assert.equal(hitung('a(Number(x) || 0); b(parseInt(y)  ||  0)'), 2)
assert.equal(hitung("setX(parseNumberField(e.target.value))"), 0, 'jalur yang benar tidak boleh terhitung')
assert.equal(hitung('const n = Number(x) ?? 0'), 0, '?? bukan || ')
assert.equal(hitung('const n = Number(x) || 1'), 0, 'bukan fallback 0')
assert.equal(hitung('const n = Number.isFinite(x) || 0'), 0, 'Number.isFinite bukan konversi')

function pindai(akar: string): Record<string, number> {
  const hasil: Record<string, number> = {}
  const jalan = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name)
      if (e.isDirectory()) jalan(p)
      else if (e.name.endsWith('.tsx')) {
        const n = hitung(readFileSync(p, 'utf8'))
        if (n > 0) hasil[p.replaceAll('\\', '/')] = n
      }
    }
  }
  jalan(akar)
  return hasil
}

const BASELINE = 'governance/EMPTY_FIELD_ZERO_BASELINE.json'
const aktual = pindai('src')
const total = Object.values(aktual).reduce((s, n) => s + n, 0)
// Pemindaian yang rusak (salah folder, pola salah) tidak boleh lolos sebagai "nol pelanggaran".
assert.ok(Object.keys(aktual).length >= 5 && total >= 20, `pemindaian hanya menemukan ${total} kejadian di ${Object.keys(aktual).length} berkas — pemindaian rusak`)

if (process.env.UPDATE_BASELINE === '1') {
  const urut = Object.fromEntries(Object.entries(aktual).sort(([a], [b]) => a.localeCompare(b)))
  writeFileSync(BASELINE, `${JSON.stringify({ catatan: 'Jumlah `(Number|parseFloat|parseInt)(...) || 0` per berkas di src/**/*.tsx. Hanya boleh turun; lihat scripts/uji/angka-kosong-ratchet.mts.', total, berkas: urut }, null, 2)}\n`)
  console.log(`angka-kosong-ratchet: baseline ditulis (${total} kejadian di ${Object.keys(urut).length} berkas)`)
  process.exit(0)
}

assert.ok(existsSync(BASELINE), `${BASELINE} tidak ada — buat dengan UPDATE_BASELINE=1`)
const baseline = JSON.parse(readFileSync(BASELINE, 'utf8')) as { total: number; berkas: Record<string, number> }
assert.equal(baseline.total, Object.values(baseline.berkas).reduce((s, n) => s + n, 0), 'total di baseline tidak sama dengan jumlah per berkas')

const naik: string[] = []
const turun: string[] = []
const baru: string[] = []
for (const [berkas, n] of Object.entries(aktual)) {
  const b = baseline.berkas[berkas]
  if (b === undefined) baru.push(`${berkas}: ${n} kejadian, tidak ada di baseline`)
  else if (n > b) naik.push(`${berkas}: ${n} > baseline ${b}`)
  else if (n < b) turun.push(`${berkas}: ${n} < baseline ${b}`)
}
for (const [berkas, b] of Object.entries(baseline.berkas)) {
  if (!(berkas in aktual)) {
    if (!existsSync(berkas)) turun.push(`${berkas}: berkas tidak ada lagi (baseline ${b})`)
    else turun.push(`${berkas}: 0 < baseline ${b}`)
  }
}

assert.deepEqual(baru, [], `halaman baru membaca kolom kosong sebagai 0 — pakai teks mentah + parseNumberField + fungsi domain tervalidasi:\n  ${baru.join('\n  ')}`)
assert.deepEqual(naik, [], `jumlah "|| 0" pada kolom naik — jangan menambah; pakai parseNumberField:\n  ${naik.join('\n  ')}`)
assert.deepEqual(turun, [], `halaman diperbaiki, turunkan baseline (UPDATE_BASELINE=1 npm run uji) agar kemajuan terkunci:\n  ${turun.join('\n  ')}`)

console.log(`angka-kosong-ratchet: ${total} kejadian di ${Object.keys(aktual).length} berkas, tidak naik dari baseline`)
