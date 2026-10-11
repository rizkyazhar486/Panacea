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
import * as THREE from '../../node_modules/three/build/three.module.js'
import { GLTFLoader } from '../../node_modules/three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from '../../node_modules/three/examples/jsm/libs/meshopt_decoder.module.js'

const args = process.argv.slice(2)
const file = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--thresh-mm' && args[i - 1] !== '--out')
const ti = args.indexOf('--thresh-mm')
const CONTACT_M = (ti >= 0 ? Number(args[ti + 1]) : 15) / 1000
const oi = args.indexOf('--out')
const OUT = oi >= 0 ? args[oi + 1] : null
const FPS = 24
const MIN_FRAMES = 3
const buf = fs.readFileSync(file)
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder)
const gltf = await new Promise((res, rej) => loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', res, rej))
const root = gltf.scene
const pelvis = root.getObjectByName('PELVIS')
const feet = { L: root.getObjectByName('FOOTL'), R: root.getObjectByName('FOOTR') }
for (const [k, o] of Object.entries(feet)) if (!o) throw new Error(`node FOOT${k} tidak ada`)

const footMeshes = (o) => { const m = []; o.traverse((c) => { if (c.isMesh) m.push(c) }); return m }
const world = (mesh, i, out) => out.fromBufferAttribute(mesh.geometry.attributes.position, i).applyMatrix4(mesh.matrixWorld)
const v = new THREE.Vector3()

// Sumbu: +Y atas, +Z anterior (dibuktikan oleh jari kaki di +Z pada pose awal: bbox kaki z -0.092..0.137 dengan jari di +).
root.updateMatrixWorld(true)
const marker = {}
// Penanda ekstrem (simpul paling posterior/anterior) bisa berada jauh di atas telapak (mis. ligamen/jaringan setinggi pergelangan), jadi tidak mewakili
// titik yang menapak. Penanda PLANTAR = simpul TERENDAH di dalam seperempat posterior (tumit) atau anterior (jari) panjang kaki pada pose awal.
const PLANTAR_FRACTION = 0.25
for (const side of ['L', 'R']) {
  const all = []
  for (const mesh of footMeshes(feet[side])) for (let i = 0; i < mesh.geometry.attributes.position.count; i++) { world(mesh, i, v); all.push({ mesh, i, y: v.y, z: v.z }) }
  const zmin = Math.min(...all.map((p) => p.z)), zmax = Math.max(...all.map((p) => p.z)), len = zmax - zmin
  const pick = (cands, better) => cands.reduce((a, b) => (better(b, a) ? b : a))
  const heel = pick(all, (b, a) => b.z < a.z), toe = pick(all, (b, a) => b.z > a.z)
  const heelPlantar = pick(all.filter((p) => p.z <= zmin + PLANTAR_FRACTION * len), (b, a) => b.y < a.y || (b.y === a.y && b.z < a.z))
  const toePlantar = pick(all.filter((p) => p.z >= zmax - PLANTAR_FRACTION * len), (b, a) => b.y < a.y || (b.y === a.y && b.z > a.z))
  marker[side] = { heel, toe, heelPlantar, toePlantar, footLength_m: len }
}

function sample(clip) {
  const mixer = new THREE.AnimationMixer(root)
  const act = mixer.clipAction(clip); act.play()
  const n = Math.round(clip.duration * FPS) + 1
  const rows = []
  for (let f = 0; f < n; f++) {
    mixer.setTime(f / FPS); root.updateMatrixWorld(true)
    const p = new THREE.Vector3().setFromMatrixPosition(pelvis.matrixWorld)
    const row = { pelvisZ: p.z }
    for (const side of ['L', 'R']) {
      let lowest = Infinity, lowestZ = 0
      for (const mesh of footMeshes(feet[side])) for (let i = 0; i < mesh.geometry.attributes.position.count; i++) { world(mesh, i, v); if (v.y < lowest) { lowest = v.y; lowestZ = v.z } }
      const mk = {}
      for (const name of ['heel', 'toe', 'heelPlantar', 'toePlantar']) { world(marker[side][name].mesh, marker[side][name].i, v); mk[name] = { y: v.y, z: v.z } }
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

function fit(groups) {
  if (!groups.length) return { stance_phases: 0 }
  // x_g(t) = c_g − v·t, v bersama untuk semua fase: v = −Σcov(t,x)/Σvar(t)
  let num = 0, den = 0
  for (const g of groups) { const tm = g.t.reduce((a, b) => a + b, 0) / g.t.length, xm = g.x.reduce((a, b) => a + b, 0) / g.x.length; g.t.forEach((t, i) => { num += (t - tm) * (g.x[i] - xm); den += (t - tm) ** 2 }) }
  const vel = -num / den
  const res = []
  for (const g of groups) { const tm = g.t.reduce((a, b) => a + b, 0) / g.t.length, xm = g.x.reduce((a, b) => a + b, 0) / g.x.length; g.t.forEach((t, i) => res.push(g.x[i] - (xm - vel * (t - tm)))) }
  const rms = Math.sqrt(res.reduce((a, b) => a + b * b, 0) / res.length)
  return { stance_phases: groups.length, stance_frames: groups.reduce((a, g) => a + g.t.length, 0), common_forward_speed_m_s: +Math.abs(vel).toFixed(3), slide_rms_mm: +(rms * 1000).toFixed(1), slide_max_mm: +(Math.max(...res.map(Math.abs)) * 1000).toFixed(1) }
}

const report = { method: 'single clip-wide floor; heel/toe = extreme vertices at rest pose; heelPlantar/toePlantar = lowest vertex within the posterior/anterior quarter of the foot at rest; additional lowest-point (sole) contact definition whose AP position is the lowest vertex (contact point)', contact_threshold_mm: CONTACT_M * 1000, clips: {} }
for (const clip of gltf.animations.filter((a) => a.name === 'WALK' || a.name === 'RUN')) {
  let rows = sample(clip)
  // loop tertutup bila seluruh nilai kaki relatif panggul di bingkai terakhir sama dengan bingkai pertama (< 0,5 mm)
  const rel = (r) => ['L', 'R'].flatMap((sd) => [r[sd].lowest, r[sd].toe.y, r[sd].heel.y, r[sd].toePlantar.y, r[sd].heelPlantar.y, r[sd].toe.z - r.pelvisZ, r[sd].heel.z - r.pelvisZ])
  const closed = rel(rows[0]).every((x, i) => Math.abs(x - rel(rows.at(-1))[i]) < 0.0005)
  if (closed) rows = rows.slice(0, -1)
  const N = rows.length
  const floor = Math.min(...rows.flatMap((r) => ['L', 'R'].map((s) => r[s].lowest)))
  const out = { frames: N, foot_length_m: +marker.L.footLength_m.toFixed(3), loop_closed_duplicate_end_frame_dropped: closed, floor_m: +floor.toFixed(4) }
  for (const kind of ['heel', 'toe', 'heelPlantar', 'toePlantar', 'sole']) {
    const groups = []; const per = {}
    for (const side of ['L', 'R']) {
      const h = rows.map((r) => (kind === 'sole' ? r[side].lowest : r[side][kind].y) - floor)
      const ph = phases(h, closed)
      per[side] = ph.map(([a, b]) => (b >= N ? `${a}-${N - 1}+0-${b - N}` : `${a}-${b}`))
      // Posisi AP: penanda tumit/jari = simpul kaku; sol = z simpul TERENDAH tiap bingkai (titik kontak, ikut berguling tanpa bias penanda kaku).
      for (const [a, b] of ph) { const t = [], x = []; for (let f = a; f <= b; f++) { const r = rows[f % N]; t.push(f / FPS); x.push((kind === 'sole' ? r[side].lowestZ : r[side][kind].z) - r.pelvisZ) } groups.push({ t, x }) }
    }
    out[kind] = { ...fit(groups), phases_by_side: per }
  }
  report.clips[clip.name] = out
}
const text = JSON.stringify(report, null, 1)
if (OUT) fs.writeFileSync(OUT, text + '\n'); else console.log(text)
