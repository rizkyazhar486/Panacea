import assert from 'node:assert/strict'
import {
  assessParameterIdentifiability,
  type IdentifiabilityObservation,
} from '../../src/lib/physiology/parameterIdentifiability.ts'

const obs = (day: number, value: number, sigma: number | null = 1, state: IdentifiabilityObservation['state'] = 'measured'): IdentifiabilityObservation => ({
  at: new Date(Date.UTC(2026, 8, 1 + day)).toISOString(), value, sigma, state,
})
const base = { parameterId: 'cardio.resting_hr', unit: 'bpm', priorRange: { min: 30, max: 220 } }
const good = [obs(0, 60), obs(2, 66), obs(4, 58), obs(6, 70), obs(8, 62), obs(10, 68)]

// positif: cukup observasi, rentang waktu, sinyal > derau
const ok = assessParameterIdentifiability({ ...base, observations: good })
assert.equal(ok.status, 'candidate-for-review')
assert.deepEqual(ok.blockers, [])
assert.equal(ok.evidence.admissibleCount, 6)
assert.equal(ok.evidence.spanDays, 10)
assert.ok(Math.abs(ok.evidence.sampleSd! - Math.sqrt(22.4)) < 1e-9)
assert.deepEqual(ok.boundary, { personalizationApplied: false, automaticRecalibrationAllowed: false, clinicalValidationClaimed: false })

// determinisme
assert.deepEqual(assessParameterIdentifiability({ ...base, observations: good }), ok)

// batas: tepat 5 observasi & tepat 7 hari lolos; satu kurang gagal
const edge = [obs(0, 60), obs(2, 66), obs(4, 58), obs(5, 70), obs(7, 62)]
assert.equal(assessParameterIdentifiability({ ...base, observations: edge }).status, 'candidate-for-review')
assert.deepEqual(assessParameterIdentifiability({ ...base, observations: edge.slice(0, 4) }).blockers, ['too-few-observations', 'span-too-short'])
const shortSpan = [obs(0, 60), obs(1, 66), obs(2, 58), obs(3, 70), obs(6.99, 62)]
assert.deepEqual(assessParameterIdentifiability({ ...base, observations: shortSpan }).blockers, ['span-too-short'])

// negatif: observasi simulated/derived tidak dihitung sebagai bukti pasien
const sim = assessParameterIdentifiability({ ...base, observations: [...edge.slice(0, 4), obs(7, 62, 1, 'simulated')] })
assert.equal(sim.status, 'population-default-only')
assert.equal(sim.evidence.rejectedNonPatientCount, 1)
assert.ok(sim.blockers.includes('too-few-observations'))

// negatif: di luar prior ditolak, tidak dipotong
const oor = assessParameterIdentifiability({ ...base, observations: [...edge.slice(0, 4), obs(7, 400)] })
assert.equal(oor.evidence.rejectedOutOfRangeCount, 1)
assert.equal(oor.status, 'population-default-only')

// negatif: σ hilang -> uncertainty-unquantified; berpasangan dengan kasus yang hanya beda di σ
const noSigma = assessParameterIdentifiability({ ...base, observations: good.map((o, i) => (i === 3 ? { ...o, sigma: null } : o)) })
assert.deepEqual(noSigma.blockers, ['uncertainty-unquantified'])
assert.equal(noSigma.evidence.signalToNoise, null)

// negatif: sinyal di bawah derau (σ besar)
const noisy = assessParameterIdentifiability({ ...base, observations: good.map((o) => ({ ...o, sigma: 5 })) })
assert.deepEqual(noisy.blockers, ['signal-below-noise'])

// kosong: fail-closed tanpa error
const empty = assessParameterIdentifiability({ ...base, observations: [] })
assert.equal(empty.status, 'population-default-only')
assert.equal(empty.evidence.sampleSd, null)

// input tidak valid ditolak
assert.throws(() => assessParameterIdentifiability({ ...base, observations: [obs(0, Number.NaN)] }), /finite/)
assert.throws(() => assessParameterIdentifiability({ ...base, observations: [{ ...obs(0, 60), at: 'bukan-tanggal' }] }), /timestamp/)
assert.throws(() => assessParameterIdentifiability({ ...base, observations: [obs(0, 60, 0)] }), /sigma/)
assert.throws(() => assessParameterIdentifiability({ ...base, priorRange: { min: 10, max: 10 }, observations: [] }), /priorRange/)
assert.throws(() => assessParameterIdentifiability({ ...base, unit: ' ', observations: [] }), /unit/)
assert.throws(() => assessParameterIdentifiability({ ...base, observations: [], policy: { minObservations: 1, minSpanDays: 7, minSignalToNoise: 2 } }), /minObservations/)

console.log('parameter-identifiability: fail-closed candidate gate verified (positive, negative, boundary, determinism)')
