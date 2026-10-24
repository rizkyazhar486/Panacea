// D7: reproduksi independen kontak kaki WALK/RUN dari GLB publik. Laporan yang dikomit harus identik dengan hasil jalan ulang
// skrip (deterministik), loop tertutup ditangani (fase melintasi jahitan terhitung SATU), dan vonis terhadap kriteria penelitian
// eksplisit dicatat apa adanya (tidak ada ambang yang disetel agar lulus).
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fitFootContact } from '../qa/foot-contact-math.mjs'
import { evaluateFootSlide, RESEARCH_FOOT_SLIDE_CRITERIA as C } from '../../src/domains/body-exposure/engine/gaitFootMetrics.ts'

// D7 (ENG-D7-01): data tidak terukur wajib berstatus 'unmeasurable' — memeriksa alasan saja tidak cukup, status 'within' dengan alasan tetap lolos.
const unmeasurable = (result: any, reason: string, msg?: string) => {
  assert.equal(result?.status, 'unmeasurable', `${msg ?? reason}: status harus unmeasurable, bukan ${result?.status}`)
  assert.equal(result.reason, reason, msg)
}

const BODIES = ['adult_male', 'vhf_denver_ct_adult_female'] as const
const regen = (b: string) => JSON.parse(execFileSync(process.execPath, ['scripts/qa/glb-foot-contact-reproduce.mjs', `public/bodyexposure/${b}.rig_rom.glb`], { encoding: 'utf8' }))
const committed = (b: string) => JSON.parse(fs.readFileSync(`bodyexposure/qa_reports/gait_foot_contact_reproduction.${b}.json`, 'utf8'))

for (const b of BODIES) {
  assert.equal(committed(b).schema, 'panacea-foot-contact/v2')
  assert.equal(committed(b).source_sha256, createHash('sha256').update(fs.readFileSync(`public/bodyexposure/${b}.rig_rom.glb`)).digest('hex'), 'source hash must identify the actual GLB')
  assert.deepEqual(regen(b), committed(b), `laporan ${b} tidak sama dengan hasil jalan ulang: jalankan skrip dengan --out`)
  assert.deepEqual(regen(b), regen(b), `jalan ulang ${b} tidak deterministik`)
}

const m = committed('adult_male'), f = committed('vhf_denver_ct_adult_female')
// loop tertutup: bingkai terakhir adalah duplikat dan dibuang (WALK 27 -> 26, RUN 19 -> 18)
for (const rep of [m, f]) {
  assert.equal(rep.clips.WALK.loop_closed_duplicate_end_frame_dropped, true, 'WALK: loop tertutup harus terdeteksi'); assert.equal(rep.clips.WALK.frames, 26, 'WALK: bingkai duplikat harus dibuang (27 -> 26)')
  assert.equal(rep.clips.RUN.loop_closed_duplicate_end_frame_dropped, true, 'RUN: loop tertutup harus terdeteksi'); assert.equal(rep.clips.RUN.frames, 18, 'RUN: bingkai duplikat harus dibuang (19 -> 18)')
}
// fase yang melintasi jahitan loop dihitung satu kali: jari WALK jantan = 2 fase (satu per kaki), bukan 3
assert.equal(m.clips.WALK.toe.stance_phases, 2, 'fase tumpu melintasi jahitan loop harus dihitung satu kali')
assert.deepEqual(m.clips.WALK.toe.phases_by_side, { L: ['22-25+0-9'], R: ['9-22'] }, 'fase kiri harus tersambung melintasi jahitan')
// penanda tumit tidak pernah menapak terhadap SATU lantai klip (laporan Blender lama menemukan 1 fase karena lantai per-penanda)
for (const rep of [m, f]) for (const clip of ['WALK', 'RUN']) assert.equal(rep.clips[clip].heel.stance_phases, 0, `tumit ${clip} tidak boleh punya fase tumpu`)

// Penanda PLANTAR (simpul terendah di seperempat posterior/anterior kaki pada pose awal) benar-benar menapak, tidak seperti simpul ekstrem
// yang berada setinggi pergelangan. Jantan WALK: dua fase tiap penanda, selip <= 16,6 mm; tumit lepas lebih dulu daripada jari (pola tumpu).
const hp = m.clips.WALK.heelPlantar, tp = m.clips.WALK.toePlantar
assert.equal(hp.stance_phases, 2, 'tumit plantar jantan: satu fase per kaki'); assert.equal(tp.stance_phases, 2, 'jari plantar jantan: satu fase per kaki')
assert.ok(hp.slide_max_mm <= 17 && tp.slide_max_mm <= 17, 'selip maks penanda plantar jantan <= 17 mm'); assert.ok(hp.slide_rms_mm < 9 && tp.slide_rms_mm < 9, 'RMS selip penanda plantar jantan < 9 mm')
assert.ok(hp.stance_frames < tp.stance_frames, 'tumit lepas sebelum jari (tumit menapak lebih singkat daripada jari)')
assert.deepEqual(hp.phases_by_side.L[0].split('+')[0], '22-25', 'tumpu kiri dimulai bingkai 22 (melintasi jahitan loop)')
// Betina (tulang CT tanpa jaringan telapak): penanda plantar tidak menapak, dan itu dicatat sebagai batasan geometri sumber, bukan dipalsukan.
assert.equal(f.clips.WALK.heelPlantar.stance_phases, 0); assert.equal(f.clips.WALK.toePlantar.stance_phases, 0)
assert.ok(f.clips.WALK.sole.stance_phases >= 1, 'betina: titik terendah kaki tetap menapak (kontak ada, hanya landmark yang tidak)')

