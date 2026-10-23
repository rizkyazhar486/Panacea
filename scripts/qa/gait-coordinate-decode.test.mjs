import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { decodeRig } from './decode-rig-for-blender.mjs'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')
const json=bytes=>JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'))
function glb(value,bin=Buffer.alloc(4)) {
  const encoded=Buffer.from(JSON.stringify(value)),body=Buffer.concat([encoded,Buffer.alloc((4-encoded.length%4)%4,32)])
  const h=Buffer.alloc(20),b=Buffer.alloc(8)
  h.writeUInt32LE(0x46546c67);h.writeUInt32LE(2,4);h.writeUInt32LE(28+body.length+bin.length,8);h.writeUInt32LE(body.length,12);h.writeUInt32LE(0x4e4f534a,16)
  b.writeUInt32LE(bin.length);b.writeUInt32LE(0x004e4942,4)
  return Buffer.concat([h,body,b,bin])
}
test('public-source and decoded hashes match independent native Blender audit exactly',async()=>{
 const report=JSON.parse(fs.readFileSync('bodyexposure/qa_reports/gait_coordinate_audit.json','utf8'))
 assert.equal(report.assets.length,2)
 for(const asset of report.assets) {
  const source=fs.readFileSync(asset.source),before=Buffer.from(source),decoded=await decodeRig(source)
  assert.equal(hash(source),asset.source_sha256)
  assert.equal(hash(decoded),asset.decoded_sha256)
  assert.deepEqual(source,before,'source bytes never mutated')
  assert.deepEqual(decoded,await decodeRig(source),'deterministic decoder')
  const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder)
  const load=bytes=>loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')
  const originalScene=await load(source),decodedScene=await load(decoded)
  const geometry=gltf=>{
    const rows=[]
    gltf.scene.traverse(node=>{if(node.isMesh)rows.push({name:node.name,position:node.geometry.attributes.position.array,index:node.geometry.index?.array})})
    return rows
  }
  assert.deepEqual(geometry(decodedScene),geometry(originalScene),'every decoded position/index remains identical')
  const animations=gltf=>gltf.animations.map(clip=>({name:clip.name,duration:clip.duration,blendMode:clip.blendMode,tracks:clip.tracks.map(track=>({name:track.name,times:track.times,values:track.values,interpolation:track.getInterpolation()}))}))
  assert.deepEqual(animations(decodedScene),animations(originalScene),'all original animation key times/values remain identical; runtime UUID is not source data')
  const a=json(source),b=json(decoded)
  for(const key of ['nodes','meshes','animations','skins','accessors','scenes','scene'])assert.deepEqual(b[key],a[key])
  assert.equal(b.extensionsRequired.includes('EXT_meshopt_compression'),false)
  assert.deepEqual(asset.nonfinite_or_exactly_singular_transforms,[])
  assert.equal(asset.sampled_frame,1,'Blender importer evaluates its initial action at frame 1')
  assert.deepEqual(asset.active_animation_bindings.filter(binding=>binding.object==='FOOT.L'||binding.object==='FOOT.R').map(binding=>binding.action),['ROM','ROM'])
  assert.equal(asset.feet_import_pose.L.vertices>0&&asset.feet_import_pose.R.vertices>0,true)
 }
})
test('decoder rejects malformed, truncated, wrong-chunk and external-buffer inputs',async()=>{
 const valid=glb({asset:{version:'2.0'},buffers:[{byteLength:4}],bufferViews:[{buffer:0,byteLength:4}]})
 assert.equal((await decodeRig(valid)).readUInt32LE(0),0x46546c67)
 for(const input of [Buffer.alloc(10),valid.subarray(0,valid.length-1)])await assert.rejects(decodeRig(input),/invalid GLB header/)
 const chunk=Buffer.from(valid);chunk.writeUInt32LE(0,16)
 await assert.rejects(decodeRig(chunk),/expected JSON followed by BIN/)
 await assert.rejects(decodeRig(glb({buffers:[{byteLength:4,uri:'https://invalid.test/mesh.bin'}],bufferViews:[]})),/expected embedded GLB buffer/)
 await assert.rejects(decodeRig(glb({buffers:[{byteLength:4}],bufferViews:[{buffer:0,byteOffset:2,byteLength:4}]})),/outside buffer/)
})
