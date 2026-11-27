import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildCockpitReadout } from '../../src/domains/personal-health/engine/bodyCockpitReadout.ts'
import {
  buildSystemBoard,
  computeZeroQueueNosocomialRisk,
  evaluateWholeBodyCouplingAndBioWatchpoints,
  pack128ByteFrontierFrame,
  unpack128ByteFrontierFrame,
} from '../../src/domains/body-exposure/engine/systemBoard.ts'
import type { SinyalSistem } from '../../src/lib/sinyalPribadiSistem.ts'

// 1. Fail-closed zero fabrication on empty input
const empty = buildCockpitReadout({})
assert.equal(empty.compartments.leanMassKg, null)
assert.equal(empty.compartments.totalBodyWaterL, null)
assert.equal(empty.networkBuses.autonomicVagal, null)
assert.equal(empty.networkBuses.hemodynamicOxygen, null)
assert.equal(empty.circadianBorbely, null)
assert.equal(empty.allostaticPid, null)

// 2. Positive multi-compartment BIA, 4-Bus Network Physiology, Borbely SCN & Allostatic PID
const rich = buildCockpitReadout({
  weightKg: 70, heightCm: 175, age: 30, sex: 'M', bodyFatPct: 16, muscleMassKg: 34.5,
  systolic: 116, diastolic: 74, restingHr: 56, hrvMs: 74, spo2Pct: 98, vo2max: 52,
  sleepH: 7.8, weeklyWorkoutMinutes: 240, localHour0to23: 16.5,
})
assert.equal(rich.compartments.fatMassKg?.value, 11.2)
assert.equal(rich.compartments.leanMassKg?.value, 58.8)
assert.equal(rich.compartments.skeletalMuscleMassKg?.value, 34.5)
assert.equal(rich.compartments.skeletalMuscleMassKg?.basis, 'recorded')
assert.equal(rich.compartments.totalBodyWaterL?.value, 42.9)
assert.equal(rich.compartments.icwL?.value, 26.6)
assert.equal(rich.compartments.ecwL?.value, 16.3)
assert.ok(rich.networkBuses.autonomicVagal && rich.networkBuses.autonomicVagal.value >= 50)
assert.ok(rich.networkBuses.hemodynamicOxygen && rich.networkBuses.hemodynamicOxygen.value >= 70)
assert.equal(rich.circadianBorbely?.phaseWindow, 'neuromuscular-peak')
assert.ok(rich.circadianBorbely && rich.circadianBorbely.estimatedCoreTempC > 37)
assert.equal(rich.allostaticPid?.clinicallyReviewed, false)
assert.ok(rich.allostaticPid && rich.allostaticPid.loadIndex0to100 <= 40)

// Determinism check
assert.deepEqual(
  buildCockpitReadout({ weightKg: 70, heightCm: 175, bodyFatPct: 16, sleepH: 7.5, localHour0to23: 10 }),
  buildCockpitReadout({ weightKg: 70, heightCm: 175, bodyFatPct: 16, sleepH: 7.5, localHour0to23: 10 }),
)

// 3. Bio-GDB Watchpoints & Ivanov 4-Bus coverage
const now = new Date('2026-11-19T06:00:00.000Z')
const emptyBio = evaluateWholeBodyCouplingAndBioWatchpoints(buildSystemBoard(new Map(), now))
assert.equal(emptyBio.buses.length, 4)
assert.ok(emptyBio.watchpoints.every((w) => w.status === 'UNOBSERVED' && w.value === null))
assert.equal(emptyBio.triggeredCount, 0)

const sig = (metric: string, value: number): SinyalSistem => ({ metric, value, recordedAt: '2026-11-18T12:00:00.000Z', count: 1, delta: null })
const rowsWithData = buildSystemBoard(new Map([['respiratory', [sig('spo2', 98)]], ['cardiovascular', [sig('hr', 58)]]]) as never, now)
const okBio = evaluateWholeBodyCouplingAndBioWatchpoints(rowsWithData, { spo2Pct: 98, restingHr: 58, hrvMs: 70 })
assert.equal(okBio.triggeredCount, 0)
assert.ok(okBio.watchpoints.every((w) => w.status === 'WITHIN_MODEL_BOUNDS'))

