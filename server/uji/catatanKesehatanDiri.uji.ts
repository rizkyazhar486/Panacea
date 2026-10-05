import assert from 'node:assert/strict'
import { bacaSelfVitalsLog, bacaVo2maxLog, validasiSelfVitalsLog, validasiVo2maxLog } from '../src/catatanKesehatanDiri.ts'

const ok = validasiSelfVitalsLog([
  { id: 'a1', at: '2026-09-28T10:00:00.000Z', systolic: 120, diastolic: 80, heartRate: 72, spo2: 98, tempC: 36.8 },
])
assert.equal(ok.length, 1)
assert.equal(ok[0].systolic, 120)

assert.throws(() => validasiSelfVitalsLog([{ id: 'x', at: '2026-09-28T10:00:00.000Z', systolic: 120, diastolic: 80, heartRate: 72, spo2: 98 }]), /incomplete/)
assert.throws(() => validasiSelfVitalsLog([{ id: 'x', at: 'nope', systolic: 120, diastolic: 80, heartRate: 72, spo2: 98, tempC: 36.8 }]), /time/)
assert.throws(() => validasiVo2maxLog([{ id: 'v1', at: '2026-09-28T10:00:00.000Z', value: 0, method: 'x' }]), /value/)

const vo2 = validasiVo2maxLog([
  { id: 'v1', at: '2026-09-28T10:00:00.000Z', value: 42.5, method: 'Cooper' },
  { id: 'v1', at: '2026-09-27T10:00:00.000Z', value: 40, method: 'dup' },
])
assert.equal(vo2.length, 1, 'duplicate ids keep the first occurrence after sort input order dedupe')

assert.deepEqual(bacaSelfVitalsLog({ selfVitalsLog: 'bad' }), [])
assert.deepEqual(bacaVo2maxLog({ vo2maxEntries: [{ id: 'bad' }] }), [])

const { validasiDiarySleep, validasiDiaryFoods, validasiDiaryWellness, validasiDiaryTraining, validasiDiaryGps, bacaDiarySleep } = await import('../src/catatanKesehatanDiri.ts')
const tidur = validasiDiarySleep([
  { id: 's1', date: '2026-09-28', hours: 7.5, bedtimeConsistent: true },
  { id: 's1', date: '2026-09-27', hours: 6, bedtimeConsistent: false },
])
assert.equal(tidur.length, 1)
assert.equal(tidur[0].hours, 7.5)
assert.equal(validasiDiarySleep([{ id: 's0', date: '2026-09-28', hours: 0, bedtimeConsistent: false }])[0].hours, 0)
assert.throws(() => validasiDiarySleep([{ id: 's1', date: '2026-09-28', hours: 24.1, bedtimeConsistent: true }]), /invalid sleep/)
assert.throws(() => validasiDiarySleep('nope'), /list/)
assert.throws(() => validasiDiaryFoods([{ id: 'f1', date: '2026-09-28', name: ' ', grams: 100, kcal: 10, protein: 1, carbs: 1, fat: 1 }]), /invalid food/)
assert.throws(() => validasiDiaryFoods([{ id: 'f1', date: '2026-09-28', name: 'rice', grams: 100, kcal: 0, protein: 0, carbs: 0, fat: 0 }]), /invalid food/)
const makan = validasiDiaryFoods([{ id: 'f1', date: '2026-09-28', name: ' rice ', grams: 100, kcal: 130, protein: 3, carbs: 28, fat: 0 }])
assert.equal(makan[0].name, 'rice')
assert.equal(makan[0].fat, 0)
assert.throws(() => validasiDiaryWellness([{ date: '2026-09-28', waterMl: -1 }]), /water/)
assert.equal(validasiDiaryWellness([{ date: '2026-09-28', waterMl: 20000 }])[0].waterMl, 20000)
assert.throws(() => validasiDiaryWellness([{ date: '2026-09-28', waterMl: 20001 }]), /water/)
const hari = validasiDiaryWellness([
  { date: '2026-09-28', waterMl: 1800 },
  { date: '2026-09-28', sleepHr: 8 },
  { date: '2026-09-27' },
])
assert.equal(hari.length, 1)
assert.equal(hari[0].waterMl, 1800)
assert.deepEqual(bacaDiarySleep({ diarySleep: [{ id: 'bad' }] }), [])

