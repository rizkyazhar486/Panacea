// Verifikasi independen D2: setiap GLB di public/bodyexposure harus didekode (three + meshopt) tanpa galat,
// bermesh/node bernama, dan berkoordinat hingga. Pakai: node scripts/qa/glb-load-all.mjs [dir] (bukan gerbang CI).
import fs from 'node:fs'
import path from 'node:path'
import { GLTFLoader } from '../../node_modules/three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from '../../node_modules/three/examples/jsm/libs/meshopt_decoder.module.js'
const dir = process.argv[2] || 'public/bodyexposure'
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.glb')).sort()
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder)
const bad = []; let meshes = 0, tris = 0, bytes = 0
for (const f of files) {
  const buf = fs.readFileSync(path.join(dir, f)); bytes += buf.length
  try {
    const gltf = await new Promise((res, rej) => loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', res, rej))
    let m = 0, nonFinite = false
    gltf.scene.traverse((o) => {
      if (!o.isMesh) return
      m++
      const pos = o.geometry.attributes.position
      tris += (o.geometry.index ? o.geometry.index.count : pos.count) / 3
      const a = pos.array; for (let i = 0; i < a.length; i += 97) if (!Number.isFinite(a[i])) { nonFinite = true; break }
    })
    meshes += m
    if (m === 0 && gltf.animations.length === 0) bad.push(`${f}: tanpa mesh dan tanpa animasi`)
    if (nonFinite) bad.push(`${f}: koordinat bukan angka hingga`)
  } catch (e) { bad.push(`${f}: ${String(e?.message ?? e).slice(0, 120)}`) }
}
console.log(JSON.stringify({ files: files.length, meshes, triangles: Math.round(tris), megabytes: +(bytes / 1048576).toFixed(1), failures: bad.length }))
if (bad.length) { console.log(bad.join('\n')); process.exit(1) }
