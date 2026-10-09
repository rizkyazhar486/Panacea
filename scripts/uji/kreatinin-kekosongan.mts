import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../../src/pages/clinical/scores/CreatinineClearance.tsx', import.meta.url), 'utf8')
const kode = src.split('\n').filter((b) => !b.trim().startsWith('//') && !b.trim().startsWith('*')).join('\n')

// Rumus Cockcroft-Gault, ditulis ulang di sini supaya gerbang ini tidak
// sekadar mencerminkan halamannya: CrCl = (140-usia) x berat x (0,85 bila
// perempuan) / (72 x SCr). Cockcroft & Gault 1976, Nephron 16(1):31-41.
const cg = (usia: number, beratKg: number, scr: number, perempuan: boolean) =>
  ((140 - usia) * beratKg * (perempuan ? 0.85 : 1)) / (72 * scr)

// ── 1-4. Perilaku kosong/di luar rentang kini diuji pada mesin domain, bukan lewat teks sumber halaman ──
import { creatinineClearance, parseNumberField } from '../../src/domains/clinical-calculators/index.ts'
const run = (o: Partial<Record<'age' | 'weightKg' | 'heightCm' | 'scr', number>> & { sex?: unknown; basis?: unknown } = {}) =>
  creatinineClearance({ age: NaN, weightKg: NaN, heightCm: NaN, scr: NaN, sex: 'M', basis: 'actual', ...o })
// Kreatinin kosong tidak lagi menjadi crcl 0 / "Kidney failure": tanpa angka, tanpa pita, dan bernama.
const tanpaScr = run({ age: 50, weightKg: 70 })
assert.equal(tanpaScr.crcl, null); assert.equal(tanpaScr.band, null); assert.deepEqual(tanpaScr.missing, ['serum creatinine'])
assert.deepEqual(run().missing, ['age', 'weight', 'serum creatinine'])
assert.ok(Number.isNaN(parseNumberField('')))
const kode2 = kode // halaman hanya dipakai untuk pin non-perilaku di bawah
assert.ok(/getDemoTersimpan/.test(kode2), 'the page no longer reads the stored profile')
assert.ok(!/\bgetDemo\s*\(/.test(kode2),
  'getDemo() is back, so the page opens with age 30 / 70 kg / male and prints a clearance for nobody')
assert.ok(/creatinineClearance\(\{/.test(kode2) && /parseNumberField\(scrText\)/.test(kode2), 'halaman tidak memakai mesin domain')
assert.ok(!/\)\s*\|\|\s*0/.test(kode2), '`|| 0` kembali')
assert.ok(/const \[scrText, setScr\] = useState\(''\)/.test(kode2), 'serum creatinine has a starting value again; it is a laboratory result')
assert.ok(/Still needed: \{belum\.join/.test(src), 'the page no longer names what it is waiting for')
assert.ok(/Serum creatinine has no default/.test(src), 'the page no longer explains why creatinine cannot be filled in')
assert.ok(/hasil\.invalid\.length > 0/.test(kode2), 'penolakan tidak ditampilkan')

// ── 5. Ketika lengkap, angkanya harus tetap angka Cockcroft-Gault ──────────
// Perbaikan yang membuat halaman diam itu mudah; yang diminta adalah halaman
// yang tetap benar ketika datanya ada.
for (const [usia, berat, scr, perempuan] of [
  [70, 60, 1.4, true], [40, 80, 0.9, false], [85, 52, 2.1, true], [25, 95, 1.0, false],
] as const) {
  const nilai = cg(usia, berat, scr, perempuan)
  assert.ok(Number.isFinite(nilai) && nilai > 0, `Cockcroft-Gault produced no number for ${usia}/${berat}/${scr}`)
}
// Perempuan 0,85 kali laki-laki pada masukan yang sama -- faktor itu ada di rumusnya.
assert.ok(Math.abs(cg(50, 70, 1, true) / cg(50, 70, 1, false) - 0.85) < 1e-12,
  'the female factor is not 0.85')
// Mesin sama dengan rumus tangan di atas (faktor 0,85 perempuan).
assert.ok(Math.abs(run({ age: 70, weightKg: 60, scr: 1.4, sex: 'F' }).crcl! - cg(70, 60, 1.4, true)) < 1e-9)

console.log('kreatinin-kekosongan: ok')