const { susunPatchDiary, MAKS_TIDUR } = await import('../src/catatanKesehatanDiri.ts')
const profil = {
  diarySleep: [{ id: 's1', date: '2026-09-28', hours: 7, bedtimeConsistent: true }],
  diaryFoods: [{ id: 'f1', date: '2026-09-28', name: 'rice', grams: 100, kcal: 130, protein: 3, carbs: 28, fat: 0 }],
  diaryWellness: [{ date: '2026-09-28', waterMl: 1800 }],
}
const gabung = susunPatchDiary(profil, {
  sleepLogs: [
    { id: 's1', date: '2026-09-28', hours: 4, bedtimeConsistent: false },
    { id: 's2', date: '2026-09-29', hours: 8, bedtimeConsistent: true },
  ],
  foods: [{ id: 'f2', date: '2026-09-29', name: 'egg', grams: 50, kcal: 70, protein: 6, carbs: 1, fat: 5 }],
  wellness: [{ date: '2026-09-28', waterMl: 200, sleepHr: 7 }, { date: '2026-09-29', waterMl: 1500 }],
})
const tidurGabung = gabung.diarySleep as { id: string; hours: number }[]
assert.equal(tidurGabung.find((r) => r.id === 's1')?.hours, 7)
assert.equal(tidurGabung.some((r) => r.id === 's2'), true)
assert.equal((gabung.diaryFoods as { id: string }[]).map((r) => r.id).sort().join(','), 'f1,f2')
const hariGabung = gabung.diaryWellness as { date: string; waterMl?: number; sleepHr?: number }[]
assert.equal(hariGabung.find((r) => r.date === '2026-09-28')?.waterMl, 1800)
assert.equal(hariGabung.find((r) => r.date === '2026-09-28')?.sleepHr, 7)
assert.equal(hariGabung.find((r) => r.date === '2026-09-29')?.waterMl, 1500)
assert.equal((profil.diarySleep as { hours: number }[])[0].hours, 7)

const kosong = susunPatchDiary(profil, { sleepLogs: [] })
assert.equal((kosong.diarySleep as { id: string }[])[0].id, 's1')
assert.equal((kosong.diarySleep as { id: string }[]).length, 1)

assert.throws(() => susunPatchDiary(profil, { sleepLogs: [{ id: 's9', date: '2026-09-28', hours: 30, bedtimeConsistent: true }] }), /invalid sleep/)
assert.equal((profil.diarySleep as { hours: number }[])[0].hours, 7)
assert.throws(() => susunPatchDiary(profil, {}), /diary payload is empty/)

const penuh = Array.from({ length: MAKS_TIDUR }, (_, i) => {
  const d = new Date(Date.UTC(2026, 0, 1 + i))
  return { id: `p${i}`, date: d.toISOString().slice(0, 10), hours: 7, bedtimeConsistent: true }
})
const batas = susunPatchDiary({ diarySleep: penuh }, {
  sleepLogs: [{ id: 'baru', date: '2026-12-01', hours: 8, bedtimeConsistent: true }],
})
const batasTidur = batas.diarySleep as { id: string }[]
assert.equal(batasTidur.length, MAKS_TIDUR)
assert.equal(batasTidur.some((r) => r.id === 'baru'), true)
assert.equal(batasTidur.some((r) => r.id === 'p0'), false)
assert.equal((susunPatchDiary({ diarySleep: penuh }, { sleepLogs: [] }).diarySleep as unknown[]).length, MAKS_TIDUR)

const { buangKunciDiary, MAKS_NISAN } = await import('../src/catatanKesehatanDiri.ts')
const diganti = susunPatchDiary(profil, {
  sleepLogs: [{ id: 's9', date: '2026-09-28', hours: 8, bedtimeConsistent: false }],
})
assert.deepEqual((diganti.diarySleep as { id: string; hours: number }[]).map((r) => [r.id, r.hours]), [['s9', 8]])
assert.deepEqual(diganti.diaryRemovedSleep, ['s1'])
const hidupLagi = susunPatchDiary(
  { diarySleep: diganti.diarySleep, diaryRemovedSleep: diganti.diaryRemovedSleep },
  { sleepLogs: [{ id: 's1', date: '2026-09-28', hours: 7, bedtimeConsistent: true }] },
)
assert.equal((hidupLagi.diarySleep as { id: string }[]).some((r) => r.id === 's1'), false)
assert.equal((hidupLagi.diarySleep as { id: string }[])[0].id, 's9')

