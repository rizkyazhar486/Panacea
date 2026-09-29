import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { KATALOG } from '../../server/src/healthMetrics.ts'
import {
  auditCakupanWearableLongitudinal,
  deviceSnapshotToBodyExposureSignals,
  KUNCI_METRIK_PERANGKAT_LONGITUDINAL,
} from '../../src/lib/healthStoreLongitudinalBridge.ts'

const kunciKatalog = KATALOG.map((d) => d.kunci)
const audit = auditCakupanWearableLongitudinal(kunciKatalog)

assert.ok(audit.covered.length >= 46, `cakupan wearable terlalu kecil: ${audit.covered.length}`)
assert.ok(audit.gap.length > 0, 'gap harus eksplisit — jangan pura-pura katalog penuh')
for (const wajib of ['restingHr', 'hrvMs', 'vo2max', 'waistCm', 'bloodGlucoseMgdl', 'walkingHr', 'proteinG', 'carbsG', 'dietKcal', 'caffeineMg']) {
  assert.ok(audit.covered.includes(wajib), `${wajib} belum masuk jembatan longitudinal`)
}
for (const perangkat of ['sleepH', 'sleepDeepH', 'restingHr', 'sodiumMg']) {
  assert.ok(KUNCI_METRIK_PERANGKAT_LONGITUDINAL.includes(perangkat), `${perangkat} hilang dari DEVICE_METRICS`)
}
for (const belum of ['vitCMg', 'biotinMcg', 'sexualActivity']) {
  assert.ok(audit.gap.includes(belum), `${belum} harus tetap gap (mikronutrien/detail belum diprioritaskan)`)
}
assert.deepEqual(
  [...KUNCI_METRIK_PERANGKAT_LONGITUDINAL].sort(),
  [...KUNCI_METRIK_PERANGKAT_LONGITUDINAL].sort(),
)

const sinyal = deviceSnapshotToBodyExposureSignals({ restingHr: 56, hrvMs: 42, sleepH: 7.2, vo2max: 0, junk: 9 })
assert.deepEqual(sinyal.map((s) => s.jenisId), ['restingHr', 'hrvMs', 'sleepH'])
assert.ok(sinyal.every((s) => s.source === 'device-snapshot' && s.truthClass === 'patient-recorded'))
assert.deepEqual(deviceSnapshotToBodyExposureSignals({}), [])
assert.deepEqual(deviceSnapshotToBodyExposureSignals({ restingHr: -1, hrvMs: NaN }), [])
assert.deepEqual(deviceSnapshotToBodyExposureSignals({ restingHr: 56 }, { max: 0 }), [])

const overlay = readFileSync('src/components/BodyExposurePatientOverlay.tsx', 'utf8')
assert.match(overlay, /deviceSnapshotToBodyExposureSignals\(/)
assert.match(overlay, /data-pmd-device-overlay-signal/)

{
  const { labelMetrik } = await import('../../src/lib/perubahanLongitudinal.ts')
  assert.equal(labelMetrik('resting-heart-rate'), 'Resting heart rate')
  assert.equal(labelMetrik('dietary-protein'), 'Protein')
  assert.equal(labelMetrik('dietary-caffeine'), 'Caffeine')
  assert.equal(labelMetrik('lab.gdp'), 'Fasting glucose')
}

console.log(
  `audit-wearable-longitudinal: ${audit.covered.length} covered, ${audit.gap.length} explicit gaps; device overlay wired`,
)
