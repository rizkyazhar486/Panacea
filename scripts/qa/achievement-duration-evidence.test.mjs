import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { loadTypeScriptSubject } from './load-typescript-subject.mjs'
const { workoutDurationSeconds } = await loadTypeScriptSubject('src/shared/kernel/workoutDurationEvidence.ts')

function achievements(workouts) {
  const source=fs.readFileSync('src/components/dashboard/ActivityAchievementWidget.tsx','utf8')
  const start=source.indexOf('function distinctDays('),end=source.indexOf('export function ActivityAchievementWidget')
  assert.ok(start>=0 && end>start)
  const js=ts.transpileModule(source.slice(start,end)+';globalThis.result=milestones(input);',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
  const context={input:workouts,workoutDurationSeconds,Date}
  vm.runInNewContext(js,context)
  return Object.fromEntries(context.result.map(m=>[m.id,m]))
}
const workout=(extra={})=>({id:'fixture',mulai:'2026-10-15T08:00:00Z',durasi:3600,durationSource:'source_field',jarakKm:5,...extra})
test('unknown duration cannot unlock an endurance badge or add active minutes',()=>{
  const result=achievements([workout({durationSource:'unknown',durasi:30000})])
  assert.equal(result.hour.value,0)
  assert.equal(result['500m'].value,0)
  assert.equal(result.ignite.value,1)
  assert.equal(result['5k'].value,5)
})
test('inconsistent timestamps and invalid numbers cannot poison achievement progress',()=>{
  for(const extra of [{durationSource:'timestamps',selesai:'2026-10-15T08:01:00Z'},{durasi:NaN},{durasi:Infinity},{durasi:-1}]) {
    const result=achievements([workout(extra)])
    assert.equal(result.hour.value,0)
    assert.equal(result['500m'].value,0)
  }
})
test('recorded and legacy positive durations preserve exact badge boundaries',()=>{
  for(const extra of [{},{durationSource:undefined},{durationSource:'timestamps',selesai:'2026-10-15T09:00:00Z'}]) {
    const result=achievements([workout(extra)])
    assert.equal(result.hour.value,result.hour.target)
    assert.equal(result['500m'].value,60)
  }
  assert.equal(achievements([workout({durasi:3599})]).hour.value<60,true)
  assert.equal(achievements([workout({durasi:30000})])['500m'].value,500)
})
test('mixed unknown and known evidence preserves known progress without mutating storage',()=>{
  const input=[workout({durasi:1800}),workout({id:'unknown',durationSource:'unknown'})],before=structuredClone(input)
  const result=achievements(input)
  assert.equal(result.hour.value,30)
  assert.equal(result['500m'].value,30)
  assert.deepEqual(input,before)
})
test('empty and explicit-zero records produce no time-earned progress',()=>{
  for(const input of [[],[workout({durasi:0})]]) {
    const result=achievements(input)
    assert.equal(result.hour.value,0)
    assert.equal(result['500m'].value,0)
  }
})