const hapus = susunPatchDiary(profil, { removeFoodIds: ['f1'] })
assert.equal((hapus.diaryFoods as unknown[]).length, 0)
assert.deepEqual(hapus.diaryRemovedFoods, ['f1'])
assert.equal((profil.diaryFoods as unknown[]).length, 1)
const tidakHidup = susunPatchDiary(
  { diaryFoods: hapus.diaryFoods, diaryRemovedFoods: hapus.diaryRemovedFoods },
  { foods: [{ id: 'f1', date: '2026-09-28', name: 'rice', grams: 100, kcal: 130, protein: 3, carbs: 28, fat: 0 }] },
)
assert.equal((tidakHidup.diaryFoods as unknown[]).length, 0)
assert.throws(() => susunPatchDiary(profil, { removeFoodIds: [''] }), /invalid removed id/)
assert.equal((profil.diaryFoods as { id: string }[])[0].id, 'f1')
assert.throws(() => susunPatchDiary(profil, { removeFoodIds: [] }), /diary payload is empty/)
assert.throws(() => susunPatchDiary(profil, { removeSleepIds: Array.from({ length: 101 }, (_, i) => `x${i}`) }), /too many removed ids/)

const nisanPenuh = Array.from({ length: MAKS_NISAN }, (_, i) => `n${i}`)
assert.throws(
  () => susunPatchDiary({ diaryRemovedFoods: nisanPenuh, diaryFoods: [] }, { removeFoodIds: ['nbaru'] }),
  /deletion memory is full/,
)
const nisanUtuh = { diaryRemovedFoods: nisanPenuh, diaryFoods: [] as unknown[] }
assert.throws(
  () => susunPatchDiary(nisanUtuh, { removeFoodIds: ['nbaru'] }),
  /deletion memory is full/,
)
assert.equal((nisanUtuh.diaryRemovedFoods as string[]).includes('n0'), true)
assert.equal((nisanUtuh.diaryFoods as unknown[]).length, 0)
const nisanUlang = susunPatchDiary({ diaryRemovedFoods: nisanPenuh, diaryFoods: [] }, { removeFoodIds: ['n0'] })
assert.equal((nisanUlang.diaryRemovedFoods as string[]).length, MAKS_NISAN)
assert.equal((nisanUlang.diaryRemovedFoods as string[]).includes('n0'), true)
const nisanTetap = susunPatchDiary(
  { diaryRemovedFoods: nisanPenuh, diaryFoods: [] },
  { foods: [{ id: 'n0', date: '2026-09-28', name: 'rice', grams: 100, kcal: 130, protein: 3, carbs: 28, fat: 0 }] },
)
assert.equal((nisanTetap.diaryFoods as unknown[]).length, 0)
const hampir = Array.from({ length: MAKS_NISAN - 1 }, (_, i) => `h${i}`)
const nisanMuat = susunPatchDiary({ diaryRemovedFoods: hampir, diaryFoods: [] }, { removeFoodIds: ['hbaru'] })
assert.equal((nisanMuat.diaryRemovedFoods as string[]).length, MAKS_NISAN)
assert.equal((nisanMuat.diaryRemovedFoods as string[]).includes('h0'), true)
assert.equal((nisanMuat.diaryRemovedFoods as string[]).includes('hbaru'), true)

