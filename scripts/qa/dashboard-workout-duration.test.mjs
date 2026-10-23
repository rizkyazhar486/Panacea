import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import { build } from 'esbuild'
import React from 'react'
import { StaticRouter } from 'react-router-dom'
import { renderToStaticMarkup } from 'react-dom/server'

const bundle=await build({entryPoints:['src/components/dashboard/LifeOSWidgets.tsx'],bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',plugins:[{
  name:'synthetic-storage-boundary',setup(b){
    b.onResolve({filter:/\/lib\/(workoutStore|healthVitals)$/},args=>({path:args.path,namespace:'fixture'}))
    b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path.endsWith('workoutStore')?'export const getWorkouts=()=>globalThis.fixtureWorkouts':'export const getVitals=()=>({});export const vitalsAge=()=>null',loader:'js'}))
  },
}]})
function label(workouts){
  const module={exports:{}},context={module,exports:module.exports,require:createRequire(import.meta.url),fixtureWorkouts:workouts,localStorage:{getItem:()=>null},Date,console}
  vm.runInNewContext(bundle.outputFiles[0].text,context)
  const html=renderToStaticMarkup(React.createElement(StaticRouter,null,React.createElement(module.exports.LifeOSWidgets)))
  const link=html.match(/<a[^>]*href="\/latihan"[^>]*>(.*?)<\/a>/s)
  assert.ok(link,'actual workout navigation card must remain present')
  return link[1].replace(/<[^>]*>/g,'')
}
const workout=(extra={})=>({id:'fixture',nama:'Synthetic run',mulai:'2026-10-15T08:00:00Z',durasi:1800,durationSource:'source_field',...extra})
test('dashboard unknown duration does not look like recorded minutes',()=>{
  const text=label([workout({durationSource:'unknown'})])
  assert.ok(text.includes('—'));assert.ok(!text.includes('30 min'))
})
test('dashboard preserves explicit zero and nearest-minute positive labels',()=>{
  assert.ok(label([workout({durasi:0})]).includes('0 min'))
  assert.ok(label([workout({durasi:90})]).includes('2 min'))
})
test('dashboard rejects inconsistent timestamps and ambiguous legacy zero',()=>{
  for(const extra of [{durationSource:'timestamps',selesai:'2026-10-15T08:01:00Z'},{durationSource:undefined,durasi:0}])
    assert.ok(label([workout(extra)]).includes('—'))
})
test('empty dashboard keeps its original call to record a workout',()=>{
  assert.ok(label([]).includes('Run · strength · mobility · recovery'))
})
