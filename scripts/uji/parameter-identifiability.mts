import assert from 'node:assert/strict'
import {
  assessScalarGainIdentifiability,
  type IdentifiabilityObservation,
} from '../../src/lib/physiology/parameterIdentifiability.ts'

// θ = 2, sigma = 1, x = 1..5 → I = 55, se = 1/√55, θ̂ = 2 (y exato).
const good: IdentifiabilityObservation[] = [1, 2, 3, 4, 5].map((x) => ({ x, y: 2 * x, sigma: 1 }))

// positif
const ok = assessScalarGainIdentifiability(good)
assert.equal(ok.ok, true)
if (ok.ok) {
  assert.equal(ok.truthClass, 'model-derived')
  assert.ok(Math.abs(ok.estimate - 2) < 1e-12)
  assert.ok(Math.abs(ok.standardError - 1 / Math.sqrt(55)) < 1e-12)
  assert.ok(Math.abs(ok.relativeHalfWidth - (1.959964 / Math.sqrt(55)) / 2) < 1e-12)
  assert.equal(ok.observationCount, 5)
}
// determinisme
assert.deepEqual(assessScalarGainIdentifiability(good), ok)

// negatif: data kurang (berpasangan dengan `good` — hanya jumlah yang beda)
const few = assessScalarGainIdentifiability(good.slice(0, 4))
assert.equal(few.ok, false)
if (!few.ok) assert.equal(few.reason, 'insufficient-observations')
assert.equal(assessScalarGainIdentifiability(good.slice(0, 5)).ok, true) // batas tepat

// negatif: tanpa eksitasi (x = 0 semua)
const flat = assessScalarGainIdentifiability(good.map((o) => ({ ...o, x: 0 })))
assert.equal(flat.ok === false && flat.reason, 'no-excitation')

// negatif: noise besar → ketidakpastian terlalu lebar
const noisy = assessScalarGainIdentifiability(good.map((o) => ({ ...o, sigma: 20 })))
assert.equal(noisy.ok === false && noisy.reason, 'uncertainty-too-wide')

// negatif: θ̂ = 0
const zero = assessScalarGainIdentifiability(good.map((o) => ({ ...o, y: 0 })))
assert.equal(zero.ok === false && zero.reason, 'estimate-near-zero')

// negatif: observasi tidak valid (NaN, Infinity, sigma <= 0, sigma hilang)
for (const bad of [{ x: NaN }, { y: Infinity }, { sigma: 0 }, { sigma: -1 }, { sigma: NaN }]) {
  const r = assessScalarGainIdentifiability([{ ...good[0], ...bad }, ...good.slice(1)])
  assert.equal(r.ok === false && r.reason, 'invalid-observation')
}

// negatif: kebijakan tidak valid
for (const policy of [
  { minObservations: 1, maxRelativeHalfWidth: 0.5 },
  { minObservations: 5.5, maxRelativeHalfWidth: 0.5 },
  { minObservations: 5, maxRelativeHalfWidth: 0 },
  { minObservations: 5, maxRelativeHalfWidth: NaN },
]) {
  const r = assessScalarGainIdentifiability(good, policy)
  assert.equal(r.ok === false && r.reason, 'invalid-policy')
}

// batas: ambang tepat di sekitar relativeHalfWidth
const rel = ok.ok ? ok.relativeHalfWidth : 0
assert.equal(assessScalarGainIdentifiability(good, { minObservations: 5, maxRelativeHalfWidth: rel }).ok, true)
assert.equal(
  assessScalarGainIdentifiability(good, { minObservations: 5, maxRelativeHalfWidth: rel * 0.999 }).ok,
  false,
)

// input tidak dimutasi
assert.equal(good[0].y, 2)
console.log('parameter-identifiability: ok')