// T-D7-02: landmark anatomis dari mesh tulang sumber. Tumit = simpul terendah kalkaneus; bola = kepala metatarsal I (tidak ada sendi
// jari, jadi ujung jari bukan pivot). Jantan WALK: kedua landmark punya satu fase per kaki; tumit lepas sebelum bola.
const hc = m.clips.WALK.heelCalcaneus, bm = m.clips.WALK.ballMT1
assert.deepEqual(hc.landmark.available_by_side, { L: true, R: true }); assert.deepEqual(bm.landmark.available_by_side, { L: true, R: true })
assert.equal(hc.stance_phases, 2, 'tumit kalkaneus jantan: satu fase per kaki'); assert.equal(bm.stance_phases, 2, 'bola MT1 jantan: satu fase per kaki')
assert.ok(hc.stance_frames < bm.stance_frames, 'tumit lepas sebelum bola kaki')
assert.ok(hc.slide_max_mm <= 17 && bm.slide_max_mm <= 17, 'selip maks landmark anatomis jantan <= 17 mm')
// kontrol silang: simpul terendah kalkaneus = penanda plantar posterior (dua definisi independen sepakat)
assert.deepEqual(hc.phases_by_side, m.clips.WALK.heelPlantar.phases_by_side)
// Betina (T-D7-04): tumit kalkaneus diturunkan dari pose WALK (bukan istirahat telentang), bola diturunkan dari kombinasi metatarsal+falang.
// WALK betina: kedua landmark punya fase tumpu di kedua kaki (terukur).
assert.deepEqual(f.clips.WALK.ballMT1.landmark.available_by_side, { L: true, R: true })
assert.equal(f.clips.WALK.ballMT1.stance_phases, 2)
assert.equal(f.clips.WALK.heelCalcaneus.stance_phases, 3)

// vonis terhadap kriteria penelitian (apa adanya)
const v = (rep: any, clip: string, k: string) => evaluateFootSlide(rep.clips[clip][k], C)
assert.deepEqual(v(m, 'WALK', 'toe'), { status: 'exceeds', criteria: C, failed: ['peak'] }, 'jari WALK jantan: RMS 12,6 <= 15 tetapi maks 32,2 > 30')
unmeasurable(v(m, 'WALK', 'heel'), 'no_stance')
assert.equal(v(m, 'WALK', 'heelPlantar').status, 'within', 'tumit plantar jantan: RMS 7,8 <= 15 dan maks 16,6 <= 30 (placeholder)')
assert.equal(v(m, 'WALK', 'toePlantar').status, 'within')
unmeasurable(v(f, 'WALK', 'heelPlantar'), 'no_stance')
unmeasurable(v(m, 'RUN', 'toe'), 'no_stance')
unmeasurable(v(m, 'RUN', 'sole'), 'too_few_phases', 'RUN hanya 1 fase tumpu pada definisi titik terendah')
unmeasurable(v(f, 'WALK', 'toe'), 'too_few_phases', 'betina: hanya kaki kanan (1 fase)')
assert.equal(v(m, 'WALK', 'heelCalcaneus').status, 'within'); assert.equal(v(m, 'WALK', 'ballMT1').status, 'within')
// betina WALK terukur: tumit melampaui batas selip (RMS 19,4 > 15), bola dalam batas selip (RMS 10,1 <= 15)
assert.equal(v(f, 'WALK', 'heelCalcaneus').status, 'exceeds')
assert.equal(v(f, 'WALK', 'ballMT1').status, 'within')
for (const k of ['heelCalcaneus', 'ballMT1']) unmeasurable(v(m, 'RUN', k), 'no_stance', `RUN jantan ${k}: tidak ada fase tumpu pada ambang 15 mm`)
unmeasurable(v(f, 'RUN', 'heelCalcaneus'), 'no_stance', 'RUN betina tumit: tidak ada fase tumpu')
unmeasurable(v(f, 'RUN', 'ballMT1'), 'too_few_phases', 'RUN betina bola: hanya 1 fase di kaki kanan')
// pasangan: hanya satu angka yang berbeda dari kasus yang melampaui -> dalam kriteria
assert.equal(evaluateFootSlide({ ...m.clips.WALK.toe, slide_max_mm: 30 }, C).status, 'within')
// definisi sol memakai simpul terendah yang berpindah-pindah antara tumit dan jari: selipnya tidak boleh dibaca sebagai selip nyata
assert.ok(m.clips.WALK.sole.slide_rms_mm > 4 * m.clips.WALK.toe.slide_rms_mm, 'sol lebih besar dari jari (derau pergantian simpul), dicatat sebagai batasan metode')
console.log('body-gait-foot-contact-reproduction: laporan = jalan ulang; loop tertutup dihitung benar; jari ekstrem WALK jantan melampaui maks 30 mm, penanda plantar jantan dalam kriteria (placeholder); RUN dan betina tidak terukur')

