// Decode the shipped GLBs with the same Three/meshopt loader as the web viewer.
// Output contains only selected source vertices/triangles; never rewrites assets.
import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { Vector3 } from 'three'

export const SELECTORS = {
  liver: [/\.LIVER$/, /DIGESTIVE\.CAPSULE_OF_THE_LIVER$/],
  heart: [/HEART_WALL$/, /CARDIOVASCULAR\.LEFT_VENTRICLE$/],
  stomach: [/\.STOMACH_WALL$/, /DIGESTIVE\.STOMACH$/],
  lungLeft: [/LUNG\.L$/, /INFERIOR_LOBE_OF_LEFT_LUNG$/],
  lungRight: [/LUNG\.R$/, /INFERIOR_LOBE_OF_RIGHT_LUNG$/],
  kidneyLeft: [/KIDNEY_CORTEX\.L$/, /URINARY\.KIDNEY\.L$/, /OUTER_CORTEX_OF_KIDNEY\.L$/],
  kidneyRight: [/KIDNEY_CORTEX\.R$/, /URINARY\.KIDNEY\.R$/, /OUTER_CORTEX_OF_KIDNEY\.R$/],
  spleen: [/\.SPLEEN$/],
  bladder: [/URINARY_BLADDER_WALL$/, /URINARY\.URINARY_BLADDER$/],
  rectum: [/RECTUM_WALL$/, /DIGESTIVE\.RECTUM$/, /SIGMOID_COLON$/],
}
export const PAIRS = [['liver','heart'],['liver','stomach'],['heart','lungLeft'],['heart','lungRight'],['kidneyLeft','spleen'],['liver','kidneyRight'],['bladder','rectum']]

export function extractGeometry(root) {
  root.updateWorldMatrix(true, true)
  const vertices = [], triangles = []
  const point = new Vector3()
  root.traverse(object => {
    if (!object.isMesh) return
    const positions = object.geometry.getAttribute('position')
    if (!positions) throw new Error('Missing POSITION')
    const offset = vertices.length
    for (let i=0;i<positions.count;i++) {
      point.fromBufferAttribute(positions,i).applyMatrix4(object.matrixWorld)
      // glTF Y-up -> original Blender Z-up, preserving the existing ray directions.
      const v = [point.x,-point.z,point.y]
      if (!v.every(Number.isFinite)) throw new Error('Nonfinite source vertex')
      vertices.push(v)
    }
    const index = object.geometry.getIndex()
    const count = index ? index.count : positions.count
    if (count % 3) throw new Error('Non-triangle primitive')
    for(let i=0;i<count;i+=3) {
      const tri=[0,1,2].map(k => index ? index.getX(i+k) : i+k)
      if(!tri.every(x=>Number.isInteger(x)&&x>=0&&x<positions.count)) throw new Error('Invalid triangle index')
      triangles.push(tri.map(x=>x+offset))
    }
  })
  if(!vertices.length || !triangles.length) throw new Error('Empty organ geometry')
  return { vertices, triangles }
}

export async function collect(prefix) {
  const directory=path.dirname(prefix), stem=path.basename(prefix)
  const files=(await fs.readdir(directory)).filter(n=>n.startsWith(stem+'.')&&n.endsWith('.LOD3.glb')).sort()
  if(!files.length) throw new Error('No source LOD3 GLBs')
  const candidates=[],sources=[],summaries=[]
  const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
  for(const file of files) {
    const sourcePath=path.join(directory,file), data=await fs.readFile(sourcePath)
    const gltf=await loader.parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'')
    sources.push({path:sourcePath,sha256:createHash('sha256').update(data).digest('hex')})
    gltf.scene.traverse(root=>{
      const name=root.userData.name
      if(typeof name !== 'string' || !root.userData.panacea_structure_id) return
      const geometry=extractGeometry(root)
      const centroid=[0,0,0],lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity]
      for(const vertex of geometry.vertices) for(let k=0;k<3;k++) {
        centroid[k]+=vertex[k]/geometry.vertices.length
        lo[k]=Math.min(lo[k],vertex[k]);hi[k]=Math.max(hi[k],vertex[k])
      }
      summaries.push({name,centroid,lo,hi,vertexCount:geometry.vertices.length,qaNote:root.userData.panacea_qa_note||null})
      if(Object.values(SELECTORS).flat().some(p=>p.test(name))) candidates.push({name,source:sourcePath,...geometry})
    })
  }
  const organs={}
  for(const [key,patterns] of Object.entries(SELECTORS)) {
    for(const pattern of patterns) {
      const matches=candidates.filter(c=>pattern.test(c.name)).sort((a,b)=>b.vertices.length-a.vertices.length||a.name.localeCompare(b.name))
      if(matches.length) { organs[key]=matches[0];break }
    }
    if(!organs[key]) throw new Error(`Missing required organ: ${key}`)
  }
  return {schema:1,coordinateFrame:'Blender Z-up metres',sourceLevel:'public LOD3 reference anatomy',sources,summaries,organs,pairs:PAIRS}
}
if(process.argv[1] && path.resolve(process.argv[1])===new URL(import.meta.url).pathname) {
  const [prefix,output]=process.argv.slice(2)
  if(!prefix||!output) throw new Error('Usage: node public-organ-geometry.mjs public/bodyexposure/adult_male output.json')
  await fs.writeFile(output,JSON.stringify(await collect(prefix)))
  console.log(`Selected source organ geometry written to ${output}`)
}
