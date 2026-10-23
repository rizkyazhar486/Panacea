import assert from 'node:assert/strict'
import { deretHarian, deretPekanan } from '../../src/lib/analisisHarian.ts'
import type { ImportedWorkout } from '../../src/lib/workoutImport.ts'
const now = Date.UTC(2026, 9, 13, 12)
const base: ImportedWorkout = { id:'known', nama:'Run', mulai:new Date(now).toISOString(), selesai:new Date(now).toISOString(), durasi:1800, avgHr:100, kadens:160, hr:[], pemulihan:[] }
const unknown: ImportedWorkout = { ...base, id:'unknown', durationSource:'unknown', avgHr:200, kadens:200 }
assert.equal(deretHarian([base,unknown],0,now)[0].avgHr,100,'unknown duration must not weight a recorded HR')
assert.equal(deretHarian([base,unknown],0,now)[0].kadens,160)
assert.equal(deretPekanan([base,unknown],1,now)[0].avgHr,100)
assert.equal(deretHarian([unknown],0,now)[0].avgHr,null)
assert.equal(deretPekanan([unknown],1,now)[0].avgHr,null)
assert.equal(deretHarian([{...base,durasi:0,durationSource:'source_field'}],0,now)[0].avgHr,null,'a real zero interval cannot supply positive time weight')
assert.equal(deretHarian([{...base,durasi:Number.MAX_VALUE,avgHr:Number.MAX_VALUE}],0,now)[0].avgHr,null,'overflow is unavailable, not NaN or Infinity')
for(let seconds=1;seconds<=1000;seconds++) {
 const points=deretHarian([{...base,durasi:seconds},{...base,durasi:seconds,avgHr:120,kadens:180}],0,now)
 assert.equal(points[0].avgHr,110)
 assert.equal(points[0].kadens,170)
}
console.log('daily duration weights: unknown duration excluded from HR/cadence weighting')