const disaring = buangKunciDiary({
  weightKg: 70,
  diarySleep: [{ id: 's1' }],
  diaryFoods: [{ id: 'f1' }],
  diaryWellness: [{ date: '2026-09-28' }],
  diaryRemovedFoods: ['f1'],
  diaryRemovedSleep: ['s1'],
  diaryRemovedTraining: ['t1'],
  diaryRemovedGps: ['g1'],
  selfVitalsLog: [{ id: 'v' }],
  vo2maxEntries: [{ id: 'o' }],
})
assert.equal(disaring.weightKg, 70)
assert.equal('diaryRemovedFoods' in disaring, false)
assert.equal('diaryRemovedTraining' in disaring, false)
assert.equal('diaryRemovedGps' in disaring, false)
assert.equal('diarySleep' in disaring, false)
assert.equal('selfVitalsLog' in disaring, false)

const latihan = susunPatchDiary({
  diaryTraining: [{ id: 't1', date: '2026-09-28', rpe: 8, type: 'Lari' }],
}, {
  trainingLogs: [
    { id: 't1', date: '2026-09-28', rpe: 3, type: 'Lari' },
    { id: 't2', date: '2026-09-29', rpe: 1, type: 'Gym', note: '  mudah  ' },
  ],
})
const barisLatihan = latihan.diaryTraining as { id: string; rpe: number; note?: string }[]
assert.equal(barisLatihan.find((r) => r.id === 't1')?.rpe, 8)
assert.equal(barisLatihan.find((r) => r.id === 't2')?.rpe, 1)
assert.equal(barisLatihan.find((r) => r.id === 't2')?.note, 'mudah')
assert.equal((susunPatchDiary({ diaryTraining: [{ id: 't1', date: '2026-09-28', rpe: 8, type: 'Lari' }] }, { trainingLogs: [] }).diaryTraining as { id: string }[])[0].id, 't1')
const hapusLatihan = susunPatchDiary({
  diaryTraining: [
    { id: 't1', date: '2026-09-28', rpe: 8, type: 'Lari' },
    { id: 't2', date: '2026-09-29', rpe: 4, type: 'Gym' },
  ],
}, { removeTrainingIds: ['t1'] })
assert.equal((hapusLatihan.diaryTraining as { id: string }[]).some((r) => r.id === 't1'), false)
assert.equal((hapusLatihan.diaryTraining as { id: string }[])[0].id, 't2')
assert.deepEqual(hapusLatihan.diaryRemovedTraining, ['t1'])
const pulihLatihan = susunPatchDiary(
  { diaryTraining: hapusLatihan.diaryTraining, diaryRemovedTraining: hapusLatihan.diaryRemovedTraining },
  { trainingLogs: [{ id: 't1', date: '2026-09-28', rpe: 8, type: 'Lari' }] },
)
assert.equal((pulihLatihan.diaryTraining as { id: string }[]).some((r) => r.id === 't1'), false)
const profilHapusLatihan = { diaryTraining: [{ id: 't1', date: '2026-09-28', rpe: 8, type: 'Lari' }] }
assert.throws(() => susunPatchDiary(profilHapusLatihan, { removeTrainingIds: ['bukan id'] }), /invalid removed id/)
assert.equal((profilHapusLatihan.diaryTraining as { id: string }[])[0].id, 't1')
assert.throws(() => susunPatchDiary(profilHapusLatihan, { removeTrainingIds: Array.from({ length: 101 }, (_, i) => `id${i}ok`) }), /too many removed ids/)
assert.equal((profilHapusLatihan.diaryTraining as { id: string }[])[0].id, 't1')
assert.throws(() => susunPatchDiary(profilHapusLatihan, { removeTrainingIds: [] }), /diary payload is empty/)
assert.equal((profilHapusLatihan.diaryTraining as { id: string }[])[0].id, 't1')
assert.equal(validasiDiaryTraining([{ id: 'tb', date: '2026-09-28', rpe: 10, type: 'HIIT' }])[0].rpe, 10)
assert.throws(() => validasiDiaryTraining([{ id: 'tb', date: '2026-09-28', rpe: 0, type: 'HIIT' }]), /invalid training/)
assert.throws(() => validasiDiaryTraining([{ id: 'tb', date: '2026-09-28', rpe: 10.1, type: 'HIIT' }]), /invalid training/)
assert.throws(() => validasiDiaryTraining([{ id: 'tb', date: '2026-09-28', rpe: 5, type: 'HIIT', note: 4 }]), /invalid training note/)
const profilLatihan = { diaryTraining: [{ id: 't1', date: '2026-09-28', rpe: 8, type: 'Lari' }] }
assert.throws(() => susunPatchDiary(profilLatihan, { trainingLogs: [{ id: 'tx', date: '2026-09-28', rpe: 5, type: ' ' }] }), /invalid training/)
assert.equal((profilLatihan.diaryTraining as { rpe: number }[])[0].rpe, 8)

