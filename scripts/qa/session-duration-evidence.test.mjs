import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { loadTypeScriptSubject } from './load-typescript-subject.mjs'
const {workoutDurationSeconds}=await loadTypeScriptSubject('src/shared/kernel/workoutDurationEvidence.ts')
const source=fs.readFileSync('src/components/fitness/TrainingSessionCockpit.tsx','utf8')
const functions=source.slice(source.indexOf('function positive('),source.indexOf('function lastSync('))
const start=source.indexOf('  const duration'),end=source.indexOf('  const start = new Date',start)
assert.ok(start>=0&&end>start)
const js=ts.transpileModule(functions+source.slice(start,end)+';globalThis.result={duration,lanes,coverage}',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
const fixture=(extra={})=>({durasi:1800,durationSource:'source_field',mulai:'2026-10-15T08:00:00Z',pemulihan:[],...extra})
const run=workout=>{const c={workout,workoutDurationSeconds};vm.runInNewContext(js,c);return c.result}
test('unknown and inconsistent cached duration cannot activate recorded lane',()=>{
 for(const extra of [{durationSource:'unknown'},{durationSource:'timestamps',selesai:'2026-10-15T08:01:00Z'},{durationSource:undefined,durasi:0},{durasi:NaN},{durasi:Infinity},{durasi:-1}]) {
  const r=run(fixture(extra));assert.equal(r.duration,null);assert.equal(r.lanes[0].active,false);assert.equal(r.coverage,0)
 }
})
test('explicit zero and known time remain available independently of positive-time load',()=>{
 for(const extra of [{durasi:0},{},{durationSource:undefined},{durationSource:'timestamps',selesai:'2026-10-15T08:30:00Z'},{durationSource:'timestamps',durasi:0,selesai:'2026-10-15T08:00:00Z'}]) {
  const r=run(fixture(extra));assert.equal(r.duration,extra.durasi===0?0:30);assert.equal(r.lanes[0].active,true);assert.equal(r.coverage,1)
 }
})
test('other recorded signals survive unknown time and source data stays unchanged',()=>{
 const workout=fixture({durationSource:'unknown',avgHr:125,maxHr:160,rpe:5,jarakKm:3,paceSec:360}),before=structuredClone(workout)
 const r=run(workout)
 assert.equal(r.duration,null);assert.equal(r.lanes[0].value,'125 bpm');assert.equal(r.lanes[1].value,'6:00/km');assert.equal(r.lanes[2].value,'RPE 5/10');assert.equal(r.coverage,3)
 assert.deepEqual(workout,before)
})
