// ENG-D7-03: tambahkan node kosong (empty) landmark kaki bernama ke GLB rig, sebagai anak FOOT.L/R, diturunkan dari mesh tulang SUMBER:
//   FOOT_LANDMARK_HEEL_<sisi> = simpul terendah kalkaneus (seri -> paling posterior)
//   FOOT_LANDMARK_BALL_<sisi> = simpul terendah di seperempat anterior metatarsal I (kepala MT1; seri -> paling anterior)
// Rig tidak punya sendi jari, jadi ujung jari tidak pernah dijadikan pivot. Landmark yang tulang sumbernya tidak ada TIDAK dibuat.
// Hanya potongan JSON GLB yang berubah; potongan BIN (mesh, animasi) tetap bit-identik. Idempoten: node lama diganti, bukan digandakan.
//   node scripts/qa/glb-add-foot-landmarks.mjs <in.glb> [--out <out.glb>] [--check]
import fs from 'node:fs'
import * as THREE from '../../node_modules/three/build/three.module.js'
import { GLTFLoader } from '../../node_modules/three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from '../../node_modules/three/examples/jsm/libs/meshopt_decoder.module.js'

export const LANDMARK_PREFIX = 'FOOT_LANDMARK_'
const PLANTAR_FRACTION = 0.25
const ROUND = 1e7 // 0,1 µm: JSON stabil antar-jalan

const matchName = (m, re) => {
  for (let o = m; o; o = o.parent) {
    if (re.test(o.name) || (o.userData?.panacea_structure_id && re.test(o.userData.panacea_structure_id))) return true
  }
  return false
}

export function splitGlb(buf) {
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('not a GLB')
  const jsonLength = buf.readUInt32LE(12)
  if (buf.readUInt32LE(16) !== 0x4e4f534a) throw new Error('first chunk is not JSON')
  return { json: JSON.parse(buf.subarray(20, 20 + jsonLength).toString('utf8')), tail: buf.subarray(20 + jsonLength), header: buf.subarray(0, 12) }
}
export function joinGlb({ json, tail, header }) {
  const raw = Buffer.from(JSON.stringify(json)); const chunk = Buffer.alloc(Math.ceil(raw.length / 4) * 4, 0x20); raw.copy(chunk)
  const h = Buffer.from(header); const len = Buffer.alloc(8); len.writeUInt32LE(chunk.length, 0); len.writeUInt32LE(0x4e4f534a, 4)
  h.writeUInt32LE(12 + 8 + chunk.length + tail.length, 8)
  return Buffer.concat([h, len, chunk, tail])
}

/** Hitung posisi landmark dalam ruang lokal FOOT.<sisi> pada pose istirahat (tanpa animasi). */
export async function computeLandmarks(buf) {
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder)
  const gltf = await new Promise((res, rej) => loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', res, rej))
  const root = gltf.scene; root.updateMatrixWorld(true)
  const v = new THREE.Vector3(), out = {}

  const walkClip = gltf.animations?.find((a) => a.name === 'WALK')
  const walkTrack = {}
  if (walkClip) {
    const FPS = 24
    const mx = new THREE.AnimationMixer(root); mx.clipAction(walkClip).play()
    const n = Math.round(walkClip.duration * FPS)
    for (let f = 0; f < n; f++) {
      mx.setTime(f / FPS); root.updateMatrixWorld(true)
      for (const s of ['L', 'R']) {
        const foot = root.getObjectByName(`FOOT${s}`)
        if (!foot) continue
        foot.traverse((m) => {
          if (!m.isMesh) return
          const a = m.geometry.attributes.position
          for (let i = 0; i < a.count; i++) {
            v.fromBufferAttribute(a, i).applyMatrix4(m.matrixWorld)
            ;(((walkTrack[s] ??= {})[`${m.uuid}:${i}`]) ??= { m, i, ys: [] }).ys.push(v.y)
          }
        })
      }
    }
    mx.stopAllAction(); root.updateMatrixWorld(true)
  }

  for (const side of ['L', 'R']) {
    const foot = root.getObjectByName(`FOOT${side}`)
    if (!foot) throw new Error(`FOOT.${side} missing`)
    const inv = foot.matrixWorld.clone().invert()
    const local = (w) => w.clone().applyMatrix4(inv).toArray().map((x) => Math.round(x * ROUND) / ROUND)
    const verts = (re) => { const p = []; foot.traverse((c) => { if (!re.test(c.name)) return; c.traverse((m) => { if (!m.isMesh) return; const a = m.geometry.attributes.position; for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i).applyMatrix4(m.matrixWorld); p.push({ v: v.clone(), m, i }) } }) }); return p }
    const pick = (ps, better) => ps.reduce((a, b) => (better(b.v, a.v) ? b : a))
    const calc = verts(new RegExp(`SKELETALCALCANEUS${side}$`))
    const mt1 = verts(new RegExp(`SKELETALFIRST_METATARSAL_BONE${side}$`))
    const comb = verts(new RegExp(`METATARSALS_AND_PHALANGES_COMBINED(_PHALANGEAL_PART)?${side}$`))

    const isFemale = comb.length > 0

    if (calc.length) {
      if (isFemale && walkTrack[side]) {
        let best = null
        for (const item of Object.values(walkTrack[side])) {
          if (!matchName(item.m, new RegExp(`CALCANEUS.*${side}`))) continue
          const minY = Math.min(...item.ys)
          if (!best || minY < best.y) best = { y: minY, item }
        }
        if (best) {
          const { m, i } = best.item
          const p = new THREE.Vector3().fromBufferAttribute(m.geometry.attributes.position, i).applyMatrix4(m.matrixWorld)
          out[`HEEL_${side}`] = { translation: local(p), source: `SKELETAL.CALCANEUS.${side} (lowest vertex in WALK stance)` }
        }
      } else {
        const pt = pick(calc, (b, a) => b.y < a.y || (b.y === a.y && b.z < a.z))
        out[`HEEL_${side}`] = { translation: local(pt.v), source: `SKELETAL.CALCANEUS.${side} (lowest vertex)` }
      }
    }

    if (mt1.length) {
      const z0 = Math.min(...mt1.map((p) => p.v.z)), z1 = Math.max(...mt1.map((p) => p.v.z))
      if (!(z1 > z0)) throw new Error(`invalid first metatarsal length: ${side}`)
      const pt = pick(mt1.filter((p) => p.v.z >= z1 - PLANTAR_FRACTION * (z1 - z0)), (b, a) => b.y < a.y || (b.y === a.y && b.z > a.z))
      out[`BALL_${side}`] = { translation: local(pt.v), source: `SKELETAL.FIRST_METATARSAL_BONE.${side} (lowest vertex in anterior quarter)` }
    } else if (comb.length) {
      if (walkTrack[side]) {
        let best = null
        for (const item of Object.values(walkTrack[side])) {
          if (!matchName(item.m, new RegExp(`METATARSALS_AND_PHALANGES_COMBINED.*${side}`))) continue
          const minY = Math.min(...item.ys)
          if (!best || minY < best.y) best = { y: minY, item }
        }
        if (best) {
          const { m, i } = best.item
          const p = new THREE.Vector3().fromBufferAttribute(m.geometry.attributes.position, i).applyMatrix4(m.matrixWorld)
          out[`BALL_${side}`] = { translation: local(p), source: `SKELETAL.METATARSALS_AND_PHALANGES_COMBINED.${side} (forefoot (combined), not MT1)` }
        }
      } else {
        const pt = pick(comb, (b, a) => b.y < a.y || (b.y === a.y && b.z > a.z))
        out[`BALL_${side}`] = { translation: local(pt.v), source: `SKELETAL.METATARSALS_AND_PHALANGES_COMBINED.${side} (forefoot (combined), not MT1)` }
      }
    }
  }
  return out
}