const gps = susunPatchDiary({
  diaryGps: [{ id: 'g1', name: 'Pagi', sport: 'Lari', sportType: 'run', distKm: 5, durSec: 1800, avgSpeedKmh: 10, kcal: 300, at: '2026-09-28T01:00:00.000Z' }],
}, {
  gpsActivities: [{
    id: 'g2', name: 'Sore', sport: 'Sepeda', sportType: 'cycle', emoji: '🚴',
    distKm: 20, durSec: 3600, avgSpeedKmh: 20, kcal: 0, at: '2026-09-29T01:00:00.000Z',
    avgHr: 140, maxHr: 160, hrSamples: [{ s: 0, bpm: 140 }, { s: 30, bpm: 150 }],
  }],
})
const barisGps = gps.diaryGps as { id: string; hrSamples?: unknown; kcal: number; avgHr?: number }[]
assert.equal(barisGps.map((r) => r.id).sort().join(','), 'g1,g2')
assert.equal(barisGps.find((r) => r.id === 'g2')?.kcal, 0)
assert.equal(barisGps.find((r) => r.id === 'g2')?.avgHr, 140)
assert.equal('hrSamples' in (barisGps.find((r) => r.id === 'g2') ?? {}), false)
const hapusGps = susunPatchDiary({
  diaryGps: [{ id: 'g1', name: 'Pagi', sport: 'Lari', sportType: 'run', distKm: 5, durSec: 1800, avgSpeedKmh: 10, kcal: 300, at: '2026-09-28T01:00:00.000Z' }],
}, { removeGpsIds: ['g1'] })
assert.equal((hapusGps.diaryGps as unknown[]).length, 0)
assert.deepEqual(hapusGps.diaryRemovedGps, ['g1'])
const pulihGps = susunPatchDiary(
  { diaryGps: hapusGps.diaryGps, diaryRemovedGps: hapusGps.diaryRemovedGps },
  { gpsActivities: [{ id: 'g1', name: 'Pagi', sport: 'Lari', sportType: 'run', distKm: 5, durSec: 1800, avgSpeedKmh: 10, kcal: 300, at: '2026-09-28T01:00:00.000Z' }] },
)
assert.equal((pulihGps.diaryGps as unknown[]).length, 0)
const profilGps = { diaryGps: [{ id: 'g1', name: 'Pagi', sport: 'Lari', sportType: 'run', distKm: 5, durSec: 1800, avgSpeedKmh: 10, kcal: 300, at: '2026-09-28T01:00:00.000Z' }] }
assert.throws(() => susunPatchDiary(profilGps, { removeGpsIds: [3] }), /invalid removed id/)
assert.equal((profilGps.diaryGps as { id: string }[])[0].id, 'g1')
assert.equal(validasiDiaryGps([{ id: 'gb', name: 'A', sport: 'Lari', sportType: 'run', distKm: 500, durSec: 86400, avgSpeedKmh: 150, kcal: 1, at: '2026-09-28T00:00:00.000Z' }]).length, 1)
assert.throws(() => validasiDiaryGps([{ id: 'gb', name: 'A', sport: 'Lari', sportType: 'run', distKm: 0, durSec: 60, avgSpeedKmh: 10, kcal: 1, at: '2026-09-28T00:00:00.000Z' }]), /invalid gps/)
assert.throws(() => validasiDiaryGps([{ id: 'gb', name: 'A', sport: 'Lari', sportType: 'fly', distKm: 1, durSec: 60, avgSpeedKmh: 10, kcal: 1, at: '2026-09-28T00:00:00.000Z' }]), /invalid gps/)
assert.throws(() => validasiDiaryGps([{ id: 'gb', name: 'A', sport: 'Lari', sportType: 'run', distKm: 1, durSec: 60, avgSpeedKmh: 10, kcal: 1, at: '2026-09-28T00:00:00.000Z', avgHr: 160, maxHr: 140 }]), /heart rate/)
const tanpaJejak = buangKunciDiary({ diaryTraining: [{ id: 't1' }], diaryGps: [{ id: 'g1' }], weightKg: 70 })
assert.equal(tanpaJejak.weightKg, 70)
assert.equal('diaryTraining' in tanpaJejak, false)
assert.equal('diaryGps' in tanpaJejak, false)

