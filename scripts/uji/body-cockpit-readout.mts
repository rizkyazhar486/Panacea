import assert from 'node:assert/strict'
import { buildCockpitReadout, navyBodyFatPct } from '../../src/domains/personal-health/engine/bodyCockpitReadout.ts'

// kosong: tidak ada satu pun angka karangan
const kosong = buildCockpitReadout({})
for (const k of ['weight', 'height', 'bmi', 'waistToHip', 'waistToHeight', 'bodyFatPct', 'bmr', 'bloodPressure', 'meanArterialPressure', 'restingHr', 'hrvMs', 'spo2Pct', 'vo2max', 'sleepH'] as const) assert.equal(kosong[k], null, `${k} harus kosong tanpa data`)
assert.ok(kosong.missing.length >= 3)

// positif: golden case dihitung tangan. 70 kg / 175 cm → BMI 22.9; MAP 120/80 → 93; Mifflin pria 30 th → 1648.75 → 1649
const p = buildCockpitReadout({ weightKg: 70, heightCm: 175, age: 30, sex: 'M', systolic: 120, diastolic: 80, restingHr: 60 })
assert.equal(p.bmi?.value, 22.9); assert.equal(p.bmi?.basis, 'derived')
assert.equal(p.meanArterialPressure?.value, 93); assert.equal(p.bmr?.value, 1649)
assert.equal(p.weight?.basis, 'recorded'); assert.equal(p.restingHr?.value, 60)
// Mifflin perempuan 30 th = 10*60 + 6.25*165 - 150 - 161 = 1320.25 → 1320
assert.equal(buildCockpitReadout({ weightKg: 60, heightCm: 165, age: 30, sex: 'F' }).bmr?.value, 1320)

// Navy golden pria: tinggi 180, pinggang 90, leher 38 → 19.8 %
assert.equal(navyBodyFatPct('M', 180, 90, 38), 19.8)
// berpasangan: perempuan butuh pinggul; tanpa pinggul → null, dengan pinggul → angka
assert.equal(navyBodyFatPct('F', 165, 75, 32), null)
assert.equal(typeof navyBodyFatPct('F', 165, 75, 32, 98), 'number')
// negatif: argumen logaritma tidak positif (leher ≥ pinggang) → null
assert.equal(navyBodyFatPct('M', 180, 38, 38), null); assert.equal(navyBodyFatPct('M', 180, 30, 38), null)
// lemak tercatat didahulukan atas estimasi Navy
assert.equal(buildCockpitReadout({ sex: 'M', heightCm: 180, waistCm: 90, neckCm: 38, bodyFatPct: 15 }).bodyFatPct?.basis, 'recorded')
assert.equal(buildCockpitReadout({ sex: 'M', heightCm: 180, waistCm: 90, neckCm: 38 }).bodyFatPct?.basis, 'derived')

// negatif: nilai tak masuk akal, NaN, Infinity, tipe salah → dianggap kosong, bukan dikoreksi
for (const [k, v] of [['weightKg', -5], ['weightKg', Number.NaN], ['weightKg', Infinity], ['heightCm', 17.5], ['heightCm', 1750], ['spo2Pct', 101], ['hrvMs', 0], ['sleepH', 30]] as const) {
  const r = buildCockpitReadout({ [k]: v } as never)
  const nama = ({ weightKg: 'weight', heightCm: 'height', spo2Pct: 'spo2Pct', hrvMs: 'hrvMs', sleepH: 'sleepH' } as const)[k]
  assert.equal(r[nama], null, `${k}=${v} ditolak`)
}
assert.equal(buildCockpitReadout({ weightKg: '70' as never, heightCm: 175 }).bmi, null)
// batas rentang: tepat di batas diterima, satu langkah di luar ditolak
assert.equal(buildCockpitReadout({ spo2Pct: 100 }).spo2Pct?.value, 100); assert.equal(buildCockpitReadout({ spo2Pct: 100.1 }).spo2Pct, null)
assert.equal(buildCockpitReadout({ heightCm: 80 }).height?.value, 80); assert.equal(buildCockpitReadout({ heightCm: 79.9 }).height, null)
// tekanan darah: butuh keduanya dan sistolik > diastolik; tanpa itu tidak ada MAP
assert.equal(buildCockpitReadout({ systolic: 120 }).bloodPressure, null)
assert.equal(buildCockpitReadout({ systolic: 80, diastolic: 120 }).meanArterialPressure, null)
// satu syarat berbeda: tanpa jenis kelamin / usia → BMR kosong; BMI tetap ada
const tanpaUsia = buildCockpitReadout({ weightKg: 70, heightCm: 175, sex: 'M' })
assert.equal(tanpaUsia.bmr, null); assert.equal(tanpaUsia.bmi?.value, 22.9)
assert.equal(buildCockpitReadout({ weightKg: 70, heightCm: 175, age: 30, sex: 'X' as never }).bmr, null)
// determinisme
assert.deepEqual(buildCockpitReadout({ weightKg: 70, heightCm: 175 }), buildCockpitReadout({ weightKg: 70, heightCm: 175 }))

// preventiveAssurance: fail-closed tanpa < 2 sinyal, deterministik & terukur dengan sinyal nyata
assert.equal(kosong.preventiveAssurance, null, 'preventiveAssurance harus null tanpa data')
assert.equal(buildCockpitReadout({ weightKg: 70 }).preventiveAssurance, null, '1 sinyal tidak boleh menghasilkan skor preventiveAssurance')
assert.ok(p.preventiveAssurance !== null)
assert.equal(p.preventiveAssurance.recordedSignalCount, 4)
assert.equal(p.preventiveAssurance.totalCoreSignals, 10)
assert.equal(p.preventiveAssurance.coveragePct, 40)
assert.equal(p.preventiveAssurance.triageStage, 'lifestyle-early-action') // diastolic 80 >= 80
assert.equal(p.preventiveAssurance.assuranceClaimReadiness, 'verified-longitudinal-ready')
assert.equal(p.preventiveAssurance.clinicallyReviewed, false)
assert.ok(p.preventiveAssurance.dailyPreventionActions.length >= 1)

// normal vs eskalasi berbasis nilai nyata
const routine = buildCockpitReadout({ weightKg: 70, heightCm: 175, age: 30, sex: 'M', systolic: 115, diastolic: 75, restingHr: 60 })
assert.equal(routine.preventiveAssurance?.triageStage, 'routine-preventive')
const hypo = buildCockpitReadout({ spo2Pct: 92, restingHr: 70 })
assert.equal(hypo.preventiveAssurance?.triageStage, 'clinician-review-recommended')
const early = buildCockpitReadout({ systolic: 132, diastolic: 84, sleepH: 5.5 })
assert.equal(early.preventiveAssurance?.triageStage, 'lifestyle-early-action')

console.log('body-cockpit-readout: OK')