const faultBio = evaluateWholeBodyCouplingAndBioWatchpoints(rowsWithData, { spo2Pct: 89, restingHr: 108, hrvMs: 18 })
assert.ok(faultBio.triggeredCount >= 2)
assert.equal(faultBio.clinicallyReviewed, false)
assert.ok(faultBio.draftRecoveryHint && faultBio.draftRecoveryHint.includes('HBOT'))

// 4. Wells-Riley Zero-Queue Airborne Nosocomial Risk
const wr = computeZeroQueueNosocomialRisk({
  infectorsI: 1, quantaRateQPerHr: 48, pulmonaryVentM3PerHr: 0.54,
  waitingRoomHours: 1.5, jitDirectHours: 0.02, roomVentilationM3PerHr: 120,
})
assert.equal(wr.ok, true)
if (wr.ok) {
  assert.ok(wr.waitingRoomRiskPct > wr.jitRiskPct)
  assert.ok(wr.relativeRiskReductionPct > 98, `expected >98% HAI reduction, got ${wr.relativeRiskReductionPct}%`)
}
assert.equal(computeZeroQueueNosocomialRisk({ infectorsI: 1, quantaRateQPerHr: 48, pulmonaryVentM3PerHr: 0.54, waitingRoomHours: 1, jitDirectHours: 0.1, roomVentilationM3PerHr: 0 }).ok, false)

// 5. 128-Byte Binary 2G/Starlink Telemetry Frame Codec (round-trip + fail-closed corruption)
const packed = pack128ByteFrontierFrame({
  hrBpm: 62.5, hrvMs: 78.2, spo2Pct: 98.5, systolicMmHg: 118, diastolicMmHg: 76, tempC: 36.65, respRateBpm: null, epochSec: 1795000000,
})
assert.equal(packed.ok, true)
if (packed.ok) {
  assert.ok(packed.byteLength <= 128)
  assert.ok(packed.txMsAt9600bps < 100)
  const unpacked = unpack128ByteFrontierFrame(packed.bytes)
  assert.equal(unpacked.ok, true)
  if (unpacked.ok) {
    assert.equal(unpacked.payload.hrBpm, 62.5)
    assert.equal(unpacked.payload.spo2Pct, 98.5)
    assert.equal(unpacked.payload.tempC, 36.65)
    assert.equal(unpacked.payload.respRateBpm, null) // missing stays null, never 0
    assert.equal(unpacked.payload.epochSec, 1795000000)
  }
  // Negative: flip 1 bit -> checksum rejects fail-closed
  const corrupted = new Uint8Array(packed.bytes)
  corrupted[10] ^= 0x01
  assert.equal(unpack128ByteFrontierFrame(corrupted).ok, false)
  // Negative: truncated buffer rejected fail-closed
  assert.equal(unpack128ByteFrontierFrame(packed.bytes.slice(0, 12)).ok, false)
}

// 6. Video realism & clean UI contracts
for (const file of [
  'src/components/ui/VideoGallery.tsx',
  'src/pages/landing/sections/HeroSection.tsx',
]) {
  const txt = readFileSync(file, 'utf8')
  assert.doesNotMatch(txt, /d8j0ntlcm91z4\.cloudfront\.net[^\n]*autoPlay/s, `${file} must not autoPlay uncanny synthetic CDN clips`)
  assert.doesNotMatch(txt, /<video[^>]*autoPlay/s, `${file} must not force autoPlay looping videos`)
}
const analyzer = readFileSync('src/app/BodyAnalyzerPage.tsx', 'utf8')
assert.match(analyzer, /BodyAnalysisCommandDeck/)
assert.doesNotMatch(analyzer, /omniscience/i)

console.log('whole-body-os-frontier-kernel: OK')
