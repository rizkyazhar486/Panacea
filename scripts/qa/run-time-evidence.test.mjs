import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTypeScriptSubject } from './load-typescript-subject.mjs'
const {usahaTerbaik,gradeAdjustedPace,perkiraanPaceAmbang}=await loadTypeScriptSubject('src/lib/analisisPro.ts')
const workout=(extra={})=>({id:'fixture',nama:'Run',mulai:'2026-10-15T08:00:00Z',durasi:1200,durationSource:'source_field',jarakKm:5,paceSec:240,hr:[],pemulihan:[],...extra})
test('unknown or mismatched cached duration cannot produce run records or time-qualified estimates',()=>{
 for(const extra of [{durationSource:'unknown'},{durationSource:'timestamps',selesai:'2026-10-15T08:01:00Z'},{durationSource:undefined,durasi:0},{durasi:0},{durasi:-1},{durasi:NaN},{durasi:Infinity}]) {
  const w=workout(extra)
  assert.deepEqual(usahaTerbaik([w]),[])
  assert.equal(gradeAdjustedPace(w,100),null)
  assert.equal(perkiraanPaceAmbang([w]),null)
 }
})
test('valid duration sources preserve record scaling and the existing grade equation',()=>{
 for(const extra of [{},{durationSource:undefined},{durationSource:'timestamps',selesai:'2026-10-15T08:20:00Z'}]) {
  const w=workout(extra),before=structuredClone(w)
  assert.deepEqual(usahaTerbaik([w]),[{jarakKm:5,label:'5 km',detik:1200,paceSec:240,tanggal:w.mulai,nama:'Run',diskalakan:false}])
  assert.deepEqual(gradeAdjustedPace(w,100),{paceSec:240,gapSec:Math.round(240/(1+4.7*.02+22*.02*.02)),gradienRerata:2,kasar:true})
  assert.equal(perkiraanPaceAmbang([w]),240)
  assert.deepEqual(w,before)
 }
 const scaled=usahaTerbaik([workout({jarakKm:5.25})])[0]
 assert.equal(scaled.detik,Math.round(1200/1.05));assert.equal(scaled.diskalakan,true)
})
test('unsupported faster record cannot displace known evidence; duration threshold stays 20 minutes',()=>{
 const known=workout({id:'known',durasi:1500,paceSec:300}),unknown=workout({id:'unknown',durationSource:'unknown',paceSec:180})
 assert.deepEqual(usahaTerbaik([known,unknown]),usahaTerbaik([known]))
 assert.equal(perkiraanPaceAmbang([known,unknown]),300)
 assert.equal(perkiraanPaceAmbang([workout({durasi:1199})]),null)
 assert.equal(perkiraanPaceAmbang([workout({durasi:1200})]),240)
})
test('invalid distances and nonfinite pace cannot become numeric run evidence',()=>{
 for(const jarakKm of [NaN,Infinity,-1,0]) {
  const w=workout({jarakKm})
  assert.deepEqual(usahaTerbaik([w]),[]);assert.equal(gradeAdjustedPace(w,100),null);assert.equal(perkiraanPaceAmbang([w]),null)
 }
 for(const paceSec of [NaN,Infinity,-1,0])assert.equal(perkiraanPaceAmbang([workout({paceSec})]),null)
 assert.equal(gradeAdjustedPace(workout({jarakKm:Number.MIN_VALUE}),100),null)
})
