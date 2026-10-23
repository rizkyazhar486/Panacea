import assert from 'node:assert/strict'
import { buildHumanReplay } from '../../src/lib/humanReplay.ts'
import type { ImportedWorkout } from '../../src/lib/workoutImport.ts'
const base: ImportedWorkout = {id:'known',nama:'Run',mulai:'2026-10-13T12:00:00Z',selesai:'2026-10-13T12:30:00Z',durasi:1800,avgHr:100,hr:[],pemulihan:[]}
const average=(rows:ImportedWorkout[])=>buildHumanReplay(rows,190).epochs[0]?.avgHr
const unknown={...base,id:'unknown',durationSource:'unknown' as const,avgHr:200}
assert.equal(average([base,unknown]),100)
assert.equal(average([unknown]),undefined)
assert.equal(average([{...base,durasi:0,durationSource:'source_field'}]),undefined,'an observed zero interval has no positive time weight')
assert.equal(average([base,{...base,durasi:0,durationSource:'source_field',avgHr:200}]),100)
assert.equal(average([{...base,durasi:Number.MAX_VALUE,avgHr:Number.MAX_VALUE}]),undefined,'overflow is unavailable')
for(const value of [NaN,Infinity,-1]) assert.equal(average([{...base,durasi:value}]),undefined)
for(let seconds=1;seconds<=1000;seconds++) assert.equal(average([{...base,durasi:seconds},{...base,durasi:seconds,avgHr:120}]),110)
console.log('Human Replay HR weights: known positive intervals only, zero/unknown excluded, overflow unavailable PASS')
