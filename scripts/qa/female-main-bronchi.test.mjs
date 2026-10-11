import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import {surfaceHash} from '../../qa/reference-surface-hash.mjs'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
const bodyId = 'HUMAN.ADULT.FEMALE.MAIN_BRONCHI_REFERENCE'
const tag = 'adult_female_main_bronchi_reference'
const root = new URL('../../', import.meta.url)
const json = async p => JSON.parse(await readFile(new URL(p,root),'utf8'))
const evidence = await json('bodyexposure/qa_reports/female_main_bronchi_reference.json')
const ids = new Set(evidence.structures.map(r=>r.panacea_structure_id))
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
const buffer = await readFile(new URL(`public/bodyexposure/${tag}.respiratory.LOD3.glb`,root))
const gltf = await loader.parseAsync(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'')
gltf.scene.updateMatrixWorld(true)
const meshes=[]
gltf.scene.traverse(o=>{if(o.isMesh)meshes.push(o)})
const meta = mesh => {for(let p=mesh;p;p=p.parent)if(p.userData.panacea_structure_id)return p.userData;throw new Error('Unidentified source mesh')}

test('standalone reference keeps whole-body female and adds four pending source identities',async()=>{
 const matrix=await json('public/bodyexposure/body_matrix.json')
 const female=matrix.bodies.find(b=>b.body_id==='HUMAN.ADULT.FEMALE')
 assert.equal(female.structures,841)
 assert.ok(matrix.files.includes(`${tag}.respiratory`))
 const variant=female.variants.find(v=>v.body_id===bodyId)
 assert.equal(variant.structures,4)
 assert.equal(variant.stature_m,null)
 assert.match(variant.coverage,/unregistered/)
 const index=await json(`public/bodyexposure/${tag}.index.json`)
 assert.deepEqual(new Set(index.map(r=>r[0])),ids)
 const review=await json(`public/bodyexposure/${tag}.review.json`)
 assert.equal(review.body_id,bodyId)
 assert.deepEqual(new Set(review.rows.map(r=>r[0])),ids)
 const ontology=await json(`public/bodyexposure/ontology.${tag}.json`)
 assert.equal(ontology.source_sha256,evidence.input_artifacts[0].sha256)
 assert.deepEqual(new Set(Object.keys(ontology.map)),ids)
 const expected={
  'MAIN_BRONCHUS.R':'UBERON:0002177','MAIN_BRONCHUS.L':'UBERON:0002178',
  'MAIN_BRONCHUS_CARTILAGE.R':'FMA:13143','MAIN_BRONCHUS_CARTILAGE.L':'FMA:13144',
 }
 for(const mesh of meshes){
  const data=meta(mesh),entry=ontology.map[data.panacea_structure_id]
  assert.equal(entry.id,expected[data.panacea_structure_id.replace('REFERENCE.VH_FEMALE.RESPIRATORY.','')])
  assert.equal(entry.id,data.ontologyid)
  assert.equal(entry.label,data.label)
 }
})

test('decoded web geometry retains every source component, face count and source bounds',()=>{
 assert.equal(meshes.length,4)
 assert.deepEqual(new Set(meshes.map(m=>meta(m).panacea_structure_id)),ids)
 let tris=0
 for(const mesh of meshes){
  const data=meta(mesh),row=evidence.structures.find(r=>r.panacea_structure_id===data.panacea_structure_id)
  assert.equal(data.panacea_body_id,bodyId)
  assert.equal(data.panacea_review_status,'review_required')
  assert.equal(Boolean(data.panacea_clinically_reviewed),false)
  assert.equal(data.panacea_license,'CC BY 4.0')
  const count=(mesh.geometry.index?.count??mesh.geometry.attributes.position.count)/3
  assert.equal(count,row.mesh.tris)
  assert.equal(surfaceHash(mesh),evidence.source_surface_hashes.by_structure[data.panacea_structure_id],'Source triangle surface changed')
  tris+=count
  const box=new THREE.Box3(),point=new THREE.Vector3(),position=mesh.geometry.attributes.position,index=mesh.geometry.index
  for(let i=0;i<(index?.count??position.count);i++){point.fromBufferAttribute(position,index?index.getX(i):i).applyMatrix4(mesh.matrixWorld);box.expandByPoint(point)}
  const lo=row.bbox_min_m,hi=row.bbox_max_m
  const expected=[[lo[0],lo[2],-hi[1]],[hi[0],hi[2],-lo[1]]]
  for(const [actual,want] of [[box.min.toArray(),expected[0]],[box.max.toArray(),expected[1]]])
   actual.forEach((n,i)=>assert.ok(Math.abs(n-want[i])<1e-6,`${data.panacea_structure_id} bounds changed`))
 }
 assert.equal(tris,33865)
 assert.ok(tris<80000)
})

test('light and detailed payloads retain the same full source geometry and captured fingerprint',async()=>{
 const detail=await readFile(new URL(`public/bodyexposure/${tag}.respiratory.LOD2.glb`,root))
 assert.deepEqual(detail,buffer)
 assert.equal(createHash('sha256').update(buffer).digest('hex'),evidence.packed_artifact.sha256)
 assert.ok(buffer.byteLength<2601444,'compressed payload should be smaller than the prepared source')
 assert.equal(evidence.input_artifacts[0].sha256,'c58e5b8fb61d982eb72f7385b6ce858e07e05766b0101ff0e15c7bc469cf60ff')
 assert.equal(evidence.registration_to_whole_body,null)
})
