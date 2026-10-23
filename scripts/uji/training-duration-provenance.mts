import assert from 'node:assert/strict'
import { buildTrainingAnalytics } from '../../src/lib/trainingAnalytics.ts'
import type { ImportedWorkout } from '../../src/lib/workoutImport.ts'
const time = '2026-10-13T12:00:00.000Z'
const base: ImportedWorkout = { id:'known', nama:'Run', mulai:time, selesai:time, durasi:1800, jarakKm:3, rpe:5, hr:[], pemulihan:[] }
const run = (rows: ImportedWorkout[]) => buildTrainingAnalytics(rows, new Date(time))
const unknown = {...base,id:'unknown',durationSource:'unknown' as const}
const missing = run([unknown])
assert.equal(missing.minggu.sesiDurasi,0)
assert.equal(missing.minggu.menit,0,'numeric compatibility subtotal is not exposed as observed time')
assert.equal(missing.minggu.paceSec,undefined)
assert.equal(missing.minggu.sesiRpe,0)
assert.equal(missing.blok28.at(-1)?.srpe,0)
const mixed = run([base,unknown])
assert.equal(mixed.minggu.sesi,2)
assert.equal(mixed.minggu.sesiDurasi,1)
assert.equal(mixed.minggu.menit,30)
assert.equal(mixed.minggu.paceSec,600)
assert.equal(mixed.blok28.at(-1)?.srpe,150)
const zero = run([{...base,durasi:0,durationSource:'source_field'}])
assert.equal(zero.minggu.sesiDurasi,1,'explicit zero is an observed interval')
assert.equal(zero.minggu.menit,0)
assert.equal(zero.minggu.paceSec,undefined)
for (const value of [NaN,Infinity,-1]) assert.equal(run([{...base,durasi:value}]).minggu.sesiDurasi,0)
for(let seconds=1;seconds<=1000;seconds++) {
 const result=run([{...base,durasi:seconds}])
 assert.equal(result.minggu.menit,Math.round(seconds/60))
 assert.equal(result.minggu.paceSec,Math.round(seconds/3))
 assert.equal(result.blok28.at(-1)?.srpe,Math.round(seconds/60*5))
}
console.log('training duration: source-aware coverage, pace, RPE and explicit zero PASS')
