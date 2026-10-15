import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { loadTypeScriptSubject } from './load-typescript-subject.mjs'
const { rankedWorkoutsFromStored } = await loadTypeScriptSubject('src/domains/personal-health/adapters/rankedWorkoutEvidence.ts')
const { calculateSeasonalRank } = await loadTypeScriptSubject('src/lib/seasonalHealthSportRank.ts')
const { workoutDurationSeconds } = await loadTypeScriptSubject('src/shared/kernel/workoutDurationEvidence.ts')

// Actual hook body; storage and React scheduling are the mocked boundaries.
function feedRank(workouts) {
  const source=fs.readFileSync('src/components/foryou/ForYouOmniFeed.tsx','utf8')
  const start=source.indexOf('function useSeasonRank()')
  const end=source.indexOf('function matchesMode',start)
  const js=ts.transpileModule(source.slice(start,end)+';globalThis.result=useSeasonRank();',
    {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
  class FixedDate extends Date { constructor(...args){super(...(args.length?args:['2026-10-15T12:00:00Z']))} }
  const context={useState:()=>[0,()=>{}],useEffect:()=>{},useMemo:fn=>fn(),
    workoutDurationSeconds,rankedWorkoutsFromStored,getWorkouts:()=>workouts,readHealth:()=>undefined,calculateSeasonalRank,Date:FixedDate}
  vm.runInNewContext(js,context)
  return context.result
}
const workout=(extra={})=>({id:'fixture',mulai:'2026-10-15T08:00:00Z',durasi:1800,durationSource:'source_field',kcal:280,...extra})
test('unknown stored duration cannot award a For You season star',()=>{
  assert.equal(feedRank([workout({durationSource:'unknown'})]).stars,0)
  assert.ok(feedRank([workout()]).stars>0)
})
test('inconsistent timestamp duration cannot award a season star',()=>{
  assert.equal(feedRank([workout({durationSource:'timestamps',selesai:'2026-10-15T08:10:00Z'})]).stars,0)
})

test('shared adapter preserves recorded positive evidence exactly and does not mutate storage',()=>{
  const input=workout({avgHr:120,maxHr:160,paceSec:360,kecepatanKmh:10,rpe:4})
  const before=structuredClone(input)
  assert.deepEqual(rankedWorkoutsFromStored([input]),[{id:'fixture',startedAt:input.mulai,durationMinutes:30,activeKcal:280,avgHr:120,maxHr:160,paceSecondsPerKm:360,speedKmh:10,rpe:4}])
  assert.deepEqual(input,before)
})
test('unknown, legacy zero, recorded zero and invalid durations remain in storage but earn no rank evidence',()=>{
  for(const extra of [{durationSource:'unknown'},{durationSource:undefined,durasi:0},{durasi:0},{durasi:NaN},{durasi:Infinity},{durasi:-1}]) {
    const input=workout(extra),before=structuredClone(input)
    assert.deepEqual(rankedWorkoutsFromStored([input]),[])
    assert.deepEqual(input,before)
  }
})
test('valid timestamps and legacy positive duration retain ranking eligibility',()=>{
  for(const extra of [{durationSource:'timestamps',selesai:'2026-10-15T08:30:00Z'},{durationSource:undefined}])
    assert.equal(rankedWorkoutsFromStored([workout(extra)])[0].durationMinutes,30)
})
test('mixed For You evidence matches the same known-only inputs in League',()=>{
  const known=workout(),unknown=workout({id:'unknown',durationSource:'unknown'})
  const mixed=feedRank([known,unknown]),onlyKnown=feedRank([known])
  const {unavailableDurationWorkouts:mixedMissing,...mixedRank}=mixed
  const {unavailableDurationWorkouts:knownMissing,...knownRank}=onlyKnown
  assert.deepEqual(mixedRank,knownRank)
  assert.equal(mixedMissing,1)
  assert.equal(knownMissing,0)
})

test('rank exposes unavailable duration without labelling recorded zero unavailable',()=>{
  assert.equal(feedRank([workout({durationSource:'unknown'})]).unavailableDurationWorkouts,1)
  assert.equal(feedRank([workout({durasi:0})]).unavailableDurationWorkouts,0)
  assert.equal(feedRank([workout({durationSource:'timestamps',selesai:'2026-10-15T08:01:00Z'})]).unavailableDurationWorkouts,1)
})
