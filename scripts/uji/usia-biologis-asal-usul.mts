import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const berkas = new URL('../../src/pages/BiologicalAge.tsx', import.meta.url)
const src = readFileSync(berkas, 'utf8')
const kode = src.split('\n').filter((b) => !b.trim().startsWith('//') && !b.trim().startsWith('*')).join('\n')

// ── 1. Autoisi hanya boleh menyalin yang BENAR-BENAR tersimpan ─────────────
// syncFromDevices() dulu membaca getDemo(), yang memadukan DEMO_DEFAULT ke
// profil kosong. Ketiga syarat `> 0`-nya karenanya selalu benar, dan halaman
// ini melaporkan "Updated from your devices: Age, Weight, Height" pada
// perangkat yang tidak punya satu pun dari ketiganya. Cacatnya bukan pada
// angkanya saja melainkan pada KALIMATNYA: sebuah asal usul yang diklaim.
assert.ok(/getDemoTersimpan/.test(kode), 'BiologicalAge no longer reads the stored profile')
assert.ok(!/\bgetDemo\s*\(/.test(kode),
  'BiologicalAge still calls getDemo(), so its autofill announces values no device ever supplied')
for (const [nama, bidang] of [['age', 'usiaTersimpan'], ['weight', 'beratTersimpan'], ['height', 'tinggiTersimpan']] as const) {
  assert.ok(new RegExp(`${bidang}\\s*>\\s*0`).test(kode), `the ${nama} autofill is not gated on a stored value`)
}

// ── 2. Kalimatnya tidak boleh mengaku datang dari perangkat ────────────────
assert.ok(!/Updated from your devices/.test(src),
  'the note still claims a device origin for values that may come from a profile or from nothing')
assert.ok(/Filled in from what you have stored/.test(src), 'the note no longer says where the values came from')
assert.ok(/left blank rather than guessed/.test(src),
  'the empty case does not tell the reader that nothing was invented for it')

// ── 3. "Metabolic age" tidak boleh menjawab pertanyaannya sendiri ──────────
// Dengan usia sulih 30 ia menghitung RMR pada 30 lalu mencari usia yang
// RMR-nya sama, dan menemukan 30. Keyakinan angkanya seluruhnya berasal dari
// tebakannya sendiri. Tanpa usia, jawabannya harus TIDAK ADA.
assert.ok(/d\.weightKg > 0 && d\.heightCm > 0 && d\.age > 0/.test(kode),
  'metabolicAge still runs without an age, where it can only return the age it assumed')
assert.ok(!/d\.age \|\| 30/.test(kode), 'an age of 30 is still substituted somewhere in this page')

// ── 4. Norma VO2max menurut usia butuh usia ────────────────────────────────
assert.ok(/d\.vo2 > 0 && d\.age > 0/.test(kode),
  'the VO2max marker is still compared against an age norm without an age')

// ── 5. Usia biologis itu sendiri tetap menolak tanpa usia ──────────────────
// Ini SUDAH benar sebelum perubahan ini. Diuji supaya tetap begitu.
assert.ok(/d\.age <= 0 \|\| markers\.length < 3/.test(kode),
  'the biological-age estimate no longer refuses when the age is unknown')

console.log('usia-biologis-asal-usul: ok')
