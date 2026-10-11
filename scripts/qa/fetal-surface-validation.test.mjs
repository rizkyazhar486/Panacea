import test from 'node:test'
import assert from 'node:assert/strict'
import { auditSurface } from './fetal-surface-validation.mjs'
const p=[0,0,0,1,0,0,0,1,0,0,0,1], f=[0,2,1,0,1,3,0,3,2,1,2,3]
test('closed outward tetrahedron and translated small-unit surface pass',()=>{
 assert.equal(auditSurface(p,f).signedVolume,1/6)
 assert.ok(auditSurface(p.map(v=>v*.001+10),f).signedVolume>0)
})
test('globally inward and locally inconsistent winding fail',()=>{
 assert.throws(()=>auditSurface(p,f.flatMap((_,i)=>i%3?[]:f.slice(i,i+3).reverse())),/outward/)
 const bad=[...f];[bad[0],bad[1]]=[bad[1],bad[0]];assert.throws(()=>auditSurface(p,bad),/consistent winding/)
})
test('open, nonmanifold and degenerate surfaces fail',()=>{
 assert.throws(()=>auditSurface(p,f.slice(0,-3)))
 assert.throws(()=>auditSurface(p,[...f,...f.slice(0,3)]),/closed/)
 assert.throws(()=>auditSurface(p,[0,0,1,...f.slice(3)]),/degenerate/)
})
test('nonfinite coordinates and invalid indices fail',()=>{
 assert.throws(()=>auditSurface([NaN,...p.slice(1)],f),/finite/)
 for(const value of [-1,4,.5])assert.throws(()=>auditSurface(p,[value,...f.slice(1)]),/indices/)
})
