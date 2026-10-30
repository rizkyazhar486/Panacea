// Reproduksi independen D7 (selip kaki WALK/RUN) langsung dari GLB publik, tanpa Blender.
// Pakai: node scripts/qa/glb-foot-contact-reproduce.mjs public/bodyexposure/adult_male.rig_rom.glb [--thresh-mm 15] (bukan gerbang CI)
//
// Metodologi (berbeda dari bodyexposure/pipeline/check_foot_slide.py pada dua hal, keduanya dinyatakan):
//  1. Lantai SATU nilai untuk seluruh klip dan kedua kaki = titik terendah semua simpul kaki di semua bingkai. Skrip Blender memakai
//     titik terendah tiap penanda sendiri, yang membuat penanda yang tidak pernah menapak (mis. tumit saat berlari) tetap dianggap menapak.
//  2. Selain penanda tumit/jari (simpul ekstrem pada pose awal; rig ini tidak punya tulang tumit/jari), diukur juga titik TERENDAH kaki
//     (sol) tiap bingkai sebagai definisi kontak yang tidak bergantung pada pilihan landmark.
// Hasil adalah batas atas selip (penanda kaku ikut berguling bersama kaki), bukan selip sebenarnya.
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { fitFootContact } from './foot-contact-math.mjs'
import * as THREE from '../../node_modules/three/build/three.module.js'
import { GLTFLoader } from '../../node_modules/three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from '../../node_modules/three/examples/jsm/libs/meshopt_decoder.module.js'

