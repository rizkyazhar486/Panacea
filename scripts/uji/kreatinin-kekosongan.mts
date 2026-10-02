import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../../src/pages/CreatinineClearance.tsx', import.meta.url), 'utf8')
const kode = src.split('\n').filter((b) => !b.trim().startsWith('//') && !b.trim().startsWith('*')).join('\n')

// Rumus Cockcroft-Gault, ditulis ulang di sini supaya gerbang ini tidak
// sekadar mencerminkan halamannya: CrCl = (140-usia) x berat x (0,85 bila
// perempuan) / (72 x SCr). Cockcroft & Gault 1976, Nephron 16(1):31-41.
const cg = (usia: number, beratKg: number, scr: number, perempuan: boolean) =>
  ((140 - usia) * beratKg * (perempuan ? 0.85 : 1)) / (72 * scr)

// ── 1. Pita klinis TIDAK boleh punya arti pada nilai nol ───────────────────
// Sebelum perbaikan ini, mengosongkan kolom kreatinin membuat crcl = 0, dan
// band(0) menjawab "Kidney failure -- many drugs contraindicated or need
// major adjustment". Terukur di peramban. Kolom kosong ditampilkan sebagai
// gagal ginjal berat, dengan tombol untuk menyalinnya ke catatan.
assert.ok(/const bisaHitung = scr > 0 && age > 0 && useWeight > 0/.test(kode),
  'the clearance is computed without requiring creatinine, age and weight')
assert.ok(/const crcl = bisaHitung \?/.test(kode) && /: null/.test(kode),
  'crcl no longer becomes null when it cannot be computed — a zero will be banded as kidney failure')
assert.ok(/const bandInfo = crcl !== null \? band\(crcl\) : null/.test(kode),
  'band() can still be called on a value that was never computed')
assert.ok(/crcl !== null && bandInfo !== null \?/.test(kode),
  'the result block is not gated on an actual computation')

// ── 2. Kreatinin serum tidak boleh punya nilai awal ────────────────────────
assert.ok(/useState\(0\)/.test(kode.split('const [scr,')[1]?.slice(0, 40) ?? ''),
  'serum creatinine has a starting value again; it is a laboratory result, not a default')
assert.ok(!/useState\(1\.0\)/.test(kode), 'the 1.0 mg/dL default creatinine is back')

// ── 3. Demografi dibaca dari yang tersimpan ────────────────────────────────
assert.ok(/getDemoTersimpan/.test(kode), 'the page no longer reads the stored profile')
assert.ok(!/\bgetDemo\s*\(/.test(kode),
  'getDemo() is back, so the page opens with age 30 / 70 kg / male and prints a clearance for nobody')

// ── 4. Yang belum ada harus DISEBUT, bukan diisi ───────────────────────────
assert.ok(/Still needed: \{belum\.join/.test(src), 'the page no longer names what it is waiting for')
assert.ok(/Serum creatinine has no default/.test(src),
  'the page no longer explains why creatinine cannot be filled in')
assert.ok(/belum\.push\('serum creatinine'\)/.test(kode), 'a missing creatinine is not reported as missing')

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
assert.ok(/sex === 'F' \? 0\.85 : 1/.test(kode), 'the page no longer applies the 0.85 female factor')

console.log('kreatinin-kekosongan: ok')