// Salinan GLB rusak tidak boleh menghasilkan laporan seolah pengukuran lengkap berhasil.
const scratch = fs.mkdtempSync(path.join(tmpdir(), 'panacea-foot-contact-'))
try {
  const original = fs.readFileSync('public/bodyexposure/adult_male.rig_rom.glb')
  const jsonLength = original.readUInt32LE(12)
  const rewrite = (mutate: (json: any) => void) => {
    const json = JSON.parse(original.subarray(20, 20 + jsonLength).toString('utf8')); mutate(json)
    const raw = Buffer.from(JSON.stringify(json)); const chunk = Buffer.alloc(Math.ceil(raw.length / 4) * 4, 32); raw.copy(chunk)
    const tail = original.subarray(20 + jsonLength), header = Buffer.from(original.subarray(0, 20))
    header.writeUInt32LE(20 + chunk.length + tail.length, 8); header.writeUInt32LE(chunk.length, 12)
    const file = path.join(scratch, 'mutated.glb'); fs.writeFileSync(file, Buffer.concat([header, chunk, tail])); return file
  }
  for (const [name, mutate, expected] of [
    ['missing RUN', (j: any) => { j.animations = j.animations.filter((a: any) => a.name !== 'RUN') }, /exactly one finite positive RUN/],
    ['missing WALK', (j: any) => { j.animations = j.animations.filter((a: any) => a.name !== 'WALK') }, /exactly one finite positive WALK/],
    ['duplicate RUN', (j: any) => { j.animations.push(j.animations.find((a: any) => a.name === 'RUN')) }, /exactly one finite positive RUN/],
    ['duplicate WALK', (j: any) => { j.animations.push(j.animations.find((a: any) => a.name === 'WALK')) }, /exactly one finite positive WALK/],
    ['missing foot', (j: any) => { j.nodes.find((n: any) => n.name === 'FOOT.L').name = 'NO_FOOT' }, /node FOOTL tidak ada/],
    ['missing pelvis', (j: any) => { j.nodes.find((n: any) => n.name === 'PELVIS').name = 'NO_PELVIS' }, /node PELVIS is required/],
    ['singular scale', (j: any) => { j.nodes.find((n: any) => n.name === 'FOOT.L').scale = [0, 0, 0] }, /invalid or reflected world transform/],
    ['reflected scale', (j: any) => { j.nodes.find((n: any) => n.name === 'FOOT.L').scale = [-1, 1, 1] }, /invalid or reflected world transform/],
  ] as const) {
    const file = rewrite(mutate)
    const result = spawnSync(process.execPath, ['scripts/qa/glb-foot-contact-reproduce.mjs', file], { encoding: 'utf8' })
    assert.notEqual(result.status, 0, `${name} must fail closed`); assert.match(result.stderr, expected, `${name} must identify its cause`)
    assert.equal(result.stdout, '', `${name} must not emit a success report`)
  }
  for (const value of ['NaN', 'Infinity', '0', '-1']) {
    const result = spawnSync(process.execPath, ['scripts/qa/glb-foot-contact-reproduce.mjs', 'public/bodyexposure/adult_male.rig_rom.glb', '--thresh-mm', value], { encoding: 'utf8' })
    assert.notEqual(result.status, 0); assert.match(result.stderr, /contact threshold must be finite and positive/)
  }
} finally { fs.rmSync(scratch, { recursive: true, force: true }) }

// Penerima acceptance harus memakai angka mentah: 30,04 mm terlihat sebagai 30,0 tetapi tetap melampaui 30.
const near = fitFootContact(Array.from({ length: 2 }, () => ({ t: [0, 1, 2], x: [0.01502, -0.03004, 0.01502] })))
const roundingCriteria = { ...C, maxRmsMm: 100 }
assert.equal(near.display?.slide_max_mm, 30)
assert.deepEqual(evaluateFootSlide(near, roundingCriteria), { status: 'exceeds', criteria: roundingCriteria, failed: ['peak'] })

console.log('D7 source identity, full replay, GLB mutations and raw acceptance regression: all passed')
