import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { workoutDurationSeconds } from '../../src/shared/kernel/workoutDurationEvidence.ts'

function sessions(workouts,gps=[]) {
  const source=fs.readFileSync('src/components/dashboard/AdvancedPerformanceCockpit.tsx','utf8')
  const start=source.indexOf('function clamp('),end=source.indexOf('function fourWeekSportLoad(')
  assert.ok(start>=0&&end>start)
  const js=ts.transpileModule(source.slice(start,end)+';globalThis.result=collectSessions(workouts,gps);',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
  const context={workouts,gps,workoutDurationSeconds,Date}
  vm.runInNewContext(js,context)
  return JSON.parse(JSON.stringify(context.result))
}
const workout=(extra={})=>({id:'fixture',nama:'Run',mulai:'2026-10-15T08:00:00Z',durasi:1800,durationSource:'source_field',jarakKm:5,avgHr:140,...extra})
test('unknown and inconsistent durations cannot supply cockpit minutes or derived pace',()=>{
  for(const extra of [{durationSource:'unknown'},{durationSource:'timestamps',selesai:'2026-10-15T08:01:00Z'}])
    assert.deepEqual(sessions([workout(extra)]),[])
})
test('known positive duration keeps original classification, minutes and pace',()=>{
  for(const extra of [{},{durationSource:undefined},{durationSource:'timestamps',selesai:'2026-10-15T08:30:00Z'}])
    assert.deepEqual(sessions([workout(extra)]),[{id:'import-fixture',at:'2026-10-15T08:00:00Z',sport:'Run',minutes:30,distanceKm:5,avgHr:140,paceSec:360}])
  assert.equal(sessions([workout({paceSec:350})])[0].paceSec,350)
})
test('zero and invalid durations produce no positive-duration session and do not mutate source',()=>{
  for(const durasi of [0,-1,NaN,Infinity]) {
    const input=workout({durasi}),before=structuredClone(input)
    assert.deepEqual(sessions([input]),[])
    assert.deepEqual(input,before)
  }
})
test('valid GPS evidence survives an unknown import and retains existing deduplication',()=>{
  const gps={id:'gps',at:'2026-10-15T08:00:00Z',sport:'Run',durSec:1800,distKm:5,avgHr:140}
  const expected=[{id:'gps-gps',at:gps.at,sport:'Run',minutes:30,distanceKm:5,avgHr:140,paceSec:360}]
  assert.deepEqual(sessions([workout({durationSource:'unknown'})],[gps]),expected)
  assert.equal(sessions([workout()],[gps]).length,1)
})
