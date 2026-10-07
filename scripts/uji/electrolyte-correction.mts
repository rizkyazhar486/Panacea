import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { correctedSodiumKatz, potassiumAssessment } from '../../src/domains/clinical-calculators/index.ts'

// ── Natrium (Katz): nilai tangan ──
const na = (n: number, g: number) => correctedSodiumKatz(n, g)
assert.deepEqual(na(130, 400), { ok: true, data: { correctedNa: 130 + 1.6 * 3 } }) // 134.8
assert.deepEqual(na(130, 100), { ok: true, data: { correctedNa: 130 } })            // tepat di 100: tanpa koreksi
assert.deepEqual(na(130, 50), { ok: true, data: { correctedNa: 130 } })             // di bawah 100: tidak dikoreksi turun
assert.deepEqual(na(120, 600), { ok: true, data: { correctedNa: 120 + 1.6 * 5 } })
// Pasangan: hanya glukosa berbeda (100 vs 200) → koreksi baru muncul di atas 100. Toleransi 1e-9 karena selisih float.
const g100 = na(130, 100), g200 = na(130, 200)
assert.ok(g100.ok && g200.ok && Math.abs(g200.data.correctedNa - g100.data.correctedNa - 1.6) < 1e-9)
// Regresi: perilaku lama dipertahankan untuk seluruh masukan sah (oracle = baris rumus halaman sebelum dipindah).
for (let n = 80; n <= 200; n += 7) for (let g = 20; g <= 2000; g += 37) {
  const lama = n + 1.6 * Math.max(0, (g - 100) / 100)
  const r = na(n, g); assert.ok(r.ok); if (r.ok) assert.equal(r.data.correctedNa, lama, `${n},${g}`)
}
// Batas dan penolakan.
for (const [n, g] of [[80, 20], [200, 2000]] as const) assert.equal(na(n, g).ok, true, `${n},${g}`)
const GN = { ok: false, reason: 'Sodium must be 80–200 mEq/L' }, GG = { ok: false, reason: 'Glucose must be 20–2000 mg/dL' }
for (const n of [79.99, 0, -130, 200.01, NaN, Infinity, +'']) assert.deepEqual(na(n, 400), GN, `Na ${n}`)
for (const g of [19.99, 0, -400, 2000.01, NaN, Infinity, +'']) assert.deepEqual(na(130, g), GG, `glukosa ${g}`)
for (const salah of [undefined, null, '130', {}] as unknown as number[]) { assert.equal(na(salah, 400).ok, false); assert.equal(na(130, salah).ok, false) }
assert.equal('data' in (na(0, 400) as object), false)

// ── Kalium ──
const kp = (k: number) => potassiumAssessment(k)
// Valor tangan 160–320 mEq dan 320–640 mEq; ditulis (4.0 − K) × faktor agar sama persis dengan aritmetika float.
assert.ok(Math.abs((4.0 - 3.2) * 200 - 160) < 1e-9 && Math.abs((4.0 - 2.4) * 400 - 640) < 1e-9)
assert.deepEqual(kp(3.2), { ok: true, data: { deficitMeq: { low: (4.0 - 3.2) * 200, high: (4.0 - 3.2) * 400 }, severity: { label: 'Mild', tone: 'low' } } })
assert.deepEqual(kp(4.0), { ok: true, data: { deficitMeq: null, severity: { label: 'Normal', tone: 'normal' } } })
assert.deepEqual(kp(2.4), { ok: true, data: { deficitMeq: { low: (4.0 - 2.4) * 200, high: (4.0 - 2.4) * 400 }, severity: { label: 'Severe — monitor ECG closely', tone: 'critical' } } })
assert.equal(kp(5.0).ok && (kp(5.0) as { data: { deficitMeq: unknown } }).data.deficitMeq, null, 'K ≥ 4 tidak punya defisit')
// Setiap ambang keparahan diuji pada batas dan ±1 langkah (pasangan di tiap sisi).
const label = (k: number) => { const r = kp(k); assert.ok(r.ok, `K ${k}`); return r.ok ? r.data.severity.label : '' }
const S = 'Severe — monitor ECG closely'
for (const [k, l] of [
  [2.49, S], [2.5, 'Moderate'], [2.99, 'Moderate'], [3.0, 'Mild'], [3.49, 'Mild'], [3.5, 'Normal'],
  [5.5, 'Normal'], [5.51, 'Mild'], [6.0, 'Mild'], [6.01, 'Moderate'], [6.5, 'Moderate'], [6.51, S],
] as const) assert.equal(label(k), l, `K ${k}`)
// Regresi: rentang defisit identik dengan rumus halaman lama pada seluruh masukan sah.
for (let k = 1; k <= 10; k += 0.1) {
  const r = kp(Number(k.toFixed(1))); assert.ok(r.ok); if (!r.ok) continue
  const kk = Number(k.toFixed(1))
  if (kk < 4.0) assert.deepEqual(r.data.deficitMeq, { low: Math.max(0, (4.0 - kk) * 200), high: Math.max(0, (4.0 - kk) * 400) })
  else assert.equal(r.data.deficitMeq, null)
}
for (const k of [1, 10]) assert.equal(kp(k).ok, true, `K ${k}`)
const GK = { ok: false, reason: 'Potassium must be 1–10 mEq/L' }
for (const k of [0.99, 0, -3.2, 10.01, NaN, Infinity, -Infinity, +'']) assert.deepEqual(kp(k), GK, `K ${k}`)
for (const salah of [undefined, null, '3.2'] as unknown as number[]) assert.equal(kp(salah).ok, false)
assert.equal('data' in (kp(0) as object), false)
// Jebakan nyata: kolom kosong dibaca 0 dan halaman lama menampilkan defisit 800–1600 mEq dengan lencana "Severe".
assert.equal((4.0 - +'') * 200, 800)

// Halaman memakai fungsi kanonik, tanpa menghitung ulang.
const halaman = readFileSync('src/pages/clinical/ClinicalCalculators.tsx', 'utf8')
assert.match(halaman, /correctedSodiumKatz\(measuredNa, glucose\)/)
assert.match(halaman, /potassiumAssessment\(measuredK\)/)
assert.match(halaman, /sodium\.ok \?/)
assert.match(halaman, /potassium\.ok \?/)
assert.match(halaman, /\{sodium\.reason\}/)
assert.match(halaman, /\{potassium\.reason\}/)
assert.doesNotMatch(halaman, /1\.6 \* Math\.max/, 'koreksi Katz tidak boleh disalin ke halaman')
assert.doesNotMatch(halaman, /Severe — monitor ECG closely/, 'ambang keparahan kalium hanya boleh ada di engine')
console.log('electrolyte-correction: golden values, behaviour-preserving regression grid, every K threshold at the boundary, fail-closed ranges')
