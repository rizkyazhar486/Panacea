import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { workoutDurationSeconds } from '../../src/shared/kernel/workoutDurationEvidence.ts'

// Execute the actual summary body; storage, scheduling and calendar key are fixtures.
function summary(workouts) {
  const source = fs.readFileSync('src/components/fitness/CatatanLatihan.tsx', 'utf8')
  const start = source.indexOf('const ringkas = useMemo(() => {')
  const end = source.indexOf('}, [versi, tanggal, untukKemarin])', start)
  assert.ok(start >= 0 && end > start, 'training summary must be found')
  const js = ts.transpileModule(source.slice(start, end + '}, [versi, tanggal, untukKemarin])'.length) + ';globalThis.result=ringkas;', { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
  const context = { getWorkouts: () => workouts, useMemo: fn => fn(), workoutDurationSeconds,
    kunciTanggal: d => d.toISOString().slice(0, 10), sesiTangan: () => false,
    tanggalAcuan: new Date('2026-10-15T12:00:00Z'), tanggal: '2026-10-15', versi: 0, untukKemarin: false, Date }
  vm.runInNewContext(js, context)
  return context.result
}
const workout = (extra = {}) => ({ id: 'fixture', nama: 'Synthetic run', mulai: '2026-10-15T08:00:00Z', durasi: 1800, durationSource: 'source_field', rpe: 4, hr: [], pemulihan: [], ...extra })

test('unknown duration cannot produce latest or 28-day sRPE evidence', () => {
  const result = summary([workout({ durationSource: 'unknown' })])
  assert.equal(result.terbaruSrpe, null)
  assert.equal(result.srpe28, 0)
  assert.equal(result.sesiDenganRpe28, 0)
  assert.equal(result.sesiBerdurasi28, 0)
})
test('inconsistent timestamp duration cannot produce training load', () => {
  const result = summary([workout({ durationSource: 'timestamps', selesai: '2026-10-15T08:01:00Z' })])
  assert.equal(result.terbaruSrpe, null)
  assert.equal(result.srpe28, 0)
})
test('known positive durations retain the original minutes-times-RPE equation', () => {
  for (const extra of [{}, { durationSource: undefined }, { durationSource: 'timestamps', selesai: '2026-10-15T08:30:00Z' }]) {
    const result = summary([workout(extra)])
    assert.equal(result.terbaruSrpe, 120)
    assert.equal(result.srpe28, 120)
    assert.equal(result.sesiDenganRpe28, 1)
    assert.equal(result.sesiBerdurasi28, 1)
  }
})
test('invalid and zero durations remain stored without positive-duration load', () => {
  for (const durasi of [0, -1, NaN, Infinity]) {
    const input = workout({ durasi }), before = structuredClone(input)
    const result = summary([input])
    assert.equal(result.terbaruSrpe, null)
    assert.equal(result.srpe28, 0)
    assert.equal(result.total, 1)
    assert.deepEqual(input, before)
  }
})
test('mixed evidence counts only eligible sessions and preserves missing RPE', () => {
  const result = summary([workout(), workout({ id: 'unknown', durationSource: 'unknown' }), workout({ id: 'unrated', rpe: undefined })])
  assert.equal(result.srpe28, 120)
  assert.equal(result.sesiDenganRpe28, 1)
  assert.equal(result.sesiBerdurasi28, 2)
  assert.equal(result.total, 3)
})
test('unknown-only time totals and movement history stay unavailable rather than zero', () => {
  const result=summary([workout({durationSource:'unknown',paceSec:360})])
  assert.equal(result.menit,null)
  assert.equal(result.menit28,null)
  assert.equal(result.terbaruDetik,null)
  assert.equal(result.riwayatMovement[0].menit,null)
  assert.equal(result.bandingAktivitas[0].menit,null)
  assert.equal(result.tanpaDurasi28,1)
})
test('recorded zero is available time while partial totals expose missing coverage', () => {
  const zero=summary([workout({durasi:0})])
  assert.equal(zero.menit,0)
  assert.equal(zero.menit28,0)
  assert.equal(zero.terbaruDetik,0)
  const mixed=summary([workout(),workout({id:'unknown',durationSource:'unknown'})])
  assert.equal(mixed.menit,30)
  assert.equal(mixed.menit28,30)
  assert.equal(mixed.tanpaDurasiHari,1)
  assert.equal(mixed.tanpaDurasi28,1)
})
