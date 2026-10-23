import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { proyeksiTren, TREN_MIN_TITIK, TREN_MAKS_NILAI } from '../../src/domains/data-lab/index.ts'

const ok = (r: ReturnType<typeof proyeksiTren>) => { assert.equal(r.ok, true); if (!r.ok) throw new Error('x'); return r.data }
const gagal = (r: ReturnType<typeof proyeksiTren>) => { assert.equal(r.ok, false); assert.equal('data' in r, false, 'tanpa angka tebakan'); return r.ok ? '' : r.alasan }

// Positif: garis tepat 90,92,94 → +2/tahun, sisa 0, proyeksi dari tahun ke-3.
const a = ok(proyeksiTren(['90', '92', '94', '', '']))
assert.equal(a.n, 3); assert.equal(a.indeksTerakhir, 2); assert.equal(a.kemiringanPerTahun, 2); assert.equal(a.sisaSd, 0)
assert.deepEqual(a.proyeksi.map((p) => p.nilai), [96, 98, 100, 102, 104], 'Yr+1 = langkah sesudah tahun terakhir yang diisi')
// Regresi: dulu proyeksi mulai dari ujung formulir (tahun 6) walau hanya 3 tahun diisi → melompat dua tahun.
// Nilai referensi tangan: (90,92,95) → slope 2.5, intercept 89.8333 → x=3 → 97.3.
const b = ok(proyeksiTren(['90', '92', '95', '', '']))
assert.equal(b.kemiringanPerTahun, 2.5); assert.equal(b.proyeksi[0].nilai, 97.3)
assert.ok(Math.abs(b.sisaSd - Math.sqrt((1 / 6) / 1)) < 1e-9, 'SSE=1/6, df=1')
// Celah di tengah: x tetap indeks tahun (tidak dimampatkan).
const c = ok(proyeksiTren(['10', '', '14', '', '18']))
assert.equal(c.n, 3); assert.equal(c.kemiringanPerTahun, 2); assert.equal(c.indeksTerakhir, 4); assert.equal(c.proyeksi[0].nilai, 20)
assert.deepEqual(proyeksiTren(['90', '92', '95']), proyeksiTren(['90', '92', '95']), 'deterministik')

// Batas berpasangan: 2 titik ditolak, 3 diterima; nilai maks sah / maks+1 ditolak; horizon 1/10 sah, 0/11 ditolak.
assert.equal(TREN_MIN_TITIK, 3)
assert.equal(gagal(proyeksiTren(['90', '92', '', '', ''])), 'Enter at least 3 yearly values (2 entered).')
assert.equal(proyeksiTren(['90', '92', '95']).ok, true)
assert.equal(proyeksiTren(['1', '2', String(TREN_MAKS_NILAI)]).ok, true)
assert.match(gagal(proyeksiTren(['1', '2', String(TREN_MAKS_NILAI + 1)])), /^Yr 3:/)
assert.equal(proyeksiTren(['90', '92', '95'], 1).ok, true); assert.equal(proyeksiTren(['90', '92', '95'], 10).ok, true)
assert.equal(proyeksiTren(['90', '92', '95'], 0).ok, false); assert.equal(proyeksiTren(['90', '92', '95'], 11).ok, false)

// Negatif: formulir kosong, sel berisi tidak sah (disebut tahunnya, TIDAK dibuang diam-diam), 0, negatif, NaN, Infinity.
assert.equal(gagal(proyeksiTren(['', '', '', '', ''])), 'Enter at least 3 yearly values (0 entered).')
for (const buruk of ['abc', '0', '-5', 'NaN', 'Infinity', '1e999']) {
  assert.match(gagal(proyeksiTren(['90', buruk, '95', '97', ''])), /^Yr 2: enter a number above 0/, buruk)
}
assert.equal(proyeksiTren(['90', '91', '95', '97', '']).ok, true, 'pasangan: hanya sel buruk yang menolak')
assert.equal(proyeksiTren(undefined as unknown as string[]).ok, false); assert.equal(proyeksiTren([null, 3, {}] as unknown as string[]).ok, false)

// Proyeksi ≤ 0 → null ("not meaningful"), bukan angka negatif.
const turun = ok(proyeksiTren(['30', '20', '10', '', '']))
assert.deepEqual(turun.proyeksi.map((p) => p.nilai), [null, null, null, null, null])
assert.equal(ok(proyeksiTren(['40', '30', '20'])).proyeksi[0].nilai, 10)

// Regresi halaman: tanpa contoh karangan, tanpa regresi inline, memakai mesin domain.
const halaman = readFileSync(new URL('../../src/pages/bodyhub/DataLabAdvanced.tsx', import.meta.url), 'utf8')
assert.doesNotMatch(halaman, /'90', '92', '95'/); assert.doesNotMatch(halaman, /function linreg/)
assert.match(halaman, /proyeksiTren\(values\)/); assert.match(halaman, /No projection yet/)
console.log('tren-biomarker: ok')
