import test from 'node:test'
import assert from 'node:assert/strict'
import { Group, Mesh, BufferGeometry, Float32BufferAttribute } from 'three'
import { extractGeometry, collect } from './public-organ-geometry.mjs'
import { assertReplayMatches } from './public-organ-replay.mjs'

const triangle = () => new BufferGeometry().setAttribute('position',new Float32BufferAttribute([0,0,0, 1,0,0, 0,1,0],3))
test('indexed and unindexed source triangles preserve transforms and Z-up conversion',()=>{
  for(const indexed of [false,true]) {
    const geometry=triangle();if(indexed)geometry.setIndex([0,1,2])
    const root=new Group();root.position.set(2,3,4);root.scale.setScalar(2)
    root.add(new Mesh(geometry))
    assert.deepEqual(extractGeometry(root),{vertices:[[2,-4,3],[4,-4,3],[2,-4,5]],triangles:[[0,1,2]]})
  }
})
test('split primitives use separate correctly offset triangle indices',()=>{
  const root=new Group();root.add(new Mesh(triangle()),new Mesh(triangle()))
  assert.deepEqual(extractGeometry(root).triangles,[[0,1,2],[3,4,5]])
})
test('empty, invalid indices, incomplete triangles and nonfinite vertices reject',()=>{
  assert.throws(()=>extractGeometry(new Group()),/Empty organ/)
  const badIndex=triangle();badIndex.setIndex([0,1,3])
  assert.throws(()=>extractGeometry(new Mesh(badIndex)),/Invalid triangle/)
  const incomplete=triangle();incomplete.setIndex([0,1])
  assert.throws(()=>extractGeometry(new Mesh(incomplete)),/Non-triangle/)
  const nonfinite=triangle();nonfinite.attributes.position.setX(0,NaN)
  assert.throws(()=>extractGeometry(new Mesh(nonfinite)),/Nonfinite source/)
})
test('missing source collection rejects rather than producing empty success',async()=>{
  await assert.rejects(collect('public/bodyexposure/nonexistent-body'),/No source/)
})

test('replay comparison rejects changed counts, fractions, gross results and unsuccessful reports',()=>{
  const report={ok:true,checks:[{inside:1,fraction:.01}],grossChecks:[{ok:true,detail:1}]}
  assertReplayMatches(report,structuredClone(report))
  for(const mutate of [r=>r.checks[0].inside++,r=>r.checks[0].fraction=.02,
    r=>r.grossChecks[0].detail=2,r=>r.ok=false]) {
    const replay=structuredClone(report);mutate(replay)
    assert.throws(()=>assertReplayMatches(report,replay))
  }
  assert.throws(()=>assertReplayMatches({ok:false},{ok:false}))
})

test('committed report matches exact decoded public source collection',async()=>{
  const fs=await import('node:fs/promises')
  const report=JSON.parse(await fs.readFile('bodyexposure/qa_reports/gross_public_organ_interpenetration.adult_male.json','utf8'))
  const input=await collect('public/bodyexposure/adult_male')
  assert.deepEqual(input.sources,report.sources)
  assert.equal(input.summaries.length,report.structureCount)
  assert.equal(report.grossChecks.length,9)
  assert.equal(report.checks.length,input.pairs.length)
  for(const [i,[a,b]] of input.pairs.entries()) {
    assert.equal(report.checks[i].a,input.organs[a].name)
    assert.equal(report.checks[i].b,input.organs[b].name)
    const stride=Math.max(1,Math.floor(input.organs[a].vertices.length/300))
    assert.equal(report.checks[i].stride,stride)
    assert.equal(report.checks[i].sampled,Math.ceil(input.organs[a].vertices.length/stride))
  }
})
