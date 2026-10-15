import assert from 'node:assert/strict'
import { buildTrainingAnalytics } from '../../src/lib/trainingAnalytics.ts'
import type { ImportedWorkout } from '../../src/lib/workoutImport.ts'

const at='2026-10-15T12:00:00Z'
const workout=(extra:Partial<ImportedWorkout>={}):ImportedWorkout=>({id:'fixture',nama:'Run',mulai:at,durasi:1800,durationSource:'source_field',rpe:5,hr:[],pemulihan:[],...extra})
const run=(rows:ImportedWorkout[])=>buildTrainingAnalytics(rows,new Date(at))

for(const extra of [{durationSource:'unknown' as const},{durasi:0},{durasi:NaN},{durasi:Infinity},{durationSource:'timestamps' as const,selesai:at}]) {
  const result=run([workout(extra)])
  assert.equal(result.total28.sesiRpeTercatat,1,'reported RPE remains present independently of duration')
  assert.equal(result.minggu.sesiRpeTercatat,1)
  assert.equal(result.total28.sesiRpe,0,'positive-duration load eligibility must remain unchanged')
  assert.equal(result.blok28.at(-1)?.srpe,0,'unavailable/zero duration must not generate load')
}
for(const rpe of [undefined,0,-1,11,NaN,Infinity,'5' as unknown as number]) {
  assert.equal(run([workout({rpe})]).total28.sesiRpeTercatat,0,'invalid/missing RPE is not reported coverage')
}
for(const rpe of [1,10]) assert.equal(run([workout({rpe})]).total28.sesiRpeTercatat,1)

const input=[workout(),workout({id:'unknown',durationSource:'unknown'}),workout({id:'zero',durasi:0})]
const before=structuredClone(input),mixed=run(input)
assert.equal(mixed.total28.sesiRpeTercatat,3)
assert.equal(mixed.total28.sesiRpe,1)
assert.equal(mixed.blok28.at(-1)?.srpe,150,'existing valid minutes-times-RPE equation preserved')
assert.deepEqual(input,before)
assert.equal(run([]).total28.sesiRpeTercatat,0)
assert.equal(run([workout({mulai:'2026-08-01T12:00:00Z'})]).total28.sesiRpeTercatat,0)
assert.equal(buildTrainingAnalytics(input,new Date('invalid')).total28.sesiRpeTercatat,0)
console.log('Reported RPE coverage is duration-independent; original positive-duration sRPE eligibility and equation preserved.')
