import assert from 'node:assert/strict'
import { buildHumanReplay, compareReplayEpochs } from '../../src/lib/humanReplay.ts'
import type { ImportedWorkout } from '../../src/lib/workoutImport.ts'
const base: ImportedWorkout = { id:'known', nama:'Run', mulai:'2026-01-02T12:00:00Z', selesai:'2026-01-02T12:30:00Z', durasi:1800, durationSource:'source_field', jarakKm:3, kcal:100, hr:[], pemulihan:[] }
const replay = (rows: ImportedWorkout[]) => buildHumanReplay(rows, 190)
assert.equal(replay([{...base,durationSource:'unknown'}]).epochs[0].activeMinutes,null,'unsupported positive duration is unavailable')
assert.equal(replay([]).totalMinutes, null, 'empty history has no observed duration')
assert.equal(replay([base]).totalMinutes, 30)
assert.equal(replay([{...base,durationSource:undefined}]).totalMinutes, 30, 'positive legacy duration remains supported')
for (const row of [
  {...base,durationSource:'unknown' as const}, {...base,durasi:0,durationSource:undefined},
  {...base,durationSource:'timestamps' as const,selesai:'2026-01-02T12:31:00Z'},
  ...[NaN,Infinity,-1].map(durasi => ({...base,durasi})),
]) {
  const alone = replay([row]); assert.equal(alone.totalMinutes, null); assert.equal(alone.epochs[0].activeMinutes, null)
  const mixed = replay([base,{...row,id:'missing'}]); assert.equal(mixed.totalMinutes,null); assert.equal(mixed.epochs[0].activeMinutes,null)
  assert.equal(mixed.epochs[0].sessions,2,'unknown duration must not remove the session')
}
for (const row of [{...base,durasi:0}, {...base,durasi:0,durationSource:'timestamps' as const,selesai:base.mulai}]) {
  assert.equal(replay([row]).totalMinutes,0,'observed zero must remain zero')
  assert.equal(replay([base,row]).epochs[0].activeMinutes,30)
}
assert.equal(replay([{...base,durationSource:'timestamps'}]).totalMinutes,30)
const history = replay([base,{...base,id:'missing',mulai:'2026-02-02T12:00:00Z',durationSource:'unknown'},{...base,id:'later',mulai:'2026-03-02T12:00:00Z'}])
assert.deepEqual(history.epochs.map(e => e.activeMinutes),[30,null,30])
assert.deepEqual(history.epochs.map(e => e.cumulativeMinutes),[30,null,null],'missing month duration cannot turn into a cumulative zero')
assert.equal(history.totalMinutes,null)
assert.equal(compareReplayEpochs(history.epochs[1],history.epochs[0]).find(d => d.label==='active time')?.delta,null)
assert.equal(compareReplayEpochs(history.epochs[2],history.epochs[1]).find(d => d.label==='active time')?.delta,null)
const known = replay([base,{...base,id:'zero',mulai:'2026-02-02T12:00:00Z',durasi:0}])
assert.equal(compareReplayEpochs(known.epochs[1],known.epochs[0]).find(d => d.label==='active time')?.delta,-30)
assert.equal(known.totalMinutes,30)
const huge = replay(Array.from({length:100},(_,i) => ({...base,id:String(i),durasi:Number.MAX_VALUE})))
assert.equal(huge.totalMinutes,null,'overflow must not reach presentation as Infinity')
assert.equal(huge.epochs[0].activeMinutes,null)
const frozen = Object.freeze({...base}); assert.equal(replay([frozen]).totalMinutes,30); assert.equal(frozen.durasi,1800)
console.log('Human Replay duration: missing/invalid/partial/cumulative unavailable, observed zero, timestamp/legacy evidence, comparisons and overflow passed')

assert.equal(replay([]).totalDistanceKm,null)
for (const value of [undefined,NaN,Infinity,-1]) {
 const result=replay([{...base,jarakKm:value,kcal:value}]);assert.equal(result.totalDistanceKm,null);assert.equal(result.epochs[0].distanceKm,null);assert.equal(result.epochs[0].kcal,null)
 assert.equal(replay([base,{...base,id:'missing',jarakKm:value}]).totalDistanceKm,null)
}
assert.equal(replay([{...base,jarakKm:0,kcal:0}]).totalDistanceKm,0)
assert.equal(replay([{...base,jarakKm:0,kcal:0}]).epochs[0].kcal,0)
const distanceHistory=replay([base,{...base,id:'missing',mulai:'2026-02-02T12:00:00Z',jarakKm:undefined},{...base,id:'later',mulai:'2026-03-02T12:00:00Z'}])
assert.deepEqual(distanceHistory.epochs.map(e=>e.cumulativeDistanceKm),[3,null,null])
assert.equal(compareReplayEpochs(distanceHistory.epochs[2],distanceHistory.epochs[1]).find(d=>d.label==='distance')?.delta,null)
assert.equal(replay([{...base,jarakKm:Number.MAX_VALUE},{...base,jarakKm:Number.MAX_VALUE}]).totalDistanceKm,null)
console.log('Human Replay distance/energy: missing/invalid/partial/overflow unavailable, independent known fields and observed zero preserved')
const hugeDistance=replay([{...base,jarakKm:0},{...base,id:'huge',mulai:'2026-02-02T12:00:00Z',jarakKm:Number.MAX_VALUE}])
assert.equal(compareReplayEpochs(hugeDistance.epochs[1],hugeDistance.epochs[0]).find(d=>d.label==='distance')?.delta,null,'rounded comparison overflow is unavailable')
const cumulativeOverflow=replay([{...base,jarakKm:Number.MAX_VALUE},{...base,id:'huge',mulai:'2026-02-02T12:00:00Z',jarakKm:Number.MAX_VALUE}])
assert.equal(cumulativeOverflow.epochs[1].cumulativeDistanceKm,null)
const complete=replay([base,{...base,id:'second'}])
assert.equal(complete.totalMinutes,60)
assert.equal(complete.totalDistanceKm,6)
assert.deepEqual([complete.epochs[0].activeMinutes,complete.epochs[0].distanceKm,complete.epochs[0].kcal],[60,6,200])
