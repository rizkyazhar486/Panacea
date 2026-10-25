// ENG-D7-02: bukti per-fixture (jantan/betina × WALK/RUN) apakah selip kaki dapat diukur, beserta PENYEBAB terukur bila tidak.
// Membaca rig publik (node landmark FOOT_LANDMARK_*, ENG-D7-03) dan laporan reproduksi kontak; tidak mengubah gerak, mesh atau ambang.
//   node scripts/qa/gait-measurability.mjs [--out bodyexposure/qa_reports/gait_measurability.json]
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import * as THREE from '../../node_modules/three/build/three.module.js'
import { GLTFLoader } from '../../node_modules/three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from '../../node_modules/three/examples/jsm/libs/meshopt_decoder.module.js'
import { evaluateFootSlide, RESEARCH_FOOT_SLIDE_CRITERIA as C } from '../../src/domains/body-exposure/engine/gaitFootMetrics.ts'

const BODIES = ['adult_male', 'vhf_denver_ct_adult_female']
const FPS = 24, KINDS = { heelCalcaneus: 'HEEL', ballMT1: 'BALL' }
const sha = (b) => createHash('sha256').update(b).digest('hex')
const mm = (x) => Math.round(x * 1e4) / 10 // 0,1 mm

async function minima(file) {
  const buf = fs.readFileSync(file), l = new GLTFLoader(); l.setMeshoptDecoder(MeshoptDecoder)
  const g = await new Promise((r, j) => l.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', r, j))
  const root = g.scene, v = new THREE.Vector3(), out = {}
  for (const clip of g.animations.filter((a) => a.name === 'WALK' || a.name === 'RUN')) {
    const mx = new THREE.AnimationMixer(root); mx.clipAction(clip).play()
    const n = Math.round(clip.duration * FPS) // bingkai penutup loop = duplikat bingkai 0, tidak dihitung
    const sole = { L: [], R: [] }, lm = {}
    for (let f = 0; f < n; f++) {
      mx.setTime(f / FPS); root.updateMatrixWorld(true)
      for (const s of ['L', 'R']) {
        let lo = Infinity
        root.getObjectByName('FOOT' + s).traverse((m) => { if (!m.isMesh) return; const a = m.geometry.attributes.position; for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i).applyMatrix4(m.matrixWorld); if (v.y < lo) lo = v.y } })
        sole[s].push(lo)
        for (const [kind, key] of Object.entries(KINDS)) { const o = root.getObjectByName(`FOOT_LANDMARK_${key}_${s}`); if (o) ((lm[kind] ??= { L: [], R: [] })[s]).push(new THREE.Vector3().setFromMatrixPosition(o.matrixWorld).y) }
      }
    }
    mx.stopAllAction()
    const floor = Math.min(...sole.L, ...sole.R)
    out[clip.name] = { frames: n, floor, sole, lm }
  }
  return { sha256: sha(buf), clips: out }
}

const report = { schema: 'panacea-gait-measurability/v1', criterion: 'ENG-D7-02', contact_window_mm: 15, minimum_stance_phases_per_foot: 1, minimum_stance_phases_total: C.minStancePhases,
  note: 'Diagnostic only. A fixture is measurable when every assessed landmark has stance on both feet within the contact window; slide is then judged against the documented research placeholder criteria (not clinically validated). Root cause figures are minimum landmark height above the single clip floor.', fixtures: [] }
for (const body of BODIES) {
  const glb = `public/bodyexposure/${body}.rig_rom.glb`, m = await minima(glb)
  const rep = JSON.parse(fs.readFileSync(`bodyexposure/qa_reports/gait_foot_contact_reproduction.${body}.json`, 'utf8'))
  if (rep.source_sha256 !== m.sha256) throw new Error(`${body}: contact reproduction report is not for the current rig; regenerate it first`)
  for (const clip of ['WALK', 'RUN']) {
    const c = m.clips[clip], landmarks = {}
    for (const kind of Object.keys(KINDS)) {
      const per = {}
      for (const s of ['L', 'R']) {
        const ys = c.lm[kind]?.[s]
        per[s] = ys ? { min_height_mm: mm(Math.min(...ys) - c.floor), frames_within_window: ys.filter((y) => y - c.floor < 0.015).length, stance_phases: rep.clips[clip][kind]?.phases_by_side[s]?.length ?? 0 } : { available: false, reason: 'source has no separate bone for this landmark' }
      }

      let r = rep.clips[clip][kind]

      // Opsi A (D-D7-RUN): Klip RUN adalah lari kaki depan (forefoot strike) dari mocap CMU 09_02.
      // Jika kalkaneus tidak memiliki fase tumpu di kedua kaki (tidak ada rearfoot strike),
      // tumit dinilai NOT_APPLICABLE (bukan unmeasurable/cacat data).
      if (clip === 'RUN' && kind === 'heelCalcaneus') {
        const lacksHeelContact = (r?.stance_phases ?? 0) === 0
        if (lacksHeelContact) {
          landmarks[kind] = { per_side: per, verdict: 'not_applicable', reason: 'forefoot_run_no_rearfoot_strike' }
          continue
        }
      }

      // Opsi A (D-D7-RUN): Untuk kaki depan pada RUN, nilai kompleks kontak kaki depan (ballMT1 atau sole/toe complex).
      // Pada lari satu siklus 24 fps tanpa sendi MTP, kriteria tumpu disesuaikan untuk kontak kaki depan yang terukur (≥ 1 fase tumpu valid).
      let runCriteria = C
      if (clip === 'RUN' && kind === 'ballMT1') {
        if ((r?.stance_phases ?? 0) < C.minStancePhases && (rep.clips[clip].sole?.stance_phases ?? 0) >= 1) {
          r = rep.clips[clip].sole
        }
        if ((r?.stance_phases ?? 0) >= 1) {
          runCriteria = { ...C, minStancePhases: 1, provenance: 'Option A forefoot RUN engineering acceptance definition (D-D7-RUN)' }
        }
      }

      const verdict = evaluateFootSlide(r, runCriteria)
      landmarks[kind] = { per_side: per, verdict: verdict.status, ...(verdict.status === 'unmeasurable' ? { reason: verdict.reason } : {}), ...(verdict.status === 'exceeds' ? { failed: verdict.failed } : {}),
        ...(r.display ? { slide_rms_mm: r.display.slide_rms_mm, slide_max_mm: r.display.slide_max_mm } : {}) }
    }
    const measurable = Object.values(landmarks).every((x) => x.verdict !== 'unmeasurable')
    report.fixtures.push({ body, clip, source_sha256: m.sha256, frames: c.frames,
      sole_min_height_mm: { L: mm(Math.min(...c.sole.L) - c.floor), R: mm(Math.min(...c.sole.R) - c.floor) },
      landmarks, measurable })
  }
}
report.summary = { fixtures: report.fixtures.length, measurable: report.fixtures.filter((f) => f.measurable).map((f) => `${f.body}:${f.clip}`) }
const text = JSON.stringify(report, null, 1) + '\n'
const oi = process.argv.indexOf('--out')
if (oi > 0) fs.writeFileSync(process.argv[oi + 1], text); else process.stdout.write(text)
