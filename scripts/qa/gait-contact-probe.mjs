// R-D7-CONTACT (ENG-D7-02): penelitian baca-saja tentang BAGIAN KAKI mana yang menyentuh lantai pada rig publik, dan apakah
// kegagalan pengukuran berasal dari definisi landmark atau dari gerak sumber. Tidak mengubah gerak, mesh, landmark atau ambang.
//   node scripts/qa/gait-contact-probe.mjs [--out bodyexposure/qa_reports/gait_contact_probe.json]
// Dua ukuran per fixture × sisi:
//   1. lowest_structure_at_contact: struktur anatomis pemilik verteks telapak terendah pada bingkai kontak (< 15 mm dari lantai).
//   2. per kelompok tulang (kalkaneus, kaki depan): verteks yang PALING DEKAT lantai selama klip (definisi bebas-pose), dibanding
//      landmark rig saat ini (diturunkan dari pose istirahat). Kontrol: bila keduanya sama, definisi landmark tidak bermasalah.
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import * as THREE from '../../node_modules/three/build/three.module.js'
import { GLTFLoader } from '../../node_modules/three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from '../../node_modules/three/examples/jsm/libs/meshopt_decoder.module.js'

const BODIES = ['adult_male', 'vhf_denver_ct_adult_female']
const FPS = 24, WINDOW = 0.015
const GROUPS = { calcaneus: /SKELETAL\.CALCANEUS\./, forefoot: /SKELETAL\.(FIRST_METATARSAL_BONE|METATARSALS_AND_PHALANGES_COMBINED)\./ }
const LANDMARK = { calcaneus: 'HEEL', forefoot: 'BALL' }
const mm = (x) => Math.round(x * 1e4) / 10
const sid = (m) => { for (let o = m; o; o = o.parent) { const id = o.userData?.panacea_structure_id; if (id) return id } return '' }
const phases = (within) => within.filter((w, i) => w && !within[(i - 1 + within.length) % within.length]).length

export async function probe(file) {
  const buf = fs.readFileSync(file), l = new GLTFLoader(); l.setMeshoptDecoder(MeshoptDecoder)
  const g = await new Promise((r, j) => l.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', r, j))
  const root = g.scene, v = new THREE.Vector3(), clips = {}
  for (const clip of g.animations.filter((a) => a.name === 'WALK' || a.name === 'RUN')) {
    const mx = new THREE.AnimationMixer(root); mx.clipAction(clip).play()
    const n = Math.round(clip.duration * FPS) // bingkai penutup loop = duplikat bingkai 0
    const sole = { L: [], R: [] }, who = { L: [], R: [] }, track = {}, lm = {}
    for (let f = 0; f < n; f++) {
      mx.setTime(f / FPS); root.updateMatrixWorld(true)
      for (const s of ['L', 'R']) {
        let lo = Infinity, owner = ''
        root.getObjectByName('FOOT' + s).traverse((m) => {
          if (!m.isMesh) return
          const id = sid(m), a = m.geometry.attributes.position, grp = Object.keys(GROUPS).find((k) => GROUPS[k].test(id))
          for (let i = 0; i < a.count; i++) {
            v.fromBufferAttribute(a, i).applyMatrix4(m.matrixWorld)
            if (v.y < lo) { lo = v.y; owner = id }
            if (grp) (((track[`${s}:${grp}`] ??= {})[`${m.uuid}:${i}`]) ??= []).push(v.y)
          }
        })
        sole[s].push(lo); who[s].push(owner)
        for (const [grp, key] of Object.entries(LANDMARK)) { const o = root.getObjectByName(`FOOT_LANDMARK_${key}_${s}`); if (o) (((lm[`${s}:${grp}`]) ??= []).push(new THREE.Vector3().setFromMatrixPosition(o.matrixWorld).y)) }
      }
    }
    mx.stopAllAction()
    const floor = Math.min(...sole.L, ...sole.R), sides = {}
    for (const s of ['L', 'R']) {
      const tally = {}
      sole[s].forEach((y, f) => { if (y - floor < WINDOW) tally[who[s][f]] = (tally[who[s][f]] ?? 0) + 1 })
      const groups = {}
      for (const grp of Object.keys(GROUPS)) {
        const verts = track[`${s}:${grp}`]
        if (!verts) { groups[grp] = { available: false, reason: 'no source bone mesh for this group' }; continue }
        let best = null
        for (const ys of Object.values(verts)) { const m = Math.min(...ys); if (!best || m < best.m) best = { m, ys } }
        const w = best.ys.map((y) => y - floor < WINDOW)
        const cur = lm[`${s}:${grp}`]
        groups[grp] = {
          closest_vertex: { min_height_mm: mm(best.m - floor), frames_within_window: w.filter(Boolean).length, stance_phases: phases(w) },
          current_landmark: cur ? { node: `FOOT_LANDMARK_${LANDMARK[grp]}_${s}`, min_height_mm: mm(Math.min(...cur) - floor), frames_within_window: cur.filter((y) => y - floor < WINDOW).length, stance_phases: phases(cur.map((y) => y - floor < WINDOW)) } : { available: false },
        }
      }
      sides[s] = { sole_min_height_mm: mm(Math.min(...sole[s]) - floor), contact_frames: Object.values(tally).reduce((a, b) => a + b, 0), lowest_structure_at_contact: tally, groups }
    }
    clips[clip.name] = { frames: n, sides }
  }
  return { sha256: createHash('sha256').update(buf).digest('hex'), clips }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const out = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : null
  const report = { schema: 'panacea-gait-contact-probe/v1', research: 'R-D7-CONTACT', criterion: 'ENG-D7-02', contact_window_mm: WINDOW * 1000,
    note: 'Read-only diagnostic. closest_vertex is the bone vertex that comes nearest the floor during the clip (pose-independent); current_landmark is the rig node derived at rest pose. Matching values mean the landmark definition is not the cause. Not a clinical measurement.',
    bodies: {} }
  for (const body of BODIES) report.bodies[body] = await probe(`public/bodyexposure/${body}.rig_rom.glb`)
  const json = JSON.stringify(report, null, 1) + '\n'
  if (out) fs.writeFileSync(out, json); else process.stdout.write(json)
}
