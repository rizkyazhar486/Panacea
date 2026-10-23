import assert from 'node:assert/strict'
import {buildWorkoutDna,workoutDnaDurationLabel} from '../../src/lib/workoutDNA.ts'
import type {ImportedWorkout} from '../../src/lib/workoutImport.ts'
const base: ImportedWorkout={id:'known',nama:'Run',mulai:'2026-10-13T12:00:00Z',selesai:'2026-10-13T12:30:00Z',durasi:1800,hr:[],pemulihan:[]}
const dna=(w:ImportedWorkout)=>buildWorkoutDna(w,190)
const axis=(w:ImportedWorkout,id:string)=>dna(w).axes.find(a=>a.id===id)!
const unknown={...base,durationSource:'unknown' as const}
assert.equal(axis(unknown,'endurance').provenance,'unavailable')
assert.equal(axis(unknown,'volume').provenance,'unavailable')
assert.equal(dna(unknown).knownDurationMin,null)
assert.equal(workoutDnaDurationLabel(dna(unknown)),'Duration unavailable')
assert.equal(axis({...unknown,jarakKm:3},'volume').value,20)
assert.equal(axis({...unknown,jarakKm:3},'volume').provenance,'measured-derived')
const zero={...base,durasi:0,durationSource:'source_field' as const}
assert.equal(axis(zero,'endurance').provenance,'measured-derived')
assert.equal(workoutDnaDurationLabel(dna(zero)),'0 min')
assert.equal(axis({...unknown,jarakKm:0},'volume').provenance,'measured-derived')
for(const value of [NaN,Infinity,-1]) {
 assert.equal(axis({...base,durasi:value},'endurance').provenance,'unavailable')
 assert.equal(axis({...unknown,jarakKm:value},'volume').provenance,'unavailable')
 assert.equal(dna({...unknown,jarakKm:value}).distanceKm,undefined)
}
for(let seconds=1;seconds<=1000;seconds++) {
 const result=dna({...base,durasi:seconds})
 assert.equal(result.knownDurationMin,seconds/60)
 assert.equal(result.axes.find(a=>a.id==='endurance')!.value,Math.round(Math.min(100,seconds/60/90*100)))
 assert.equal(workoutDnaDurationLabel(result),`${Math.round(seconds/60)} min`)
}
console.log('Workout DNA duration/distance provenance, explicit zero and1,000 known values PASS')
