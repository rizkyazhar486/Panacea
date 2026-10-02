import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { hrMaksimum, hrMaxFromAge } from '../../src/lib/workoutImport.ts'
import { DEMO_DEFAULT } from '../../src/lib/profile.ts'

// HRmax menggerakkan SELURUH sebaran zona -- jawaban atas "seberapa keras sesi
// itu sebenarnya". Ada tiga asal yang sangat berbeda di baliknya, dan layar
// dulu menulis ketiganya dengan kalimat yang sama persis.

// ── 1. Terukur menang atas rumus, dan disebut terukur ──────────────────────
{
  const h = hrMaksimum([{ maxHr: 199 }, { maxHr: 177 }], { age: 30, sex: 'M' })
  assert.equal(h.nilai, 199)
  assert.equal(h.asal, 'terukur')
  assert.equal(h.usiaDipakai, null, 'angka terukur tidak berutang pada usia mana pun')
}

// ── 2. Usia yang DISIMPAN pengguna -> perkiraan, bukan pengukuran ──────────
{
  const h = hrMaksimum([{ maxHr: 150 }], { age: 26, sex: 'M' })
  assert.equal(h.nilai, hrMaxFromAge(26, 'M'))
  assert.equal(h.asal, 'perkiraan-usia')
  assert.equal(h.usiaDipakai, 26)
}

// ── 3. Profil kosong -> ASUMSI, dan harus mengaku asumsi ───────────────────
//
// Inilah cacatnya. getDemo() mencampurkan DEMO_DEFAULT diam-diam, jadi orang
// yang belum pernah mengisi apa pun tetap mendapat angka -- angka milik
// laki-laki berusia 30 yang tidak ada.
{
  const h = hrMaksimum([{ maxHr: 150 }], {})
  assert.equal(h.asal, 'asumsi-usia', 'profil kosong tidak boleh terbaca sebagai perkiraan dari data')
  assert.equal(h.usiaDipakai, DEMO_DEFAULT.age, 'nilai bawaannya harus yang benar-benar dipakai')
  assert.equal(h.nilai, hrMaxFromAge(DEMO_DEFAULT.age, DEMO_DEFAULT.sex))
}

// Usia tidak sah diperlakukan sama dengan kosong, bukan dipakai diam-diam.
for (const buruk of [0, -5, Number.NaN, undefined]) {
  const h = hrMaksimum([{ maxHr: 100 }], { age: buruk as number })
  assert.equal(h.asal, 'asumsi-usia', `usia ${String(buruk)} harus gagal tertutup`)
}

// Sesi tanpa denyut tercatat tidak boleh menjadi "terukur 0".
{
  const h = hrMaksimum([{}, {}], { age: 40, sex: 'F' })
  assert.equal(h.asal, 'perkiraan-usia')
  assert.equal(h.nilai, hrMaxFromAge(40, 'F'))
}

// ── 4. Layar harus MENGATAKAN ketiganya, dengan kata berbeda ───────────────
const halaman = readFileSync('src/pages/WorkoutHistory.tsx', 'utf8')
assert.match(halaman, /hrMaksimum\(/, 'the page must take HRmax with its provenance')
assert.doesNotMatch(halaman, /hrMaxFromAge\(demo\.age \|\| 30/,
  'the silent age-30 fallback must not come back on this page')
assert.match(halaman, /\(measured\)/, 'a measured HRmax must say so')
assert.match(halaman, /\(estimated from age\)/, 'an age estimate must say so')
assert.match(halaman, /\(assumed\)/, 'an assumed HRmax must say so')
assert.match(halaman, /is an ASSUMPTION, not your data/,
  'the assumed case must be stated plainly, not softened')
assert.match(halaman, /scatters by roughly ten beats/,
  'the formula estimate must carry its real uncertainty')

console.log(
  'HRmax provenance: measured / estimated-from-saved-age / assumed-from-empty-profile are separated, ' +
  'invalid ages fail closed to assumed, and the page states which one it is showing.',
)
