import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { loadTypeScriptSubject } from './load-typescript-subject.mjs'
const { workoutDurationSeconds } = await loadTypeScriptSubject('src/shared/kernel/workoutDurationEvidence.ts')
const source = fs.readFileSync('src/components/dashboard/PerformanceVisualizationDeck.tsx', 'utf8')
const cut = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)))
class FixedDate extends Date { constructor(...args) { super(...(args.length ? args : ['2026-10-15T12:00:00Z'])) } }
const context = { Date: FixedDate, workoutDurationSeconds }
vm.runInNewContext(ts.transpileModule(cut('function dayKey(', 'function shortDate(') + cut('function weeklyVolume(', 'function zoneDistribution(') + cut('function activityCalendar(', 'function paceHrScatter(') + ';globalThis.subject={weeklyVolume,activityCalendar}', { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context)
const {weeklyVolume,activityCalendar}=context.subject
const workout=(extra={})=>({mulai:'2026-10-15T08:00:00Z',durasi:1800,durationSource:'source_field',...extra})
for(const [name,run] of [['weekly',w=>weeklyVolume(w)],['calendar',w=>activityCalendar(w,[])]]) {
 test(`${name}: unknown and inconsistent timestamp days remain unavailable`,()=>{
  for(const extra of [{durationSource:'unknown'},{durationSource:'timestamps',selesai:'2026-10-15T08:01:00Z'},{durasi:NaN},{durasi:Infinity},{durasi:-1}]) {
   const row=run([workout(extra)]).at(-1)
   assert.equal(row.minutes,null);assert.equal(row.missing,1);assert.equal(row.known,0)
  }
 })
 test(`${name}: recorded zero, legacy positive and matching timestamps retain evidence`,()=>{
  for(const extra of [{durasi:0},{durationSource:undefined},{durationSource:'timestamps',selesai:'2026-10-15T08:30:00Z'}]) {
   const row=run([workout(extra)]).at(-1)
   assert.equal(row.minutes,extra.durasi===0?0:30);assert.equal(row.known,1);assert.equal(row.missing,0)
  }
 })
 test(`${name}: partial totals disclose excluded sessions without mutating sources`,()=>{
  const input=[workout(),workout({durationSource:'unknown'})],before=structuredClone(input)
  const row=run(input).at(-1)
  assert.equal(row.minutes,30);assert.equal(row.known,1);assert.equal(row.missing,1)
  assert.deepEqual(input,before)
  assert.equal(run([]).at(-1).minutes,0)
 })
}
test('calendar: GPS fallback retains source priority and rejects nonfinite time',()=>{
 const gps=durSec=>[{at:'2026-10-15T08:00:00Z',durSec}]
 assert.equal(activityCalendar([],gps(1200)).at(-1).minutes,20)
 assert.equal(activityCalendar([],gps(0)).at(-1).minutes,0)
 assert.equal(activityCalendar([],gps(Infinity)).at(-1).minutes,null)
 assert.equal(activityCalendar([workout({durationSource:'unknown'})],gps(1200)).at(-1).minutes,null)
})