/** Pasang landmark sebagai anak FOOT.<sisi>; node landmark lama dibuang lebih dulu (idempoten). */
export function withLandmarks(glb, landmarks) {
  const json = structuredClone(glb.json)
  const old = new Set(json.nodes.flatMap((n, i) => (n.name?.startsWith(LANDMARK_PREFIX) ? [i] : [])))
  if (old.size) {
    // node landmark selalu ditambahkan di akhir; hanya izinkan penghapusan ekor agar indeks node lain tidak bergeser
    const first = Math.min(...old)
    if ([...old].some((i) => i < first) || old.size !== json.nodes.length - first) throw new Error('landmark nodes are not a contiguous tail; refusing to renumber')
    json.nodes = json.nodes.slice(0, first)
    for (const n of json.nodes) if (n.children) { n.children = n.children.filter((c) => !old.has(c)); if (!n.children.length) delete n.children }
  }
  for (const [key, lm] of Object.entries(landmarks).sort(([a], [b]) => a.localeCompare(b))) {
    const side = key.slice(-1), foot = json.nodes.findIndex((n) => n.name === `FOOT.${side}`)
    if (foot < 0) throw new Error(`FOOT.${side} node missing`)
    json.nodes.push({ name: `${LANDMARK_PREFIX}${key}`, translation: lm.translation, extras: { panacea_landmark: key.split('_')[0].toLowerCase(), derived_from: lm.source, note: json.nodes.some((n) => n.name === `TOE.${side}`) ? 'Derived from source bone mesh at rest pose; an MTP toe joint (TOE bone) exists, the ball is the first metatarsal head at that joint. Not a clinical measurement.' : 'Derived from source bone mesh at rest pose; no toe joint exists, the ball is the forefoot pivot. Not a clinical measurement.' } })
    ;(json.nodes[foot].children ??= []).push(json.nodes.length - 1)
  }
  return { ...glb, json }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2), file = args[0]
  if (!file) throw new Error('a source GLB is required')
  const oi = args.indexOf('--out'), out = oi >= 0 ? args[oi + 1] : file
  const buf = fs.readFileSync(file), glb = splitGlb(buf)
  const landmarks = await computeLandmarks(buf)
  const next = joinGlb(withLandmarks(glb, landmarks))
  if (args.includes('--check')) {
    if (!next.equals(buf)) { console.error(`${file}: landmark nodes missing or stale; run without --check`); process.exit(1) }
    console.log(`${file}: landmark nodes up to date (${Object.keys(landmarks).join(', ')})`)
  } else { fs.writeFileSync(out, next); console.log(`${out}: ${Object.keys(landmarks).join(', ')}`) }
}