const args = process.argv.slice(2)
const file = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--thresh-mm' && args[i - 1] !== '--out')
const ti = args.indexOf('--thresh-mm')
const CONTACT_M = (ti >= 0 ? Number(args[ti + 1]) : 15) / 1000
if (!file) throw new Error('a source GLB is required')
if (!Number.isFinite(CONTACT_M) || CONTACT_M <= 0) throw new Error('contact threshold must be finite and positive')
const oi = args.indexOf('--out')
const OUT = oi >= 0 ? args[oi + 1] : null
const FPS = 24
const MIN_FRAMES = 3
const buf = fs.readFileSync(file)
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder)
const gltf = await new Promise((res, rej) => loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', res, rej))
const requiredClips = ['WALK', 'RUN']
for (const name of requiredClips) {
  const found = gltf.animations.filter((clip) => clip.name === name)
  if (found.length !== 1 || !Number.isFinite(found[0].duration) || found[0].duration <= 0) throw new Error(`exactly one finite positive ${name} animation is required`)
}
const root = gltf.scene
const pelvis = root.getObjectByName('PELVIS')
if (!pelvis) throw new Error('node PELVIS is required')
const feet = { L: root.getObjectByName('FOOTL'), R: root.getObjectByName('FOOTR') }
for (const [k, o] of Object.entries(feet)) if (!o) throw new Error(`node FOOT${k} tidak ada`)

const footMeshes = (o) => { const m = []; o.traverse((c) => { if (c.isMesh) m.push(c) }); return m }
const world = (mesh, i, out) => out.fromBufferAttribute(mesh.geometry.attributes.position, i).applyMatrix4(mesh.matrixWorld)
const v = new THREE.Vector3()

// Sumbu: +Y atas, +Z anterior (dibuktikan oleh jari kaki di +Z pada pose awal: bbox kaki z -0.092..0.137 dengan jari di +).
root.updateMatrixWorld(true)
root.traverse((node) => {
  if (!node.matrixWorld.elements.every(Number.isFinite) || !(node.matrixWorld.determinant() > 0)) throw new Error(`invalid or reflected world transform: ${node.name}`)
})
const marker = {}
// Penanda ekstrem (simpul paling posterior/anterior) bisa berada jauh di atas telapak (mis. ligamen/jaringan setinggi pergelangan), jadi tidak mewakili
// titik yang menapak. Penanda PLANTAR = simpul TERENDAH di dalam seperempat posterior (tumit) atau anterior (jari) panjang kaki pada pose awal.
const PLANTAR_FRACTION = 0.25
for (const side of ['L', 'R']) {
  const all = []
  for (const mesh of footMeshes(feet[side])) for (let i = 0; i < mesh.geometry.attributes.position.count; i++) { world(mesh, i, v); all.push({ mesh, i, y: v.y, z: v.z }) }
  if (!all.length || all.some((p) => !Number.isFinite(p.y) || !Number.isFinite(p.z))) throw new Error(`missing or invalid foot geometry: ${side}`)
  const zmin = Math.min(...all.map((p) => p.z)), zmax = Math.max(...all.map((p) => p.z)), len = zmax - zmin
  if (!(len > 0) || !Number.isFinite(len)) throw new Error(`invalid foot length: ${side}`)
  const pick = (cands, better) => cands.reduce((a, b) => (better(b, a) ? b : a))
  const heel = pick(all, (b, a) => b.z < a.z), toe = pick(all, (b, a) => b.z > a.z)
  const heelPlantar = pick(all.filter((p) => p.z <= zmin + PLANTAR_FRACTION * len), (b, a) => b.y < a.y || (b.y === a.y && b.z < a.z))
  const toePlantar = pick(all.filter((p) => p.z >= zmax - PLANTAR_FRACTION * len), (b, a) => b.y < a.y || (b.y === a.y && b.z > a.z))
  marker[side] = { heel, toe, heelPlantar, toePlantar, footLength_m: len }
  // T-D7-02: landmark ANATOMIS dari mesh tulang sumber (bukan simpul ekstrem kaki). Rig tidak punya sendi jari, jadi bola kaki (kepala
  // metatarsal I, atau kombinasi metatarsal+falang untuk betina) adalah pivot depan; ujung jari tidak dipakai.
  const bone = (re) => { const m = []; feet[side].traverse((c) => { if (re.test(c.name)) footMeshes(c).forEach((x) => m.includes(x) || m.push(x)) }); return m }
  const verts = (meshes) => { const p = []; for (const mesh of meshes) for (let i = 0; i < mesh.geometry.attributes.position.count; i++) { world(mesh, i, v); p.push({ mesh, i, y: v.y, z: v.z }) } return p }
  const calc = verts(bone(new RegExp(`SKELETALCALCANEUS${side}$`)))
  const mt1 = verts(bone(new RegExp(`SKELETALFIRST_METATARSAL_BONE${side}$`)))
  const comb = verts(bone(new RegExp(`METATARSALS_AND_PHALANGES_COMBINED(_PHALANGEAL_PART)?${side}$`)))
  const forefoot = mt1.length ? mt1 : comb

  // ENG-D7-03: rig yang diekspor membawa node landmark bernama (scripts/qa/glb-add-foot-landmarks.mjs). Metrik MEMAKAI node itu; simpul mesh
  // hanya kontrol silang: selisih > 1 µm berarti node usang atau salah taruh, dan reproduksi berhenti.
  for (const [kind, key, sourceMesh] of [['heelCalcaneus', 'HEEL', calc], ['ballMT1', 'BALL', forefoot]]) {
    const node = root.getObjectByName(`FOOT_LANDMARK_${key}_${side}`)
    if (!node && !sourceMesh.length) { marker[side][kind] = null; continue }
    if (!node) throw new Error(`rig landmark node FOOT_LANDMARK_${key}_${side} missing while its source bone exists`)
    if (!sourceMesh.length) throw new Error(`rig landmark node FOOT_LANDMARK_${key}_${side} has no source bone`)
    const pn = new THREE.Vector3().setFromMatrixPosition(node.matrixWorld)
    const closestDist = Math.min(...sourceMesh.map((pt) => pn.distanceTo(world(pt.mesh, pt.i, v))))
    if (closestDist > 1e-6) throw new Error(`rig landmark node FOOT_LANDMARK_${key}_${side} is ${(closestDist * 1000).toFixed(3)} mm from its source vertex`)
    marker[side][kind] = { node }
  }
}
// Ketersediaan landmark anatomis per sisi dicatat; landmark yang tidak ada di sumber TIDAK diganti tebakan.
const ANATOMICAL = { heelCalcaneus: 'rig node FOOT_LANDMARK_HEEL_<side>: calcaneus lowest vertex', ballMT1: 'rig node FOOT_LANDMARK_BALL_<side>: first metatarsal head (or forefoot combined)' }
const landmarkAvailability = Object.fromEntries(Object.keys(ANATOMICAL).map((k) => [k, { L: !!marker.L[k], R: !!marker.R[k] }]))

function sample(clip) {
  const mixer = new THREE.AnimationMixer(root)
  const act = mixer.clipAction(clip); act.play()
  const n = Math.round(clip.duration * FPS) + 1
  const rows = []
  for (let f = 0; f < n; f++) {
    mixer.setTime(f / FPS); root.updateMatrixWorld(true)
    const p = new THREE.Vector3().setFromMatrixPosition(pelvis.matrixWorld)
    if (![p.x, p.y, p.z].every(Number.isFinite)) throw new Error('invalid animated pelvis transform')
    const row = { pelvisZ: p.z }
    for (const side of ['L', 'R']) {
      for (const mesh of footMeshes(feet[side])) if (!mesh.matrixWorld.elements.every(Number.isFinite) || !(mesh.matrixWorld.determinant() > 0)) throw new Error(`invalid animated foot transform: ${side}`)
      let lowest = Infinity, lowestZ = 0
      for (const mesh of footMeshes(feet[side])) for (let i = 0; i < mesh.geometry.attributes.position.count; i++) { world(mesh, i, v); if (v.y < lowest) { lowest = v.y; lowestZ = v.z } }
      const mk = {}
      for (const name of ['heel', 'toe', 'heelPlantar', 'toePlantar', 'heelCalcaneus', 'ballMT1']) {
        const m = marker[side][name]; if (!m) continue
        if (m.node) v.setFromMatrixPosition(m.node.matrixWorld); else world(m.mesh, m.i, v)
        mk[name] = { y: v.y, z: v.z }
      }
      row[side] = { lowest, lowestZ, ...mk }
    }
    rows.push(row)
  }
  mixer.stopAllAction()
  return rows
}

// Klip WALK/RUN adalah loop: bingkai terakhir menduplikasi bingkai pertama. Tanpa penanganan ini satu fase tumpu yang melintasi jahitan loop
// terhitung dua fase dan satu bingkai terhitung dua kali (menggelembungkan jumlah fase dan bingkai).
function phases(heights, closed) {
  const n = heights.length
  const out = []; let i = 0
  while (i < n) {
    if (heights[i] < CONTACT_M) { let j = i; while (j + 1 < n && heights[j + 1] < CONTACT_M) j++; out.push([i, j]); i = j + 1 } else i++
  }
  if (closed && out.length > 1 && out[0][0] === 0 && out[out.length - 1][1] === n - 1) {
    const first = out.shift(), last = out.pop()
    out.push([last[0], first[1] + n])  // indeks > n-1 = bingkai berikutnya setelah jahitan (modulo n)
  }
  return out.filter(([a, b]) => b - a + 1 >= MIN_FRAMES)
}


const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const report = { schema: 'panacea-foot-contact/v2', source_sha256: sha256(buf), reproducer_sha256: sha256(fs.readFileSync(new URL(import.meta.url))), math_sha256: sha256(fs.readFileSync(new URL('./foot-contact-math.mjs', import.meta.url))), coordinate_contract: { gltf_length_unit: 'metre', up: '+Y', anterior: '+Z', reference: 'pelvis-relative', fps: FPS, minimum_stance_frames: MIN_FRAMES, plantar_fraction: PLANTAR_FRACTION, limitation: 'Rigid markers and a fitted common forward speed give an engineering residual, not independently measured ground slip or clinical validation.' }, method: 'single clip-wide floor; heel/toe = extreme vertices at rest pose; heelPlantar/toePlantar = lowest vertex within the posterior/anterior quarter of the foot at rest; additional lowest-point (sole) contact definition whose AP position is the lowest vertex (contact point)', contact_threshold_mm: CONTACT_M * 1000, clips: {} }
for (const clip of gltf.animations.filter((a) => a.name === 'WALK' || a.name === 'RUN')) {
  let rows = sample(clip)
  // loop tertutup bila seluruh nilai kaki relatif panggul di bingkai terakhir sama dengan bingkai pertama (< 0,5 mm)
  const rel = (r) => ['L', 'R'].flatMap((sd) => [r[sd].lowest, r[sd].toe.y, r[sd].heel.y, r[sd].toePlantar.y, r[sd].heelPlantar.y, r[sd].toe.z - r.pelvisZ, r[sd].heel.z - r.pelvisZ])
  const closed = rel(rows[0]).every((x, i) => Math.abs(x - rel(rows.at(-1))[i]) < 0.0005)
  if (closed) rows = rows.slice(0, -1)
  const N = rows.length
  const floor = Math.min(...rows.flatMap((r) => ['L', 'R'].map((s) => r[s].lowest)))
  const out = { frames: N, foot_length_m: +marker.L.footLength_m.toFixed(3), loop_closed_duplicate_end_frame_dropped: closed, floor_m: +floor.toFixed(4) }
  for (const kind of ['heel', 'toe', 'heelPlantar', 'toePlantar', 'heelCalcaneus', 'ballMT1', 'sole']) {
    const groups = []; const per = {}
    for (const side of ['L', 'R']) {
      if (kind !== 'sole' && !marker[side][kind]) { per[side] = null; continue }
      const h = rows.map((r) => (kind === 'sole' ? r[side].lowest : r[side][kind].y) - floor)
      const ph = phases(h, closed)
      per[side] = ph.map(([a, b]) => (b >= N ? `${a}-${N - 1}+0-${b - N}` : `${a}-${b}`))
      // Posisi AP: penanda tumit/jari = simpul kaku; sol = z simpul TERENDAH tiap bingkai (titik kontak, ikut berguling tanpa bias penanda kaku).
      for (const [a, b] of ph) { const t = [], x = []; for (let f = a; f <= b; f++) { const r = rows[f % N]; t.push(f / FPS); x.push((kind === 'sole' ? r[side].lowestZ : r[side][kind].z) - r.pelvisZ) } groups.push({ side, t, x }) }
    }
    out[kind] = { ...fitFootContact(groups), phases_by_side: per, samples: groups }
    if (kind in ANATOMICAL) out[kind].landmark = { definition: ANATOMICAL[kind], available_by_side: landmarkAvailability[kind] }
  }
  report.clips[clip.name] = out
}
const text = JSON.stringify(report, null, 1)
if (OUT) fs.writeFileSync(OUT, text + '\n'); else console.log(text)