const airTersimpan = {
  diaryWellness: [
    { date: '2026-09-28', waterMl: 1800, sleepHr: 7 },
    { date: '2026-09-27', waterMl: 500 },
  ],
}
const air = susunPatchDiary(airTersimpan, {
  wellness: [
    { date: '2026-09-28', waterMl: 0 },
    { date: '2026-09-27', waterMl: 400 },
    { date: '2026-09-26', waterMl: 900 },
    { date: '2026-09-25', waterMl: 2200 },
    { date: '2026-09-24', waterMl: 0 },
  ],
})
const airHari = air.diaryWellness as { date: string; waterMl?: number; sleepHr?: number }[]
assert.equal(airHari.find((r) => r.date === '2026-09-28')?.waterMl, undefined)
assert.equal(airHari.find((r) => r.date === '2026-09-28')?.sleepHr, 7)
assert.equal(airHari.find((r) => r.date === '2026-09-27')?.waterMl, 500)
assert.equal(airHari.find((r) => r.date === '2026-09-26')?.waterMl, 900)
assert.equal(airHari.find((r) => r.date === '2026-09-25')?.waterMl, 2200)
assert.equal(airHari.some((r) => r.date === '2026-09-24'), false)
const naik = susunPatchDiary({ diaryWellness: [{ date: '2026-09-28', waterMl: 1800 }] }, { wellness: [{ date: '2026-09-28', waterMl: 2200 }] })
assert.equal((naik.diaryWellness as { waterMl: number }[])[0].waterMl, 2200)
assert.equal((airTersimpan.diaryWellness[0] as { waterMl: number }).waterMl, 1800)
assert.throws(() => susunPatchDiary(airTersimpan, { wellness: [{ date: '2026-09-28', waterMl: -5 }] }), /water/)
assert.equal((airTersimpan.diaryWellness[0] as { waterMl: number }).waterMl, 1800)
assert.equal((susunPatchDiary(airTersimpan, { wellness: [] }).diaryWellness as { date: string }[]).length, 2)
const tidurNol = susunPatchDiary(
  { diaryWellness: [{ date: '2026-09-28', waterMl: 1800, sleepHr: 7 }] },
  { wellness: [{ date: '2026-09-28', sleepHr: 0 }] },
)
const tidurHari = tidurNol.diaryWellness as { date: string; waterMl?: number; sleepHr?: number }[]
assert.equal(tidurHari.find((r) => r.date === '2026-09-28')?.sleepHr, undefined)
assert.equal(tidurHari.find((r) => r.date === '2026-09-28')?.waterMl, 1800)
const tidurIsi = susunPatchDiary(
  { diaryWellness: [{ date: '2026-09-28', waterMl: 1800 }] },
  { wellness: [{ date: '2026-09-28', sleepHr: 7 }] },
)
assert.equal((tidurIsi.diaryWellness as { sleepHr?: number }[])[0].sleepHr, 7)
const tidurTetap = susunPatchDiary(
  { diaryWellness: [{ date: '2026-09-28', sleepHr: 7, waterMl: 1800 }] },
  { wellness: [{ date: '2026-09-28', sleepHr: 5 }] },
)
assert.equal((tidurTetap.diaryWellness as { sleepHr?: number }[])[0].sleepHr, 7)
assert.equal((susunPatchDiary({ diaryWellness: [{ date: '2026-09-28', sleepHr: 7 }] }, { wellness: [{ date: '2026-09-28', sleepHr: 0, waterMl: 0 }] }).diaryWellness as unknown[]).length, 0)

console.log('catatanKesehatanDiri: self-vital and vo2max lists validate fail-closed')
